import { first, restRequest } from "./_supabase.js";
import { connectMetaLeadAds } from "./_meta_lead_ads.js";
import {
  metaAdsOAuthConfig,
  metaOAuthCookie,
  metaOAuthResultHtml,
  readCookie,
  verifyMetaOAuthState,
} from "./_meta_oauth.js";

// Legacy Lead Ads callback.
//
// The live flow now completes on /api/meta-facebook-oauth-callback, because
// this path was never added to the Meta app's Valid OAuth Redirect URIs and
// so Meta blocked the dialog before it started. This endpoint is kept so the
// flow keeps working for anyone who does whitelist it (or has an in-flight
// authorization from before the switch); both share the same connect logic.
const COOKIE_OPTIONS = {
  name: "kuka_meta_ads_oauth",
  path: "/api/meta-ads-oauth-callback",
};

function graphVersion(env) {
  const configured = String(env?.META_GRAPH_VERSION || "").trim();
  return /^v\d+\.\d+$/.test(configured) ? configured : "v25.0";
}

function htmlResponse(origin, result) {
  return new Response(metaOAuthResultHtml(origin, result, { provider: "meta_ads" }), {
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

export async function onRequestGet(context) {
  const { request, env } = context;
  let origin = "https://kukahome.uz";
  try {
    const url = new URL(request.url);
    origin = url.origin;
    const config = metaAdsOAuthConfig(env, request.url);
    const code = String(url.searchParams.get("code") || "").trim();
    const returnedState = String(url.searchParams.get("state") || "");
    const cookieState = readCookie(request, COOKIE_OPTIONS.name);
    if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
      return htmlResponse(origin, { success: false, reason: "invalid_state" });
    }
    const state = await verifyMetaOAuthState(env, returnedState);
    if (
      !state
      || state.provider !== "meta_ads"
      || state.redirect_uri !== config.redirectUri
    ) {
      return htmlResponse(origin, { success: false, reason: "expired_state" });
    }
    const currentUser = await restRequest(env, "users", {
      query: { select: "id,role", id: `eq.${state.uid}`, limit: "1" },
    }).then(first);
    // Matches the roles the start endpoint admits - rejecting anything but
    // "admin" here failed a director only after they had already granted
    // Meta the permissions.
    if (!currentUser || !["admin", "director"].includes(String(currentUser.role))) {
      return htmlResponse(origin, { success: false, reason: "access_revoked" });
    }

    const result = await connectMetaLeadAds(env, config, state, code, graphVersion(env));
    return htmlResponse(origin, result);
  } catch (error) {
    const detail = String(error?.message || error);
    console.error("meta_ads_oauth_callback_failed", detail);
    return htmlResponse(origin, { success: false, reason: detail });
  }
}
