import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("a failed remote save cannot overwrite a newer queued snapshot", async () => {
  const source = await readFile(new URL("../crm/js/core/api.js", import.meta.url), "utf8");
  assert.match(
    source,
    /if\s*\(!ok\)\s*\{\s*\/\/[\s\S]*?if\s*\(!queuedRemoteDB\)\s+queuedRemoteDB\s*=\s*payload;/,
  );
  assert.doesNotMatch(
    source,
    /if\s*\(!ok\)\s*\{\s*queuedRemoteDB\s*=\s*payload;/,
  );
});
