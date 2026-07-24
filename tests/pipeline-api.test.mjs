import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import {
  onRequestDelete,
  onRequestGet,
  onRequestPost,
} from "../functions/api/pipeline.js";

const env = {
  SUPABASE_URL: "https://pipeline-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "pipeline-test-service-role-key",
};

const admin = {
  id: "11111111-1111-4111-a111-111111111111",
  login: "admin",
  role: "admin",
  store_id: "22222222-2222-4222-a222-222222222222",
};
const manager = {
  id: "33333333-3333-4333-a333-333333333333",
  login: "manager",
  role: "manager",
  store_id: admin.store_id,
};
const otherManager = {
  id: "44444444-4444-4444-a444-444444444444",
  login: "other",
  role: "manager",
  store_id: admin.store_id,
};
const client = {
  id: "55555555-5555-4555-a555-555555555555",
  date: "2026-07-24",
  store_id: admin.store_id,
  manager_id: manager.id,
  phone: "+998900000000",
  source: "Instagram",
  interest: "Modular sofa",
  note: "",
  status: "green",
  price: 2500,
  currency: "USD",
  result: "",
  created_at: "2026-07-24T07:00:00.000Z",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

test("pipeline is isolated, access-controlled, and rejects stale cross-browser writes", async () => {
  const originalFetch = globalThis.fetch;
  const objects = new Map();
  const relationalWrites = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();

    if (url.pathname === "/storage/v1/bucket/crm-data-private" && method === "GET") {
      return json({ id: "crm-data-private", public: false });
    }
    if (url.pathname === "/storage/v1/object/list/crm-data-private" && method === "POST") {
      const prefix = JSON.parse(String(init.body || "{}")).prefix;
      return json([...objects.keys()]
        .filter((path) => path.startsWith(`${prefix}/`))
        .map((path) => ({ name: path.slice(prefix.length + 1) })));
    }
    if (url.pathname.startsWith("/storage/v1/object/crm-data-private/")) {
      const path = decodeURIComponent(url.pathname.slice("/storage/v1/object/crm-data-private/".length));
      if (method === "GET") {
        return objects.has(path)
          ? new Response(objects.get(path), { headers: { "content-type": "application/json" } })
          : json({ message: "not found" }, { status: 404 });
      }
      if (method === "POST") {
        objects.set(path, new TextDecoder().decode(init.body));
        return json({ Key: path });
      }
      if (method === "DELETE") {
        objects.delete(path);
        return new Response(null, { status: 204 });
      }
    }
    if (url.pathname === "/storage/v1/object/remove" && method === "POST") {
      const body = JSON.parse(String(init.body || "{}"));
      body.prefixes.forEach((path) => objects.delete(path));
      return json({ message: "success" });
    }

    const table = url.pathname.replace("/rest/v1/", "");
    if (table === "clients" && method === "GET") return json([client]);
    if (table === "stores" && method === "GET") return json([{ id: admin.store_id, name: "Main showroom" }]);
    if (table === "users" && method === "GET") {
      return json([
        { id: admin.id, full_name: "Admin", login: admin.login, role: admin.role, store_id: admin.store_id },
        { id: manager.id, full_name: "Sales Manager", login: manager.login, role: manager.role, store_id: manager.store_id },
      ]);
    }
    if (url.pathname.startsWith("/rest/v1/")) {
      relationalWrites.push({ table, method });
      return json([]);
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const adminToken = await createSessionToken(env, admin);
    const managerToken = await createSessionToken(env, manager);
    const otherToken = await createSessionToken(env, otherManager);
    const headersFor = (token) => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });

    const createResponse = await onRequestPost({
      env,
      request: new Request("https://crm.test/api/pipeline", {
        method: "POST",
        headers: headersFor(managerToken),
        body: JSON.stringify({
          clientId: client.id,
          version: "",
          stage: "new",
          temperature: "hot",
          estimatedValue: 2500,
          currency: "USD",
        }),
      }),
    });
    assert.equal(createResponse.status, 200);
    const created = await createResponse.json();
    assert.equal(created.item.clientId, client.id);
    assert.equal(created.item.stage, "new");
    assert.equal(objects.size, 1);

    const unauthorizedResponse = await onRequestPost({
      env,
      request: new Request("https://crm.test/api/pipeline", {
        method: "POST",
        headers: headersFor(otherToken),
        body: JSON.stringify({ clientId: client.id, version: created.item.updatedAt, stage: "contacted" }),
      }),
    });
    assert.equal(unauthorizedResponse.status, 403);

    const staleResponse = await onRequestPost({
      env,
      request: new Request("https://crm.test/api/pipeline", {
        method: "POST",
        headers: headersFor(adminToken),
        body: JSON.stringify({ clientId: client.id, version: "", stage: "contacted" }),
      }),
    });
    assert.equal(staleResponse.status, 409);

    const updateResponse = await onRequestPost({
      env,
      request: new Request("https://crm.test/api/pipeline", {
        method: "POST",
        headers: headersFor(adminToken),
        body: JSON.stringify({
          clientId: client.id,
          version: created.item.updatedAt,
          stage: "contacted",
          temperature: "hot",
          nextActionAt: "2026-07-25T06:00:00.000Z",
          estimatedValue: 2500,
          currency: "USD",
        }),
      }),
    });
    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.item.stage, "contacted");
    assert.equal(updated.item.history.length, 2);

    const listResponse = await onRequestGet({
      env,
      request: new Request("https://crm.test/api/pipeline", { headers: headersFor(managerToken) }),
    });
    assert.equal(listResponse.status, 200);
    const listed = await listResponse.json();
    assert.equal(listed.items.length, 1);
    assert.equal(listed.items[0].client.managerName, "Sales Manager");
    assert.equal(listed.items[0].client.currency, "USD");

    const staleDelete = await onRequestDelete({
      env,
      request: new Request("https://crm.test/api/pipeline", {
        method: "DELETE",
        headers: headersFor(adminToken),
        body: JSON.stringify({ clientId: client.id, version: created.item.updatedAt }),
      }),
    });
    assert.equal(staleDelete.status, 409);

    const deleteResponse = await onRequestDelete({
      env,
      request: new Request("https://crm.test/api/pipeline", {
        method: "DELETE",
        headers: headersFor(adminToken),
        body: JSON.stringify({ clientId: client.id, version: updated.item.updatedAt }),
      }),
    });
    assert.equal(deleteResponse.status, 200);
    assert.equal(objects.size, 0);
    assert.deepEqual(relationalWrites, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
