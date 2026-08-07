import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import {
  buildMetaAdsAuthorizationUrl,
  createMetaOAuthState,
  metaAdsOAuthConfig,
  metaOAuthCookie,
  verifyMetaOAuthState,
} from "../functions/api/_meta_oauth.js";
import { onRequestPost as startOAuth } from "../functions/api/meta-ads-oauth-start.js";
import { onRequestGet as finishOAuth } from "../functions/api/meta-ads-oauth-callback.js";
import { onRequestGet as finishSharedOAuth } from "../functions/api/meta-facebook-oauth-callback.js";

const env = {
  SUPABASE_URL: "https://meta-ads-oauth-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "meta-ads-service-role",
  META_APP_ID: "123456789",
  META_APP_SECRET: "meta-app-secret",
  META_WEBHOOK_VERIFY_TOKEN: "meta-webhook-verify",
  META_GRAPH_VERSION: "v25.0",
};
const cookieOptions = { name: "kuka_meta_ads_oauth", path: "/api/meta-ads-oauth-callback" };

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

test("Meta Ads OAuth requests lead retrieval and read-only advertising access", async () => {
  const config = metaAdsOAuthConfig(env, "https://kukahome.uz/api/meta-ads-oauth-start");
  const state = await createMetaOAuthState(env, { uid: "admin-1" }, config.redirectUri, "meta_ads");
  const verified = await verifyMetaOAuthState(env, state);
  assert.equal(verified.provider, "meta_ads");
  assert.equal(verified.redirect_uri, "https://kukahome.uz/api/meta-ads-oauth-callback");

  const authorization = new URL(buildMetaAdsAuthorizationUrl(config, state));
  assert.equal(authorization.origin, "https://www.facebook.com");
  assert.equal(authorization.pathname, "/v25.0/dialog/oauth");
  const scopes = authorization.searchParams.get("scope").split(",");
  for (const permission of [
    "pages_show_list",
    "pages_manage_metadata",
    "leads_retrieval",
    "ads_read",
    "business_management",
  ]) assert.ok(scopes.includes(permission), `${permission} must be requested`);
  assert.ok(!scopes.includes("ads_management"), "CRM only reads ads and must not receive campaign write access");
});

// Lead Ads starts on the Facebook page callback URI because that is the one
// actually whitelisted in the Meta app; its own path was blocked by Meta
// before the dialog even opened.
test("starting the Meta Ads flow targets the whitelisted Facebook callback", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/rest/v1/users") {
      return json([{ id: "admin-1", login: "admin", role: "admin", store_id: null }]);
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const token = await createSessionToken(env, { id: "admin-1", login: "admin", role: "admin" });
    const response = await startOAuth({
      env,
      request: new Request("https://kukahome.uz/api/meta-ads-oauth-start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    });
    const body = await response.json();
    const authorization = new URL(body.authorization_url);
    assert.equal(
      authorization.searchParams.get("redirect_uri"),
      "https://kukahome.uz/api/meta-facebook-oauth-callback",
    );
    // The scopes still have to be the Lead Ads set, not the page-connect set.
    const scopes = authorization.searchParams.get("scope").split(",");
    assert.ok(scopes.includes("leads_retrieval"));
    assert.ok(scopes.includes("ads_read"));
    // The signed state is what tells the shared callback which flow to finish.
    const verified = await verifyMetaOAuthState(env, authorization.searchParams.get("state"));
    assert.equal(verified.provider, "meta_ads");
    const cookie = response.headers.get("Set-Cookie");
    assert.match(cookie, /kuka_meta_facebook_oauth=/);
    assert.match(cookie, /Path=\/api\/meta-facebook-oauth-callback/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("only an admin can start the Meta Ads authorization flow", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/rest/v1/users") {
      return json([{ id: "admin-1", login: "admin", role: "admin", store_id: null }]);
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const token = await createSessionToken(env, { id: "admin-1", login: "admin", role: "admin" });
    const response = await startOAuth({
      env,
      request: new Request("https://kukahome.uz/api/meta-ads-oauth-start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(new URL(body.authorization_url).origin, "https://www.facebook.com");
    const cookie = response.headers.get("Set-Cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.doesNotMatch(JSON.stringify(body), /meta-app-secret|meta-ads-service-role/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// The end-to-end path that actually runs in production: the dialog returns
// to the Facebook callback, which has to recognise a meta_ads state and
// finish the Lead Ads connect rather than the page connect.
test("the shared Facebook callback completes a Lead Ads authorization", async () => {
  const originalFetch = globalThis.fetch;
  const facebookCookie = {
    name: "kuka_meta_facebook_oauth",
    path: "/api/meta-facebook-oauth-callback",
  };
  const redirectUri = "https://kukahome.uz/api/meta-facebook-oauth-callback";
  const state = await createMetaOAuthState(env, { uid: "admin-1" }, redirectUri, "meta_ads");
  const writes = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "meta-ads-oauth-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "users") return json([{ id: "admin-1", role: "admin" }]);
      if (table === "social_channels" && method === "GET") return json([]);
      if (method === "POST" || method === "PATCH") {
        const body = JSON.parse(String(init.body));
        writes.push({ table, body });
        return json([body]);
      }
      return json([]);
    }
    if (url.pathname.endsWith("/oauth/access_token")) {
      return json({ access_token: "user-token", expires_in: 5184000 });
    }
    if (url.pathname.endsWith("/me/accounts")) {
      return json({ data: [{ id: "page-1", name: "KUKA HOME", access_token: "page-token" }] });
    }
    if (url.pathname.endsWith("/me/adaccounts")) return json({ data: [] });
    if (url.pathname.endsWith("/123456789/subscriptions")) {
      if (method === "GET") return json({ data: [] });
      return json({ success: true });
    }
    if (url.pathname.endsWith("/page-1/subscribed_apps")) return json({ success: true });
    if (url.pathname.endsWith("/page-1")) return json({ id: "page-1", name: "KUKA HOME" });
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set("code", "auth-code");
    callbackUrl.searchParams.set("state", state);
    const response = await finishSharedOAuth({
      env,
      request: new Request(callbackUrl, {
        headers: { Cookie: metaOAuthCookie(state, false, facebookCookie).split(";")[0] },
      }),
    });
    const html = await response.text();
    assert.match(html, /"success":true/);
    // It must report back as the Lead Ads flow, or the CRM would light up the
    // Facebook card instead of the Lead Forms one.
    assert.match(html, /kuka-meta-ads-oauth/);
    const channel = writes.find((write) => write.table === "social_channels")?.body;
    assert.equal(channel.platform, "meta_ads");
    assert.equal(channel.connection_type, "meta_lead_ads");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("callback connects selected Pages to leadgen and stores ad accounts server-side", async () => {
  const originalFetch = globalThis.fetch;
  const config = metaAdsOAuthConfig(env, "https://kukahome.uz/api/meta-ads-oauth-callback");
  const state = await createMetaOAuthState(env, { uid: "admin-1" }, config.redirectUri, "meta_ads");
  const writes = [];
  const subscriptions = [];
  const appSubscriptions = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "meta-ads-oauth-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "users") return json([{ id: "admin-1", role: "admin" }]);
      if (table === "social_channels" && method === "GET") return json([]);
      if (method === "POST" || method === "PATCH") {
        const body = JSON.parse(String(init.body));
        writes.push({ table, body });
        return json([body]);
      }
      return json([]);
    }
    if (url.pathname.endsWith("/oauth/access_token")) {
      if (url.searchParams.get("grant_type") === "fb_exchange_token") {
        return json({ access_token: "long-user-token", expires_in: 5184000 });
      }
      return json({ access_token: "short-user-token", expires_in: 3600 });
    }
    if (url.pathname.endsWith("/me/accounts")) {
      return json({ data: [{ id: "page-1", name: "KUKA HOME", access_token: "page-token", tasks: ["MODERATE"] }] });
    }
    if (url.pathname.endsWith("/me/adaccounts")) {
      return json({ data: [{ id: "act_99", account_id: "99", name: "KUKA Ads", account_status: 1, currency: "USD" }] });
    }
    if (url.pathname.endsWith("/123456789/subscriptions")) {
      if (method === "GET") {
        return json({ data: [{ object: "page", fields: [{ name: "messages" }] }] });
      }
      const body = new URLSearchParams(String(init.body));
      appSubscriptions.push(Object.fromEntries(body.entries()));
      assert.equal(init.headers.Authorization, "Bearer 123456789|meta-app-secret");
      return json({ success: true });
    }
    if (url.pathname.endsWith("/page-1/subscribed_apps")) {
      subscriptions.push(JSON.parse(String(init.body)));
      return json({ success: true });
    }
    if (url.pathname.endsWith("/page-1")) return json({ id: "page-1", name: "KUKA HOME" });
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const callbackUrl = new URL(config.redirectUri);
    callbackUrl.searchParams.set("code", "auth-code");
    callbackUrl.searchParams.set("state", state);
    const response = await finishOAuth({
      env,
      request: new Request(callbackUrl, {
        headers: { Cookie: metaOAuthCookie(state, false, cookieOptions).split(";")[0] },
      }),
    });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /"success":true/);
    assert.deepEqual(subscriptions, [{ subscribed_fields: ["leadgen"] }]);
    assert.equal(appSubscriptions[0].object, "page");
    assert.deepEqual(new Set(appSubscriptions[0].fields.split(",")), new Set(["leadgen", "messages"]));
    assert.equal(appSubscriptions[0].callback_url, "https://kukahome.uz/api/meta-webhook");
    const page = writes.find((write) => write.table === "social_channels")?.body;
    assert.equal(page.platform, "meta_ads");
    assert.equal(page.connection_type, "meta_lead_ads");
    assert.equal(page.access_token, "page-token");
    const account = writes.find((write) => write.table === "meta_ad_accounts")?.body;
    assert.equal(account.external_account_id, "99");
    assert.equal(account.access_token, "long-user-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
