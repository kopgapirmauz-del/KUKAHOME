// /public/js/pages/contact.page.js
// Contact form -> Sheets (action=chat)

import { $, toast } from "../core/ui.js"; // Eslatma: toast ui.js da, lekin bu yerda $ emas
import { $ as q } from "../core/dom.js";
import { sendChat } from "../core/sheets.js";
import { UserStore } from "../core/store.js";
import { LangStore } from "../core/store.js";

function getEl(selector, dataAttr) {
  return q(selector) || q(`[${dataAttr}]`);
}

export function initContactPage() {
  const form = getEl("#contact-form", "data-contact-form");
  if (!form) return;

  const phone = getEl("#contact-phone", "data-contact-phone");
  const message = getEl("#contact-message", "data-contact-message");
  const submit = getEl("#contact-submit", "data-contact-submit");

  if (phone && !phone.value) {
    phone.value = UserStore.get().phone || "";
  }

  const onSubmit = async (e) => {
    e.preventDefault();

    const p = phone ? phone.value : "";
    const m = message ? message.value : "";

    if (!p) return toast("Telefon kiriting", { type: "info" });
    if (!m) return toast("Xabar yozing", { type: "info" });

    if (submit) {
      submit.disabled = true;
      submit.classList.add("is-loading");
    }

    const res = await sendChat({
      phone: p,
      message: m,
      page: window.location.pathname,
      lang: LangStore.get(),
    });

    if (submit) {
      submit.disabled = false;
      submit.classList.remove("is-loading");
    }

    if (!res?.ok) {
      toast(res?.error || "Xabar yuborilmadi", { type: "error" });
      return;
    }

    UserStore.setPhone(p);

    if (message) message.value = "";
    toast("Xabar yuborildi ✅", { type: "success" });
  };

  form.addEventListener("submit", onSubmit);
  if (submit) submit.addEventListener("click", onSubmit);
}