import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import {
  buildInstagramAuthorizationUrl,
  createMetaOAuthState,
  metaOAuthConfig,
  metaOAuthCookie,
  verifyMetaOAuthState,
} from "../functions/api/_meta_oauth.js";
import { onRequestPost as startOAuth } from "../functions/api/meta-oauth-start.js";
import { onRequestGet as finishOAuth } from "../functions/api/meta-oauth-callback.js";
import { onRequestGet as verifyMetaWebhook } from "../functions/api/meta-webhook.js";

const env = {
  SUPABASE_URL: "https://meta-oauth-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "meta-oauth-service-role",
  META_APP_ID: "123456789",
  META_APP_SECRET: "meta-app-secret",
  META_INSTAGRAM_APP_ID: "987654321",
  META_INSTAGRAM_APP_SECRET: "meta-instagram-app-secret",
  META_WEBHOOK_VERIFY_TOKEN: "meta-webhook-verify",
  META_GRAPH_VERSION: "v25.0",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("OAuth state is signed, short-lived, and requests only the required Instagram permissions", async () => {
  const config = metaOAuthConfig(env, "https://kukahome.uz/api/meta-oauth-start");
  const state = await createMetaOAuthState(env, { uid: "admin-1" }, config.redirectUri);
  const verified = await verifyMetaOAuthState(env, state);
  assert.equal(verified.uid, "admin-1");
  assert.equal(verified.redirect_uri, "https://kukahome.uz/api/meta-oauth-callback");
  const tamperedState = `${state.slice(0, -1)}${state.endsWith("x") ? "y" : "x"}`;
  assert.equal(await verifyMetaOAuthState(env, tamperedState), null);

  const authorization = new URL(buildInstagramAuthorizationUrl(config, state));
  assert.equal(authorization.origin, "https://www.instagram.com");
  assert.equal(authorization.pathname, "/oauth/authorize");
  assert.equal(authorization.searchParams.get("client_id"), env.META_INSTAGRAM_APP_ID);
  assert.equal(authorization.searchParams.get("state"), state);
  assert.deepEqual(
    authorization.searchParams.get("scope").split(","),
    [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
    ],
  );
});

test("only a current CRM admin can start OAuth and the state stays in an HttpOnly cookie", async () => {
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
      request: new Request("https://kukahome.uz/api/meta-oauth-start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(new URL(body.authorization_url).origin, "https://www.instagram.com");
    const cookie = response.headers.get("Set-Cookie");
    assert.match(cookie, /kuka_meta_oauth=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Lax/);
    assert.doesNotMatch(JSON.stringify(body), /meta-app-secret|meta-oauth-service-role/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OAuth callback exchanges the code, subscribes the account, and stores only the long-lived token", async () => {
  const originalFetch = globalThis.fetch;
  const config = metaOAuthConfig(env, "https://kukahome.uz/api/meta-oauth-callback");
  const state = await createMetaOAuthState(env, { uid: "admin-1" }, config.redirectUri);
  const writes = [];
  const providerRequests = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "meta-oauth-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "users") return json([{ id: "admin-1", role: "admin" }]);
      if (table === "social_channels" && method === "GET") return json([]);
      if (table === "social_channels" && method === "POST") {
        const body = JSON.parse(String(init.body));
        writes.push(body);
        return json([body]);
      }
    }
    providerRequests.push({ url: url.toString(), method, init });
    if (url.hostname === "api.instagram.com") {
      return json({ access_token: "short-lived-token", user_id: "ig-user-1" });
    }
    if (url.pathname === "/access_token") {
      return json({ access_token: "long-lived-token", expires_in: 5184000 });
    }
    if (url.pathname.endsWith("/me")) {
      assert.equal(url.searchParams.get("access_token"), "long-lived-token");
      return json({ id: "ig-user-1", username: "kukahome" });
    }
    if (url.pathname.endsWith("/me/subscribed_apps")) {
      return json({ success: true });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const callbackUrl = new URL(config.redirectUri);
    callbackUrl.searchParams.set("code", "authorization-code");
    callbackUrl.searchParams.set("state", state);
    const response = await finishOAuth({
      env,
      request: new Request(callbackUrl, {
        headers: { Cookie: metaOAuthCookie(state).split(";")[0] },
      }),
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /"success":true/);
    assert.doesNotMatch(html, /long-lived-token|short-lived-token/);
    assert.match(response.headers.get("Set-Cookie"), /Max-Age=0/);
    assert.equal(providerRequests[0].url, "https://api.instagram.com/oauth/access_token");
    assert.equal(writes.length, 1);
    assert.equal(writes[0].access_token, "long-lived-token");
    assert.equal(writes[0].external_account_id, "ig-user-1");
    assert.equal(writes[0].connection_type, "instagram_oauth");
    assert.equal(writes[0].status, "connected");
    assert.equal(writes[0].connected_by, "admin-1");
    assert.ok(writes[0].token_expires_at);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("callback refuses a missing or mismatched state before contacting Meta", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return json([]);
  };
  try {
    const response = await finishOAuth({
      env,
      request: new Request("https://kukahome.uz/api/meta-oauth-callback?code=code&state=wrong", {
        headers: { Cookie: "kuka_meta_oauth=different" },
      }),
    });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /invalid_state/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Meta webhook accepts the single app-level verify token without reading channel secrets", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return json([]);
  };
  try {
    const request = new Request(
      "https://kukahome.uz/api/meta-webhook?hub.mode=subscribe&hub.verify_token=meta-webhook-verify&hub.challenge=challenge-123",
    );
    const response = await verifyMetaWebhook({ env, request });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "challenge-123");
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
