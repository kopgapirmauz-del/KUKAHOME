// /public/js/pages/seller/orders.page.js
// Seller Orders: faqat assigned_to = sellerId bo'lgan orderlar, search, status/comment (MVP local)

import { $, el, debounce } from "../../core/dom.js";
import { toast } from "../../core/ui.js";
import { SellerAuth } from "../../core/store.js";

function redirectToLogin() {
  window.location.href = "/seller/index.html";
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

function buildLayout(sellerId) {
  return el(
    "div",
    { class: "sorders", "data-seller-orders": "1" },

    el(
      "div",
      { class: "sorders__head" },
      el("h1", { class: "sorders__title" }, "Mening buyurtmalarim"),
      el("div", { class: "sorders__sub" }, `Menejer: ${sellerId}`),
      el(
        "div",
        { class: "sorders__actions" },
        el("a", { class: "kh-btn kh-btn--ghost", href: "/seller/orders.html" }, "Yangilash"),
        el(
          "button",
          { class: "kh-btn kh-btn--primary", type: "button", "data-seller-logout": "1" },
          "Chiqish"
        )
      )
    ),

    el(
      "div",
      { class: "sorders__toolbar" },
      el("input", {
        class: "sorders__search",
        type: "search",
        placeholder: "Qidiruv: order_id, telefon, shahar, status…",
        autocomplete: "off",
        "data-seller-search": "1",
      }),
      el(
        "select",
        { class: "sorders__filter", "data-seller-status-filter": "1" },
        el("option", { value: "all" }, "Status: barchasi"),
        el("option", { value: "new" }, "new"),
        el("option", { value: "in_progress" }, "in_progress"),
        el("option", { value: "done" }, "done"),
        el("option", { value: "canceled" }, "canceled")
      )
    ),

    el(
      "div",
      { class: "sorders__tableWrap" },
      el(
        "table",
        { class: "sorders__table" },
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
            el("th", {}, "Comment")
          )
        ),
        el("tbody", { "data-seller-tbody": "1" })
      )
    ),

    el("div", { class: "sorders__foot", "data-seller-count": "1" }, "0 ta buyurtma")
  );
}

function statusSelect(value) {
  const v = String(value || "new");
  return el(
    "select",
    { class: "sorders__status", "data-seller-order-status": "1" },
    el("option", { value: "new", selected: v === "new" }, "new"),
    el("option", { value: "in_progress", selected: v === "in_progress" }, "in_progress"),
    el("option", { value: "done", selected: v === "done" }, "done"),
    el("option", { value: "canceled", selected: v === "canceled" }, "canceled")
  );
}

function commentInput(value) {
  return el("input", {
    class: "sorders__comment",
    type: "text",
    value: String(value || ""),
    placeholder: "Izoh…",
    "data-seller-order-comment": "1",
  });
}

function phoneLink(phone) {
  const p = String(phone || "").trim();
  if (!p) return el("span", { class: "sorders__muted" }, "—");
  const tel = p.replace(/\s/g, "");
  return el("a", { class: "sorders__phone", href: `tel:${tel}` }, p);
}

function rowForOrder(o) {
  const tr = el(
    "tr",
    { "data-order-id": String(o.order_id || "") },

    el("td", { class: "sorders__td" }, fmtDate(o.ts)),
    el("td", { class: "sorders__td sorders__mono" }, String(o.order_id || "—")),
    el("td", { class: "sorders__td" }, String(o.city || "—")),
    el("td", { class: "sorders__td sorders__mono" }, phoneLink(o.phone)),
    el("td", { class: "sorders__td" }, String(o.payment || "—")),
    el("td", { class: "sorders__td sorders__mono" }, `${fmtMoney(o.total)} so'm`),
    el("td", { class: "sorders__td" }, statusSelect(o.status)),
    el("td", { class: "sorders__td" }, commentInput(o.comment))
  );

  tr.title = "Mahsulotlar: " + String(o.items_json || "").slice(0, 120);
  return tr;
}

function bindLogout() {
  const btn = document.querySelector("[data-seller-logout]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    SellerAuth.logout();
    toast("Chiqildi", { type: "success" });
    redirectToLogin();
  });
}

export function initSellerOrdersPage() {
  if (!SellerAuth.isLoggedIn()) {
    redirectToLogin();
    return;
  }

  const sellerId = SellerAuth.getSellerId() || "manager_1";

  const root = $("#seller-orders-root") || document.body;
  if (!document.querySelector("[data-seller-orders]")) {
    root.innerHTML = "";
    root.appendChild(buildLayout(sellerId));
  }

  bindLogout();

  const tbody = document.querySelector("[data-seller-tbody]");
  const countEl = document.querySelector("[data-seller-count]");
  const searchInput = document.querySelector("[data-seller-search]");
  const statusFilter = document.querySelector("[data-seller-status-filter]");

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
      // sellerga biriktirilgan bo'lishi shart
      if (String(o.assigned_to || "") !== String(sellerId)) return false;

      // status filter
      if (st !== "all" && String(o.status || "new") !== st) return false;

      // search
      if (!q) return true;
      const hay = [o.order_id, o.phone, o.city, o.status, o.payment].map(norm).join(" ");
      return hay.includes(q);
    });

    render();
  };

  // Load data
  (async () => {
    all = await loadOrders();
    applyFilters();
  })().catch(() => toast("Buyurtmalar yuklanmadi", { type: "error" }));

  // Search/filter events
  if (searchInput) {
    searchInput.addEventListener("input", debounce(applyFilters, 200));
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }

  // Status change (MVP local)
  tbody?.addEventListener("change", (e) => {
    const tr = e.target?.closest?.("[data-order-id]");
    if (!tr) return;
    const oid = tr.getAttribute("data-order-id");

    const order = all.find((x) => String(x.order_id) === String(oid));
    if (!order) return;

    if (e.target.matches("[data-seller-order-status]")) {
      order.status = e.target.value;
      toast("Status yangilandi (MVP)", { type: "success" });
      applyFilters();
    }
  });

  // Comment input (MVP local, debounced)
  tbody?.addEventListener(
    "input",
    debounce((e) => {
      const tr = e.target?.closest?.("[data-order-id]");
      if (!tr) return;
      const oid = tr.getAttribute("data-order-id");

      const order = all.find((x) => String(x.order_id) === String(oid));
      if (!order) return;

      if (e.target.matches("[data-seller-order-comment]")) {
        order.comment = e.target.value;
        toast("Izoh saqlandi (MVP)", { type: "info", duration: 1200 });
      }
    }, 450)
  );
}
