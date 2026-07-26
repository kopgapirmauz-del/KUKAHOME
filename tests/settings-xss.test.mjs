import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const settingsUrl = new URL("../crm/js/modules/settings/index.js", import.meta.url);
const utilsUrl = new URL("../crm/js/core/utils.js", import.meta.url);

async function loadEscapeHtml() {
  const source = await readFile(utilsUrl, "utf8");
  const start = source.indexOf("function escapeHtml(");
  assert.notEqual(start, -1, "escapeHtml is missing from crm/js/core/utils.js");
  const end = source.indexOf("\n}\n", start);
  return new Function(`${source.slice(start, end + 3)}\nreturn escapeHtml;`)();
}

// A user sets their own display name via the profile form. upsertUserFromApi
// splits full_name on whitespace into firstName/lastName and the manager list
// re-joins them as "lastName firstName", so the payload is written rotated to
// come out in the right order.
const PAYLOAD = "onerror=alert(1)> <img src=x";

test("escapeHtml neutralises a stored name payload", async () => {
  const escapeHtml = await loadEscapeHtml();
  const out = escapeHtml(`1. ${PAYLOAD} (Manager) - Shop`);
  assert.doesNotMatch(out, /<img/, "the tag must not survive escaping");
  assert.ok(out.includes("&lt;"), "angle brackets must be entity encoded");
});

test("the manager and store lists escape every value they interpolate", async () => {
  const source = await readFile(settingsUrl, "utf8");

  // The manager list builds lineText from user-controlled firstName/lastName.
  assert.match(
    source,
    /<span class="user-row-text">\$\{escapeHtml\(lineText\)\}<\/span>/,
    "manager list must escape lineText",
  );
  assert.match(
    source,
    /data-edit-mid="\$\{escapeHtml\(m\.id\)\}"/,
    "manager list must escape the edit id",
  );
  assert.match(
    source,
    /data-mid="\$\{escapeHtml\(m\.id\)\}"/,
    "manager list must escape the delete id",
  );

  // The store list interpolates an admin-controlled store name.
  assert.match(
    source,
    /<span class="store-row-text">\$\{escapeHtml\(`\$\{idx \+ 1\}\. \$\{s\.name\}`\)\}<\/span>/,
    "store list must escape the store name",
  );
  assert.match(source, /data-edit-sid="\$\{escapeHtml\(s\.id\)\}"/);
  assert.match(source, /data-sid="\$\{escapeHtml\(s\.id\)\}"/);

  // Guard against a regression that reintroduces raw interpolation of these
  // specific user-controlled values into markup.
  assert.doesNotMatch(source, /user-row-text">\$\{lineText\}/);
  assert.doesNotMatch(source, /store-row-text">\$\{idx \+ 1\}\. \$\{s\.name\}/);
});
