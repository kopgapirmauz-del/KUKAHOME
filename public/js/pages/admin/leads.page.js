// /public/js/pages/admin/leads.page.js
// Admin Leads (Murojaatlar): list + search + status/result (MVP local)

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

async function loadLeads() {
  const json = await safeJson("/data/mocks/leads.sample.json");
  const leads = Array.isArray(json) ? json : (json?.leads || []);
  return leads.sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0));
}

function fmtDate(ts) {
  const d = new Date(Number(ts) || 0);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU");
}

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function buildLayout() {
  return el(
    "div",
    { class: "aleads", "data-admin-leads": "1" },

    el(
      "div",
      { class: "aleads__head" },
      el("h1", { class: "aleads__title" }, "Murojaatlar"),
      el(
        "div",
        { class: "aleads__actions" },
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
      { class: "aleads__toolbar" },
      el("input", {
        class: "aleads__search",
        type: "search",
        placeholder: "Qidiruv: telefon, xabar, sahifa, status…",
        autocomplete: "off",
        "data-leads-search": "1",
      }),
      el(
        "select",
        { class: "aleads__filter", "data-leads-status-filter": "1" },
        el("option", { value: "all" }, "Status: barchasi"),
        el("option", { value: "new" }, "new"),
        el("option", { value: "in_progress" }, "in_progress"),
        el("option", { value: "done" }, "done"),
        el("option", { value: "spam" }, "spam")
      )
    ),

    el(
      "div",
      { class: "aleads__tableWrap" },
      el(
        "table",
        { class: "aleads__table" },
        el(
          "thead",
          {},
          el(
            "tr",
            {},
            el("th", {}, "Vaqt"),
            el("th", {}, "Telefon"),
            el("th", {}, "Xabar"),
            el("th", {}, "Sahifa"),
            el("th", {}, "Til"),
            el("th", {}, "Status"),
            el("th", {}, "Natija")
          )
        ),
        el("tbody", { "data-leads-tbody": "1" })
      )
    ),

    el("div", { class: "aleads__foot", "data-leads-count": "1" }, "0 ta murojaat")
  );
}

function statusSelect(value) {
  const v = String(value || "new");
  return el(
    "select",
    { class: "aleads__status", "data-lead-status": "1" },
    el("option", { value: "new", selected: v === "new" }, "new"),
    el("option", { value: "in_progress", selected: v === "in_progress" }, "in_progress"),
    el("option", { value: "done", selected: v === "done" }, "done"),
    el("option", { value: "spam", selected: v === "spam" }, "spam")
  );
}

function resultInput(value) {
  return el("input", {
    class: "aleads__result",
    type: "text",
    value: String(value || ""),
    placeholder: "Natija (misol: qo‘ng‘iroq qilindi)…",
    "data-lead-result": "1",
  });
}

function rowForLead(l) {
  const tr = el(
    "tr",
    { "data-lead-ts": String(l.ts || "") },

    el("td", { class: "aleads__td" }, fmtDate(l.ts)),
    el("td", { class: "aleads__td aleads__mono" }, String(l.phone || "—")),
    el("td", { class: "aleads__td aleads__msg" }, String(l.message || "—")),
    el("td", { class: "aleads__td aleads__mono" }, String(l.page || "—")),
    el("td", { class: "aleads__td" }, String(l.lang || "—")),
    el("td", { class: "aleads__td" }, statusSelect(l.status)),
    el("td", { class: "aleads__td" }, resultInput(l.result))
  );

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

export function initAdminLeadsPage() {
  if (!AdminAuth.isLoggedIn()) {
    redirectToLogin();
    return;
  }

  const root = $("#admin-leads-root") || document.body;

  if (!document.querySelector("[data-admin-leads]")) {
    root.innerHTML = "";
    root.appendChild(buildLayout());
  }

  bindLogout();

  const tbody = document.querySelector("[data-leads-tbody]");
  const countEl = document.querySelector("[data-leads-count]");
  const searchInput = document.querySelector("[data-leads-search]");
  const statusFilter = document.querySelector("[data-leads-status-filter]");

  let all = [];
  let view = [];

  const render = () => {
    if (!tbody) return;
    tbody.innerHTML = "";

    const frag = document.createDocumentFragment();
    view.forEach((l) => frag.appendChild(rowForLead(l)));
    tbody.appendChild(frag);

    if (countEl) countEl.textContent = `${view.length} ta murojaat`;
  };

  const applyFilters = () => {
    const q = norm(searchInput?.value || "");
    const st = String(statusFilter?.value || "all");

    view = all.filter((l) => {
      if (st !== "all" && String(l.status || "new") !== st) return false;
      if (!q) return true;

      const hay = [
        l.phone,
        l.message,
        l.page,
        l.lang,
        l.status,
      ].map(norm).join(" ");

      return hay.includes(q);
    });

    render();
  };

  // Load data
  (async () => {
    all = await loadLeads();
    view = all;
    render();
  })().catch(() => toast("Murojaatlar yuklanmadi", { type: "error" }));

  // Search/filter events
  if (searchInput) {
    searchInput.addEventListener("input", debounce(applyFilters, 200));
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }

  // Status change (MVP local)
  tbody?.addEventListener("change", (e) => {
    const tr = e.target?.closest?.("[data-lead-ts]");
    if (!tr) return;
    const ts = tr.getAttribute("data-lead-ts");

    const lead = all.find((x) => String(x.ts) === String(ts));
    if (!lead) return;

    if (e.target.matches("[data-lead-status]")) {
      lead.status = e.target.value;
      toast("Status yangilandi (MVP)", { type: "success" });
      applyFilters();
    }
  });

  // Result input (MVP local, debounced)
  tbody?.addEventListener(
    "input",
    debounce((e) => {
      const tr = e.target?.closest?.("[data-lead-ts]");
      if (!tr) return;
      const ts = tr.getAttribute("data-lead-ts");

      const lead = all.find((x) => String(x.ts) === String(ts));
      if (!lead) return;

      if (e.target.matches("[data-lead-result]")) {
        lead.result = e.target.value;
        toast("Natija saqlandi (MVP)", { type: "info", duration: 1200 });
      }
    }, 450)
  );
}