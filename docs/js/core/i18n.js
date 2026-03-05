// /public/js/core/i18n.js
// Sodda va kuchli i18n: uz/ru/en JSON dan o'qiydi, DOM ni yangilaydi.

import { $, $$ } from "./dom.js";
import { CONFIG } from "./config.js";
import { LangStore } from "./store.js";

let DICT = {};
let CURRENT_LANG = CONFIG.i18n.defaultLang;

// JSON cache (brauzer ichida)
const _cache = new Map();

/**
 * JSON yuklab olish (public/data/i18n/uz.json ...)
 */
async function loadDict(lang) {
  const safeLang = CONFIG.i18n.supported.includes(lang)
    ? lang
    : CONFIG.i18n.defaultLang;

  if (_cache.has(safeLang)) return _cache.get(safeLang);

  const url = `/data/i18n/${safeLang}.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Til fayli topilmadi: " + url);

  const json = await res.json();
  _cache.set(safeLang, json);
  return json;
}

/**
 * "nav.catalog" -> DICT.nav.catalog
 */
function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return undefined;
  }
  return cur;
}

/**
 * Text ichida {{var}} almashtirish
 */
function template(str, vars = {}) {
  return String(str).replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : ""
  );
}

/**
 * Tarjima olish:
 * t("nav.catalog") -> "Katalog"
 */
export function t(key, vars) {
  const v = getByPath(DICT, key);
  if (v === undefined || v === null) return key; // topilmasa key qaytaradi
  if (typeof v === "string") return template(v, vars);
  // agar object/array bo'lsa string emas, shunchaki qaytaramiz
  return v;
}

/**
 * DOM ni yangilash:
 * - data-i18n: textContent
 * - data-i18n-html: innerHTML (faqat siz ishonchli matn qo'ysangiz ishlating)
 * - data-i18n-placeholder: placeholder
 * - data-i18n-title: title
 * - data-i18n-aria: aria-label
 */
export function applyI18n(root = document, vars = {}) {
  // text
  $$("[data-i18n]", root).forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key, vars);
  });

  // html (ehtiyotkorlik bilan)
  $$("[data-i18n-html]", root).forEach((node) => {
    const key = node.getAttribute("data-i18n-html");
    node.innerHTML = t(key, vars);
  });

  // placeholder
  $$("[data-i18n-placeholder]", root).forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    node.setAttribute("placeholder", t(key, vars));
  });

  // title
  $$("[data-i18n-title]", root).forEach((node) => {
    const key = node.getAttribute("data-i18n-title");
    node.setAttribute("title", t(key, vars));
  });

  // aria-label
  $$("[data-i18n-aria]", root).forEach((node) => {
    const key = node.getAttribute("data-i18n-aria");
    node.setAttribute("aria-label", t(key, vars));
  });

  // lang atributini ham yangilab qo'yamiz
  document.documentElement.setAttribute("lang", CURRENT_LANG);
}

/**
 * Tilni set qilish (saqlaydi, dict yuklaydi, DOM yangilaydi)
 */
export async function setLang(lang, { root = document, vars = {} } = {}) {
  const next = CONFIG.i18n.supported.includes(lang)
    ? lang
    : CONFIG.i18n.defaultLang;

  CURRENT_LANG = next;
  LangStore.set(next);

  DICT = await loadDict(next);
  applyI18n(root, vars);

  // UI dagi "lang button"larni active qilish
  syncLangButtons();

  return next;
}

/**
 * Hozirgi til
 */
export function getLang() {
  return CURRENT_LANG;
}

/**
 * Lang buttonlar:
 * <button data-lang="uz">UZ</button>
 * <button data-lang="ru">RU</button>
 */
function syncLangButtons() {
  $$("[data-lang]").forEach((btn) => {
    const l = btn.getAttribute("data-lang");
    btn.classList.toggle("is-active", l === CURRENT_LANG);
    btn.setAttribute("aria-pressed", l === CURRENT_LANG ? "true" : "false");
  });
}

/**
 * Lang switch listenerlarni ulash
 */
export function bindLangSwitch({ root = document } = {}) {
  root.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.("[data-lang]");
    if (!btn) return;
    const l = btn.getAttribute("data-lang");
    if (!l) return;

    await setLang(l);
  });
}

/**
 * Init:
 * - localStorage'dan tilni oladi
 * - dict yuklaydi
 * - DOM ni yangilaydi
 * - lang buttonlarni ulaydi
 */
export async function initI18n({ root = document, vars = {} } = {}) {
  const saved = LangStore.get();
  CURRENT_LANG = saved;

  DICT = await loadDict(CURRENT_LANG);
  applyI18n(root, vars);
  bindLangSwitch({ root });
  syncLangButtons();

  return CURRENT_LANG;
}