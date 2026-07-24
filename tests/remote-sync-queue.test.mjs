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
  assert.match(clientSource, /if\s*\(res\.status\s*===\s*409\s*\|\|\s*res\.status\s*===\s*428\)/);
  assert.match(clientSource, /queuedRemoteDB\s*=\s*null;\s*settleRemotePushWaiters\("conflict"\)/);
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
