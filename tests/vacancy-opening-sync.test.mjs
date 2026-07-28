import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createSessionToken } from "../functions/api/_auth.js";
import {
  onRequestGet,
  onRequestPut,
} from "../functions/api/vacancies.js";

const env = {
  SUPABASE_URL: "https://vacancy-sync-test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "vacancy-sync-test-service-role-key",
};

const admin = {
  id: "11111111-1111-4111-a111-111111111111",
  full_name: "HR Admin",
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

test("editing an opening updates the same full regulation returned to the public site", async () => {
  const originalFetch = globalThis.fetch;
  const id = "22222222-2222-4222-a222-222222222222";
  const fullRegulation = [
    "Vakansiya haqida to'liq ma'lumot",
    "",
    "Vazifalar:",
    "- Mijozlar bilan ishlash",
    "- CRM hisobotlarini yuritish",
    "",
    "Talablar:",
    "- O'zbek va rus tillari",
  ].join("\n");
  let opening = {
    id,
    title: "Sotuv menejeri",
    description: "Eski reglament",
    published_at: "2026-07-28T04:00:00.000Z",
    order_no: 1,
    created_at: "2026-07-28T04:00:00.000Z",
  };
  let patchBody = null;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = String(init.method || "GET").toUpperCase();
    if (url.pathname === "/rest/v1/users" && method === "GET") return json([admin]);
    if (url.pathname === "/rest/v1/vacancy_openings" && method === "GET") {
      return json([opening]);
    }
    if (url.pathname === "/rest/v1/vacancy_openings" && method === "PATCH") {
      patchBody = JSON.parse(String(init.body || "{}"));
      opening = {
        ...opening,
        title: patchBody.title,
        description: patchBody.description,
        published_at: patchBody.published_at,
      };
      return json([opening]);
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  try {
    const token = await createSessionToken(env, admin);
    const update = await onRequestPut({
      env,
      request: new Request("https://crm.test/api/vacancies", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          type: "opening",
          position: "Sotuv menejeri",
          regulation: fullRegulation,
          created_at: "2026-07-28T04:00:00.000Z",
        }),
      }),
    });
    assert.equal(update.status, 200);
    assert.equal((await update.json()).item.description, fullRegulation);
    assert.equal(patchBody.description, fullRegulation);

    const publicResponse = await onRequestGet({
      env,
      request: new Request("https://crm.test/api/vacancies?type=openings"),
    });
    assert.equal(publicResponse.status, 200);
    const publicPayload = await publicResponse.json();
    assert.equal(publicPayload.items.length, 1);
    assert.equal(publicPayload.items[0].description, fullRegulation);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("CRM shortens only the table preview while the pencil editor keeps the full value", async () => {
  const [hrSource, apiSource, siteSource, cssSource] = await Promise.all([
    readFile(new URL("../crm/js/modules/hr/index.js", import.meta.url), "utf8"),
    readFile(new URL("../crm/js/core/api.js", import.meta.url), "utf8"),
    readFile(new URL("../assets/js/main.js", import.meta.url), "utf8"),
    readFile(new URL("../crm/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(hrSource, /const HR_OPENING_PREVIEW_LIMIT = 72;/);
  assert.match(hrSource, /openingRegulationPreview\(row\)/);
  assert.match(
    hrSource,
    /hrVacancyRegulationInput\.value = regulation === "-" \? "" : regulation;/,
  );
  assert.match(hrSource, /updateVacancyOpeningViaApi\(payload\)/);
  assert.match(apiSource, /method:\s*"PUT"[\s\S]*?type:\s*"opening"/);
  assert.match(
    apiSource,
    /regulation:\s*String\(row\.description \|\| row\.note \|\| row\.regulation \|\| row\.details \|\| ""\)\.trim\(\)/,
  );
  assert.match(siteSource, /row\.description \|\| row\.details \|\| row\.requirements \|\| row\.note/);
  assert.match(cssSource, /-webkit-line-clamp:\s*2;/);
});
