// /public/js/core/api.js
// Google Apps Script WebApp bilan barqaror aloqa uchun API wrapper

import { CONFIG } from "./config.js";

/**
 * Oddiy timeout wrapper
 */
function withTimeout(promise, ms = 15000) {
  let timer = null;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timeout: server javob bermadi")), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * HTTP status bo'yicha xato chiqarish
 */
async function readErrorText(res) {
  try {
    const t = await res.text();
    return t || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

/**
 * JSON parse xavfsiz
 */
async function safeJson(res) {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    // ba'zan Apps Script plain text qaytaradi
    return { ok: false, error: "Server JSON qaytarmadi", raw: txt };
  }
}

/**
 * Network error bo'lsa 1 marta qayta urinish (light retry)
 */
async function retryOnce(fn) {
  try {
    return await fn();
  } catch (e) {
    // faqat network/timeout bo'lsa qayta urinib ko'ramiz
    const msg = String(e?.message || e);
    const retryable =
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("Timeout");

    if (!retryable) throw e;
    return await fn();
  }
}

/**
 * POST (CORS-friendly):
 * - Content-Type: text/plain (ko'p holatda preflight chiqmaydi)
 * - body: JSON string
 */
export async function apiPost(payload, opts = {}) {
  const url = CONFIG.api.baseUrl;
  if (!url || url.includes("YOUR_SCRIPT_ID")) {
    return { ok: false, error: "API manzil qo'yilmagan (config.js dagi baseUrl)" };
  }

  const {
    timeoutMs = 15000,
    noRetry = false,
  } = opts;

  const run = async () => {
    const res = await withTimeout(
      fetch(url, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload || {}),
      }),
      timeoutMs
    );

    if (!res.ok) {
      const errText = await readErrorText(res);
      return { ok: false, error: errText, status: res.status };
    }

    const data = await safeJson(res);

    // standart formatga keltiramiz
    if (data && typeof data === "object") {
      // Apps Script: {ok:true,...} bo'lsa shu
      if ("ok" in data) return data;
      // boshqa format bo'lsa ham ok deb belgilaymiz
      return { ok: true, data };
    }

    return { ok: false, error: "Noto'g'ri javob formati" };
  };

  try {
    return noRetry ? await run() : await retryOnce(run);
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * GET (export uchun, yoki query bilan olish uchun)
 * Example:
 *  apiGet({ action:"export_orders", from:"2026-03-01", to:"2026-03-31" })
 */
export async function apiGet(params = {}, opts = {}) {
  const base = CONFIG.api.baseUrl;
  if (!base || base.includes("YOUR_SCRIPT_ID")) {
    return { ok: false, error: "API manzil qo'yilmagan (config.js dagi baseUrl)" };
  }

  const {
    timeoutMs = 20000,
    noRetry = false,
  } = opts;

  const url = new URL(base);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    url.searchParams.set(k, String(v));
  });

  const run = async () => {
    const res = await withTimeout(
      fetch(url.toString(), {
        method: "GET",
        mode: "cors",
        cache: "no-store",
      }),
      timeoutMs
    );

    if (!res.ok) {
      const errText = await readErrorText(res);
      return { ok: false, error: errText, status: res.status };
    }

    // export bo'lsa file bo'ladi — bu yerda faqat text/json qaytaramiz
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await safeJson(res);
      if (data && typeof data === "object") {
        if ("ok" in data) return data;
        return { ok: true, data };
      }
      return { ok: false, error: "JSON noto'g'ri" };
    }

    // boshqa format bo'lsa text qaytaramiz
    const txt = await res.text();
    return { ok: true, text: txt };
  };

  try {
    return noRetry ? await run() : await retryOnce(run);
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Export download helper:
 * GET so'rov bilan file link ochib beradi.
 * Admin export page shuni chaqiradi.
 */
export function downloadExport(params = {}) {
  const base = CONFIG.api.baseUrl;
  if (!base || base.includes("YOUR_SCRIPT_ID")) return;

  const url = new URL(base);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    url.searchParams.set(k, String(v));
  });

  // Yangi tabda ochiladi (file download bo'ladi)
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}