import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost as metaWebhook } from "../functions/api/meta-webhook.js";
import { onRequestPost as postMessage } from "../functions/api/messages.js";
import { onRequestPost as connectChannel } from "../functions/api/integrations.js";
import { createSessionToken } from "../functions/api/_auth.js";
import { normalizeWhatsappNumber } from "../functions/api/_social.js";

const env = {
  SUPABASE_URL: "https://whatsapp-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  META_APP_SECRET: "meta-app-secret",
  META_WEBHOOK_VERIFY_TOKEN: "kuka-verify",
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

test("a WhatsApp number is normalised to the bare digits Meta expects", () => {
  assert.equal(normalizeWhatsappNumber("+998 (90) 123-45-67"), "998901234567");
  assert.equal(normalizeWhatsappNumber("998901234567"), "998901234567");
  assert.equal(normalizeWhatsappNumber(""), "");
});

test("connecting WhatsApp verifies the phone number id before storing the token", async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "whatsapp-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "users") return json([{ id: "admin-1", login: "admin", role: "admin", store_id: null }]);
      if (table === "social_channels" && method === "GET") return json([]);
      if (method !== "GET") {
        const body = JSON.parse(String(init.body));
        writes.push({ table, body });
        return json([body]);
      }
      return json([]);
    }
    // The Graph lookup that proves the token can actually use this number.
    assert.equal(url.hostname, "graph.facebook.com");
    assert.match(url.pathname, /\/v25\.0\/12345$/);
    assert.equal(init.headers.Authorization, "Bearer wa-token");
    return json({ id: "12345", display_phone_number: "+998 90 123 45 67", verified_name: "KUKA HOME" });
  };
  try {
    const token = await createSessionToken(env, { id: "admin-1", login: "admin", role: "admin" });
    const response = await connectChannel({
      env,
      request: new Request("https://kukahome.uz/api/integrations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "whatsapp", phoneNumberId: "12345", accessToken: "wa-token" }),
      }),
    });
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.display_phone_number, "+998 90 123 45 67");
    assert.equal(data.webhook_url, "https://kukahome.uz/api/meta-webhook");
    const channel = writes.find((w) => w.table === "social_channels")?.body;
    assert.equal(channel.platform, "whatsapp");
    assert.equal(channel.connection_type, "whatsapp_cloud");
    assert.equal(channel.display_name, "KUKA HOME");
    assert.equal(channel.status, "connected");
    // The token must never come back to the browser.
    assert.doesNotMatch(JSON.stringify(data), /wa-token/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an inbound WhatsApp message lands in the inbox under the sender's profile name", async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "whatsapp-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "social_channels") {
        return json([{
          id: "channel-wa",
          platform: "whatsapp",
          status: "connected",
          external_account_id: "12345",
          access_token: "wa-token",
        }]);
      }
      if (table === "conversations" && method === "GET") return json([]);
      if (table === "conversations" && method === "POST") {
        const body = JSON.parse(String(init.body));
        writes.push({ table, body });
        return json([{ id: "conv-wa", status: "new", unread_count: 0, ...body }]);
      }
      if (table === "messages" && method === "GET") return json([]);
      if (method !== "GET") {
        writes.push({ table, body: JSON.parse(String(init.body)) });
        return json([]);
      }
      return json([]);
    }
    return json({});
  };
  try {
    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{
        id: "waba-1",
        changes: [{
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "998901234567", phone_number_id: "12345" },
            contacts: [{ profile: { name: "Dilorom" }, wa_id: "998907654321" }],
            messages: [{
              from: "998907654321",
              id: "wamid.ABC",
              timestamp: "1786000000",
              type: "text",
              text: { body: "Divan narxi qancha?" },
            }],
          },
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
    const convo = writes.find((w) => w.table === "conversations")?.body;
    assert.equal(convo.platform, "whatsapp");
    assert.equal(convo.external_chat_id, "998907654321");
    assert.equal(convo.contact_name, "Dilorom");
    assert.equal(convo.contact_handle, "+998907654321");
    const message = writes.find((w) => w.table === "messages")?.body;
    assert.equal(message.direction, "in");
    assert.equal(message.body, "Divan narxi qancha?");
    assert.equal(message.external_message_id, "wamid.ABC");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("replying on a WhatsApp thread posts to the phone number's messages endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const graphCalls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "whatsapp-test.supabase.co") {
      const table = url.pathname.replace("/rest/v1/", "");
      if (table === "users") return json([{ id: "admin-1", login: "admin", role: "admin", store_id: null }]);
      if (table === "conversations" && method === "GET") {
        return json([{
          id: "conv-wa",
          platform: "whatsapp",
          thread_type: "dm",
          channel_id: "channel-wa",
          external_chat_id: "998907654321",
          status: "new",
        }]);
      }
      if (table === "conversations") return json([{ id: "conv-wa" }]);
      if (table === "social_channels") {
        return json([{
          id: "channel-wa",
          platform: "whatsapp",
          external_account_id: "12345",
          access_token: "wa-token",
        }]);
      }
      return json([]);
    }
    graphCalls.push({ url: url.toString(), body: JSON.parse(String(init.body || "{}")) });
    return json({ messaging_product: "whatsapp", messages: [{ id: "wamid.OUT" }] });
  };
  try {
    const token = await createSessionToken(env, { id: "admin-1", login: "admin", role: "admin" });
    const response = await postMessage({
      env,
      request: new Request("https://kukahome.uz/api/messages", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: "conv-wa", body: "3 mln so'm" }),
      }),
    });
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(graphCalls.length, 1);
    assert.match(graphCalls[0].url, /\/v25\.0\/12345\/messages$/);
    // messaging_product is mandatory on every Cloud API send.
    assert.equal(graphCalls[0].body.messaging_product, "whatsapp");
    assert.equal(graphCalls[0].body.to, "998907654321");
    assert.equal(graphCalls[0].body.text.body, "3 mln so'm");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
