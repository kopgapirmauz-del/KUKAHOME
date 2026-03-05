// /public/js/components/header.js
// Premium sticky header: topbar (social+lang) + mainbar (logo/search/catalog/cart/profile)
// Scroll pastga tushganda topbar yashirinadi.

import { $, $$, el, on, throttle } from "../core/dom.js";
import { CartStore, STORE_EVENTS, UserStore } from "../core/store.js";
import { t } from "../core/i18n.js";

let _mounted = false;

function createHeader() {
  // Topbar: social + language
  const topbar = el(
    "div",
    { class: "kh-topbar", "data-header-topbar": "1" },
    el(
      "div",
      { class: "kh-topbar__inner kh-container" },
      // social
      el(
        "div",
        { class: "kh-topbar__left" },
        el(
          "a",
          { class: "kh-iconlink", href: "#", "aria-label": "Telegram" },
          el("span", { class: "kh-ico" }, "TG")
        ),
        el(
          "a",
          { class: "kh-iconlink", href: "#", "aria-label": "Instagram" },
          el("span", { class: "kh-ico" }, "IG")
        ),
        el(
          "a",
          { class: "kh-iconlink", href: "#", "aria-label": "YouTube" },
          el("span", { class: "kh-ico" }, "YT")
        )
      ),

      // language switch
      el(
        "div",
        { class: "kh-topbar__right" },
        el("button", { class: "kh-lang", type: "button", "data-lang": "uz" }, "UZ"),
        el("button", { class: "kh-lang", type: "button", "data-lang": "ru" }, "RU"),
        el("button", { class: "kh-lang", type: "button", "data-lang": "en" }, "EN")
      )
    )
  );

  // Mainbar: logo + search + catalog + cart + login/profile
  const mainbar = el(
    "div",
    { class: "kh-mainbar", "data-header-mainbar": "1" },
    el(
      "div",
      { class: "kh-mainbar__inner kh-container" },

      // left: logo
      el(
        "a",
        { class: "kh-logo", href: "/index.html", "aria-label": "KUKA HOME" },
        el("span", { class: "kh-logo__mark" }, "KUKA"),
        el("span", { class: "kh-logo__sub" }, "HOME")
      ),

      // center: search
      el(
        "div",
        { class: "kh-search" },
        el("input", {
          class: "kh-search__input",
          type: "search",
          autocomplete: "off",
          "data-search-input": "1",
          "data-i18n-placeholder": "search.placeholder",
          placeholder: "Qidiruv...",
          "aria-label": "Search",
        }),
        el(
          "button",
          {
            class: "kh-search__btn",
            type: "button",
            "data-search-btn": "1",
            "data-i18n-aria": "search.button",
            "aria-label": "Search",
          },
          "⌕"
        )
      ),

      // right: actions
      el(
        "div",
        { class: "kh-actions" },

        // catalog button
        el(
          "a",
          {
            class: "kh-btn kh-btn--ghost",
            href: "/category.html",
            "data-i18n": "nav.catalog",
          },
          "Katalog"
        ),

        // cart
        el(
          "a",
          {
            class: "kh-cart",
            href: "/cart.html",
            "aria-label": "Cart",
            "data-cart-icon": "1",
          },
          el("span", { class: "kh-cart__ico" }, "🛒"),
          el("span", { class: "kh-cart__badge", "data-cart-count": "1" }, "0")
        ),

        // profile / login
        el(
          "div",
          { class: "kh-profile", "data-profile": "1" },
          el(
            "button",
            {
              class: "kh-btn kh-btn--primary",
              type: "button",
              "data-profile-btn": "1",
            },
            el("span", { "data-i18n": "nav.profile" }, "Kirish")
          ),
          el(
            "div",
            { class: "kh-menu", "data-profile-menu": "1" },
            el(
              "a",
              { class: "kh-menu__item", href: "/admin/dashboard.html", "data-i18n": "nav.admin" },
              "Admin panel"
            ),
            el(
              "a",
              { class: "kh-menu__item", href: "/seller/orders.html", "data-i18n": "nav.manager" },
              "Menedjer"
            ),
            el(
              "a",
              { class: "kh-menu__item", href: "#", "data-i18n": "nav.myProfile", "data-my-profile": "1" },
              "Profil"
            ),
            el("div", { class: "kh-menu__sep" }),
            el(
              "button",
              { class: "kh-menu__item kh-menu__item--btn", type: "button", "data-logout": "1", style: "display:none" },
              t("nav.logout") || "Chiqish"
            )
          )
        )
      )
    )
  );

  // Wrapper header
  return el("header", { class: "kh-header", "data-header": "1" }, topbar, mainbar);
}

function setCartBadge() {
  const count = CartStore.getCount();
  $$("[data-cart-count]").forEach((n) => {
    n.textContent = String(count);
    n.style.display = count > 0 ? "inline-flex" : "none";
  });
}

function setProfileLabel() {
  const btnText = $("[data-profile-btn] span");
  const user = UserStore.get();

  if (!btnText) return;

  // ro'yxatdan o'tgan bo'lsa "Profil", bo'lmasa "Kirish"
  btnText.textContent = user.registered ? (t("nav.profile") || "Profil") : (t("nav.login") || "Kirish");

  const logoutBtn = $("[data-logout]");
  if (logoutBtn) logoutBtn.style.display = user.registered ? "block" : "none";
}

function bindProfileMenu() {
  const wrap = $("[data-profile]");
  const btn = $("[data-profile-btn]");
  const menu = $("[data-profile-menu]");
  if (!wrap || !btn || !menu) return;

  const close = () => wrap.classList.remove("is-open");

  btn.addEventListener("click", () => {
    wrap.classList.toggle("is-open");
  });

  // click outside close
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });

  // logout
  on(document, "click", "[data-logout]", () => {
    UserStore.logout();
    close();
    setProfileLabel();
  });
}

function bindHeaderScrollBehavior() {
  const header = $("[data-header]");
  const topbar = $("[data-header-topbar]");
  if (!header || !topbar) return;

  let lastY = window.scrollY || 0;

  const update = () => {
    const y = window.scrollY || 0;

    // 24px dan pastga tushsa topbar yashirilsin
    const hideTop = y > 24;

    header.classList.toggle("is-scrolled", hideTop);
    topbar.classList.toggle("is-hidden", hideTop);

    lastY = y;
  };

  window.addEventListener("scroll", throttle(update, 120), { passive: true });
  update();
}

function bindSearch() {
  const input = $("[data-search-input]");
  const btn = $("[data-search-btn]");
  if (!input || !btn) return;

  const run = () => {
    const q = String(input.value || "").trim();
    // category page ga query bilan o'tkazamiz
    const url = new URL(window.location.origin + "/category.html");
    if (q) url.searchParams.set("q", q);
    window.location.href = url.toString();
  };

  btn.addEventListener("click", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });
}

/**
 * INIT: header ni body boshiga qo'yadi va eventlarni ulaydi
 */
export function initHeader() {
  if (_mounted) return;
  _mounted = true;

  const header = createHeader();
  document.body.prepend(header);

  // cart badge
  setCartBadge();
  window.addEventListener(STORE_EVENTS.CART_CHANGED, setCartBadge);

  // user label
  setProfileLabel();
  window.addEventListener(STORE_EVENTS.USER_CHANGED, setProfileLabel);

  // menu + scroll + search
  bindProfileMenu();
  bindHeaderScrollBehavior();
  bindSearch();
}