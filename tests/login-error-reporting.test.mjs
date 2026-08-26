import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost } from "../functions/api/login.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "login-test-service-role-key",
};

const user = {
  id: "11111111-1111-4111-a111-111111111111",
  full_name: "Charos Sattorova",
  login: "Charos",
  role: "manager",
  store_id: "22222222-2222-4222-a222-222222222222",
  phone: "+998901112233",
  created_at: "2026-03-16T13:59:14.000Z",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

function request(body) {
  return new Request("https://crm.test/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Each case installs its own fetch stub keyed by resource.
async function withRoutes(routes, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const resource = url.pathname.replace("/rest/v1/", "");
    const handler = routes[resource];
    if (!handler) throw new Error(`Unexpected request: ${resource}`);
    return handler(init);
  };
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("a database outage is reported as unavailable, not as a wrong password", async () => {
  const response = await withRoutes(
    {
      "rpc/verify_login": () => json({ message: "function does not exist" }, { status: 404 }),
      users: () => json({ message: "relation does not exist" }, { status: 500 }),
    },
    () => onRequestPost({ env, request: request({ login: "Charos", password: "correct-password" }) }),
  );

  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error, "login_unavailable");
});

test("a genuinely wrong password stays a plain invalid_credentials answer", async () => {
  const response = await withRoutes(
    {
      "rpc/verify_login": () => json([]),
      users: () => json([]),
    },
    () => onRequestPost({ env, request: request({ login: "Charos", password: "nope" }) }),
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.error, "invalid_credentials");
  assert.equal(body.token, undefined);
});

test("a failing stores lookup no longer fails an otherwise valid login", async () => {
  const response = await withRoutes(
    {
      "rpc/verify_login": () => json([user]),
      stores: () => json({ message: "boom" }, { status: 500 }),
    },
    () => onRequestPost({ env, request: request({ login: "Charos", password: "correct-password" }) }),
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.user.login, "Charos");
  assert.equal(body.user.showroom, "");
  assert.equal(typeof body.token, "string");
});

test("login and password are trimmed before they reach the database", async () => {
  let sent = null;
  const response = await withRoutes(
    {
      "rpc/verify_login": (init) => {
        sent = JSON.parse(String(init.body || "{}"));
        return json([user]);
      },
      stores: () => json([{ id: user.store_id, name: "Chilonzor" }]),
    },
    () => onRequestPost({ env, request: request({ login: "  Charos  ", password: " correct-password " }) }),
  );

  assert.equal(response.status, 200);
  assert.equal(sent.p_login, "Charos");
  assert.equal(sent.p_password, "correct-password");
  const body = await response.json();
  assert.equal(body.user.showroom, "Chilonzor");
});

test("a legacy plaintext row still logs in when its bcrypt upgrade fails", async () => {
  const legacy = { ...user, password_hash: "123Charos" };
  const response = await withRoutes(
    {
      "rpc/verify_login": () => json([]),
      users: () => json([legacy]),
      "rpc/set_user_password": () => json({ message: "denied" }, { status: 403 }),
      stores: () => json([]),
    },
    () => onRequestPost({ env, request: request({ login: "Charos", password: "123Charos" }) }),
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(Object.hasOwn(body.user, "password_hash"), false);
});

test("an empty login or password is rejected before any database call", async () => {
  const response = await withRoutes(
    {},
    () => onRequestPost({ env, request: request({ login: "   ", password: "" }) }),
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "missing_credentials");
});
