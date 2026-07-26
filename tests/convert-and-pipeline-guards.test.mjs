import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import { onRequestPut as conversationsPut } from "../functions/api/conversations.js";
import { onRequestPost as pipelinePost } from "../functions/api/pipeline.js";

const env = {
  SUPABASE_URL: "https://guards-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "guards-test-service-role-key",
};

const ADMIN = { id: "cccccccc-3333-4333-a333-333333333333", full_name: "Admin", login: "admin", role: "admin", store_id: null };

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

test("two concurrent conversions create only one client", async () => {
  const originalFetch = globalThis.fetch;
  const clientInserts = [];
  // The row starts unconverted; the first gated PATCH flips it.
  let converted = false;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users") return json([ADMIN]);
    if (url.pathname === "/rest/v1/conversations") {
      if (method === "GET") {
        return json([{ id: "convo-1", platform: "instagram", client_id: null, assigned_manager_id: null, status: "new" }]);
      }
      if (method === "PATCH") {
        // Honour the client_id=is.null condition the gate relies on.
        if (url.searchParams.get("client_id") === "is.null") {
          if (converted) return json([]);
          converted = true;
          return json([{ id: "convo-1", platform: "instagram", client_id: null, is_lead: true, assigned_manager_id: null }]);
        }
        return json([{ id: "convo-1", platform: "instagram", client_id: "client-x", is_lead: true }]);
      }
    }
    if (url.pathname === "/rest/v1/clients" && method === "POST") {
      clientInserts.push(1);
      return json([{ id: "client-x" }]);
    }
    return json([]);
  };

  try {
    const token = await createSessionToken(env, ADMIN);
    const makeRequest = () => new Request("https://crm.test/api/conversations", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: "convo-1", convert_to_lead: true }),
    });

    const first = await conversationsPut({ env, request: makeRequest() });
    const second = await conversationsPut({ env, request: makeRequest() });

    assert.equal(first.status, 200, "the first conversion must succeed");
    assert.equal(second.status, 409, "the second must be refused, not silently duplicated");
    assert.equal(clientInserts.length, 1, "exactly one client row may be created");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a storage failure makes a pipeline save fail instead of overwriting history", async () => {
  const originalFetch = globalThis.fetch;
  const uploads = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users") return json([ADMIN]);
    if (url.pathname === "/rest/v1/clients") return json([{ id: "client-1", manager_id: ADMIN.id }]);
    if (url.pathname.startsWith("/storage/v1/bucket")) return json({ id: "crm-private", public: false });
    if (url.pathname.includes("/storage/v1/object/")) {
      // The existing record cannot be read: Supabase Storage is failing.
      if (method === "GET") return new Response("upstream error", { status: 500 });
      if (method === "POST") {
        uploads.push(String(url.pathname));
        return json({});
      }
    }
    return json([]);
  };

  try {
    const token = await createSessionToken(env, ADMIN);
    const res = await pipelinePost({
      env,
      request: new Request("https://crm.test/api/pipeline", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        // A stale version: with a readable record this must be a 409.
        body: JSON.stringify({ clientId: "client-1", stage: "won", version: "stale-version" }),
      }),
    });

    assert.notEqual(res.status, 200, "an unreadable existing record must not be treated as absent");
    assert.deepEqual(uploads, [], "nothing may be written when the prior state is unknown");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
