import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost as metaWebhook } from "../functions/api/meta-webhook.js";
import { onRequestPost as postMessage } from "../functions/api/messages.js";
import { createSessionToken } from "../functions/api/_auth.js";
import { validateAndSubscribeMetaChannel } from "../functions/api/_social.js";

const env = {
  SUPABASE_URL: "https://inbox-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  META_APP_SECRET: "meta-app-secret",
  META_GRAPH_VERSION: "v25.0",
};

function json(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function signBody(secret, body) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `sha256=${Array.from(new Uint8Array(signed)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

test("a reply typed in the Instagram app is subscribed to and stored as outbound", async () => {
  const originalFetch = globalThis.fetch;
  let subscribedFields = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/me/subscribed_apps")) {
      subscribedFields = JSON.parse(String(init.body)).subscribed_fields;
      return json({ success: true });
    }
    if (url.pathname.endsWith("/me")) return json({ id: "ig-1", username: "kukahome" });
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    await validateAndSubscribeMetaChannel(env, {
      platform: "instagram",
      external_account_id: "ig-1",
      access_token: "ig-token",
    });
    // Without message_echoes Meta never reports a reply sent from the phone,
    // so the CRM shows the thread as still waiting for an answer.
    assert.ok(subscribedFields.includes("message_echoes"));
    assert.ok(subscribedFields.includes("comments"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an echoed outbound message is recorded as sent, not as an unread customer message", async () => {
  const originalFetch = globalThis.fetch;
  const channel = {
    id: "channel-1",
    platform: "instagram",
    status: "connected",
    external_account_id: "ig-1",
    access_token: "ig-token",
  };
  const writes = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "inbox-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "social_channels") return json([channel]);
      if (table === "conversations" && method === "GET") {
        return json([{ id: "conv-1", status: "new", unread_count: 0, contact_name: "Ali" }]);
      }
      if (table === "messages" && method === "GET") return json([]);
      if (method !== "GET") {
        writes.push({ table, method, body: JSON.parse(String(init.body)) });
        return json([]);
      }
      return json([]);
    }
    return json({});
  };
  try {
    const body = JSON.stringify({
      object: "instagram",
      entry: [{
        id: "ig-1",
        messaging: [{
          timestamp: 1786000000000,
          sender: { id: "ig-1" },
          recipient: { id: "customer-1" },
          message: { mid: "echo-1", text: "Salom, narxi 3 mln", is_echo: true },
        }],
      }],
    });
    const response = await metaWebhook({
      env,
      request: new Request("https://kukahome.uz/api/meta-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": await signBody(env.META_APP_SECRET, body),
        },
        body,
      }),
    });
    assert.equal(response.status, 200);
    const message = writes.find((w) => w.table === "messages" && w.method === "POST")?.body;
    assert.equal(message.direction, "out");
    assert.equal(message.sender_type, "channel");
    assert.equal(message.body, "Salom, narxi 3 mln");
    const convoPatch = writes.find((w) => w.table === "conversations" && w.method === "PATCH")?.body;
    assert.equal(convoPatch.status, "answered");
    // It must not bump unread_count - our own reply is not a new customer message.
    assert.equal(convoPatch.unread_count, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a comment opens its own thread instead of merging into the sender's DM thread", async () => {
  const originalFetch = globalThis.fetch;
  const channel = {
    id: "channel-1",
    platform: "instagram",
    status: "connected",
    external_account_id: "ig-1",
    access_token: "ig-token",
  };
  const writes = [];
  const conversationLookups = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "inbox-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "social_channels") return json([channel]);
      if (table === "conversations" && method === "GET") {
        conversationLookups.push(url.searchParams.get("external_chat_id"));
        return json([]);
      }
      if (table === "conversations" && method === "POST") {
        const body = JSON.parse(String(init.body));
        writes.push({ table, method, body });
        return json([{ id: "conv-comment-1", status: "new", unread_count: 0, ...body }]);
      }
      if (table === "messages" && method === "GET") return json([]);
      if (method !== "GET") {
        writes.push({ table, method, body: JSON.parse(String(init.body)) });
        return json([]);
      }
      return json([]);
    }
    return json({});
  };
  try {
    const body = JSON.stringify({
      object: "instagram",
      entry: [{
        id: "ig-1",
        changes: [{
          field: "comments",
          value: {
            id: "comment-99",
            text: "Narxi qancha?",
            from: { id: "customer-1", username: "dilorom4813" },
          },
        }],
      }],
    });
    await metaWebhook({
      env,
      request: new Request("https://kukahome.uz/api/meta-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": await signBody(env.META_APP_SECRET, body),
        },
        body,
      }),
    });
    // Keyed apart from the DM thread for the same person.
    assert.ok(conversationLookups.includes("eq.comment:customer-1"));
    const convo = writes.find((w) => w.table === "conversations" && w.method === "POST")?.body;
    assert.equal(convo.thread_type, "comment");
    assert.equal(convo.external_chat_id, "comment:customer-1");
    // The username must be used as the display name, never the numeric id.
    assert.equal(convo.contact_name, "dilorom4813");
    const message = writes.find((w) => w.table === "messages" && w.method === "POST")?.body;
    assert.equal(message.message_type, "comment");
    assert.equal(message.external_message_id, "comment-99");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("replying in a comment thread posts a comment reply, not a direct message", async () => {
  const originalFetch = globalThis.fetch;
  const graphCalls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "inbox-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "users") return json([{ id: "admin-1", login: "admin", role: "admin", store_id: null }]);
      if (table === "conversations" && method === "GET") {
        return json([{
          id: "conv-comment-1",
          platform: "instagram",
          thread_type: "comment",
          channel_id: "channel-1",
          external_chat_id: "comment:customer-1",
          status: "new",
        }]);
      }
      if (table === "conversations" && method === "PATCH") return json([{ id: "conv-comment-1" }]);
      if (table === "social_channels") {
        return json([{
          id: "channel-1",
          platform: "instagram",
          external_account_id: "ig-1",
          access_token: "ig-token",
        }]);
      }
      if (table === "messages" && method === "GET") {
        return json([{ external_message_id: "comment-99" }]);
      }
      if (method !== "GET") return json([]);
      return json([]);
    }
    graphCalls.push({ url: url.toString(), method, body: JSON.parse(String(init.body || "{}")) });
    return json({ id: "reply-1" });
  };
  try {
    const token = await createSessionToken(env, { id: "admin-1", login: "admin", role: "admin" });
    const response = await postMessage({
      env,
      request: new Request("https://kukahome.uz/api/messages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: "conv-comment-1", body: "Assalomu alaykum, 3 mln" }),
      }),
    });
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(graphCalls.length, 1);
    // Instagram exposes comment replies at /{comment-id}/replies - hitting
    // /me/messages here would have sent the customer an unexpected DM.
    assert.match(graphCalls[0].url, /\/v25\.0\/comment-99\/replies/);
    assert.equal(graphCalls[0].body.message, "Assalomu alaykum, 3 mln");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
