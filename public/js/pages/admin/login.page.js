// /public/js/pages/admin/login.page.js
// Admin login (MVP): localStorage token.
// Keyin: Apps Script auth yoki boshqa tizimga almashtiramiz.

import { $, el } from "../../core/dom.js";
import { toast } from "../../core/ui.js";
import { AdminAuth } from "../../core/store.js";
import { CONFIG } from "../../core/config.js";

function buildLoginLayout() {
  return el(
    "div",
    { class: "admin-login", "data-admin-login": "1" },

    el("h1", { class: "admin-login__title" }, "Admin panelga kirish"),
    el("p", { class: "admin-login__sub" }, "Parolni kiriting."),

    el(
      "div",
      { class: "admin-login__card" },
      el("label", { class: "admin-login__label" }, "Parol"),
      el("input", {
        class: "admin-login__input",
        type: "password",
        placeholder: "••••••••",
        autocomplete: "current-password",
        "data-admin-pass": "1",
      }),
      el(
        "button",
        {
          class: "kh-btn kh-btn--primary admin-login__btn",
          type: "button",
          "data-admin-submit": "1",
        },
        "Kirish"
      ),
      el(
        "div",
        { class: "admin-login__hint" },
        "Eslatma: bu MVP. Keyin real login (role, token, expiry) qo‘shamiz."
      )
    )
  );
}

function redirectToDashboard() {
  window.location.href = "/admin/dashboard.html";
}

export function initAdminLoginPage() {
  // allaqachon login bo'lsa
  if (AdminAuth.isLoggedIn()) {
    redirectToDashboard();
    return;
  }

  // Root topish
  const root = $("#admin-login-root") || document.body;

  // Agar sahifada tayyor markup bo'lmasa, o'zimiz chizamiz
  if (!document.querySelector("[data-admin-login]")) {
    root.innerHTML = "";
    root.appendChild(buildLoginLayout());
  }

  const passInput = document.querySelector("[data-admin-pass]");
  const btn = document.querySelector("[data-admin-submit]");

  const submit = () => {
    const pass = String(passInput?.value || "").trim();
    if (!pass) {
      toast("Parolni kiriting", { type: "info" });
      return;
    }

    // MVP parol tekshiruvi
    if (pass !== CONFIG.admin.password) {
      toast("Parol noto‘g‘ri", { type: "error" });
      return;
    }

    AdminAuth.login();
    toast("Xush kelibsiz ✅", { type: "success" });
    redirectToDashboard();
  };

  btn?.addEventListener("click", submit);
  passInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}