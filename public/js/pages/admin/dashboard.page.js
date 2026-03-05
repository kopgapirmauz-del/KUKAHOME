// /public/js/pages/admin/dashboard.page.js
// Admin dashboard KPI (MVP): mock JSON'dan o'qiydi, count-up bilan chiqaradi.
// Keyin: Apps Script GET action=kpi ga ulaymiz.

import { $, el } from "../../core/dom.js";
import { toast, countUp } from "../../core/ui.js";
import { AdminAuth } from "../../core/store.js";

function redirectToLogin() {
  window.location.href = "/admin/index.html";
}

/**
 * Bugungi sana (YYYY-MM-DD) — timezone browser bo'yicha
 */
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * ts -> YYYY-MM-DD
 */
function dateKeyFromTs(ts) {
  const d = new Date(Number(ts) || 0);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function safeJson(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * MVP: KPI ni mockdan hisoblaymiz
 * - /data/mocks/orders.sample.json
 * - /data/mocks/leads.sample.json
 *
 * Orders sample item:
 * { ts, order_id, total, items_json, status, ... }
 *
 * Leads sample item:
 * { ts, phone, message, page, ... }
 */
async function loadKPI() {
  const ordersJson = await safeJson("/data/mocks/orders.sample.json");
  const leadsJson = await safeJson("/data/mocks/leads.sample.json");

  const orders = Array.isArray(ordersJson) ? ordersJson : (ordersJson?.orders || []);
  const leads = Array.isArray(leadsJson) ? leadsJson : (leadsJson?.leads || []);

  const today = todayKey();

  const ordersToday = orders.filter((o) => dateKeyFromTs(o.ts) === today);
  const leadsToday = leads.filter((l) => dateKeyFromTs(l.ts) === today);

  const revenueToday = ordersToday.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return {
    orders_total: orders.length,
    leads_total: leads.length,
    orders_today: ordersToday.length,
    leads_today: leadsToday.length,
    revenue_today: revenueToday,
  };
}

function buildLayout() {
  return el(
    "div",
    { class: "adash", "data-admin-dashboard": "1" },

    el(
      "div",
      { class: "adash__head" },
      el("h1", { class: "adash__title" }, "Dashboard"),
      el(
        "div",
        { class: "adash__actions" },
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/export.html" }, "Excel export"),
        el(
          "button",
          { class: "kh-btn kh-btn--primary", type: "button", "data-admin-logout": "1" },
          "Chiqish"
        )
      )
    ),

    el(
      "div",
      { class: "adash__grid" },

      // Orders today
      el(
        "div",
        { class: "kpi", "data-reveal": "1" },
        el("div", { class: "kpi__label" }, "Bugungi buyurtmalar"),
        el("div", { class: "kpi__value", "data-kpi": "orders_today" }, "0"),
        el("div", { class: "kpi__sub" }, "Orderlar soni")
      ),

      // Leads today
      el(
        "div",
        { class: "kpi", "data-reveal": "1" },
        el("div", { class: "kpi__label" }, "Bugungi murojaatlar"),
        el("div", { class: "kpi__value", "data-kpi": "leads_today" }, "0"),
        el("div", { class: "kpi__sub" }, "Chat / form xabarlari")
      ),

      // Revenue today
      el(
        "div",
        { class: "kpi", "data-reveal": "1" },
        el("div", { class: "kpi__label" }, "Bugungi tushum"),
        el("div", { class: "kpi__value", "data-kpi": "revenue_today" }, "0"),
        el("div", { class: "kpi__sub" }, "So'm hisobida")
      ),

      // Orders total
      el(
        "div",
        { class: "kpi", "data-reveal": "1" },
        el("div", { class: "kpi__label" }, "Jami buyurtmalar"),
        el("div", { class: "kpi__value", "data-kpi": "orders_total" }, "0"),
        el("div", { class: "kpi__sub" }, "Mock bo‘yicha")
      )
    ),

    // simple note / next steps
    el(
      "div",
      { class: "adash__note", "data-reveal": "1" },
      el("div", { class: "adash__noteTitle" }, "Keyingi qadam"),
      el(
        "div",
        { class: "adash__noteText" },
        "Hozir KPI mock JSON’dan olinmoqda. Apps Script’da `GET action=kpi` qo‘shsak, dashboard real raqamlarni chiqaradi."
      )
    )
  );
}

function fmtMoney(n) {
  const v = Number(n) || 0;
  return Math.round(v).toLocaleString("ru-RU").replaceAll(",", " ");
}

function animateKPI(kpi) {
  const set = (key, value, isMoney = false) => {
    const node = document.querySelector(`[data-kpi="${key}"]`);
    if (!node) return;

    if (isMoney) {
      countUp(node, value, { duration: 900, formatter: (x) => fmtMoney(x) });
      // yoniga so'm yozuvini qo'yish (agar kerak bo'lsa CSS bilan)
      node.setAttribute("data-money", "1");
    } else {
      countUp(node, value, { duration: 800, formatter: (x) => String(Math.round(x)) });
    }
  };

  set("orders_today", kpi.orders_today);
  set("leads_today", kpi.leads_today);
  set("revenue_today", kpi.revenue_today, true);
  set("orders_total", kpi.orders_total);
}

function bindLogout() {
  const btn = document.querySelector("[data-admin-logout]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    AdminAuth.logout();
    toast("Chiqildi", { type: "success" });
    redirectToLogin();
  });
}

async function refreshKPI() {
  const kpi = await loadKPI();
  animateKPI(kpi);
}

export function initAdminDashboardPage() {
  // auth check
  if (!AdminAuth.isLoggedIn()) {
    redirectToLogin();
    return;
  }

  // mount layout if not exists
  const root = $("#admin-dashboard-root") || document.body;

  if (!document.querySelector("[data-admin-dashboard]")) {
    root.innerHTML = "";
    root.appendChild(buildLayout());
  }

  bindLogout();

  // first load
  refreshKPI().catch(() => toast("KPI yuklanmadi", { type: "error" }));

  // auto refresh (yengil) — 60 sekundda bir
  setInterval(() => {
    refreshKPI().catch(() => {});
  }, 60000);
}