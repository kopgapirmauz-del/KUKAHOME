import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const i18nUrl = new URL("../crm/js/core/i18n.js", import.meta.url);
const utilsUrl = new URL("../crm/js/core/utils.js", import.meta.url);
const apiUrl = new URL("../crm/js/core/api.js", import.meta.url);
const bootstrapUrl = new URL("../crm/js/core/bootstrap.js", import.meta.url);

async function extract(url, startMarker, endMarker) {
  // Some CRM sources are CRLF; normalise so the markers below match either way.
  const source = (await readFile(url, "utf8")).replace(/\r\n/g, "\n");
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing ${endMarker} after ${startMarker}`);
  return source.slice(start, end);
}

// A snapshot in exactly the shape supabase/scripts/export_offline_snapshot.sql
// produces, including the two real-world login spellings from the database.
const EXPORTED = {
  meta: { updatedAt: "2026-08-26T10:00:00.000Z" },
  stores: [{ id: "store_1111", name: "Chilonzor" }],
  users: [
    {
      id: "mgr_aaa", role: "admin", login: "Muxammad", password: "Kuka2026!",
      firstName: "Muxammad", lastName: "Erimbetov", avatar: "",
      storeId: "", phone: "", telegramId: "",
    },
    {
      id: "mgr_bbb", role: "community_manager", login: "shaxlo", password: "Kuka2026!",
      firstName: "Shaxlo", lastName: "Tillaboyeva", avatar: "",
      storeId: "store_1111", phone: "", telegramId: "",
    },
  ],
  clients: [{ id: "c1", contact: "+998901112233", storeId: "store_1111", managerId: "mgr_bbb" }],
  notifications: [], salesChecks: [], warehouseOrders: [], warehouseIncoming: [],
  warehouseStock: [], warrantyTickets: [], vacancies: [], vacancyOpenings: [],
};

test("?offline=1 turns the remote backend off, and only that", async () => {
  const source = (await readFile(i18nUrl, "utf8")).replace(/\r\n/g, "\n");
  const block = source.slice(source.indexOf("const OFFLINE_MODE"), source.indexOf("const API_DB_URL"));

  const run = (search, stored) => {
    const store = new Map(stored ? [["premium_crm_offline_v1", stored]] : []);
    const sandbox = {
      location: { search, protocol: "https:" },
      sessionStorage: {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
      },
      URLSearchParams,
    };
    const fn = new Function(
      "location", "sessionStorage", "URLSearchParams",
      `const LS_OFFLINE_MODE = "premium_crm_offline_v1";\n${block}\nreturn { OFFLINE_MODE, REMOTE_DB_ENABLED };`,
    );
    return fn(sandbox.location, sandbox.sessionStorage, sandbox.URLSearchParams);
  };

  // Normal site: unchanged behaviour.
  assert.deepEqual(run("", null), { OFFLINE_MODE: false, REMOTE_DB_ENABLED: true });
  // Opting in.
  assert.deepEqual(run("?offline=1", null), { OFFLINE_MODE: true, REMOTE_DB_ENABLED: false });
  // The flag survives a reload without the query string.
  assert.deepEqual(run("", "1"), { OFFLINE_MODE: true, REMOTE_DB_ENABLED: false });
  // And can be switched back off.
  assert.deepEqual(run("?offline=0", "1"), { OFFLINE_MODE: false, REMOTE_DB_ENABLED: true });
});

test("an exported snapshot survives normalizeDBShape with its passwords intact", async () => {
  const normalize = await extract(utilsUrl, "function normalizeDBShape(", "\nfunction uid(");
  const hasCore = await extract(apiUrl, "function hasCoreData(", "\nasync function fetchRemoteDB(");

  // Offline mode is exactly REMOTE_DB_ENABLED === false.
  const fn = new Function(
    "REMOTE_DB_ENABLED", "uid",
    `${normalize}\n${hasCore}\nreturn { normalizeDBShape, hasCoreData };`,
  );
  const { normalizeDBShape, hasCoreData } = fn(false, (p) => `${p}_x`);

  const db = normalizeDBShape(structuredClone(EXPORTED));
  assert.equal(hasCoreData(db), true, "seedDB must accept the snapshot as core data");
  // normalizeDBShape wipes passwords when the remote backend is on; offline it
  // must keep them, because offline login is the only thing that verifies them.
  assert.equal(db.users[0].password, "Kuka2026!");
  assert.equal(db.users[1].password, "Kuka2026!");
});

test("online mode still strips passwords out of the browser copy", async () => {
  const normalize = await extract(utilsUrl, "function normalizeDBShape(", "\nfunction uid(");
  const fn = new Function("REMOTE_DB_ENABLED", "uid", `${normalize}\nreturn normalizeDBShape;`);
  const db = fn(true, (p) => `${p}_x`)(structuredClone(EXPORTED));
  assert.equal(db.users[0].password, "");
});

test("offline login accepts the real logins case-insensitively", async () => {
  const loginBlock = await extract(bootstrapUrl, "  const normalized = loginValue.toLowerCase();", "\n  return { user: localUser");

  const attempt = (loginValue, passwordValue) => {
    const fn = new Function(
      "state", "loginValue", "passwordValue",
      `${loginBlock}\nreturn localUser;`,
    );
    return fn({ db: EXPORTED }, loginValue, passwordValue);
  };

  // The exact spelling stored in the database.
  assert.equal(attempt("Muxammad", "Kuka2026!")?.id, "mgr_aaa");
  // What a phone keyboard actually sends - the original bug.
  assert.equal(attempt("muxammad", "Kuka2026!")?.id, "mgr_aaa");
  assert.equal(attempt("MUXAMMAD", "Kuka2026!")?.id, "mgr_aaa");
  // A lowercase-stored login typed with an auto-capitalised first letter.
  assert.equal(attempt("Shaxlo", "Kuka2026!")?.id, "mgr_bbb");

  // Wrong password and unknown user are still refused.
  assert.equal(attempt("Muxammad", "boshqa"), null);
  assert.equal(attempt("yoq", "Kuka2026!"), null);
});
