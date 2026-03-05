// /public/js/pages/admin/export.page.js
// Excel export: orders/leads, date range, GET -> JSON {download_url} -> open download URL

import { $, el } from "../../core/dom.js";
import { toast } from "../../core/ui.js";
import { AdminAuth } from "../../core/store.js";
import { CONFIG } from "../../core/config.js";
import { apiGet } from "../../core/api.js";

function redirectToLogin() {
  window.location.href = "/admin/index.html";
}

function ymd(d) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 7);
  return { from: ymd(from), to: ymd(to) };
}

function buildLayout() {
  const r = defaultRange();

  return el(
    "div",
    { class: "aexport", "data-admin-export": "1" },

    el(
      "div",
      { class: "aexport__head" },
      el("h1", { class: "aexport__title" }, "Excel export"),
      el(
        "div",
        { class: "aexport__actions" },
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/orders.html" }, "Orders"),
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/leads.html" }, "Leads"),
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/dashboard.html" }, "Dashboard")
      )
    ),

    el(
      "div",
      { class: "aexport__card" },

      el("div", { class: "aexport__label" }, "Nimani yuklab olish?"),
      el(
        "div",
        { class: "aexport__row" },
        el(
          "label",
          { class: "aexport__radio" },
          el("input", { type: "radio", name: "exportType", value: "orders", checked: true }),
          el("span", {}, "Orders (sotuv markazi)")
        ),
        el(
          "label",
          { class: "aexport__radio" },
          el("input", { type: "radio", name: "exportType", value: "leads" }),
          el("span", {}, "Leads (murojaatlar)")
        )
      ),

      el("div", { class: "aexport__label" }, "Sana oralig‘i"),
      el(
        "div",
        { class: "aexport__grid" },
        el(
          "div",
          {},
          el("div", { class: "aexport__sub" }, "From"),
          el("input", { class: "aexport__input", type: "date", value: r.from, "data-export-from": "1" })
        ),
        el(
          "div",
          {},
          el("div", { class: "aexport__sub" }, "To"),
          el("input", { class: "aexport__input", type: "date", value: r.to, "data-export-to": "1" })
        )
      ),

      el(
        "button",
        { class: "kh-btn kh-btn--primary aexport__btn", type: "button", "data-export-download": "1" },
        "Excel yuklab olish"
      ),

      el(
        "div",
        { class: "aexport__hint" },
        "Eslatma: export Apps Script’dan JSON olib, ichidagi download_url orqali Excel’ni yuklaydi."
      )
    )
  );
}

function getSelectedType() {
  const r = document.querySelector('input[name="exportType"]:checked');
  return r ? r.value : "orders";
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = !!isLoading;
  btn.classList.toggle("is-loading", !!isLoading);
}

function buildParams(type, from, to) {
  const params = {};
  params.action = type === "orders" ? "export_orders" : "export_leads";
  if (from) params.from = from;
  if (to) params.to = to;
  params.format = "xlsx";
  return params;
}

async function requestExportDownloadUrl(type, from, to) {
  if (!CONFIG?.api?.webAppUrl) {
    return { ok: false, error: "CONFIG.api.webAppUrl kiritilmagan" };
  }

  // apiGet(core/api.js) orqali GET qilamiz
  const params = buildParams(type, from, to);
  const data = await apiGet(params);

  // Code.gs file_() JSON qaytaradi: { ok:true, download_url, filename }
  if (!data?.ok) {
    return { ok: false, error: data?.error || "Export xatosi" };
  }
  if (!data.download_url) {
    return { ok: false, error: "download_url topilmadi (Code.gs tekshiring)" };
  }
  return { ok: true, download_url: data.download_url, filename: data.filename || "" };
}

export function initAdminExportPage() {
  if (!AdminAuth.isLoggedIn()) {
    redirectToLogin();
    return;
  }

  const root = $("#admin-export-root") || document.body;

  if (!document.querySelector("[data-admin-export]")) {
    root.innerHTML = "";
    root.appendChild(buildLayout());
  }

  const btn = document.querySelector("[data-export-download]");
  const fromEl = document.querySelector("[data-export-from]");
  const toEl = document.querySelector("[data-export-to]");

  btn?.addEventListener("click", async () => {
    const type = getSelectedType();
    const from = fromEl?.value || "";
    const to = toEl?.value || "";

    if (from && to && from > to) {
      toast("From sanasi To’dan katta bo‘lishi mumkin emas", { type: "info" });
      return;
    }

    setLoading(btn, true);
    toast("Export tayyorlanmoqda…", { type: "info", duration: 1200 });

    const res = await requestExportDownloadUrl(type, from, to);

    setLoading(btn, false);

    if (!res.ok) {
      toast(res.error || "Export ishlamadi", { type: "error" });
      return;
    }

    // Excel download
    window.open(res.download_url, "_blank", "noopener,noreferrer");
    toast("Excel yuklanmoqda ✅", { type: "success" });
  });
}