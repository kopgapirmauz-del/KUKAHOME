import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("a failed remote save cannot overwrite a newer queued snapshot", async () => {
  const source = await readFile(new URL("../crm/js/core/api.js", import.meta.url), "utf8");
  assert.match(
    source,
    /if\s*\(!result\)\s*\{\s*\/\/[\s\S]*?if\s*\(!queuedRemoteDB\)\s+queuedRemoteDB\s*=\s*payload;/,
  );
  assert.doesNotMatch(
    source,
    /if\s*\(!result\)\s*\{\s*queuedRemoteDB\s*=\s*payload;/,
  );
  assert.match(
    source,
    /queuedRemoteDB\.meta\.remoteVersion\s*=\s*String\(state\.db\?\.meta\?\.remoteVersion/,
  );
  assert.match(source, /if\s*\(!state\.user\s*\|\|\s*!getApiToken\(\)\)\s+return Promise\.resolve\(false\)/);
});

test("the snapshot API stops legacy clients from retrying a durable save", async () => {
  const source = await readFile(new URL("../functions/api/db.js", import.meta.url), "utf8");
  assert.match(
    source,
    /Response\.json\(\{\s*ok:\s*true,\s*mirrored:\s*true,\s*relationalMirrored:\s*mirrored,\s*version\s*\}\)/,
  );
});

test("snapshot writes reject a stale browser version instead of overwriting newer data", async () => {
  const [clientSource, apiSource] = await Promise.all([
    readFile(new URL("../crm/js/core/api.js", import.meta.url), "utf8"),
    readFile(new URL("../functions/api/db.js", import.meta.url), "utf8"),
  ]);
  assert.match(clientSource, /headers\["If-Match"\]\s*=\s*`"\$\{remoteVersion\}"`/);
  assert.match(clientSource, /if\s*\(res\.status\s*===\s*409\s*\|\|\s*res\.status\s*===\s*428\)\s*return\s*"conflict";/);

  // A rejected write must be rebased onto the server's newest state and then
  // retried, never re-sent unchanged (which is what would overwrite newer
  // data) and never silently dropped (which is what lost a manager's sales
  // check when two people saved at the same moment). The retry is bounded.
  assert.match(clientSource, /result\s*===\s*"conflict"\s*&&\s*attempt\s*<\s*\d+/);
  assert.match(clientSource, /const rebased\s*=\s*await rebaseSnapshotPush\(payload\);/);
  assert.match(clientSource, /if\s*\(!rebased\)\s*break;/);
  assert.match(clientSource, /payload\s*=\s*rebased;/);

  // Rebasing starts from the server's snapshot, so a queued whole-DB push
  // cannot republish this browser's stale copy of endpoint-owned data.
  const rebaseBody = clientSource.slice(
    clientSource.indexOf("async function rebaseSnapshotPush"),
    clientSource.indexOf("async function pushRemoteDB"),
  );
  assert.match(rebaseBody, /const remoteDB\s*=\s*await fetchRemoteDB\(\);/);
  assert.match(rebaseBody, /JSON\.parse\(JSON\.stringify\(remoteDB\)\)/);
  // Merged per key, never replaced wholesale. mergeSnapshotKey dispatches to
  // mergeRowsById for the id-keyed arrays and to the object-shaped merges for
  // integrations and priceLabels.
  assert.match(rebaseBody, /mergeSnapshotKey\(/);
  assert.match(clientSource, /function mergeSnapshotKey\([\s\S]*?mergeRowsById\(/);

  // Exhausting the retries still surfaces the conflict rather than reporting
  // a save that never happened.
  assert.match(
    clientSource,
    /queuedRemoteDB\s*=\s*null;\s*showToast\(t\("syncConflict"\),\s*"error"\);\s*settleRemotePushWaiters\("conflict"\)/,
  );
  assert.match(apiSource, /error:\s*"snapshot_version_conflict"/);
  assert.match(apiSource, /\{\s*status:\s*409\s*\}/);
  assert.match(apiSource, /error:\s*"snapshot_version_required"/);
  assert.match(apiSource, /\{\s*status:\s*428\s*\}/);
});

test("login pulls shared warehouse state before saving login metrics", async () => {
  const source = await readFile(new URL("../crm/js/core/bootstrap.js", import.meta.url), "utf8");
  const loginBody = source.slice(source.indexOf("async function onLogin"), source.indexOf("async function login()"));
  assert.ok(loginBody.indexOf("await refreshExtendedDataAfterAuth();") >= 0);
  assert.ok(loginBody.indexOf("await refreshExtendedDataAfterAuth();") < loginBody.indexOf("saveDB();"));
  const seedBody = source.slice(source.indexOf("async function seedDB"), source.indexOf("function extendedDataScore"));
  assert.doesNotMatch(seedBody, /pushRemoteDB\(/);
});
