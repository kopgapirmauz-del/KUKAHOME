import { CONFIG, SHOWROOMS } from "./config.js";
import { api } from "./sheets.js";
import { t } from "./i18n.js";
import { store } from "./store.js";
import {
  closeModal,
  initCardSliders,
  initReveal,
  openModal,
  renderCategoryTabs,
  renderProductCard,
  renderShell,
  shared,
  showToast
} from "./ui.js";

const page = document.body.dataset.page;
let products = [];
const getApp = () => document.getElementById("app");

const params = new URLSearchParams(window.location.search);
const currentProduct = () => products.find((item) => item.id === params.get("id"));

const countUp = () => {
  document.querySelectorAll("[data-count]").forEach((node) => {
    const target = Number(node.dataset.count || 0);
    let value = 0;
    const step = Math.max(1, Math.round(target / 40));
    const tick = () => {
      value += step;
      if (value >= target) value = target;
      node.textContent = new Intl.NumberFormat("ru-RU").format(value) + (target >= 1000 ? "+" : "");
      if (value < target) requestAnimationFrame(tick);
    };
    tick();
  });
};

const section = (title, text, body) => `
  <section class="page-section reveal">
    <div class="section-title">
      <p class="eyebrow">KUKA HOME</p>
      <h2>${title}</h2>
      <p>${text}</p>
    </div>
    ${body}
  </section>`;

const initHome = async () => {
  renderShell({ page, title: "Premium furniture" });
  products = await api.getProducts();
  const stats = await api.getDashboard();
  const featured = products.filter((item) => item.featured).slice(0, 3);
  getApp().innerHTML = `
    <section class="hero">
      <div class="hero-card reveal">
        <p class="eyebrow">Curated furniture platform</p>
        <h1 data-i18n="heroTitle">${t("heroTitle")}</h1>
        <p data-i18n="heroText">${t("heroText")}</p>
        <div class="pill-list">
          <span>Premium minimal</span>
          <span>Google Sheets sync</span>
          <span>CRM-ready MVP</span>
        </div>
        <div class="chip-row">
          <a class="hero-cta" href="category.html?cat=all">${t("heroCta")}</a>
          <a class="hero-cta button-secondary" href="showrooms.html">Showroomlar</a>
        </div>
      </div>
      <div class="hero-gallery reveal">
        <div class="glass-card"><div class="hero-visual"></div></div>
        <div class="glass-card stat-card"><strong>24/7</strong><span>Online konsultatsiya va tezkor lead capture</span></div>
        <div class="glass-card stat-card"><strong>1 ta Sheets</strong><span>Katalog, voucher, murojaat, buyurtma va sklad yagona bazada</span></div>
      </div>
    </section>
    <section class="page-section reveal">
      <div class="hero-stats">
        ${(stats || []).map((item) => `<div class="stat-card"><strong data-count="${item.value}">0</strong><span>${item.label}</span></div>`).join("")}
      </div>
    </section>
    ${section(
      "Slide animatsiyali premium showcase",
      "Fade emas, chap-o'ng transition bilan ishlaydigan hero slider mahsulot kolleksiyalarini premium ohangda ko'rsatadi.",
      `<div class="slider-shell glass-card">
        <div class="slider-track" id="homeSlider">
          ${featured.map((item) => `<article class="slide"><div><p class="eyebrow">${item.category}</p><h2>${item.model}</h2><p>${item.desc}</p><div class="chip-row"><a class="button button-primary" href="product.html?id=${item.id}">Mahsulotni ko'rish</a><button class="button button-secondary" data-add-id="${item.id}">${t("addToCart")}</button></div></div><div class="section-visual" style="background-image:url('${item.image1}');background-size:cover;background-position:center"></div></article>`).join("")}
        </div>
        <div class="slide-nav"><button id="prevSlide">&#8592;</button><button id="nextSlide">&#8594;</button></div>
      </div>`
    )}
    ${section(
      "Yangi va tavsiya etilgan kolleksiya",
      "Card ichida 3 ta rasm, swipe gesture, skeleton loading va premium hover motion bilan kataloga tayyor bloklar.",
      `<div class="chip-row">${renderCategoryTabs("all")}</div><div class="product-grid" id="featuredProducts">${new Array(3).fill('<div class="skeleton"></div>').join("")}</div>`
    )}
    ${section(
      "Showroom va servis ritmi",
      "Showroom, aloqa va service promise bloklari mobil va desktop'da aniq o'qiladigan kartalarda berilgan.",
      `<div class="three-grid">${SHOWROOMS.map((item) => `<article class="showroom-card"><p class="eyebrow">${item.city}</p><h3>${item.address}</h3><p>${item.hours}</p><span class="badge green">${item.phone}</span></article>`).join("")}</div>`
    )}
  `;

  document.getElementById("featuredProducts").innerHTML = featured.map(renderProductCard).join("");
  initHomeSlider();
  bindSharedActions();
  initCardSliders();
  initReveal();
  countUp();
  initEngagement();
};

const initHomeSlider = () => {
  const slider = document.getElementById("homeSlider");
  if (!slider) return;
  const slides = slider.children.length;
  let current = 0;
  const update = () => {
    slider.style.transform = `translateX(-${current * 100}%)`;
  };
  document.getElementById("prevSlide")?.addEventListener("click", () => {
    current = current === 0 ? slides - 1 : current - 1;
    update();
  });
  document.getElementById("nextSlide")?.addEventListener("click", () => {
    current = current === slides - 1 ? 0 : current + 1;
    update();
  });
  setInterval(() => {
    current = current === slides - 1 ? 0 : current + 1;
    update();
  }, 5500);
};

const initCategory = async () => {
  renderShell({ page, title: "Catalog" });
  products = await api.getProducts();
  const cat = params.get("cat") || "all";
  const query = (params.get("q") || "").toLowerCase();
  const filtered = products.filter((item) => {
    const catOk = cat === "all" || item.category === cat || item.tags?.includes(cat);
    const queryOk = !query || [item.model, item.category, item.desc].join(" ").toLowerCase().includes(query);
    return catOk && queryOk;
  });
  getApp().innerHTML = `
    <section class="page-section">
      <div class="section-title"><p class="eyebrow">Catalog</p><h2>${cat === "all" ? "Barcha kolleksiyalar" : cat}</h2><p>Minimal filter, tezkor qidiruv va mobil uchun qulay swipe kartalar.</p></div>
      <div class="chip-row">${renderCategoryTabs(cat)}</div>
      <div class="product-grid">${filtered.length ? filtered.map(renderProductCard).join("") : '<div class="empty-state glass-card">Mahsulot topilmadi.</div>'}</div>
    </section>
  `;
  initCardSliders();
  initReveal();
  bindSharedActions();
  initEngagement();
};

const initProduct = async () => {
  renderShell({ page, title: "Product" });
  products = await api.getProducts();
  const product = currentProduct() || products[0];
  const images = [product.image1, product.image2, product.image3].filter(Boolean);
  getApp().innerHTML = `
    <section class="product-detail">
      <div class="glass-card panel reveal">
        <div class="gallery-hero"><img id="activeImage" src="${images[0]}" alt="${product.model}" /></div>
        <div class="gallery-thumbs">${images.map((src, index) => `<button data-gallery-index="${index}"><img src="${src}" alt="${product.model} ${index + 1}" loading="lazy" /></button>`).join("")}</div>
      </div>
      <div class="glass-card panel product-detail__copy reveal">
        <p class="eyebrow">${product.category}</p>
        <h1>${product.model}</h1>
        <p>${product.desc}</p>
        <div class="price-line"><strong>${shared.formatMoney(product.price_new)}</strong><span>${shared.formatMoney(product.price_old)}</span></div>
        <div class="pill-list"><span>${product.spec}</span><span class="${product.available === "Yes" ? "badge green" : "badge"}">${product.available === "Yes" ? "Available" : "Pre-order only"}</span></div>
        <div class="chip-row"><button class="button button-primary" id="productAddToCart">${t("addToCart")}</button><a class="button button-secondary" href="cart.html">${t("checkout")}</a></div>
      </div>
    </section>
    ${section("Sizga mos alternativalar", "Shu uslubda tanlangan qo'shimcha modellar.", `<div class="product-grid">${products.filter((item) => item.id !== product.id).slice(0, 3).map(renderProductCard).join("")}</div>`)}
  `;
  document.querySelectorAll("[data-gallery-index]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("activeImage").src = images[Number(button.dataset.galleryIndex)];
    });
  });
  document.getElementById("productAddToCart")?.addEventListener("click", (event) => addProductToCart(product, event.currentTarget));
  initCardSliders();
  initReveal();
  bindSharedActions();
  initEngagement();
};

const initCart = async () => {
  renderShell({ page, title: "Cart" });
  products = await api.getProducts();
  const cart = store.getCart();
  const cartItems = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) || item }));
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  getApp().innerHTML = `
    <section class="cart-layout">
      <div class="glass-card panel reveal">
        <div class="section-title"><p class="eyebrow">Checkout</p><h2>Savat va buyurtma</h2><p>Header va footer saqlangan holda markaziy blok checkout flow'ga o'tadi.</p></div>
        ${cartItems.length ? cartItems.map((item) => `<div class="cart-item"><img src="${item.product.image1 || item.image}" alt="${item.model}" /><div><h3>${item.model}</h3><p>${shared.formatMoney(item.price)}</p><div class="qty-control"><button data-qty-minus="${item.id}">-</button><strong>${item.qty}</strong><button data-qty-plus="${item.id}">+</button></div></div><button class="ghost-button" data-remove-id="${item.id}">O'chirish</button></div>`).join("") : '<div class="empty-state">Savatingiz hozircha bo\'sh.</div>'}
      </div>
      <aside class="checkout-card reveal">
        <h3>Buyurtma ma'lumotlari</h3>
        <p>Jami: <strong>${shared.formatMoney(total)}</strong></p>
        <form class="order-form" id="orderForm">
          <input name="name" type="text" placeholder="Ismingiz" required />
          <input name="phone" type="tel" placeholder="Telefon" required />
          <input name="city" type="text" placeholder="Shahar" required />
          <textarea name="delivery_address" rows="4" placeholder="Yetkazib berish manzili" required></textarea>
          <select name="payment"><option>Click</option><option>Payme</option><option>Naqd</option></select>
          <input name="voucher" type="text" placeholder="Voucher code" value="${localStorage.getItem(CONFIG.storageKeys.voucherCode) || ""}" />
          <button class="button button-primary" type="submit">Buyurtmani yuborish</button>
        </form>
      </aside>
    </section>
  `;
  document.querySelectorAll("[data-qty-minus]").forEach((button) => button.addEventListener("click", () => adjustQty(button.dataset.qtyMinus, -1)));
  document.querySelectorAll("[data-qty-plus]").forEach((button) => button.addEventListener("click", () => adjustQty(button.dataset.qtyPlus, 1)));
  document.querySelectorAll("[data-remove-id]").forEach((button) => button.addEventListener("click", () => {
    store.removeFromCart(button.dataset.removeId);
    initCart();
  }));
  document.getElementById("orderForm")?.addEventListener("submit", submitOrder);
  initReveal();
  initEngagement();
};

const initStatic = (kind) => {
  renderShell({ page, title: kind });
  const views = {
    about: `
      <section class="about-layout">
        <article class="glass-card panel reveal"><p class="eyebrow">Brand story</p><h1>KUKA HOME premium positioning</h1><p>KUKA HOME zamonaviy yashash makonlari uchun premium mebel tanlovini showroom tajribasi va onlayn xarid yo'li bilan birlashtiradi. Ushbu MVP keyinchalik CRM, sotuv markazi, stock va shipment kuzatuvini yagona tizimga ulash uchun tayyorlangan.</p></article>
        <aside class="info-card reveal"><div class="mini-visual"></div><p>Minimal, light luxury va conversion-ready UX kontseptsiyasi.</p></aside>
      </section>
      ${section("Nega bu MVP muhim", "Frontend, admin va seller flow'lari bir xil dizayn tizimida ishlashi keyingi bosqichlarni tezlashtiradi.", `<div class="three-grid"><article class="info-card"><h3>Storefront</h3><p>Catalog, product, cart va loyalty funnel.</p></article><article class="info-card"><h3>Operations</h3><p>Buyurtmalar, leads va export markazi.</p></article><article class="info-card"><h3>Scalability</h3><p>Stock, shipments va showroom availability uchun schema tayyor.</p></article></div>`)}
    `,
    showrooms: `
      <section class="showroom-layout">
        <article class="glass-card panel reveal"><p class="eyebrow">Showrooms</p><h1>Shourumlar</h1><p>Har bir showroom uchun mavjud modellarning holati keyingi bosqichda stock tab orqali boshqariladi.</p></article>
        <aside class="info-card reveal"><div class="section-visual"></div></aside>
      </section>
      ${section("Manzillar", "Sinov uchun namunaviy showroom kartalari.", `<div class="three-grid">${SHOWROOMS.map((item) => `<article class="showroom-card"><h3>${item.city}</h3><p>${item.address}</p><p>${item.hours}</p><span class="badge green">Open now</span></article>`).join("")}</div>`)}
    `,
    contact: `
      <section class="contact-layout">
        <article class="glass-card panel reveal"><p class="eyebrow">Contact</p><h1>Aloqa</h1><p>Form orqali yozilgan xabarlar ` + "`murojaatlar`" + ` sheet'iga yuboriladi.</p><form class="messenger-form" id="contactForm"><input name="phone" type="tel" placeholder="Telefon" required /><textarea name="message" rows="6" placeholder="Xabar" required></textarea><button class="button button-primary" type="submit">Yuborish</button></form></article>
        <aside class="contact-card reveal"><h3>Biz bilan bog'laning</h3><p>${CONFIG.phone}</p><p>Telegram, Instagram va showroom konsultatsiyasi bir joyda.</p><div class="chip-row"><a class="button button-secondary" href="${CONFIG.telegram}">Telegram</a><a class="button button-secondary" href="${CONFIG.instagram}">Instagram</a></div></aside>
      </section>
    `,
    "order-success": `
      <section class="page-section"><div class="glass-card panel reveal"><p class="eyebrow">Order placed</p><h1>Buyurtmangiz qabul qilindi</h1><p>Menedjer tez orada siz bilan bog'lanadi. Voucher profilingizda saqlanadi.</p><div class="chip-row"><a class="button button-primary" href="index.html">Bosh sahifa</a><a class="button button-secondary" href="category.html?cat=all">Xaridni davom ettirish</a></div></div></section>
    `
  };
  getApp().innerHTML = views[kind];
  document.getElementById("contactForm")?.addEventListener("submit", submitChat);
  initReveal();
  initEngagement();
};

const bindSharedActions = () => {
  document.querySelectorAll("[data-add-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const product = products.find((item) => item.id === button.dataset.addId);
      addProductToCart(product, event.currentTarget);
    });
  });
};

const addProductToCart = (product, trigger) => {
  if (!product) return;
  store.addToCart(product, 1);
  flyToCart(trigger, product.image1);
  showToast(`${product.model} savatga qo'shildi`);
};

const flyToCart = (trigger, image) => {
  const cart = document.querySelector(".nav-cart");
  if (!trigger || !cart) return;
  const ghost = document.createElement("img");
  const start = trigger.getBoundingClientRect();
  const end = cart.getBoundingClientRect();
  ghost.src = image;
  ghost.style.cssText = `position:fixed;left:${start.left}px;top:${start.top}px;width:72px;height:72px;border-radius:16px;object-fit:cover;z-index:100;transition:600ms cubic-bezier(.2,.8,.2,1);box-shadow:0 16px 30px rgba(0,0,0,.18)`;
  document.body.appendChild(ghost);
  requestAnimationFrame(() => {
    ghost.style.left = end.left + "px";
    ghost.style.top = end.top + "px";
    ghost.style.width = "24px";
    ghost.style.height = "24px";
    ghost.style.opacity = "0.2";
  });
  setTimeout(() => ghost.remove(), 650);
};

const adjustQty = (id, delta) => {
  const item = store.getCart().find((entry) => entry.id === id);
  if (!item) return;
  const next = item.qty + delta;
  if (next <= 0) store.removeFromCart(id);
  else store.updateCartItem(id, next);
  initCart();
};

const submitChat = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  await api.submitChat({ phone: formData.get("phone"), message: formData.get("message"), page, lang: store.getLang() });
  showToast("Xabaringiz yuborildi");
  form.reset();
  closeModal("chatModal");
};

const submitOrder = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const cart = store.getCart();
  let total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (data.voucher) {
    const applied = await api.applyVoucher(data.voucher, data.phone);
    if (applied?.ok) {
      total = Math.max(0, total - (Number(applied.discount) || 0));
      showToast(`Voucher qo'llandi: -${shared.formatMoney(Number(applied.discount) || 0)}`);
    }
  }
  const result = await api.submitOrder({ ...data, total, items: cart, page });
  if (result?.ok) {
    store.clearCart();
    window.location.href = `order-success.html?order_id=${encodeURIComponent(result.order_id || "")}`;
  }
};

const initEngagement = () => {
  const bubble = document.getElementById("chatBubble");
  bubble?.querySelector(".chat-bubble__trigger")?.addEventListener("click", () => openModal("chatModal"));
  document.getElementById("chatForm")?.addEventListener("submit", submitChat);
  document.getElementById("voucherForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const result = await api.registerUser(data);
    if (result?.ok) {
      store.setRegisteredProfile(result.profile);
      store.setTimer(CONFIG.storageKeys.voucherSeenAt);
      showToast(`Voucher: ${result.profile.voucherCode}`);
      closeModal("voucherModal");
    }
  });

  if (!store.isRegistered() && store.canShowAfter(CONFIG.storageKeys.voucherSeenAt, 5) && !page.startsWith("admin") && !page.startsWith("seller")) {
    openModal("voucherModal");
    store.setTimer(CONFIG.storageKeys.voucherSeenAt);
  }
  if (store.canShowAfter(CONFIG.storageKeys.chatSeenAt, 5) && !page.startsWith("admin") && !page.startsWith("seller")) {
    bubble?.classList.remove("hidden");
    store.setTimer(CONFIG.storageKeys.chatSeenAt);
    bubble?.insertAdjacentHTML("beforeend", '<button type="button" class="bubble-close" aria-label="Dismiss">x</button>');
    bubble?.querySelector(".bubble-close")?.addEventListener("click", (event) => {
      event.stopPropagation();
      bubble.classList.add("hidden");
      store.setTimer(CONFIG.storageKeys.chatSeenAt);
    }, { once: true });
  }
};

const routes = {
  index: initHome,
  category: initCategory,
  product: initProduct,
  cart: initCart,
  about: () => initStatic("about"),
  showrooms: () => initStatic("showrooms"),
  contact: () => initStatic("contact"),
  "order-success": () => initStatic("order-success")
};

routes[page]?.();
