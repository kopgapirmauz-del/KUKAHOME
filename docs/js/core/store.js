// /public/js/core/store.js
// LocalStorage bilan ishlash: cart, lang, registered, voucher timer, user info
// Maqsad: hamma sahifada bir xil, barqaror, xatosiz ishlashi.

import { CONFIG } from "./config.js";

// ----------------------------
// 1) Past-level helperlar
// ----------------------------

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function read(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null || raw === undefined) return fallback;
  // String saqlanadiganlar uchun:
  if (typeof fallback === "string") return raw;

  // Boolean/number/object bo'lsa JSON ko'rinishda saqlaymiz
  return safeParse(raw, fallback);
}

function write(key, value) {
  if (value === undefined) return;
  // String bo'lsa oddiy saqlaymiz
  if (typeof value === "string") {
    localStorage.setItem(key, value);
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

function remove(key) {
  localStorage.removeItem(key);
}

// ----------------------------
// 2) Event (cart badge, UI refresh uchun)
// ----------------------------

function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export const STORE_EVENTS = {
  CART_CHANGED: "kuka:cart_changed",
  USER_CHANGED: "kuka:user_changed",
  LANG_CHANGED: "kuka:lang_changed",
};

// ----------------------------
// 3) DEFAULT state
// ----------------------------

const DEFAULT_CART = {
  items: [], // [{id, model, price, qty, image}]
  updatedAt: 0,
};

const DEFAULT_USER = {
  phone: "",
  registered: false,
  voucherCode: "", // ro'yxatdan o'tganda keladi
};

// ----------------------------
// 4) CART API
// ----------------------------

function normalizeQty(qty) {
  const n = Number(qty);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(Math.floor(n), 99);
}

function findIndex(items, id) {
  return items.findIndex((x) => String(x.id) === String(id));
}

export const CartStore = {
  get() {
    return read(CONFIG.storage.cart, DEFAULT_CART);
  },

  getItems() {
    return this.get().items || [];
  },

  getCount() {
    return this.getItems().reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  },

  getTotal() {
    return this.getItems().reduce((sum, it) => {
      const price = Number(it.price) || 0;
      const qty = Number(it.qty) || 0;
      return sum + price * qty;
    }, 0);
  },

  set(cart) {
    const next = {
      items: Array.isArray(cart?.items) ? cart.items : [],
      updatedAt: Date.now(),
    };
    write(CONFIG.storage.cart, next);
    emit(STORE_EVENTS.CART_CHANGED, { cart: next });
    return next;
  },

  clear() {
    this.set(DEFAULT_CART);
  },

  add(item, qty = 1) {
    // item minimal: { id, model, price, image }
    if (!item || item.id === undefined || item.id === null) return;

    const cart = this.get();
    const items = [...(cart.items || [])];
    const i = findIndex(items, item.id);

    const addQty = normalizeQty(qty);

    if (i >= 0) {
      items[i] = {
        ...items[i],
        qty: normalizeQty((Number(items[i].qty) || 0) + addQty),
      };
    } else {
      items.push({
        id: String(item.id),
        model: String(item.model || ""),
        price: Number(item.price) || 0,
        image: String(item.image || ""),
        qty: addQty,
      });
    }

    return this.set({ items });
  },

  updateQty(id, qty) {
    const cart = this.get();
    const items = [...(cart.items || [])];
    const i = findIndex(items, id);
    if (i < 0) return cart;

    const nextQty = normalizeQty(qty);
    items[i] = { ...items[i], qty: nextQty };
    return this.set({ items });
  },

  remove(id) {
    const cart = this.get();
    const items = (cart.items || []).filter((x) => String(x.id) !== String(id));
    return this.set({ items });
  },
};

// ----------------------------
// 5) USER API (registered + phone + voucher)
// ----------------------------

export const UserStore = {
  get() {
    const phone = read(CONFIG.storage.userPhone, "");
    const registered = read(CONFIG.storage.registered, false);
    const voucherCode = read("kuka_voucher_code", ""); // alohida key (xohlasangiz configga qo'shamiz)

    return {
      phone,
      registered: !!registered,
      voucherCode,
    };
  },

  setPhone(phone) {
    write(CONFIG.storage.userPhone, String(phone || ""));
    emit(STORE_EVENTS.USER_CHANGED, { user: this.get() });
  },

  setRegistered(flag) {
    write(CONFIG.storage.registered, !!flag);
    emit(STORE_EVENTS.USER_CHANGED, { user: this.get() });
  },

  setVoucherCode(code) {
    write("kuka_voucher_code", String(code || ""));
    emit(STORE_EVENTS.USER_CHANGED, { user: this.get() });
  },

  logout() {
    remove(CONFIG.storage.userPhone);
    write(CONFIG.storage.registered, false);
    remove("kuka_voucher_code");
    emit(STORE_EVENTS.USER_CHANGED, { user: this.get() });
  },
};

// ----------------------------
// 6) VOUCHER POPUP TIMER
// ----------------------------
// Maqsad: ro'yxatdan o'tmagan userga 5 minutda bir chiqsin.
// Biz keyingi chiqish vaqtini (nextAt) localStorage da saqlaymiz.

export const VoucherTimerStore = {
  getNextAt() {
    return Number(read(CONFIG.storage.voucherTimer, 0)) || 0;
  },

  setNextAt(ts) {
    write(CONFIG.storage.voucherTimer, Number(ts) || 0);
  },

  // hozir popup ko'rsatish mumkinmi?
  canShowNow() {
    // registered bo'lsa umuman ko'rsatmaymiz
    if (UserStore.get().registered) return false;

    const nextAt = this.getNextAt();
    return Date.now() >= nextAt;
  },

  // popup yopilganda yoki ko'rsatilganda keyingi vaqtni belgilash
  scheduleNext(minutes = CONFIG.voucher.popupInterval) {
    const ms = Number(minutes) * 60 * 1000;
    this.setNextAt(Date.now() + ms);
  },

  reset() {
    this.setNextAt(0);
  },
};

// ----------------------------
// 7) LANG API
// ----------------------------

export const LangStore = {
  get() {
    const lang = read(CONFIG.storage.lang, CONFIG.i18n.defaultLang);
    // supported bo'lmasa defaultga qaytadi
    if (!CONFIG.i18n.supported.includes(lang)) return CONFIG.i18n.defaultLang;
    return lang;
  },

  set(lang) {
    const next = CONFIG.i18n.supported.includes(lang)
      ? lang
      : CONFIG.i18n.defaultLang;

    write(CONFIG.storage.lang, next);
    emit(STORE_EVENTS.LANG_CHANGED, { lang: next });
    return next;
  },
};