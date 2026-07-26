import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import { onRequestPut as dbPut } from "../functions/api/db.js";

const env = {
  SUPABASE_URL: "https://warehouse-concurrency-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "warehouse-concurrency-test-service-role-key",
};

const admin = {
  id: "22222222-2222-4222-a222-222222222222",
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

// Loads the plain-script client helpers (crm/js is not an ES module tree) into
// an isolated scope so the merge and version rules can be exercised directly.
async function loadClientWarehouseHelpers() {
  const source = await readFile(new URL("../crm/js/core/api.js", import.meta.url), "utf8");
  const names = [
    "adoptRemoteVersion",
    "indexWarehouseById",
    "sameWarehouseRow",
    "mergeRowsById",
    "mergeWarehouseOrder",
  ];
  const bodies = names.map((name) => {
    const start = source.indexOf(`function ${name}(`);
    assert.notEqual(start, -1, `client helper ${name} is missing from crm/js/core/api.js`);
    // Each helper is a top-level declaration, so the first column-0 closing
    // brace terminates it.
    const end = source.indexOf("\n}\n", start);
    assert.notEqual(end, -1, `client helper ${name} is not a top-level declaration`);
    return source.slice(start, end + 3);
  });
  const state = { db: { meta: {} } };
  const factory = new Function("state", `${bodies.join("\n")}\nreturn { ${names.join(", ")} };`);
  return { state, ...factory(state) };
}

test("whole-DB snapshot push cannot overwrite warehouse rows owned by the warehouse endpoint", async () => {
  const originalFetch = globalThis.fetch;
  let snapshot = {
    meta: { updatedAt: "server-version-1" },
    users: [],
    stores: [],
    clients: [],
    notifications: [],
    salesChecks: [],
    // Another session added this row through /api/warehouse-state a moment ago.
    warehouseOrders: [{
      id: "order-1",
      stageKey: "from_china",
      items: [{ id: "item-added-by-other-session", model: "Sofa", qty: 3 }],
    }],
    warehouseStock: [{ id: "stock-added-by-other-session", model: "Sofa", qty: 3 }],
    vacancies: [],
  };

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
        snapshot = JSON.parse(new TextDecoder().decode(init.body));
        return json({ Key: "system/crm-db.json" });
      }
    }
    if (url.pathname.startsWith("/rest/v1/")) return json([]);
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const token = await createSessionToken(env, admin);
    // A routine save (marking a notification read, a client edit, the login
    // counter) republishes this tab's whole database - including a warehouse
    // copy taken before the other session's addition.
    const response = await dbPut({
      env,
      request: new Request("https://crm.test/api/db", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "If-Match": "\"server-version-1\"",
        },
        body: JSON.stringify({
          meta: { updatedAt: "server-version-1", remoteVersion: "server-version-1" },
          users: [],
          stores: [],
          clients: [{ id: "client-edited-here" }],
          notifications: [],
          salesChecks: [],
          warehouseOrders: [{ id: "order-1", stageKey: "from_china", items: [] }],
          warehouseStock: [],
          vacancies: [],
        }),
      }),
    });

    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);

    // The unrelated edit is stored...
    assert.deepEqual(snapshot.clients, [{ id: "client-edited-here" }]);
    // ...but the warehouse rows this request did not own are untouched.
    assert.equal(snapshot.warehouseOrders[0].items.length, 1);
    assert.equal(snapshot.warehouseOrders[0].items[0].id, "item-added-by-other-session");
    assert.equal(snapshot.warehouseStock.length, 1);
    assert.equal(snapshot.warehouseStock[0].id, "stock-added-by-other-session");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a stale poll response cannot roll the snapshot version backwards", async () => {
  const { state, adoptRemoteVersion } = await loadClientWarehouseHelpers();

  // A warehouse save just landed and defined the newest version.
  adoptRemoteVersion("2026-07-26T10:00:05.000Z", { authoritative: true });
  // The 4s poll's response left the server before that write and arrives late.
  adoptRemoteVersion("2026-07-26T10:00:01.000Z");
  assert.equal(
    state.db.meta.remoteVersion,
    "2026-07-26T10:00:05.000Z",
    "a late poll response must not reinstate the older version",
  );

  // A genuinely newer version is still adopted.
  adoptRemoteVersion("2026-07-26T10:00:09.000Z");
  assert.equal(state.db.meta.remoteVersion, "2026-07-26T10:00:09.000Z");

  // Conflict recovery is authoritative and may move the token either way.
  adoptRemoteVersion("2026-07-26T09:59:00.000Z", { authoritative: true });
  assert.equal(state.db.meta.remoteVersion, "2026-07-26T09:59:00.000Z");
});

test("concurrent additions from two browsers both survive the rebase", async () => {
  const { mergeRowsById, mergeWarehouseOrder } = await loadClientWarehouseHelpers();

  const base = [{ id: "order-1", stageKey: "from_china", items: [{ id: "item-0", qty: 1 }] }];
  // This browser added item-a.
  const mine = [{
    id: "order-1",
    stageKey: "from_china",
    items: [{ id: "item-0", qty: 1 }, { id: "item-a", model: "Chair", qty: 2 }],
  }];
  // The other browser added item-b and won the race to the server.
  const theirs = [{
    id: "order-1",
    stageKey: "from_china",
    items: [{ id: "item-0", qty: 1 }, { id: "item-b", model: "Table", qty: 5 }],
  }];

  const merged = mergeRowsById(base, mine, theirs, mergeWarehouseOrder);
  const ids = merged[0].items.map((item) => item.id).sort();
  assert.deepEqual(ids, ["item-0", "item-a", "item-b"], "neither browser's addition may be dropped");
});

test("rebase keeps a local deletion deleted and adopts remote-only rows", async () => {
  const { mergeRowsById } = await loadClientWarehouseHelpers();

  const base = [{ id: "stock-1", qty: 1 }, { id: "stock-2", qty: 2 }];
  const mine = [{ id: "stock-1", qty: 1 }];                       // deleted stock-2 locally
  const theirs = [{ id: "stock-1", qty: 1 }, { id: "stock-2", qty: 2 }, { id: "stock-3", qty: 3 }];

  const merged = mergeRowsById(base, mine, theirs);
  const ids = merged.map((row) => row.id).sort();
  assert.deepEqual(ids, ["stock-1", "stock-3"], "local delete must stick, remote addition must arrive");
});

test("rebase keeps a local edit when the same row changed remotely", async () => {
  const { mergeRowsById } = await loadClientWarehouseHelpers();

  const base = [{ id: "stock-1", qty: 1 }];
  const mine = [{ id: "stock-1", qty: 7 }];
  const theirs = [{ id: "stock-1", qty: 4 }];

  const merged = mergeRowsById(base, mine, theirs);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].qty, 7, "the edit the user just made wins over the value it replaced");
});

test("rebase takes the remote value for rows this browser never touched", async () => {
  const { mergeRowsById } = await loadClientWarehouseHelpers();

  const base = [{ id: "stock-1", qty: 1 }];
  const mine = [{ id: "stock-1", qty: 1 }];
  const theirs = [{ id: "stock-1", qty: 9 }];

  const merged = mergeRowsById(base, mine, theirs);
  assert.equal(merged[0].qty, 9, "an untouched row must pick up the other session's change");
});
