// /public/js/components/voucherPopup.js
// Voucher popup: 750 000 ball, 5 minutda qaytadi (faqat registered bo'lmaganda).
// Register bosilganda Apps Script orqali user + voucher yaratiladi.

import { el, $, setText } from "../core/dom.js";
import { openModal, closeModal, toast } from "../core/ui.js";
import { registerUser } from "../core/sheets.js";
import { UserStore, VoucherTimerStore, STORE_EVENTS } from "../core/store.js";
import { CONFIG } from "../core/config.js";
import { LangStore } from "../core/store.js";

let _mounted = false;
let _modalOpen = false;

function makePopupContent() {
  const user = UserStore.get();

  const gift = el(
    "div",
    { class: "kh-voucher__gift", "aria-hidden": "true" },
    "🎁"
  );

  const title = el(
    "div",
    { class: "kh-voucher__title" },
    "Sizga sovg‘a — ",
    el("span", { class: "kh-voucher__amount" }, `${CONFIG.voucher.amount.toLocaleString("ru-RU").replaceAll(",", " ")} ball`)
  );

  const subtitle = el(
    "div",
    { class: "kh-voucher__subtitle" },
    "На первый заказ за регистрацию в программе лояльности KUKA HOME"
  );

  const phone = el("input", {
    class: "kh-voucher__input",
    type: "tel",
    inputmode: "tel",
    autocomplete: "tel",
    placeholder: "+998 99 379 99 99",
    value: user.phone || "",
    "aria-label": "Phone",
    "data-voucher-phone": "1",
  });

  const btn = el(
    "button",
    {
      class: "kh-btn kh-btn--primary kh-voucher__btn",
      type: "button",
      "data-voucher-register": "1",
    },
    "Ro’yxatdan o’tish"
  );

  const note = el(
    "div",
    { class: "kh-voucher__note" },
    "Ro’yxatdan o’tsangiz, promo code profilingizda saqlanadi va birinchi buyurtmada ishlatishingiz mumkin."
  );

  const box = el(
    "div",
    { class: "kh-voucher" },
    el("div", { class: "kh-voucher__row" }, gift, el("div", { class: "kh-voucher__texts" }, title, subtitle)),
    el("div", { class: "kh-voucher__form" },
      el("div", { class: "kh-voucher__label" }, "Telefon raqam"),
      phone,
      btn
    ),
    note
  );

  // Register click
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.classList.add("is-loading");

    const lang = LangStore.get();
    const phoneVal = phone.value;

    const res = await registerUser({ phone: phoneVal, lang });

    btn.disabled = false;
    btn.classList.remove("is-loading");

    if (!res?.ok) {
      toast(res?.error || "Ro’yxatdan o’tish amalga oshmadi", { type: "error" });
      return;
    }

    // Backend qaytargan code/amount bo'lsa olamiz
    const code = res.code || res.voucher_code || (res.data && (res.data.code || res.data.voucher_code)) || "";
    const amount = res.amount || (res.data && res.data.amount) || CONFIG.voucher.amount;

    // user state saqlash
    UserStore.setPhone(phoneVal);
    UserStore.setVoucherCode(code);
    UserStore.setRegistered(true);

    toast(`Ro’yxatdan o’tdingiz ✅ Voucher: ${amount.toLocaleString("ru-RU").replaceAll(",", " ")} ball`, { type: "success" });

    // endi popup umuman chiqmasin
    _modalOpen = false;
    closeModal();
  });

  return box;
}

function openVoucherPopup() {
  if (_modalOpen) return;
  _modalOpen = true;

  openModal({
    title: "KUKA HOME sovg‘asi",
    content: makePopupContent(),
    closable: true,
    onClose: () => {
      _modalOpen = false;

      // agar ro'yxatdan o'tmagan bo'lsa 5 minutga schedule qilamiz
      if (!UserStore.get().registered) {
        VoucherTimerStore.scheduleNext(CONFIG.voucher.popupInterval);
      }
    },
  });

  // popup ochilganda ham next vaqtni qo'yib ketamiz (spam bo'lmasin)
  // user ro'yxatdan o'tib qolsa baribir stop bo'ladi
  if (!UserStore.get().registered) {
    VoucherTimerStore.scheduleNext(CONFIG.voucher.popupInterval);
  }
}

function maybeShow() {
  // ro'yxatdan o'tgan bo'lsa - umuman kerakmas
  if (UserStore.get().registered) return;

  // 5 minut taymer bo'yicha
  if (!VoucherTimerStore.canShowNow()) return;

  openVoucherPopup();
}

/**
 * Init: sahifa yuklanganda tekshiradi, keyin timer bilan qayta ko'rsatadi
 */
export function initVoucherPopup() {
  if (_mounted) return;
  _mounted = true;

  // birinchi kirishda ko'rsatish (agar mumkin bo'lsa)
  // kichkina delay: UI tayyor bo'lsin
  setTimeout(maybeShow, 600);

  // User registered bo'lganda popupni stop qilish
  window.addEventListener(STORE_EVENTS.USER_CHANGED, () => {
    if (UserStore.get().registered) {
      // ehtiyot uchun: modal ochiq bo'lsa yopamiz
      if (_modalOpen) {
        _modalOpen = false;
        closeModal();
      }
    }
  });

  // Har 15 sekundda tekshirib turamiz (yengil polling)
  // (5 minut intervalni aniq ushlash uchun)
  setInterval(() => {
    if (_modalOpen) return;
    maybeShow();
  }, 15000);
}