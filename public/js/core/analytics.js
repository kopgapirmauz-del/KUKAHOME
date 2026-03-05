// /public/js/core/analytics.js
// KUKA HOME analytics (MVP):
// - events queue (localStorage)
// - batched send to Apps Script (optional)
// - safe: agar server yo'q bo'lsa ham ishlaydi (faqat local log)

// How to use:
// import { Analytics } from "./core/analytics.js";
// Analytics.init();
// Analytics.track("page_view", { path: location.pathname });

import { CONFIG } from "./config.js";
import { apiPost } from "./api.js";

const LS_KEY = "kh_analytics_q_v1";

function now() {
  return Date.now();
}

function safeJsonParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function readQueue() {
  const raw = localStorage.getItem(LS_KEY);
  const arr = safeJsonParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

function writeQueue(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function uid() {
  // simple anon device id
  const key = "kh_device_id_v1";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2) + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

function getLang() {
  return localStorage.getItem("kh_lang") || CONFIG?.i18n?.defaultLang || "uz";
}

function getRef() {
  return document.referrer || "";
}

function pageInfo() {
  return {
    url: location.href,
    path: location.pathname,
    title: document.title || "",
    referrer: getRef(),
  };
}

function clampQueue(arr, maxLen) {
  const n = Number(maxLen || 200);
  if (arr.length <= n) return arr;
  return arr.slice(arr.length - n);
}

async function sendBatch(batch) {
  // server yo'q bo'lsa, log qilib qo'yamiz
  if (!Analytics.enabled) return { ok: true, skipped: true };

  // Code.gs’da action=analytics bo'lsa qabul qiladi
  const payload = {
    action: "analytics",
    device_id: uid(),
    ts: now(),
    events: batch,
  };

  return await apiPost(payload);
}

export const Analytics = {
  enabled: true,            // xohlasangiz false qilib qo'yasiz
  debug: false,             // true bo'lsa console.log qiladi
  flushIntervalMs: 15000,   // 15s
  maxQueue: 300,
  maxBatch: 25,

  _timer: null,
  _inited: false,

  init(opts = {}) {
    if (this._inited) return;
    this._inited = true;

    if (typeof opts.enabled === "boolean") this.enabled = opts.enabled;
    if (typeof opts.debug === "boolean") this.debug = opts.debug;
    if (opts.flushIntervalMs) this.flushIntervalMs = Number(opts.flushIntervalMs);
    if (opts.maxQueue) this.maxQueue = Number(opts.maxQueue);
    if (opts.maxBatch) this.maxBatch = Number(opts.maxBatch);

    // Auto page_view
    this.track("page_view", pageInfo());

    // Flush: interval + on visibility change + before unload
    this._timer = setInterval(() => this.flush().catch(() => {}), this.flushIntervalMs);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush({ useBeacon: true }).catch(() => {});
      }
    });

    window.addEventListener("beforeunload", () => {
      // small flush attempt
      this.flush({ useBeacon: true }).catch(() => {});
    });
  },

  track(event, props = {}) {
    const ev = String(event || "").trim();
    if (!ev) return;

    const item = {
      id: "ev_" + Math.random().toString(36).slice(2),
      ts: now(),
      event: ev,
      props: {
        ...props,
        lang: getLang(),
      },
      page: pageInfo(),
      device_id: uid(),
    };

    const q = readQueue();
    q.push(item);
    writeQueue(clampQueue(q, this.maxQueue));

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log("[Analytics.track]", item);
    }
  },

  // convenient helpers
  pageView(extra = {}) {
    this.track("page_view", { ...pageInfo(), ...extra });
  },

  productView(product) {
    // product: { id, model, category, price_new }
    this.track("product_view", {
      id: product?.id || "",
      model: product?.model || "",
      category: product?.category || "",
      price_new: Number(product?.price_new || 0),
    });
  },

  addToCart(product, qty = 1) {
    this.track("add_to_cart", {
      id: product?.id || "",
      model: product?.model || "",
      qty: Number(qty || 1),
      price_new: Number(product?.price_new || 0),
    });
  },

  beginCheckout(total, itemsCount) {
    this.track("begin_checkout", {
      total: Number(total || 0),
      items_count: Number(itemsCount || 0),
    });
  },

  orderPlaced(orderId, total) {
    this.track("order_placed", {
      order_id: String(orderId || ""),
      total: Number(total || 0),
    });
  },

  leadSent(kind = "chat") {
    this.track("lead_sent", { kind: String(kind || "chat") });
  },

  async flush(opts = {}) {
    const q = readQueue();
    if (!q.length) return { ok: true, empty: true };

    // batch
    const batch = q.slice(0, this.maxBatch);

    // send
    let res;
    try {
      res = await sendBatch(batch);
    } catch (e) {
      if (this.debug) console.log("[Analytics.flush] send error", e);
      return { ok: false };
    }

    // if ok -> remove sent from queue
    if (res && res.ok) {
      const remain = q.slice(batch.length);
      writeQueue(remain);
      if (this.debug) console.log("[Analytics.flush] sent", batch.length);
      return { ok: true, sent: batch.length };
    }

    // not ok -> keep queue
    if (this.debug) console.log("[Analytics.flush] not ok", res);
    return { ok: false };
  },
};