// /public/js/components/slider.js
// Premium slider: slide left/right (fade emas), touch/drag bilan.
// Markup:
// <div class="kh-slider" data-slider>
//   <div class="kh-slider__track" data-slider-track>
//     <div class="kh-slide">...</div>
//     ...
//   </div>
//   <button data-slider-prev>‹</button>
//   <button data-slider-next>›</button>
//   <div data-slider-dots></div>
// </div>

import { $, $$, el, throttle } from "../core/dom.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function getX(e) {
  if (e.touches && e.touches[0]) return e.touches[0].clientX;
  if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
  return e.clientX;
}

export class Slider {
  constructor(root, opts = {}) {
    this.root = root;
    this.track = $("[data-slider-track]", root);
    this.slides = this.track ? $$(".kh-slide", this.track) : [];
    this.btnPrev = $("[data-slider-prev]", root);
    this.btnNext = $("[data-slider-next]", root);
    this.dotsRoot = $("[data-slider-dots]", root);

    this.index = 0;
    this.width = 0;

    this.opts = {
      loop: false,
      duration: 360,
      threshold: 30, // swipe uchun px
      dots: true,
      ...opts,
    };

    this._drag = {
      active: false,
      startX: 0,
      deltaX: 0,
      startIndex: 0,
      moved: false,
    };

    this._anim = null;

    this.init();
  }

  init() {
    if (!this.root || !this.track || this.slides.length === 0) return;

    this.root.classList.add("kh-slider--ready");
    this.measure();

    // dots
    if (this.opts.dots && this.dotsRoot) {
      this.renderDots();
    }

    // buttons
    if (this.btnPrev) this.btnPrev.addEventListener("click", () => this.prev());
    if (this.btnNext) this.btnNext.addEventListener("click", () => this.next());

    // resize
    window.addEventListener("resize", throttle(() => {
      this.measure();
      this.goTo(this.index, { instant: true });
    }, 150));

    // drag/swipe
    this.bindDrag();

    // initial
    this.goTo(0, { instant: true });
  }

  measure() {
    this.width = this.root.getBoundingClientRect().width || 1;
    // track widthni slides countga moslaymiz
    this.track.style.width = `${this.slides.length * 100}%`;
    this.slides.forEach((s) => (s.style.width = `${100 / this.slides.length}%`));
  }

  renderDots() {
    this.dotsRoot.innerHTML = "";
    this.dots = this.slides.map((_, i) => {
      const b = el("button", {
        class: "kh-slider__dot",
        type: "button",
        "aria-label": `Slide ${i + 1}`,
        onclick: () => this.goTo(i),
      });
      this.dotsRoot.appendChild(b);
      return b;
    });
  }

  setDots() {
    if (!this.dots) return;
    this.dots.forEach((d, i) => d.classList.toggle("is-active", i === this.index));
  }

  setButtons() {
    if (this.opts.loop) return;
    if (this.btnPrev) this.btnPrev.disabled = this.index === 0;
    if (this.btnNext) this.btnNext.disabled = this.index === this.slides.length - 1;
  }

  translate(px) {
    // px - track translateX
    this.track.style.transform = `translate3d(${px}px, 0, 0)`;
  }

  currentPx() {
    return -this.index * this.width;
  }

  stopAnim() {
    if (this._anim) cancelAnimationFrame(this._anim);
    this._anim = null;
  }

  animateTo(targetPx, duration = this.opts.duration) {
    this.stopAnim();
    const startPx = this._currentTranslatePx();
    const start = performance.now();

    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = easeOutCubic(t);
      const px = startPx + (targetPx - startPx) * eased;
      this.translate(px);
      if (t < 1) this._anim = requestAnimationFrame(tick);
      else this._anim = null;
    };

    this._anim = requestAnimationFrame(tick);
  }

  _currentTranslatePx() {
    // transform: matrix(...) ni o'qib olish (fallback)
    const st = getComputedStyle(this.track).transform;
    if (!st || st === "none") return this.currentPx();
    // matrix(a,b,c,d,tx,ty)
    const m = st.match(/matrix\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(",").map((x) => Number(x.trim()));
      return parts[4] || 0;
    }
    const m3 = st.match(/matrix3d\(([^)]+)\)/);
    if (m3) {
      const parts = m3[1].split(",").map((x) => Number(x.trim()));
      return parts[12] || 0;
    }
    return this.currentPx();
  }

  goTo(i, { instant = false } = {}) {
    const last = this.slides.length - 1;

    if (this.opts.loop) {
      if (i < 0) i = last;
      if (i > last) i = 0;
    } else {
      i = clamp(i, 0, last);
    }

    this.index = i;

    this.root.setAttribute("data-slider-index", String(i));
    this.setDots();
    this.setButtons();

    const targetPx = -i * this.width;

    if (instant) {
      this.stopAnim();
      this.translate(targetPx);
    } else {
      this.animateTo(targetPx);
    }
  }

  next() {
    this.goTo(this.index + 1);
  }

  prev() {
    this.goTo(this.index - 1);
  }

  bindDrag() {
    const start = (e) => {
      // faqat left click
      if (e.type === "mousedown" && e.button !== 0) return;

      this._drag.active = true;
      this._drag.moved = false;
      this._drag.startX = getX(e);
      this._drag.deltaX = 0;
      this._drag.startIndex = this.index;

      this.stopAnim();
      this.track.classList.add("is-dragging");

      // scroll lock (touch)
      if (e.cancelable) e.preventDefault();
    };

    const move = (e) => {
      if (!this._drag.active) return;

      const x = getX(e);
      const dx = x - this._drag.startX;
      this._drag.deltaX = dx;
      if (Math.abs(dx) > 2) this._drag.moved = true;

      // “rezina” effect (chetda sekinroq)
      const base = -this._drag.startIndex * this.width;
      let px = base + dx;

      if (!this.opts.loop) {
        const minPx = - (this.slides.length - 1) * this.width;
        const maxPx = 0;

        if (px > maxPx) px = maxPx + (px - maxPx) * 0.25;
        if (px < minPx) px = minPx + (px - minPx) * 0.25;
      }

      this.translate(px);

      if (e.cancelable) e.preventDefault();
    };

    const end = () => {
      if (!this._drag.active) return;
      this._drag.active = false;
      this.track.classList.remove("is-dragging");

      const dx = this._drag.deltaX;
      const abs = Math.abs(dx);

      // threshold dan oshsa slide almashadi
      if (abs > this.opts.threshold) {
        if (dx < 0) this.goTo(this._drag.startIndex + 1); // chapga tortsa next
        else this.goTo(this._drag.startIndex - 1);        // o'ngga tortsa prev
      } else {
        // joyiga qaytarish
        this.goTo(this._drag.startIndex);
      }
    };

    // Touch
    this.root.addEventListener("touchstart", start, { passive: false });
    this.root.addEventListener("touchmove", move, { passive: false });
    this.root.addEventListener("touchend", end, { passive: true });

    // Mouse
    this.root.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);

    // Agar slide ichida link bo'lsa, drag bo'lganda click ketmasin
    this.root.addEventListener("click", (e) => {
      if (this._drag.moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }
}

/**
 * Helper: sahifada [data-slider] bo'lgan hamma sliderlarni ishga tushiradi.
 */
export function initSliders(selector = "[data-slider]") {
  return $$(selector).map((node) => new Slider(node));
}