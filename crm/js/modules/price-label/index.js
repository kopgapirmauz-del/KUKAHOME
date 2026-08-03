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

  typeFilter.innerHTML = [option("", t("allTypes")), ...PRICE_LABEL_FURNITURE_TYPES.map((x) => option(x, x))].join("");
  typeFilter.value = priceLabelUi.furnitureType;

  const creators = (Array.isArray(state.db.users) ? state.db.users : [])
    .slice()
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  creatorFilter.innerHTML = [option("", t("allEmployees")), ...creators.map((u) => option(u.id, fullName(u) || u.login))].join("");
  creatorFilter.value = priceLabelUi.createdBy;

  if (typeof enhanceSelectAsCustom === "function") {
    enhanceSelectAsCustom(storeFilter);
    enhanceSelectAsCustom(typeFilter);
    enhanceSelectAsCustom(creatorFilter);
  }
  searchInput.value = priceLabelUi.search;

  const rows = getFilteredPriceLabelRows();
  countEl.textContent = `${t("totalLabel")}: ${rows.length}`;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  if (state.priceLabelPageIndex > pageCount) state.priceLabelPageIndex = pageCount;
  const start = (state.priceLabelPageIndex - 1) * PAGE_SIZE;
  const current = rows.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = current.length
    ? current.map((row, idx) => {
      const store = getStore(row.storeId);
      const creator = getUser(row.createdBy);
      const som = escapeHtml(t("hrCurrencyUzs"));
      const priceText = row.discountMode === "with"
        ? `<span class="price-label-price-cell"><span class="price-label-old-price">${escapeHtml(numberFmt(Number(row.costPrice) || 0))}</span> <strong>${escapeHtml(numberFmt(Number(row.discountPrice) || 0))}</strong> ${som}</span>`
        : `<span class="price-label-price-cell"><strong>${escapeHtml(numberFmt(Number(row.costPrice) || 0))}</strong> ${som}</span>`;
      return `<tr>
        <td data-label="${escapeHtml(t("furnitureNumber"))}">${start + idx + 1}</td>
        <td data-label="${escapeHtml(t("date"))}">${escapeHtml(fmtDate(row.createdAt))}</td>
        <td data-label="${escapeHtml(t("furnitureImage"))}">${row.imageUrl ? `<img class="incoming-thumb" src="${escapeHtml(row.imageUrl)}" alt="" />` : "-"}</td>
        <td data-label="${escapeHtml(t("store"))}">${escapeHtml(store?.name || "-")}</td>
        <td data-label="${escapeHtml(t("createdByLabel"))}">${escapeHtml(creator ? fullName(creator) : "-")}</td>
        <td data-label="${escapeHtml(t("modelColumnLabel"))}">${escapeHtml(row.model || "-")}</td>
        <td data-label="${escapeHtml(t("priceColumnLabel"))}">${priceText}</td>
        <td data-label="${escapeHtml(t("action"))}" class="sales-cell-center">
          <span class="chip-actions">
            <button type="button" class="action-btn" data-price-label-print="${escapeHtml(row.id)}" aria-label="${escapeHtml(t("printAction"))}"><svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3Zm-3 11H8v-5h8v5Zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1ZM17 3H7v4h10V3Z"/></svg></button>
            <button type="button" class="action-btn" data-price-label-edit="${escapeHtml(row.id)}" aria-label="${escapeHtml(t("integrationEdit"))}"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button>
            <button type="button" class="action-btn" data-price-label-delete="${escapeHtml(row.id)}" aria-label="${escapeHtml(t("deleteAction"))}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>
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
  bindPriceLabelImagePreview();
  renderPriceLabelPagination(pageCount);
}

function renderPriceLabelPagination(pageCount) {
  const pagination = document.getElementById("priceLabelPagination");
  if (!pagination) return;
  pagination.innerHTML = "";
  const chunkSize = 10;
  const showChunkNav = pageCount > chunkSize;
  const currentChunk = Math.floor((state.priceLabelPageIndex - 1) / chunkSize);
  const chunkStart = currentChunk * chunkSize + 1;
  const chunkEnd = Math.min(chunkStart + chunkSize - 1, pageCount);

  if (showChunkNav) {
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "page-btn";
    prev.textContent = "<";
    prev.disabled = chunkStart === 1;
    prev.addEventListener("click", () => {
      const target = Math.max(1, chunkStart - chunkSize);
      if (target === state.priceLabelPageIndex) return;
      state.priceLabelPageIndex = target;
      renderPriceLabelPageInner();
    });
    pagination.appendChild(prev);
  }

  for (let i = chunkStart; i <= chunkEnd; i += 1) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `page-btn ${state.priceLabelPageIndex === i ? "active" : ""}`;
    b.textContent = String(i);
    b.addEventListener("click", () => {
      state.priceLabelPageIndex = i;
      renderPriceLabelPageInner();
    });
    pagination.appendChild(b);
  }

  if (showChunkNav) {
    const next = document.createElement("button");
    next.type = "button";
    next.className = "page-btn";
    next.textContent = ">";
    next.disabled = chunkEnd >= pageCount;
    next.addEventListener("click", () => {
      const target = Math.min(pageCount, chunkStart + chunkSize);
      if (target === state.priceLabelPageIndex) return;
      state.priceLabelPageIndex = target;
      renderPriceLabelPageInner();
    });
    pagination.appendChild(next);
  }
}

function bindPriceLabelImagePreview() {
  document.getElementById("priceLabelTbody")?.querySelectorAll(".incoming-thumb").forEach((img) => {
    if (img.dataset.lightboxBound === "1") return;
    img.dataset.lightboxBound = "1";
    img.addEventListener("click", () => {
      const src = img.getAttribute("src") || "";
      if (src && typeof openImageLightbox === "function") openImageLightbox(src);
    });
  });
}

function clearPriceLabelFilters() {
  priceLabelUi.search = "";
  priceLabelUi.storeId = "";
  priceLabelUi.furnitureType = "";
  priceLabelUi.createdBy = "";
  state.priceLabelPageIndex = 1;
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
  title.textContent = entry ? t("priceLabelEditTitle") : t("priceLabelCreateTitle");

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
    showToast(t("priceLabelDeleted"));
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

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx;
  let sy;
  let sw;
  let sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Image is relatively taller/narrower than the box, so cropping has to
    // trim its height - anchored to the top of the source (matching CSS
    // object-position: center top) so the crop comes off the bottom of the
    // photo instead of losing whatever's at the top.
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = 0;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// The KH_ICON_* constants are raw `<path d="...">` strings meant for inline
// SVG. Canvas has no HTML/SVG renderer, so this draws the same path data
// directly via Path2D.
function drawSvgIconOnCanvas(ctx, rawSvgPath, cx, cy, size, color) {
  const match = /d="([^"]+)"/.exec(rawSvgPath || "");
  if (!match) return;
  let path;
  try {
    path = new Path2D(match[1]);
  } catch {
    return;
  }
  const scale = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}

// Draws the label as a single-page A4 PDF via canvas + pdf-lib - the same
// approach generateSalesCheckPdfDataUrl (sales/index.js) uses for the sales
// receipt, so there is exactly one rendering path instead of a live HTML
// print-preview page plus a separate PDF export that could drift apart.
async function buildPriceLabelPdfBlob(row, store, { cost, discount, pct }) {
  const SCALE = 2;
  const W = 794;
  const H = 1123;
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(SCALE, SCALE);
  await document.fonts.ready;

  ctx.fillStyle = "#fdf8f2";
  ctx.fillRect(0, 0, W, H);

  const photoH = Math.round(H / 3);
  const photoImg = row.imageUrl ? await loadImageToCanvas(row.imageUrl) : null;
  if (photoImg) {
    drawImageCover(ctx, photoImg, 0, 0, W, photoH);
  } else {
    ctx.fillStyle = "#f1e6d8";
    ctx.fillRect(0, 0, W, photoH);
    ctx.fillStyle = "#b8a68d";
    ctx.font = "20px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Rasm yo'q", W / 2, photoH / 2);
    ctx.textAlign = "left";
  }

  const logoImg = await loadImageToCanvas(`${window.location.origin}/assets/images/icons/logo-red.svg`);
  if (logoImg) ctx.drawImage(logoImg, 32, 32, 92, 92);

  if (row.discountMode === "with" && pct > 0) {
    const r = 75;
    const cx = W - 32 - r;
    const cy = photoH - 25;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#9c1420";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "700 26px Montserrat, sans-serif";
    ctx.fillText(`-${pct}%`, cx, cy - 4);
    ctx.font = "700 13px Montserrat, sans-serif";
    ctx.fillText("chegirma", cx, cy + 16);
    ctx.textAlign = "left";
  }

  const infoRows = [
    [KH_ICON_CHAIR, "Mebel turi:", row.furnitureType],
    [KH_ICON_TAG, "Model:", row.model],
    [KH_ICON_DOC, "Ma'lumoti:", row.info],
    [KH_ICON_RULER, "O'lchami:", row.size],
    [KH_ICON_STORE, "Do'kon:", store?.name || ""],
  ].filter(([, , value]) => value);

  const rowH = 66;
  let y = photoH + 60;
  infoRows.forEach(([icon, label, value]) => {
    const iconCy = y + rowH / 2 - 8;
    ctx.beginPath();
    ctx.arc(69, iconCy, 25, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,30,44,0.1)";
    ctx.fill();
    drawSvgIconOnCanvas(ctx, icon, 69, iconCy, 26, "#c81e2c");

    ctx.fillStyle = "#7a5c4a";
    ctx.font = "17px Montserrat, sans-serif";
    ctx.fillText(label, 112, iconCy + 6);
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = "#2a2a2a";
    ctx.font = "700 18px Montserrat, sans-serif";
    ctx.fillText(String(value), 112 + labelWidth + 12, iconCy + 6);

    ctx.strokeStyle = "#f0e4d6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(44, y + rowH);
    ctx.lineTo(W - 44, y + rowH);
    ctx.stroke();

    y += rowH;
  });

  const footerH = 62;
  const priceTop = y + 18;
  const priceBandH = H - footerH - priceTop;

  ctx.textAlign = "left";
  if (row.discountMode === "with") {
    const blockH = 118;
    let py = priceTop + Math.max(0, (priceBandH - blockH) / 2);
    ctx.fillStyle = "#9a9a9a";
    ctx.font = "14px Montserrat, sans-serif";
    ctx.fillText("Eski narx:", 44, py);
    py += 22;
    ctx.font = "18px Montserrat, sans-serif";
    const oldPriceText = `${numberFmt(cost)} so'm`;
    ctx.fillText(oldPriceText, 44, py);
    const oldWidth = ctx.measureText(oldPriceText).width;
    ctx.beginPath();
    ctx.moveTo(44, py - 7);
    ctx.lineTo(44 + oldWidth, py - 7);
    ctx.strokeStyle = "#9a9a9a";
    ctx.lineWidth = 2;
    ctx.stroke();
    py += 30;
    ctx.fillStyle = "#c81e2c";
    ctx.font = "700 14px Montserrat, sans-serif";
    ctx.fillText("Yangi narx:", 44, py);
    py += 36;
    ctx.font = "800 38px Montserrat, sans-serif";
    ctx.fillText(`${numberFmt(discount)} so'm`, 44, py);
  } else {
    const blockH = 56;
    let py = priceTop + Math.max(0, (priceBandH - blockH) / 2) + 14;
    ctx.fillStyle = "#c81e2c";
    ctx.font = "700 14px Montserrat, sans-serif";
    ctx.fillText("Narx:", 44, py);
    py += 36;
    ctx.font = "800 38px Montserrat, sans-serif";
    ctx.fillText(`${numberFmt(cost)} so'm`, 44, py);
  }

  const footerY = H - footerH;
  ctx.fillStyle = "#8a1119";
  ctx.fillRect(0, footerY, W, footerH);
  ctx.fillStyle = "#ffffff";
  ctx.font = "14px Montserrat, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Rasmiy kafolat · Premium sifat", 44, footerY + footerH / 2 + 5);
  ctx.textAlign = "right";
  ctx.fillText("kukahome.uz", W - 44, footerY + footerH / 2 + 5);
  ctx.textAlign = "left";

  const pngDataUrl = canvas.toDataURL("image/png");
  if (!window.PDFLib) {
    await loadExternalScript("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js");
  }
  const { PDFDocument } = window.PDFLib || {};
  if (!PDFDocument) return null;
  const pdfDoc = await PDFDocument.create();
  const pageW = 595.28;
  const pageH = 841.89;
  const page = pdfDoc.addPage([pageW, pageH]);
  const png = await pdfDoc.embedPng(pngDataUrl);
  page.drawImage(png, { x: 0, y: 0, width: pageW, height: pageH });
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

async function printPriceLabel(id) {
  const row = priceLabelRows.find((r) => r.id === id);
  if (!row) return;
  const store = getStore(row.storeId);
  const cost = Number(row.costPrice) || 0;
  const discount = Number(row.discountPrice) || 0;
  const pct = row.discountMode === "with" && cost > 0 ? Math.max(0, Math.round((1 - discount / cost) * 100)) : 0;

  // Opened synchronously, before any await, the same way the old print-
  // preview popup was - opening a window after awaiting async work is
  // routinely blocked as an unsolicited popup since it's no longer inside
  // the click's user-gesture window. The PDF is loaded into this
  // already-open tab once it's ready, exactly like the sales-check receipt
  // link opens its stored PDF in a new tab for the browser's own viewer to
  // handle printing/saving.
  const win = window.open("", "_blank");
  try {
    const blob = await buildPriceLabelPdfBlob(row, store, { cost, discount, pct });
    if (!blob) {
      win?.close();
      showToast(t("saveFailed"), "error");
      return;
    }
    const url = URL.createObjectURL(blob);
    if (win) {
      win.location.href = url;
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = `narx_yorligi_${String(row.model || "yorliq").replace(/[^A-Za-z0-9_-]+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    win?.close();
    showToast(t("saveFailed"), "error");
  }
}

async function exportPriceLabelsExcel() {
  const rows = getFilteredPriceLabelRows();
  const headers = [t("number"), t("date"), t("furnitureImage"), t("store"), t("createdByLabel"), t("furnitureModel"), t("priceColumnLabel")];
  const body = rows.map((row, idx) => {
    const store = getStore(row.storeId);
    const creator = getUser(row.createdBy);
    const som = t("hrCurrencyUzs");
    const priceText = row.discountMode === "with"
      ? `${numberFmt(Number(row.costPrice) || 0)} -> ${numberFmt(Number(row.discountPrice) || 0)} ${som}`
      : `${numberFmt(Number(row.costPrice) || 0)} ${som}`;
    return [idx + 1, fmtDate(row.createdAt), row.imageUrl || "", store?.name || "", creator ? fullName(creator) : "", row.model || "", priceText];
  });
  await exportRowsToExcel({
    title: t("priceLabelTitle"),
    sheetName: t("priceLabelTitle"),
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
    state.priceLabelPageIndex = 1;
    renderPriceLabelPageInner();
  });
  document.getElementById("priceLabelTypeFilter")?.addEventListener("change", (e) => {
    priceLabelUi.furnitureType = String(e.target.value || "");
    state.priceLabelPageIndex = 1;
    renderPriceLabelPageInner();
  });
  document.getElementById("priceLabelCreatorFilter")?.addEventListener("change", (e) => {
    priceLabelUi.createdBy = String(e.target.value || "");
    state.priceLabelPageIndex = 1;
    renderPriceLabelPageInner();
  });
  document.getElementById("priceLabelSearchInput")?.addEventListener("input", debounce((e) => {
    priceLabelUi.search = String(e.target.value || "");
    state.priceLabelPageIndex = 1;
    renderPriceLabelPageInner();
  }, 200));
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
