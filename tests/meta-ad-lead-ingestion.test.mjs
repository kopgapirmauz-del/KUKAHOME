import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost } from "../functions/api/meta-webhook.js";

const APP_SECRET = "meta-lead-test-secret";
const env = {
  SUPABASE_URL: "https://meta-lead-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "meta-lead-service-role",
  META_APP_SECRET: APP_SECRET,
  META_GRAPH_VERSION: "v25.0",
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { "content-type": "application/json" },
  });
}

async function sign(body) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `sha256=${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

test("a signed Lead Ads webhook creates one attributed client and a hot pipeline card", async () => {
  const originalFetch = globalThis.fetch;
  const clientWrites = [];
  const leadWrites = [];
  const pipelineUploads = [];
  let leadReserved = false;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "graph.facebook.com") {
      if (url.pathname.endsWith("/lead-1")) {
        return json({
          id: "lead-1",
          created_time: "2026-07-28T10:00:00+0000",
          ad_id: "ad-1",
          form_id: "form-1",
          field_data: [
            { name: "first_name", values: ["Test"] },
            { name: "last_name", values: ["Customer"] },
            { name: "phone_number", values: ["+998901234567"] },
            { name: "email", values: ["test@example.com"] },
          ],
        });
      }
      if (url.pathname.endsWith("/ad-1")) {
        return json({
          id: "ad-1",
          name: "Kreslo lead ad",
          adset: { id: "set-1", name: "Toshkent" },
          campaign: { id: "campaign-1", name: "Kreslo Iyul" },
        });
      }
    }
    if (url.hostname === "meta-lead-test.supabase.co") {
      if (url.pathname === "/rest/v1/users") {
        return json([
          { id: "manager-1", role: "manager" },
          { id: "manager-2", role: "manager" },
        ]);
      }
      if (url.pathname === "/rest/v1/social_channels") {
        const platform = url.searchParams.get("platform");
        if (platform === "eq.meta_ads") {
          return json([{
            id: "channel-ads",
            platform: "meta_ads",
            external_account_id: "page-1",
            access_token: "page-token",
            status: "connected",
            connected_by: "admin-1",
          }]);
        }
        return json([]);
      }
      if (url.pathname === "/rest/v1/meta_ad_leads") {
        const body = init.body ? JSON.parse(String(init.body)) : null;
        if (method === "POST") {
          if (leadReserved) return json([]);
          leadReserved = true;
          leadWrites.push(body);
          return json([{ id: "tracking-1", ...body, created_at: new Date().toISOString() }]);
        }
        if (method === "PATCH") {
          leadWrites.push(body);
          return json([]);
        }
        return json([]);
      }
      if (url.pathname === "/rest/v1/clients" && method === "POST") {
        const body = JSON.parse(String(init.body));
        clientWrites.push(body);
        return json([{ id: "client-1", ...body }]);
      }
      if (url.pathname === "/rest/v1/clients" && method === "GET") return json([]);
      if (url.pathname === "/storage/v1/bucket/crm-data-private") {
        return json({}, { status: 404 });
      }
      if (url.pathname === "/storage/v1/bucket" && method === "POST") return json({});
      if (url.pathname.includes("/storage/v1/object/")) {
        if (method === "GET") return json({}, { status: 404 });
        if (method === "POST") {
          const text = init.body instanceof Uint8Array
            ? new TextDecoder().decode(init.body)
            : String(init.body);
          pipelineUploads.push(JSON.parse(text));
          return json({});
        }
      }
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  const payload = JSON.stringify({
    object: "page",
    entry: [{
      id: "page-1",
      changes: [{
        field: "leadgen",
        value: { leadgen_id: "lead-1", page_id: "page-1", form_id: "form-1", ad_id: "ad-1" },
      }],
    }],
  });

  try {
    const response = await onRequestPost({
      env,
      request: new Request("https://kukahome.uz/api/meta-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": await sign(payload),
        },
        body: payload,
      }),
    });
    assert.equal(response.status, 200);
    assert.equal(clientWrites.length, 1);
    assert.equal(clientWrites[0].source, "meta_ads");
    assert.equal(clientWrites[0].phone, "+998901234567");
    assert.match(clientWrites[0].note, /Meta lead ID: lead-1/);
    assert.ok(["manager-1", "manager-2"].includes(clientWrites[0].manager_id));
    assert.match(clientWrites[0].note, /Kampaniya: Kreslo Iyul/);
    assert.equal(pipelineUploads.length, 1);
    assert.equal(pipelineUploads[0].stage, "new");
    assert.equal(pipelineUploads[0].temperature, "hot");
    assert.ok(leadWrites.some((write) => write.processing_status === "completed"));
    assert.ok(leadWrites.some((write) => write.campaign_id === "campaign-1"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a retry recovers a previously created Meta client instead of duplicating it", async () => {
  const originalFetch = globalThis.fetch;
  const clientWrites = [];
  const pipelineUploads = [];
  const leadWrites = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.hostname === "graph.facebook.com" && url.pathname.endsWith("/lead-retry")) {
      return json({
        id: "lead-retry",
        created_time: "2026-07-28T11:00:00+0000",
        form_id: "form-retry",
        field_data: [{ name: "phone_number", values: ["+998909999999"] }],
      });
    }
    if (url.hostname === "meta-lead-test.supabase.co") {
      if (url.pathname === "/rest/v1/social_channels") {
        return json([{
          id: "channel-ads",
          platform: "meta_ads",
          external_account_id: "page-1",
          access_token: "page-token",
          status: "connected",
          connected_by: "admin-1",
        }]);
      }
      if (url.pathname === "/rest/v1/meta_ad_leads") {
        const body = init.body ? JSON.parse(String(init.body)) : null;
        if (method === "POST") return json([]);
        if (method === "GET") {
          return json([{
            id: "tracking-retry",
            leadgen_id: "lead-retry",
            processing_status: "error",
            updated_at: "2026-07-28T10:00:00.000Z",
            client_id: null,
          }]);
        }
        if (method === "PATCH") {
          leadWrites.push(body);
          return json([]);
        }
      }
      if (url.pathname === "/rest/v1/clients" && method === "GET") {
        assert.match(String(url.searchParams.get("note")), /Meta lead ID: lead-retry/);
        return json([{ id: "client-existing" }]);
      }
      if (url.pathname === "/rest/v1/clients" && method === "POST") {
        clientWrites.push(JSON.parse(String(init.body)));
        return json([{ id: "duplicate-client" }]);
      }
      if (url.pathname === "/storage/v1/bucket/crm-data-private") {
        return json({}, { status: 404 });
      }
      if (url.pathname === "/storage/v1/bucket" && method === "POST") return json({});
      if (url.pathname.includes("/storage/v1/object/")) {
        if (method === "GET") return json({}, { status: 404 });
        if (method === "POST") {
          const text = init.body instanceof Uint8Array
            ? new TextDecoder().decode(init.body)
            : String(init.body);
          pipelineUploads.push(JSON.parse(text));
          return json({});
        }
      }
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  const payload = JSON.stringify({
    object: "page",
    entry: [{
      id: "page-1",
      changes: [{
        field: "leadgen",
        value: { leadgen_id: "lead-retry", page_id: "page-1", form_id: "form-retry" },
      }],
    }],
  });

  try {
    const response = await onRequestPost({
      env,
      request: new Request("https://kukahome.uz/api/meta-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": await sign(payload),
        },
        body: payload,
      }),
    });
    assert.equal(response.status, 200);
    assert.equal(clientWrites.length, 0, "the retry must reuse the existing client");
    assert.equal(pipelineUploads.length, 1);
    assert.equal(pipelineUploads[0].clientId, "client-existing");
    assert.ok(leadWrites.some((write) => write.client_id === "client-existing"));
    assert.ok(leadWrites.some((write) => write.processing_status === "completed"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
