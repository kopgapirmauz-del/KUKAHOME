import { restRequest, first } from "./_supabase.js";

export async function getChannel(env, id) {
  const rows = await restRequest(env, "social_channels", {
    query: { select: "*", id: `eq.${id}`, limit: "1" },
  });
  return first(rows);
}

export async function findChannelByPlatform(env, platform) {
  const rows = await restRequest(env, "social_channels", {
    query: { select: "*", platform: `eq.${platform}`, order: "created_at.desc", limit: "1" },
  });
  return first(rows);
}

export async function findChannelByToken(env, webhookToken) {
  const rows = await restRequest(env, "social_channels", {
    query: { select: "*", webhook_verify_token: `eq.${webhookToken}`, limit: "1" },
  });
  return first(rows);
}

function randomToken() {
  return crypto.randomUUID().replace(/-/g, "");
}
export { randomToken };

// ---------------------------------------------------------------------------
// Telegram Bot API
// ---------------------------------------------------------------------------
export async function telegramCall(botToken, method, params) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  });
  const data = await res.json().catch(() => null);
  if (!data?.ok) throw new Error(data?.description || `telegram_${method}_failed`);
  return data.result;
}

export async function telegramSetWebhook(botToken, webhookUrl, secretToken) {
  return telegramCall(botToken, "setWebhook", {
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ["message", "edited_message", "channel_post"],
  });
}

export async function telegramSendMessage(botToken, chatId, text) {
  return telegramCall(botToken, "sendMessage", { chat_id: chatId, text });
}

// ---------------------------------------------------------------------------
// Meta (Facebook Messenger / Instagram Messaging) - Graph API
// Ready to use as soon as a valid Page Access Token is stored; actual message
// delivery depends on Meta having approved the required permissions and the
// webhook subscription being configured on the Meta App dashboard.
// ---------------------------------------------------------------------------
const GRAPH_VERSION = "v21.0";

export async function metaSendMessage(pageAccessToken, recipientId, text) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });
  const data = await res.json().catch(() => null);
  if (data?.error) throw new Error(data.error.message || "meta_send_failed");
  return data;
}

// ---------------------------------------------------------------------------
// Shared conversation/message upsert used by all channel webhooks.
// ---------------------------------------------------------------------------
export async function upsertConversation(env, { channelId, platform, externalChatId, contactName, contactHandle }) {
  const existing = await restRequest(env, "conversations", {
    query: {
      select: "*",
      channel_id: `eq.${channelId}`,
      external_chat_id: `eq.${externalChatId}`,
      limit: "1",
    },
  }).then(first);

  if (existing) {
    if (contactName && contactName !== existing.contact_name) {
      await restRequest(env, `conversations?id=eq.${existing.id}`, {
        method: "PATCH",
        body: { contact_name: contactName },
      });
    }
    return existing;
  }

  const inserted = await restRequest(env, "conversations", {
    method: "POST",
    body: {
      channel_id: channelId,
      platform,
      external_chat_id: externalChatId,
      contact_name: contactName || externalChatId,
      contact_handle: contactHandle || null,
      status: "new",
    },
    prefer: "return=representation",
  });
  return first(inserted);
}

export async function recordIncomingMessage(env, conversation, { body, messageType = "text", externalMessageId, attachmentUrl }) {
  await restRequest(env, "messages", {
    method: "POST",
    body: {
      conversation_id: conversation.id,
      direction: "in",
      sender_type: "contact",
      message_type: messageType,
      body: body || "",
      attachment_url: attachmentUrl || null,
      external_message_id: externalMessageId || null,
    },
  });

  await restRequest(env, `conversations?id=eq.${conversation.id}`, {
    method: "PATCH",
    body: {
      status: conversation.status === "closed" ? "open" : conversation.status === "new" ? "new" : "open",
      last_message_at: new Date().toISOString(),
      last_message_preview: String(body || "").slice(0, 140),
      unread_count: Number(conversation.unread_count || 0) + 1,
    },
  });
}
