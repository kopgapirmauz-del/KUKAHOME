import {
  fetchMetaAdAttribution,
  fetchMetaContactProfile,
  fetchMetaLead,
  fetchWhatsappMediaUrl,
  findChannelByAccount,
  findChannelByPlatform,
  findChannelByToken,
  findSoleConnectedChannel,
  metaProfileDisplayName,
  upsertConversation,
  recordIncomingMessage,
  recordProviderOutgoingMessage,
  updateChannel,
} from "./_social.js";
import { first, restRequest } from "./_supabase.js";
import { ensurePipelineItem } from "./pipeline.js";

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Hex(secret, rawBody) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return Array.from(new Uint8Array(signed))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Meta signs every webhook delivery with HMAC-SHA256 of the raw body, keyed
// with the app secret. Without this check the endpoint accepts anything:
// anyone could invent conversations, and because a manager's reply is sent
// with the business's real page token to whatever recipient id the payload
// named, that turns the CRM into an open relay. Fails closed - if neither
// secret is configured, no delivery is accepted.
//
// Facebook Messenger/Page deliveries are signed with the parent app's own
// secret (META_APP_SECRET), but Instagram deliveries go through the
// separate "Business-IG" sub-app used for Instagram Business Login and are
// signed with ITS secret (META_INSTAGRAM_APP_SECRET) instead - both apps
// share this one webhook endpoint, so both secrets have to be tried.
async function verifyMetaSignature(env, request, rawBody) {
  const secrets = [env?.META_APP_SECRET, env?.META_INSTAGRAM_APP_SECRET]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (!secrets.length) return false;
  const header = String(request.headers.get("X-Hub-Signature-256") || "").trim();
  const match = /^sha256=([0-9a-f]{64})$/i.exec(header);
  if (!match) return false;
  const provided = match[1].toLowerCase();
  for (const secret of secrets) {
    const expected = await hmacSha256Hex(secret, rawBody);
    if (timingSafeEqualHex(expected, provided)) return true;
  }
  return false;
}

function leadFields(fieldData) {
  const result = {};
  for (const field of Array.isArray(fieldData) ? fieldData : []) {
    const key = String(field?.name || "").trim().toLowerCase();
    const value = Array.isArray(field?.values) ? String(field.values[0] || "").trim() : "";
    if (key && value) result[key] = value;
  }
  return result;
}

function pickLeadField(fields, names) {
  for (const name of names) {
    const value = String(fields[name] || "").trim();
    if (value) return value;
  }
  return "";
}

function leadName(fields) {
  const fullName = pickLeadField(fields, ["full_name", "name"]);
  if (fullName) return fullName;
  return [
    pickLeadField(fields, ["first_name"]),
    pickLeadField(fields, ["last_name"]),
  ].filter(Boolean).join(" ").trim();
}

function leadMarker(leadgenId) {
  const safeId = String(leadgenId || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 120);
  return `Meta lead ID: ${safeId || "unknown"}`;
}

function leadNote(leadgenId, lead, attribution) {
  const answers = (Array.isArray(lead?.field_data) ? lead.field_data : [])
    .map((field) => {
      const label = String(field?.name || "").trim();
      const value = Array.isArray(field?.values) ? field.values.join(", ") : "";
      return label && value ? `${label}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
  return [
    "Meta Ads orqali avtomatik tushdi",
    leadMarker(leadgenId),
    attribution?.campaign?.name ? `Kampaniya: ${attribution.campaign.name}` : "",
    attribution?.adset?.name ? `Ad set: ${attribution.adset.name}` : "",
    attribution?.name ? `Reklama: ${attribution.name}` : "",
    answers,
  ].filter(Boolean).join("\n").slice(0, 4000);
}

function stableIndex(value, length) {
  if (!length) return -1;
  let hash = 2166136261;
  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

async function resolveLeadManager(env, channel, leadgenId) {
  const managers = await restRequest(env, "users", {
    query: {
      select: "id",
      role: "eq.manager",
      order: "id.asc",
    },
  });
  const managerIds = (Array.isArray(managers) ? managers : [])
    .map((manager) => String(manager?.id || "").trim())
    .filter(Boolean);
  const connectedBy = String(channel?.connected_by || "").trim();
  if (connectedBy && managerIds.includes(connectedBy)) return connectedBy;
  const index = stableIndex(`${channel?.external_account_id || ""}:${leadgenId}`, managerIds.length);
  return index >= 0 ? managerIds[index] : connectedBy || null;
}

async function findPreviouslyCreatedLeadClient(env, leadgenId) {
  const marker = leadMarker(leadgenId);
  const rows = await restRequest(env, "clients", {
    query: {
      select: "id",
      note: `like.*${marker}*`,
      order: "created_at.asc",
      limit: "1",
    },
  });
  return first(rows);
}

async function patchAdLead(env, leadgenId, body) {
  await restRequest(env, "meta_ad_leads", {
    method: "PATCH",
    query: { leadgen_id: `eq.${leadgenId}` },
    body: { ...body, updated_at: new Date().toISOString() },
  });
}

async function ingestMetaAdLead(env, channel, value) {
  const leadgenId = String(value?.leadgen_id || "").trim();
  if (!leadgenId) return;
  const reserved = await restRequest(env, "meta_ad_leads", {
    method: "POST",
    body: {
      leadgen_id: leadgenId,
      page_id: String(value?.page_id || channel.external_account_id || ""),
      form_id: String(value?.form_id || "") || null,
      ad_id: String(value?.ad_id || "") || null,
      processing_status: "processing",
    },
    prefer: "resolution=ignore-duplicates,return=representation",
  });
  let tracking = first(reserved);
  const isRetry = !tracking;
  if (!tracking) {
    tracking = await restRequest(env, "meta_ad_leads", {
      query: { select: "*", leadgen_id: `eq.${leadgenId}`, limit: "1" },
    }).then(first);
    if (!tracking || tracking.processing_status === "completed") return;
    const updatedAt = Date.parse(tracking.updated_at || tracking.created_at || "");
    if (
      tracking.processing_status === "processing"
      && Number.isFinite(updatedAt)
      && Date.now() - updatedAt < 2 * 60 * 1000
    ) return;
    await patchAdLead(env, leadgenId, { processing_status: "processing", last_error: "" });
  }

  try {
    const lead = await fetchMetaLead(env, channel, leadgenId);
    const attribution = await fetchMetaAdAttribution(env, channel, lead.ad_id || value?.ad_id);
    const fields = leadFields(lead.field_data);
    const fullName = leadName(fields);
    const phone = pickLeadField(fields, ["phone_number", "phone", "mobile_phone"]);
    const email = pickLeadField(fields, ["email"]);
    const note = leadNote(leadgenId, lead, attribution);
    await patchAdLead(env, leadgenId, {
      page_id: String(value?.page_id || channel.external_account_id || ""),
      form_id: String(lead.form_id || value?.form_id || "") || null,
      ad_id: String(lead.ad_id || value?.ad_id || "") || null,
      ad_name: String(attribution?.name || ""),
      adset_id: String(attribution?.adset?.id || "") || null,
      adset_name: String(attribution?.adset?.name || ""),
      campaign_id: String(attribution?.campaign?.id || "") || null,
      campaign_name: String(attribution?.campaign?.name || ""),
      full_name: fullName,
      phone,
      email,
      field_data: Array.isArray(lead.field_data) ? lead.field_data : [],
      provider_created_at: lead.created_time || null,
    });

    let clientId = String(tracking?.client_id || "");
    if (!clientId) {
      // If the client insert succeeded but the following tracking PATCH was
      // interrupted, a provider retry must recover that row instead of
      // creating the same customer twice.
      const recovered = isRetry
        ? await findPreviouslyCreatedLeadClient(env, leadgenId)
        : null;
      clientId = String(recovered?.id || "");
      if (!clientId) {
        const managerId = await resolveLeadManager(env, channel, leadgenId);
        const created = await restRequest(env, "clients", {
          method: "POST",
          body: {
            date: String(lead.created_time || new Date().toISOString()).slice(0, 10),
            manager_id: managerId,
            phone: phone || email || fullName || `Meta lead ${leadgenId}`,
            source: "meta_ads",
            interest: String(attribution?.name || attribution?.campaign?.name || "Meta reklama lead").slice(0, 500),
            note,
            status: "yellow",
            price: 0,
            currency: "UZS",
            result: "",
          },
          prefer: "return=representation",
        });
        clientId = String(first(created)?.id || "");
        if (!clientId) throw new Error("meta_lead_client_create_failed");
      }
      await patchAdLead(env, leadgenId, { client_id: clientId });
    }
    await ensurePipelineItem(env, clientId, {
      stage: "new",
      temperature: "hot",
      note,
      updatedBy: "Meta Ads",
    });
    await patchAdLead(env, leadgenId, { processing_status: "completed", last_error: "" });
  } catch (error) {
    await patchAdLead(env, leadgenId, {
      processing_status: "error",
      last_error: String(error?.message || "meta_lead_ingestion_failed").slice(0, 500),
    }).catch(() => {});
    throw error;
  }
}

// WhatsApp Cloud API delivery.
//
// value.metadata.phone_number_id names the business number the message was
// sent to, which is exactly what the channel is keyed on. value.contacts
// carries the sender's WhatsApp profile name, so unlike Messenger there is no
// extra profile lookup to do. Statuses (delivered/read receipts) arrive on the
// same field and are ignored - they are not messages.
async function ingestWhatsappChange(env, value) {
  const phoneNumberId = String(value?.metadata?.phone_number_id || "").trim();
  const messages = Array.isArray(value?.messages) ? value.messages : [];
  if (!messages.length) return;

  const channel = await findChannelByAccount(env, "whatsapp", phoneNumberId)
    || await findSoleConnectedChannel(env, "whatsapp");
  if (!channel || channel.status === "disconnected") return;
  if (channel.status === "pending") {
    await updateChannel(env, channel.id, { status: "connected", last_error: "" });
  }

  const namesByWaId = new Map(
    (Array.isArray(value?.contacts) ? value.contacts : [])
      .map((contact) => [String(contact?.wa_id || ""), String(contact?.profile?.name || "")]),
  );

  for (const message of messages) {
    const from = String(message?.from || "").trim();
    if (!from) continue;

    // Text lives in a different property per message type, and media is
    // delivered as an id that has to be resolved to a URL separately.
    const type = String(message?.type || "text");
    let body = "";
    let attachmentUrl = null;
    let messageType = "text";
    if (type === "text") {
      body = String(message?.text?.body || "");
    } else if (type === "button") {
      body = String(message?.button?.text || "");
    } else if (type === "interactive") {
      body = String(
        message?.interactive?.button_reply?.title
        || message?.interactive?.list_reply?.title
        || "",
      );
    } else if (type === "location") {
      const loc = message?.location || {};
      body = `📍 ${loc.latitude}, ${loc.longitude}`;
    } else if (["image", "document", "audio", "video", "sticker"].includes(type)) {
      const media = message[type] || {};
      body = String(media.caption || "");
      messageType = type === "image" || type === "sticker" ? "image" : "file";
      attachmentUrl = (await fetchWhatsappMediaUrl(env, channel, media.id)) || null;
    } else {
      body = `[${type}]`;
    }
    if (!body && !attachmentUrl) continue;

    const conversation = await upsertConversation(env, {
      channelId: channel.id,
      platform: "whatsapp",
      externalChatId: from,
      contactName: namesByWaId.get(from) || "",
      // The number itself is the most useful handle a manager can act on.
      contactHandle: `+${from}`,
      threadType: "dm",
    });

    await recordIncomingMessage(env, conversation, {
      body: body || "[media]",
      messageType,
      externalMessageId: String(message?.id || ""),
      attachmentUrl,
      createdAt: message?.timestamp
        ? new Date(Number(message.timestamp) * 1000).toISOString()
        : undefined,
    });
  }
}

// Meta verifies the webhook once, on setup, with a GET request.
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token) return new Response("forbidden", { status: 403 });

  const configuredToken = String(env?.META_WEBHOOK_VERIFY_TOKEN || "").trim();
  if (configuredToken && token === configuredToken) {
    return new Response(challenge || "", { status: 200 });
  }

  const channel = await findChannelByToken(env, token);
  if (
    !channel
    || channel.status === "disconnected"
    || !["facebook", "instagram"].includes(channel.platform)
  ) {
    return new Response("forbidden", { status: 403 });
  }
  await updateChannel(env, channel.id, {
    status: "connected",
    last_error: "",
    health_checked_at: new Date().toISOString(),
  });

  return new Response(challenge || "", { status: 200 });
}

// Meta calls this for every new message/comment once the app is approved and
// the webhook is subscribed in the Meta App dashboard.
export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    // The signature covers the exact bytes Meta sent, so the body must be read
    // as text and verified before it is parsed or trusted.
    const rawBody = await request.text();
    if (!(await verifyMetaSignature(env, request, rawBody))) {
      return new Response("forbidden", { status: 403 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("bad request", { status: 400 });
    }
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];

    // WhatsApp Cloud API shares this endpoint but has a completely different
    // payload shape (changes[].value.messages, addressed by phone number id
    // rather than entry.id), so it is handled on its own path.
    if (payload?.object === "whatsapp_business_account") {
      for (const entry of entries) {
        for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
          if (change?.field !== "messages") continue;
          await ingestWhatsappChange(env, change.value || {});
        }
      }
      return Response.json({ ok: true });
    }

    for (const entry of entries) {
      const platform = payload.object === "instagram" ? "instagram" : "facebook";
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      const leadgenChanges = changes.filter((change) => change?.field === "leadgen");
      if (leadgenChanges.length) {
        const leadChannel = await findChannelByAccount(env, "meta_ads", entry?.id);
        if (leadChannel && leadChannel.status !== "disconnected") {
          for (const change of leadgenChanges) {
            await ingestMetaAdLead(env, leadChannel, change.value || {});
          }
        }
      }
      // Route by the account the event names. If that id doesn't match any
      // stored channel (Instagram sends inconsistent id formats between its
      // OAuth response and its webhook payloads), fall back to the sole
      // connected channel for the platform - safe only when there's exactly
      // one, since with two or more it would risk attributing one account's
      // messages to another.
      const channel = await findChannelByAccount(env, platform, entry?.id)
        || await findSoleConnectedChannel(env, platform)
        || (entry?.id ? null : await findChannelByPlatform(env, platform));
      if (!channel) continue;
      if (channel.status === "disconnected") continue;
      if (channel.status === "pending") {
        await updateChannel(env, channel.id, { status: "connected", last_error: "" });
      }

      const events = Array.isArray(entry.messaging) ? entry.messaging : [];
      for (const event of events) {
        const isEcho = Boolean(
          event.message?.is_echo
          || event.is_self
          || String(event.sender?.id || "") === String(entry?.id || ""),
        );
        const contactId = String((isEcho ? event.recipient?.id : event.sender?.id) || "");
        const text = String(event.message?.text || "").trim();
        const attachments = Array.isArray(event.message?.attachments) ? event.message.attachments : [];
        if (!contactId || (!text && !attachments.length)) continue;
        const firstAttachment = attachments[0] || {};
        const attachmentUrl = String(firstAttachment?.payload?.url || "").trim() || null;
        const messageType = String(firstAttachment?.type || "text").toLowerCase();

        const profile = await fetchMetaContactProfile(env, channel, contactId);
        const contactName = metaProfileDisplayName(profile);

        const conversation = await upsertConversation(env, {
          channelId: channel.id,
          platform,
          externalChatId: contactId,
          contactName,
          contactHandle: profile?.username || "",
          threadType: "dm",
          metaAdId: String(event.referral?.ad_id || ""),
          metaReferralSource: String(event.referral?.source || ""),
          metaReferralUrl: String(event.referral?.ref || event.referral?.referer_uri || ""),
        });

        const messageData = {
          body: text || "[media]",
          messageType,
          externalMessageId: String(event.message?.mid || ""),
          attachmentUrl,
          createdAt: event.timestamp ? new Date(Number(event.timestamp)).toISOString() : undefined,
        };
        if (isEcho) {
          await recordProviderOutgoingMessage(env, conversation, messageData);
        } else {
          await recordIncomingMessage(env, conversation, messageData);
        }
      }

      // Instagram/Facebook comments arrive under entry.changes instead of entry.messaging.
      for (const change of changes) {
        if (change.field !== "comments" && change.field !== "feed") continue;
        const value = change.value || {};
        // Page "feed" fires for likes, shares and edits too - only an added
        // comment is something a manager can answer.
        if (change.field === "feed" && value.item && value.item !== "comment") continue;
        if (change.field === "feed" && value.verb && !["add", "edited"].includes(String(value.verb))) continue;
        const fromId = String(value.from?.id || "");
        const commentText = String(value.text || value.message || "").trim();
        if (!fromId || !commentText) continue;

        const commentId = String(value.id || value.comment_id || "");
        const isOwnComment = fromId === String(entry?.id || "")
          || fromId === String(channel.external_account_id || "");

        // Comments live in their own thread. Keyed on the same sender id they
        // used to merge into that person's DM thread, which made a public
        // question look like a private one - and a reply then went out as a
        // direct message instead of appearing under the post.
        const conversation = await upsertConversation(env, {
          channelId: channel.id,
          platform,
          externalChatId: `comment:${fromId}`,
          contactName: value.from?.name || value.from?.username || "",
          contactHandle: value.from?.username || "",
          threadType: "comment",
        });

        const commentData = {
          body: commentText,
          messageType: "comment",
          // Instagram's comments webhook uses `id`; some Page/feed payloads
          // use `comment_id`. Supporting both keeps provider retries
          // idempotent instead of duplicating the same comment in the inbox.
          externalMessageId: commentId,
          createdAt: value.created_time
            ? new Date(Number(value.created_time) * 1000).toISOString()
            : undefined,
        };
        // A reply the business posted from Instagram/Facebook itself comes
        // back through this same webhook; recording it as inbound would mark
        // the thread unread and make our own answer look like a customer's.
        if (isOwnComment) {
          await recordProviderOutgoingMessage(env, conversation, commentData);
        } else {
          await recordIncomingMessage(env, conversation, commentData);
        }
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("meta_webhook_failed", String(err?.message || err));
    // A non-2xx response asks Meta to retry. Message writes and lead
    // reservations are idempotent, so retrying is safer than acknowledging a
    // lead that never reached the client list or sales pipeline.
    return Response.json({ ok: false }, { status: 500 });
  }
}
