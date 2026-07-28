import { getServiceRoleKey } from "./_supabase.js";

const OAUTH_TTL_MS = 10 * 60 * 1000;
const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
];

function toBase64Url(bytes) {
  let binary = "";
  const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < value.length; i += 1) binary += String.fromCharCode(value[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function signingKey(env) {
  const appSecret = String(env?.META_APP_SECRET || "").trim();
  if (!appSecret) throw new Error("meta_oauth_not_configured");
  const material = `${appSecret}:${getServiceRoleKey(env)}:meta-oauth-state:v1`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function metaOAuthConfig(env, requestUrl) {
  const appId = String(env?.META_APP_ID || "").trim();
  const appSecret = String(env?.META_APP_SECRET || "").trim();
  const webhookVerifyToken = String(env?.META_WEBHOOK_VERIFY_TOKEN || "").trim();
  if (!appId || !appSecret || !webhookVerifyToken) throw new Error("meta_oauth_not_configured");
  const origin = new URL(requestUrl).origin;
  const configuredRedirect = String(env?.META_OAUTH_REDIRECT_URI || "").trim();
  const redirectUri = configuredRedirect || `${origin}/api/meta-oauth-callback`;
  const redirect = new URL(redirectUri);
  if (redirect.protocol !== "https:" || redirect.origin !== origin) {
    throw new Error("invalid_meta_oauth_redirect");
  }
  return { appId, appSecret, webhookVerifyToken, origin, redirectUri };
}

export async function createMetaOAuthState(env, session, redirectUri) {
  const payload = {
    uid: String(session?.uid || ""),
    nonce: crypto.randomUUID(),
    redirect_uri: String(redirectUri || ""),
    exp: Date.now() + OAUTH_TTL_MS,
  };
  if (!payload.uid || !payload.redirect_uri) throw new Error("invalid_oauth_state");
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(env),
    new TextEncoder().encode(body),
  );
  return `${body}.${toBase64Url(signature)}`;
}

export async function verifyMetaOAuthState(env, state) {
  try {
    const raw = String(state || "");
    const dot = raw.lastIndexOf(".");
    if (dot < 1) return null;
    const body = raw.slice(0, dot);
    const signature = raw.slice(dot + 1);
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(env),
      fromBase64Url(signature),
      new TextEncoder().encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (!payload?.uid || !payload?.nonce || !payload?.redirect_uri) return null;
    if (!payload?.exp || Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildInstagramAuthorizationUrl(config, state) {
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", INSTAGRAM_SCOPES.join(","));
  url.searchParams.set("state", state);
  return url.toString();
}

export function readCookie(request, name) {
  const cookieHeader = String(request.headers.get("Cookie") || "");
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return "";
}

export function metaOAuthCookie(state, clear = false) {
  const value = clear ? "" : encodeURIComponent(String(state || ""));
  return [
    `kuka_meta_oauth=${value}`,
    "Path=/api/meta-oauth-callback",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    clear ? "Max-Age=0" : `Max-Age=${Math.floor(OAUTH_TTL_MS / 1000)}`,
  ].join("; ");
}

async function instagramJson(url, init, errorCode) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error || data?.error_type) {
    const message = data?.error?.message || data?.error_message || data?.message || errorCode;
    throw new Error(String(message || errorCode));
  }
  return data;
}

export async function exchangeInstagramAuthorizationCode(config, code) {
  const body = new FormData();
  body.set("client_id", config.appId);
  body.set("client_secret", config.appSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", config.redirectUri);
  body.set("code", String(code || ""));

  const shortLived = await instagramJson(
    "https://api.instagram.com/oauth/access_token",
    { method: "POST", body },
    "instagram_code_exchange_failed",
  );
  if (!shortLived?.access_token || !shortLived?.user_id) {
    throw new Error("instagram_code_exchange_incomplete");
  }

  const exchangeUrl = new URL("https://graph.instagram.com/access_token");
  exchangeUrl.searchParams.set("grant_type", "ig_exchange_token");
  exchangeUrl.searchParams.set("client_secret", config.appSecret);
  exchangeUrl.searchParams.set("access_token", shortLived.access_token);
  const longLived = await instagramJson(
    exchangeUrl,
    { method: "GET" },
    "instagram_long_lived_token_failed",
  );
  if (!longLived?.access_token) throw new Error("instagram_long_lived_token_incomplete");

  return {
    accountId: String(shortLived.user_id),
    accessToken: String(longLived.access_token),
    expiresIn: Number(longLived.expires_in || 0),
  };
}

export function metaOAuthResultHtml(origin, result) {
  const status = result?.success ? "success" : "error";
  const reason = String(result?.reason || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  const payload = JSON.stringify({
    type: "kuka-meta-oauth",
    success: status === "success",
    reason,
  }).replace(/</g, "\\u003c");
  const fallback = `${origin}/crm/?meta_oauth=${encodeURIComponent(status)}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`;
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Instagram ulanishi</title></head>
<body><p>${status === "success" ? "Instagram ulandi. Oyna yopilmoqda..." : "Instagram ulanmagan. CRM oynasiga qayting."}</p>
<script>
  const result = ${payload};
  if (window.opener && window.opener !== window) {
    window.opener.postMessage(result, ${JSON.stringify(origin)});
    window.close();
  } else {
    window.location.replace(${JSON.stringify(fallback)});
  }
</script></body></html>`;
}
