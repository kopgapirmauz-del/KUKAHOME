const state = {
  lang: "uz",
  testimonialIndex: 0,
};

function t(key) {
  return (translations[state.lang] && translations[state.lang][key]) || translations.uz[key] || key;
}

function setBrandColors() {
  Object.entries(BRAND.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

function sectionTitle(title, subtitle = "") {
  return `
    <div class="card-head">
      <span>${subtitle}</span>
      <h3>${title}</h3>
    </div>
  `;
}

function button(label, href, variant = "secondary") {
  return `<a class="btn btn--${variant}" href="${href}">${label}</a>`;
}

function renderBenefits() {
  const el = document.getElementById("benefits-grid");
  el.innerHTML = benefits
    .map(
      (item) => `
      <article class="benefit-card reveal">
        <div class="benefit-card__icon">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </article>
    `
    )
    .join("");
}

function renderCategories() {
  const el = document.getElementById("categories-grid");
  el.innerHTML = categories
    .map(
      (item) => `
      <article class="category-card reveal">
        <img src="${item.image}" alt="${item.title}" loading="lazy" />
        <div class="category-card__overlay">
          ${sectionTitle(item.title, item.subtitle)}
          ${button(t("ui.view"), "#contact")}
        </div>
      </article>
    `
    )
    .join("");
}

function productCard(item) {
  return `
    <article class="product-card reveal">
      <div class="product-card__media">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="product-card__body">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <strong>${item.price}</strong>
        <div class="product-card__actions">
          ${button(t("ui.order"), "#contact", "primary")}
          ${button("Telegram", "https://t.me", "ghost")}
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  document.getElementById("products-grid").innerHTML = products.map(productCard).join("");
}

function renderFeatured() {
  document.getElementById("featured-grid").innerHTML = featuredProducts
    .map(
      (item) => `
      <article class="mini-card reveal">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
        <div>
          <span>${item.note}</span>
          <h3>${item.name}</h3>
        </div>
      </article>
    `
    )
    .join("");
}

function renderShowrooms() {
  document.getElementById("showrooms-grid").innerHTML = showrooms
    .map(
      (item) => `
      <article class="showroom-card reveal">
        <span class="showroom-card__tag">${t("ui.showroom")}</span>
        <h3>${item.city}</h3>
        <p>${item.address}</p>
        <p>${item.hours}</p>
        <div class="showroom-card__actions">
          ${button(t("ui.map"), "https://maps.google.com", "secondary")}
          ${button(t("ui.visit"), "#contact", "ghost")}
        </div>
      </article>
    `
    )
    .join("");
}

function renderTestimonials() {
  const track = document.getElementById("testimonial-track");
  track.innerHTML = testimonials
    .map(
      (item, index) => `
      <article class="testimonial-card ${index === state.testimonialIndex ? "is-active" : ""}">
        <div class="stars">★★★★★</div>
        <p>"${item.review}"</p>
        <strong>${item.name}</strong>
      </article>
    `
    )
    .join("");
}

function updateTestimonials(step = 0) {
  state.testimonialIndex = (state.testimonialIndex + step + testimonials.length) % testimonials.length;
  const cards = document.querySelectorAll(".testimonial-card");
  cards.forEach((card, index) => card.classList.toggle("is-active", index === state.testimonialIndex));
}

function startCountdown() {
  const future = new Date();
  future.setDate(future.getDate() + 8);

  const update = () => {
    const diff = future - new Date();
    const totalMinutes = Math.max(0, Math.floor(diff / 60000));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    document.getElementById("days").textContent = String(days).padStart(2, "0");
    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  };

  update();
  setInterval(update, 60000);
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
}

function initHeader() {
  const header = document.querySelector(".header");
  const burger = document.querySelector(".burger");
  const mobileMenu = document.getElementById("mobile-menu");

  const syncHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  burger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();
}

function applyTranslations(lang) {
  const dict = translations[lang] || translations.uz;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (dict[key]) {
      node.textContent = dict[key];
    }
  });
}

function initLanguageSwitch() {
  const buttons = document.querySelectorAll(".lang-switch__btn");
  buttons.forEach((buttonEl) => {
    buttonEl.addEventListener("click", () => {
      state.lang = buttonEl.dataset.lang;
      buttons.forEach((btn) => btn.classList.toggle("is-active", btn === buttonEl));
      renderCategories();
      renderProducts();
      renderShowrooms();
      applyTranslations(state.lang);
    });
  });
}

function initForm() {
  const form = document.getElementById("lead-form");
  const status = document.getElementById("form-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const interest = String(data.get("interest") || "").trim();
    const validPhone = /^\+?[\d\s()-]{9,}$/.test(phone);

    if (!name || !validPhone || !interest) {
      status.textContent = state.lang === "ru"
        ? "Пожалуйста, заполните имя, телефон и интересующую категорию."
        : state.lang === "en"
          ? "Please fill in your name, phone and furniture interest."
          : "Iltimos, ism, telefon va qiziqayotgan mebelni kiriting.";
      status.classList.add("is-error");
      return;
    }

    status.textContent = state.lang === "ru"
      ? "Спасибо! Заявка принята. Менеджер свяжется с вами в ближайшее время."
      : state.lang === "en"
        ? "Thanks! Your request has been received. Our manager will contact you shortly."
        : "Rahmat! So'rovingiz qabul qilindi. Menejerimiz tez orada bog'lanadi.";
    status.classList.remove("is-error");
    form.reset();
  });
}

function initSliderButtons() {
  document.getElementById("testimonial-prev").addEventListener("click", () => updateTestimonials(-1));
  document.getElementById("testimonial-next").addEventListener("click", () => updateTestimonials(1));
  setInterval(() => updateTestimonials(1), 5000);
}

function init() {
  setBrandColors();
  renderBenefits();
  renderCategories();
  renderProducts();
  renderFeatured();
  renderShowrooms();
  renderTestimonials();
  applyTranslations(state.lang);
  initReveal();
  initHeader();
  initLanguageSwitch();
  initForm();
  initSliderButtons();
  startCountdown();
}

document.addEventListener("DOMContentLoaded", init);
