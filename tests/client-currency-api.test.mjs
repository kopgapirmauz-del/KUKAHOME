import assert from "node:assert/strict";
import { createSessionToken } from "../functions/api/_auth.js";
import {
  onRequestGet,
  onRequestPost,
  onRequestPut,
} from "../functions/api/clients.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

const admin = {
  id: "11111111-1111-4111-a111-111111111111",
  login: "admin",
  role: "admin",
  store_id: "22222222-2222-4222-a222-222222222222",
};

const stores = [{
  id: admin.store_id,
  name: "Main showroom",
}];

const users = [{
  id: admin.id,
  full_name: "Admin User",
  login: admin.login,
  role: admin.role,
  store_id: admin.store_id,
}];

const writes = [];
const selectedClientColumns = [];

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const method = String(init.method || "GET").toUpperCase();
  const table = url.pathname.replace("/rest/v1/", "");

  if (table === "stores" && method === "GET") return json(stores);
  if (table === "users" && method === "GET") return json(users);

  if (table === "clients" && method === "GET") {
    selectedClientColumns.push(url.searchParams.get("select"));
    return json([{
      id: "33333333-3333-4333-a333-333333333333",
      date: "2026-07-24",
      store_id: admin.store_id,
      manager_id: admin.id,
      phone: "+998900000000",
      source: "new_client",
      interest: "Test product",
      note: "",
      status: "green",
      price: 1250,
      currency: "USD",
      result: "yes",
      created_at: "2026-07-24T00:00:00.000Z",
    }], {
      headers: { "content-range": "0-0/1" },
    });
  }

  if (table === "clients" && ["POST", "PATCH"].includes(method)) {
    writes.push({ method, body: JSON.parse(String(init.body || "{}")) });
    return json([], { status: method === "POST" ? 201 : 200 });
  }

  if (table === "notifications" && method === "POST") {
    return json([], { status: 201 });
  }

  throw new Error(`Unexpected request: ${method} ${url}`);
};

try {
  const token = await createSessionToken(env, admin);
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const postResponse = await onRequestPost({
    env,
    request: new Request("https://crm.test/api/clients", {
      method: "POST",
      headers,
      body: JSON.stringify({
        date: "2026-07-24",
        showroom: "Main showroom",
        manager: "Admin User",
        phone: "+998900000000",
        price: "1,250",
        currency: "usd",
      }),
    }),
  });
  assert.equal(postResponse.status, 200);
  assert.equal(writes.at(-1)?.method, "POST");
  assert.equal(writes.at(-1)?.body.currency, "USD");

  const putResponse = await onRequestPut({
    env,
    request: new Request("https://crm.test/api/clients", {
      method: "PUT",
      headers,
      body: JSON.stringify({
        id: "33333333-3333-4333-a333-333333333333",
        date: "2026-07-24",
        showroom: "Main showroom",
        manager: "Admin User",
        phone: "+998900000000",
        price: 1250,
        currency: "UZS",
      }),
    }),
  });
  assert.equal(putResponse.status, 200);
  assert.equal(writes.at(-1)?.method, "PATCH");
  assert.equal(writes.at(-1)?.body.currency, "UZS");

  const getResponse = await onRequestGet({
    env,
    request: new Request("https://crm.test/api/clients", { headers }),
  });
  assert.equal(getResponse.status, 200);
  const clients = await getResponse.json();
  assert.equal(clients.length, 1);
  assert.equal(clients[0].currency, "USD");
  assert.match(selectedClientColumns.at(-1) || "", /(?:^|,)currency(?:,|$)/);

  console.log("client currency API regression test passed");
} finally {
  globalThis.fetch = originalFetch;
}
