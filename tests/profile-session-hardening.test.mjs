import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createSessionToken, requireAuth, verifySessionToken } from "../functions/api/_auth.js";
import { onRequestGet as getDb, onRequestPut as putDb } from "../functions/api/db.js";
import { onRequestGet, onRequestPut } from "../functions/api/profile.js";

const env = {
  SUPABASE_URL: "https://profile-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "profile-test-service-role-key",
};

const user = {
  id: "11111111-1111-4111-a111-111111111111",
  full_name: "Sales Manager",
  login: "manager",
  role: "manager",
  store_id: "22222222-2222-4222-a222-222222222222",
  phone: "+998901112233",
  created_at: "2026-07-24T00:00:00.000Z",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

test("profile endpoint verifies the current user and never permits role escalation", async () => {
  const originalFetch = globalThis.fetch;
  const patches = [];
  const passwordChanges = [];
  const current = { ...user };

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    const table = url.pathname.replace("/rest/v1/", "");

    if (table === "users" && method === "GET") return json([current]);
    if (table === "users" && method === "PATCH") {
      const body = JSON.parse(String(init.body || "{}"));
      patches.push(body);
      Object.assign(current, body);
      return json([]);
    }
    if (table === "stores" && method === "GET") {
      return json([{ id: user.store_id, name: "Main showroom" }]);
    }
    if (table === "rpc/verify_login" && method === "POST") {
      const body = JSON.parse(String(init.body || "{}"));
      return json(body.p_password === "correct-current" ? [current] : []);
    }
    if (table === "rpc/set_user_password" && method === "POST") {
      passwordChanges.push(JSON.parse(String(init.body || "{}")));
      return json(null);
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const token = await createSessionToken(env, user);
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const getResponse = await onRequestGet({
      env,
      request: new Request("https://crm.test/api/profile", { headers }),
    });
    assert.equal(getResponse.status, 200);
    const loaded = await getResponse.json();
    assert.equal(loaded.user.role, "manager");
    assert.equal("password" in loaded.user, false);

    const wrongPassword = await onRequestPut({
      env,
      request: new Request("https://crm.test/api/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          full_name: "Updated Manager",
          login: "updated-manager",
          current_password: "wrong",
          new_password: "new-secure-password",
          role: "admin",
          store_id: null,
        }),
      }),
    });
    assert.equal(wrongPassword.status, 403);
    assert.equal(patches.length, 0);
    assert.equal(passwordChanges.length, 0);

    const updateResponse = await onRequestPut({
      env,
      request: new Request("https://crm.test/api/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          full_name: "Updated Manager",
          login: "updated-manager",
          phone: "+998909998877",
          current_password: "correct-current",
          new_password: "new-secure-password",
          role: "admin",
          store_id: null,
        }),
      }),
    });
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.user.role, "manager");
    assert.equal(updated.user.store_id, user.store_id);
    // The intent is that the patch carries only self-editable profile fields -
    // never role or store_id. telegram_id joined that set after this test was
    // written.
    assert.deepEqual(Object.keys(patches[0]).sort(), ["full_name", "login", "phone", "telegram_id"]);
    assert.equal(passwordChanges[0].p_user_id, user.id);
    assert.equal(passwordChanges[0].p_new_password, "new-secure-password");
    const refreshedSession = await verifySessionToken(env, updated.token);
    assert.equal(refreshedSession.uid, user.id);
    assert.equal(refreshedSession.role, "manager");
    assert.equal(refreshedSession.login, "updated-manager");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("protected APIs use the current database role, not a stale token role", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.pathname === "/rest/v1/users" && String(init.method || "GET").toUpperCase() === "GET") {
      return json([{ ...user, role: "manager" }]);
    }
    throw new Error(`Unexpected request: ${String(init.method || "GET")} ${url}`);
  };

  try {
    const staleAdminToken = await createSessionToken(env, { ...user, role: "admin" });
    const result = await requireAuth(
      new Request("https://crm.test/api/managers", {
        headers: { Authorization: `Bearer ${staleAdminToken}` },
      }),
      env,
      ["admin"],
    );
    assert.ok(result instanceof Response);
    assert.equal(result.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("database recovery responses redact password hashes from legacy snapshots", async () => {
  const originalFetch = globalThis.fetch;
  const snapshot = {
    meta: { updatedAt: "2026-07-24T00:00:00.000Z" },
    users: [{
      id: "mgr_1",
      login: "legacy",
      password: "$2b$12$should-never-reach-the-browser",
      password_hash: "$2b$12$also-secret",
    }],
    stores: [],
    clients: [],
    notifications: [],
    salesChecks: [{ id: "sale-1" }],
    warehouseOrders: [{ id: "order-1" }],
    warehouseStock: [{ id: "stock-1" }],
  };

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users" && method === "GET") return json([user]);
    if (url.pathname.includes("/storage/v1/object/crm-data-private/system/crm-db.json") && method === "GET") {
      return json(snapshot);
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const token = await createSessionToken(env, user);
    const response = await getDb({
      env,
      request: new Request("https://crm.test/api/db", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    });
    assert.equal(response.status, 200);
    const db = await response.json();
    assert.equal("password" in db.users[0], false);
    assert.equal("password_hash" in db.users[0], false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("stale snapshot writes are rejected and read outages never masquerade as empty data", async () => {
  const originalFetch = globalThis.fetch;
  let storageWrites = 0;
  let failStorageRead = false;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users" && method === "GET") return json([user]);
    if (url.pathname.includes("/storage/v1/object/crm-data-private/system/crm-db.json") && method === "GET") {
      if (failStorageRead) return new Response("unavailable", { status: 500 });
      return json({
        meta: { updatedAt: "server-version-2" },
        users: [],
        clients: [],
        stores: [],
        notifications: [],
        salesChecks: [],
        warehouseOrders: [],
        warehouseStock: [],
      });
    }
    if (url.pathname.includes("/storage/v1/object/crm-data-private/") && method === "POST") {
      storageWrites += 1;
      return json({ Key: "system/crm-db.json" });
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const token = await createSessionToken(env, user);
    const missingVersion = await putDb({
      env,
      request: new Request("https://crm.test/api/db", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meta: {}, warehouseStock: [] }),
      }),
    });
    assert.equal(missingVersion.status, 428);
    assert.equal((await missingVersion.json()).error, "snapshot_version_required");
    assert.equal(storageWrites, 0);

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "If-Match": "\"server-version-1\"",
    };
    const conflict = await putDb({
      env,
      request: new Request("https://crm.test/api/db", {
        method: "PUT",
        headers,
        body: JSON.stringify({ meta: {}, warehouseStock: [] }),
      }),
    });
    assert.equal(conflict.status, 409);
    assert.equal(storageWrites, 0);

    failStorageRead = true;
    const blockedWrite = await putDb({
      env,
      request: new Request("https://crm.test/api/db", {
        method: "PUT",
        headers,
        body: JSON.stringify({ meta: {}, warehouseStock: [] }),
      }),
    });
    assert.equal(blockedWrite.status, 503);
    assert.equal((await blockedWrite.json()).error, "snapshot_write_failed");
    assert.equal(storageWrites, 0);

    const outage = await getDb({
      env,
      request: new Request("https://crm.test/api/db", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    });
    assert.equal(outage.status, 503);
    const payload = await outage.json();
    assert.equal(payload.error, "snapshot_read_failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("remember-me persists only the login and internal HR uploads use authenticated fetch", async () => {
  const [bootstrap, hrSource, dbSource, managersSource] = await Promise.all([
    readFile(new URL("../crm/js/core/bootstrap.js", import.meta.url), "utf8"),
    readFile(new URL("../crm/js/modules/hr/index.js", import.meta.url), "utf8"),
    readFile(new URL("../functions/api/db.js", import.meta.url), "utf8"),
    readFile(new URL("../functions/api/managers.js", import.meta.url), "utf8"),
  ]);

  assert.match(bootstrap, /JSON\.stringify\(\{\s*login:\s*loginValue\s*\}\)/);
  assert.doesNotMatch(bootstrap, /localStorage\.setItem\(LS_REMEMBER,[^;]*password/);
  assert.match(bootstrap, /if \(response\.status === 401 && state\.user\)/);
  assert.match(hrSource, /apiFetch\(endpoint/);
  assert.match(dbSource, /delete user\.password;/);
  assert.match(dbSource, /const payload = removeCredentialMaterial\(rawPayload\);/);
  assert.match(managersSource, /primary_admin_protected/);
  assert.match(managersSource, /MANAGED_ROLES\.has\(role\)/);
});
