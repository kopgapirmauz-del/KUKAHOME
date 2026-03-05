// /public/js/pages/index.page.js
// Home sahifa: featured product grid + skeleton loading + count-up stats

import { $, $$ } from "../core/dom.js";
import { applySkeleton, clearSkeleton, countUp, toast } from "../core/ui.js";
import { renderProductGrid } from "../components/productCard.js";

/**
 * Hozircha demo data o'qiymiz:
 * /public/data/mocks/products.sample.json
 * Keyin: Apps Script GET action=products ga almashtiramiz.
 */
async function loadProducts() {
  try {
    const res = await fetch("/data/mocks/products.sample.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Products mock topilmadi");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.products || []);
  } catch (e) {
    return [];
  }
}

/**
 * Featured block: 8–12 ta product ko'rsatamiz
 */
async function renderFeatured() {
  const grid = $("#home-featured-grid");
  if (!grid) return;

  applySkeleton(grid, 8, "card");

  const products = await loadProducts();

  clearSkeleton(grid);

  if (!products.length) {
    grid.innerHTML = `
      <div class="kh-empty">
        <div class="kh-empty__title">Hozircha mahsulotlar yuklanmadi</div>
        <div class="kh-empty__sub">Keyinroq qayta urinib ko‘ring.</div>
      </div>
    `;
    return;
  }

  // Featured: birinchi 12 ta (yoki mavjud bo'lsa shuncha)
  const featured = products.slice(0, 12);

  // renderProductGrid -> productCard -> ichida slider init bo'ladi
  renderProductGrid(grid, featured);
}

/**
 * Stats count-up:
 * HTML'da misol:
 * <span data-countup-to="125">0</span>
 */
function initStats() {
  const nodes = $$("[data-countup-to]");
  if (!nodes.length) return;

  nodes.forEach((n) => {
    const to = Number(n.getAttribute("data-countup-to") || "0");
    countUp(n, to, { duration: 900 });
  });
}

/**
 * Home init
 * Siz index.html ichida shular bo'lishini tavsiya qilaman:
 * - <section ... data-reveal> ...
 * - <div id="home-featured-grid"></div>
 */
export function initIndexPage() {
  // Raqamlar animatsiya
  initStats();

  // Featured productlar
  renderFeatured().catch(() => {
    toast("Mahsulotlarni yuklashda xatolik", { type: "error" });
  });
}