import { requireAuth } from "./_auth.js";
import {
  buildInstagramAuthorizationUrl,
  createMetaOAuthState,
  metaOAuthConfig,
  metaOAuthCookie,
} from "./_meta_oauth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "director"]);
  if (session instanceof Response) return session;

  try {
    const config = metaOAuthConfig(env, request.url);
    const state = await createMetaOAuthState(env, session, config.redirectUri);
    return Response.json({
      success: true,
      authorization_url: buildInstagramAuthorizationUrl(config, state),
      expires_in: 600,
    }, {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": metaOAuthCookie(state),
      },
    });
  } catch (error) {
    const code = String(error?.message || "meta_oauth_start_failed");
    const known = ["meta_oauth_not_configured", "invalid_meta_oauth_redirect"].includes(code);
    return Response.json({
      success: false,
      error: known ? code : "meta_oauth_start_failed",
    }, {
      status: known ? 503 : 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
