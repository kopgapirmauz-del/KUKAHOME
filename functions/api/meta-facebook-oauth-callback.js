import { first, restRequest } from "./_supabase.js";
import { validateAndSubscribeMetaChannel } from "./_social.js";
import {
  exchangeMetaAdsAuthorizationCode,
  listMetaAdsAssets,
  metaFacebookOAuthConfig,
  metaOAuthCookie,
  metaOAuthResultHtml,
  readCookie,
  verifyMetaOAuthState,
} from "./_meta_oauth.js";

const COOKIE_OPTIONS = {
  name: "kuka_meta_facebook_oauth",
  path: "/api/meta-facebook-oauth-callback",
};

function graphVersion(env) {
  const configured = String(env?.META_GRAPH_VERSION || "").trim();
  return /^v\d+\.\d+$/.test(configured) ? configured : "v25.0";
}

function htmlResponse(origin, result) {
  return new Response(metaOAuthResultHtml(origin, result, { provider: "facebook" }), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": [
        "default-src 'none'",
        "script-src 'unsafe-inline'",
        "style-src 'none'",
        "img-src 'none'",
        "base-uri 'none'",
        "frame-ancestors 'none'",
        "form-action 'none'",
      ].join("; "),
      "Referrer-Policy": "no-referrer",
      "Set-Cookie": metaOAuthCookie("", true, COOKIE_OPTIONS),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function upsertFacebookPage(env, page, config, state, expiresAt) {
  if (!page?.id || !page?.access_token) throw new Error("meta_page_token_missing");
  const candidate = {
    platform: "facebook",
    external_account_id: String(page.id),
    access_token: String(page.access_token),
  };
  await validateAndSubscribeMetaChannel(env, candidate);
  const existing = await restRequest(env, "social_channels", {
    query: {
      select: "id",
      platform: "eq.facebook",
      external_account_id: `eq.${page.id}`,
      limit: "1",
    },
  }).then(first);
  const now = new Date().toISOString();
  const row = {
    platform: "facebook",
    display_name: String(page.name || `Facebook ${page.id}`),
    external_account_id: String(page.id),
    access_token: String(page.access_token),
    webhook_verify_token: config.webhookVerifyToken,
    status: "connected",
    last_error: "",
    connection_type: "facebook_oauth",
    token_expires_at: expiresAt,
    health_checked_at: now,
    updated_at: now,
    connected_by: state.uid,
  };
  await restRequest(env, "social_channels", existing?.id
    ? { method: "PATCH", query: { id: `eq.${existing.id}` }, body: row }
    : { method: "POST", body: row });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  let origin = "https://kukahome.uz";
  try {
    const url = new URL(request.url);
    origin = url.origin;
    const config = metaFacebookOAuthConfig(env, request.url);
    const code = String(url.searchParams.get("code") || "").trim();
    const returnedState = String(url.searchParams.get("state") || "");
    const cookieState = readCookie(request, COOKIE_OPTIONS.name);
    if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
      return htmlResponse(origin, { success: false, reason: "invalid_state" });
    }
    const state = await verifyMetaOAuthState(env, returnedState);
    if (
      !state
      || state.provider !== "facebook"
      || state.redirect_uri !== config.redirectUri
    ) {
      return htmlResponse(origin, { success: false, reason: "expired_state" });
    }
    const currentUser = await restRequest(env, "users", {
      query: { select: "id,role", id: `eq.${state.uid}`, limit: "1" },
    }).then(first);
    if (!currentUser || String(currentUser.role) !== "admin") {
      return htmlResponse(origin, { success: false, reason: "access_revoked" });
    }

    const token = await exchangeMetaAdsAuthorizationCode(config, code, graphVersion(env));
    const assets = await listMetaAdsAssets(token.accessToken, graphVersion(env));
    if (!assets.pages.length) {
      return htmlResponse(origin, { success: false, reason: "no_pages" });
    }
    const expiresAt = token.expiresIn > 0
      ? new Date(Date.now() + (token.expiresIn * 1000)).toISOString()
      : null;
    const pageResults = await Promise.allSettled(
      assets.pages.map((page) => upsertFacebookPage(env, page, config, state, expiresAt)),
    );
    const connectedPages = pageResults.filter((result) => result.status === "fulfilled").length;
    if (!connectedPages) {
      throw new Error("meta_facebook_subscription_failed");
    }
    return htmlResponse(origin, { success: true });
  } catch (error) {
    console.error("meta_facebook_oauth_callback_failed", String(error?.message || error));
    return htmlResponse(origin, { success: false, reason: "provider_error" });
  }
}
