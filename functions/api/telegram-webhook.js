import {
  findChannelByToken,
  upsertConversation,
  recordIncomingMessage,
  recordProviderOutgoingMessage,
  updateChannel,
} from "./_social.js";

function telegramMessageKind(msg) {
  if (msg.photo) return "image";
  if (msg.video) return "video";
  if (msg.voice || msg.audio) return "audio";
  if (msg.document) return "file";
  if (msg.location) return "location";
  if (msg.contact) return "contact";
  return "text";
}

function telegramMessageBody(msg) {
  const text = String(msg.text || msg.caption || "").trim();
  if (text) return text;
  if (msg.contact) {
    return [msg.contact.first_name, msg.contact.last_name, msg.contact.phone_number]
      .filter(Boolean)
      .join(" ");
  }
  if (msg.location) return `${msg.location.latitude}, ${msg.location.longitude}`;
  return `[${telegramMessageKind(msg)}]`;
}

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
    const connection = update?.business_connection;
    if (connection?.id) {
      await updateChannel(env, channel.id, {
        status: connection.is_enabled ? "connected" : "disconnected",
        connection_type: "telegram_business",
        business_connection_id: String(connection.id),
        business_account_user_id: String(connection.user?.id || ""),
        display_name: [
          connection.user?.first_name,
          connection.user?.last_name,
        ].filter(Boolean).join(" ") || channel.display_name,
        last_error: "",
      });
      return Response.json({ ok: true });
    }

    const msg = update?.business_message
      || update?.edited_business_message
      || update?.message
      || update?.edited_message
      || update?.channel_post;
    if (!msg) return Response.json({ ok: true });

    const chatId = String(msg.chat?.id || "");
    if (!chatId) return Response.json({ ok: true });

    const isBusinessMessage = Boolean(msg.business_connection_id);
    const isBusinessOutbound = isBusinessMessage
      && String(msg.from?.id || "") === String(channel.business_account_user_id || "");
    const contactSource = isBusinessMessage ? msg.chat : msg.from;
    const contactName = [contactSource?.first_name, contactSource?.last_name].filter(Boolean).join(" ")
      || msg.chat?.title
      || chatId;
    const contactHandle = contactSource?.username ? `@${contactSource.username}` : null;

    const conversation = await upsertConversation(env, {
      channelId: channel.id,
      platform: "telegram",
      externalChatId: chatId,
      contactName,
      contactHandle,
      businessConnectionId: String(msg.business_connection_id || ""),
    });

    const messageData = {
      body: telegramMessageBody(msg),
      messageType: telegramMessageKind(msg),
      externalMessageId: String(msg.message_id || ""),
      createdAt: msg.date ? new Date(Number(msg.date) * 1000).toISOString() : undefined,
    };
    if (isBusinessOutbound) {
      await recordProviderOutgoingMessage(env, conversation, messageData);
    } else {
      await recordIncomingMessage(env, conversation, messageData);
    }

    // Optional: simple auto-reply so the contact knows a human will follow up.
    // Commented out by default - uncomment if you want an instant acknowledgement.
    // await telegramSendMessage(channel.access_token, chatId, "Rahmat! Tez orada javob beramiz.");

    return Response.json({ ok: true });
  } catch (err) {
    console.error("telegram_webhook_failed", String(err?.message || err));
    // Always 200 back to Telegram, otherwise it will keep retrying aggressively.
    return Response.json({ ok: true });
  }
}
