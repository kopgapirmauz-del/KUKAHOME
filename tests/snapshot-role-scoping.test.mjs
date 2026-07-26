import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import { onRequestPut } from "../functions/api/db.js";

const env = {
  SUPABASE_URL: "https://snapshot-scoping-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "snapshot-scoping-test-service-role-key",
};

const ADMIN = {
  id: "44444444-4444-4444-a444-444444444444",
  full_name: "Admin",
  login: "admin",
  role: "admin",
  store_id: null,
};

const MANAGER = {
  id: "55555555-5555-4555-a555-555555555555",
  full_name: "Aziz Manager",
  login: "aziz",
  role: "manager",
  store_id: null,
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

// The server holds the complete lists. A manager only ever sees their own
// rows, because scopeSnapshotForSession filters what it hands out.
function serverSnapshot() {
  return {
    meta: { updatedAt: "v1" },
    users: [ADMIN, MANAGER],
    stores: [],
    clients: [
      { id: "client-of-aziz", managerId: MANAGER.id },
      { id: "client-of-someone-else", managerId: "other" },
      { id: "client-of-a-third-manager", managerId: "third" },
    ],
    notifications: [{ id: 1, toUserId: MANAGER.id }, { id: 2, toUserId: "other" }],
    salesChecks: [],
    warehouseOrders: [],
    warehouseStock: [],
    vacancies: [],
  };
}

async function putAs(user, body, snapshotRef) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users" && method === "GET") return json([ADMIN, MANAGER]);
    if (url.pathname === "/storage/v1/bucket/crm-data-private" && method === "GET") {
      return json({ id: "crm-data-private", public: false });
    }
    if (url.pathname.includes("/storage/v1/object/crm-data-private/system/crm-db.json")) {
      if (method === "GET") return json(snapshotRef.value);
      if (method === "POST") {
        snapshotRef.value = JSON.parse(new TextDecoder().decode(init.body));
        return json({ Key: "system/crm-db.json" });
      }
    }
    if (url.pathname.startsWith("/rest/v1/")) return json([]);
    throw new Error(`Unexpected request: ${method} ${url}`);
  };
  try {
    const token = await createSessionToken(env, user);
    return await onRequestPut({
      env,
      request: new Request("https://crm.test/api/db", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "If-Match": "\"v1\"",
        },
        body: JSON.stringify(body),
      }),
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("a manager's save cannot truncate the stored client list to their own rows", async () => {
  const snapshotRef = { value: serverSnapshot() };
  // What the manager's browser holds: only the rows the server gave them.
  const res = await putAs(MANAGER, {
    meta: { updatedAt: "v1", remoteVersion: "v1" },
    users: [ADMIN, MANAGER],
    stores: [],
    clients: [{ id: "client-of-aziz", managerId: MANAGER.id }],
    notifications: [{ id: 1, toUserId: MANAGER.id }],
    salesChecks: [{ id: "the-check-they-actually-saved" }],
    warehouseOrders: [],
    warehouseStock: [],
    vacancies: [],
  }, snapshotRef);

  assert.equal(res.status, 200);
  assert.deepEqual(
    snapshotRef.value.clients.map((c) => c.id).sort(),
    ["client-of-a-third-manager", "client-of-aziz", "client-of-someone-else"],
    "all three clients must survive a manager's save",
  );
  assert.equal(snapshotRef.value.notifications.length, 2, "notifications must not be truncated either");
  // The edit they actually made is still stored.
  assert.deepEqual(snapshotRef.value.salesChecks, [{ id: "the-check-they-actually-saved" }]);
});

test("an admin still writes the full client list", async () => {
  const snapshotRef = { value: serverSnapshot() };
  const res = await putAs(ADMIN, {
    meta: { updatedAt: "v1", remoteVersion: "v1" },
    users: [ADMIN, MANAGER],
    stores: [],
    clients: [
      { id: "client-of-aziz", managerId: MANAGER.id },
      { id: "client-of-someone-else", managerId: "other" },
      { id: "newly-added-by-admin", managerId: "third" },
    ],
    notifications: [{ id: 1, toUserId: MANAGER.id }],
    salesChecks: [],
    warehouseOrders: [],
    warehouseStock: [],
    vacancies: [],
  }, snapshotRef);

  assert.equal(res.status, 200);
  assert.ok(
    snapshotRef.value.clients.some((c) => c.id === "newly-added-by-admin"),
    "an admin has the complete list, so their write must be honoured",
  );
  assert.equal(snapshotRef.value.clients.length, 3);
});
