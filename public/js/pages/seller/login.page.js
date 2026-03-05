// /public/js/pages/seller/login.page.js
// Seller login (MVP): localStorage seller session.
// Keyin: Apps Script auth/roles bilan real qilamiz.

import { $, el } from "../../core/dom.js";
import { toast } from "../../core/ui.js";
import { SellerAuth } from "../../core/store.js";
import { CONFIG } from "../../core/config.js";

function redirectToOrders() {
  window.location.href = "/seller/orders.html";
}

function buildLoginLayout() {
  return el(
    "div",
    { class: "seller-login", "data-seller-login": "1" },

    el("h1", { class: "seller-login__title" }, "Seller (Menejer) kirish"),
    el("p", { class: "seller-login__sub" }, "O‘zingizga berilgan kodni kiriting."),

    el(
      "div",
      { class: "seller-login__card" },

      el("label", { class: "seller-login__label" }, "Menejer"),
      el(
        "select",
        { class: "seller-login__input", "data-seller-id": "1" },
        el("option", { value: "manager_1" }, "manager_1"),
        el("option", { value: "manager_2" }, "manager_2"),
        el("option", { value: "manager_3" }, "manager_3")
      ),

      el("label", { class: "seller-login__label" }, "PIN / parol"),
      el("input", {
        class: "seller-login__input",
        type: "password",
        placeholder: "••••",
        autocomplete: "current-password",
        "data-seller-pass": "1",
      }),

      el(
        "button",
        { class: "kh-btn kh-btn--primary seller-login__btn", type: "button", "data-seller-submit": "1" },
        "Kirish"
      ),

      el(
        "div",
        { class: "seller-login__hint" },
        "Eslatma: bu MVP login. Keyin real login/role qo‘shamiz."
      )
    )
  );
}

export function initSellerLoginPage() {
  // allaqachon login bo'lsa
  if (SellerAuth.isLoggedIn()) {
    redirectToOrders();
    return;
  }

  const root = $("#seller-login-root") || document.body;

  // markup bo'lmasa o'zimiz chizamiz
  if (!document.querySelector("[data-seller-login]")) {
    root.innerHTML = "";
    root.appendChild(buildLoginLayout());
  }

  const sellerSel = document.querySelector("[data-seller-id]");
  const passInput = document.querySelector("[data-seller-pass]");
  const btn = document.querySelector("[data-seller-submit]");

  const submit = () => {
    const sellerId = String(sellerSel?.value || "").trim() || "manager_1";
    const pass = String(passInput?.value || "").trim();

    if (!pass) {
      toast("PIN / parol kiriting", { type: "info" });
      return;
    }

    // MVP: CONFIG.seller.password yoki CONFIG.seller.passwords map
    const map = CONFIG.seller?.passwords || {};
    const expected = map[sellerId] || CONFIG.seller?.password || "";

    if (!expected) {
      toast("Seller password CONFIG’da yo‘q", { type: "error" });
      return;
    }

    if (pass !== expected) {
      toast("Kod noto‘g‘ri", { type: "error" });
      return;
    }

    SellerAuth.login(sellerId);
    toast("Kirish muvaffaqiyatli ✅", { type: "success" });
    redirectToOrders();
  };

  btn?.addEventListener("click", submit);
  passInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}