const PRICE_LABEL_FURNITURE_TYPES = [
  "Divan", "Kreslo", "Stol", "Stul", "Shkaf", "Karavot", "Komod", "Tumbochka", "Oshxona to'plami", "Boshqa",
];

const priceLabelUi = { search: "", storeId: "", furnitureType: "", createdBy: "" };
let priceLabelEditId = "";
let priceLabelMode = "with";
let priceLabelEventsBound = false;

function ensurePriceLabelState() {
  state.db.priceLabels = state.db.priceLabels && typeof state.db.priceLabels === "object" ? state.db.priceLabels : {};
  state.db.priceLabels.entries = state.db.priceLabels.entries && typeof state.db.priceLabels.entries === "object"
    ? state.db.priceLabels.entries
    : {};
  return state.db.priceLabels;
}

function getPriceLabelRows() {
  const labels = ensurePriceLabelState();
  const query = String(priceLabelUi.search || "").trim().toLowerCase();
  const rows = Object.values(labels.entries).filter((row) => row && typeof row === "object");
  return rows.filter((row) => {
    if (priceLabelUi.storeId && String(row.storeId || "") !== priceLabelUi.storeId) return false;
    if (priceLabelUi.furnitureType && String(row.furnitureType || "") !== priceLabelUi.furnitureType) return false;
    if (priceLabelUi.createdBy && String(row.createdBy || "") !== priceLabelUi.createdBy) return false;
    if (!query) return true;
    const hay = [row.model, row.info, row.furnitureType, getStore(row.storeId)?.name]
      .map((x) => String(x || "").toLowerCase()).join(" ");
    return hay.includes(query);
  }).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function renderPriceLabelPage() {
  if (!refs.priceLabelPage || refs.priceLabelPage.classList.contains("hidden")) return;
  ensurePriceLabelState();
  bindPriceLabelEvents();

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

  const rows = getPriceLabelRows();
  countEl.textContent = `Jami: ${rows.length}`;

  tbody.innerHTML = rows.length
    ? rows.map((row, idx) => {
      const store = getStore(row.storeId);
      const creator = getUser(row.createdBy);
      const priceText = row.discountMode === "with"
        ? `<span class="price-label-price-cell"><span class="price-label-old-price">${escapeHtml(numberFmt(Number(row.costPrice) || 0))}</span> <strong>${escapeHtml(numberFmt(Number(row.discountPrice) || 0))}</strong> so'm</span>`
        : `<span class="price-label-price-cell"><strong>${escapeHtml(numberFmt(Number(row.costPrice) || 0))}</strong> so'm</span>`;
      return `<tr>
        <td data-label="№" class="sales-cell-center">${idx + 1}</td>
        <td data-label="Sana" class="sales-cell-center">${escapeHtml(fmtDate(row.createdAt))}</td>
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
  renderPriceLabelPage();
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

  form.furnitureType.innerHTML = PRICE_LABEL_FURNITURE_TYPES.map((x) => option(x, x)).join("");
  form.storeId.innerHTML = [option("", "-"), ...(state.db.stores || []).map((s) => option(s.id, s.name))].join("");
  if (typeof enhanceSelectAsCustom === "function") {
    enhanceSelectAsCustom(form.furnitureType);
    enhanceSelectAsCustom(form.storeId);
  }

  form.reset();
  priceLabelEditId = String(id || "");
  const entry = priceLabelEditId ? ensurePriceLabelState().entries[priceLabelEditId] : null;
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
  if (typeof enhanceSelectAsCustom === "function") {
    enhanceSelectAsCustom(form.furnitureType);
    enhanceSelectAsCustom(form.storeId);
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

  const labels = ensurePriceLabelState();
  const existing = priceLabelEditId ? labels.entries[priceLabelEditId] : null;
  const id = priceLabelEditId || uid("label");
  const submitBtn = form.querySelector("button[type=submit]");
  if (submitBtn) submitBtn.disabled = true;

  try {
    const imageFile = form.image.files?.[0] || null;
    let imageUrl = existing?.imageUrl || "";
    if (imageFile) {
      const dataUrl = await readImageAsDataUrl(imageFile);
      if (dataUrl) {
        const uploadedUrl = await saveWarehouseImageToServer(`price_label_${Date.now()}`, dataUrl);
        if (REMOTE_DB_ENABLED && !uploadedUrl) {
          showToast(t("saveFailed"), "error");
          return;
        }
        const previousImageUrl = existing?.imageUrl || "";
        imageUrl = uploadedUrl || dataUrl;
        if (previousImageUrl) await deleteWarehouseImageFromServer(previousImageUrl);
      }
    }

    labels.entries[id] = {
      id,
      imageUrl,
      furnitureType,
      model,
      info,
      size,
      storeId,
      discountMode: priceLabelMode,
      costPrice,
      discountPrice: priceLabelMode === "with" ? discountPrice : "",
      createdBy: existing?.createdBy || state.user?.id || "",
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDB();
    toggleModal(document.getElementById("priceLabelModal"), false);
    renderPriceLabelPage();
    showToast(t("saved"));
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function deletePriceLabel(id) {
  if (!(await confirmPermanentDelete())) return;
  const labels = ensurePriceLabelState();
  const key = String(id || "");
  const entry = labels.entries[key];
  if (!entry) return;
  delete labels.entries[key];
  saveDB();
  renderPriceLabelPage();
  showToast("Yorliq o'chirildi");
  if (entry.imageUrl) deleteWarehouseImageFromServer(entry.imageUrl);
}

function printPriceLabel(id) {
  const labels = ensurePriceLabelState();
  const row = labels.entries[String(id || "")];
  if (!row) return;
  const store = getStore(row.storeId);
  const priceHtml = row.discountMode === "with"
    ? `<p style="margin:6px 0 0;font-size:15px;text-decoration:line-through;color:#888">${escapeHtml(numberFmt(Number(row.costPrice) || 0))} so'm</p>
       <p style="margin:2px 0 0;font-size:28px;font-weight:800;color:#b91c1c">${escapeHtml(numberFmt(Number(row.discountPrice) || 0))} so'm</p>`
    : `<p style="margin:6px 0 0;font-size:28px;font-weight:800">${escapeHtml(numberFmt(Number(row.costPrice) || 0))} so'm</p>`;
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Narx yorlig'i</title></head>
    <body style="font-family:Montserrat,sans-serif;padding:16px">
      <section style="width:320px;border:2px solid #111;border-radius:14px;padding:16px;display:grid;gap:4px">
        ${row.imageUrl ? `<img src="${escapeHtml(row.imageUrl)}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px" />` : ""}
        <h2 style="margin:8px 0 0;font-size:18px">${escapeHtml(row.model || "-")}</h2>
        <p style="margin:0;color:#555;font-size:13px">${escapeHtml(row.furnitureType || "")}${row.size ? ` &middot; ${escapeHtml(row.size)}` : ""}</p>
        ${row.info ? `<p style="margin:0;color:#555;font-size:13px">${escapeHtml(row.info)}</p>` : ""}
        ${store ? `<p style="margin:0;color:#888;font-size:11px">${escapeHtml(store.name)}</p>` : ""}
        ${priceHtml}
      </section>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;
  const win = window.open("", "_blank", "noopener,noreferrer,width=420,height=560");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function bindPriceLabelEvents() {
  if (priceLabelEventsBound) return;
  priceLabelEventsBound = true;

  document.getElementById("priceLabelStoreFilter")?.addEventListener("change", (e) => {
    priceLabelUi.storeId = String(e.target.value || "");
    renderPriceLabelPage();
  });
  document.getElementById("priceLabelTypeFilter")?.addEventListener("change", (e) => {
    priceLabelUi.furnitureType = String(e.target.value || "");
    renderPriceLabelPage();
  });
  document.getElementById("priceLabelCreatorFilter")?.addEventListener("change", (e) => {
    priceLabelUi.createdBy = String(e.target.value || "");
    renderPriceLabelPage();
  });
  document.getElementById("priceLabelSearchInput")?.addEventListener("input", (e) => {
    priceLabelUi.search = String(e.target.value || "");
    renderPriceLabelPage();
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
