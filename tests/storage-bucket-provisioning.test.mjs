import assert from "node:assert/strict";
import test from "node:test";

const supabase = await import("../functions/api/_supabase.js");

test("storageUpload provisions a missing private bucket before uploading", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url);
    requests.push({
      url: requestUrl,
      method: String(options.method || "GET"),
      body: options.body ? String(options.body) : "",
    });

    if (requestUrl.endsWith("/storage/v1/bucket/test-private")) {
      return new Response(JSON.stringify({ message: "not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (requestUrl.endsWith("/storage/v1/bucket")) {
      return new Response(JSON.stringify({ name: "test-private" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (requestUrl.includes("/storage/v1/object/test-private/")) {
      return new Response(JSON.stringify({ Key: "system/state.json" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("unexpected request", { status: 500 });
  };

  try {
    await supabase.storageUpload(
      {
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
      },
      "test-private",
      "system/state.json",
      new TextEncoder().encode("{}"),
      "application/json",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    requests.map((request) => request.method),
    ["GET", "POST", "POST"],
  );
  const createPayload = JSON.parse(requests[1].body);
  assert.equal(createPayload.id, "test-private");
  assert.equal(createPayload.public, false);
  assert.match(requests[2].url, /\/storage\/v1\/object\/test-private\/system\/state\.json$/);
});
