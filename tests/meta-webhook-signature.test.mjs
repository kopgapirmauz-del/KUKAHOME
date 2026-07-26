import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost } from "../functions/api/meta-webhook.js";

const APP_SECRET = "meta-app-secret-for-tests";
const env = {
  SUPABASE_URL: "https://meta-webhook-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "meta-webhook-test-service-role-key",
  META_APP_SECRET: APP_SECRET,
};

const CHANNEL = {
  id: "channel-1",
  platform: "facebook",
  external_account_id: "page-100",
  status: "connected",
  unread_count: 0,
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

async function sign(body, secret = APP_SECRET) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `sha256=${Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// Captures every write so an accepted-but-forged delivery is visible.
function stubSupabase(writes) {
  return async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (method !== "GET") writes.push(`${method} ${url.pathname}`);
    if (url.pathname === "/rest/v1/social_channels") return json([CHANNEL]);
    if (url.pathname === "/rest/v1/conversations") {
      return json([{ ...CHANNEL, id: "convo-1", status: "new", unread_count: 0 }]);
    }
    if (url.pathname === "/rest/v1/messages") return json([]);
    return json([]);
  };
}

const BODY = JSON.stringify({
  object: "page",
  entry: [{
    id: "page-100",
    messaging: [{ sender: { id: "attacker-chosen-recipient" }, message: { mid: "m1", text: "hello" } }],
  }],
});

function post(body, signature) {
  const headers = { "Content-Type": "application/json" };
  if (signature) headers["X-Hub-Signature-256"] = signature;
  return new Request("https://crm.test/api/meta-webhook", { method: "POST", headers, body });
}

test("an unsigned delivery is rejected and writes nothing", async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = stubSupabase(writes);
  try {
    const res = await onRequestPost({ env, request: post(BODY, null) });
    assert.equal(res.status, 403);
    assert.deepEqual(writes, [], "a forged delivery must not create a conversation or message");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a delivery signed with the wrong secret is rejected", async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = stubSupabase(writes);
  try {
    const res = await onRequestPost({ env, request: post(BODY, await sign(BODY, "wrong-secret")) });
    assert.equal(res.status, 403);
    assert.deepEqual(writes, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a valid signature over different bytes is rejected", async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = stubSupabase(writes);
  try {
    // Correctly signed, but for a different payload - a replayed signature.
    const res = await onRequestPost({ env, request: post(BODY, await sign("{\"object\":\"page\"}")) });
    assert.equal(res.status, 403);
    assert.deepEqual(writes, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("delivery is refused when no app secret is configured", async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = stubSupabase(writes);
  try {
    const res = await onRequestPost({
      env: { ...env, META_APP_SECRET: "" },
      request: post(BODY, await sign(BODY)),
    });
    assert.equal(res.status, 403, "must fail closed rather than accept anything");
    assert.deepEqual(writes, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a correctly signed delivery is accepted and recorded", async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = stubSupabase(writes);
  try {
    const res = await onRequestPost({ env, request: post(BODY, await sign(BODY)) });
    assert.equal(res.status, 200);
    assert.ok(
      writes.some((entry) => entry.includes("/rest/v1/messages")),
      `a genuine delivery must still be recorded, saw: ${writes.join(", ")}`,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
