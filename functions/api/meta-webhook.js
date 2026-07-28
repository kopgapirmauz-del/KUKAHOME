import {
  findChannelByAccount,
  findChannelByPlatform,
  findChannelByToken,
  upsertConversation,
  recordIncomingMessage,
  recordProviderOutgoingMessage,
  updateChannel,
} from "./_social.js";

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

// Meta verifies the webhook once, on setup, with a GET request.
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token) return new Response("forbidden", { status: 403 });

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
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
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
          contactName: value.from?.name || fromId,
        });

        await recordIncomingMessage(env, conversation, {
          body: commentText,
          messageType: "comment",
          externalMessageId: String(value.comment_id || ""),
        });
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("meta_webhook_failed", String(err?.message || err));
    return Response.json({ ok: true });
  }
}
