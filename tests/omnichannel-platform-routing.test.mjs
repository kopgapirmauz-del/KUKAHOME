import assert from "node:assert/strict";
import test from "node:test";
import {
  metaSendMessage,
  telegramSendMessage,
  telegramSetWebhook,
} from "../functions/api/_social.js";
import { onRequestPost as telegramWebhook } from "../functions/api/telegram-webhook.js";

test("Instagram uses the Instagram Graph host and account-scoped messages endpoint", async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (input, init = {}) => {
    captured = { url: String(input), init };
    return Response.json({ recipient_id: "igsid-1", message_id: "ig-mid-1" });
  };
  try {
    const result = await metaSendMessage(
      { META_GRAPH_VERSION: "v25.0" },
      {
        platform: "instagram",
        external_account_id: "ig-business-1",
        access_token: "ig-access-token",
      },
      "igsid-1",
      "Salom",
    );
    assert.equal(
      captured.url,
      "https://graph.instagram.com/v25.0/ig-business-1/messages",
    );
    assert.equal(captured.init.headers.Authorization, "Bearer ig-access-token");
    assert.deepEqual(JSON.parse(captured.init.body), {
      recipient: { id: "igsid-1" },
      message: { text: "Salom" },
    });
    assert.equal(result.message_id, "ig-mid-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Facebook keeps the Messenger host while honoring a configured Graph version", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  globalThis.fetch = async (input) => {
    capturedUrl = String(input);
    return Response.json({ message_id: "fb-mid-1" });
  };
  try {
    await metaSendMessage(
      { META_GRAPH_VERSION: "v24.0" },
      {
        platform: "facebook",
        external_account_id: "page-1",
        access_token: "page-token",
      },
      "psid-1",
      "Hello",
    );
    assert.equal(capturedUrl, "https://graph.facebook.com/v24.0/me/messages");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Telegram webhook registration includes Business updates and replies with its connection id", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init = {}) => {
    requests.push({ url: String(input), body: JSON.parse(String(init.body || "{}")) });
    return Response.json({ ok: true, result: { message_id: 42 } });
  };
  try {
    await telegramSetWebhook("bot-token", "https://crm.test/api/telegram-webhook", "secret");
    await telegramSendMessage("bot-token", "customer-chat", "Javob", "business-connection-1");
    assert.deepEqual(
      requests[0].body.allowed_updates.filter((item) => item.includes("business")),
      [
        "business_connection",
        "business_message",
        "edited_business_message",
        "deleted_business_messages",
      ],
    );
    assert.equal(requests[1].body.business_connection_id, "business-connection-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Telegram Business inbound messages are stored against the customer chat", async () => {
  const env = {
    SUPABASE_URL: "https://telegram-business-test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
  };
  const channel = {
    id: "channel-1",
    platform: "telegram",
    status: "connected",
    webhook_verify_token: "webhook-secret",
    business_account_user_id: "999",
  };
  const originalFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const table = url.pathname.replace("/rest/v1/", "");
    const method = String(init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : null;
    if (method !== "GET") writes.push({ table, method, body });
    if (table === "social_channels") return Response.json([channel]);
    if (table === "conversations" && method === "GET") return Response.json([]);
    if (table === "conversations" && method === "POST") {
      return Response.json([{ id: "conversation-1", status: "new", unread_count: 0, ...body }]);
    }
    if (table === "messages" && method === "GET") return Response.json([]);
    return Response.json([]);
  };
  try {
    const request = new Request("https://crm.test/api/telegram-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "webhook-secret",
      },
      body: JSON.stringify({
        update_id: 100,
        business_message: {
          message_id: 7,
          date: 1785200000,
          business_connection_id: "business-connection-1",
          from: { id: 123, first_name: "Mijoz", username: "customer" },
          chat: { id: 123, type: "private", first_name: "Mijoz", username: "customer" },
          text: "Divan narxi qancha?",
        },
      }),
    });
    const response = await telegramWebhook({ env, request });
    assert.equal(response.status, 200);
    const conversationInsert = writes.find((entry) => entry.table === "conversations" && entry.method === "POST");
    const messageInsert = writes.find((entry) => entry.table === "messages" && entry.method === "POST");
    assert.equal(conversationInsert.body.external_chat_id, "123");
    assert.equal(conversationInsert.body.business_connection_id, "business-connection-1");
    assert.equal(messageInsert.body.direction, "in");
    assert.equal(messageInsert.body.body, "Divan narxi qancha?");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
