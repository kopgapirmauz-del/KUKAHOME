import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// crm/js is a plain-script tree, not an ES module tree, so the functions under
// test are loaded into an isolated scope with their globals stubbed.
async function loadSnapshotHarness({ remoteDB, localDb }) {
  const source = await readFile(new URL("../crm/js/core/api.js", import.meta.url), "utf8");

  const pick = (name) => {
    const start = ["function ", "async function "]
      .map((kw) => source.indexOf(`${kw}${name}(`))
      .filter((i) => i !== -1)
      .sort((a, b) => a - b)[0];
    assert.notEqual(start, undefined, `helper ${name} is missing from crm/js/core/api.js`);
    const declStart = source.lastIndexOf("async function", start) === start - 6
      ? start - 6
      : start;
    const end = source.indexOf("\n}\n", start);
    assert.notEqual(end, -1, `helper ${name} is not a top-level declaration`);
    return source.slice(declStart, end + 3);
  };

  // One contiguous slice so the module-level `let` state stays wired to the
  // functions that read it.
  const blockStart = source.indexOf("const SNAPSHOT_OWNED_KEYS");
  assert.notEqual(blockStart, -1, "SNAPSHOT_OWNED_KEYS is missing");
  const rebaseStart = source.indexOf("async function rebaseSnapshotPush(");
  assert.notEqual(rebaseStart, -1, "rebaseSnapshotPush is missing");
  const blockEnd = source.indexOf("\n}\n", rebaseStart);
  const block = source.slice(blockStart, blockEnd + 3);

  const helpers = ["adoptRemoteVersion", "indexWarehouseById", "sameWarehouseRow", "mergeRowsById"]
    .map(pick)
    .join("\n");

  const state = { user: { id: "u1" }, db: JSON.parse(JSON.stringify(localDb)) };
  const fetched = [];
  const stubs = {
    state,
    REMOTE_DB_ENABLED: true,
    LS_DB: "crm_db",
    localStorage: { setItem() {}, getItem: () => null },
    fetchRemoteDB: async () => {
      fetched.push(1);
      return remoteDB ? JSON.parse(JSON.stringify(remoteDB)) : null;
    },
  };

  const factory = new Function(
    ...Object.keys(stubs),
    `${helpers}\n${block}\nreturn { refreshExtendedDataAfterAuth, rebaseSnapshotPush, captureSnapshotBase };`,
  );
  return { state, fetched, ...factory(...Object.values(stubs)) };
}

const EMPTY_DB = {
  meta: {},
  salesChecks: [],
  warehouseIncoming: [],
  vacancies: [],
  vacancyOpenings: [],
};

test("a conflicting push is rebased instead of discarding the user's sales check", async () => {
  // This browser created check A. Another manager created check B and their
  // write reached the server first, so our push came back 409.
  const localDb = {
    ...EMPTY_DB,
    meta: { remoteVersion: "2026-07-26T10:00:00.000Z" },
    salesChecks: [{ id: "check-A", checkNo: 1, total: 500 }],
  };
  const remoteDB = {
    ...EMPTY_DB,
    meta: { updatedAt: "2026-07-26T10:00:07.000Z", remoteVersion: "2026-07-26T10:00:07.000Z" },
    clients: [{ id: "client-owned-by-server" }],
    salesChecks: [{ id: "check-B", checkNo: 2, total: 900 }],
  };

  const h = await loadSnapshotHarness({ remoteDB, localDb });
  // Establish the agreed base the way a login would, before either edit.
  h.captureSnapshotBase({ ...EMPTY_DB });

  const payload = JSON.parse(JSON.stringify(localDb));
  const rebased = await h.rebaseSnapshotPush(payload);

  assert.ok(rebased, "rebase must produce a payload to retry with");
  const ids = rebased.salesChecks.map((r) => r.id).sort();
  assert.deepEqual(ids, ["check-A", "check-B"], "both managers' sales checks must survive");
  assert.deepEqual(
    h.state.db.salesChecks.map((r) => r.id).sort(),
    ["check-A", "check-B"],
    "the in-memory state must show the merged result too",
  );
  assert.equal(
    rebased.meta.remoteVersion,
    "2026-07-26T10:00:07.000Z",
    "the retry must carry the version the server actually holds",
  );
  // The retry starts from the server snapshot, so data owned by a dedicated
  // endpoint is not republished from this browser's stale copy.
  assert.deepEqual(rebased.clients, [{ id: "client-owned-by-server" }]);
});

test("rebase keeps a locally deleted row deleted", async () => {
  const localDb = { ...EMPTY_DB, salesChecks: [{ id: "keep", total: 1 }] };
  const remoteDB = {
    ...EMPTY_DB,
    meta: { updatedAt: "2026-07-26T11:00:00.000Z" },
    salesChecks: [{ id: "keep", total: 1 }, { id: "deleted-here", total: 2 }],
  };

  const h = await loadSnapshotHarness({ remoteDB, localDb });
  // Both rows were agreed before this browser deleted one of them.
  h.captureSnapshotBase({
    ...EMPTY_DB,
    salesChecks: [{ id: "keep", total: 1 }, { id: "deleted-here", total: 2 }],
  });

  const rebased = await h.rebaseSnapshotPush(JSON.parse(JSON.stringify(localDb)));
  assert.deepEqual(rebased.salesChecks.map((r) => r.id), ["keep"], "the deletion must not be undone");
});

test("rebase with no agreed base yet keeps both sides rather than dropping either", async () => {
  const localDb = { ...EMPTY_DB, salesChecks: [{ id: "local-only" }] };
  const remoteDB = {
    ...EMPTY_DB,
    meta: { updatedAt: "2026-07-26T12:00:00.000Z" },
    salesChecks: [{ id: "server-only" }],
  };

  // No captureSnapshotBase call: this is the first sync of the session.
  const h = await loadSnapshotHarness({ remoteDB, localDb });
  const rebased = await h.rebaseSnapshotPush(JSON.parse(JSON.stringify(localDb)));
  assert.deepEqual(
    rebased.salesChecks.map((r) => r.id).sort(),
    ["local-only", "server-only"],
    "without a base the merge must be a union, never a deletion",
  );
});

test("the background poll merges snapshot data instead of overwriting unsaved work", async () => {
  const remoteDB = {
    ...EMPTY_DB,
    meta: { updatedAt: "2026-07-26T13:00:00.000Z", remoteVersion: "2026-07-26T13:00:00.000Z" },
    salesChecks: [{ id: "from-server" }],
  };
  const localDb = { ...EMPTY_DB, meta: {}, salesChecks: [] };

  const h = await loadSnapshotHarness({ remoteDB, localDb });

  // First authenticated read adopts server truth outright.
  await h.refreshExtendedDataAfterAuth();
  assert.deepEqual(h.state.db.salesChecks.map((r) => r.id), ["from-server"]);

  // The user now adds a check. Its save has not run yet when the 4s poll fires.
  h.state.db.salesChecks.unshift({ id: "just-typed-in" });
  await h.refreshExtendedDataAfterAuth();

  assert.deepEqual(
    h.state.db.salesChecks.map((r) => r.id).sort(),
    ["from-server", "just-typed-in"],
    "a poll must not wipe a row the user has added but not yet saved",
  );
});

test("the poll still applies a row another session added", async () => {
  const localDb = { ...EMPTY_DB, salesChecks: [] };
  const h = await loadSnapshotHarness({
    remoteDB: {
      ...EMPTY_DB,
      meta: { updatedAt: "2026-07-26T14:00:00.000Z" },
      salesChecks: [{ id: "added-elsewhere" }],
    },
    localDb,
  });

  h.captureSnapshotBase({ ...EMPTY_DB });
  const changed = await h.refreshExtendedDataAfterAuth();

  assert.ok(changed.includes("salesChecks"), "the poll must report the change so the page re-renders");
  assert.deepEqual(h.state.db.salesChecks.map((r) => r.id), ["added-elsewhere"]);
});
