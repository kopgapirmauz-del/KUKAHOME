import { requireAuth } from "./_auth.js";
import {
  buildMetaAdsAuthorizationUrl,
  createMetaOAuthState,
  metaAdsOAuthConfig,
  metaOAuthCookie,
} from "./_meta_oauth.js";

const COOKIE_OPTIONS = {
  name: "kuka_meta_ads_oauth",
  path: "/api/meta-ads-oauth-callback",
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "director"]);
  if (session instanceof Response) return session;

  try {
    const config = metaAdsOAuthConfig(env, request.url);
    const state = await createMetaOAuthState(env, session, config.redirectUri, "meta_ads");
    return Response.json({
      success: true,
      authorization_url: buildMetaAdsAuthorizationUrl(config, state),
      expires_in: 600,
    }, {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": metaOAuthCookie(state, false, COOKIE_OPTIONS),
      },
    });
  } catch (error) {
    const code = String(error?.message || "meta_ads_oauth_start_failed");
    const known = ["meta_oauth_not_configured", "invalid_meta_oauth_redirect"].includes(code);
    return Response.json({
      success: false,
      error: known ? code : "meta_ads_oauth_start_failed",
    }, {
      status: known ? 503 : 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
