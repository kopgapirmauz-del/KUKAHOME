import { findChannelByToken, upsertConversation, recordIncomingMessage } from "./_social.js";

// This endpoint is called directly by Telegram's servers, so it cannot use
// our normal session-based auth. Instead Telegram sends back the
// `secret_token` we registered via setWebhook in a header - only requests
// carrying the matching, per-channel secret are accepted.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const secretHeader = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
    if (!secretHeader) return new Response("forbidden", { status: 403 });

    const channel = await findChannelByToken(env, secretHeader);
    if (!channel || channel.platform !== "telegram" || channel.status !== "connected") {
      return new Response("forbidden", { status: 403 });
    }

    const update = await request.json();
    const msg = update?.message || update?.edited_message || update?.channel_post;
    if (!msg) return Response.json({ ok: true });

    const chatId = String(msg.chat?.id || "");
    if (!chatId) return Response.json({ ok: true });

    const contactName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ")
      || msg.chat?.title
      || chatId;
    const contactHandle = msg.from?.username ? `@${msg.from.username}` : null;

    const conversation = await upsertConversation(env, {
      channelId: channel.id,
      platform: "telegram",
      externalChatId: chatId,
      contactName,
      contactHandle,
    });

    const text = String(msg.text || msg.caption || "").trim();
    await recordIncomingMessage(env, conversation, {
      body: text || "[media]",
      messageType: msg.photo ? "image" : msg.document ? "file" : "text",
      externalMessageId: String(msg.message_id || ""),
    });

    // Optional: simple auto-reply so the contact knows a human will follow up.
    // Commented out by default - uncomment if you want an instant acknowledgement.
    // await telegramSendMessage(channel.access_token, chatId, "Rahmat! Tez orada javob beramiz.");

    return Response.json({ ok: true });
  } catch {
    // Always 200 back to Telegram, otherwise it will keep retrying aggressively.
    return Response.json({ ok: true });
  }
}
