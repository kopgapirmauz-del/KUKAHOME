import assert from "node:assert/strict";
import { createSessionToken } from "../functions/api/_auth.js";
import {
  onRequestGet as getConversations,
  onRequestPut as updateConversation,
} from "../functions/api/conversations.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

const managerA = {
  id: "11111111-1111-4111-a111-111111111111",
  login: "manager-a",
  role: "manager",
};
const managerB = {
  id: "22222222-2222-4222-a222-222222222222",
  login: "manager-b",
  role: "manager",
};
const unassignedId = "33333333-3333-4333-a333-333333333333";
const assignedToBId = "44444444-4444-4444-a444-444444444444";

const conversations = new Map([
  [unassignedId, {
    id: unassignedId,
    channel_id: "55555555-5555-4555-a555-555555555555",
    platform: "telegram",
    contact_name: "New lead",
    assigned_manager_id: null,
    status: "new",
    unread_count: 1,
  }],
  [assignedToBId, {
    id: assignedToBId,
    channel_id: "55555555-5555-4555-a555-555555555555",
    platform: "telegram",
    contact_name: "Manager B lead",
    assigned_manager_id: managerB.id,
    status: "open",
    unread_count: 0,
  }],
]);

let listScope = "";
let lastClaim = null;

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

  if (table === "social_channels") return json([]);
  if (table === "users") return json([managerA, managerB]);

  if (table === "conversations" && method === "GET") {
    const idFilter = url.searchParams.get("id");
    if (idFilter) {
      const id = idFilter.replace(/^eq\./, "");
      const row = conversations.get(id);
      return json(row ? [row] : []);
    }
    listScope = url.searchParams.get("or") || "";
    return json([conversations.get(unassignedId)]);
  }

  if (table === "conversations" && method === "PATCH") {
    const id = String(url.searchParams.get("id") || "").replace(/^eq\./, "");
    const row = conversations.get(id);
    const body = JSON.parse(String(init.body || "{}"));
    const scope = url.searchParams.get("or") || "";
    if (!row) return json([]);
    const canClaim = !row.assigned_manager_id || row.assigned_manager_id === managerA.id;
    if (scope && !canClaim) return json([]);
    const updated = { ...row, ...body };
    conversations.set(id, updated);
    lastClaim = { body, scope };
    return json([updated]);
  }

  throw new Error(`Unexpected request: ${method} ${url}`);
};

try {
  const token = await createSessionToken(env, managerA);
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const listResponse = await getConversations({
    env,
    request: new Request("https://crm.test/api/conversations", { headers }),
  });
  assert.equal(listResponse.status, 200);
  assert.match(listScope, /assigned_manager_id\.eq\./);
  assert.match(listScope, /assigned_manager_id\.is\.null/);

  const forbiddenResponse = await updateConversation({
    env,
    request: new Request("https://crm.test/api/conversations", {
      method: "PUT",
      headers,
      body: JSON.stringify({ id: assignedToBId, status: "closed" }),
    }),
  });
  assert.equal(forbiddenResponse.status, 403);

  const crossAssignResponse = await updateConversation({
    env,
    request: new Request("https://crm.test/api/conversations", {
      method: "PUT",
      headers,
      body: JSON.stringify({ id: unassignedId, assigned_manager_id: managerB.id }),
    }),
  });
  assert.equal(crossAssignResponse.status, 403);

  const claimResponse = await updateConversation({
    env,
    request: new Request("https://crm.test/api/conversations", {
      method: "PUT",
      headers,
      body: JSON.stringify({ id: unassignedId, assigned_manager_id: managerA.id }),
    }),
  });
  assert.equal(claimResponse.status, 200);
  assert.equal(lastClaim?.body.assigned_manager_id, managerA.id);
  assert.match(lastClaim?.scope || "", /assigned_manager_id\.is\.null/);

  console.log("conversation access API regression test passed");
} finally {
  globalThis.fetch = originalFetch;
}
