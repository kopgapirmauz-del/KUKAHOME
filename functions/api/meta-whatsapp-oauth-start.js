import { requireAuth } from "./_auth.js";
import {
  buildWhatsappAuthorizationUrl,
  createMetaOAuthState,
  metaFacebookOAuthConfig,
  metaOAuthCookie,
} from "./_meta_oauth.js";

// Like Lead Ads, WhatsApp completes on the Facebook page callback URI: that is
// the redirect already whitelisted in the Meta app, and adding a new one is a
// Meta dashboard change the admin would otherwise have to make by hand. The
// signed state's provider is what tells the shared callback which flow to
// finish.
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
    const state = await createMetaOAuthState(env, session, config.redirectUri, "whatsapp");
    return Response.json({
      success: true,
      authorization_url: buildWhatsappAuthorizationUrl(config, state),
      expires_in: 600,
    }, {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": metaOAuthCookie(state, false, COOKIE_OPTIONS),
      },
    });
  } catch (error) {
    const code = String(error?.message || "meta_whatsapp_oauth_start_failed");
    const known = ["meta_oauth_not_configured", "invalid_meta_oauth_redirect"].includes(code);
    return Response.json({
      success: false,
      error: known ? code : "meta_whatsapp_oauth_start_failed",
    }, {
      status: known ? 503 : 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
