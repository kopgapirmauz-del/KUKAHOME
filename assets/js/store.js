import { CONFIG } from "./config.js";

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const store = {
  getCart() {
    return readJson(CONFIG.storageKeys.cart, []);
  },
  setCart(cart) {
    writeJson(CONFIG.storageKeys.cart, cart);
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
  },
  addToCart(product, qty = 1) {
    const cart = this.getCart();
    const current = cart.find((item) => item.id === product.id);
    if (current) current.qty += qty;
    else cart.push({ id: product.id, qty, model: product.model, price: product.price_new, image: product.image1 });
    this.setCart(cart);
  },
  updateCartItem(id, qty) {
    const cart = this.getCart().map((item) => (item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
    this.setCart(cart);
  },
  removeFromCart(id) {
    this.setCart(this.getCart().filter((item) => item.id !== id));
  },
  clearCart() {
    localStorage.removeItem(CONFIG.storageKeys.cart);
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: [] }));
  },
  getLang() {
    return localStorage.getItem(CONFIG.storageKeys.lang) || "uz";
  },
  setLang(lang) {
    localStorage.setItem(CONFIG.storageKeys.lang, lang);
  },
  getRegisteredProfile() {
    return readJson(CONFIG.storageKeys.profile, null);
  },
  setRegisteredProfile(profile) {
    localStorage.setItem(CONFIG.storageKeys.registered, "true");
    writeJson(CONFIG.storageKeys.profile, profile);
    if (profile?.voucherCode) localStorage.setItem(CONFIG.storageKeys.voucherCode, profile.voucherCode);
  },
  isRegistered() {
    return localStorage.getItem(CONFIG.storageKeys.registered) === "true";
  },
  setTimer(key) {
    localStorage.setItem(key, String(Date.now()));
  },
  canShowAfter(key, minutes = 5) {
    const last = Number(localStorage.getItem(key) || 0);
    return Date.now() - last > minutes * 60 * 1000;
  },
  setRole(role) {
    localStorage.setItem(CONFIG.storageKeys.role, role);
  },
  getRole() {
    return localStorage.getItem(CONFIG.storageKeys.role) || "client";
  }
};
