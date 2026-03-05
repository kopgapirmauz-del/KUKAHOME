// /public/js/pages/cart.page.js
// Cart + Checkout: render cart, qty update, remove, voucher apply, order create (Sheets)

import { $, $$, el, formatNumber } from "../core/dom.js";
import { toast } from "../core/ui.js";
import { CartStore, UserStore } from "../core/store.js";
import { applyVoucher, createOrder } from "../core/sheets.js";
import { LangStore } from "../core/store.js";

let state = {
  discount: 0,        // so'm (yoki ball => so'mga teng deb olamiz)
  voucherApplied: false,
  voucherCode: "",
};

// ---------- UI builders ----------
function buildCartLayout() {
  return el(
    "div",
    { class: "cart", "data-cart": "1" },

    el("h1", { class: "cart__title" }, "Savat"),

    el(
      "div",
      { class: "cart__grid" },

      // Left: items
      el(
        "div",
        { class: "cart__left" },

        el("div", { class: "cart__items", "data-cart-items": "1" })
      ),

      // Right: summary + checkout
      el(
        "aside",
        { class: "cart__right" },

        // Voucher
        el(
          "div",
          { class: "cart__card" },
          el("div", { class: "cart__cardTitle" }, "Promokod / Voucher"),
          el(
            "div",
            { class: "cart__voucher" },
            el("input", {
              class: "cart__input",
              type: "text",
              placeholder: "Promo code",
              "data-voucher-code": "1",
              autocomplete: "off",
            }),
            el(
              "button",
              { class: "kh-btn kh-btn--ghost", type: "button", "data-voucher-apply": "1" },
              "Qo‘llash"
            )
          ),
          el("div", { class: "cart__hint", "data-voucher-hint": "1" }, "")
        ),

        // Summary
        el(
          "div",
          { class: "cart__card" },
          el("div", { class: "cart__cardTitle" }, "Hisob"),
          el("div", { class: "cart__row" },
            el("span", {}, "Subtotal"),
            el("strong", { "data-subtotal": "1" }, "0")
          ),
          el("div", { class: "cart__row" },
            el("span", {}, "Chegirma"),
            el("strong", { "data-discount": "1" }, "0")
          ),
          el("div", { class: "cart__row cart__row--total" },
            el("span", {}, "Jami"),
            el("strong", { "data-total": "1" }, "0")
          )
        ),

        // Checkout
        el(
          "div",
          { class: "cart__card" },
          el("div", { class: "cart__cardTitle" }, "Buyurtma berish"),
          el(
            "div",
            { class: "cart__form", "data-checkout": "1" },

            el("label", { class: "cart__label" }, "Shahar"),
            el(
              "select",
              { class: "cart__input", "data-city": "1" },
              el("option", { value: "" }, "Tanlang"),
              el("option", { value: "Toshkent" }, "Toshkent"),
              el("option", { value: "Samarqand" }, "Samarqand"),
              el("option", { value: "Buxoro" }, "Buxoro"),
              el("option", { value: "Andijon" }, "Andijon"),
              el("option", { value: "Farg'ona" }, "Farg'ona"),
              el("option", { value: "Namangan" }, "Namangan")
            ),

            el("label", { class: "cart__label" }, "Ism"),
            el("input", { class: "cart__input", type: "text", "data-name": "1", placeholder: "Ism" }),

            el("label", { class: "cart__label" }, "Telefon"),
            el("input", {
              class: "cart__input",
              type: "tel",
              "data-phone": "1",
              placeholder: "+998 90 123 45 67",
              value: UserStore.get().phone || "",
            }),

            el("label", { class: "cart__label" }, "Manzil"),
            el("input", { class: "cart__input", type: "text", "data-address": "1", placeholder: "Yetkazib berish manzili" }),

            el("label", { class: "cart__label" }, "To‘lov turi"),
            el(
              "select",
              { class: "cart__input", "data-payment": "1" },
              el("option", { value: "" }, "Tanlang"),
              el("option", { value: "Naqd" }, "Naqd"),
              el("option", { value: "Karta" }, "Karta"),
              el("option", { value: "Uzum Nasiya" }, "Uzum Nasiya"),
              el("option", { value: "Paynet Nasiya" }, "Paynet Nasiya")
            ),

            el(
              "button",
              { class: "kh-btn kh-btn--primary cart__submit", type: "button", "data-submit-order": "1" },
              "Buyurtmani yuborish"
            ),

            el("div", { class: "cart__tiny" }, "Yuborilgandan so‘ng operator siz bilan bog‘lanadi.")
          )
        )
      )
    )
  );
}

function buildEmpty() {
  return el(
    "div",
    { class: "kh-empty" },
    el("div", { class: "kh-empty__title" }, "Savat bo‘sh"),
    el("div", { class: "kh-empty__sub" }, "Katalogdan mahsulot tanlang."),
    el("a", { class: "kh-btn kh-btn--ghost", href: "/category.html" }, "Katalogga o‘tish")
  );
}

// ---------- Render cart items ----------
function renderItems(container) {
  const items = CartStore.getItems();

  container.innerHTML = "";
  if (!items.length) {
    container.appendChild(buildEmpty());
    return;
  }

  const frag = document.createDocumentFragment();

  items.forEach((it) => {
    const row = el(
      "div",
      { class: "cart-item", "data-item-id": String(it.id) },

      el("img", {
        class: "cart-item__img",
        src: it.image || "/assets/images/placeholders/product.png",
        alt: it.model || "Product",
        loading: "lazy",
        decoding: "async",
      }),

      el(
        "div",
        { class: "cart-item__info" },
        el("div", { class: "cart-item__model" }, it.model || "—"),
        el("div", { class: "cart-item__price" }, `${formatNumber(it.price || 0)} so'm`)
      ),

      el(
        "div",
        { class: "cart-item__qty" },
        el(
          "button",
          { class: "cart-item__btn", type: "button", "data-qty-minus": "1", "aria-label": "Minus" },
          "−"
        ),
        el("input", {
          class: "cart-item__qtyInput",
          type: "number",
          min: "1",
          max: "99",
          value: String(it.qty || 1),
          "data-qty-input": "1",
          inputmode: "numeric",
          "aria-label": "Quantity",
        }),
        el(
          "button",
          { class: "cart-item__btn", type: "button", "data-qty-plus": "1", "aria-label": "Plus" },
          "+"
        )
      ),

      el(
        "button",
        { class: "cart-item__remove", type: "button", "data-remove": "1", "aria-label": "Remove" },
        "×"
      )
    );

    frag.appendChild(row);
  });

  container.appendChild(frag);
}

function calcSubtotal() {
  return CartStore.getTotal();
}

function calcTotal() {
  const subtotal = calcSubtotal();
  const discount = Math.max(0, Number(state.discount) || 0);
  return Math.max(0, subtotal - discount);
}

function renderTotals() {
  const subtotalEl = $("[data-subtotal]");
  const discountEl = $("[data-discount]");
  const totalEl = $("[data-total]");

  const subtotal = calcSubtotal();
  const discount = Math.max(0, Number(state.discount) || 0);
  const total = calcTotal();

  if (subtotalEl) subtotalEl.textContent = `${formatNumber(subtotal)} so'm`;
  if (discountEl) discountEl.textContent = `${formatNumber(discount)} so'm`;
  if (totalEl) totalEl.textContent = `${formatNumber(total)} so'm`;
}

function resetVoucherUI() {
  state.discount = 0;
  state.voucherApplied = false;
  // code qolsin (user qayta apply qilishi mumkin)
  const hint = $("[data-voucher-hint]");
  if (hint) hint.textContent = "";
  renderTotals();
}

// ---------- Bind events ----------
function bindItemEvents(itemsWrap) {
  // qty minus/plus/remove/input
  itemsWrap.addEventListener("click", (e) => {
    const row = e.target?.closest?.("[data-item-id]");
    if (!row) return;
    const id = row.getAttribute("data-item-id");

    if (e.target.closest("[data-remove]")) {
      CartStore.remove(id);
      resetVoucherUI(); // subtotal o'zgardi, voucher qayta tekshirish kerak
      refresh();
      return;
    }

    if (e.target.closest("[data-qty-minus]")) {
      const it = CartStore.getItems().find((x) => String(x.id) === String(id));
      const next = Math.max(1, (Number(it?.qty) || 1) - 1);
      CartStore.updateQty(id, next);
      resetVoucherUI();
      refresh(false);
      return;
    }

    if (e.target.closest("[data-qty-plus]")) {
      const it = CartStore.getItems().find((x) => String(x.id) === String(id));
      const next = Math.min(99, (Number(it?.qty) || 1) + 1);
      CartStore.updateQty(id, next);
      resetVoucherUI();
      refresh(false);
      return;
    }
  });

  itemsWrap.addEventListener("change", (e) => {
    const inp = e.target?.closest?.("[data-qty-input]");
    if (!inp) return;

    const row = inp.closest("[data-item-id]");
    const id = row?.getAttribute("data-item-id");
    if (!id) return;

    let v = Number(inp.value || 1);
    if (!Number.isFinite(v) || v < 1) v = 1;
    if (v > 99) v = 99;

    inp.value = String(v);
    CartStore.updateQty(id, v);
    resetVoucherUI();
    refresh(false);
  });
}

function bindVoucherEvents() {
  const codeInput = $("[data-voucher-code]");
  const btnApply = $("[data-voucher-apply]");
  const hint = $("[data-voucher-hint]");

  if (!codeInput || !btnApply) return;

  // Agar userda voucher code bo'lsa, inputga qo'yib qo'yamiz
  const saved = UserStore.get().voucherCode;
  if (saved && !codeInput.value) codeInput.value = saved;

  btnApply.addEventListener("click", async () => {
    const code = String(codeInput.value || "").trim();
    if (!code) {
      toast("Promo code kiriting", { type: "info" });
      return;
    }

    const subtotal = calcSubtotal();
    if (subtotal <= 0) {
      toast("Savat bo‘sh", { type: "info" });
      return;
    }

    btnApply.disabled = true;

    const res = await applyVoucher({
      phone: UserStore.get().phone || "",
      code,
      total: subtotal,
    });

    btnApply.disabled = false;

    if (!res?.ok) {
      state.discount = 0;
      state.voucherApplied = false;
      if (hint) hint.textContent = res?.error || "Voucher tekshirib bo‘lmadi";
      toast(res?.error || "Voucher xato", { type: "error" });
      renderTotals();
      return;
    }

    // Biz serverdan quyidagilarni kutamiz:
    // { ok:true, valid:true, discount:750000, code:"..." }
    const valid = !!(res.valid ?? (res.data && res.data.valid));
    const discount = Number(res.discount ?? (res.data && res.data.discount) ?? 0) || 0;
    const normalizedCode = String(res.code ?? (res.data && res.data.code) ?? code).toUpperCase();

    if (!valid || discount <= 0) {
      state.discount = 0;
      state.voucherApplied = false;
      if (hint) hint.textContent = "Voucher yaroqsiz yoki ishlatilgan";
      toast("Voucher ishlamadi", { type: "error" });
      renderTotals();
      return;
    }

    state.discount = Math.min(discount, subtotal);
    state.voucherApplied = true;
    state.voucherCode = normalizedCode;

    if (hint) hint.textContent = `Voucher qo‘llandi: -${formatNumber(state.discount)} so'm`;
    toast("Voucher qo‘llandi ✅", { type: "success" });
    renderTotals();
  });
}

function bindCheckout() {
  const btn = $("[data-submit-order]");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const items = CartStore.getItems();
    if (!items.length) {
      toast("Savat bo‘sh", { type: "info" });
      return;
    }

    const city = $("[data-city]")?.value || "";
    const name = $("[data-name]")?.value || "";
    const phone = $("[data-phone]")?.value || "";
    const address = $("[data-address]")?.value || "";
    const payment = $("[data-payment]")?.value || "";

    if (!city) return toast("Shaharni tanlang", { type: "info" });
    if (!phone) return toast("Telefon kiriting", { type: "info" });
    if (!payment) return toast("To‘lov turini tanlang", { type: "info" });

    btn.disabled = true;

    const subtotal = calcSubtotal();
    const discount = Math.max(0, Number(state.discount) || 0);
    const total = Math.max(0, subtotal - discount);

    const res = await createOrder({
      city,
      phone,
      name,
      delivery_address: address,
      payment,
      total,
      items,
      page: window.location.pathname,
      lang: LangStore.get(),
      voucher_code: state.voucherApplied ? (state.voucherCode || $("[data-voucher-code]")?.value || "") : "",
      discount_amount: discount,
    });

    btn.disabled = false;

    if (!res?.ok) {
      toast(res?.error || "Buyurtma yuborilmadi", { type: "error" });
      return;
    }

    // user phone ni eslab qolamiz (keyingi safar qulay)
    UserStore.setPhone(phone);

    // cart clear
    CartStore.clear();
    state.discount = 0;
    state.voucherApplied = false;

    const orderId = res.order_id || (res.data && res.data.order_id) || "";
    toast("Buyurtma yuborildi ✅", { type: "success" });

    const url = new URL(window.location.origin + "/order-success.html");
    if (orderId) url.searchParams.set("order_id", orderId);
    window.location.href = url.toString();
  });
}

// ---------- refresh ----------
function refresh(full = true) {
  const itemsWrap = $("[data-cart-items]");
  if (!itemsWrap) return;

  if (full) renderItems(itemsWrap);
  renderTotals();
}

// ---------- init ----------
export function initCartPage() {
  const root = $("#cart-root");
  if (!root) return;

  // Agar cart.html ichida markup yo'q bo'lsa — biz o'zimiz chizamiz
  if (!root.querySelector("[data-cart]")) {
    root.innerHTML = "";
    root.appendChild(buildCartLayout());
  }

  const itemsWrap = $("[data-cart-items]");
  renderItems(itemsWrap);
  renderTotals();

  bindItemEvents(itemsWrap);
  bindVoucherEvents();
  bindCheckout();

  // Cart o'zgarsa UI avtomatik yangilansin (boshqa sahifadan kelganda ham)
  window.addEventListener("kuka:cart_changed", () => {
    resetVoucherUI();
    refresh(true);
  });
}