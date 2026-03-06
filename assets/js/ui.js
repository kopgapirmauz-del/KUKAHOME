import { CATEGORIES, CONFIG, SHOWROOMS } from "./config.js";
import { t, applyI18n } from "./i18n.js";
import { store } from "./store.js";

const formatMoney = (value) => new Intl.NumberFormat("ru-RU").format(value) + " so'm";

const icon = (name) => {
  const icons = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 1 0 4.09 11.55l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 9.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.75L20 7H7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };
  return icons[name] || "";
};

export const shared = {
  formatMoney,
  icon,
  getCartCount() {
    return store.getCart().reduce((sum, item) => sum + item.qty, 0);
  }
};

export const renderShell = ({ page, title }) => {
  const rootPrefix = page.startsWith("admin") || page.startsWith("seller") ? "../" : "";
  document.title = `${title} | ${CONFIG.brand}`;
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="page-bg"></div>
    <header class="site-header" id="siteHeader">
      <div class="topbar" id="topbar">
        <div class="topbar__socials">
          <a href="${CONFIG.instagram}" aria-label="Instagram">IG</a>
          <a href="${CONFIG.telegram}" aria-label="Telegram">TG</a>
          <a href="${CONFIG.facebook}" aria-label="Facebook">FB</a>
        </div>
        <div class="topbar__meta">
          <span>${CONFIG.phone}</span>
          <div class="lang-switch" aria-label="Language selector">
            <button data-lang="uz">UZ</button>
            <button data-lang="ru">RU</button>
            <button data-lang="en">EN</button>
          </div>
        </div>
      </div>
      <div class="nav-shell">
        <a class="logo" href="${rootPrefix}index.html" aria-label="KUKA HOME">
          <img src="${rootPrefix}assets/data/kuka-logo.svg" alt="KUKA HOME" />
        </a>
        <div class="header-search">
          ${icon("search")}
          <input type="search" data-global-search data-i18n-placeholder="searchPlaceholder" aria-label="Search" />
        </div>
        <nav class="main-nav" aria-label="Main navigation">
          <a href="${rootPrefix}category.html?cat=all" data-i18n="catalog"></a>
          <a href="${rootPrefix}cart.html" class="nav-cart">${icon("cart")}<span data-cart-count>${shared.getCartCount()}</span></a>
          <div class="profile-menu">
            <button class="profile-trigger">${icon("user")}<span>${store.getRole() === "client" ? t("login") : t("profile")}</span></button>
            <div class="profile-dropdown">
              <a href="${page.startsWith("admin") ? "dashboard.html" : page.startsWith("seller") ? "orders.html" : "#profile"}">Profil</a>
              <a href="${page.startsWith("admin") ? "dashboard.html" : `${rootPrefix}admin/dashboard.html`}">Admin panel</a>
              <a href="${page.startsWith("seller") ? "orders.html" : `${rootPrefix}seller/orders.html`}">Menedjer</a>
            </div>
          </div>
        </nav>
      </div>
    </header>
    <main id="app" class="page page-${page}"></main>
    <footer class="site-footer">
      <div>
        <div class="footer-brand"><img src="${rootPrefix}assets/data/kuka-logo.svg" alt="KUKA HOME" /></div>
        <p>Premium mebel, aniq servis va showroom tajribasini bitta ekotizimga jamlaydigan MVP.</p>
      </div>
      <div>
        <h4>Navigatsiya</h4>
        <a href="${rootPrefix}about.html">Biz haqimizda</a>
        <a href="${rootPrefix}showrooms.html">Showroomlar</a>
        <a href="${rootPrefix}contact.html">Aloqa</a>
      </div>
      <div>
        <h4>Showroomlar</h4>
        ${SHOWROOMS.map((item) => `<p>${item.city} - ${item.address}</p>`).join("")}
      </div>
      <div>
        <h4>Integratsiyalar</h4>
        <a href="${CONFIG.sheetUrl}" target="_blank" rel="noreferrer">Google Sheets</a>
        <a href="${CONFIG.appsScriptUrl}" target="_blank" rel="noreferrer">Apps Script</a>
        <a href="${CONFIG.publishedCatalogUrl}" target="_blank" rel="noreferrer">Published catalog</a>
      </div>
    </footer>
    <div class="toast-stack" id="toastStack"></div>
    <div class="chat-bubble hidden" id="chatBubble">
      <button class="chat-bubble__trigger" type="button">${icon("chat")}<span data-i18n="contactUs"></span></button>
    </div>
    <div class="modal hidden" id="chatModal" aria-hidden="true">
      <div class="modal-card messenger-card" role="dialog" aria-modal="true" aria-labelledby="chatTitle">
        <button class="modal-close" data-close-modal="chatModal" aria-label="Close">${icon("close")}</button>
        <div class="messenger-layout">
          <div class="messenger-side">
            <div class="online-dot"></div>
            <h3 id="chatTitle">KUKA Concierge</h3>
            <p>Model, narx, showroom va buyurtma bo'yicha tezkor javob beramiz.</p>
          </div>
          <form class="messenger-form" id="chatForm">
            <input name="phone" type="tel" placeholder="+998 90 123 45 67" required aria-label="Phone" />
            <textarea name="message" rows="5" placeholder="Xabaringizni yozing" required aria-label="Message"></textarea>
            <button class="button button-primary" type="submit">Yuborish</button>
          </form>
        </div>
      </div>
    </div>
    <div class="modal hidden" id="voucherModal" aria-hidden="true">
      <div class="modal-card voucher-card" role="dialog" aria-modal="true" aria-labelledby="voucherTitle">
        <button class="modal-close" data-close-modal="voucherModal" aria-label="Close">${icon("close")}</button>
        <div class="voucher-gift">750 000</div>
        <div>
          <p class="eyebrow">Loyalty reward</p>
          <h2 id="voucherTitle" data-i18n="voucherTitle"></h2>
          <p data-i18n="voucherText"></p>
          <form id="voucherForm" class="voucher-form">
            <input name="name" type="text" placeholder="Ismingiz" required aria-label="Name" />
            <input name="phone" type="tel" placeholder="+998 90 123 45 67" required aria-label="Phone" />
            <button class="button button-primary" type="submit" data-i18n="register"></button>
          </form>
        </div>
      </div>
    </div>
  `
  );

  bindChrome(page);
  applyI18n();
};

const bindChrome = (page) => {
  const langButtons = document.querySelectorAll("[data-lang]");
  langButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === store.getLang());
    button.addEventListener("click", () => {
      store.setLang(button.dataset.lang);
      location.reload();
    });
  });

  const header = document.getElementById("siteHeader");
  window.addEventListener("scroll", () => header.classList.toggle("compact", window.scrollY > 40));

  window.addEventListener("cart:updated", () => {
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = shared.getCartCount();
    });
  });

  const searchInput = document.querySelector("[data-global-search]");
  let timer = 0;
  searchInput?.addEventListener("input", (event) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const query = event.target.value.trim();
      if (!query) return;
      const prefix = page.startsWith("admin") || page.startsWith("seller") ? "../" : "";
      window.location.href = `${prefix}category.html?cat=all&q=${encodeURIComponent(query)}`;
    }, 250);
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(button.dataset.closeModal));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal").forEach((modal) => closeModal(modal.id));
    }
  });
};

export const showToast = (message) => {
  const stack = document.getElementById("toastStack");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 220);
  }, 2400);
};

export const openModal = (id) => {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  modal.querySelector("input, textarea, button")?.focus();
};

export const closeModal = (id) => {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
};

export const renderProductCard = (product) => {
  const images = [product.image1, product.image2, product.image3].filter(Boolean);
  return `
    <article class="product-card reveal" data-product-card data-product-id="${product.id}" data-product-url="product.html?id=${product.id}">
      <div class="product-card__media" aria-label="${product.model}" role="link" tabindex="0">
        <div class="product-slider" data-slider>
          <div class="product-slider__track" style="transform:translateX(0%)">
            ${images.map((src) => `<img src="${src}" alt="${product.model}" loading="lazy" />`).join("")}
          </div>
          <div class="product-dots">${images.map((_, index) => `<button type="button" aria-label="Slide ${index + 1}" data-dot="${index}" class="${index === 0 ? "active" : ""}"></button>`).join("")}</div>
        </div>
        <span class="availability ${product.available === "Yes" ? "yes" : "no"}">${product.available}</span>
      </div>
      <div class="product-card__body">
        <h3><a href="product.html?id=${product.id}">${product.model}</a></h3>
        <div class="product-card__price">
          <strong>${formatMoney(product.price_new)}</strong>
          <span>${formatMoney(product.price_old)}</span>
        </div>
      </div>
    </article>
  `;
};

export const initReveal = () => {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.16 }
  );
  items.forEach((item) => observer.observe(item));
};

export const initCardSliders = () => {
  document.querySelectorAll("[data-slider]").forEach((slider) => {
    const track = slider.querySelector(".product-slider__track");
    const dots = Array.from(slider.querySelectorAll("[data-dot]"));
    let current = 0;
    const update = (index) => {
      current = index;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
    };
    dots.forEach((dot, index) => dot.addEventListener("click", (event) => {
      event.preventDefault();
      update(index);
    }));

    let startX = 0;
    slider.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
    });
    slider.addEventListener("pointerup", (event) => {
      const delta = event.clientX - startX;
      if (Math.abs(delta) < 20) return;
      if (delta < 0 && current < dots.length - 1) update(current + 1);
      if (delta > 0 && current > 0) update(current - 1);
    });

    const card = slider.closest("[data-product-card]");
    card?.addEventListener("click", (event) => {
      if (event.target.closest("[data-dot]")) return;
      window.location.href = card.dataset.productUrl;
    });
    card?.querySelector(".product-card__media")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") window.location.href = card.dataset.productUrl;
    });
  });
};

export const downloadExcelLikeFile = (filename, rows) => {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const table = `
    <table>
      <tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr>
      ${rows.map((row) => `<tr>${headers.map((key) => `<td>${String(row[key] ?? "")}</td>`).join("")}</tr>`).join("")}
    </table>`;
  const blob = new Blob([table], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const renderCategoryTabs = (active = "all") =>
  CATEGORIES.map((item) => `<a class="chip ${active === item.id ? "active" : ""}" href="category.html?cat=${item.id}">${item.label}</a>`).join("");
