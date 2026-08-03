const PRICE_LABEL_FURNITURE_TYPES = [
  "Divan", "Kreslo", "Stol", "Stul", "Shkaf", "Karavot", "Komod", "Tumbochka", "Oshxona to'plami", "Boshqa",
];

const priceLabelUi = { search: "", storeId: "", furnitureType: "", createdBy: "" };
let priceLabelEditId = "";
let priceLabelMode = "with";
let priceLabelEventsBound = false;
let priceLabelRows = [];

async function loadPriceLabelsFromApi() {
  try {
    const res = await apiFetch("/api/price-labels", { cache: "no-store" });
    const data = await res.json();
    if (data?.success) priceLabelRows = Array.isArray(data.items) ? data.items : [];
  } catch {
    // keep previous rows on transient network errors
  }
}

function getFilteredPriceLabelRows() {
  const query = String(priceLabelUi.search || "").trim().toLowerCase();
  return priceLabelRows.filter((row) => {
    if (priceLabelUi.storeId && row.storeId !== priceLabelUi.storeId) return false;
    if (priceLabelUi.furnitureType && row.furnitureType !== priceLabelUi.furnitureType) return false;
    if (priceLabelUi.createdBy && row.createdBy !== priceLabelUi.createdBy) return false;
    if (!query) return true;
    const hay = [row.model, row.info, row.furnitureType, getStore(row.storeId)?.name]
      .map((x) => String(x || "").toLowerCase()).join(" ");
    return hay.includes(query);
  });
}

async function renderPriceLabelPage() {
  if (!refs.priceLabelPage || refs.priceLabelPage.classList.contains("hidden")) return;
  bindPriceLabelEvents();
  await loadPriceLabelsFromApi();
  renderPriceLabelPageInner();
}

function renderPriceLabelPageInner() {
  if (!refs.priceLabelPage || refs.priceLabelPage.classList.contains("hidden")) return;

  const storeFilter = document.getElementById("priceLabelStoreFilter");
  const typeFilter = document.getElementById("priceLabelTypeFilter");
  const creatorFilter = document.getElementById("priceLabelCreatorFilter");
  const searchInput = document.getElementById("priceLabelSearchInput");
  const tbody = document.getElementById("priceLabelTbody");
  const countEl = document.getElementById("priceLabelCountInfo");
  if (!storeFilter || !typeFilter || !creatorFilter || !searchInput || !tbody || !countEl) return;

  const stores = Array.isArray(state.db.stores) ? state.db.stores : [];
  storeFilter.innerHTML = [option("", t("allStores")), ...stores.map((s) => option(s.id, s.name))].join("");
  storeFilter.value = priceLabelUi.storeId;

  typeFilter.innerHTML = [option("", "Barcha turlar"), ...PRICE_LABEL_FURNITURE_TYPES.map((x) => option(x, x))].join("");
  typeFilter.value = priceLabelUi.furnitureType;

  const creators = (Array.isArray(state.db.users) ? state.db.users : [])
    .slice()
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  creatorFilter.innerHTML = [option("", "Barcha xodimlar"), ...creators.map((u) => option(u.id, fullName(u) || u.login))].join("");
  creatorFilter.value = priceLabelUi.createdBy;

  if (typeof enhanceSelectAsCustom === "function") {
    enhanceSelectAsCustom(storeFilter);
    enhanceSelectAsCustom(typeFilter);
    enhanceSelectAsCustom(creatorFilter);
  }
  searchInput.value = priceLabelUi.search;

  const rows = getFilteredPriceLabelRows();
  countEl.textContent = `Jami: ${rows.length}`;

  tbody.innerHTML = rows.length
    ? rows.map((row, idx) => {
      const store = getStore(row.storeId);
      const creator = getUser(row.createdBy);
      const priceText = row.discountMode === "with"
        ? `<span class="price-label-price-cell"><span class="price-label-old-price">${escapeHtml(numberFmt(Number(row.costPrice) || 0))}</span> <strong>${escapeHtml(numberFmt(Number(row.discountPrice) || 0))}</strong> so'm</span>`
        : `<span class="price-label-price-cell"><strong>${escapeHtml(numberFmt(Number(row.costPrice) || 0))}</strong> so'm</span>`;
      return `<tr>
        <td data-label="№">${idx + 1}</td>
        <td data-label="Sana">${escapeHtml(fmtDate(row.createdAt))}</td>
        <td data-label="Rasm">${row.imageUrl ? `<img class="incoming-thumb" src="${escapeHtml(row.imageUrl)}" alt="" />` : "-"}</td>
        <td data-label="Do'kon">${escapeHtml(store?.name || "-")}</td>
        <td data-label="Kim yaratgan">${escapeHtml(creator ? fullName(creator) : "-")}</td>
        <td data-label="Model">${escapeHtml(row.model || "-")}</td>
        <td data-label="Narxi">${priceText}</td>
        <td data-label="${escapeHtml(t("action"))}" class="sales-cell-center">
          <span class="chip-actions">
            <button type="button" class="action-btn" data-price-label-print="${escapeHtml(row.id)}" aria-label="chop etish"><svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3Zm-3 11H8v-5h8v5Zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1ZM17 3H7v4h10V3Z"/></svg></button>
            <button type="button" class="action-btn" data-price-label-edit="${escapeHtml(row.id)}" aria-label="tahrirlash"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button>
            <button type="button" class="action-btn" data-price-label-delete="${escapeHtml(row.id)}" aria-label="o'chirish"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>
          </span>
        </td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="8">${escapeHtml(t("noWarehouseData"))}</td></tr>`;

  tbody.querySelectorAll("[data-price-label-print]").forEach((btn) => {
    btn.addEventListener("click", () => printPriceLabel(btn.dataset.priceLabelPrint));
  });
  tbody.querySelectorAll("[data-price-label-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openPriceLabelModal(btn.dataset.priceLabelEdit));
  });
  tbody.querySelectorAll("[data-price-label-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deletePriceLabel(btn.dataset.priceLabelDelete));
  });
}

function clearPriceLabelFilters() {
  priceLabelUi.search = "";
  priceLabelUi.storeId = "";
  priceLabelUi.furnitureType = "";
  priceLabelUi.createdBy = "";
  renderPriceLabelPageInner();
}

function priceLabelSetMode(mode) {
  priceLabelMode = mode === "without" ? "without" : "with";
  document.querySelectorAll("#priceLabelModal [data-price-label-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.priceLabelMode === priceLabelMode);
  });
  const discountField = document.getElementById("priceLabelDiscountField");
  if (discountField) discountField.classList.toggle("hidden", priceLabelMode !== "with");
  const form = document.getElementById("priceLabelForm");
  const discountInput = form ? form.discountPrice : null;
  if (discountInput) discountInput.required = priceLabelMode === "with";
}

function openPriceLabelModal(id) {
  const modal = document.getElementById("priceLabelModal");
  const form = document.getElementById("priceLabelForm");
  const title = document.getElementById("priceLabelModalTitle");
  if (!modal || !form || !title) return;

  // Both selects are wrapped by the passive global custom-select observer
  // (crm/js/core/custom-select.js) the moment this modal's HTML exists in
  // the DOM, since they don't carry no-custom-select. Calling
  // enhanceSelectAsCustom() here used to wrap them a second time with the
  // separate custom-filter system, producing two overlapping dropdowns for
  // the same field - the global wrapper already rebuilds its option list
  // from scratch on every open, so nothing else is needed.
  form.furnitureType.innerHTML = PRICE_LABEL_FURNITURE_TYPES.map((x) => option(x, x)).join("");
  form.storeId.innerHTML = [option("", "-"), ...(state.db.stores || []).map((s) => option(s.id, s.name))].join("");

  form.reset();
  priceLabelEditId = String(id || "");
  const entry = priceLabelEditId ? priceLabelRows.find((r) => r.id === priceLabelEditId) : null;
  title.textContent = entry ? "Yorliqni tahrirlash" : "Yorliq yaratish";

  if (entry) {
    form.furnitureType.value = entry.furnitureType || "";
    form.model.value = entry.model || "";
    form.info.value = entry.info || "";
    form.size.value = entry.size || "";
    form.storeId.value = entry.storeId || "";
    form.costPrice.value = entry.costPrice || "";
    form.discountPrice.value = entry.discountPrice || "";
    priceLabelSetMode(entry.discountMode === "with" ? "with" : "without");
  } else {
    priceLabelSetMode("with");
  }
  toggleModal(modal, true);
}

async function submitPriceLabelForm(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const furnitureType = String(fd.get("furnitureType") || "").trim();
  const model = String(fd.get("model") || "").trim();
  const info = String(fd.get("info") || "").trim();
  const size = String(fd.get("size") || "").trim();
  const storeId = String(fd.get("storeId") || "").trim();
  const costPrice = String(fd.get("costPrice") || "").trim();
  const discountPrice = String(fd.get("discountPrice") || "").trim();
  if (!furnitureType || !model || !costPrice || (priceLabelMode === "with" && !discountPrice)) {
    showToast(t("fillRequired"));
    return;
  }

  const existing = priceLabelEditId ? priceLabelRows.find((r) => r.id === priceLabelEditId) : null;
  const submitBtn = form.querySelector("button[type=submit]");
  if (submitBtn) submitBtn.disabled = true;

  try {
    const imageFile = form.image.files?.[0] || null;
    let imageUrl = existing?.imageUrl || "";
    if (imageFile) {
      const dataUrl = await readImageAsDataUrl(imageFile);
      if (dataUrl) {
        const uploadedUrl = await saveWarehouseImageToServer(`price_label_${Date.now()}`, dataUrl);
        if (!uploadedUrl) {
          showToast(t("saveFailed"), "error");
          return;
        }
        const previousImageUrl = existing?.imageUrl || "";
        imageUrl = uploadedUrl;
        if (previousImageUrl) deleteWarehouseImageFromServer(previousImageUrl);
      }
    }

    const payload = {
      furnitureType,
      model,
      info,
      size,
      storeId,
      imageUrl,
      discountMode: priceLabelMode,
      costPrice,
      discountPrice: priceLabelMode === "with" ? discountPrice : "",
    };
    if (priceLabelEditId) payload.id = priceLabelEditId;

    const res = await apiFetch("/api/price-labels", {
      method: priceLabelEditId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data?.success) {
      showToast(t("saveFailed"), "error");
      return;
    }
    toggleModal(document.getElementById("priceLabelModal"), false);
    await loadPriceLabelsFromApi();
    renderPriceLabelPageInner();
    showToast(t("saved"));
  } catch {
    showToast(t("saveFailed"), "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function deletePriceLabel(id) {
  if (!(await confirmPermanentDelete())) return;
  const entry = priceLabelRows.find((r) => r.id === id);
  if (!entry) return;
  try {
    const res = await apiFetch("/api/price-labels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!data?.success) {
      showToast(t("saveFailed"), "error");
      return;
    }
    await loadPriceLabelsFromApi();
    renderPriceLabelPageInner();
    showToast("Yorliq o'chirildi");
    if (entry.imageUrl) deleteWarehouseImageFromServer(entry.imageUrl);
  } catch {
    showToast(t("saveFailed"), "error");
  }
}

const KH_ICON_CHAIR = '<path d="M7 13h10v6h-2v-2H9v2H7v-6Zm1-8h8v6H8V5Zm-3 2h1v6H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm14 0a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1V7h1Z"/>';
const KH_ICON_TAG = '<path d="M10 3H5a2 2 0 0 0-2 2v5l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82L10 3Zm-3.5 5A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8Z"/>';
const KH_ICON_DOC = '<path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM7 12h8v1.5H7V12Zm0 3.5h8V17H7v-1.5ZM7 8.5h4V10H7V8.5Z"/>';
const KH_ICON_RULER = '<path d="M3 8h18v8H3V8Zm2 2v4h1v-2h1v2h1v-4H7v2H6v-2H5Zm4 0v4h1v-4H9Zm3 0v4h1v-2h1v2h1v-4h-1v2h-1v-2h-1Zm4 0v4h1v-4h-1Z"/>';
const KH_ICON_STORE = '<path d="M4 4h16l1 5H3l1-5Zm-1 7h2v9H3v-9Zm4 0h2v9H7v-9Zm4 0h2v9h-2v-9Zm4 0h2v9h-2v-9Zm4 0h2v9h-2v-9ZM3 21h18v1H3v-1Z"/>';

function khInfoRow(iconPath, label, value) {
  if (!value) return "";
  return `<div class="kh-row"><span class="kh-row-icon"><svg viewBox="0 0 24 24">${iconPath}</svg></span><span class="kh-row-label">${escapeHtml(label)}</span><span class="kh-row-value">${escapeHtml(value)}</span></div>`;
}

function printPriceLabel(id) {
  const row = priceLabelRows.find((r) => r.id === id);
  if (!row) return;
  const store = getStore(row.storeId);
  const cost = Number(row.costPrice) || 0;
  const discount = Number(row.discountPrice) || 0;
  const pct = row.discountMode === "with" && cost > 0 ? Math.max(0, Math.round((1 - discount / cost) * 100)) : 0;

  const discountBadgeHtml = row.discountMode === "with" && pct > 0
    ? `<div class="kh-discount-badge"><b>-${pct}%</b><span>chegirma</span></div>`
    : "";

  const priceHtml = row.discountMode === "with"
    ? `<p class="kh-old-price-label">Eski narx:</p><p class="kh-old-price">${escapeHtml(numberFmt(cost))} so'm</p><p class="kh-new-price-label">Yangi narx:</p><p class="kh-new-price">${escapeHtml(numberFmt(discount))} so'm</p>`
    : `<p class="kh-new-price-label">Narx:</p><p class="kh-new-price">${escapeHtml(numberFmt(cost))} so'm</p>`;

  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Narx yorlig'i</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Montserrat, Arial, sans-serif; margin: 0; padding: 20px; background: #fff; display: flex; justify-content: center; }
      .kh-label { width: 360px; border-radius: 22px; border: 1px solid #e7d9c9; background: #fdf8f2; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
      .kh-photo-wrap { position: relative; }
      .kh-photo { width: 100%; height: 220px; object-fit: cover; display: block; }
      .kh-photo-placeholder { width: 100%; height: 220px; background: #f1e6d8; display: flex; align-items: center; justify-content: center; color: #b8a68d; font-size: 13px; }
      .kh-logo { position: absolute; top: 14px; left: 14px; background: #c81e2c; color: #fff; border-radius: 10px; padding: 8px 14px; text-align: center; line-height: 1.1; box-shadow: 0 4px 10px rgba(0,0,0,0.18); }
      .kh-logo b { display: block; font-size: 15px; letter-spacing: 0.5px; }
      .kh-logo span { display: block; font-size: 8px; letter-spacing: 2px; opacity: 0.9; }
      .kh-discount-badge { position: absolute; right: 14px; bottom: -26px; width: 74px; height: 74px; border-radius: 50%; background: #9c1420; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-shadow: 0 6px 14px rgba(0,0,0,0.25); border: 3px solid #fff; }
      .kh-discount-badge b { font-size: 16px; line-height: 1; }
      .kh-discount-badge span { font-size: 8px; font-weight: 600; }
      .kh-body { padding: 36px 18px 16px; }
      .kh-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f0e4d6; }
      .kh-row:last-child { border-bottom: none; }
      .kh-row-icon { width: 26px; height: 26px; border-radius: 50%; background: rgba(200,30,44,0.1); color: #c81e2c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .kh-row-icon svg { width: 14px; height: 14px; fill: currentColor; }
      .kh-row-label { font-size: 12px; color: #7a5c4a; min-width: 88px; flex-shrink: 0; }
      .kh-row-value { font-size: 13px; font-weight: 700; color: #2a2a2a; }
      .kh-price-wrap { padding: 6px 18px 18px; }
      .kh-old-price-label { font-size: 11px; color: #9a9a9a; margin: 0; }
      .kh-old-price { font-size: 15px; color: #9a9a9a; text-decoration: line-through; margin: 2px 0 10px; }
      .kh-new-price-label { font-size: 11px; color: #c81e2c; margin: 0; font-weight: 700; }
      .kh-new-price { font-size: 28px; font-weight: 800; color: #c81e2c; margin: 2px 0 0; }
      .kh-footer { background: #8a1119; color: #fff; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
      @media print { body { padding: 0; } }
    </style>
    </head>
    <body>
      <div class="kh-label">
        <div class="kh-photo-wrap">
          ${row.imageUrl ? `<img class="kh-photo" src="${escapeHtml(row.imageUrl)}" alt="" />` : `<div class="kh-photo-placeholder">Rasm yo'q</div>`}
          <div class="kh-logo"><b>KUKA</b><span>HOME</span></div>
          ${discountBadgeHtml}
        </div>
        <div class="kh-body">
          ${khInfoRow(KH_ICON_CHAIR, "Mebel turi:", row.furnitureType)}
          ${khInfoRow(KH_ICON_TAG, "Model:", row.model)}
          ${khInfoRow(KH_ICON_DOC, "Ma'lumoti:", row.info)}
          ${khInfoRow(KH_ICON_RULER, "O'lchami:", row.size)}
          ${khInfoRow(KH_ICON_STORE, "Do'kon:", store?.name || "")}
        </div>
        <div class="kh-price-wrap">${priceHtml}</div>
        <div class="kh-footer"><span>Rasmiy kafolat &middot; Sifat kafolati</span><span>kukahome.uz</span></div>
      </div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;
  // No noopener/noreferrer: per the HTML spec, either one makes window.open()
  // return null, which silently hit the `if (!win) return;` guard below and
  // made the print button appear completely dead. This popup only ever
  // writes our own trusted markup into a blank same-origin window, so there
  // is no tabnabbing risk from keeping the handle.
  const win = window.open("", "_blank", "width=460,height=780");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

async function exportPriceLabelsExcel() {
  const rows = getFilteredPriceLabelRows();
  const headers = [t("number"), t("date"), t("furnitureImage"), t("store"), "Kim yaratgan", t("furnitureModel"), "Narxi"];
  const body = rows.map((row, idx) => {
    const store = getStore(row.storeId);
    const creator = getUser(row.createdBy);
    const priceText = row.discountMode === "with"
      ? `${numberFmt(Number(row.costPrice) || 0)} -> ${numberFmt(Number(row.discountPrice) || 0)} so'm`
      : `${numberFmt(Number(row.costPrice) || 0)} so'm`;
    return [idx + 1, fmtDate(row.createdAt), row.imageUrl || "", store?.name || "", creator ? fullName(creator) : "", row.model || "", priceText];
  });
  await exportRowsToExcel({
    title: "Narx yorlig'i",
    sheetName: "Narx yorlig'i",
    fileName: `price_labels_${state.lang}.xlsx`,
    headers,
    rows: body,
    imageColumnIndex: 2,
  });
}

async function importPriceLabelsExcel(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const records = await importExcelFile(file);
    for (const r of records) {
      const model = String(excelPick(r, [t("furnitureModel"), "Model", "model"])).trim();
      const furnitureType = String(excelPick(r, ["Mebel turi", "furnitureType", "Turi"])).trim() || PRICE_LABEL_FURNITURE_TYPES[0];
      const costPrice = String(excelPick(r, ["Narxi", "Cost price", "costPrice", "Eski narx"])).replace(/[^\d.]/g, "");
      if (!model || !costPrice) continue;
      const storeName = String(excelPick(r, [t("store"), "Do'kon", "store"])).trim().toLowerCase();
      const store = (state.db.stores || []).find((s) => s.name.toLowerCase() === storeName);
      let imageUrl = "";
      if (r.__image) {
        const dataUrl = excelImageToDataUrl(r.__image);
        imageUrl = await saveWarehouseImageToServer(`price_label_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, dataUrl);
      } else {
        imageUrl = String(excelPick(r, ["Rasm", "Image", "image"])).trim();
      }
      const payload = {
        furnitureType,
        model,
        info: String(excelPick(r, ["Ma'lumoti", "Info", "info"])).trim(),
        size: String(excelPick(r, ["O'lchami", "Size", "size"])).trim(),
        storeId: store?.id || "",
        imageUrl,
        discountMode: "without",
        costPrice,
        discountPrice: "",
      };
      await apiFetch("/api/price-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    await loadPriceLabelsFromApi();
    renderPriceLabelPageInner();
  } catch {
    showToast(t("saveFailed"), "error");
  } finally {
    e.target.value = "";
  }
}

function bindPriceLabelEvents() {
  if (priceLabelEventsBound) return;
  priceLabelEventsBound = true;

  document.getElementById("priceLabelExportBtn")?.addEventListener("click", exportPriceLabelsExcel);
  document.getElementById("priceLabelImportInput")?.addEventListener("change", importPriceLabelsExcel);

  document.getElementById("priceLabelStoreFilter")?.addEventListener("change", (e) => {
    priceLabelUi.storeId = String(e.target.value || "");
    renderPriceLabelPageInner();
  });
  document.getElementById("priceLabelTypeFilter")?.addEventListener("change", (e) => {
    priceLabelUi.furnitureType = String(e.target.value || "");
    renderPriceLabelPageInner();
  });
  document.getElementById("priceLabelCreatorFilter")?.addEventListener("change", (e) => {
    priceLabelUi.createdBy = String(e.target.value || "");
    renderPriceLabelPageInner();
  });
  document.getElementById("priceLabelSearchInput")?.addEventListener("input", (e) => {
    priceLabelUi.search = String(e.target.value || "");
    renderPriceLabelPageInner();
  });
  document.getElementById("priceLabelClearFilters")?.addEventListener("click", clearPriceLabelFilters);
  document.getElementById("priceLabelCreateBtn")?.addEventListener("click", () => openPriceLabelModal(""));
  document.getElementById("closePriceLabelModal")?.addEventListener("click", () => {
    toggleModal(document.getElementById("priceLabelModal"), false);
  });
  document.getElementById("priceLabelForm")?.addEventListener("submit", submitPriceLabelForm);
  document.querySelectorAll("#priceLabelModal [data-price-label-mode]").forEach((btn) => {
    btn.addEventListener("click", () => priceLabelSetMode(btn.dataset.priceLabelMode));
  });
}
