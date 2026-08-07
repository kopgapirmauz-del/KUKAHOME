import { first, restRequest } from "./_supabase.js";
import { validateAndSubscribeMetaLeadPage } from "./_social.js";
import {
  exchangeMetaAdsAuthorizationCode,
  ensureMetaLeadWebhookSubscription,
  listMetaAdsAssets,
} from "./_meta_oauth.js";

// Shared Meta Lead Ads connect routine.
//
// It lives here rather than inside a single callback because the Lead Ads
// flow is served by two redirect URIs: its own /api/meta-ads-oauth-callback,
// and the Facebook page callback it piggybacks on (see
// meta-ads-oauth-start.js for why). Both entry points run exactly this.

async function upsertLeadPage(env, page, config, state, expiresAt) {
  if (!page?.id || !page?.access_token) throw new Error("meta_page_token_missing");
  const candidate = {
    platform: "meta_ads",
    external_account_id: String(page.id),
    access_token: String(page.access_token),
  };
  await validateAndSubscribeMetaLeadPage(env, candidate);
  const existing = await restRequest(env, "social_channels", {
    query: {
      select: "id",
      platform: "eq.meta_ads",
      external_account_id: `eq.${page.id}`,
      limit: "1",
    },
  }).then(first);
  const now = new Date().toISOString();
  const row = {
    platform: "meta_ads",
    display_name: String(page.name || `Meta Page ${page.id}`),
    external_account_id: String(page.id),
    access_token: String(page.access_token),
    webhook_verify_token: config.webhookVerifyToken,
    status: "connected",
    last_error: "",
    connection_type: "meta_lead_ads",
    token_expires_at: expiresAt,
    health_checked_at: now,
    updated_at: now,
    connected_by: state.uid,
  };
  await restRequest(env, "social_channels", existing?.id
    ? { method: "PATCH", query: { id: `eq.${existing.id}` }, body: row }
    : { method: "POST", body: row });
}

async function upsertAdAccount(env, account, token, state, expiresAt) {
  const externalId = String(account.account_id || account.id || "").replace(/^act_/, "");
  if (!externalId) return;
  await restRequest(env, "meta_ad_accounts", {
    method: "POST",
    query: { on_conflict: "external_account_id" },
    body: {
      external_account_id: externalId,
      display_name: String(account.name || `Ad Account ${externalId}`),
      access_token: token,
      account_status: Number(account.account_status || 0),
      currency: String(account.currency || ""),
      timezone_name: String(account.timezone_name || ""),
      token_expires_at: expiresAt,
      status: "connected",
      connected_by: state.uid,
      updated_at: new Date().toISOString(),
    },
    prefer: "resolution=merge-duplicates",
  });
}

/**
 * Exchanges the authorization code and stores every reachable lead page and
 * ad account. Returns { success: true } or { success: false, reason } - the
 * caller turns that into the popup result page.
 */
export async function connectMetaLeadAds(env, config, state, code, graphVersion) {
  const token = await exchangeMetaAdsAuthorizationCode(config, code, graphVersion);
  const assets = await listMetaAdsAssets(token.accessToken, graphVersion);
  if (!assets.pages.length) return { success: false, reason: "no_pages" };

  const expiresAt = token.expiresIn > 0
    ? new Date(Date.now() + (token.expiresIn * 1000)).toISOString()
    : null;
  await ensureMetaLeadWebhookSubscription(config, graphVersion);
  const pageResults = await Promise.allSettled(
    assets.pages.map((page) => upsertLeadPage(env, page, config, state, expiresAt)),
  );
  const connectedPages = pageResults.filter((result) => result.status === "fulfilled").length;
  if (!connectedPages) {
    const firstReason = pageResults.find((result) => result.status === "rejected");
    throw new Error(String(firstReason?.reason?.message || "meta_leadgen_subscription_failed"));
  }
  await Promise.all(
    assets.adAccounts.map((account) => upsertAdAccount(
      env,
      account,
      token.accessToken,
      state,
      expiresAt,
    )),
  );
  return { success: true };
}
