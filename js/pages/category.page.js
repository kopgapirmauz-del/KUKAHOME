// /public/js/pages/category.page.js
// Category sahifa: filter + search (?q=) + pagination + skeleton

import { $, $$, getQuery, debounce } from "../core/dom.js";
import { applySkeleton, clearSkeleton } from "../core/ui.js";
import { renderProductGrid } from "../components/productCard.js";
import { CONFIG } from "../core/config.js";

/**
 * Demo data: keyin Apps Script GET products bilan almashtiramiz.
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

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function matchSearch(p, q) {
  if (!q) return true;
  const hay = [
    p.model,
    p.category,
    p.desc,
    p.spec,
  ].map(norm).join(" ");
  return hay.includes(norm(q));
}

function matchCategory(p, cat) {
  if (!cat || cat === "all") return true;
  return norm(p.category) === norm(cat);
}

function setUrlParams({ category, q, page }) {
  const url = new URL(window.location.href);

  if (category) url.searchParams.set("category", category);
  else url.searchParams.delete("category");

  if (q) url.searchParams.set("q", q);
  else url.searchParams.delete("q");

  if (page && page > 1) url.searchParams.set("page", String(page));
  else url.searchParams.delete("page");

  window.history.replaceState({}, "", url.toString());
}

function renderPagination(container, { page, totalPages, onPage }) {
  if (!container) return;
  container.innerHTML = "";
  if (totalPages <= 1) return;

  const mkBtn = (label, p, disabled = false, active = false) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `kh-pagebtn ${active ? "is-active" : ""}`;
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener("click", () => onPage(p));
    return b;
  };

  container.appendChild(mkBtn("‹", page - 1, page <= 1));

  // 1 ... current-1 current current+1 ... last (oddiy va chiroyli)
  const show = [];
  show.push(1);
  if (page - 1 > 2) show.push("...");
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    show.push(p);
  }
  if (page + 1 < totalPages - 1) show.push("...");
  if (totalPages > 1) show.push(totalPages);

  show.forEach((x) => {
    if (x === "...") {
      const s = document.createElement("span");
      s.className = "kh-pagegap";
      s.textContent = "…";
      container.appendChild(s);
    } else {
      container.appendChild(mkBtn(String(x), x, false, x === page));
    }
  });

  container.appendChild(mkBtn("›", page + 1, page >= totalPages));
}

export function initCategoryPage() {
  const grid = $("#category-grid");
  const pager = $("#category-pagination");
  const title = $("#category-title");
  const searchInput = $("#category-search");
  const catSelect = $("#category-select");

  if (!grid) return;

  // URL params
  let category = getQuery("category") || "all";
  let q = getQuery("q") || "";
  let page = Number(getQuery("page") || "1");
  if (!Number.isFinite(page) || page < 1) page = 1;

  // UI set
  if (searchInput) searchInput.value = q;
  if (catSelect) catSelect.value = category;

  const perPage = CONFIG.pagination.productsPerPage || 12;

  const run = async () => {
    applySkeleton(grid, perPage, "card");

    const products = await loadProducts();

    // filter + search
    const filtered = products
      .filter((p) => matchCategory(p, category))
      .filter((p) => matchSearch(p, q));

    // title
    if (title) {
      const prettyCat = category === "all" ? "Barcha mahsulotlar" : category;
      title.textContent = q ? `${prettyCat} — “${q}”` : prettyCat;
    }

    // pagination
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    page = Math.min(page, totalPages);

    const start = (page - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    clearSkeleton(grid);

    if (!pageItems.length) {
      grid.innerHTML = `
        <div class="kh-empty">
          <div class="kh-empty__title">Hech narsa topilmadi</div>
          <div class="kh-empty__sub">Filter yoki qidiruvni o‘zgartirib ko‘ring.</div>
        </div>
      `;
    } else {
      renderProductGrid(grid, pageItems);
    }

    renderPagination(pager, {
      page,
      totalPages,
      onPage: (p) => {
        page = p;
        setUrlParams({ category, q, page });
        run();
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    });

    // URL update
    setUrlParams({ category, q, page });
  };

  // Search
  if (searchInput) {
    const onSearch = debounce(() => {
      q = String(searchInput.value || "").trim();
      page = 1;
      run();
    }, 250);
    searchInput.addEventListener("input", onSearch);
  }

  // Category select
  if (catSelect) {
    catSelect.addEventListener("change", () => {
      category = catSelect.value || "all";
      page = 1;
      run();
    });
  }

  // start
  run();
}