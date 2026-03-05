// /public/js/pages/order-success.page.js
// Order success: order_id ko'rsatish + copy + qaytish

import { $, getQuery, el } from "../core/dom.js";
import { toast } from "../core/ui.js";

function buildLayout(orderId) {
  return el(
    "div",
    { class: "kh-success", "data-success": "1" },
    el("div", { class: "kh-success__icon" }, "✅"),
    el("h1", { class: "kh-success__title" }, "Buyurtmangiz qabul qilindi"),
    el(
      "p",
      { class: "kh-success__sub" },
      "Operatorlarimiz tez orada siz bilan bog‘lanadi."
    ),

    el(
      "div",
      { class: "kh-success__card" },
      el("div", { class: "kh-success__label" }, "Buyurtma ID"),
      el("div", { class: "kh-success__id", id: "success-order-id" }, orderId || "—"),
      el(
        "button",
        { class: "kh-btn kh-btn--ghost", type: "button", id: "success-copy" },
        "Copy"
      )
    ),

    el(
      "div",
      { class: "kh-success__actions" },
      el("a", { class: "kh-btn kh-btn--primary", href: "/category.html", id: "success-back" }, "Katalogga qaytish"),
      el(
        "a",
        {
          class: "kh-btn kh-btn--ghost",
          href: "#",
          id: "success-tg",
          onclick: (e) => {
            e.preventDefault();
            toast("Telegram link keyin qo‘shiladi (placeholder)", { type: "info" });
          },
        },
        "Telegramga yozish"
      )
    )
  );
}

async function copyText(text) {
  const t = String(text || "");
  if (!t) return false;

  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export function initOrderSuccessPage() {
  const orderId = getQuery("order_id") || "";

  // Agar tayyor markup bo'lsa
  const idNode = $("#success-order-id");
  const copyBtn = $("#success-copy");

  // Agar markup yo'q bo'lsa, rootga layout chizamiz
  if (!idNode) {
    const root = $("#order-success-root") || document.body;
    // agar body bo'lsa ham, sahifada alohida root qo'yish tavsiya
    const layout = buildLayout(orderId);
    if ($("#order-success-root")) {
      $("#order-success-root").innerHTML = "";
      $("#order-success-root").appendChild(layout);
    } else {
      // ehtiyot: agar root bo'lmasa body oxiriga qo'yadi
      document.body.appendChild(layout);
    }
  } else {
    idNode.textContent = orderId || "—";
  }

  // Copy action
  const btn = copyBtn || $("#success-copy");
  const idEl = idNode || $("#success-order-id");

  if (btn && idEl) {
    btn.addEventListener("click", async () => {
      const ok = await copyText(idEl.textContent);
      toast(ok ? "Nusxa olindi ✅" : "Copy ishlamadi", { type: ok ? "success" : "error" });
    });
  }

  // Title
  if (orderId) document.title = `Order ${orderId} — KUKA HOME`;
}