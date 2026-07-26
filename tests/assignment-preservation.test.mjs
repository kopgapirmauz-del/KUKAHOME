import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import { onRequestPut as clientsPut } from "../functions/api/clients.js";
import { onRequestDelete as managersDelete } from "../functions/api/managers.js";

const env = {
  SUPABASE_URL: "https://assignment-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "assignment-test-service-role-key",
};

const ADMIN = { id: "aaaaaaaa-1111-4111-a111-111111111111", full_name: "Admin One", login: "admin", role: "admin", store_id: null };
const MANAGER = { id: "bbbbbbbb-2222-4222-a222-222222222222", full_name: "Aziz Karimov", login: "aziz", role: "manager", store_id: null };

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

test("editing a client without naming a manager keeps the existing assignment", async () => {
  const originalFetch = globalThis.fetch;
  let patched = null;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users") return json([ADMIN, MANAGER]);
    if (url.pathname === "/rest/v1/stores") return json([{ id: "store-1", name: "Main" }]);
    if (url.pathname === "/rest/v1/clients") {
      if (method === "PATCH") {
        patched = JSON.parse(String(init.body));
        return json([]);
      }
      return json([{ id: "client-1", manager_id: MANAGER.id }]);
    }
    return json([]);
  };
  try {
    const token = await createSessionToken(env, ADMIN);
    // An admin fixes a typo in the note and does not resend `manager`.
    const res = await clientsPut({
      env,
      request: new Request("https://crm.test/api/clients", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: "client-1", note: "corrected note", showroom: "Main" }),
      }),
    });
    assert.equal(res.status, 200);
    assert.ok(patched, "a PATCH must have been issued");
    assert.equal(
      "manager_id" in patched,
      false,
      "manager_id must be left untouched rather than nulled, which would orphan the client",
    );
    assert.equal(patched.note, "corrected note");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("naming a manager that resolves still reassigns the client", async () => {
  const originalFetch = globalThis.fetch;
  let patched = null;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users") return json([ADMIN, MANAGER]);
    if (url.pathname === "/rest/v1/stores") return json([{ id: "store-1", name: "Main" }]);
    if (url.pathname === "/rest/v1/clients") {
      if (method === "PATCH") {
        patched = JSON.parse(String(init.body));
        return json([]);
      }
      return json([{ id: "client-1", manager_id: null }]);
    }
    return json([]);
  };
  try {
    const token = await createSessionToken(env, ADMIN);
    const res = await clientsPut({
      env,
      request: new Request("https://crm.test/api/clients", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: "client-1", manager: "Aziz Karimov", showroom: "Main" }),
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(patched.manager_id, MANAGER.id);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a refused manager deletion does not unassign that manager's clients", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    calls.push(`${method} ${url.pathname}${url.searchParams.has("manager_id") ? "?manager_id" : ""}`);
    if (url.pathname === "/rest/v1/users") {
      // role=neq.admin means deleting an admin removes nothing.
      if (method === "DELETE") return json([]);
      return json([ADMIN, MANAGER]);
    }
    return json([]);
  };
  try {
    const token = await createSessionToken(env, ADMIN);
    const res = await managersDelete({
      env,
      request: new Request("https://crm.test/api/managers", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: `mgr_${ADMIN.id}` }),
      }),
    });
    assert.equal(res.status, 409, "a deletion that removed nothing must not report success");
    assert.ok(
      !calls.some((c) => c.startsWith("PATCH /rest/v1/clients")),
      `clients must not be unassigned when nothing was deleted: ${calls.join(", ")}`,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a genuine manager deletion still unassigns their clients", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    calls.push(`${method} ${url.pathname}`);
    if (url.pathname === "/rest/v1/users") {
      if (method === "DELETE") return json([{ id: MANAGER.id }]);
      return json([ADMIN, MANAGER]);
    }
    return json([]);
  };
  try {
    const token = await createSessionToken(env, ADMIN);
    const res = await managersDelete({
      env,
      request: new Request("https://crm.test/api/managers", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: `mgr_${MANAGER.id}` }),
      }),
    });
    assert.equal(res.status, 200);
    assert.ok(calls.includes("PATCH /rest/v1/clients"), "their clients must still be unassigned");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
