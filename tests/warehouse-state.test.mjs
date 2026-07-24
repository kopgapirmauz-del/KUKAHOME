import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import {
  onRequestGet,
  onRequestPut,
} from "../functions/api/warehouse-state.js";

const env = {
  SUPABASE_URL: "https://warehouse-state-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "warehouse-state-test-service-role-key",
};

const admin = {
  id: "11111111-1111-4111-a111-111111111111",
  full_name: "Warehouse Admin",
  login: "admin",
  role: "admin",
  store_id: null,
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

test("warehouse endpoint updates only warehouse data and strips transient UI state", async () => {
  const originalFetch = globalThis.fetch;
  let snapshot = {
    meta: { updatedAt: "server-version-1" },
    users: [],
    stores: [],
    clients: [{ id: "client-must-survive" }],
    notifications: [],
    salesChecks: [{ id: "sale-must-survive" }],
    warehouseOrders: [{ id: "old-order", stageKey: "from_china", items: [] }],
    warehouseStock: [{ id: "old-stock" }],
    vacancies: [{ id: "vacancy-must-survive" }],
  };
  const mirroredTables = [];
  let snapshotWrites = 0;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users" && method === "GET") return json([admin]);
    if (url.pathname === "/storage/v1/bucket/crm-data-private" && method === "GET") {
      return json({ id: "crm-data-private", public: false });
    }
    if (url.pathname.includes("/storage/v1/object/crm-data-private/system/crm-db.json")) {
      if (method === "GET") return json(snapshot);
      if (method === "POST") {
        snapshotWrites += 1;
        snapshot = JSON.parse(new TextDecoder().decode(init.body));
        return json({ Key: "system/crm-db.json" });
      }
    }
    if (url.pathname.startsWith("/rest/v1/warehouse_")) {
      mirroredTables.push(`${method}:${url.pathname}`);
      return json([]);
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const token = await createSessionToken(env, admin);
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "If-Match": "\"server-version-1\"",
    };
    let backgroundMirror;
    const response = await onRequestPut({
      env,
      request: new Request("https://crm.test/api/warehouse-state", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          warehouseOrders: [{
            id: "new-order",
            stageKey: "near_border",
            eta: "2026-07-31",
            listOpen: true,
            search: "temporary filter",
            items: [{ id: "item-1", model: "QA", qty: 2 }],
          }],
          warehouseStock: [{ id: "new-stock", model: "QA", qty: 2 }],
          clients: [],
          salesChecks: [],
        }),
      }),
      waitUntil(promise) {
        backgroundMirror = promise;
      },
    });

    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);
    assert.ok(result.version);
    assert.deepEqual(snapshot.clients, [{ id: "client-must-survive" }]);
    assert.deepEqual(snapshot.salesChecks, [{ id: "sale-must-survive" }]);
    assert.deepEqual(snapshot.vacancies, [{ id: "vacancy-must-survive" }]);
    assert.equal(snapshot.warehouseOrders[0].id, "new-order");
    assert.equal("listOpen" in snapshot.warehouseOrders[0], false);
    assert.equal("search" in snapshot.warehouseOrders[0], false);
    assert.equal(snapshot.meta.extendedDataMirroredAt, "");

    await backgroundMirror;
    assert.equal(snapshot.meta.extendedDataMirroredAt, "");
    assert.equal(snapshotWrites, 1);
    assert.ok(mirroredTables.some((entry) => entry.includes("/warehouse_orders")));
    assert.ok(mirroredTables.some((entry) => entry.includes("/warehouse_order_items")));
    assert.ok(mirroredTables.some((entry) => entry.includes("/warehouse_stock")));

    const getResponse = await onRequestGet({
      env,
      request: new Request("https://crm.test/api/warehouse-state", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    });
    assert.equal(getResponse.status, 200);
    const loaded = await getResponse.json();
    assert.equal(loaded.warehouseOrders[0].id, "new-order");
    assert.equal(loaded.warehouseStock[0].id, "new-stock");
    assert.equal(loaded.version, result.version);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("warehouse endpoint rejects stale writes without changing the snapshot", async () => {
  const originalFetch = globalThis.fetch;
  let storageWrites = 0;
  const snapshot = {
    meta: { updatedAt: "server-version-2" },
    users: [],
    stores: [],
    clients: [],
    notifications: [],
    salesChecks: [],
    warehouseOrders: [{ id: "server-order" }],
    warehouseStock: [],
  };

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users" && method === "GET") return json([admin]);
    if (url.pathname.includes("/storage/v1/object/crm-data-private/system/crm-db.json") && method === "GET") {
      return json(snapshot);
    }
    if (url.pathname.includes("/storage/v1/object/crm-data-private/") && method === "POST") {
      storageWrites += 1;
      return json({});
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const token = await createSessionToken(env, admin);
    const response = await onRequestPut({
      env,
      request: new Request("https://crm.test/api/warehouse-state", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "If-Match": "\"server-version-1\"",
        },
        body: JSON.stringify({ warehouseOrders: [], warehouseStock: [] }),
      }),
    });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "snapshot_version_conflict");
    assert.equal(storageWrites, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("warehouse client keeps list visibility local and uses the scoped API", async () => {
  const [apiSource, utilsSource, warehouseSource] = await Promise.all([
    readFile(new URL("../crm/js/core/api.js", import.meta.url), "utf8"),
    readFile(new URL("../crm/js/core/utils.js", import.meta.url), "utf8"),
    readFile(new URL("../crm/js/modules/warehouse/index.js", import.meta.url), "utf8"),
  ]);
  const refreshBody = apiSource.slice(
    apiSource.indexOf("async function refreshExtendedDataAfterAuth"),
    apiSource.indexOf("async function pushRemoteDB"),
  );
  assert.doesNotMatch(refreshBody, /"warehouseOrders"/);
  assert.doesNotMatch(refreshBody, /"warehouseStock"/);
  assert.match(apiSource, /delete safe\.listOpen;\s*delete safe\.search;/);
  assert.match(apiSource, /listOpen:\s*Boolean\(ui\.listOpen\)/);
  assert.match(apiSource, /API_WAREHOUSE_STATE_URL/);
  assert.match(utilsSource, /loadWarehouseStateFromApi\(\)/);
  assert.match(warehouseSource, /const saved = await saveWarehouseStateToApi\(\)/);
});
