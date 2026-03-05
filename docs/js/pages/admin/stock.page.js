// /public/js/pages/admin/stock.page.js
// Stock (schema-only MVP): layout + jadval ustunlari. Keyin Sheets'dan real data olamiz.

import { $, el } from "../../core/dom.js";
import { toast } from "../../core/ui.js";
import { AdminAuth } from "../../core/store.js";

function redirectToLogin() {
  window.location.href = "/admin/index.html";
}

function buildLayout() {
  return el(
    "div",
    { class: "astock", "data-admin-stock": "1" },

    el(
      "div",
      { class: "astock__head" },
      el("h1", { class: "astock__title" }, "Sklad / Showroom — Stock"),
      el(
        "div",
        { class: "astock__actions" },
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/dashboard.html" }, "Dashboard"),
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/orders.html" }, "Orders"),
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/shipments.html" }, "Shipments")
      )
    ),

    el(
      "div",
      { class: "astock__card", "data-reveal": "1" },
      el("div", { class: "astock__noteTitle" }, "Hozircha MVP (schema)"),
      el(
        "div",
        { class: "astock__noteText" },
        "Bu sahifa hozir faqat ustunlar (schema) va dizayn uchun. Keyin Google Sheets’dagi `stock` tabidan real ma’lumotlarni o‘qib chiqaramiz."
      )
    ),

    el(
      "div",
      { class: "astock__card", "data-reveal": "1" },
      el("div", { class: "astock__cardTitle" }, "Stock tab (tavsiya qilingan ustunlar)"),
      el(
        "div",
        { class: "astock__schema" },
        schemaLine("ts", "Oxirgi yangilanish (timestamp)"),
        schemaLine("model", "Mahsulot modeli (Catalog bilan mos)"),
        schemaLine("location_type", "Qayerda: `warehouse` / `showroom`"),
        schemaLine("location_name", "Masalan: Toshkent showroom, Almaty showroom, Main warehouse"),
        schemaLine("qty", "Soni (raqam)"),
        schemaLine("status", "Holat: `available` / `reserved` / `sold`"),
        schemaLine("note", "Izoh (ixtiyoriy)")
      )
    ),

    el(
      "div",
      { class: "astock__card", "data-reveal": "1" },
      el("div", { class: "astock__cardTitle" }, "Ko‘rinish (demo jadval)"),
      el(
        "div",
        { class: "astock__tableWrap" },
        el(
          "table",
          { class: "astock__table" },
          el(
            "thead",
            {},
            el(
              "tr",
              {},
              el("th", {}, "Model"),
              el("th", {}, "Location"),
              el("th", {}, "Type"),
              el("th", {}, "Qty"),
              el("th", {}, "Status"),
              el("th", {}, "Note")
            )
          ),
          el(
            "tbody",
            {},
            demoRow({
              model: "KF.7053",
              location_name: "Toshkent showroom",
              location_type: "showroom",
              qty: 2,
              status: "available",
              note: "Namuna",
            }),
            demoRow({
              model: "KM.1238",
              location_name: "Main warehouse",
              location_type: "warehouse",
              qty: 5,
              status: "reserved",
              note: "Buyurtma uchun band",
            })
          )
        )
      ),
      el(
        "div",
        { class: "astock__hint" },
        "Keyin bu jadval Google Sheets’dagi real stock bilan avtomatik to‘ldiriladi."
      )
    ),

    el(
      "div",
      { class: "astock__card", "data-reveal": "1" },
      el("div", { class: "astock__cardTitle" }, "Keyingi qadam"),
      el(
        "div",
        { class: "astock__noteText" },
        "1) Sheets’da `stock` tab ochamiz. 2) Apps Script’da `GET action=stock` qo‘shamiz. 3) Shu sahifada data yuklab, render qilamiz. Admingina edit/qo‘shish qiladi."
      )
    )
  );
}

function schemaLine(key, desc) {
  return el(
    "div",
    { class: "astock__schemaLine" },
    el("span", { class: "astock__schemaKey" }, key),
    el("span", { class: "astock__schemaDesc" }, desc)
  );
}

function demoRow(r) {
  return el(
    "tr",
    {},
    el("td", {}, r.model),
    el("td", {}, r.location_name),
    el("td", {}, r.location_type),
    el("td", {}, String(r.qty)),
    el("td", {}, r.status),
    el("td", {}, r.note || "")
  );
}

export function initAdminStockPage() {
  if (!AdminAuth.isLoggedIn()) {
    redirectToLogin();
    return;
  }

  const root = $("#admin-stock-root") || document.body;

  if (!document.querySelector("[data-admin-stock]")) {
    root.innerHTML = "";
    root.appendChild(buildLayout());
  }

  // MVP: hech qanday real API yo'q
  // keyin: Sheets’dan data olish qo‘shiladi
  toast("Stock sahifa: hozircha schema (MVP)", { type: "info", duration: 1400 });
}