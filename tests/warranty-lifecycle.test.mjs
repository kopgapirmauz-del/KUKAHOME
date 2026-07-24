import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import { onRequestGet as getWarrantyFile } from "../functions/api/sales-check-file.js";
import { onRequestGet as listWarrantyTickets } from "../functions/api/warranty-tickets.js";
import { onRequestGet as verifyWarrantyTicket } from "../functions/api/warranty-verify.js";

const env = {
  SUPABASE_URL: "https://warranty-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "warranty-test-service-role-key",
};

const admin = {
  id: "11111111-1111-4111-a111-111111111111",
  login: "admin",
  role: "admin",
  store_id: "22222222-2222-4222-a222-222222222222",
};

const validTicket = {
  id: "33333333-3333-4333-a333-333333333333",
  ticket_no: 91,
  store_id: admin.store_id,
  manager_id: admin.id,
  sale_date: "2026-07-24",
  warranty_start_date: "2026-07-24",
  warranty_end_date: "2099-07-24",
  ticket_url: "/api/sales-check-file?file_name=warranty_ticket_91.pdf",
  ticket_data_url: "",
  ticket_file_name: "warranty_ticket_91.pdf",
  form_data: {
    productName: "KUKA Milano",
    modelNo: "MIL-91",
    barcode: "9988000091",
    warrantyTerm: "24 oy",
    sellerOrg: "KUKA HOME",
  },
  created_at: "2026-07-24T12:00:00.000Z",
  updated_at: "2026-07-24T12:00:00.000Z",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("each public warranty UUID verifies only its server record", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.pathname === "/rest/v1/warranty_tickets" && String(init.method || "GET").toUpperCase() === "GET") {
      assert.equal(url.searchParams.get("id"), `eq.${validTicket.id}`);
      return json([validTicket]);
    }
    throw new Error(`Unexpected request: ${String(init.method || "GET")} ${url}`);
  };

  try {
    const response = await verifyWarrantyTicket({
      env,
      request: new Request(`https://crm.test/api/warranty-verify?id=${validTicket.id}`),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.status, "valid");
    assert.equal(body.ticketNo, 91);
    assert.equal(body.productName, "KUKA Milano");
    assert.equal(body.modelNo, "MIL-91");
    assert.equal("ticket_url" in body, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("expired verification removes both the private PDF and database row", async () => {
  const originalFetch = globalThis.fetch;
  const expiredTicket = {
    ...validTicket,
    warranty_end_date: "2020-01-01",
  };
  const requests = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    requests.push({ pathname: url.pathname, method, search: url.search });
    if (url.pathname === "/rest/v1/warranty_tickets" && method === "GET") return json([expiredTicket]);
    if (url.pathname === "/storage/v1/object/remove" && method === "POST") return json({ message: "success" });
    if (url.pathname === "/rest/v1/warranty_tickets" && method === "DELETE") return json([]);
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const response = await verifyWarrantyTicket({
      env,
      request: new Request(`https://crm.test/api/warranty-verify?id=${expiredTicket.id}`),
    });
    assert.equal(response.status, 410);
    assert.equal((await response.json()).status, "expired");
    assert.ok(requests.some((request) => request.pathname === "/storage/v1/object/remove"));
    assert.ok(requests.some((request) => request.method === "DELETE" && request.search.includes(`id=eq.${expiredTicket.id}`)));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an expired private PDF can no longer be downloaded by its old URL", async () => {
  const originalFetch = globalThis.fetch;
  const expiredTicket = {
    ...validTicket,
    warranty_end_date: "2020-01-01",
  };
  let storageDownloadAttempted = false;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/warranty_tickets" && method === "GET") return json([expiredTicket]);
    if (url.pathname === "/storage/v1/object/remove" && method === "POST") return json({ message: "success" });
    if (url.pathname === "/rest/v1/warranty_tickets" && method === "DELETE") return json([]);
    if (url.pathname.includes("/storage/v1/object/crm-private/") && method === "GET") {
      storageDownloadAttempted = true;
      return new Response("should not be reached");
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const response = await getWarrantyFile({
      env,
      request: new Request(`https://crm.test/api/sales-check-file?file_name=${validTicket.ticket_file_name}`),
    });
    assert.equal(response.status, 410);
    assert.equal(storageDownloadAttempted, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("authenticated list performs backend expiry cleanup before returning active tickets", async () => {
  const originalFetch = globalThis.fetch;
  const expiredTicket = {
    ...validTicket,
    id: "44444444-4444-4444-a444-444444444444",
    ticket_file_name: "warranty_ticket_expired.pdf",
    warranty_end_date: "2020-01-01",
  };
  let cleanupDeleteSeen = false;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users" && method === "GET") return json([admin]);
    if (url.pathname === "/storage/v1/object/remove" && method === "POST") return json({ message: "success" });
    if (url.pathname === "/rest/v1/warranty_tickets" && method === "DELETE") {
      cleanupDeleteSeen = url.searchParams.get("warranty_end_date")?.startsWith("lt.");
      return json([]);
    }
    if (url.pathname === "/rest/v1/warranty_tickets" && method === "GET") {
      if (url.searchParams.has("warranty_end_date")) return json([expiredTicket]);
      return json([validTicket]);
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const token = await createSessionToken(env, admin);
    const response = await listWarrantyTickets({
      env,
      request: new Request("https://crm.test/api/warranty-tickets", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].id, validTicket.id);
    assert.equal(cleanupDeleteSeen, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("PDF generator uses one unique file, a public verification URL, and aligned text", async () => {
  const [warrantySource, apiSource, verificationPage] = await Promise.all([
    readFile(new URL("../crm/js/modules/warranty/index.js", import.meta.url), "utf8"),
    readFile(new URL("../crm/js/core/api.js", import.meta.url), "utf8"),
    readFile(new URL("../pages/warranty.html", import.meta.url), "utf8"),
  ]);

  assert.match(warrantySource, /crypto\?\.randomUUID|crypto\.randomUUID/);
  assert.match(warrantySource, /\/pages\/warranty\.html\?id=/);
  assert.match(warrantySource, /warranty_ticket_\$\{currentNo\}_\$\{ticketId\.slice\(0, 8\)\}_/);
  assert.match(warrantySource, /yFromTop\(lineTop - 6\)/);
  assert.match(warrantySource, /font\.widthOfTextAtSize/);
  assert.match(warrantySource, /if \(qrText && !qrBytes\) return "";/);
  assert.doesNotMatch(warrantySource, /firstUrl|firstDataUrl|finalDataUrl/);
  assert.doesNotMatch(apiSource, /"warehouseStock",\s*"warrantyTickets"/);
  assert.match(verificationPage, /\/api\/warranty-verify\?id=/);
  assert.match(verificationPage, /Kafolat taloni amal qiladi/);
});
