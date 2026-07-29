import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("the Integrations voronka tab opens the canonical server-backed sales pipeline", async () => {
  const source = await readFile(
    new URL("../crm/js/modules/integrations/inbox.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /requested === "funnel"[\s\S]*switchPage\("pipeline"\)/);
});

test("pipeline stage totals keep UZS and USD values separate", async () => {
  const source = await readFile(
    new URL("../crm/js/modules/pipeline/index.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /const totalUzs = rows\.filter\(\(item\) => item\.currency === "UZS"\)/);
  assert.match(source, /const totalUsd = rows\.filter\(\(item\) => item\.currency === "USD"\)/);
  assert.match(source, /formatMoney\(totalUsd, "USD"\)/);
});

test("the connection panel presents Instagram Direct, comments, and Lead Forms as clear sources", async () => {
  const [html, source] = await Promise.all([
    readFile(new URL("../crm/index.html", import.meta.url), "utf8"),
    readFile(new URL("../crm/js/modules/integrations/inbox.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /Direct &amp; Stories/);
  assert.match(html, /Kommentariyalar/);
  assert.match(html, /Lead formalarni ulash/);
  assert.match(source, /Direct &amp; Stories/);
  assert.match(source, /Lead formalar → voronka/);
  assert.doesNotMatch(html, /Meta App kalitlari/);
});
