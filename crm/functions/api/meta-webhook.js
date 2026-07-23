import { findChannelByPlatform, upsertConversation, recordIncomingMessage } from "./_social.js";

// Meta verifies the webhook once, on setup, with a GET request.
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token) return new Response("forbidden", { status: 403 });

  const fb = await findChannelByPlatform(env, "facebook");
  const ig = await findChannelByPlatform(env, "instagram");
  const matches = [fb, ig].some((c) => c && c.webhook_verify_token === token);
  if (!matches) return new Response("forbidden", { status: 403 });

  return new Response(challenge || "", { status: 200 });
}

// Meta calls this for every new message/comment once the app is approved and
// the webhook is subscribed in the Meta App dashboard.
export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const payload = await request.json();
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];

    for (const entry of entries) {
      const platform = payload.object === "instagram" ? "instagram" : "facebook";
      const channel = await findChannelByPlatform(env, platform);
      if (!channel) continue;

      const events = Array.isArray(entry.messaging) ? entry.messaging : [];
      for (const event of events) {
        const senderId = String(event.sender?.id || "");
        const text = String(event.message?.text || "").trim();
        if (!senderId || (!text && !event.message?.attachments)) continue;

        const conversation = await upsertConversation(env, {
          channelId: channel.id,
          platform,
          externalChatId: senderId,
          contactName: senderId,
        });

        await recordIncomingMessage(env, conversation, {
          body: text || "[media]",
          messageType: event.message?.attachments ? "image" : "text",
          externalMessageId: String(event.message?.mid || ""),
        });
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
  } catch {
    return Response.json({ ok: true });
  }
}
