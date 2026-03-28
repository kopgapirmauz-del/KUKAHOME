function renderSalesChecks() {
  renderSalesFilters();
  const rows = getFilteredSalesChecks();
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / SALES_PAGE_SIZE));
  if (state.salesPageIndex > pageCount) state.salesPageIndex = pageCount;
  const start = (state.salesPageIndex - 1) * SALES_PAGE_SIZE;
  const current = rows.slice(start, start + SALES_PAGE_SIZE);

  refs.addSalesCheckBtn.classList.toggle("hidden", !canCreateSalesCheck());
  refs.salesPage.classList.toggle("sales-manager-mode", !canSalesAdmin());

  refs.salesTbody.innerHTML = current.length
    ? current.map((row, idx) => {
      const store = getStore(row.storeId);
      const manager = getUser(row.managerId);
      const receiptHref = row.receiptUrl || row.receiptDataUrl;
      const fileCell = receiptHref
        ? `<a class="action-btn sales-upload-btn" href="${escapeHtml(receiptHref)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(t("salesReceiptUpload"))}" aria-label="${escapeHtml(t("salesReceiptUpload"))}"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-16v10.16l-3.08-3.08-1.42 1.42L12 18l5.5-5.5-1.42-1.42L13 14.16V4h-2Z"/></svg></a>`
        : `<span class="muted">${escapeHtml(t("salesFileMissing"))}</span>`;
      const actionCell = canSalesAdmin()
        ? `<span class="chip-actions"><button class="action-btn" data-sales-edit="${row.id}"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" data-sales-delete="${row.id}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span>`
        : "-";
      return `<tr><td data-label="${escapeHtml(t("number"))}" class="sales-cell-center">${start + idx + 1}</td><td data-label="${escapeHtml(t("checkNumber"))}" class="sales-cell-center sales-check-no">#${escapeHtml(String(row.checkNo || start + idx + 1))}</td><td data-label="${escapeHtml(t("date"))}" class="sales-cell-center">${escapeHtml(fmtDate(row.orderDate || row.createdAt))}</td><td data-label="${escapeHtml(t("store"))}">${escapeHtml(store?.name || "-")}</td><td data-label="${escapeHtml(t("manager"))}">${escapeHtml(manager ? fullName(manager) : "-")}</td><td data-label="${escapeHtml(t("salesReceiptUpload"))}" class="sales-upload-cell">${fileCell}</td><td data-label="${escapeHtml(t("action"))}" class="sales-cell-center">${actionCell}</td></tr>`;
    }).join("")
    : `<tr><td colspan="7">${escapeHtml(t("salesNoData"))}</td></tr>`;

  refs.salesCountInfo.textContent = t("pageInfo").replace("{total}", total).replace("{shown}", current.length);
  renderSalesPagination(pageCount);

  refs.salesTbody.querySelectorAll("button[data-sales-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openSalesCheckModal(btn.dataset.salesEdit));
  });
  refs.salesTbody.querySelectorAll("button[data-sales-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteSalesCheck(btn.dataset.salesDelete));
  });
}

function switchSettingsTab(tab) {
  if (!refs.settingsProfilePage || !refs.settingsUsersPage) return;
  const canShowUsers = state.user?.role === "admin" && refs.settingsUsersTab && !refs.settingsUsersTab.classList.contains("hidden");
  const normalizedTab = tab === "users" && canShowUsers ? "users" : "profile";
  state.settingsTab = normalizedTab;
  const showProfile = normalizedTab !== "users";
  refs.settingsProfilePage.classList.toggle("hidden", !showProfile);
  refs.settingsUsersPage.classList.toggle("hidden", showProfile);
  if (refs.settingsProfileTab) refs.settingsProfileTab.classList.toggle("active", showProfile);
  if (refs.settingsUsersTab) refs.settingsUsersTab.classList.toggle("active", !showProfile);
}

function setAdminActionActive(type) {
  refs.openManagerModal.classList.remove("admin-action-btn-active");
  refs.openStoreModal.classList.remove("admin-action-btn-active");
}

function roleNeedsStore(role) {
  return role === "manager";
}

function syncManagerRoleStoreFields(mode = "create") {
  const isEdit = mode === "edit";
  const roleSelect = isEdit ? refs.managerEditRoleSelect : refs.managerRoleSelect;
  const storeSelect = isEdit ? refs.managerEditStoreSelect : refs.managerStoreSelect;
  const storeField = isEdit ? refs.managerEditStoreField : refs.managerStoreField;
  if (!roleSelect || !storeSelect) return;
  const needsStore = roleNeedsStore(String(roleSelect.value || "manager"));
  if (storeField) storeField.classList.toggle("hidden", !needsStore);
  storeSelect.disabled = !needsStore;
  storeSelect.required = needsStore;
  if (!needsStore) storeSelect.value = "";
}

function confirmPermanentDelete() {
  if (!refs.confirmModal || !refs.confirmModalTitle || !refs.confirmModalMessage || !refs.confirmOkBtn || !refs.confirmCancelBtn) {
    return Promise.resolve(window.confirm(t("deletePermanentWarning")));
  }
  if (confirmResolver) {
    confirmResolver(false);
    confirmResolver = null;
  }
  refs.confirmModalTitle.textContent = t("confirmDeleteTitle");
  refs.confirmModalMessage.textContent = t("deletePermanentWarning");
  refs.confirmCancelBtn.textContent = t("cancel");
  refs.confirmOkBtn.textContent = t("deleteAction");
  toggleModal(refs.confirmModal, true);
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function resolveConfirm(value) {
  if (!confirmResolver) {
    toggleModal(refs.confirmModal, false);
    return;
  }
  const resolver = confirmResolver;
  confirmResolver = null;
  toggleModal(refs.confirmModal, false);
  resolver(value);
}

function renderSalesFilters() {
  const allowedManagers = managersByStore(state.salesFilters.storeId);
  if (state.salesFilters.managerId && !allowedManagers.some((m) => m.id === state.salesFilters.managerId)) {
    state.salesFilters.managerId = "";
  }

  refs.salesStoreFilter.innerHTML = [
    option("", t("allStores")),
    ...state.db.stores.map((s) => option(s.id, s.name)),
  ].join("");
  refs.salesManagerFilter.innerHTML = [
    option("", t("allManagers")),
    ...allowedManagers.map((m) => option(m.id, `${m.firstName} ${m.lastName}`)),
  ].join("");
  refs.salesStoreFilter.value = state.salesFilters.storeId;
  refs.salesManagerFilter.value = state.salesFilters.managerId;
  refs.salesSearchInput.value = state.salesFilters.search;
}

function clearSalesFilters() {
  state.salesFilters.search = "";
  state.salesFilters.storeId = "";
  state.salesFilters.managerId = "";
  state.salesPageIndex = 1;
  renderSalesChecks();
}

function exportSalesChecksExcel() {
  const rows = getFilteredSalesChecks().map((row, idx) => {
    const store = getStore(row.storeId);
    const manager = getUser(row.managerId);
    return {
      No: idx + 1,
      CheckNo: `#${row.checkNo || idx + 1}`,
      Date: row.orderDate || row.createdAt || "",
      Store: store?.name || "",
      Manager: manager ? fullName(manager) : "",
      File: row.receiptFileName || "",
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SalesChecks");
  XLSX.writeFile(wb, "sales_checks.xlsx");
}

function getFilteredSalesChecks() {
  return (state.db.salesChecks || [])
    .filter((row) => (state.salesFilters.storeId ? row.storeId === state.salesFilters.storeId : true))
    .filter((row) => (state.salesFilters.managerId ? row.managerId === state.salesFilters.managerId : true))
    .filter((row) => {
      if (!state.salesFilters.search) return true;
      const store = getStore(row.storeId);
      const manager = getUser(row.managerId);
      return [store?.name, manager ? fullName(manager) : "", row.receiptFileName]
        .join(" ")
        .toLowerCase()
        .includes(state.salesFilters.search);
    })
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0));
}

function renderSalesPagination(pageCount) {
  refs.salesPagination.innerHTML = "";
  for (let i = 1; i <= pageCount; i += 1) {
    const b = document.createElement("button");
    b.className = `page-btn ${state.salesPageIndex === i ? "active" : ""}`;
    b.textContent = String(i);
    b.addEventListener("click", () => {
      state.salesPageIndex = i;
      renderSalesChecks();
    });
    refs.salesPagination.appendChild(b);
  }
}

function salesSellerUsers() {
  const managerUsers = managers();
  return managerUsers;
}

function addSalesItemRow(item = {}) {
  if (!refs.salesItemsRows) return;
  const row = document.createElement("div");
  row.className = "sales-item-row";
  row.innerHTML = `
    <input name="model" placeholder="Mahsulot modeli" value="${escapeHtml(item.model || "")}" />
    <input name="fabric" placeholder="Mato turi" value="${escapeHtml(item.fabric || "")}" />
    <input name="spec" placeholder="Texnik xususiyatlar" value="${escapeHtml(item.spec || "")}" />
    <input name="qty" placeholder="Miqdori" value="${escapeHtml(item.qty || "")}" />
    <div class="sales-item-price"><input name="startPrice" placeholder="Tan narxi" value="${escapeHtml(item.startPrice || "")}" /><select name="startCurrency"><option value="UZS" ${item.startCurrency === "USD" ? "" : "selected"}>UZS</option><option value="USD" ${item.startCurrency === "USD" ? "selected" : ""}>USD</option></select></div>
    <div class="sales-item-price"><input name="finalPrice" placeholder="So'nggi narxi" value="${escapeHtml(item.finalPrice || "")}" /><select name="finalCurrency"><option value="UZS" ${item.finalCurrency === "USD" ? "" : "selected"}>UZS</option><option value="USD" ${item.finalCurrency === "USD" ? "selected" : ""}>USD</option></select></div>
    <button type="button" class="action-btn" data-sales-item-remove><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>
  `;
  refs.salesItemsRows.appendChild(row);
  const removeBtn = row.querySelector("[data-sales-item-remove]");
  if (removeBtn) removeBtn.addEventListener("click", () => row.remove());
}

function collectSalesItems() {
  return Array.from(refs.salesItemsRows.querySelectorAll(".sales-item-row")).map((row) => ({
    model: String(row.querySelector('[name="model"]')?.value || "").trim(),
    fabric: String(row.querySelector('[name="fabric"]')?.value || "").trim(),
    spec: String(row.querySelector('[name="spec"]')?.value || "").trim(),
    qty: String(row.querySelector('[name="qty"]')?.value || "").trim(),
    unit: "",
    startPrice: String(row.querySelector('[name="startPrice"]')?.value || "").trim(),
    startCurrency: String(row.querySelector('[name="startCurrency"]')?.value || "UZS").trim(),
    finalPrice: String(row.querySelector('[name="finalPrice"]')?.value || "").trim(),
    finalCurrency: String(row.querySelector('[name="finalCurrency"]')?.value || "UZS").trim(),
    note: "",
  })).filter((item) => item.model || item.fabric || item.spec || item.qty || item.startPrice || item.finalPrice);
}

function openSalesCheckModal(salesId) {
  if (!state.user) return;
  state.editingSalesCheckId = salesId || null;
  refs.salesCheckForm.reset();
  if (refs.salesItemsRows) refs.salesItemsRows.innerHTML = "";
  refs.salesStoreSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");
  const sellerUsers = salesSellerUsers();
  refs.salesManagerSelect.innerHTML = sellerUsers.map((m) => option(m.id, `${m.firstName} ${m.lastName}`)).join("");
  if (salesId) {
    const row = (state.db.salesChecks || []).find((x) => x.id === salesId);
    if (!row) return;
    const formData = row.formData || {};
    refs.salesCheckForm.storeId.value = row.storeId || "";
    refs.salesCheckForm.managerId.value = row.managerId || "";
    refs.salesCheckForm.customerName.value = formData.customerName || "";
    refs.salesCheckForm.customerPhone.value = formData.customerPhone || "";
    refs.salesCheckForm.orderDate.value = row.orderDate || formData.orderDate || "";
    refs.salesCheckForm.sellerPhone.value = formData.sellerPhone || "";
    refs.salesCheckForm.deliveryDate.value = formData.deliveryDate || "";
    refs.salesCheckForm.totalAmount.value = formData.totalAmount || "";
    refs.salesCheckForm.prepayment.value = formData.prepayment || "";
    refs.salesCheckForm.deliveryAddress.value = formData.deliveryAddress || "";
    refs.salesCheckForm.customerFloor.value = formData.customerFloor || "";
    refs.salesCheckForm.elevatorInfo.value = formData.elevatorInfo || "";
    refs.salesCheckForm.deliveryPaid.value = formData.deliveryPaid || "";
    refs.salesCheckForm.doorFits.value = formData.doorFits || "";
    refs.salesCheckForm.agreesNoReturn.value = formData.agreesNoReturn || "";
    refs.salesCheckForm.warnedAboutIssue.value = formData.warnedAboutIssue || "";
    (formData.items || []).forEach((item) => addSalesItemRow(item));
    const managerMode = isManagerLikeUser() && !canSalesAdmin();
    refs.salesStoreSelect.disabled = managerMode;
    refs.salesManagerSelect.disabled = managerMode;
  } else {
    refs.salesCheckForm.orderDate.value = new Date().toISOString().slice(0, 10);
    refs.salesCheckForm.deliveryDate.value = "";
    if (isManagerLikeUser() && !canSalesAdmin()) {
      if (state.user.storeId) refs.salesCheckForm.storeId.value = state.user.storeId;
      refs.salesCheckForm.managerId.value = state.user.id;
      refs.salesStoreSelect.disabled = true;
      refs.salesManagerSelect.disabled = true;
    } else {
      refs.salesStoreSelect.disabled = false;
      refs.salesManagerSelect.disabled = false;
      if (state.db.stores[0]) refs.salesCheckForm.storeId.value = state.db.stores[0].id;
      if (sellerUsers[0]) refs.salesCheckForm.managerId.value = sellerUsers[0].id;
    }
    addSalesItemRow();
  }
  if (!refs.salesItemsRows.children.length) addSalesItemRow();
  toggleModal(refs.salesCheckModal, true);
}

function closeSalesCheckModal() {
  state.editingSalesCheckId = null;
  refs.salesCheckForm.reset();
  if (refs.salesItemsRows) refs.salesItemsRows.innerHTML = "";
  toggleModal(refs.salesCheckModal, false);
}

function nextSalesCheckNumber() {
  const maxNo = (state.db.salesChecks || []).reduce((acc, row) => Math.max(acc, Number(row.checkNo || 0)), 0);
  return maxNo + 1;
}

async function generateSalesCheckPdfDataUrl(payload) {
  const canvas = document.createElement("canvas");
  canvas.width = 1800;
  canvas.height = 1270;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  await document.fonts.ready;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111111";
  ctx.strokeStyle = "#111111";

  const logo = await loadImageToCanvas("js/modules/sales/chek/file/logo.png");
  if (logo) ctx.drawImage(logo, 86, 22, 120, 96);
  const qr = await loadImageToCanvas("js/modules/sales/chek/file/qr.png");
  if (qr) ctx.drawImage(qr, 1595, 16, 112, 112);

  ctx.textAlign = "center";
  ctx.font = "700 58px Montserrat, sans-serif";
  ctx.fillText("KUKA HOME O'zbekistonda sotuv bo'yicha buyurtma.", 900, 92);
  ctx.textAlign = "left";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(24, 118);
  ctx.lineTo(1776, 118);
  ctx.stroke();

  ctx.font = "700 24px Montserrat, sans-serif";
  ctx.fillText(`Buyurtma beruvchi tomon: ${payload.customerName}`, 36, 150);
  ctx.fillText(`Mijozning ismi: ${payload.customerName}`, 36, 190);
  ctx.fillText(`Telefon raqami: ${payload.customerPhone}`, 36, 230);
  ctx.fillText(`Buyurtma sanasi: ${payload.orderDate}`, 36, 270);
  ctx.fillText(`Ta'minotchi: KUKA HOME`, 1120, 150);
  ctx.fillText(`KUKA HOME do'koni: ${payload.storeName}`, 1120, 190);
  ctx.fillText(`Sotuvchi ismi: ${payload.sellerName}`, 1120, 230);
  ctx.fillText(`Telefon raqami: ${payload.sellerPhone}`, 1120, 270);

  const x = [36, 90, 390, 640, 940, 1070, 1170, 1400, 1610, 1776];
  const top = 315;
  const rowH = 40;
  for (let i = 0; i < x.length; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x[i], top);
    ctx.lineTo(x[i], top + rowH * 9);
    ctx.stroke();
  }
  for (let r = 0; r <= 9; r += 1) {
    ctx.beginPath();
    ctx.moveTo(x[0], top + rowH * r);
    ctx.lineTo(x[x.length - 1], top + rowH * r);
    ctx.stroke();
  }
  ctx.font = "700 19px Montserrat, sans-serif";
  const headers = ["№", "Mahsulot modeli", "Mato turi", "Texnik xususiyatlar", "Miqdori", "Birlik", "Tan narxi", "So'nggi narxi", "Izoh"];
  headers.forEach((h, i) => ctx.fillText(h, x[i] + 8, top + 27));

  ctx.font = "18px Montserrat, sans-serif";
  payload.items.slice(0, 8).forEach((item, idx) => {
    const y = top + rowH * (idx + 1) + 26;
    const vals = [
      String(idx + 1),
      item.model,
      item.fabric,
      item.spec,
      item.qty,
      item.unit || "dona",
      item.startPrice ? `${item.startPrice} ${item.startCurrency || "UZS"}` : "",
      item.finalPrice ? `${item.finalPrice} ${item.finalCurrency || "UZS"}` : "",
      item.note,
    ];
    vals.forEach((v, i) => ctx.fillText(String(v || ""), x[i] + 8, y));
  });

  ctx.font = "700 24px Montserrat, sans-serif";
  ctx.fillText(`Buyurtmaning umumiy summasi: ${payload.totalAmount}`, 36, 730);
  ctx.fillText(`Oldi to'lov miqdori: ${payload.prepayment}`, 36, 770);
  ctx.fillText(`To'lov usuli: ${payload.paymentMethod || ""}`, 900, 730);
  ctx.fillText(`Yetkazib berish sanasi: ${payload.deliveryDate}`, 1380, 730);
  ctx.fillText(`Yetkazib berish manzili: ${payload.deliveryAddress}`, 1380, 770);

  ctx.font = "700 26px Montserrat, sans-serif";
  ctx.fillText("Buyurtma haqida ma'lumot:", 36, 830);
  ctx.font = "18px Montserrat, sans-serif";
  const staticInfo = [
    `1. Mijoz uyining qavati: ${payload.customerFloor || "__________"}, lift bormi va uning o'lchamlari qanday?: ${payload.elevatorInfo || "__________"}, mijoz yetkazib berish uchun to'laydimi: ${payload.deliveryPaid || "__________"};`,
    `2. Kirish eshigining o'lchami katta o'lchamdagi mebelni olib kirishga javob beradimi?: ${payload.doorFits || "__________"};`,
    `3. Sotilgan mahsulotlar sifatida muammo bo'lmasa, qaytarib berish yoki almashtirish mumkin emas. Siz bunga rozimisiz? ${payload.agreesNoReturn || "__________"};`,
    `4. Agar siz muammosi bo'lgan mahsulot sotib olgan bo'lsangiz, sotuvchi sizga muammosi borligi haqida oldindan ogohlantirdimi? ${payload.warnedAboutIssue || "__________"};`,
    "Muhim:",
    "1. Mebelni o'rnatishdan oldin, o'rnatiladigan joy o'rnatish shartlariga mos bo'lishi kerak. Bizning xodimlarimiz uyingizdagi buyumlarini ko'chirmaydi va tashimaydi.",
    "   Iltimos, mebel o'rnatilishidan oldin xona tayyorlanganligiga ishonch hosil qiling. Agar kran ishlatish, eshik va deraza panjaralarini olib tashlash",
    "   yoki deraza orqali kirish uchun arqon o'rnatish zarur bo'lsa, bunday xarajatlarni buyurtmachi o'z zimmasiga oladi.",
    "2. KUKA HOME mahsulotlarini xarid qilganingiz uchun tashakkur! Agar takliflaringiz bo'lsa, biz bilan quyidagi telefon raqami orqali bog'lanishingiz mumkin:",
    "   +998 99-379-99-99;",
  ];
  staticInfo.forEach((line, idx) => ctx.fillText(line, 36, 865 + idx * 25));
  const pngDataUrl = canvas.toDataURL("image/png");
  if (!window.PDFLib) {
    await loadExternalScript("https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js");
  }
  const { PDFDocument } = window.PDFLib || {};
  if (!PDFDocument) return pngDataUrl;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const png = await pdfDoc.embedPng(pngDataUrl);
  page.drawImage(png, { x: 0, y: 0, width: 842, height: 595 });
  const pdfBytes = await pdfDoc.save();
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < pdfBytes.length; i += chunk) {
    binary += String.fromCharCode(...pdfBytes.subarray(i, i + chunk));
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}

async function loadExternalScript(src) {
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.PDFLib) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function loadImageToCanvas(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function saveSalesCheckPdfToServer(fileName, dataUrl) {
  const endpoints = [API_SALES_CHECK_FILE_URL, "http://127.0.0.1:8000/api/sales-check-file", "http://localhost:8000/api/sales-check-file"];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
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

async function deleteSalesCheckPdfFromServer(fileName) {
  if (!fileName) return false;
  const endpoints = [API_SALES_CHECK_FILE_URL, "http://127.0.0.1:8000/api/sales-check-file", "http://localhost:8000/api/sales-check-file"];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
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

async function onSalesCheckSubmit(e) {
  e.preventDefault();
  if (!state.user) return;
  try {
    const fd = new FormData(refs.salesCheckForm);
    const storeId = String(fd.get("storeId") || "");
    const managerId = String(fd.get("managerId") || "");
    const store = getStore(storeId);
    const manager = getUser(managerId);
    if (!storeId || !managerId || !store || !manager) {
      showToast(t("fillRequired"));
      return;
    }
    const createdAt = new Date().toISOString();
    const items = collectSalesItems();
    const payload = {
      customerName: String(fd.get("customerName") || "").trim(),
      customerPhone: String(fd.get("customerPhone") || "").trim(),
      orderDate: String(fd.get("orderDate") || "").trim(),
      storeName: store.name,
      sellerName: fullName(manager),
      sellerPhone: String(fd.get("sellerPhone") || "").trim(),
      deliveryDate: String(fd.get("deliveryDate") || "").trim(),
      deliveryAddress: String(fd.get("deliveryAddress") || "").trim(),
      totalAmount: String(fd.get("totalAmount") || "").trim(),
      prepayment: String(fd.get("prepayment") || "").trim(),
      items,
      customerFloor: String(fd.get("customerFloor") || "").trim(),
      elevatorInfo: String(fd.get("elevatorInfo") || "").trim(),
      deliveryPaid: String(fd.get("deliveryPaid") || "").trim(),
      doorFits: String(fd.get("doorFits") || "").trim(),
      agreesNoReturn: String(fd.get("agreesNoReturn") || "").trim(),
      warnedAboutIssue: String(fd.get("warnedAboutIssue") || "").trim(),
    };
    if (!payload.customerName || !payload.customerPhone || !payload.orderDate || !items.length) {
      showToast(t("fillRequired"));
      return;
    }
    const dataUrl = await generateSalesCheckPdfDataUrl(payload);
    if (!dataUrl) {
      showToast(t("saveFailed"));
      return;
    }
    const checkNo = state.editingSalesCheckId
      ? Number((state.db.salesChecks || []).find((x) => x.id === state.editingSalesCheckId)?.checkNo || nextSalesCheckNumber())
      : nextSalesCheckNumber();
    const ext = String(dataUrl || "").startsWith("data:application/pdf") ? "pdf" : "png";
    const fileName = `sales_check_${checkNo}.${ext}`;
    const receiptUrl = await saveSalesCheckPdfToServer(fileName, dataUrl);
    const isEdit = Boolean(state.editingSalesCheckId);
    state.db.salesChecks = Array.isArray(state.db.salesChecks) ? state.db.salesChecks : [];
    if (isEdit) {
      const target = state.db.salesChecks.find((x) => x.id === state.editingSalesCheckId);
      if (target) {
        target.storeId = storeId;
        target.managerId = managerId;
        target.orderDate = payload.orderDate;
        target.receiptUrl = receiptUrl;
        target.receiptDataUrl = dataUrl;
        target.receiptFileName = fileName;
        target.formData = payload;
        target.updatedAt = createdAt;
      }
    } else {
      state.db.salesChecks.unshift({
        id: uid("sale"),
        checkNo,
        storeId,
        managerId,
        createdAt,
        orderDate: payload.orderDate,
        receiptUrl,
        receiptDataUrl: dataUrl,
        receiptFileName: fileName,
        formData: payload,
      });
    }
    saveDB();
    closeSalesCheckModal();
    showToast(t(isEdit ? "salesUpdated" : "salesCreated"));
    renderSalesChecks();
  } catch (err) {
    console.error("Sales save failed", err);
    showToast(t("saveFailed"));
  }
}

async function deleteSalesCheck(id) {
  if (!canSalesAdmin()) return;
  if (!(await confirmPermanentDelete())) return;
  const target = (state.db.salesChecks || []).find((x) => x.id === id);
  if (target?.receiptFileName) deleteSalesCheckPdfFromServer(target.receiptFileName);
  state.db.salesChecks = (state.db.salesChecks || []).filter((x) => x.id !== id);
  saveDB();
  showToast(t("salesDeleted"));
  renderSalesChecks();
}

