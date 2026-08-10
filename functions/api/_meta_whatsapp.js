import { first, restRequest } from "./_supabase.js";
import {
  exchangeMetaAdsAuthorizationCode,
  listGrantedWhatsappAccountIds,
  listWhatsappPhoneNumbers,
  subscribeWhatsappAccount,
} from "./_meta_oauth.js";

// One-click WhatsApp connect.
//
// The admin approves the WhatsApp scopes once and everything else is derived:
// the granted WhatsApp Business Account ids come from the token's granular
// scopes, each account's phone numbers from the Graph API, and the webhook
// subscription is registered per account. Nothing has to be copied by hand,
// which is the whole point - the previous form asked for a Phone Number ID
// and a permanent token that an admin had to dig out of the Meta dashboard.

async function upsertWhatsappNumber(env, waba, phone, config, state, expiresAt, accessToken) {
  const phoneNumberId = String(phone?.id || "").trim();
  if (!phoneNumberId) throw new Error("whatsapp_phone_number_missing");

  const existing = await restRequest(env, "social_channels", {
    query: {
      select: "id",
      platform: "eq.whatsapp",
      external_account_id: `eq.${phoneNumberId}`,
      limit: "1",
    },
  }).then(first);

  const now = new Date().toISOString();
  const row = {
    platform: "whatsapp",
    display_name: String(phone.verified_name || phone.display_phone_number || `WhatsApp ${phoneNumberId}`),
    external_account_id: phoneNumberId,
    access_token: accessToken,
    webhook_verify_token: config.webhookVerifyToken,
    status: "connected",
    last_error: "",
    connection_type: "whatsapp_oauth",
    token_expires_at: expiresAt,
    health_checked_at: now,
    updated_at: now,
    connected_by: state.uid,
    // Keeping the WABA id makes it possible to re-subscribe later without
    // walking the token's scopes again.
    config: { wabaId: String(waba || ""), displayPhoneNumber: String(phone.display_phone_number || "") },
  };
  await restRequest(env, "social_channels", existing?.id
    ? { method: "PATCH", query: { id: `eq.${existing.id}` }, body: row }
    : { method: "POST", body: row });
}

/**
 * Exchanges the authorization code and connects every WhatsApp number the
 * admin granted access to. Returns { success: true } or
 * { success: false, reason } - the caller turns that into the popup result.
 */
export async function connectWhatsappFromOAuth(env, config, state, code, graphVersion) {
  const token = await exchangeMetaAdsAuthorizationCode(config, code, graphVersion);
  const { ids: wabaIds, scopeGranted, diagnostic } = await listGrantedWhatsappAccountIds(
    config,
    token.accessToken,
    graphVersion,
  );
  if (!wabaIds.length) {
    // Separate the two failures that look identical to the user but need
    // completely different fixes: the Meta app was never allowed to request
    // WhatsApp access at all, versus it was allowed but the business has no
    // WhatsApp account set up yet. The per-lookup diagnostic rides along so a
    // third, unforeseen cause is still traceable instead of silent.
    return {
      success: false,
      reason: scopeGranted
        ? `no_whatsapp_accounts [${diagnostic}]`
        : `whatsapp_scope_not_granted [${diagnostic}]`,
    };
  }

  const expiresAt = token.expiresIn > 0
    ? new Date(Date.now() + (token.expiresIn * 1000)).toISOString()
    : null;

  let connected = 0;
  let lastError = "";
  for (const wabaId of wabaIds) {
    let numbers = [];
    try {
      numbers = await listWhatsappPhoneNumbers(wabaId, token.accessToken, graphVersion);
    } catch (error) {
      lastError = String(error?.message || "whatsapp_phone_numbers_failed");
      continue;
    }
    if (!numbers.length) continue;
    try {
      await subscribeWhatsappAccount(wabaId, token.accessToken, graphVersion);
    } catch (error) {
      // Without the subscription no message would ever arrive, so a number
      // that cannot be subscribed must not be reported as connected.
      lastError = String(error?.message || "whatsapp_subscribe_failed");
      continue;
    }
    for (const phone of numbers) {
      try {
        await upsertWhatsappNumber(env, wabaId, phone, config, state, expiresAt, token.accessToken);
        connected += 1;
      } catch (error) {
        lastError = String(error?.message || "whatsapp_save_failed");
      }
    }
  }

  if (!connected) {
    return { success: false, reason: lastError || "no_whatsapp_numbers" };
  }
  return { success: true, connected };
}
