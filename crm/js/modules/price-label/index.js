let priceLabelEventsBound = false;
const priceLabelUi = {
  search: "",
  storeId: "",
};

function ensurePriceLabelState() {
  state.db.priceLabels = state.db.priceLabels && typeof state.db.priceLabels === "object" ? state.db.priceLabels : {};
  state.db.priceLabels.entries = state.db.priceLabels.entries && typeof state.db.priceLabels.entries === "object"
    ? state.db.priceLabels.entries
    : {};
  return state.db.priceLabels;
}

function getPriceLabelRows() {
  const labels = ensurePriceLabelState();
  const rows = Array.isArray(state.db.warehouseStock) ? state.db.warehouseStock : [];
  const query = String(priceLabelUi.search || "").trim().toLowerCase();
  return rows.filter((row) => {
    if (priceLabelUi.storeId && String(row.storeId || "") !== priceLabelUi.storeId) return false;
    if (!query) return true;
    const hay = [row.model, row.info, getStore(row.storeId)?.name].map((x) => String(x || "").toLowerCase()).join(" ");
    return hay.includes(query);
  }).map((row) => {
    const saved = labels.entries[String(row.id || "")] || {};
    return {
      id: String(row.id || ""),
      model: String(saved.title || row.model || ""),
      info: String(saved.subtitle || row.info || ""),
      price: String(saved.price || ""),
      currency: String(saved.currency || "UZS"),
      selected: Boolean(saved.selected),
      storeName: getStore(row.storeId)?.name || "-",
    };
  });
}

function renderPriceLabelPage() {
  if (!refs.priceLabelPage || refs.priceLabelPage.classList.contains("hidden")) return;
  ensurePriceLabelState();
  bindPriceLabelEvents();

  const storeFilter = document.getElementById("priceLabelStoreFilter");
  const searchInput = document.getElementById("priceLabelSearchInput");
  const listEl = document.getElementById("priceLabelList");
  const countEl = document.getElementById("priceLabelCount");
  if (!storeFilter || !searchInput || !listEl || !countEl) return;

  const stores = Array.isArray(state.db.stores) ? state.db.stores : [];
  storeFilter.innerHTML = [option("", t("allStores")), ...stores.map((s) => option(s.id, s.name))].join("");
  storeFilter.value = priceLabelUi.storeId;
  searchInput.value = priceLabelUi.search;

  const rows = getPriceLabelRows();
  countEl.textContent = `${rows.length} ta yorliq`;
  if (!rows.length) {
    listEl.innerHTML = `<p class="muted">${escapeHtml(t("noWarehouseData"))}</p>`;
    return;
  }

  listEl.innerHTML = rows.map((row) => {
    const checked = row.selected ? "checked" : "";
    const priceValue = escapeHtml(String(row.price || ""));
    return `<article class="framed" data-price-label-id="${escapeHtml(row.id)}"><div class="grid-2"><label class="field"><span>${escapeHtml(t("furnitureModel"))}</span><input data-price-label-title type="text" value="${escapeHtml(row.model)}" /></label><label class="field"><span>${escapeHtml(t("price"))}</span><div class="price-row"><input data-price-label-price type="text" inputmode="numeric" value="${priceValue}" /><select data-price-label-currency>${option("UZS", "SO'M")}${option("USD", "$")}</select></div></label><label class="field"><span>${escapeHtml(t("furnitureInfo"))}</span><input data-price-label-subtitle type="text" value="${escapeHtml(row.info)}" /></label><label class="field"><span>${escapeHtml(t("store"))}</span><input type="text" value="${escapeHtml(row.storeName)}" disabled /></label></div><label class="remember-row" style="margin-top:8px;"><input data-price-label-selected type="checkbox" ${checked} /><span>Printga qo'shish</span></label></article>`;
  }).join("");

  listEl.querySelectorAll("article[data-price-label-id]").forEach((card) => {
    const id = String(card.dataset.priceLabelId || "");
    const currency = card.querySelector("select[data-price-label-currency]");
    if (currency) {
      const savedCurrency = String(ensurePriceLabelState().entries[id]?.currency || rows.find((r) => r.id === id)?.currency || "UZS");
      currency.value = savedCurrency === "USD" ? "USD" : "UZS";
    }
  });
}

function collectPriceLabelDrafts() {
  const listEl = document.getElementById("priceLabelList");
  if (!listEl) return [];
  const drafts = [];
  listEl.querySelectorAll("article[data-price-label-id]").forEach((card) => {
    const id = String(card.dataset.priceLabelId || "");
    if (!id) return;
    drafts.push({
      id,
      title: String(card.querySelector("input[data-price-label-title]")?.value || "").trim(),
      subtitle: String(card.querySelector("input[data-price-label-subtitle]")?.value || "").trim(),
      price: String(card.querySelector("input[data-price-label-price]")?.value || "").trim(),
      currency: String(card.querySelector("select[data-price-label-currency]")?.value || "UZS"),
      selected: Boolean(card.querySelector("input[data-price-label-selected]")?.checked),
    });
  });
  return drafts;
}

function savePriceLabelDrafts(showSavedToast = true) {
  const labels = ensurePriceLabelState();
  const drafts = collectPriceLabelDrafts();
  drafts.forEach((row) => {
    labels.entries[row.id] = {
      title: row.title,
      subtitle: row.subtitle,
      price: row.price,
      currency: row.currency,
      selected: row.selected,
      updatedAt: new Date().toISOString(),
    };
  });
  saveDB();
  if (showSavedToast) showToast(t("saved"));
}

function printPriceLabels() {
  savePriceLabelDrafts(false);
  const labels = ensurePriceLabelState();
  const rows = getPriceLabelRows().filter((row) => labels.entries[row.id]?.selected);
  if (!rows.length) {
    showToast("Hech bo'lmaganda bitta yorliqni tanlang", "error");
    return;
  }
  const cards = rows.map((row) => {
    const value = labels.entries[row.id] || row;
    const price = String(value.price || "").trim();
    const currency = String(value.currency || "UZS") === "USD" ? "$" : "SO'M";
    return `<article style="border:1px solid #111;padding:10px;border-radius:8px;min-height:110px;display:grid;gap:6px"><h3 style="margin:0;font-size:16px">${escapeHtml(value.title || row.model || "-")}</h3><p style="margin:0;color:#555">${escapeHtml(value.subtitle || row.info || "")}</p><p style="margin:0;font-size:20px;font-weight:700">${escapeHtml(price ? `${price} ${currency}` : "-")}</p></article>`;
  }).join("");

  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Price labels</title></head><body style="font-family:Montserrat,sans-serif;padding:12px"><section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">${cards}</section><script>window.onload=function(){window.print();}</script></body></html>`;
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function bindPriceLabelEvents() {
  if (priceLabelEventsBound) return;
  priceLabelEventsBound = true;

  const storeFilter = document.getElementById("priceLabelStoreFilter");
  const searchInput = document.getElementById("priceLabelSearchInput");
  const saveBtn = document.getElementById("priceLabelSaveBtn");
  const printBtn = document.getElementById("priceLabelPrintBtn");

  if (storeFilter) {
    storeFilter.addEventListener("change", (e) => {
      priceLabelUi.storeId = String(e.target.value || "");
      renderPriceLabelPage();
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      priceLabelUi.search = String(e.target.value || "");
      renderPriceLabelPage();
    });
  }
  if (saveBtn) saveBtn.addEventListener("click", () => savePriceLabelDrafts(true));
  if (printBtn) printBtn.addEventListener("click", printPriceLabels);
}

