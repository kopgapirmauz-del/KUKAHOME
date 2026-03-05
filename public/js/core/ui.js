// /public/js/core/ui.js
// Premium UI helperlar: toast, modal, focus-trap, skeleton, reveal, count-up, fly-to-cart

import { $, $$, el, throttle } from "./dom.js";
import { CartStore, STORE_EVENTS } from "./store.js";
import { CONFIG } from "./config.js";

// ----------------------------
// 0) Global UI root (1 marta yaratiladi)
// ----------------------------
let _uiReady = false;

function ensureUIRoot() {
  if (_uiReady) return;
  _uiReady = true;

  // Toast container
  if (!$("#toast-root")) {
    document.body.appendChild(
      el("div", { id: "toast-root", class: "toast-root", "aria-live": "polite" })
    );
  }

  // Modal container
  if (!$("#modal-root")) {
    document.body.appendChild(el("div", { id: "modal-root", class: "modal-root" }));
  }

  // Fly layer (animatsiya uchun)
  if (!$("#fly-layer")) {
    document.body.appendChild(el("div", { id: "fly-layer", class: "fly-layer" }));
  }
}

// ----------------------------
// 1) TOAST (kichik xabar)
// ----------------------------
export function toast(message, opts = {}) {
  ensureUIRoot();

  const {
    type = "default", // default | success | error | info
    duration = 2600,
  } = opts;

  const root = $("#toast-root");

  const node = el(
    "div",
    {
      class: `toast toast--${type}`,
      role: "status",
      tabindex: "0",
    },
    el("div", { class: "toast__msg" }, message)
  );

  root.appendChild(node);

  // animatsiya (css orqali)
  requestAnimationFrame(() => node.classList.add("is-in"));

  const kill = () => {
    node.classList.remove("is-in");
    node.classList.add("is-out");
    setTimeout(() => node.remove(), 250);
  };

  const t = setTimeout(kill, duration);

  // click bilan yopish
  node.addEventListener("click", () => {
    clearTimeout(t);
    kill();
  });
}

// ----------------------------
// 2) MODAL + Focus trap
// ----------------------------
let _activeModal = null;
let _lastFocus = null;

function getFocusable(container) {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return $$(selectors, container).filter((x) => x.offsetParent !== null);
}

function trapFocus(modalEl, e) {
  if (e.key !== "Tab") return;
  const focusable = getFocusable(modalEl);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function openModal({ title = "", content, closable = true, onClose } = {}) {
  ensureUIRoot();

  // bitta modal ochiq bo'lsa, avvalgisini yopamiz
  if (_activeModal) closeModal();

  _lastFocus = document.activeElement;

  const root = $("#modal-root");

  const overlay = el("div", { class: "modal-overlay", role: "presentation" });

  const modal = el(
    "div",
    {
      class: "modal",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": title || "Modal",
      tabindex: "-1",
    },
    el(
      "div",
      { class: "modal__header" },
      el("div", { class: "modal__title" }, title),
      closable
        ? el(
            "button",
            {
              class: "modal__close",
              type: "button",
              "aria-label": "Close",
              onclick: () => closeModal(),
            },
            "×"
          )
        : null
    ),
    el("div", { class: "modal__body" }, content instanceof Node ? content : el("div", {}, String(content || "")))
  );

  const wrap = el("div", { class: "modal-wrap" }, overlay, modal);
  root.appendChild(wrap);

  _activeModal = { wrap, modal, onClose };

  // body scroll lock
  document.documentElement.classList.add("modal-open");

  // click outside close
  if (closable) {
    overlay.addEventListener("click", () => closeModal());
    document.addEventListener("keydown", escClose, { once: true });
  }

  // focus trap
  modal.addEventListener("keydown", (e) => trapFocus(modal, e));

  // focus first
  requestAnimationFrame(() => {
    modal.classList.add("is-in");
    const focusable = getFocusable(modal);
    (focusable[0] || modal).focus();
  });

  return modal;
}

function escClose(e) {
  if (e.key === "Escape") closeModal();
}

export function closeModal() {
  if (!_activeModal) return;
  const { wrap, onClose } = _activeModal;

  wrap.querySelector(".modal")?.classList.remove("is-in");
  wrap.querySelector(".modal")?.classList.add("is-out");

  setTimeout(() => wrap.remove(), 220);

  document.documentElement.classList.remove("modal-open");
  _activeModal = null;

  if (typeof onClose === "function") onClose();

  // focus qaytarish
  if (_lastFocus && typeof _lastFocus.focus === "function") _lastFocus.focus();
  _lastFocus = null;
}

// ----------------------------
// 3) SKELETON loading
// ----------------------------
export function applySkeleton(container, count = 8, variant = "card") {
  // container ichini skeleton bilan to'ldiradi
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = el("div", { class: `skeleton skeleton--${variant}` });
    container.appendChild(sk);
  }
}

export function clearSkeleton(container) {
  if (!container) return;
  container.innerHTML = "";
}

// ----------------------------
// 4) SECTION REVEAL (scroll bo'lganda chiqib keladi)
// ----------------------------
let _revealObserver = null;

export function initReveal({ selector = "[data-reveal]" } = {}) {
  const nodes = $$(selector);
  if (!nodes.length) return;

  // modern variant
  if ("IntersectionObserver" in window) {
    if (_revealObserver) _revealObserver.disconnect();

    _revealObserver = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (ent.isIntersecting) {
            ent.target.classList.add("is-visible");
            _revealObserver.unobserve(ent.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    nodes.forEach((n) => _revealObserver.observe(n));
  } else {
    // fallback (eski brauzer)
    const onScroll = throttle(() => {
      const vh = window.innerHeight || 0;
      nodes.forEach((n) => {
        if (n.classList.contains("is-visible")) return;
        const r = n.getBoundingClientRect();
        if (r.top < vh * 0.9) n.classList.add("is-visible");
      });
    }, 150);

    window.addEventListener("scroll", onScroll);
    onScroll();
  }
}

// ----------------------------
// 5) COUNT-UP (KPI raqamlar)
// ----------------------------
export function countUp(node, to = 0, opts = {}) {
  if (!node) return;
  const { duration = 900, from = 0, formatter } = opts;

  const start = performance.now();
  const target = Number(to) || 0;
  const begin = Number(from) || 0;

  const fmt = typeof formatter === "function"
    ? formatter
    : (n) => Math.round(n).toLocaleString("ru-RU").replaceAll(",", " ");

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    // easing (silliq)
    const eased = 1 - Math.pow(1 - t, 3);
    const val = begin + (target - begin) * eased;
    node.textContent = fmt(val);

    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ----------------------------
// 6) SMOOTH SCROLL (anchorlar uchun)
// ----------------------------
export function initSmoothScroll() {
  document.addEventListener("click", (e) => {
    const a = e.target?.closest?.("a[href^='#']");
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ----------------------------
// 7) FLY-TO-CART animatsiya
// ----------------------------
// add-to-cart bosilganda product rasmidan cart ikonagacha "uchib boradi"
export function flyToCart(imgEl, cartIconEl) {
  ensureUIRoot();
  if (!imgEl || !cartIconEl) return;

  const flyLayer = $("#fly-layer");
  const imgRect = imgEl.getBoundingClientRect();
  const cartRect = cartIconEl.getBoundingClientRect();

  const clone = imgEl.cloneNode(true);
  clone.classList.add("fly-img");

  // boshlanish nuqtasi
  clone.style.left = `${imgRect.left + imgRect.width / 2}px`;
  clone.style.top = `${imgRect.top + imgRect.height / 2}px`;

  flyLayer.appendChild(clone);

  // target nuqta
  const tx = cartRect.left + cartRect.width / 2;
  const ty = cartRect.top + cartRect.height / 2;

  requestAnimationFrame(() => {
    clone.classList.add("is-flying");
    clone.style.transform = `translate(${tx - (imgRect.left + imgRect.width / 2)}px, ${ty - (imgRect.top + imgRect.height / 2)}px) scale(0.18)`;
    clone.style.opacity = "0.25";
  });

  setTimeout(() => {
    clone.remove();
  }, 520);
}

// ----------------------------
// 8) CART BADGE auto update (header cart count)
// ----------------------------
export function bindCartBadge(badgeSelector = "[data-cart-count]") {
  const update = () => {
    const count = CartStore.getCount();
    $$(badgeSelector).forEach((n) => {
      n.textContent = String(count);
      n.style.display = count > 0 ? "inline-flex" : "none";
    });
  };

  window.addEventListener(STORE_EVENTS.CART_CHANGED, update);
  update();
}

// ----------------------------
// 9) Init (global)
// ----------------------------
export function initUI() {
  ensureUIRoot();
  initSmoothScroll();
}