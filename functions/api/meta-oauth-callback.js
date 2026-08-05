import { first, restRequest } from "./_supabase.js";
import { validateAndSubscribeMetaChannel } from "./_social.js";
import {
  exchangeInstagramAuthorizationCode,
  metaOAuthConfig,
  metaOAuthCookie,
  metaOAuthResultHtml,
  readCookie,
  verifyMetaOAuthState,
} from "./_meta_oauth.js";

function htmlResponse(origin, result) {
  return new Response(metaOAuthResultHtml(origin, result), {
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
      "Set-Cookie": metaOAuthCookie("", true),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  let origin;
  try {
    origin = new URL(request.url).origin;
    const url = new URL(request.url);
    const config = metaOAuthConfig(env, request.url);
    const code = String(url.searchParams.get("code") || "").trim();
    const returnedState = String(url.searchParams.get("state") || "");
    const cookieState = readCookie(request, "kuka_meta_oauth");
    if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
      return htmlResponse(origin, { success: false, reason: "invalid_state" });
    }

    const state = await verifyMetaOAuthState(env, returnedState);
    if (!state || state.redirect_uri !== config.redirectUri) {
      return htmlResponse(origin, { success: false, reason: "expired_state" });
    }
    const currentUser = await restRequest(env, "users", {
      query: {
        select: "id,role",
        id: `eq.${state.uid}`,
        limit: "1",
      },
    }).then(first);
    if (!currentUser || String(currentUser.role) !== "admin") {
      return htmlResponse(origin, { success: false, reason: "access_revoked" });
    }

    const token = await exchangeInstagramAuthorizationCode(config, code);
    const candidate = {
      platform: "instagram",
      external_account_id: token.accountId,
      access_token: token.accessToken,
    };
    const connected = await validateAndSubscribeMetaChannel(env, candidate);
    const displayName = String(
      connected?.profile?.username
      || connected?.profile?.name
      || `Instagram ${token.accountId}`,
    ).trim();
    const now = new Date();
    const expiresAt = token.expiresIn > 0
      ? new Date(now.getTime() + (token.expiresIn * 1000)).toISOString()
      : null;
    const existing = await restRequest(env, "social_channels", {
      query: {
        select: "*",
        platform: "eq.instagram",
        external_account_id: `eq.${token.accountId}`,
        limit: "1",
      },
    }).then(first);
    const channel = {
      platform: "instagram",
      display_name: displayName,
      external_account_id: token.accountId,
      access_token: token.accessToken,
      webhook_verify_token: config.webhookVerifyToken,
      status: "connected",
      last_error: "",
      connection_type: "instagram_oauth",
      token_expires_at: expiresAt,
      health_checked_at: now.toISOString(),
      updated_at: now.toISOString(),
      connected_by: state.uid,
    };

    if (existing?.id) {
      await restRequest(env, "social_channels", {
        method: "PATCH",
        query: { id: `eq.${existing.id}` },
        body: channel,
      });
    } else {
      await restRequest(env, "social_channels", {
        method: "POST",
        body: channel,
      });
    }
    return htmlResponse(origin, { success: true });
  } catch (error) {
    const detail = String(error?.message || "provider_error");
    console.error("meta_oauth_callback_failed", detail);
    return htmlResponse(origin || "https://kukahome.uz", {
      success: false,
      reason: detail || "provider_error",
    });
  }
}
