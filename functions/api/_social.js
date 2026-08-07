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

// Safe fallback for when a webhook event's account id doesn't match any
// stored channel (Instagram in particular is inconsistent about which id
// format it puts in entry.id across OAuth responses vs. webhook payloads).
// Falling back to "the" connected channel is only safe when there's exactly
// one - with two or more it would risk attributing one account's messages
// to another, so it deliberately returns null in that case instead.
export async function findSoleConnectedChannel(env, platform) {
  const rows = await restRequest(env, "social_channels", {
    query: { select: "*", platform: `eq.${platform}`, status: "eq.connected", limit: "2" },
  });
  const connected = Array.isArray(rows) ? rows : [];
  return connected.length === 1 ? connected[0] : null;
}

export async function findChannelByToken(env, webhookToken) {
  const rows = await restRequest(env, "social_channels", {
    query: { select: "*", webhook_verify_token: `eq.${webhookToken}`, order: "updated_at.desc", limit: "1" },
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
// assuming the most recently connected channel for the platform. Old
// disconnected rows can share the same external_account_id (a page
// reconnected after a prior manual-token attempt), so without an explicit
// order Postgres may return one of those stale rows instead of the live one -
// order by updated_at so the most recently (re)connected row always wins.
export async function findChannelByAccount(env, platform, externalAccountId) {
  const account = String(externalAccountId || "").trim();
  if (!account) return null;
  const rows = await restRequest(env, "social_channels", {
    query: {
      select: "*",
      platform: `eq.${platform}`,
      external_account_id: `eq.${account}`,
      order: "updated_at.desc",
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
  const isInstagram = channel.platform === "instagram";
  const host = isInstagram ? "graph.instagram.com" : "graph.facebook.com";
  const url = new URL(`https://${host}/${metaGraphVersion(env)}/${String(path || "").replace(/^\/+/, "")}`);
  // graph.instagram.com (the standalone Instagram API with Instagram Login
  // host, distinct from graph.facebook.com) does not reliably honor a Bearer
  // Authorization header the way the Facebook Graph API does - requests with
  // a perfectly valid token come back "Object with ID ... does not exist,
  // cannot be loaded due to missing permissions" as if unauthenticated.
  // Meta's own docs pass the token as an access_token query param instead.
  if (isInstagram) url.searchParams.set("access_token", token);
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      ...(isInstagram ? {} : { Authorization: `Bearer ${token}` }),
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
  const isInstagram = channel.platform === "instagram";
  // The numeric user_id returned by the Instagram Login token exchange isn't
  // a directly queryable node on graph.instagram.com for this token type -
  // it comes back "Object with ID ... does not exist, cannot be loaded due
  // to missing permissions" even though the id itself and the token are
  // both valid. "me" resolves against whichever account the token actually
  // belongs to, sidestepping the id-format mismatch entirely.
  const node = isInstagram ? "me" : encodeURIComponent(accountId);
  const profile = await metaGraphRequest(
    env,
    channel,
    `${node}?fields=id,name,username`,
  );
  // "message_echoes" is what makes a reply typed in the Instagram or
  // Messenger app itself arrive here as an outbound event. Without it the
  // CRM only ever saw what customers wrote, so a thread answered from the
  // phone looked unanswered and managers replied to it a second time.
  const subscribedFields = isInstagram
    ? ["messages", "message_echoes", "messaging_postbacks", "messaging_seen", "message_reactions", "comments"]
    : ["messages", "message_echoes", "messaging_postbacks", "messaging_feedback", "feed"];
  const subscription = await metaGraphRequest(
    env,
    channel,
    `${node}/subscribed_apps`,
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

// Messenger/Instagram only ever hand webhooks a numeric PSID/IGSID, never a
// display name - this resolves it to a real name so the inbox shows who
// actually wrote in, the same way Telegram already does.
//
// The field set is not interchangeable between the two hosts: asking
// graph.instagram.com for first_name/last_name errors the whole request out
// and the inbox falls back to showing the raw numeric id. When the richer
// request fails we retry with the smallest field set that every token can
// read, so a partial answer still beats no name at all.
export async function fetchMetaContactProfile(env, channel, contactId) {
  const id = String(contactId || "").trim();
  if (!id) return null;
  const fieldSets = channel.platform === "instagram"
    ? ["name,username", "username", "name"]
    : ["first_name,last_name,name,profile_pic", "first_name,last_name", "name"];
  for (const fields of fieldSets) {
    try {
      const profile = await metaGraphRequest(env, channel, `${encodeURIComponent(id)}?fields=${fields}`);
      if (profile && (profile.name || profile.username || profile.first_name)) return profile;
    } catch {
      // try the next, smaller field set
    }
  }
  return null;
}

// Picks the best human-readable label a Meta profile payload offers, and
// never returns the raw numeric id - callers treat "" as "no name yet" so a
// later event carrying a real name can still fill it in.
export function metaProfileDisplayName(profile, fallbackHandle = "") {
  const candidates = [
    profile?.name,
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
    profile?.username,
    fallbackHandle,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value && !/^\d+$/.test(value)) return value;
  }
  return "";
}

// Replies to a comment in place, so a customer who asked under a post gets
// the answer under that post instead of a direct message they never asked
// for. Instagram exposes this as /{comment-id}/replies, the Facebook Page
// Graph API as /{comment-id}/comments.
export async function metaReplyToComment(env, channel, commentId, message) {
  const id = String(commentId || "").trim();
  const text = String(message || "").trim();
  if (!id) throw new Error("missing_comment_id");
  if (!text) throw new Error("empty_comment_reply");
  const readyChannel = await ensureFreshInstagramChannel(env, channel);
  const edge = readyChannel.platform === "instagram" ? "replies" : "comments";
  return metaGraphRequest(env, readyChannel, `${encodeURIComponent(id)}/${edge}`, {
    method: "POST",
    body: { message: text },
  });
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
  // "me" resolves against whichever account the token belongs to - the
  // numeric account id isn't accepted as a node on graph.instagram.com for
  // this token type (same issue as the connect-time profile fetch).
  const senderId = "me";
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
  // "me" resolves against whichever account the token belongs to - the
  // numeric account id isn't accepted as a node on graph.instagram.com for
  // this token type (same issue as the connect-time profile fetch).
  const senderId = "me";
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
// A raw Meta id is a placeholder, not a name. Treating it as one meant the
// first event won the display name forever, so a thread that opened with an
// unresolvable profile stayed labelled with a 17-digit number even after a
// later event told us the person's real handle.
function isPlaceholderContactName(value) {
  const name = String(value || "").trim();
  return !name || /^\d+$/.test(name);
}

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
  threadType = "dm",
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
    // Only replace the stored name with something strictly better: a real
    // name always beats a numeric placeholder, but a numeric placeholder
    // must never overwrite a name we already resolved.
    const incomingIsPlaceholder = isPlaceholderContactName(contactName);
    const storedIsPlaceholder = isPlaceholderContactName(existing.contact_name);
    if (contactName && contactName !== existing.contact_name && (!incomingIsPlaceholder || storedIsPlaceholder)) {
      patch.contact_name = contactName;
    }
    // A handle learned later (comments carry usernames, DMs often do not)
    // also rescues a thread still showing a numeric placeholder.
    if (storedIsPlaceholder && !patch.contact_name && contactHandle && !isPlaceholderContactName(contactHandle)) {
      patch.contact_name = contactHandle;
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
      contact_name: contactName || contactHandle || externalChatId,
      contact_handle: contactHandle || null,
      business_connection_id: businessConnectionId || null,
      meta_ad_id: metaAdId || null,
      meta_referral_source: metaReferralSource || null,
      meta_referral_url: metaReferralUrl || null,
      thread_type: threadType === "comment" ? "comment" : "dm",
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
