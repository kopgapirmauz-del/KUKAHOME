// /public/js/pages/admin/shipments.page.js
// Shipments (schema-only MVP): China->UZ/KZ shipping tracking uchun ustunlar + demo ko'rinish.

import { $, el } from "../../core/dom.js";
import { toast } from "../../core/ui.js";
import { AdminAuth } from "../../core/store.js";

function redirectToLogin() {
  window.location.href = "/admin/index.html";
}

function buildLayout() {
  return el(
    "div",
    { class: "aship", "data-admin-shipments": "1" },

    el(
      "div",
      { class: "aship__head" },
      el("h1", { class: "aship__title" }, "Shipments — Xitoydan kelish holati"),
      el(
        "div",
        { class: "aship__actions" },
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/dashboard.html" }, "Dashboard"),
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/stock.html" }, "Stock"),
        el("a", { class: "kh-btn kh-btn--ghost", href: "/admin/orders.html" }, "Orders")
      )
    ),

    el(
      "div",
      { class: "aship__card", "data-reveal": "1" },
      el("div", { class: "aship__noteTitle" }, "Hozircha MVP (schema)"),
      el(
        "div",
        { class: "aship__noteText" },
        "Bu sahifa hozir faqat ustunlar va dizayn uchun. Keyin Google Sheets’dagi `shipments` tabidan real kelish holatini o‘qib chiqaramiz."
      )
    ),

    el(
      "div",
      { class: "aship__card", "data-reveal": "1" },
      el("div", { class: "aship__cardTitle" }, "Shipments tab (tavsiya qilingan ustunlar)"),
      el(
        "div",
        { class: "aship__schema" },
        schemaLine("ts", "Yozilgan vaqt (timestamp)"),
        schemaLine("shipment_id", "Shipment ID (unikal)"),
        schemaLine("supplier", "Yetkazib beruvchi (Xitoy)"),
        schemaLine("model", "Mahsulot modeli (catalog bilan mos)"),
        schemaLine("qty", "Soni"),
        schemaLine("from_city", "Jo‘natilgan shahar (China)"),
        schemaLine("to_location", "Qayerga: Toshkent warehouse/showroom, Almaty va h.k."),
        schemaLine("status", "Holat: `ordered` / `in_production` / `shipped` / `in_transit` / `customs` / `arrived` / `delivered`"),
        schemaLine("last_point", "Oxirgi nuqta: masalan ‘Urumqi’, ‘Kaz border’, ‘Toshkent’"),
        schemaLine("eta_date", "Taxminiy yetib kelish sanasi (YYYY-MM-DD)"),
        schemaLine("tracking", "Tracking / container / doc raqami"),
        schemaLine("note", "Izoh")
      )
    ),

    el(
      "div",
      { class: "aship__card", "data-reveal": "1" },
      el("div", { class: "aship__cardTitle" }, "Ko‘rinish (demo jadval)"),
      el(
        "div",
        { class: "aship__tableWrap" },
        el(
          "table",
          { class: "aship__table" },
          el(
            "thead",
            {},
            el(
              "tr",
              {},
              el("th", {}, "Shipment ID"),
              el("th", {}, "Model"),
              el("th", {}, "Qty"),
              el("th", {}, "From"),
              el("th", {}, "To"),
              el("th", {}, "Status"),
              el("th", {}, "Last point"),
              el("th", {}, "ETA")
            )
          ),
          el(
            "tbody",
            {},
            demoRow({
              shipment_id: "SHP-0001",
              model: "KF.7053",
              qty: 10,
              from_city: "Foshan",
              to_location: "Toshkent warehouse",
              status: "in_transit",
              last_point: "Urumqi",
              eta_date: "2026-03-18",
            }),
            demoRow({
              shipment_id: "SHP-0002",
              model: "KM.1238",
              qty: 6,
              from_city: "Guangzhou",
              to_location: "Almaty showroom",
              status: "customs",
              last_point: "KZ border",
              eta_date: "2026-03-10",
            })
          )
        )
      ),
      el(
        "div",
        { class: "aship__hint" },
        "Keyin bu jadval Google Sheets’dagi real shipments ma’lumotlari bilan avtomatik to‘ldiriladi."
      )
    ),

    el(
      "div",
      { class: "aship__card", "data-reveal": "1" },
      el("div", { class: "aship__cardTitle" }, "Keyingi qadam"),
      el(
        "div",
        { class: "aship__noteText" },
        "1) Sheets’da `shipments` tab ochamiz. 2) Apps Script’da `GET action=shipments` qo‘shamiz. 3) Bu sahifada list + filter + update (faqat admin) qo‘shiladi."
      )
    )
  );
}

function schemaLine(key, desc) {
  return el(
    "div",
    { class: "aship__schemaLine" },
    el("span", { class: "aship__schemaKey" }, key),
    el("span", { class: "aship__schemaDesc" }, desc)
  );
}

function demoRow(r) {
  return el(
    "tr",
    {},
    el("td", {}, r.shipment_id),
    el("td", {}, r.model),
    el("td", {}, String(r.qty)),
    el("td", {}, r.from_city),
    el("td", {}, r.to_location),
    el("td", {}, r.status),
    el("td", {}, r.last_point),
    el("td", {}, r.eta_date)
  );
}

export function initAdminShipmentsPage() {
  if (!AdminAuth.isLoggedIn()) {
    redirectToLogin();
    return;
  }

  const root = $("#admin-shipments-root") || document.body;

  if (!document.querySelector("[data-admin-shipments]")) {
    root.innerHTML = "";
    root.appendChild(buildLayout());
  }

  toast("Shipments sahifa: hozircha schema (MVP)", { type: "info", duration: 1400 });
}