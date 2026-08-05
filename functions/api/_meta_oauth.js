import { getServiceRoleKey } from "./_supabase.js";

const OAUTH_TTL_MS = 10 * 60 * 1000;
const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
];
const META_ADS_SCOPES = [
  "pages_show_list",
  "pages_manage_metadata",
  "pages_read_engagement",
  "leads_retrieval",
  "ads_read",
  "business_management",
];
const FACEBOOK_PAGE_SCOPES = [
  "pages_show_list",
  "pages_messaging",
  "pages_manage_metadata",
  "pages_read_engagement",
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

function oauthConfig(env, requestUrl, redirectEnvName, defaultPath, appIdEnvName = "META_APP_ID", appSecretEnvName = "META_APP_SECRET") {
  const appId = String(env?.[appIdEnvName] || "").trim();
  const appSecret = String(env?.[appSecretEnvName] || "").trim();
  const webhookVerifyToken = String(env?.META_WEBHOOK_VERIFY_TOKEN || "").trim();
  if (!appId || !appSecret || !webhookVerifyToken) throw new Error("meta_oauth_not_configured");
  const origin = new URL(requestUrl).origin;
  const configuredRedirect = String(env?.[redirectEnvName] || "").trim();
  const redirectUri = configuredRedirect || `${origin}${defaultPath}`;
  const redirect = new URL(redirectUri);
  if (redirect.protocol !== "https:" || redirect.origin !== origin) {
    throw new Error("invalid_meta_oauth_redirect");
  }
  return { appId, appSecret, webhookVerifyToken, origin, redirectUri };
}

// Instagram Business Login (instagram.com/oauth/authorize) is issued by its
// own Instagram App ID/Secret, separate from the parent Meta App's Facebook
// credentials - passing the Facebook App ID here gets "Invalid platform app".
export function metaOAuthConfig(env, requestUrl) {
  return oauthConfig(
    env,
    requestUrl,
    "META_OAUTH_REDIRECT_URI",
    "/api/meta-oauth-callback",
    "META_INSTAGRAM_APP_ID",
    "META_INSTAGRAM_APP_SECRET",
  );
}

export function metaAdsOAuthConfig(env, requestUrl) {
  return oauthConfig(env, requestUrl, "META_ADS_OAUTH_REDIRECT_URI", "/api/meta-ads-oauth-callback");
}

export function metaFacebookOAuthConfig(env, requestUrl) {
  return oauthConfig(env, requestUrl, "META_FACEBOOK_OAUTH_REDIRECT_URI", "/api/meta-facebook-oauth-callback");
}

export async function createMetaOAuthState(env, session, redirectUri, provider = "instagram") {
  const payload = {
    uid: String(session?.uid || ""),
    nonce: crypto.randomUUID(),
    redirect_uri: String(redirectUri || ""),
    provider: String(provider || "instagram"),
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

export function buildMetaAdsAuthorizationUrl(config, state) {
  const url = new URL(`https://www.facebook.com/v25.0/dialog/oauth`);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_ADS_SCOPES.join(","));
  url.searchParams.set("state", state);
  return url.toString();
}

export function buildFacebookPageAuthorizationUrl(config, state) {
  const url = new URL(`https://www.facebook.com/v25.0/dialog/oauth`);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", FACEBOOK_PAGE_SCOPES.join(","));
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

export function metaOAuthCookie(state, clear = false, options = {}) {
  const name = String(options.name || "kuka_meta_oauth");
  const path = String(options.path || "/api/meta-oauth-callback");
  const value = clear ? "" : encodeURIComponent(String(state || ""));
  return [
    `${name}=${value}`,
    `Path=${path}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    clear ? "Max-Age=0" : `Max-Age=${Math.floor(OAUTH_TTL_MS / 1000)}`,
  ].join("; ");
}

async function facebookJson(url, init, errorCode) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    const error = new Error(data?.error?.message || errorCode);
    error.code = data?.error?.code || "";
    throw error;
  }
  return data;
}

export async function exchangeMetaAdsAuthorizationCode(config, code, graphVersion = "v25.0") {
  const codeUrl = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
  codeUrl.searchParams.set("client_id", config.appId);
  codeUrl.searchParams.set("client_secret", config.appSecret);
  codeUrl.searchParams.set("redirect_uri", config.redirectUri);
  codeUrl.searchParams.set("code", String(code || ""));
  const shortLived = await facebookJson(codeUrl, { method: "GET" }, "meta_ads_code_exchange_failed");
  if (!shortLived?.access_token) throw new Error("meta_ads_code_exchange_incomplete");

  const longUrl = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
  longUrl.searchParams.set("grant_type", "fb_exchange_token");
  longUrl.searchParams.set("client_id", config.appId);
  longUrl.searchParams.set("client_secret", config.appSecret);
  longUrl.searchParams.set("fb_exchange_token", shortLived.access_token);
  const longLived = await facebookJson(longUrl, { method: "GET" }, "meta_ads_long_lived_token_failed");
  if (!longLived?.access_token) throw new Error("meta_ads_long_lived_token_incomplete");
  return {
    accessToken: String(longLived.access_token),
    expiresIn: Number(longLived.expires_in || 0),
  };
}

async function listFacebookEdge(graphVersion, edge, token, fields) {
  const items = [];
  let next = new URL(`https://graph.facebook.com/${graphVersion}/${edge}`);
  next.searchParams.set("fields", fields);
  next.searchParams.set("limit", "100");
  while (next) {
    const data = await facebookJson(next, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }, "meta_ads_assets_failed");
    items.push(...(Array.isArray(data?.data) ? data.data : []));
    const nextUrl = String(data?.paging?.next || "");
    next = nextUrl ? new URL(nextUrl) : null;
    if (next && next.hostname !== "graph.facebook.com") {
      throw new Error("invalid_meta_paging_url");
    }
  }
  return items;
}

export async function listMetaAdsAssets(accessToken, graphVersion = "v25.0") {
  const [pages, adAccounts] = await Promise.all([
    listFacebookEdge(
      graphVersion,
      "me/accounts",
      accessToken,
      "id,name,access_token,tasks",
    ),
    listFacebookEdge(
      graphVersion,
      "me/adaccounts",
      accessToken,
      "id,name,account_id,account_status,currency,timezone_name",
    ),
  ]);
  return { pages, adAccounts };
}

export async function ensureMetaLeadWebhookSubscription(config, graphVersion = "v25.0") {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(config.appId)}/subscriptions`);
  const authorization = `Bearer ${config.appId}|${config.appSecret}`;
  const existing = await facebookJson(url, {
    method: "GET",
    headers: { Authorization: authorization },
  }, "meta_lead_webhook_read_failed");
  const pageSubscription = (Array.isArray(existing?.data) ? existing.data : [])
    .find((subscription) => subscription?.object === "page");
  const fields = new Set(["leadgen"]);
  for (const field of Array.isArray(pageSubscription?.fields) ? pageSubscription.fields : []) {
    const name = String(typeof field === "string" ? field : field?.name || "").trim();
    if (name) fields.add(name);
  }
  const body = new URLSearchParams();
  body.set("object", "page");
  body.set("callback_url", `${config.origin}/api/meta-webhook`);
  body.set("fields", [...fields].join(","));
  body.set("verify_token", config.webhookVerifyToken);
  body.set("include_values", "true");
  const data = await facebookJson(url, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  }, "meta_lead_webhook_subscription_failed");
  if (data?.success !== true) throw new Error("meta_lead_webhook_subscription_failed");
  return true;
}

async function instagramJson(url, init, errorCode) {
  const response = await fetch(url, init);
  const raw = await response.text();
  const data = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();
  if (!response.ok || data?.error || data?.error_type) {
    // Instagram/Facebook error payloads carry the real diagnostic detail in
    // type/code/error_subcode/fbtrace_id, not just message - a bare message
    // string here has repeatedly hidden the actual cause during remote
    // debugging. Surface everything so a failure is diagnosable in one shot.
    const err = data?.error || {};
    const parts = [
      `http=${response.status}`,
      err.message || data?.error_message || data?.message || errorCode,
      err.type ? `type=${err.type}` : "",
      err.code != null ? `code=${err.code}` : "",
      err.error_subcode != null ? `subcode=${err.error_subcode}` : "",
      err.fbtrace_id ? `trace=${err.fbtrace_id}` : "",
      !data ? `raw=${raw.slice(0, 150)}` : "",
    ].filter(Boolean);
    throw new Error(parts.join(" | ").slice(0, 400));
  }
  return data;
}

export async function exchangeInstagramAuthorizationCode(config, code) {
  // The OAuth token endpoint must receive application/x-www-form-urlencoded
  // (RFC 6749 4.1.3), not multipart/form-data - a FormData body here got
  // sent as multipart, and Instagram's token endpoint parsed that badly
  // enough to report the misleading "redirect_uri must be identical" error
  // even though the redirect_uri itself was correct on both requests.
  const body = new URLSearchParams();
  body.set("client_id", config.appId);
  body.set("client_secret", config.appSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", config.redirectUri);
  body.set("code", String(code || ""));

  const shortLived = await instagramJson(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
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

const OAUTH_RESULT_TEXT = {
  instagram: { queryKey: "meta_oauth", messageType: "kuka-meta-oauth", title: "Instagram ulanishi", success: "Instagram ulandi. Oyna yopilmoqda...", error: "Instagram ulanmagan. CRM oynasiga qayting." },
  meta_ads: { queryKey: "meta_ads_oauth", messageType: "kuka-meta-ads-oauth", title: "Meta Ads ulanishi", success: "Meta Ads ulandi. Oyna yopilmoqda...", error: "Meta Ads ulanmagan. CRM oynasiga qayting." },
  facebook: { queryKey: "meta_facebook_oauth", messageType: "kuka-meta-facebook-oauth", title: "Facebook ulanishi", success: "Facebook ulandi. Oyna yopilmoqda...", error: "Facebook ulanmagan. CRM oynasiga qayting." },
};

export function metaOAuthResultHtml(origin, result, options = {}) {
  const provider = String(options.provider || "instagram");
  const text = OAUTH_RESULT_TEXT[provider] || OAUTH_RESULT_TEXT.instagram;
  const { queryKey, messageType, title } = text;
  const successText = text.success;
  const errorText = text.error;
  const status = result?.success ? "success" : "error";
  // Both destinations below (JSON.stringify'd payload, encodeURIComponent'd
  // query param) already escape this value safely, so there's no need to
  // mangle it into a run-on alphanumeric blob first - that stripped every
  // space and punctuation mark from real Graph API error text, turning
  // diagnosable messages into unreadable noise during remote debugging.
  const reason = String(result?.reason || "")
    .replace(/[<>"`]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .slice(0, 300);
  const payload = JSON.stringify({
    type: messageType,
    success: status === "success",
    reason,
  }).replace(/</g, "\\u003c");
  const fallback = `${origin}/crm/?${queryKey}=${encodeURIComponent(status)}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`;
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title></head>
<body><p>${status === "success" ? successText : errorText}</p>
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
