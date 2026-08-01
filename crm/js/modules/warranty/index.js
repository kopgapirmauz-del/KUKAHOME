function canManageWarrantyTickets() {
  return canSalesAdmin();
}

function canCreateWarrantyTickets() {
  return canCreateSalesCheck();
}

function renderWarrantyChecks() {
  if (!refs.warrantyTbody || !refs.warrantyCountInfo || !refs.warrantyPagination) return;
  seedWarrantyDemoTicketsIfNeeded();
  cleanupExpiredWarrantyTickets();
  renderWarrantyFilters();
  const rows = getFilteredWarrantyTickets();
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / SALES_PAGE_SIZE));
  if (state.warrantyPageIndex > pageCount) state.warrantyPageIndex = pageCount;
  const start = (state.warrantyPageIndex - 1) * SALES_PAGE_SIZE;
  const current = rows.slice(start, start + SALES_PAGE_SIZE);
  if (refs.addWarrantyTicketBtn) refs.addWarrantyTicketBtn.classList.toggle("hidden", !canCreateWarrantyTickets());

  refs.warrantyTbody.innerHTML = current.length
    ? current.map((row, idx) => {
      const store = getStore(row.storeId);
      const manager = getUser(row.managerId);
      const receiptHref = row.ticketUrl || row.ticketDataUrl;
      const fileCell = receiptHref
        ? `<a class="action-btn sales-upload-btn" href="${escapeHtml(receiptHref)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(t("warrantyTicketUpload"))}" aria-label="${escapeHtml(t("warrantyTicketUpload"))}"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-16v10.16l-3.08-3.08-1.42 1.42L12 18l5.5-5.5-1.42-1.42L13 14.16V4h-2Z"/></svg></a>`
        : `<span class="muted">${escapeHtml(t("salesFileMissing"))}</span>`;
      const canEditRow = canManageWarrantyTickets();
      const canDeleteRow = typeof canDeleteWarrantyTicket === "function" ? canDeleteWarrantyTicket() : canManageWarrantyTickets();
      const actionCell = (canEditRow || canDeleteRow)
        ? `<span class="chip-actions">${canEditRow ? `<button class="action-btn" data-warranty-edit="${row.id}"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button>` : ""}${canDeleteRow ? `<button class="action-btn" data-warranty-delete="${row.id}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>` : ""}</span>`
        : "-";
      return `<tr><td data-label="${escapeHtml(t("number"))}" class="sales-cell-center">${start + idx + 1}</td><td data-label="${escapeHtml(t("warrantyTicketNumber"))}" class="sales-cell-center sales-check-no">#${escapeHtml(String(row.ticketNo || start + idx + 1))}</td><td data-label="${escapeHtml(t("date"))}" class="sales-cell-center">${escapeHtml(fmtDate(row.saleDate || row.createdAt))}</td><td data-label="${escapeHtml(t("store"))}">${escapeHtml(store?.name || "-")}</td><td data-label="${escapeHtml(t("manager"))}">${escapeHtml(manager ? fullName(manager) : "-")}</td><td data-label="${escapeHtml(t("warrantyTicketUpload"))}" class="sales-upload-cell">${fileCell}</td><td data-label="${escapeHtml(t("action"))}" class="sales-cell-center sales-actions-cell">${actionCell}</td></tr>`;
    }).join("")
    : `<tr><td colspan="7">${escapeHtml(t("warrantyNoData"))}</td></tr>`;

  refs.warrantyCountInfo.textContent = `Jami: ${total}`;
  renderWarrantyPagination(pageCount);

  refs.warrantyTbody.querySelectorAll("button[data-warranty-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openWarrantyTicketModal(btn.dataset.warrantyEdit));
  });
  refs.warrantyTbody.querySelectorAll("button[data-warranty-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteWarrantyTicket(btn.dataset.warrantyDelete));
  });
}

function renderWarrantyFilters() {
  if (!refs.warrantyStoreFilter || !refs.warrantyManagerFilter || !refs.warrantySearchInput) return;
  const allowedManagers = managersByStore(state.warrantyFilters.storeId);
  if (state.warrantyFilters.managerId && !allowedManagers.some((m) => m.id === state.warrantyFilters.managerId)) {
    state.warrantyFilters.managerId = "";
  }
  refs.warrantyStoreFilter.innerHTML = [
    option("", t("allStores")),
    ...state.db.stores.map((s) => option(s.id, s.name)),
  ].join("");
  refs.warrantyManagerFilter.innerHTML = [
    option("", t("allManagers")),
    ...allowedManagers.map((m) => option(m.id, `${m.firstName} ${m.lastName}`)),
  ].join("");
  refs.warrantyStoreFilter.value = state.warrantyFilters.storeId;
  refs.warrantyManagerFilter.value = state.warrantyFilters.managerId;
  refs.warrantySearchInput.value = state.warrantyFilters.search;
  if (typeof enhanceSelectAsCustom === "function") {
    enhanceSelectAsCustom(refs.warrantyStoreFilter);
    enhanceSelectAsCustom(refs.warrantyManagerFilter);
  }
}

function getFilteredWarrantyTickets() {
  const baseRows = state.db.warrantyTickets || [];
  return baseRows
    .filter((row) => (state.warrantyFilters.storeId ? row.storeId === state.warrantyFilters.storeId : true))
    .filter((row) => (state.warrantyFilters.managerId ? row.managerId === state.warrantyFilters.managerId : true))
    .filter((row) => {
      if (!state.warrantyFilters.search) return true;
      const store = getStore(row.storeId);
      const manager = getUser(row.managerId);
      return [store?.name, manager ? fullName(manager) : "", row.ticketNo, row.formData?.productName, row.formData?.modelNo]
        .join(" ")
        .toLowerCase()
        .includes(state.warrantyFilters.search);
    })
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0));
}

function renderWarrantyPagination(pageCount) {
  refs.warrantyPagination.innerHTML = "";
  const chunkSize = 10;
  const showChunkNav = pageCount > chunkSize;
  const currentChunk = Math.floor((state.warrantyPageIndex - 1) / chunkSize);
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
      if (target === state.warrantyPageIndex) return;
      state.warrantyPageIndex = target;
      renderWarrantyChecks();
    });
    refs.warrantyPagination.appendChild(prev);
  }

  for (let i = chunkStart; i <= chunkEnd; i += 1) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `page-btn ${state.warrantyPageIndex === i ? "active" : ""}`;
    b.textContent = String(i);
    b.addEventListener("click", () => {
      state.warrantyPageIndex = i;
      renderWarrantyChecks();
    });
    refs.warrantyPagination.appendChild(b);
  }

  if (showChunkNav) {
    const next = document.createElement("button");
    next.type = "button";
    next.className = "page-btn";
    next.textContent = ">";
    next.disabled = chunkEnd >= pageCount;
    next.addEventListener("click", () => {
      const target = Math.min(pageCount, chunkStart + chunkSize);
      if (target === state.warrantyPageIndex) return;
      state.warrantyPageIndex = target;
      renderWarrantyChecks();
    });
    refs.warrantyPagination.appendChild(next);
  }
}

function clearWarrantyFilters() {
  state.warrantyFilters.search = "";
  state.warrantyFilters.storeId = "";
  state.warrantyFilters.managerId = "";
  state.warrantyPageIndex = 1;
  renderWarrantyChecks();
}

function exportWarrantyTicketsExcel() {
  const headers = [
    t("number"),
    t("warrantyTicketNumber"),
    t("date"),
    t("store"),
    t("manager"),
    t("warrantyTicketUpload"),
  ];
  const rows = getFilteredWarrantyTickets().map((row, idx) => {
    const store = getStore(row.storeId);
    const manager = getUser(row.managerId);
    return [
      idx + 1,
      `#${row.ticketNo || idx + 1}`,
      row.saleDate || row.createdAt || "",
      store?.name || "",
      manager ? fullName(manager) : "",
      row.ticketFileName || "",
    ];
  });
  const ws = buildStyledExportSheet(t("warrantyTitle"), headers, rows);
  writeStyledWorkbook(ws, t("menuWarranty"), `warranty_tickets_${state.lang}.xlsx`);
}

function nextWarrantyTicketNumber() {
  const maxNo = (state.db.warrantyTickets || []).reduce((acc, row) => Math.max(acc, Number(row.ticketNo || 0)), 0);
  return maxNo + 1;
}

function syncWarrantyManagerOptions(preferredManagerId = "") {
  if (!refs.warrantyTicketStoreSelect || !refs.warrantyTicketManagerSelect) return;
  const storeId = String(refs.warrantyTicketStoreSelect.value || "");
  if (!storeId) {
    refs.warrantyTicketManagerSelect.innerHTML = option("", t("selectStoreFirst"));
    refs.warrantyTicketManagerSelect.value = "";
    refs.warrantyTicketManagerSelect.disabled = true;
    return;
  }
  const scopedManagers = managersByStore(storeId);
  refs.warrantyTicketManagerSelect.disabled = false;
  refs.warrantyTicketManagerSelect.innerHTML = [
    option("", t("selectManager")),
    ...scopedManagers.map((m) => option(m.id, `${m.firstName} ${m.lastName}`)),
  ].join("");
  if (preferredManagerId && scopedManagers.some((m) => m.id === preferredManagerId)) {
    refs.warrantyTicketManagerSelect.value = preferredManagerId;
    return;
  }
  refs.warrantyTicketManagerSelect.value = "";
}

function openWarrantyTicketModal(ticketId) {
  if (!state.user) return;
  if (!ticketId && !canCreateWarrantyTickets()) return;
  if (ticketId && !canManageWarrantyTickets()) return;
  state.editingWarrantyTicketId = ticketId || null;
  if (refs.warrantyTicketModalTitle) {
    refs.warrantyTicketModalTitle.textContent = state.editingWarrantyTicketId ? t("warrantyTicketUpdated") : t("addWarrantyTicket");
  }
  refs.warrantyTicketForm.reset();
  refs.warrantyTicketStoreSelect.innerHTML = [
    option("", t("selectStore")),
    ...state.db.stores.map((s) => option(s.id, s.name)),
  ].join("");
  syncWarrantyManagerOptions();
  refs.warrantyTicketStoreSelect.onchange = () => syncWarrantyManagerOptions();

  if (ticketId) {
    const row = (state.db.warrantyTickets || []).find((x) => x.id === ticketId);
    if (!row) return;
    const formData = row.formData || {};
    refs.warrantyTicketForm.storeId.value = row.storeId || "";
    syncWarrantyManagerOptions(row.managerId || "");
    refs.warrantyTicketForm.productName.value = formData.productName || "";
    refs.warrantyTicketForm.modelNo.value = formData.modelNo || "";
    refs.warrantyTicketForm.barcode.value = formData.barcode || "";
    refs.warrantyTicketForm.saleDate.value = formData.saleDate || row.saleDate || "";
    refs.warrantyTicketForm.warrantyStartDate.value = formData.warrantyStartDate || formData.saleDate || row.saleDate || "";
    refs.warrantyTicketForm.warrantyEndDate.value = formData.warrantyEndDate || "";
    refs.warrantyTicketForm.warrantyTerm.value = formData.warrantyTerm || "";
    refs.warrantyTicketForm.sellerOrg.value = formData.sellerOrg || "";
  } else {
    refs.warrantyTicketForm.saleDate.value = new Date().toISOString().slice(0, 10);
    refs.warrantyTicketForm.warrantyStartDate.value = refs.warrantyTicketForm.saleDate.value;
    if (isManagerLikeUser() && !canSalesAdmin()) {
      refs.warrantyTicketForm.storeId.value = state.user.storeId || "";
      syncWarrantyManagerOptions(state.user.id);
      refs.warrantyTicketStoreSelect.disabled = true;
      refs.warrantyTicketManagerSelect.disabled = true;
      refs.warrantyTicketForm.sellerOrg.value = getStore(state.user.storeId)?.name || "KUKA HOME";
    } else {
      refs.warrantyTicketStoreSelect.disabled = false;
      refs.warrantyTicketManagerSelect.disabled = true;
    }
  }

  toggleModal(refs.warrantyTicketModal, true);
}

function closeWarrantyTicketModal() {
  state.editingWarrantyTicketId = null;
  refs.warrantyTicketForm.reset();
  toggleModal(refs.warrantyTicketModal, false);
}

async function ensurePdfLibLoaded() {
  if (window.PDFLib) return true;
  if (typeof loadExternalScript === "function") {
    return loadExternalScript("https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js");
  }
  return false;
}

async function generateQrPngBytes(text) {
  if (!text) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(qrUrl);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function bytesToDataUrlPdf(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    binary += String.fromCharCode(...arr.subarray(i, i + chunk));
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}

async function generateWarrantyTicketPdfDataUrl(payload, qrText = "") {
  const loaded = await ensurePdfLibLoaded();
  if (!loaded || !window.PDFLib) return "";
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
  let templateBytes = null;
  try {
    const res = await fetch("js/modules/warranty/Kafolat_taloni.pdf");
    if (!res.ok) return "";
    templateBytes = await res.arrayBuffer();
  } catch {
    return "";
  }

  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const baseW = 1246;
  const baseH = 911;
  const sx = width / baseW;
  const sy = height / baseH;
  const xFromBase = (v) => v * sx;
  const yFromTop = (v) => height - (v * sy);
  const drawLineValue = (text, x, lineTop, size = 15, maxBaseWidth = 720) => {
    const value = String(text || "");
    const scale = Math.min(sx, sy);
    let fontSize = Math.max(9, size * scale);
    const maxWidth = xFromBase(maxBaseWidth);
    const measuredWidth = font.widthOfTextAtSize(value, fontSize);
    if (measuredWidth > maxWidth && measuredWidth > 0) {
      fontSize = Math.max(8 * scale, fontSize * (maxWidth / measuredWidth));
    }
    page.drawText(value, {
      x: xFromBase(x + 8),
      y: yFromTop(lineTop - 6),
      size: fontSize,
      font,
      color: rgb(0.15, 0.2, 0.28),
    });
  };

  drawLineValue(payload.productName, 385, 257, 16, 730);
  drawLineValue(payload.modelNo, 225, 300, 16, 890);
  drawLineValue(payload.barcode, 225, 347, 16, 890);
  drawLineValue(payload.saleDateLabel, 270, 393, 16, 845);
  const termLabel = `${payload.warrantyTerm}${payload.warrantyStartDate && payload.warrantyEndDate ? ` (${fmtDate(payload.warrantyStartDate)} - ${fmtDate(payload.warrantyEndDate)})` : ""}`;
  drawLineValue(termLabel, 325, 439, 14, 790);
  drawLineValue(payload.sellerOrg, 575, 483, 14, 540);

  page.drawText(`#${payload.ticketNo}`, {
    x: xFromBase(1065),
    y: yFromTop(96),
    size: Math.max(10, 14 * Math.min(sx, sy)),
    font: fontBold,
    color: rgb(0.45, 0.06, 0.08),
  });

  const qrBytes = await generateQrPngBytes(qrText);
  if (qrText && !qrBytes) return "";
  if (qrBytes) {
    const qr = await pdfDoc.embedPng(qrBytes);
    const scale = Math.min(sx, sy);
    const qrSize = Math.max(52, 82 * scale);
    const qrX = xFromBase(18);
    const qrTop = 16 * sy;
    const qrY = height - qrTop - qrSize;
    const pad = Math.max(1.5, 2 * scale);
    page.drawRectangle({
      x: qrX - pad,
      y: qrY - pad,
      width: qrSize + (pad * 2),
      height: qrSize + (pad * 2),
      color: rgb(1, 1, 1),
    });
    page.drawImage(qr, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
  }

  const outBytes = await pdfDoc.save();
  return bytesToDataUrlPdf(outBytes);
}

async function saveWarrantyTicketPdfToServer(fileName, dataUrl) {
  const endpoints = [API_SALES_CHECK_FILE_URL, "http://127.0.0.1:8000/api/sales-check-file", "http://localhost:8000/api/sales-check-file"];
  for (const endpoint of endpoints) {
    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName, data_url: dataUrl }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      return String(data.url || "");
    } catch {
      // try next endpoint
    }
  }
  return "";
}

async function deleteWarrantyTicketPdfFromServer(fileName) {
  if (!fileName) return false;
  const endpoints = [API_SALES_CHECK_FILE_URL, "http://127.0.0.1:8000/api/sales-check-file", "http://localhost:8000/api/sales-check-file"];
  for (const endpoint of endpoints) {
    try {
      const res = await apiFetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName }),
      });
      if (res.ok) return true;
    } catch {
      // try next endpoint
    }
  }
  return false;
}

function createWarrantyTicketId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function buildWarrantyVerificationUrl(ticketId) {
  return `${window.location.origin}/pages/warranty.html?id=${encodeURIComponent(ticketId)}`;
}

async function onWarrantyTicketSubmit(e) {
  e.preventDefault();
  if (!state.user || !refs.warrantyTicketForm) return;
  if (state.editingWarrantyTicketId && !canManageWarrantyTickets()) return;
  if (!state.editingWarrantyTicketId && !canCreateWarrantyTickets()) return;
  const fd = new FormData(refs.warrantyTicketForm);
  const storeId = String(fd.get("storeId") || refs.warrantyTicketForm.storeId?.value || "");
  const managerId = String(fd.get("managerId") || refs.warrantyTicketForm.managerId?.value || "");
  const store = getStore(storeId);
  const manager = getUser(managerId);
  if (!storeId || !managerId || !store || !manager) {
    showToast(t("fillRequired"));
    return;
  }

  const payload = {
    productName: String(fd.get("productName") || "").trim(),
    modelNo: String(fd.get("modelNo") || "").trim(),
    barcode: String(fd.get("barcode") || "").trim(),
    saleDate: String(fd.get("saleDate") || "").trim(),
    saleDateLabel: fmtDate(String(fd.get("saleDate") || "").trim()),
    warrantyStartDate: String(fd.get("warrantyStartDate") || "").trim(),
    warrantyEndDate: String(fd.get("warrantyEndDate") || "").trim(),
    warrantyTerm: String(fd.get("warrantyTerm") || "").trim(),
    sellerOrg: String(fd.get("sellerOrg") || "").trim(),
    storeName: store.name,
    sellerName: fullName(manager),
  };

  if (!payload.productName || !payload.modelNo || !payload.barcode || !payload.saleDate || !payload.warrantyStartDate || !payload.warrantyEndDate || !payload.warrantyTerm || !payload.sellerOrg) {
    showToast(t("fillRequired"));
    return;
  }
  if (payload.warrantyEndDate < payload.warrantyStartDate) {
    showToast(t("fillRequired"));
    return;
  }

  const isEdit = Boolean(state.editingWarrantyTicketId);
  const now = new Date().toISOString();
  const existingRow = isEdit
    ? (state.db.warrantyTickets || []).find((x) => x.id === state.editingWarrantyTicketId)
    : null;
  const ticketId = String(existingRow?.id || createWarrantyTicketId());
  const currentNo = isEdit
    ? Number(existingRow?.ticketNo || nextWarrantyTicketNumber())
    : nextWarrantyTicketNumber();
  payload.ticketNo = currentNo;
  const fileName = `warranty_ticket_${currentNo}_${ticketId.slice(0, 8)}_${Date.now().toString(36)}.pdf`;
  const verificationUrl = buildWarrantyVerificationUrl(ticketId);

  const generatedDataUrl = await generateWarrantyTicketPdfDataUrl(payload, verificationUrl);
  if (!generatedDataUrl) {
    showToast(t("saveFailed"));
    return;
  }
  const ticketUrl = await saveWarrantyTicketPdfToServer(fileName, generatedDataUrl);
  if (REMOTE_DB_ENABLED && !ticketUrl) {
    showToast(t("saveFailed"));
    return;
  }
  const ticketDataUrl = ticketUrl ? "" : generatedDataUrl;

  state.db.warrantyTickets = Array.isArray(state.db.warrantyTickets) ? state.db.warrantyTickets : [];
  const rowPayload = {
    id: ticketId,
    ticketNo: currentNo,
    storeId,
    managerId,
    saleDate: payload.saleDate,
    warrantyStartDate: payload.warrantyStartDate,
    warrantyEndDate: payload.warrantyEndDate,
    createdAt: now,
    ticketUrl,
    ticketDataUrl,
    ticketFileName: fileName,
    formData: payload,
  };
  let synced = false;
  if (isEdit) {
    synced = await updateWarrantyTicketViaApi(ticketId, rowPayload);
    if (REMOTE_DB_ENABLED && !synced) {
      await deleteWarrantyTicketPdfFromServer(fileName);
      showToast(t("saveFailed"));
      return;
    }
    const row = state.db.warrantyTickets.find((x) => x.id === ticketId);
    if (row && !REMOTE_DB_ENABLED) {
      row.storeId = storeId;
      row.managerId = managerId;
      row.ticketNo = currentNo;
      row.saleDate = payload.saleDate;
      row.warrantyStartDate = payload.warrantyStartDate;
      row.warrantyEndDate = payload.warrantyEndDate;
      row.ticketUrl = ticketUrl;
      row.ticketDataUrl = ticketDataUrl;
      row.ticketFileName = fileName;
      row.formData = payload;
      row.updatedAt = now;
    }
    if (synced && existingRow?.ticketFileName && existingRow.ticketFileName !== fileName) {
      await deleteWarrantyTicketPdfFromServer(existingRow.ticketFileName);
    }
  } else {
    const created = await addWarrantyTicketViaApi(rowPayload);
    synced = Boolean(created);
    if (REMOTE_DB_ENABLED && !synced) {
      await deleteWarrantyTicketPdfFromServer(fileName);
      showToast(t("saveFailed"));
      return;
    }
    if (!REMOTE_DB_ENABLED) {
      state.db.warrantyTickets.unshift({
        id: ticketId,
        ticketNo: currentNo,
        storeId,
        managerId,
        saleDate: payload.saleDate,
        warrantyStartDate: payload.warrantyStartDate,
        warrantyEndDate: payload.warrantyEndDate,
        createdAt: now,
        ticketUrl,
        ticketDataUrl,
        ticketFileName: fileName,
        formData: payload,
      });
    }
  }

  if (synced) {
    await loadWarrantyTicketsFromApi();
  } else {
    saveDB();
  }
  closeWarrantyTicketModal();
  showToast(t(isEdit ? "warrantyTicketUpdated" : "warrantyTicketCreated"));
  renderWarrantyChecks();
}

function seedWarrantyDemoTicketsIfNeeded() {
  if (REMOTE_DB_ENABLED) return;
  if (!state.db?.meta || state.db.meta.warrantyDemoSeeded) return;
  const store = state.db.stores?.[0];
  const manager = managersByStore(store?.id || "")?.[0] || managers()?.[0];
  if (!store || !manager) return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const endA = new Date(now);
  endA.setMonth(endA.getMonth() + 12);
  const endB = new Date(now);
  endB.setMonth(endB.getMonth() + 18);
  const makeRow = (no, productName, modelNo, barcode, endDate, months) => ({
    id: uid("warranty"),
    ticketNo: no,
    storeId: store.id,
    managerId: manager.id,
    saleDate: today,
    warrantyStartDate: today,
    warrantyEndDate: endDate,
    createdAt: new Date(now.getTime() - no * 60000).toISOString(),
    ticketUrl: "js/modules/warranty/Kafolat_taloni.pdf",
    ticketDataUrl: "",
    ticketFileName: `warranty_demo_${no}.pdf`,
    formData: {
      productName,
      modelNo,
      barcode,
      saleDate: today,
      warrantyStartDate: today,
      warrantyEndDate: endDate,
      warrantyTerm: `${months} oy`,
      sellerOrg: store.name,
      storeName: store.name,
      sellerName: fullName(manager),
    },
  });

  state.db.warrantyTickets = Array.isArray(state.db.warrantyTickets) ? state.db.warrantyTickets : [];
  if (!state.db.warrantyTickets.length) {
    const n1 = nextWarrantyTicketNumber();
    const n2 = n1 + 1;
    state.db.warrantyTickets.unshift(
      makeRow(n2, "KUKA Milano Sofa", "MIL-2026", "998860002222", endB.toISOString().slice(0, 10), 18),
      makeRow(n1, "KUKA Roma L", "ROMA-L-11", "998860001111", endA.toISOString().slice(0, 10), 12),
    );
  }
  state.db.meta.warrantyDemoSeeded = true;
  saveDB();
}

// Expiry is decided by the server, never by this machine. GET
// /api/warranty-tickets runs its own cleanup against the Tashkent date
// before returning, and /api/sales-check-file refuses an expired ticket PDF.
//
// This used to delete straight through the API on every render - including
// the 4s poll - based on `new Date()` and with no role check, while
// DELETE /api/warranty-tickets only verifies role and ownership and never
// re-checks the date. One workstation with a wrong clock (a dead CMOS
// battery, or a manually changed date) therefore permanently destroyed
// valid, in-force warranties for every store, rows and PDFs alike, with no
// confirmation and no undo. Offline mode still prunes its own copy so the
// demo data stays coherent, but it no longer deletes anything server side.
function cleanupExpiredWarrantyTickets() {
  if (REMOTE_DB_ENABLED) return;
  const tickets = Array.isArray(state.db.warrantyTickets) ? state.db.warrantyTickets : [];
  if (!tickets.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const expiredIds = new Set(tickets.filter((row) => {
    const endDate = String(row.warrantyEndDate || row.formData?.warrantyEndDate || "").slice(0, 10);
    return endDate && endDate < today;
  }).map((row) => row.id));
  if (!expiredIds.size) return;
  state.db.warrantyTickets = tickets.filter((row) => !expiredIds.has(row.id));
  saveDB();
}

async function deleteWarrantyTicket(id) {
  if (typeof canDeleteWarrantyTicket === "function" ? !canDeleteWarrantyTicket() : !canManageWarrantyTickets()) return;
  if (!(await confirmPermanentDelete())) return;
  const removedViaApi = await deleteWarrantyTicketViaApi(id);
  if (removedViaApi) {
    await loadWarrantyTicketsFromApi();
    showToast(t("deleted"));
    renderWarrantyChecks();
    return;
  }
  const target = (state.db.warrantyTickets || []).find((x) => x.id === id);
  if (target?.ticketFileName) deleteWarrantyTicketPdfFromServer(target.ticketFileName);
  state.db.warrantyTickets = (state.db.warrantyTickets || []).filter((x) => x.id !== id);
  saveDB();
  showToast(t("deleted"));
  renderWarrantyChecks();
}
