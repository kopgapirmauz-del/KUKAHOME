// /public/js/core/sheets.js
// Apps Script WebApp actionlariga tayyor funksiyalar

import { apiPost, downloadExport } from "./api.js";
import { CONFIG } from "./config.js";

/**
 * Telefonni soddaroq tozalash:
 * "+998 (90) 123-45-67" -> "998901234567"
 */
export function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * City/stringsni tozalash (bo'sh joylarni to'g'irlash)
 */
function cleanStr(v) {
  return String(v ?? "").trim();
}

/**
 * CHAT: "Bizga yozing" widget/form
 * Sheets tab: murojaatlar
 */
export async function sendChat({ phone, message, page, lang }) {
  const payload = {
    action: "chat",
    ts: Date.now(),
    phone: normalizePhone(phone),
    message: cleanStr(message),
    page: cleanStr(page),
    lang: cleanStr(lang),
  };

  // minimal tekshiruv
  if (!payload.phone) return { ok: false, error: "Telefon raqam kiritilmadi" };
  if (!payload.message) return { ok: false, error: "Xabar bo'sh" };

  return await apiPost(payload);
}

/**
 * ORDER: cart checkout
 * Sheets tab: sotuv markazi
 *
 * items: [{id, model, price, qty}]
 */
export async function createOrder({
  city,
  phone,
  name,
  delivery_address,
  payment,
  total,
  items,
  page,
  lang,
  voucher_code,
  discount_amount,
}) {
  const payload = {
    action: "order",
    ts: Date.now(),
    order_id: `ORD_${Date.now()}`, // Apps Script ham qaytadan generate qilishi mumkin
    city: cleanStr(city),
    phone: normalizePhone(phone),
    name: cleanStr(name),
    delivery_address: cleanStr(delivery_address),
    payment: cleanStr(payment),
    total: Number(total) || 0,
    items_json: JSON.stringify(Array.isArray(items) ? items : []),
    page: cleanStr(page),
    lang: cleanStr(lang),
    voucher_code: cleanStr(voucher_code),
    discount_amount: Number(discount_amount) || 0,
  };

  if (!payload.phone) return { ok: false, error: "Telefon raqam kiritilmadi" };
  if (!payload.city) return { ok: false, error: "Shahar tanlanmadi" };
  if (!payload.items_json || payload.items_json === "[]")
    return { ok: false, error: "Savat bo'sh" };

  return await apiPost(payload);
}

/**
 * REGISTER: loyallik dasturiga ro'yxatdan o'tish
 * Sheets: vouchers tab (code + phone + amount...)
 * Natija: { ok:true, code:"ABC123", amount:750000 }
 */
export async function registerUser({ phone, lang }) {
  const payload = {
    action: "register",
    ts: Date.now(),
    phone: normalizePhone(phone),
    lang: cleanStr(lang),
    amount: CONFIG.voucher.amount,
  };

  if (!payload.phone) return { ok: false, error: "Telefon raqam kiritilmadi" };

  return await apiPost(payload);
}

/**
 * APPLY VOUCHER: cartda promokodni tekshirish
 * Natija: { ok:true, valid:true, discount:..., code:... }
 */
export async function applyVoucher({ phone, code, total }) {
  const payload = {
    action: "apply_voucher",
    ts: Date.now(),
    phone: normalizePhone(phone),
    code: cleanStr(code).toUpperCase(),
    total: Number(total) || 0,
  };

  if (!payload.code) return { ok: false, error: "Promo code kiritilmadi" };

  return await apiPost(payload);
}

/**
 * EXPORT (Admin): Excel download
 * action:
 *  - export_orders
 *  - export_leads
 * params: from/to (YYYY-MM-DD)
 */
export function exportOrders({ from, to }) {
  downloadExport({
    action: "export_orders",
    from: cleanStr(from),
    to: cleanStr(to),
  });
}

export function exportLeads({ from, to }) {
  downloadExport({
    action: "export_leads",
    from: cleanStr(from),
    to: cleanStr(to),
  });
}