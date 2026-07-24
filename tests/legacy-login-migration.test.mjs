import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/login.js";

const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

const legacyUser = {
  id: "11111111-1111-4111-a111-111111111111",
  full_name: "Primary Admin",
  login: "legacy-admin",
  password_hash: "legacy-password",
  role: "admin",
  store_id: null,
  phone: "",
  created_at: "2026-01-01T00:00:00.000Z",
};

let migratedPassword = null;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  const resource = url.pathname.replace("/rest/v1/", "");
  const method = String(init.method || "GET").toUpperCase();

  if (resource === "rpc/verify_login" && method === "POST") return json([]);
  if (resource === "users" && method === "GET") return json([legacyUser]);
  if (resource === "rpc/set_user_password" && method === "POST") {
    migratedPassword = JSON.parse(String(init.body || "{}"));
    return json([]);
  }
  if (resource === "stores" && method === "GET") return json([]);

  throw new Error(`Unexpected request: ${method} ${url}`);
};

try {
  const response = await onRequestPost({
    env,
    request: new Request("https://crm.test/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: legacyUser.login,
        password: legacyUser.password_hash,
      }),
    }),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.success, true);
  assert.equal(result.user.login, legacyUser.login);
  assert.equal(Object.hasOwn(result.user, "password"), false);
  assert.equal(typeof result.token, "string");
  assert.equal(migratedPassword?.p_user_id, legacyUser.id);
  assert.equal(migratedPassword?.p_new_password, legacyUser.password_hash);

  console.log("legacy login migration regression test passed");
} finally {
  globalThis.fetch = originalFetch;
}
