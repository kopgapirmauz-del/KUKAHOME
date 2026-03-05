// /public/js/pages/admin/orders.page.js
// Admin Orders (Sotuv markazi) - list + search + status/comment/assigned (MVP local)

import { $, el, debounce } from "../../core/dom.js";
import { toast } from "../../core/ui.js";
import { AdminAuth } from "../../core/store.js";

function redirectToLogin() {
  window.location.href = "/admin/index.html";
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

async function loadOrders() {
  const json = await safeJson("/data/mocks/orders.sample.json");
  const orders = Array.isArray(json) ? json : (json?.orders || []);
  // newest first
  return orders.sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0));
}

function fmtDate(ts) {
  const d = new Date(Number(ts) || 0);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU");
}

function fmtMoney(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("ru-RU").replaceAll(",", " ");
}

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function buildLayout() {
  return el(
    "div",
    { class: "aorders", "data-admin-orders": "1" },

    el(
      "div",
      { class: "aorders__head" },
      el("h1", { class: "aorders__title" }, "Sotuv markazi — Buyurtmalar"),
      el(
        "div",
        { class: "aorders__actions" },
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/export.html" }, "Excel export"),
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/dashboard.html" }, "Dashboard"),
        el(
          "button",
          { class: "kh-btn kh-btn--primary", type: "button", "data-admin-logout": "1" },
          "Chiqish"
        )
      )
    ),

    el(
      "div",
      { class: "aorders__toolbar" },

      el("input", {
        class: "aorders__search",
        type: "search",
        placeholder: "Qidiruv: order_id, telefon, shahar, status…",
        autocomplete: "off",
        "data-orders-search": "1",
      }),

      el(
        "select",
        { class: "aorders__filter", "data-orders-status-filter": "1" },
        el("option", { value: "all" }, "Status: barchasi"),
        el("option", { value: "new" }, "new"),
        el("option", { value: "in_progress" }, "in_progress"),
        el("option", { value: "done" }, "done"),
        el("option", { value: "canceled" }, "canceled")
      )
    ),

    el(
      "div",
      { class: "aorders__tableWrap" },
      el(
        "table",
        { class: "aorders__table" },
        el(
          "thead",
          {},
          el(
            "tr",
            {},
            el("th", {}, "Vaqt"),
            el("th", {}, "Order ID"),
            el("th", {}, "Shahar"),
            el("th", {}, "Telefon"),
            el("th", {}, "To‘lov"),
            el("th", {}, "Jami"),
            el("th", {}, "Status"),
            el("th", {}, "Menejer"),
            el("th", {}, "Comment")
          )
        ),
        el("tbody", { "data-orders-tbody": "1" })
      )
    ),

    el("div", { class: "aorders__foot", "data-orders-count": "1" }, "0 ta buyurtma")
  );
}

function statusSelect(value) {
  const v = String(value || "new");
  return el(
    "select",
    { class: "aorders__status", "data-order-status": "1" },
    el("option", { value: "new", selected: v === "new" }, "new"),
    el("option", { value: "in_progress", selected: v === "in_progress" }, "in_progress"),
    el("option", { value: "done", selected: v === "done" }, "done"),
    el("option", { value: "canceled", selected: v === "canceled" }, "canceled")
  );
}

function assignedSelect(value) {
  // MVP: oddiy ro‘yxat (keyin sellerlar listini Sheets’dan olib kelamiz)
  const v = String(value || "");
  return el(
    "select",
    { class: "aorders__assigned", "data-order-assigned": "1" },
    el("option", { value: "", selected: v === "" }, "—"),
    el("option", { value: "manager_1", selected: v === "manager_1" }, "manager_1"),
    el("option", { value: "manager_2", selected: v === "manager_2" }, "manager_2"),
    el("option", { value: "manager_3", selected: v === "manager_3" }, "manager_3")
  );
}

function commentInput(value) {
  return el("input", {
    class: "aorders__comment",
    type: "text",
    value: String(value || ""),
    placeholder: "Izoh…",
    "data-order-comment": "1",
  });
}

function rowForOrder(o) {
  const tr = el(
    "tr",
    { "data-order-id": String(o.order_id || "") },

    el("td", { class: "aorders__td" }, fmtDate(o.ts)),
    el("td", { class: "aorders__td aorders__mono" }, String(o.order_id || "—")),
    el("td", { class: "aorders__td" }, String(o.city || "—")),
    el("td", { class: "aorders__td aorders__mono" }, String(o.phone || "—")),
    el("td", { class: "aorders__td" }, String(o.payment || "—")),
    el("td", { class: "aorders__td aorders__mono" }, `${fmtMoney(o.total)} so'm`),

    el("td", { class: "aorders__td" }, statusSelect(o.status)),
    el("td", { class: "aorders__td" }, assignedSelect(o.assigned_to)),
    el("td", { class: "aorders__td" }, commentInput(o.comment))
  );

  // Items tooltip (oddiy)
  tr.title = "Mahsulotlar: " + String(o.items_json || "").slice(0, 120);

  return tr;
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

export function initAdminOrdersPage() {
  if (!AdminAuth.isLoggedIn()) {
    redirectToLogin();
    return;
  }

  const root = $("#admin-orders-root") || document.body;

  if (!document.querySelector("[data-admin-orders]")) {
    root.innerHTML = "";
    root.appendChild(buildLayout());
  }

  bindLogout();

  const tbody = document.querySelector("[data-orders-tbody]");
  const countEl = document.querySelector("[data-orders-count]");
  const searchInput = document.querySelector("[data-orders-search]");
  const statusFilter = document.querySelector("[data-orders-status-filter]");

  let all = [];
  let view = [];

  const render = () => {
    if (!tbody) return;
    tbody.innerHTML = "";

    const frag = document.createDocumentFragment();
    view.forEach((o) => frag.appendChild(rowForOrder(o)));
    tbody.appendChild(frag);

    if (countEl) countEl.textContent = `${view.length} ta buyurtma`;
  };

  const applyFilters = () => {
    const q = norm(searchInput?.value || "");
    const st = String(statusFilter?.value || "all");

    view = all.filter((o) => {
      if (st !== "all" && String(o.status || "new") !== st) return false;
      if (!q) return true;

      const hay = [
        o.order_id,
        o.phone,
        o.city,
        o.status,
        o.payment,
      ].map(norm).join(" ");

      return hay.includes(q);
    });

    render();
  };

  // Load data
  (async () => {
    all = await loadOrders();
    view = all;
    render();
  })().catch(() => toast("Orderlar yuklanmadi", { type: "error" }));

  // Search/filter events
  if (searchInput) {
    searchInput.addEventListener("input", debounce(applyFilters, 200));
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }

  // Status / assigned / comment changes (MVP: local)
  // Keyin: shu joyda sheets.js orqali update_order ga POST qilamiz
  tbody?.addEventListener("change", (e) => {
    const tr = e.target?.closest?.("[data-order-id]");
    if (!tr) return;
    const oid = tr.getAttribute("data-order-id");

    const order = all.find((x) => String(x.order_id) === String(oid));
    if (!order) return;

    if (e.target.matches("[data-order-status]")) {
      order.status = e.target.value;
      toast("Status yangilandi (MVP)", { type: "success" });
      applyFilters();
    }

    if (e.target.matches("[data-order-assigned]")) {
      order.assigned_to = e.target.value;
      toast("Menejer biriktirildi (MVP)", { type: "success" });
      applyFilters();
    }
  });

  tbody?.addEventListener("input", debounce((e) => {
    const tr = e.target?.closest?.("[data-order-id]");
    if (!tr) return;
    const oid = tr.getAttribute("data-order-id");

    const order = all.find((x) => String(x.order_id) === String(oid));
    if (!order) return;

    if (e.target.matches("[data-order-comment]")) {
      order.comment = e.target.value;
      // spam bo'lmasin: faqat debounced toast
      toast("Izoh saqlandi (MVP)", { type: "info", duration: 1200 });
    }
  }, 450));
}