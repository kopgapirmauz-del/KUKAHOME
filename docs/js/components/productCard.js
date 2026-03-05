// /public/js/components/productCard.js
// Premium product card: faqat model + 3-rasm slider + available badge + click -> product.html?id=...

import { el } from "../core/dom.js";
import { Slider } from "./slider.js";

function yesNo(val) {
  return String(val || "").trim().toLowerCase() === "yes";
}

function safeImg(url) {
  const u = String(url || "").trim();
  return u || "/assets/images/placeholders/product.png";
}

/**
 * product object (Sheets'dan keladi):
 * {
 *  id, model, category, image1, image2, image3,
 *  price_old, price_new, available
 * }
 */
export function renderProductCard(product) {
  const id = String(product?.id ?? product?.model ?? "");
  const model = String(product?.model ?? "");
  const available = yesNo(product?.available);

  const images = [
    safeImg(product?.image1),
    safeImg(product?.image2),
    safeImg(product?.image3),
  ].filter(Boolean);

  const href = `/product.html?id=${encodeURIComponent(id)}`;

  // Card root
  const card = el(
    "article",
    {
      class: `p-card ${available ? "" : "is-disabled"}`,
      "data-product-id": id,
    },

    // Clickable area (butun card link)
    el(
      "a",
      {
        class: "p-card__link",
        href: available ? href : "#",
        "aria-label": model || "Product",
        onclick: (e) => {
          if (!available) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
      },

      // Media/Slider
      el(
        "div",
        { class: "p-card__media" },

        // badge
        el(
          "div",
          { class: `p-badge ${available ? "p-badge--ok" : "p-badge--no"}` },
          available ? "Available" : "Not available"
        ),

        // slider markup
        el(
          "div",
          { class: "kh-slider p-card__slider", "data-slider": "1" },
          el(
            "div",
            { class: "kh-slider__track", "data-slider-track": "1" },
            images.map((src) =>
              el(
                "div",
                { class: "kh-slide p-card__slide" },
                el("img", {
                  class: "p-card__img",
                  src,
                  alt: model,
                  loading: "lazy",
                  decoding: "async",
                })
              )
            )
          ),

          // controls (minimal)
          el(
            "button",
            {
              class: "kh-slider__btn kh-slider__btn--prev",
              type: "button",
              "data-slider-prev": "1",
              "aria-label": "Previous image",
              tabindex: "-1",
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
              tabindex: "-1",
            },
            "›"
          ),
          el("div", { class: "kh-slider__dots", "data-slider-dots": "1" })
        )
      ),

      // Title (faqat model nomi)
      el(
        "div",
        { class: "p-card__meta" },
        el("div", { class: "p-card__model" }, model || "—")
      )
    )
  );

  // Slider init (har bir card uchun)
  // loop: true qilamiz, 3 rasm aylanib turadi
  const sliderRoot = card.querySelector("[data-slider]");
  if (sliderRoot) {
    // kichik slider: tezroq
    new Slider(sliderRoot, { loop: true, duration: 320, threshold: 24, dots: true });
  }

  return card;
}

/**
 * Containerga cardlarni joylash
 */
export function renderProductGrid(container, products = []) {
  if (!container) return;
  container.innerHTML = "";

  const frag = document.createDocumentFragment();
  products.forEach((p) => frag.appendChild(renderProductCard(p)));

  container.appendChild(frag);
}