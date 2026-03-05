// /public/js/pages/showrooms.page.js
// Showrooms page: agar markup bo'sh bo'lsa, namunaviy shourumlar kontenti qo'yadi.

import { $, el } from "../core/dom.js";

const SAMPLE_SHOWROOMS = [
  {
    city: "Toshkent",
    name: "KUKA HOME — Tashkent Showroom",
    address: "Toshkent sh., (namuna manzil) Amir Temur shoh ko‘chasi, 1",
    phone: "+998 90 000 00 00",
    hours: "Har kuni 10:00 — 20:00",
    note: "Premium kolleksiya, divan va kreslo segmenti.",
    mapHint: "Google Map (keyin qo‘shiladi)",
  },
  {
    city: "Almaty",
    name: "KUKA HOME — Almaty Showroom",
    address: "Almaty q., (namuna) Dostyk ave, 10",
    phone: "+7 700 000 00 00",
    hours: "Har kuni 10:00 — 20:00",
    note: "Calmo Collection va yangi kelgan modellari mavjud.",
    mapHint: "Google Map (keyin qo‘shiladi)",
  },
  {
    city: "Shymkent",
    name: "KUKA HOME — Shymkent Showroom",
    address: "Shymkent q., (namuna) Avenue 5",
    phone: "+7 701 000 00 00",
    hours: "Har kuni 10:00 — 20:00",
    note: "Stol-stul va yotoq kolleksiyalari bo‘yicha keng assortiment.",
    mapHint: "Google Map (keyin qo‘shiladi)",
  },
];

function showroomCard(s) {
  return el(
    "article",
    { class: "sr-card", "data-reveal": "1" },

    el(
      "div",
      { class: "sr-card__top" },
      el("div", { class: "sr-card__city" }, s.city),
      el("h3", { class: "sr-card__name" }, s.name)
    ),

    el("div", { class: "sr-card__row" },
      el("div", { class: "sr-card__label" }, "Manzil"),
      el("div", { class: "sr-card__value" }, s.address)
    ),

    el("div", { class: "sr-card__row" },
      el("div", { class: "sr-card__label" }, "Telefon"),
      el("a", { class: "sr-card__value sr-card__link", href: `tel:${s.phone.replace(/\s/g, "")}` }, s.phone)
    ),

    el("div", { class: "sr-card__row" },
      el("div", { class: "sr-card__label" }, "Ish vaqti"),
      el("div", { class: "sr-card__value" }, s.hours)
    ),

    el("p", { class: "sr-card__note" }, s.note),

    el(
      "div",
      { class: "sr-card__map" },
      el("div", { class: "sr-card__mapBox" }, s.mapHint)
    )
  );
}

function buildShowroomsContent() {
  return el(
    "div",
    { class: "showrooms" },

    el("h1", { class: "showrooms__title", "data-reveal": "1" }, "Shourumlar"),
    el(
      "p",
      { class: "showrooms__lead", "data-reveal": "1" },
      "KUKA HOME shourumlariga tashrif buyuring — material, rang va qulaylikni joyida ko‘rib tanlang."
    ),

    el(
      "div",
      { class: "showrooms__grid" },
      SAMPLE_SHOWROOMS.map(showroomCard)
    ),

    el(
      "div",
      { class: "showrooms__footerNote", "data-reveal": "1" },
      "Eslatma: manzillar keyin aniq ma’lumotlar bilan yangilanadi (Google Sheets orqali)."
    )
  );
}

export function initShowroomsPage() {
  const root = $("#showrooms-root");

  if (root) {
    const hasContent = root.textContent && root.textContent.trim().length > 20;
    if (hasContent) return;

    root.innerHTML = "";
    root.appendChild(buildShowroomsContent());
    return;
  }

  // fallback
  document.body.appendChild(buildShowroomsContent());
}
