// /public/js/components/chatWidget.js
// Chat bubble + modal (Dafna style). X bosilganda 5 minutdan keyin qaytib chiqadi.

import { el, $, setText } from "../core/dom.js";
import { openModal, closeModal, toast } from "../core/ui.js";
import { sendChat } from "../core/sheets.js";
import { LangStore, UserStore } from "../core/store.js";
import { CONFIG } from "../core/config.js";

const CHAT_HIDE_UNTIL_KEY = "kuka_chat_hide_until";

let _mounted = false;
let _bubble = null;

function now() {
  return Date.now();
}

function getHideUntil() {
  return Number(localStorage.getItem(CHAT_HIDE_UNTIL_KEY) || "0") || 0;
}

function setHideForMinutes(mins = CONFIG.chat.reappearMinutes) {
  const until = now() + Number(mins) * 60 * 1000;
  localStorage.setItem(CHAT_HIDE_UNTIL_KEY, String(until));
  return until;
}

function canShowBubble() {
  return now() >= getHideUntil();
}

function hideBubble() {
  if (_bubble) _bubble.classList.add("is-hidden");
}

function showBubble() {
  if (_bubble) _bubble.classList.remove("is-hidden");
}

function createBubble() {
  // Bubble: kichkina CTA
  return el(
    "div",
    { class: "kh-chat", "data-chat": "1" },

    el(
      "button",
      {
        class: "kh-chat__bubble",
        type: "button",
        "aria-label": "Open chat",
        "data-chat-open": "1",
      },
      el("div", { class: "kh-chat__title" }, "Bizga yozing"),
      el("div", { class: "kh-chat__sub" }, "biz onlaynmiz!")
    ),

    el(
      "button",
      {
        class: "kh-chat__close",
        type: "button",
        "aria-label": "Hide chat",
        title: "Yopish",
        "data-chat-hide": "1",
      },
      "×"
    )
  );
}

function createModalContent() {
  const lang = LangStore.get();
  const user = UserStore.get();

  const phoneInput = el("input", {
    class: "kh-chatbox__input",
    type: "tel",
    placeholder: "+998 90 123 45 67",
    value: user.phone || "",
    autocomplete: "tel",
    inputmode: "tel",
    "aria-label": "Phone",
    "data-chat-phone": "1",
  });

  const msgInput = el("textarea", {
    class: "kh-chatbox__textarea",
    placeholder: "Xabaringizni yozing…",
    rows: 4,
    "aria-label": "Message",
    "data-chat-message": "1",
  });

  const sendBtn = el(
    "button",
    {
      class: "kh-btn kh-btn--primary kh-chatbox__send",
      type: "button",
      "data-chat-send": "1",
    },
    "Yuborish"
  );

  const header = el(
    "div",
    { class: "kh-chatbox__head" },
    el("div", { class: "kh-chatbox__avatar" }, "K"),
    el(
      "div",
      { class: "kh-chatbox__meta" },
      el("div", { class: "kh-chatbox__name" }, "KUKA HOME"),
      el("div", { class: "kh-chatbox__status" }, "Online")
    )
  );

  const body = el(
    "div",
    { class: "kh-chatbox__body" },
    el(
      "div",
      { class: "kh-chatbox__hint" },
      "Assalomu alaykum! Savolingizni yozing, operatorlarimiz tezda javob beradi."
    )
  );

  const form = el(
    "div",
    { class: "kh-chatbox__form" },
    el("div", { class: "kh-chatbox__field" }, el("div", { class: "kh-chatbox__label" }, "Telefon"), phoneInput),
    el("div", { class: "kh-chatbox__field" }, el("div", { class: "kh-chatbox__label" }, "Xabar"), msgInput),
    el("div", { class: "kh-chatbox__actions" }, sendBtn)
  );

  const wrap = el("div", { class: "kh-chatbox", "data-chatbox": "1" }, header, body, form);

  // SEND handler
  sendBtn.addEventListener("click", async () => {
    sendBtn.disabled = true;
    sendBtn.classList.add("is-loading");

    const phone = phoneInput.value;
    const message = msgInput.value;

    const res = await sendChat({
      phone,
      message,
      page: window.location.pathname,
      lang,
    });

    sendBtn.disabled = false;
    sendBtn.classList.remove("is-loading");

    if (!res?.ok) {
      toast(res?.error || "Xabar yuborilmadi", { type: "error" });
      return;
    }

    // user phone ni eslab qolamiz
    UserStore.setPhone(phone);

    // UI feedback
    msgInput.value = "";
    toast("Xabar yuborildi ✅", { type: "success" });

    // chat bodyga “sent” bubble qo'shamiz
    const sent = el("div", { class: "kh-chatbox__msg kh-chatbox__msg--me" }, message);
    body.appendChild(sent);
    body.scrollTop = body.scrollHeight;
  });

  return wrap;
}

function openChatModal() {
  const content = createModalContent();

  openModal({
    title: "Biz bilan chat",
    content,
    closable: true,
    onClose: () => {
      // modal yopilganda bubble qaytib turadi (agar hide qilinmagan bo'lsa)
      if (canShowBubble()) showBubble();
    },
  });
}

function bindBubbleActions() {
  // Open chat
  _bubble.querySelector("[data-chat-open]")?.addEventListener("click", () => {
    // bubble modal ochilganda yo'qolib tursin (tartibli ko'rinish)
    hideBubble();
    openChatModal();
  });

  // Hide bubble (X)
  _bubble.querySelector("[data-chat-hide]")?.addEventListener("click", () => {
    hideBubble();
    setHideForMinutes(CONFIG.chat.reappearMinutes);

    // 5 minutdan keyin avtomatik qaytarish
    setTimeout(() => {
      if (canShowBubble()) showBubble();
    }, CONFIG.chat.reappearMinutes * 60 * 1000);
  });
}

/**
 * Init: chat bubble'ni body'ga qo'yadi
 */
export function initChatWidget() {
  if (_mounted) return;
  _mounted = true;

  _bubble = createBubble();
  document.body.appendChild(_bubble);

  bindBubbleActions();

  // avvaldan yashirish vaqti kelmagan bo'lsa, yashirib turamiz
  if (!canShowBubble()) {
    hideBubble();

    // qolgan vaqtni hisoblab, keyin ko'rsatamiz
    const msLeft = Math.max(0, getHideUntil() - now());
    setTimeout(() => {
      if (canShowBubble()) showBubble();
    }, msLeft);
  }
}