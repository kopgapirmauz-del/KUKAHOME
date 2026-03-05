// /public/js/core/dom.js
// DOM helperlar: element topish, yaratish, event, debounce/throttle

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Element yaratish (tez va toza).
 * Example:
 *  const btn = el("button", { class: "btn", type:"button" }, "Buyurtma");
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);

  // atributlar / propertylar
  for (const [key, val] of Object.entries(attrs || {})) {
    if (val === null || val === undefined) continue;

    if (key === "class") node.className = String(val);
    else if (key === "dataset" && typeof val === "object") {
      for (const [dKey, dVal] of Object.entries(val)) node.dataset[dKey] = String(dVal);
    } else if (key.startsWith("on") && typeof val === "function") {
      // onClick, onInput...
      node.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key in node) {
      // value, checked, disabled, href...
      node[key] = val;
    } else {
      node.setAttribute(key, String(val));
    }
  }

  // children
  for (const ch of children.flat()) {
    if (ch === null || ch === undefined || ch === false) continue;
    node.appendChild(ch instanceof Node ? ch : document.createTextNode(String(ch)));
  }

  return node;
}

/**
 * Xavfsiz text qo'yish (innerHTML emas)
 */
export function setText(node, text) {
  if (!node) return;
  node.textContent = text ?? "";
}

/**
 * Class toggle helper
 */
export function toggleClass(node, className, force) {
  if (!node) return;
  if (force === undefined) node.classList.toggle(className);
  else node.classList.toggle(className, !!force);
}

/**
 * Event delegation:
 * on(document, 'click', '[data-action="add"]', (e, target)=>{})
 */
export function on(root, eventName, selector, handler, options) {
  if (!root) return () => {};
  const listener = (e) => {
    const target = e.target?.closest?.(selector);
    if (target && root.contains(target)) handler(e, target);
  };
  root.addEventListener(eventName, listener, options);
  return () => root.removeEventListener(eventName, listener, options);
}

/**
 * Debounce: user yozayotganda 300ms kutib keyin ishlaydi
 */
export function debounce(fn, wait = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Throttle: scroll/resize kabi eventlarda sekundiga ko'p ishlamasin
 */
export function throttle(fn, wait = 150) {
  let last = 0;
  let timer = null;

  return (...args) => {
    const now = Date.now();
    const remain = wait - (now - last);

    if (remain <= 0) {
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn(...args);
      }, remain);
    }
  };
}

/**
 * Raqam formatlash (narx ko'rsatish uchun)
 * formatNumber(8600000) => "8 600 000"
 */
export function formatNumber(n) {
  const num = Number(n || 0);
  return num.toLocaleString("ru-RU").replaceAll(",", " ");
}

/**
 * URL query o'qish:
 * const id = getQuery("id")
 */
export function getQuery(key) {
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}

/**
 * Simple UID (order_id, lead_id uchun)
 */
export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}