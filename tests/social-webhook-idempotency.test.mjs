import assert from "node:assert/strict";
import { recordIncomingMessage } from "../functions/api/_social.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

const conversation = {
  id: "11111111-1111-4111-a111-111111111111",
  status: "new",
  unread_count: 4,
};

let existingMessage = true;
let messageInserts = 0;
let unreadUpdates = 0;
let duplicateUpdates = 0;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const table = url.pathname.replace("/rest/v1/", "");
  const method = String(init.method || "GET").toUpperCase();

  if (table === "messages" && method === "GET") {
    return json(existingMessage ? [{ id: "22222222-2222-4222-a222-222222222222" }] : []);
  }
  if (table === "messages" && method === "PATCH") {
    duplicateUpdates += 1;
    return json([]);
  }
  if (table === "messages" && method === "POST") {
    messageInserts += 1;
    return json([], { status: 201 });
  }
  if (table === "conversations" && method === "PATCH") {
    unreadUpdates += 1;
    return json([]);
  }

  throw new Error(`Unexpected request: ${method} ${url}`);
};

try {
  const duplicate = await recordIncomingMessage(env, conversation, {
    body: "Retry",
    externalMessageId: "telegram-42",
  });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicateUpdates, 1);
  assert.equal(messageInserts, 0);
  assert.equal(unreadUpdates, 0);

  existingMessage = false;
  const fresh = await recordIncomingMessage(env, conversation, {
    body: "New",
    externalMessageId: "telegram-43",
  });
  assert.equal(fresh.duplicate, false);
  assert.equal(messageInserts, 1);
  assert.equal(unreadUpdates, 1);

  console.log("social webhook idempotency regression test passed");
} finally {
  globalThis.fetch = originalFetch;
}
