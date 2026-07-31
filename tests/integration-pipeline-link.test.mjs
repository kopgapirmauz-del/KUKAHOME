import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("Integrations page is inbox-only; the sales pipeline is its own top-level page", async () => {
  const [html, source] = await Promise.all([
    readFile(new URL("../crm/index.html", import.meta.url), "utf8"),
    readFile(new URL("../crm/js/modules/integrations/inbox.js", import.meta.url), "utf8"),
  ]);
  const integrationsPageMatch = html.match(/<div id="integrationsPage"[\s\S]*?<\/div>\s*\n\s*<div id="warehousePage"/);
  assert.ok(integrationsPageMatch, "integrationsPage section should exist");
  assert.match(integrationsPageMatch[0], /integrationsInboxView/);
  assert.doesNotMatch(integrationsPageMatch[0], /integrations-tabbar/);
  assert.doesNotMatch(integrationsPageMatch[0], /integrationsFunnelView/);
  assert.doesNotMatch(integrationsPageMatch[0], /integrationsChannelsView/);
  assert.match(html, /data-page="pipeline"/);
  assert.doesNotMatch(source, /showIntegrationsTab/);
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
  const [html, source, api] = await Promise.all([
    readFile(new URL("../crm/index.html", import.meta.url), "utf8"),
    readFile(new URL("../crm/js/modules/integrations/inbox.js", import.meta.url), "utf8"),
    readFile(new URL("../functions/api/integrations.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /Direct &amp; Stories/);
  assert.match(html, /Kommentariyalar/);
  assert.match(html, /Lead formalarni ulash/);
  assert.match(source, /Direct &amp; Stories/);
  assert.match(source, /Lead formalar → voronka/);
  assert.doesNotMatch(html, /Meta App kalitlari/);
  assert.match(html, /data-meta-source-card hidden/);
  assert.match(source, /card\.hidden = data\?\.meta_available !== true/);
  assert.match(api, /meta_available: metaAvailable/);
});
