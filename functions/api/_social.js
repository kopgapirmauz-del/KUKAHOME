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

export async function updateChannel(env, id, patch) {
  const channelId = String(id || "").trim();
  if (!channelId) return null;
  const rows = await restRequest(env, "social_channels", {
    method: "PATCH",
    query: { id: `eq.${channelId}` },
    body: {
      ...(patch || {}),
      updated_at: new Date().toISOString(),
    },
    prefer: "return=representation",
  });
  return first(rows);
}

// Meta delivers the page/account id as entry.id. Resolving the channel by that
// id routes each event to the account it actually belongs to, instead of
// assuming the most recently connected channel for the platform.
export async function findChannelByAccount(env, platform, externalAccountId) {
  const account = String(externalAccountId || "").trim();
  if (!account) return null;
  const rows = await restRequest(env, "social_channels", {
    query: {
      select: "*",
      platform: `eq.${platform}`,
      external_account_id: `eq.${account}`,
      limit: "1",
    },
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
    allowed_updates: [
      "message",
      "edited_message",
      "channel_post",
      "business_connection",
      "business_message",
      "edited_business_message",
      "deleted_business_messages",
    ],
  });
}

export async function telegramSendMessage(botToken, chatId, text, businessConnectionId = "") {
  const params = { chat_id: chatId, text };
  if (businessConnectionId) params.business_connection_id = businessConnectionId;
  return telegramCall(botToken, "sendMessage", params);
}

// Telegram fetches the photo/document itself from the given https URL, no
// multipart upload needed on our side.
export async function telegramSendPhoto(botToken, chatId, photoUrl, caption = "", businessConnectionId = "") {
  const params = { chat_id: chatId, photo: photoUrl };
  if (caption) params.caption = caption;
  if (businessConnectionId) params.business_connection_id = businessConnectionId;
  return telegramCall(botToken, "sendPhoto", params);
}

export async function telegramSendDocument(botToken, chatId, fileUrl, caption = "", businessConnectionId = "") {
  const params = { chat_id: chatId, document: fileUrl };
  if (caption) params.caption = caption;
  if (businessConnectionId) params.business_connection_id = businessConnectionId;
  return telegramCall(botToken, "sendDocument", params);
}

export async function telegramMarkRead(botToken, businessConnectionId, chatId, messageId) {
  if (!businessConnectionId || !chatId || !messageId) return null;
  return telegramCall(botToken, "readBusinessMessage", {
    business_connection_id: businessConnectionId,
    chat_id: chatId,
    message_id: messageId,
  });
}

// ---------------------------------------------------------------------------
// Meta (Facebook Messenger / Instagram Messaging) - Graph API
// Ready to use as soon as a valid Page Access Token is stored; actual message
// delivery depends on Meta having approved the required permissions and the
// webhook subscription being configured on the Meta App dashboard.
// ---------------------------------------------------------------------------
function metaGraphVersion(env) {
  const configured = String(env?.META_GRAPH_VERSION || "").trim();
  return /^v\d+\.\d+$/.test(configured) ? configured : "v25.0";
}

async function metaGraphRequest(env, channel, path, options = {}) {
  const token = String(channel?.access_token || "").trim();
  if (!token) throw new Error("missing_access_token");
  const host = channel.platform === "instagram" ? "graph.instagram.com" : "graph.facebook.com";
  const url = new URL(`https://${host}/${metaGraphVersion(env)}/${String(path || "").replace(/^\/+/, "")}`);
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    const error = new Error(data?.error?.message || `meta_request_failed_${res.status}`);
    error.code = data?.error?.code || "";
    error.subcode = data?.error?.error_subcode || "";
    throw error;
  }
  return data;
}

export async function validateAndSubscribeMetaChannel(env, channel) {
  const accountId = String(channel?.external_account_id || "").trim();
  if (!accountId) throw new Error("missing_account_id");
  const profile = await metaGraphRequest(
    env,
    channel,
    `${encodeURIComponent(accountId)}?fields=id,name,username`,
  );
  const subscribedFields = channel.platform === "instagram"
    ? ["messages", "messaging_postbacks", "messaging_seen", "message_reactions", "comments"]
    : ["messages", "messaging_postbacks", "messaging_feedback", "feed"];
  const subscription = await metaGraphRequest(
    env,
    channel,
    `${encodeURIComponent(accountId)}/subscribed_apps`,
    { method: "POST", body: { subscribed_fields: subscribedFields } },
  );
  if (subscription?.success !== true) throw new Error("meta_subscription_failed");
  return { profile, subscribedFields };
}

export async function validateAndSubscribeMetaLeadPage(env, channel) {
  const accountId = String(channel?.external_account_id || "").trim();
  if (!accountId) throw new Error("missing_account_id");
  const profile = await metaGraphRequest(
    env,
    { ...channel, platform: "facebook" },
    `${encodeURIComponent(accountId)}?fields=id,name`,
  );
  const subscribedFields = ["leadgen"];
  const subscription = await metaGraphRequest(
    env,
    { ...channel, platform: "facebook" },
    `${encodeURIComponent(accountId)}/subscribed_apps`,
    { method: "POST", body: { subscribed_fields: subscribedFields } },
  );
  if (subscription?.success !== true) throw new Error("meta_leadgen_subscription_failed");
  return { profile, subscribedFields };
}

export async function fetchMetaLead(env, channel, leadgenId) {
  const id = String(leadgenId || "").trim();
  if (!id) throw new Error("missing_leadgen_id");
  return metaGraphRequest(
    env,
    { ...channel, platform: "facebook" },
    `${encodeURIComponent(id)}?fields=id,created_time,ad_id,form_id,field_data`,
  );
}

export async function fetchMetaAdAttribution(env, channel, adId) {
  const id = String(adId || "").trim();
  if (!id) return null;
  try {
    return await metaGraphRequest(
      env,
      { ...channel, platform: "facebook" },
      `${encodeURIComponent(id)}?fields=id,name,adset{id,name},campaign{id,name}`,
    );
  } catch {
    return null;
  }
}

async function ensureFreshInstagramChannel(env, channel) {
  if (channel?.platform !== "instagram" || !channel?.access_token) return channel;
  const expiresAt = channel.token_expires_at ? new Date(channel.token_expires_at).getTime() : 0;
  if (!expiresAt) return channel;
  const refreshThreshold = Date.now() + (7 * 24 * 60 * 60 * 1000);
  if (expiresAt > refreshThreshold) return channel;

  const refreshUrl = new URL("https://graph.instagram.com/refresh_access_token");
  refreshUrl.searchParams.set("grant_type", "ig_refresh_token");
  refreshUrl.searchParams.set("access_token", channel.access_token);
  const response = await fetch(refreshUrl, { method: "GET" });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error || !data?.access_token) {
    if (expiresAt > Date.now()) return channel;
    throw new Error(data?.error?.message || "instagram_token_refresh_failed");
  }

  const updated = await updateChannel(env, channel.id, {
    access_token: String(data.access_token),
    token_expires_at: data.expires_in
      ? new Date(Date.now() + (Number(data.expires_in) * 1000)).toISOString()
      : channel.token_expires_at,
    health_checked_at: new Date().toISOString(),
    last_error: "",
  });
  return updated || { ...channel, access_token: String(data.access_token) };
}

export async function metaSendMessage(env, channel, recipientId, text) {
  const readyChannel = await ensureFreshInstagramChannel(env, channel);
  const token = String(readyChannel?.access_token || "").trim();
  const accountId = String(readyChannel?.external_account_id || "").trim();
  if (!token || !accountId) throw new Error("channel_not_connected");
  const senderId = readyChannel.platform === "instagram" ? accountId : "me";
  return metaGraphRequest(env, readyChannel, `${encodeURIComponent(senderId)}/messages`, {
    method: "POST",
    body: { recipient: { id: recipientId }, message: { text } },
  });
}

// attachmentType is "image" or "file" - Meta fetches the URL itself, same as
// the Telegram photo/document senders above.
export async function metaSendAttachment(env, channel, recipientId, attachmentType, url) {
  const readyChannel = await ensureFreshInstagramChannel(env, channel);
  const token = String(readyChannel?.access_token || "").trim();
  const accountId = String(readyChannel?.external_account_id || "").trim();
  if (!token || !accountId) throw new Error("channel_not_connected");
  const senderId = readyChannel.platform === "instagram" ? accountId : "me";
  return metaGraphRequest(env, readyChannel, `${encodeURIComponent(senderId)}/messages`, {
    method: "POST",
    body: {
      recipient: { id: recipientId },
      message: { attachment: { type: attachmentType, payload: { url, is_reusable: true } } },
    },
  });
}

// ---------------------------------------------------------------------------
// Shared conversation/message upsert used by all channel webhooks.
// ---------------------------------------------------------------------------
export async function upsertConversation(env, {
  channelId,
  platform,
  externalChatId,
  contactName,
  contactHandle,
  businessConnectionId,
  metaAdId,
  metaReferralSource,
  metaReferralUrl,
}) {
  const existing = await restRequest(env, "conversations", {
    query: {
      select: "*",
      channel_id: `eq.${channelId}`,
      external_chat_id: `eq.${externalChatId}`,
      limit: "1",
    },
  }).then(first);

  if (existing) {
    const patch = {};
    if (contactName && contactName !== existing.contact_name) {
      patch.contact_name = contactName;
    }
    if (contactHandle && contactHandle !== existing.contact_handle) {
      patch.contact_handle = contactHandle;
    }
    if (businessConnectionId && businessConnectionId !== existing.business_connection_id) {
      patch.business_connection_id = businessConnectionId;
    }
    if (metaAdId && metaAdId !== existing.meta_ad_id) patch.meta_ad_id = metaAdId;
    if (metaReferralSource && metaReferralSource !== existing.meta_referral_source) {
      patch.meta_referral_source = metaReferralSource;
    }
    if (metaReferralUrl && metaReferralUrl !== existing.meta_referral_url) {
      patch.meta_referral_url = metaReferralUrl;
    }
    if (Object.keys(patch).length) {
      await restRequest(env, `conversations?id=eq.${existing.id}`, {
        method: "PATCH",
        body: patch,
      });
      return { ...existing, ...patch };
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
      business_connection_id: businessConnectionId || null,
      meta_ad_id: metaAdId || null,
      meta_referral_source: metaReferralSource || null,
      meta_referral_url: metaReferralUrl || null,
      status: "new",
    },
    prefer: "return=representation",
  });
  return first(inserted);
}

export async function recordIncomingMessage(env, conversation, {
  body,
  messageType = "text",
  externalMessageId,
  attachmentUrl,
  createdAt,
}) {
  const externalId = String(externalMessageId || "").trim();
  if (externalId) {
    const existing = await restRequest(env, "messages", {
      query: {
        select: "id",
        conversation_id: `eq.${conversation.id}`,
        external_message_id: `eq.${externalId}`,
        limit: "1",
      },
    }).then(first);
    if (existing?.id) {
      // Providers retry webhooks. Update the already-recorded message (useful
      // for edited Telegram messages) without increasing unread_count twice.
      await restRequest(env, "messages", {
        method: "PATCH",
        query: { id: `eq.${existing.id}` },
        body: {
          message_type: messageType,
          body: body || "",
          attachment_url: attachmentUrl || null,
        },
      });
      return { duplicate: true };
    }
  }

  await restRequest(env, "messages", {
    method: "POST",
    body: {
      conversation_id: conversation.id,
      direction: "in",
      sender_type: "contact",
      message_type: messageType,
      body: body || "",
      attachment_url: attachmentUrl || null,
      external_message_id: externalId || null,
      delivery_status: "received",
      created_at: createdAt || new Date().toISOString(),
    },
  });

  const receivedAt = createdAt || new Date().toISOString();
  await restRequest(env, `conversations?id=eq.${conversation.id}`, {
    method: "PATCH",
    body: {
      status: conversation.status === "closed" ? "open" : conversation.status === "new" ? "new" : "open",
      last_message_at: receivedAt,
      last_inbound_at: receivedAt,
      last_message_preview: String(body || "").slice(0, 140),
      unread_count: Number(conversation.unread_count || 0) + 1,
    },
  });
  return { duplicate: false };
}

export async function recordProviderOutgoingMessage(env, conversation, {
  body,
  messageType = "text",
  externalMessageId,
  attachmentUrl,
  createdAt,
}) {
  const externalId = String(externalMessageId || "").trim();
  if (externalId) {
    const existing = await restRequest(env, "messages", {
      query: {
        select: "id",
        conversation_id: `eq.${conversation.id}`,
        external_message_id: `eq.${externalId}`,
        limit: "1",
      },
    }).then(first);
    if (existing?.id) return { duplicate: true };
  }

  const sentAt = createdAt || new Date().toISOString();
  await restRequest(env, "messages", {
    method: "POST",
    body: {
      conversation_id: conversation.id,
      direction: "out",
      sender_type: "channel",
      message_type: messageType,
      body: body || "",
      attachment_url: attachmentUrl || null,
      external_message_id: externalId || null,
      delivery_status: "sent",
      created_at: sentAt,
    },
  });
  await restRequest(env, "conversations", {
    method: "PATCH",
    query: { id: `eq.${conversation.id}` },
    body: {
      status: "answered",
      last_message_at: sentAt,
      last_outbound_at: sentAt,
      last_message_preview: String(body || "").slice(0, 140),
    },
  });
  return { duplicate: false };
}
