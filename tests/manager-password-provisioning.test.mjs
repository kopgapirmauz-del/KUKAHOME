import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost } from "../functions/api/managers.js";
import { createSessionToken } from "../functions/api/_auth.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "managers-test-service-role-key",
};

const admin = {
  id: "00000000-0000-4000-a000-000000000000",
  login: "admin",
  role: "admin",
  store_id: null,
};

const NEW_USER_ID = "33333333-3333-4333-a333-333333333333";

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

async function post(body, routes) {
  const token = await createSessionToken(env, admin);
  const calls = { inserted: 0, deleted: [], passwords: [] };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const resource = url.pathname.replace("/rest/v1/", "");
    const method = String(init.method || "GET").toUpperCase();

    // requireAuth re-reads the caller from the database.
    if (resource === "users" && method === "GET") return json([admin]);
    if (resource === "users" && method === "POST") {
      calls.inserted += 1;
      return json([{ id: NEW_USER_ID }]);
    }
    if (resource === "users" && method === "DELETE") {
      calls.deleted.push(url.search);
      return json([]);
    }
    if (resource === "rpc/set_user_password" && method === "POST") {
      calls.passwords.push(JSON.parse(String(init.body || "{}")));
      return routes.setPassword();
    }
    if (resource === "stores") return json([]);
    throw new Error(`Unexpected request: ${method} ${resource}`);
  };

  try {
    const response = await onRequestPost({
      env,
      request: new Request("https://crm.test/api/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      }),
    });
    return { response, calls };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

const validPayload = {
  full_name: "Yangi Menejer",
  login: "yangi",
  password: "parol123",
  role: "manager",
};

test("a user whose password could not be stored is rolled back, not left unusable", async () => {
  // Previously the row survived with its random placeholder hash: the account
  // appeared in the manager list, its login was taken, and no password opened it.
  const { response, calls } = await post(validPayload, {
    setPassword: () => json({ message: "permission denied" }, { status: 403 }),
  });

  assert.equal(response.status, 500);
  assert.equal((await response.json()).error, "password_not_stored");
  assert.equal(calls.inserted, 1);
  assert.equal(calls.deleted.length, 1);
  assert.match(calls.deleted[0], new RegExp(NEW_USER_ID));
});

test("set_user_password returning false counts as a failure", async () => {
  const { response, calls } = await post(validPayload, { setPassword: () => json(false) });

  assert.equal(response.status, 500);
  assert.equal((await response.json()).error, "password_not_stored");
  assert.equal(calls.deleted.length, 1);
});

test("a stored password keeps the user and reports success", async () => {
  const { response, calls } = await post(validPayload, { setPassword: () => json(true) });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(calls.deleted.length, 0);
  assert.equal(calls.passwords[0].p_user_id, NEW_USER_ID);
  assert.equal(calls.passwords[0].p_new_password, "parol123");
});

test("a too-short password is rejected before the user row is created", async () => {
  const { response, calls } = await post({ ...validPayload, password: "12" }, { setPassword: () => json(true) });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_password_length");
  assert.equal(calls.inserted, 0);
});

test("a login containing whitespace is rejected - it could never be typed back", async () => {
  const { response, calls } = await post({ ...validPayload, login: "yangi menejer" }, { setPassword: () => json(true) });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_login");
  assert.equal(calls.inserted, 0);
});
