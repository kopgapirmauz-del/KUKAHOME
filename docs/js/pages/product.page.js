// /public/js/pages/product.page.js
// Product detail: 3-image slider + add-to-cart (toast + fly-to-cart) + available disable + related products

import { $, getQuery, el } from "../core/dom.js";
import { applySkeleton, clearSkeleton, toast, flyToCart } from "../core/ui.js";
import { CartStore } from "../core/store.js";
import { Slider } from "../components/slider.js";
import { renderProductGrid } from "../components/productCard.js";
import { formatNumber } from "../core/dom.js";

/**
 * Demo data (keyin Apps Script GET action=products ga almashtiramiz)
 */
async function loadProducts() {
  try {
    const res = await fetch("/data/mocks/products.sample.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Products mock topilmadi");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.products || []);
  } catch {
    return [];
  }
}

function yesNo(val) {
  return String(val || "").trim().toLowerCase() === "yes";
}

function safeImg(url) {
  const u = String(url || "").trim();
  return u || "/assets/images/placeholders/product.png";
}

function pickId(product) {
  return String(product?.id ?? product?.model ?? "");
}

function buildImageSlider(images, model) {
  // Slider markup (slide left/right)
  const sliderRoot = el(
    "div",
    { class: "kh-slider pd-slider", "data-slider": "1" },
    el(
      "div",
      { class: "kh-slider__track", "data-slider-track": "1" },
      images.map((src) =>
        el(
          "div",
          { class: "kh-slide pd-slide" },
          el("img", {
            class: "pd-img",
            src,
            alt: model || "Product",
            loading: "eager",
            decoding: "async",
          })
        )
      )
    ),
    el(
      "button",
      {
        class: "kh-slider__btn kh-slider__btn--prev",
        type: "button",
        "data-slider-prev": "1",
        "aria-label": "Previous image",
      },
      "‹"
    ),
    el(
      "button",
      {
        class: "kh-slider__btn kh-slider__btn--next",
        type: "button",
        "data-slider-next": "1",
        "aria-label": "Next image",
      },
      "›"
    ),
    el("div", { class: "kh-slider__dots", "data-slider-dots": "1" })
  );

  // init Slider
  new Slider(sliderRoot, { loop: true, duration: 380, threshold: 26, dots: true });

  return sliderRoot;
}

function buildDetail(product) {
  const id = pickId(product);
  const model = String(product?.model || "");
  const category = String(product?.category || "");
  const desc = String(product?.desc || "");
  const spec = String(product?.spec || "");
  const available = yesNo(product?.available);

  const priceOld = Number(product?.price_old || 0);
  const priceNew = Number(product?.price_new || 0);

  const images = [
    safeImg(product?.image1),
    safeImg(product?.image2),
    safeImg(product?.image3),
  ];

  const badge = el(
    "div",
    { class: `p-badge ${available ? "p-badge--ok" : "p-badge--no"}` },
    available ? "Available" : "Not available"
  );

  const slider = buildImageSlider(images, model);

  // Add to cart button
  const addBtn = el(
    "button",
    {
      class: "kh-btn kh-btn--primary pd-add",
      type: "button",
      disabled: !available,
      "aria-label": "Add to cart",
      "data-add-to-cart": "1",
    },
    available ? "Savatga qo‘shish" : "Hozir mavjud emas"
  );

  // Qty
  const qtyInput = el("input", {
    class: "pd-qty",
    type: "number",
    min: "1",
    max: "99",
    value: "1",
    inputmode: "numeric",
    "aria-label": "Quantity",
  });

  const priceBox = el(
    "div",
    { class: "pd-price" },
    priceOld
      ? el("div", { class: "pd-price__old" }, `${formatNumber(priceOld)} ${"so'm"}`)
      : null,
    priceNew
      ? el("div", { class: "pd-price__new" }, `${formatNumber(priceNew)} ${"so'm"}`)
      : el("div", { class: "pd-price__new" }, "Narx: so‘rov bo‘yicha")
  );

  const actions = el(
    "div",
    { class: "pd-actions" },
    el(
      "div",
      { class: "pd-qtywrap" },
      el("div", { class: "pd-qtylabel" }, "Soni"),
      qtyInput
    ),
    addBtn
  );

  const info = el(
    "div",
    { class: "pd-info" },
    el("h1", { class: "pd-title" }, model || "—"),
    el("div", { class: "pd-meta" }, category ? `Kategoriya: ${category}` : ""),
    badge,
    priceBox,
    actions,
    desc ? el("div", { class: "pd-section" }, el("h3", { class: "pd-h" }, "Tavsif"), el("p", { class: "pd-p" }, desc)) : null,
    spec ? el("div", { class: "pd-section" }, el("h3", { class: "pd-h" }, "Xususiyatlar"), el("p", { class: "pd-p" }, spec)) : null
  );

  const wrap = el(
    "div",
    { class: "pd-layout", "data-product-id": id },
    el("div", { class: "pd-media" }, slider),
    info
  );

  // Add to cart logic
  addBtn.addEventListener("click", () => {
    if (!available) return;

    const qty = Math.max(1, Math.min(99, Number(qtyInput.value || 1)));
    const cartIcon = $("[data-cart-icon]"); // headerdagi cart icon
    const imgEl = wrap.querySelector(".pd-img");

    CartStore.add(
      {
        id,
        model,
        price: priceNew || priceOld || 0,
        image: images[0],
      },
      qty
    );

    toast("Savatga qo‘shildi ✅", { type: "success" });

    // fly animation
    if (imgEl && cartIcon) flyToCart(imgEl, cartIcon);
  });

  return wrap;
}

function renderNotFound(root) {
  root.innerHTML = `
    <div class="kh-empty">
      <div class="kh-empty__title">Mahsulot topilmadi</div>
      <div class="kh-empty__sub">Link noto‘g‘ri yoki mahsulot o‘chirib yuborilgan bo‘lishi mumkin.</div>
      <a class="kh-btn kh-btn--ghost" href="/category.html">Katalogga qaytish</a>
    </div>
  `;
}

function renderRelated(allProducts, currentProduct) {
  const grid = $("#related-grid");
  if (!grid) return;

  const cat = String(currentProduct?.category || "").trim().toLowerCase();
  const curId = pickId(currentProduct);

  // O'xshashlar: shu categorydan, lekin o'zi emas
  const related = allProducts
    .filter((p) => String(p?.category || "").trim().toLowerCase() === cat)
    .filter((p) => pickId(p) !== curId)
    .slice(0, 8);

  if (!related.length) {
    grid.innerHTML = `
      <div class="kh-empty">
        <div class="kh-empty__sub">O‘xshash mahsulotlar topilmadi.</div>
      </div>
    `;
    return;
  }

  renderProductGrid(grid, related);
}

export async function initProductPage() {
  const root = $("#product-root");
  if (!root) return;

  const id = getQuery("id");
  if (!id) {
    renderNotFound(root);
    return;
  }

  // skeleton (detail uchun)
  applySkeleton(root, 1, "product");

  const products = await loadProducts();
  clearSkeleton(root);

  const product = products.find((p) => pickId(p) === String(id));
  if (!product) {
    renderNotFound(root);
    return;
  }

  // Render detail
  root.innerHTML = "";
  root.appendChild(buildDetail(product));

  // Related
  renderRelated(products, product);

  // SEO title (oddiy)
  const model = String(product?.model || "KUKA HOME");
  document.title = `${model} — KUKA HOME`;
}