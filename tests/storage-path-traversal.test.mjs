import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet, onRequestDelete } from "../functions/api/sales-check-file.js";
import { warrantyObjectPath } from "../functions/api/_warranty.js";
import { createSessionToken } from "../functions/api/_auth.js";

const env = {
  SUPABASE_URL: "https://traversal-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "traversal-test-service-role-key",
};

const admin = {
  id: "33333333-3333-4333-a333-333333333333",
  full_name: "Admin",
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

// Records every URL the handler asks Supabase for, so a request that escapes
// the storage prefix is visible even if the response is discarded.
function trackingFetch(reached, extra) {
  return async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    reached.push(`${method} ${url.pathname}`);
    if (extra) {
      const handled = await extra(url, method, init);
      if (handled) return handled;
    }
    if (url.pathname === "/rest/v1/users") {
      return json([{ id: admin.id, login: "admin", password_hash: "$2b$10$SECRET" }]);
    }
    if (url.pathname === "/rest/v1/social_channels") {
      return json([{ id: "c1", access_token: "SECRET-BOT-TOKEN" }]);
    }
    if (url.pathname.startsWith("/storage/v1/object/")) {
      return new Response("%PDF-1.4 stub", { status: 200, headers: { "content-type": "application/pdf" } });
    }
    return json([]);
  };
}

const ESCAPES = [
  "../../../../rest/v1/users",
  "../../../../rest/v1/social_channels",
  "../../rest/v1/users",
  "..%2F..%2F..%2F..%2Frest%2Fv1%2Fusers",
  "/../../../rest/v1/users",
  "sales-checks/../../../rest/v1/users",
  "....//....//rest/v1/users",
  "subdir/file.pdf",
];

test("an anonymous request cannot escape the storage bucket and read Supabase tables", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const attempt of ESCAPES) {
      const reached = [];
      globalThis.fetch = trackingFetch(reached);
      const res = await onRequestGet({
        env,
        request: new Request(
          `https://crm.test/api/sales-check-file?file_name=${encodeURIComponent(attempt)}`,
        ),
      });

      const body = await res.text();
      assert.doesNotMatch(body, /password_hash|SECRET/, `leaked data for ${attempt}`);
      assert.ok(
        !reached.some((entry) => entry.includes("/rest/v1/")),
        `request for ${attempt} reached the REST API: ${reached.join(", ")}`,
      );
      assert.ok(
        reached.every((entry) => !entry.includes("/storage/v1/object/") || entry.includes("/sales-checks/")),
        `request for ${attempt} left the sales-checks prefix: ${reached.join(", ")}`,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an authenticated delete cannot escape the storage bucket either", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const token = await createSessionToken(env, admin);
    for (const attempt of ESCAPES) {
      const reached = [];
      globalThis.fetch = trackingFetch(reached, async (url) => {
        if (url.pathname === "/rest/v1/users") return json([admin]);
        return null;
      });
      await onRequestDelete({
        env,
        request: new Request("https://crm.test/api/sales-check-file", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ file_name: attempt }),
        }),
      });
      assert.ok(
        !reached.some((entry) => entry.startsWith("DELETE") && entry.includes("/rest/v1/")),
        `delete for ${attempt} reached the REST API: ${reached.join(", ")}`,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a legitimate receipt is still served", async () => {
  const originalFetch = globalThis.fetch;
  const reached = [];
  globalThis.fetch = trackingFetch(reached);
  try {
    const res = await onRequestGet({
      env,
      request: new Request("https://crm.test/api/sales-check-file?file_name=sales_check_42.pdf"),
    });
    assert.equal(res.status, 200);
    assert.ok(
      reached.some((entry) => entry === "GET /storage/v1/object/crm-private/sales-checks/sales_check_42.pdf"),
      `unexpected upstream path: ${reached.join(", ")}`,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("warrantyObjectPath refuses to leave the sales-checks prefix", () => {
  assert.equal(warrantyObjectPath("warranty_ticket_9_ab12_x.pdf"), "sales-checks/warranty_ticket_9_ab12_x.pdf");
  for (const attempt of ESCAPES) {
    assert.equal(warrantyObjectPath(attempt), "", `warrantyObjectPath accepted ${attempt}`);
  }
});
