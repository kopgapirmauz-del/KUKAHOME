// /public/js/components/footer.js
// Premium footer komponenti (hamma sahifaga avtomatik qo'yiladi)

import { el } from "../core/dom.js";

let _mounted = false;

function createFooter() {
  const year = new Date().getFullYear();

  return el(
    "footer",
    { class: "kh-footer", "data-footer": "1" },
    el(
      "div",
      { class: "kh-container kh-footer__grid" },

      // Brand column
      el(
        "div",
        { class: "kh-footer__col" },
        el(
          "a",
          { class: "kh-footer__logo", href: "/index.html", "aria-label": "KUKA HOME" },
          el("span", { class: "kh-footer__logoMark" }, "KUKA"),
          el("span", { class: "kh-footer__logoSub" }, "HOME")
        ),
        el("p", { class: "kh-footer__desc", "data-i18n": "footer.desc" },
          "Premium mebellar: divan, kreslo, stol-stul, krovat va matratslar."
        ),
        el(
          "div",
          { class: "kh-footer__social" },
          el("a", { class: "kh-iconlink", href: "#", "aria-label": "Telegram" }, "TG"),
          el("a", { class: "kh-iconlink", href: "#", "aria-label": "Instagram" }, "IG"),
          el("a", { class: "kh-iconlink", href: "#", "aria-label": "YouTube" }, "YT")
        )
      ),

      // Navigation
      el(
        "div",
        { class: "kh-footer__col" },
        el("div", { class: "kh-footer__title", "data-i18n": "footer.nav" }, "Bo'limlar"),
        el("a", { class: "kh-footer__link", href: "/category.html", "data-i18n": "nav.catalog" }, "Katalog"),
        el("a", { class: "kh-footer__link", href: "/about.html", "data-i18n": "nav.about" }, "Biz haqimizda"),
        el("a", { class: "kh-footer__link", href: "/showrooms.html", "data-i18n": "nav.showrooms" }, "Shourumlar"),
        el("a", { class: "kh-footer__link", href: "/contact.html", "data-i18n": "nav.contact" }, "Aloqa")
      ),

      // Contact
      el(
        "div",
        { class: "kh-footer__col" },
        el("div", { class: "kh-footer__title", "data-i18n": "footer.contact" }, "Kontakt"),
        el("a", { class: "kh-footer__link", href: "tel:+998900000000" }, "+998 90 000 00 00"),
        el("a", { class: "kh-footer__link", href: "mailto:info@kuka.uz" }, "info@kuka.uz"),
        el("div", { class: "kh-footer__hint", "data-i18n": "footer.worktime" }, "Har kuni: 10:00 — 20:00")
      ),

      // Legal / Service
      el(
        "div",
        { class: "kh-footer__col" },
        el("div", { class: "kh-footer__title", "data-i18n": "footer.service" }, "Xizmat"),
        el("a", { class: "kh-footer__link", href: "/cart.html", "data-i18n": "footer.checkout" }, "Buyurtma / Checkout"),
        el("a", { class: "kh-footer__link", href: "#", "data-i18n": "footer.delivery" }, "Yetkazib berish"),
        el("a", { class: "kh-footer__link", href: "#", "data-i18n": "footer.warranty" }, "Kafolat")
      )
    ),

    // Bottom bar
    el(
      "div",
      { class: "kh-footer__bottom" },
      el(
        "div",
        { class: "kh-container kh-footer__bottomInner" },
        el("div", { class: "kh-footer__copy" }, `© ${year} KUKA HOME. All rights reserved.`),
        el(
          "div",
          { class: "kh-footer__mini" },
          el("a", { class: "kh-footer__miniLink", href: "/admin/index.html" }, "Admin"),
          el("span", { class: "kh-footer__dot" }, "•"),
          el("a", { class: "kh-footer__miniLink", href: "/seller/index.html" }, "Seller")
        )
      )
    )
  );
}

/**
 * INIT: footer ni sahifa oxiriga qo'yadi
 */
export function initFooter() {
  if (_mounted) return;
  _mounted = true;

  const footer = createFooter();
  document.body.appendChild(footer);
}