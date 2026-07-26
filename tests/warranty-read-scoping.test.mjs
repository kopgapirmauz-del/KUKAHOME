import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import { onRequestGet } from "../functions/api/warranty-tickets.js";

const env = {
  SUPABASE_URL: "https://warranty-scoping-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "warranty-scoping-test-service-role-key",
};

const ADMIN = { id: "66666666-6666-4666-a666-666666666666", full_name: "Admin", login: "admin", role: "admin", store_id: null };
const MANAGER = { id: "77777777-7777-4777-a777-777777777777", full_name: "Aziz", login: "aziz", role: "manager", store_id: null };
const HR = { id: "88888888-8888-4888-a888-888888888888", full_name: "Hr", login: "hr", role: "hr", store_id: null };
const SKLADCHI = { id: "99999999-9999-4999-a999-999999999999", full_name: "Skl", login: "skl", role: "skladchi", store_id: null };

const USERS = [ADMIN, MANAGER, HR, SKLADCHI];

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

// Returns the manager_id filter the handler asked for, so scoping is observable.
function stub(seenQueries) {
  return async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users" && method === "GET") return json(USERS);
    if (url.pathname === "/rest/v1/warranty_tickets") {
      if (method === "GET" && url.searchParams.has("select") && url.searchParams.get("select").includes("ticket_no")) {
        seenQueries.push(url.searchParams.get("manager_id") || "");
        const rows = [
          { id: "t1", ticket_no: 1, manager_id: MANAGER.id, form_data: {}, ticket_file_name: "warranty_ticket_1.pdf" },
          { id: "t2", ticket_no: 2, manager_id: "someone-else", form_data: {}, ticket_file_name: "warranty_ticket_2.pdf" },
        ];
        const filter = url.searchParams.get("manager_id");
        if (!filter) return json(rows);
        const wanted = filter.replace(/^eq\./, "");
        return json(rows.filter((r) => r.manager_id === wanted));
      }
      return json([]);
    }
    return json([]);
  };
}

async function getAs(user, seenQueries) {
  const token = await createSessionToken(env, user);
  return onRequestGet({
    env,
    request: new Request("https://crm.test/api/warranty-tickets", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  });
}

test("roles that cannot create a warranty ticket cannot read them either", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stub([]);
  try {
    for (const user of [HR, SKLADCHI]) {
      const res = await getAs(user);
      assert.equal(res.status, 403, `${user.role} must not read warranty tickets`);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a manager sees only their own tickets", async () => {
  const originalFetch = globalThis.fetch;
  const seen = [];
  globalThis.fetch = stub(seen);
  try {
    const res = await getAs(MANAGER);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 1, "another manager's ticket must not be returned");
    assert.equal(seen[0], `eq.${MANAGER.id}`, "the query must be scoped server-side");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an admin still sees every ticket", async () => {
  const originalFetch = globalThis.fetch;
  const seen = [];
  globalThis.fetch = stub(seen);
  try {
    const res = await getAs(ADMIN);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 2);
    assert.equal(seen[0], "", "an admin's query must not be scoped");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
