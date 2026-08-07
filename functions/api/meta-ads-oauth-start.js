import { requireAuth } from "./_auth.js";
import {
  buildMetaAdsAuthorizationUrl,
  createMetaOAuthState,
  metaFacebookOAuthConfig,
  metaOAuthCookie,
} from "./_meta_oauth.js";

// Lead Ads shares the Facebook page callback URI on purpose.
//
// Meta only completes an OAuth dialog when the exact redirect_uri is listed
// under the app's "Valid OAuth Redirect URIs". /api/meta-ads-oauth-callback
// was never added there, so this flow always died on Meta's "URL blocked"
// screen before the user ever saw a permissions prompt. Both flows run on
// the same Facebook app id and the same dialog host, so reusing the page
// callback - which is already whitelisted and working - makes Lead Ads work
// with no further Meta dashboard changes. The provider recorded in the
// signed state is what tells the shared callback which flow to finish.
const COOKIE_OPTIONS = {
  name: "kuka_meta_facebook_oauth",
  path: "/api/meta-facebook-oauth-callback",
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "director"]);
  if (session instanceof Response) return session;

  try {
    const config = metaFacebookOAuthConfig(env, request.url);
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
