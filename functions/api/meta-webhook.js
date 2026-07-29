import {
  fetchMetaAdAttribution,
  fetchMetaLead,
  findChannelByAccount,
  findChannelByPlatform,
  findChannelByToken,
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

// Meta signs every webhook delivery with HMAC-SHA256 of the raw body, keyed
// with the app secret. Without this check the endpoint accepts anything:
// anyone could invent conversations, and because a manager's reply is sent
// with the business's real page token to whatever recipient id the payload
// named, that turns the CRM into an open relay. Fails closed - if
// META_APP_SECRET is not configured, no delivery is accepted.
async function verifyMetaSignature(env, request, rawBody) {
  const secret = String(env?.META_APP_SECRET || "").trim();
  if (!secret) return false;
  const header = String(request.headers.get("X-Hub-Signature-256") || "").trim();
  const match = /^sha256=([0-9a-f]{64})$/i.exec(header);
  if (!match) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(signed))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqualHex(expected, match[1].toLowerCase());
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
      // Route by the account the event names. Falling back to the newest
      // channel for the platform would attribute one page's messages to
      // another whenever two are connected.
      const channel = await findChannelByAccount(env, platform, entry?.id)
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

        const conversation = await upsertConversation(env, {
          channelId: channel.id,
          platform,
          externalChatId: contactId,
          contactName: contactId,
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
        const fromId = String(value.from?.id || "");
        const commentText = String(value.text || value.message || "").trim();
        if (!fromId || !commentText) continue;

        const conversation = await upsertConversation(env, {
          channelId: channel.id,
          platform,
          externalChatId: fromId,
          contactName: value.from?.username || value.from?.name || fromId,
          contactHandle: value.from?.username || "",
        });

        await recordIncomingMessage(env, conversation, {
          body: commentText,
          messageType: "comment",
          // Instagram's comments webhook uses `id`; some Page/feed payloads
          // use `comment_id`. Supporting both keeps provider retries
          // idempotent instead of duplicating the same comment in the inbox.
          externalMessageId: String(value.id || value.comment_id || ""),
        });
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
