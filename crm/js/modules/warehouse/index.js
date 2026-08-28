function renderWarehouse() {
  const insideSection = state.warehouseView === "incoming" || state.warehouseView === "stock";
  refs.warehouseTabs.classList.toggle("hidden", insideSection);
  refs.warehouseBackWrap.classList.toggle("hidden", !insideSection);
  refs.warehouseIncomingTab.classList.toggle("active", state.warehouseView === "incoming");
  refs.warehouseStockTab.classList.toggle("active", state.warehouseView === "stock");
  refs.incomingSection.classList.toggle("hidden", state.warehouseView !== "incoming");
  refs.stockSection.classList.toggle("hidden", state.warehouseView !== "stock");

  const isAdmin = canWarehouseAdmin();
  refs.addIncomingOrderBtn.classList.toggle("hidden", !isAdmin || state.warehouseView !== "incoming");

  const orders = ensureWarehouseOrders();
  refs.incomingOrdersList.innerHTML = orders.length
    ? orders.map((order) => renderWarehouseOrderCard(order, isAdmin)).join("")
    : `<div class="framed">${escapeHtml(t("noWarehouseData"))}</div>`;

  refs.incomingOrdersList.querySelectorAll("button[data-order-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const order = orders.find((x) => x.id === btn.dataset.orderToggle);
      if (!order) return;
      order.listOpen = !order.listOpen;
      renderWarehouse();
    });
  });

  refs.incomingOrdersList.querySelectorAll("input[data-order-search]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const order = orders.find((x) => x.id === input.dataset.orderSearch);
      if (!order) return;
      order.search = String(e.target.value || "").trim().toLowerCase();
      renderWarehouse();
    });
  });

  refs.incomingOrdersList.querySelectorAll("button[data-order-edit-stage]").forEach((btn) => {
    btn.addEventListener("click", () => openIncomingModalForEdit(btn.dataset.orderEditStage, null, "stage"));
  });

  refs.incomingOrdersList.querySelectorAll("button[data-order-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!isAdmin) return;
      if (!(await confirmPermanentDelete())) return;
      const targetOrder = state.db.warehouseOrders.find((x) => x.id === btn.dataset.orderDelete);
      if (targetOrder) {
        const deletions = (targetOrder.items || []).map((item) => deleteWarehouseImageFromServer(item.imageUrl));
        await Promise.all(deletions);
      }
      state.db.warehouseOrders = state.db.warehouseOrders.filter((x) => x.id !== btn.dataset.orderDelete);
      await persistWarehouseChanges();
      renderWarehouse();
    });
  });

  refs.incomingOrdersList.querySelectorAll("button[data-order-add-item]").forEach((btn) => {
    btn.addEventListener("click", () => openIncomingModalForCreate(btn.dataset.orderAddItem));
  });

  refs.incomingOrdersList.querySelectorAll("button[data-item-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openIncomingModalForEdit(btn.dataset.orderId, btn.dataset.itemEdit, "full"));
  });

  refs.incomingOrdersList.querySelectorAll("button[data-item-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!isAdmin) return;
      if (!(await confirmPermanentDelete())) return;
      const order = orders.find((x) => x.id === btn.dataset.orderId);
      if (!order) return;
      const item = (order.items || []).find((x) => x.id === btn.dataset.itemDelete);
      await deleteWarehouseImageFromServer(item?.imageUrl || "");
      order.items = (order.items || []).filter((x) => x.id !== btn.dataset.itemDelete);
      await persistWarehouseChanges();
      renderWarehouse();
    });
  });

  refs.incomingOrdersList.querySelectorAll("button[data-order-export]").forEach((btn) => {
    btn.addEventListener("click", () => exportIncomingExcel(btn.dataset.orderExport));
  });

  refs.incomingOrdersList.querySelectorAll("input[data-order-import]").forEach((input) => {
    input.addEventListener("change", (e) => importIncomingExcel(e, input.dataset.orderImport));
  });

  refs.addStockBtn.classList.toggle("hidden", state.warehouseView !== "stock" || !isAdmin);
  const stockImportWrap = refs.stockImportInput ? refs.stockImportInput.closest("label") : null;
  if (stockImportWrap) stockImportWrap.classList.toggle("hidden", !isAdmin || state.warehouseView !== "stock");
  refs.stockExportBtn.classList.toggle("hidden", !isAdmin || state.warehouseView !== "stock");
  refs.stockStoreSelect.innerHTML = [option("", "-")].concat(state.db.stores.map((s) => option(s.id, s.name))).join("");
  refs.stockStoreFilter.innerHTML = [option("", t("allStores"))].concat(state.db.stores.map((s) => option(s.id, s.name))).join("");
  if (!["", "warehouse", "showroom"].includes(state.stockLocationFilter)) state.stockLocationFilter = "";
  if (state.stockLocationFilter === "warehouse") state.stockStoreFilter = "";
  refs.stockStoreFilter.value = state.stockStoreFilter;
  refs.stockLocationFilter.value = state.stockLocationFilter;
  refs.stockStoreFilter.disabled = state.stockLocationFilter === "warehouse";
  if (refs.stockStoreFilter.disabled) refs.stockStoreFilter.value = "";
  if (typeof enhanceSelectAsCustom === "function") {
    enhanceSelectAsCustom(refs.stockLocationFilter);
    enhanceSelectAsCustom(refs.stockStoreFilter);
  }

  const stockRows = getFilteredStockRows();
  refs.stockTbody.innerHTML = stockRows.length
    ? stockRows.map((row, idx) => {
      const canEdit = isAdmin && canManageStockRow(row);
      const canReserve = canReserveStockRow();
      const store = getStore(row.storeId);
      const locationText = stockLocationLabel(row.locationType);
      const storeText = row.locationType === "warehouse" ? t("warehouseOnly") : (store?.name || "-");
      return `
        <tr>
          <td data-label="${escapeHtml(t("furnitureNumber"))}">${idx + 1}</td>
          <td data-label="${escapeHtml(t("furnitureImage"))}">${row.imageUrl ? `<img class="incoming-thumb" src="${escapeHtml(row.imageUrl)}" alt="" />` : "-"}</td>
          <td data-label="${escapeHtml(t("furnitureModel"))}">${escapeHtml(row.model || "-")}</td>
          <td data-label="${escapeHtml(t("furnitureInfo"))}">${escapeHtml(row.info || "-")}</td>
          <td data-label="${escapeHtml(t("locationType"))}">${escapeHtml(locationText)}</td>
          <td data-label="${escapeHtml(t("store"))}">${escapeHtml(storeText)}</td>
          <td data-label="${escapeHtml(t("quantity"))}">
            <div class="stock-qty-cell">
              <strong class="stock-qty-value">${escapeHtml(String(row.qty || 0))}</strong>
              ${canEdit ? `<span class="chip-actions stock-qty-actions"><button class="action-btn" data-stock-minus="${row.id}">-</button><button class="action-btn" data-stock-plus="${row.id}">+</button></span>` : ""}
            </div>
          </td>
          <td data-label="${escapeHtml(t("status"))}">${renderStockStatusChip(row.status, row)}</td>
          <td data-label="${escapeHtml(t("reserveColumn"))}">${escapeHtml(reserveOwnerLabel(row))}</td>
          <td data-label="${escapeHtml(t("action"))}">
            <span class="chip-actions">
              ${canReserve ? `<button class="action-btn" data-stock-reserve="${row.id}" title="${escapeHtml(t("reserveAction"))}"><svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-3-7 3V4a1 1 0 0 1 1-1Z"/></svg></button>` : ""}
              ${canEdit ? `<button class="action-btn" data-stock-edit="${row.id}"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" data-stock-delete="${row.id}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>` : ""}
            </span>
          </td>
        </tr>
      `;
    }).join("")
    : `<tr><td colspan="10">${escapeHtml(t("noWarehouseData"))}</td></tr>`;

  refs.stockTbody.querySelectorAll("button[data-stock-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openStockModalForEdit(btn.dataset.stockEdit));
  });
  refs.stockTbody.querySelectorAll("button[data-stock-reserve]").forEach((btn) => {
    btn.addEventListener("click", () => openStockReserveModal(btn.dataset.stockReserve));
  });
  refs.stockTbody.querySelectorAll("button[data-stock-plus],button[data-stock-minus]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.stockPlus || btn.dataset.stockMinus;
      const row = state.db.warehouseStock.find((x) => x.id === id);
      if (!row || !isAdmin || !canManageStockRow(row)) return;
      if (btn.dataset.stockMinus) {
        if (Number(row.qty || 0) <= 0) return;
        row.qty = Math.max(0, Number(row.qty || 0) - 1);
        row.status = row.qty === 0 ? "unavailable" : "available";
      } else {
        row.qty = Number(row.qty || 0) + 1;
        row.status = "available";
      }
      row.updatedAt = new Date().toISOString();
      await persistWarehouseChanges();
      renderWarehouse();
    });
  });
  refs.stockTbody.querySelectorAll("button[data-stock-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.db.warehouseStock.find((x) => x.id === btn.dataset.stockDelete);
      if (!row || !isAdmin || !canManageStockRow(row)) return;
      if (!(await confirmPermanentDelete())) return;
      await deleteWarehouseImageFromServer(row.imageUrl || "");
      state.db.warehouseStock = state.db.warehouseStock.filter((x) => x.id !== row.id);
      await persistWarehouseChanges();
      renderWarehouse();
    });
  });

  bindWarehouseImagePreview();
}

async function persistWarehouseChanges() {
  const saved = await saveWarehouseStateToApi();
  if (saved === "conflict") return false;
  if (!saved) showToast(t("saveFailed"), "error");
  return saved;
}

function openImageLightbox(src) {
  const wrap = document.getElementById("imageLightbox");
  const img = document.getElementById("imageLightboxImg");
  if (!wrap || !img || !src) return;
  bindImageLightboxEvents();
  const current = String(img.getAttribute("src") || "").trim();
  if (!wrap.classList.contains("hidden") && current === src) {
    closeImageLightbox();
    return;
  }
  img.src = src;
  wrap.classList.remove("hidden");
}

function closeImageLightbox() {
  const wrap = document.getElementById("imageLightbox");
  const img = document.getElementById("imageLightboxImg");
  if (!wrap || !img) return;
  img.src = "";
  wrap.classList.add("hidden");
}

function bindWarehouseImagePreview() {
  document.querySelectorAll(".incoming-thumb").forEach((img) => {
    if (img.dataset.lightboxBound === "1") return;
    img.dataset.lightboxBound = "1";
    img.addEventListener("click", () => openImageLightbox(img.getAttribute("src") || ""));
  });

  bindImageLightboxEvents();
}

function bindImageLightboxEvents() {
  const wrap = document.getElementById("imageLightbox");
  if (!wrap || wrap.dataset.bound === "1") return;
  wrap.dataset.bound = "1";
  wrap.addEventListener("click", () => {
    closeImageLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeImageLightbox();
  });
}

function ensureWarehouseOrders() {
  state.db.warehouseOrders = Array.isArray(state.db.warehouseOrders) ? state.db.warehouseOrders : [];
  if (!state.db.warehouseOrders.length) {
    state.db.warehouseOrders.push({
      id: uid("order"),
      stageKey: "from_china",
      eta: "",
      listOpen: false,
      search: "",
      items: [],
    });
  }
  state.db.warehouseOrders.forEach((order) => {
    if (!Array.isArray(order.items)) order.items = [];
    if (typeof order.search !== "string") order.search = "";
    if (typeof order.listOpen !== "boolean") order.listOpen = false;
    if (!order.stageKey) order.stageKey = "from_china";
  });
  return state.db.warehouseOrders;
}

function renderWarehouseOrderCard(order, isAdmin) {
  const rows = (order.items || []);
  const filteredRows = order.search
    ? rows.filter((row) => [row.model, row.info, row.qty].join(" ").toLowerCase().includes(order.search))
    : rows;
  const actions = isAdmin
    ? `<span class="chip-actions incoming-preview-actions"><button class="action-btn" data-order-edit-stage="${order.id}"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" data-order-delete="${order.id}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span>`
    : "";
  return `
    <article class="framed incoming-order-card">
      <div class="incoming-preview-row">${renderIncomingTimeline(order.stageKey, order.eta)}</div>
      ${actions ? `<div class="incoming-preview-actions-row">${actions}</div>` : ""}
      <div class="warehouse-top-actions">
        <button class="btn btn-light" data-order-toggle="${order.id}" type="button"><span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h16v2H4v-2Z"/></svg></span><span>${escapeHtml(t("viewList"))}</span></button>
      </div>
      <div class="incoming-list-wrap ${order.listOpen ? "" : "hidden"}">
        <div class="warehouse-head-actions incoming-list-filters">
          <input class="search warehouse-search" data-order-search="${order.id}" placeholder="${escapeHtml(t("incomingSearchPlaceholder"))}" value="${escapeHtml(order.search)}" />
          ${isAdmin ? `<label class="toolbar-btn toolbar-btn-import warehouse-import-btn"><input type="file" data-order-import="${order.id}" accept=".xlsx,.xls,.csv" hidden /><span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-18-5.5 5.5 1.42 1.42L11 5.84V16h2V5.84l3.08 3.08 1.42-1.42L12 2Z"/></svg></span><span>${escapeHtml(t("importExcel"))}</span></label>` : ""}
          <button class="toolbar-btn warehouse-export-btn" data-order-export="${order.id}" type="button"><span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-16v10.16l-3.08-3.08-1.42 1.42L12 18l5.5-5.5-1.42-1.42L13 14.16V4h-2Z"/></svg></span><span>${escapeHtml(t("exportExcel"))}</span></button>
          ${isAdmin ? `<button class="btn btn-primary" data-order-add-item="${order.id}" type="button"><span class="warehouse-add-plus" aria-hidden="true">+</span><span>${escapeHtml(t("addFurniture"))}</span></button>` : ""}
        </div>
        <div class="table-wrap warehouse-table-wrap">
          <table>
            <thead><tr><th>${escapeHtml(t("furnitureNumber"))}</th><th>${escapeHtml(t("furnitureImage"))}</th><th>${escapeHtml(t("furnitureModel"))}</th><th>${escapeHtml(t("furnitureInfo"))}</th><th>${escapeHtml(t("quantity"))}</th><th>${escapeHtml(t("action"))}</th></tr></thead>
            <tbody>
              ${filteredRows.length ? filteredRows.map((row, idx) => `<tr><td data-label=\"${escapeHtml(t("furnitureNumber"))}\">${idx + 1}</td><td data-label=\"${escapeHtml(t("furnitureImage"))}\">${row.imageUrl ? `<img class=\"incoming-thumb\" src=\"${escapeHtml(row.imageUrl)}\" alt=\"\" />` : "-"}</td><td data-label=\"${escapeHtml(t("furnitureModel"))}\">${escapeHtml(row.model || "-")}</td><td data-label=\"${escapeHtml(t("furnitureInfo"))}\">${escapeHtml(row.info || "-")}</td><td data-label=\"${escapeHtml(t("quantity"))}\">${escapeHtml(String(row.qty || 0))}</td><td data-label=\"${escapeHtml(t("action"))}\">${isAdmin ? `<span class=\"chip-actions\"><button class=\"action-btn\" data-order-id=\"${order.id}\" data-item-edit=\"${row.id}\"><svg viewBox=\"0 0 24 24\"><path d=\"m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z\"/></svg></button><button class=\"action-btn\" data-order-id=\"${order.id}\" data-item-delete=\"${row.id}\"><svg viewBox=\"0 0 24 24\"><path d=\"M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z\"/></svg></button></span>` : "-"}</td></tr>`).join("") : `<tr><td colspan=\"6\">${escapeHtml(t("noWarehouseData"))}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  `;
}

async function addIncomingOrderCard() {
  if (!canWarehouseAdmin()) return;
  const orders = ensureWarehouseOrders();
  orders.unshift({ id: uid("order"), stageKey: "from_china", eta: "", listOpen: false, search: "", items: [] });
  await persistWarehouseChanges();
  renderWarehouse();
}

function switchWarehouseView(view) {
  if (view === "stock" || view === "incoming") {
    state.warehouseView = view;
  } else {
    state.warehouseView = "";
  }
  renderWarehouse();
}

function openIncomingModalForCreate(orderId) {
  if (!canWarehouseAdmin()) return;
  state.editingOrderId = orderId;
  state.editingIncomingItemId = null;
  state.incomingEditMode = "full";
  refs.incomingModalTitle.textContent = t("addFurniture");
  refs.incomingForm.reset();
  prepareIncomingStageOptions();
  refs.incomingFullFields.classList.remove("hidden");
  refs.incomingStageFields.classList.add("hidden");
  refs.incomingForm.model.required = true;
  refs.incomingForm.qty.required = true;
  toggleModal(refs.incomingModal, true);
}

function openIncomingModalForEdit(orderId, itemId, mode) {
  if (!canWarehouseAdmin()) return;
  const order = ensureWarehouseOrders().find((x) => x.id === orderId);
  if (!order) return;
  const row = mode === "stage" ? order : (order.items || []).find((x) => x.id === itemId);
  if (!row) return;
  // Oldingi tahrirdan qolgan fayl keyingi saqlashga o'tib ketmasin.
  refs.incomingForm.reset();
  state.editingOrderId = orderId;
  state.editingIncomingItemId = mode === "stage" ? null : itemId;
  state.incomingEditMode = mode === "stage" ? "stage" : "full";
  refs.incomingModalTitle.textContent = state.incomingEditMode === "stage" ? t("stage") : t("addFurniture");
  prepareIncomingStageOptions();
  refs.incomingFullFields.classList.toggle("hidden", state.incomingEditMode === "stage");
  refs.incomingStageFields.classList.toggle("hidden", state.incomingEditMode !== "stage");
  refs.incomingForm.model.required = state.incomingEditMode !== "stage";
  refs.incomingForm.qty.required = state.incomingEditMode !== "stage";
  refs.incomingForm.model.value = row.model || "";
  refs.incomingForm.info.value = row.info || "";
  refs.incomingForm.qty.value = String(row.qty || "");
  refs.incomingStageSelect.value = normalizeIncomingStageKey(row.stageKey || "from_china");
  refs.incomingForm.eta.value = row.eta || "";
  toggleModal(refs.incomingModal, true);
}

function canManageStockRow(row) {
  return canWarehouseAdmin();
}

function canReserveStockRow() {
  return Boolean(state.user);
}

function stockLocationLabel(locationType) {
  if (locationType === "warehouse") return t("warehouseOnly");
  if (locationType === "both") return t("storeAndWarehouse");
  return t("showroomOnly");
}

function normalizeStockStatus(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "sold") return "unavailable";
  if (value === "unavailable") return "unavailable";
  if (value === "mavjud emas") return "unavailable";
  if (value === "sotilgan") return "unavailable";
  return "available";
}

function stockStatusLabel(status) {
  if (status === "unavailable") return t("statusUnavailable");
  return t("statusAvailable");
}

function canDeleteReservation(row) {
  if (!row?.reservation) return false;
  if (canWarehouseAdmin()) return true;
  return row.reservation.byUserId === state.user.id;
}

function canEditReservation(row) {
  if (canWarehouseAdmin()) return true;
  if (!row?.reservation) return true;
  return row.reservation.byUserId === state.user.id;
}

function reserveOwnerLabel(row) {
  if (!row?.reservation) return t("notReserved");
  const owner = getUser(row.reservation.byUserId);
  if (owner) return fullName(owner);
  return String(row.reservation.byUserName || "-");
}

function renderStockStatusChip(status, row) {
  const key = normalizeStockStatus(status);
  const reserved = row?.reservation ? `<span class="stock-status-chip stock-status-reserved">${escapeHtml(t("statusReserved"))}</span>` : "";
  return `<span class="stock-status-wrap"><span class="stock-status-chip stock-status-${key}">${escapeHtml(stockStatusLabel(key))}</span>${reserved}</span>`;
}

function getFilteredStockRows() {
  const allRows = state.db.warehouseStock || [];
  return allRows.filter((row) => {
    const locationType = String(row.locationType || (row.storeId ? "showroom" : "warehouse"));
    if (state.stockLocationFilter === "warehouse" && !["warehouse", "both"].includes(locationType)) return false;
    if (state.stockLocationFilter === "showroom" && !["showroom", "both"].includes(locationType)) return false;
    if (state.stockStoreFilter && row.storeId !== state.stockStoreFilter) return false;
    if (!state.stockSearch) return true;
    const store = getStore(row.storeId);
    return [row.model, row.info, stockLocationLabel(row.locationType), store?.name, row.qty, stockStatusLabel(row.status), reserveOwnerLabel(row)]
      .join(" ")
      .toLowerCase()
      .includes(state.stockSearch);
  });
}

function openStockModalForCreate() {
  if (!canWarehouseAdmin()) return;
  state.editingStockId = null;
  refs.stockModalTitle.textContent = t("addFurniture");
  refs.stockForm.reset();
  refs.stockStoreSelect.innerHTML = [option("", "-")].concat(state.db.stores.map((s) => option(s.id, s.name))).join("");
  refs.stockLocationWarehouse.checked = true;
  refs.stockLocationShowroom.checked = false;
  refs.stockLocationWarehouse.disabled = !canWarehouseAdmin();
  refs.stockLocationShowroom.disabled = !canWarehouseAdmin();
  if (!canWarehouseAdmin()) {
    refs.stockLocationWarehouse.checked = false;
    refs.stockLocationShowroom.checked = true;
    refs.stockStoreSelect.value = state.user.storeId;
  }
  syncStockStoreRequirement();
  toggleModal(refs.stockModal, true);
}

function openStockModalForEdit(stockId) {
  if (!canWarehouseAdmin()) return;
  const row = state.db.warehouseStock.find((x) => x.id === stockId);
  if (!row || !canManageStockRow(row)) return;
  state.editingStockId = stockId;
  refs.stockModalTitle.textContent = t("editFurniture");
  refs.stockForm.reset();
  refs.stockStoreSelect.innerHTML = [option("", "-")].concat(state.db.stores.map((s) => option(s.id, s.name))).join("");
  refs.stockLocationWarehouse.checked = row.locationType === "warehouse" || row.locationType === "both";
  refs.stockLocationShowroom.checked = row.locationType === "showroom" || row.locationType === "both";
  refs.stockForm.model.value = row.model || "";
  refs.stockForm.info.value = row.info || "";
  refs.stockForm.qty.value = String(row.qty || 0);
  refs.stockForm.status.value = normalizeStockStatus(row.status);
  refs.stockStoreSelect.value = row.storeId || "";
  refs.stockLocationWarehouse.disabled = !canWarehouseAdmin();
  refs.stockLocationShowroom.disabled = !canWarehouseAdmin();
  if (!canWarehouseAdmin()) {
    refs.stockLocationWarehouse.checked = false;
    refs.stockLocationShowroom.checked = true;
    refs.stockStoreSelect.value = state.user.storeId;
  }
  syncStockStoreRequirement();
  toggleModal(refs.stockModal, true);
}

function closeStockModal() {
  state.editingStockId = null;
  refs.stockForm.reset();
  toggleModal(refs.stockModal, false);
}

function openStockReserveModal(stockId) {
  const row = state.db.warehouseStock.find((x) => x.id === stockId);
  if (!row || !canReserveStockRow()) return;
  state.editingReserveStockId = stockId;
  refs.stockReserveForm.reset();
  const canEdit = canEditReservation(row);
  const canDelete = canDeleteReservation(row);
  refs.deleteStockReserveBtn.classList.toggle("hidden", !canDelete);
  refs.stockReserveForm.reservedFor.value = row.reservation?.reservedFor || "";
  refs.stockReserveForm.reserveNote.value = row.reservation?.note || "";
  refs.stockReserveForm.reservedFor.readOnly = !canEdit;
  refs.stockReserveForm.reserveNote.readOnly = !canEdit;
  toggleModal(refs.stockReserveModal, true);
}

function closeStockReserveModal() {
  state.editingReserveStockId = null;
  refs.stockReserveForm.reset();
  refs.stockReserveForm.reservedFor.readOnly = false;
  refs.stockReserveForm.reserveNote.readOnly = false;
  toggleModal(refs.stockReserveModal, false);
}

async function onStockReserveDelete() {
  const row = state.db.warehouseStock.find((x) => x.id === state.editingReserveStockId);
  if (!row || !canReserveStockRow() || !canDeleteReservation(row)) return;
  row.reservation = null;
  row.updatedAt = new Date().toISOString();
  await persistWarehouseChanges();
  closeStockReserveModal();
  renderWarehouse();
}

async function onStockReserveSubmit(e) {
  e.preventDefault();
  const row = state.db.warehouseStock.find((x) => x.id === state.editingReserveStockId);
  if (!row || !canReserveStockRow()) return;
  if (!canEditReservation(row)) {
    closeStockReserveModal();
    return;
  }
  const fd = new FormData(refs.stockReserveForm);
  const reservedFor = String(fd.get("reservedFor") || "").trim();
  const note = String(fd.get("reserveNote") || "").trim();
  if (!reservedFor || !note) {
    showToast(t("fillRequired"));
    return;
  }
  row.reservation = {
    byUserId: state.user.id,
    byUserName: fullName(state.user),
    reservedFor,
    note,
    updatedAt: new Date().toISOString(),
  };
  row.updatedAt = new Date().toISOString();
  await persistWarehouseChanges();
  closeStockReserveModal();
  renderWarehouse();
}

function syncStockStoreRequirement() {
  const isAdmin = canWarehouseAdmin();
  const showroomChecked = refs.stockLocationShowroom.checked;
  refs.stockStoreSelect.disabled = !isAdmin || !showroomChecked;
  if (!showroomChecked && isAdmin) {
    refs.stockStoreSelect.value = "";
  }
  if (!isAdmin) {
    refs.stockStoreSelect.value = state.user?.storeId || "";
  }
}

function incomingStages() {
  return [
    { key: "from_china", label: t("stageFromChina") },
    { key: "near_border", label: t("stageNearBorder") },
    { key: "at_border", label: t("stageAtBorder") },
    { key: "arrived_date", label: t("stageArrivedDate") },
  ];
}

function normalizeIncomingStageKey(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (incomingStages().some((s) => s.key === value)) return value;
  if (value.includes("xitoy") || value.includes("china")) return "from_china";
  if (value.includes("yaqin") || value.includes("near")) return "near_border";
  if (value.includes("chegara") || value.includes("border")) return "at_border";
  if (value.includes("kirdi") || value.includes("entered")) return "at_border";
  if (value.includes("yetib") || value.includes("arriv")) return "arrived_date";
  return "from_china";
}

function incomingStageLabel(raw) {
  const key = normalizeIncomingStageKey(raw);
  const stage = incomingStages().find((s) => s.key === key);
  return stage ? stage.label : "-";
}

function incomingStageIndex(raw) {
  const key = normalizeIncomingStageKey(raw);
  const idx = incomingStages().findIndex((s) => s.key === key);
  return idx < 0 ? 0 : idx;
}

function renderIncomingTimeline(raw, eta) {
  const current = incomingStageIndex(raw);
  return `<div class="incoming-track">${incomingStages().map((stage, idx) => {
    const done = idx <= current;
    const dateMarkup = idx === incomingStages().length - 1 && eta
      ? `<strong class="incoming-date">${escapeHtml(fmtDate(eta))}</strong>`
      : "";
    return `<span class="incoming-step ${done ? "done" : ""}"><i></i><em>${escapeHtml(stage.label)}</em>${dateMarkup}</span>`;
  }).join("")}</div>`;
}

function prepareIncomingStageOptions() {
  refs.incomingStageSelect.innerHTML = incomingStages().map((stage) => option(stage.key, stage.label)).join("");
}

// Ombor ro'yxati rasmni kichik kartochkada ko'rsatadi, lekin telefondan
// kelgan 8-10 MB lik original o'zgarishsiz yuklanardi - bitta shunday rasm
// butun CRM ma'lumotidan ko'proq joy egallardi. Brauzerda kichraytirib
// yuboramiz; xato bo'lsa originalga qaytamiz, ya'ni saqlash buzilmaydi.
const WAREHOUSE_IMAGE_MAX_EDGE = 1600;
const WAREHOUSE_IMAGE_QUALITY = 0.82;

async function compressImageDataUrl(dataUrl) {
  const source = String(dataUrl || "");
  if (!source.startsWith("data:image/")) return source;
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = source;
    });
    const longestEdge = Math.max(img.naturalWidth, img.naturalHeight);
    if (!longestEdge) return source;
    const scale = Math.min(1, WAREHOUSE_IMAGE_MAX_EDGE / longestEdge);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return source;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL("image/jpeg", WAREHOUSE_IMAGE_QUALITY);
    // Allaqachon kichik rasm siqilgandan keyin kattalashib ketmasin.
    return compressed.length < source.length ? compressed : source;
  } catch {
    return source;
  }
}

async function readImageAsDataUrl(file) {
  if (!file) return "";
  const raw = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
  return compressImageDataUrl(raw);
}

function warehouseMediaEndpoints() {
  return [API_SALES_CHECK_FILE_URL, "http://127.0.0.1:8000/api/sales-check-file", "http://localhost:8000/api/sales-check-file"];
}

function parseWarehouseImageFileName(imageUrl) {
  const value = String(imageUrl || "").trim();
  if (!value || !value.includes("/api/sales-check-file")) return "";
  try {
    const base = new URL(value, window.location.origin);
    return String(base.searchParams.get("file_name") || "").trim();
  } catch {
    return "";
  }
}

async function saveWarehouseImageToServer(fileName, dataUrl) {
  if (!dataUrl) return "";
  for (const endpoint of warehouseMediaEndpoints()) {
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

async function deleteWarehouseImageFromServer(imageUrl) {
  const fileName = parseWarehouseImageFileName(imageUrl);
  if (!fileName) return false;
  for (const endpoint of warehouseMediaEndpoints()) {
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

async function onIncomingSubmit(e) {
  e.preventDefault();
  if (!canWarehouseAdmin()) return;
  const orders = ensureWarehouseOrders();
  const order = orders.find((x) => x.id === state.editingOrderId);
  if (!order) return;
  const fd = new FormData(refs.incomingForm);
  const model = String(fd.get("model") || "").trim();
  const info = String(fd.get("info") || "").trim();
  const qty = parseNumericInput(fd.get("qty") || 0);
  const stageKey = normalizeIncomingStageKey(fd.get("stageKey"));
  const eta = String(fd.get("eta") || "");
  if (state.incomingEditMode !== "stage" && (!model || qty <= 0)) {
    showToast(t("fillRequired"));
    return;
  }
  // Bosqich tahriri rasmni umuman ishlatmaydi, lekin fayl maydonida shu
  // sessiyadagi oldingi tahrirdan qolgan rasm turgan bo'lishi mumkin edi.
  // Uni bu yerda yuklash har bir bosqich o'zgarishida yangi nusxa yaratib,
  // so'ng URL ni tashlab yuborardi - 199 MB dublikat aynan shundan.
  const imageFile = state.incomingEditMode === "stage"
    ? null
    : (refs.incomingForm.image.files?.[0] || null);
  const imageDataUrl = await readImageAsDataUrl(imageFile);
  let imageUrl = imageDataUrl;
  if (imageDataUrl) {
    const mediaFileName = `warehouse_incoming_${Date.now()}`;
    const uploadedUrl = await saveWarehouseImageToServer(mediaFileName, imageDataUrl);
    if (REMOTE_DB_ENABLED && !uploadedUrl) {
      showToast(t("saveFailed"));
      return;
    }
    if (uploadedUrl) imageUrl = uploadedUrl;
  }
  if (state.incomingEditMode === "stage") {
    order.stageKey = stageKey;
    order.eta = eta;
    order.updatedAt = new Date().toISOString();
  } else if (state.editingIncomingItemId) {
    const target = (order.items || []).find((x) => x.id === state.editingIncomingItemId);
    if (!target) return;
    target.model = model;
    target.info = info;
    target.qty = qty;
    if (imageUrl) {
      await deleteWarehouseImageFromServer(target.imageUrl || "");
      target.imageUrl = imageUrl;
    }
    target.updatedAt = new Date().toISOString();
  } else {
    order.items.unshift({
      id: uid("incoming"),
      imageUrl,
      model,
      info,
      qty,
      stageKey,
      eta,
      createdAt: new Date().toISOString(),
    });
  }
  state.editingOrderId = null;
  state.editingIncomingItemId = null;
  state.incomingEditMode = "full";
  refs.incomingForm.reset();
  toggleModal(refs.incomingModal, false);
  await persistWarehouseChanges();
  renderWarehouse();
}

async function onStockSubmit(e) {
  e.preventDefault();
  if (!canWarehouseAdmin()) return;
  const fd = new FormData(refs.stockForm);
  const model = String(fd.get("model") || "").trim();
  const info = String(fd.get("info") || "").trim();
  const qty = parseNumericInput(fd.get("qty") || 0);
  const status = qty === 0 ? "unavailable" : normalizeStockStatus(fd.get("status"));
  let locationWarehouse = refs.stockLocationWarehouse.checked;
  let locationShowroom = refs.stockLocationShowroom.checked;
  let storeId = String(fd.get("storeId") || "");
  if (!canWarehouseAdmin()) {
    locationWarehouse = false;
    locationShowroom = true;
    storeId = state.user.storeId;
  }
  if (!locationWarehouse && !locationShowroom) {
    showToast(t("fillRequired"));
    return;
  }
  if (!model || qty < 0) {
    showToast(t("fillRequired"));
    return;
  }
  if (locationShowroom && !storeId) {
    showToast(t("fillRequired"));
    return;
  }
  const imageFile = refs.stockForm.image.files?.[0] || null;
  const imageDataUrl = await readImageAsDataUrl(imageFile);
  let imageUrl = imageDataUrl;
  if (imageDataUrl) {
    const mediaFileName = `warehouse_stock_${Date.now()}`;
    const uploadedUrl = await saveWarehouseImageToServer(mediaFileName, imageDataUrl);
    if (REMOTE_DB_ENABLED && !uploadedUrl) {
      showToast(t("saveFailed"));
      return;
    }
    if (uploadedUrl) imageUrl = uploadedUrl;
  }

  if (state.editingStockId) {
    const row = state.db.warehouseStock.find((x) => x.id === state.editingStockId);
    if (!row || !canManageStockRow(row)) return;
    const nextLocation = canWarehouseAdmin()
      ? (locationWarehouse && locationShowroom ? "both" : (locationWarehouse ? "warehouse" : "showroom"))
      : "showroom";
    row.model = model;
    row.info = info;
    row.qty = qty;
    row.status = status;
    row.locationType = nextLocation;
    row.storeId = row.locationType === "warehouse" ? "" : (canWarehouseAdmin() ? storeId : state.user.storeId);
    if (imageUrl) {
      await deleteWarehouseImageFromServer(row.imageUrl || "");
      row.imageUrl = imageUrl;
    }
    row.updatedAt = new Date().toISOString();
  } else {
    const locationType = canWarehouseAdmin()
      ? (locationWarehouse && locationShowroom ? "both" : (locationWarehouse ? "warehouse" : "showroom"))
      : "showroom";
    const nextStoreId = locationType === "warehouse" ? "" : (canWarehouseAdmin() ? storeId : state.user.storeId);
    const existing = state.db.warehouseStock.find((x) => x.model.toLowerCase() === model.toLowerCase() && x.locationType === locationType && (x.storeId || "") === (nextStoreId || ""));
    if (existing) {
      if (!canManageStockRow(existing)) return;
      existing.info = info;
      existing.qty = qty;
      existing.status = status;
      if (imageUrl) {
        await deleteWarehouseImageFromServer(existing.imageUrl || "");
        existing.imageUrl = imageUrl;
      }
      existing.updatedAt = new Date().toISOString();
    } else {
      const row = {
        id: uid("stock"),
        imageUrl,
        model,
        info,
        qty,
        locationType,
        storeId: nextStoreId,
        status,
        updatedAt: new Date().toISOString(),
      };
      if (!canManageStockRow(row)) return;
      state.db.warehouseStock.unshift(row);
    }
  }
  closeStockModal();
  await persistWarehouseChanges();
  renderWarehouse();
}

async function exportIncomingExcel(orderId) {
  if (!canWarehouseAdmin()) return;
  const order = ensureWarehouseOrders().find((x) => x.id === orderId);
  if (!order) return;
  const headers = [
    t("number"),
    t("furnitureImage"),
    t("furnitureModel"),
    t("furnitureInfo"),
    t("quantity"),
    t("stage"),
    t("eta"),
  ];
  const rows = (order.items || []).map((row, idx) => [
    idx + 1,
    row.imageUrl || "",
    row.model || "",
    row.info || "",
    numberFmt(row.qty || 0),
    incomingStageLabel(row.stageKey || row.stage),
    row.eta || "",
  ]);
  await exportRowsToExcel({
    title: t("incomingList"),
    sheetName: t("incomingTitle"),
    fileName: `incoming_orders_${state.lang}.xlsx`,
    headers,
    rows,
    imageColumnIndex: 1,
  });
}

async function importIncomingExcel(e, orderId) {
  if (!canWarehouseAdmin()) return;
  const order = ensureWarehouseOrders().find((x) => x.id === orderId);
  if (!order) return;
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const records = await importExcelFile(file);
    let imported = 0;
    let skipped = 0;
    for (const r of records) {
      const model = String(excelPickI18n(r, "furnitureModel", ["Model", "Mebel modeli"])).trim();
      if (!model) {
        skipped += 1;
        continue;
      }
      const qty = Number(excelPickI18n(r, "quantity", ["Qty", "Soni", "Nechta"]) || 0);
      const info = String(excelPickI18n(r, "furnitureInfo", ["Info", "Ma'lumoti"])).trim();
      const stageKey = normalizeIncomingStageKey(excelPickI18n(r, "stage", ["Stage", "Bosqich"]) || "from_china");
      const eta = String(excelPickI18n(r, "eta", ["ETA", "Taxminiy sana"])).trim();
      let imageUrl = "";
      if (r.__image) {
        const dataUrl = await compressImageDataUrl(excelImageToDataUrl(r.__image));
        imageUrl = await saveWarehouseImageToServer(`warehouse_incoming_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, dataUrl);
      } else {
        imageUrl = String(excelPickI18n(r, "furnitureImage", ["Image", "Rasm"])).trim();
      }
      order.items.unshift({
        id: uid("incoming"),
        imageUrl,
        model,
        info,
        qty: Math.max(0, qty || 0),
        stageKey,
        eta,
        createdAt: new Date().toISOString(),
      });
      imported += 1;
    }
    await persistWarehouseChanges();
    renderWarehouse();
    if (!imported) showToast(t("importedNone"), "error");
    else showToast(template(t("importedCount"), { imported, skipped }));
  } catch {
    showToast(t("saveFailed"), "error");
  } finally {
    e.target.value = "";
  }
}

async function exportStockExcel() {
  if (!canWarehouseAdmin()) return;
  const headers = [
    t("number"),
    t("furnitureImage"),
    t("furnitureModel"),
    t("furnitureInfo"),
    t("locationType"),
    t("store"),
    t("quantity"),
    t("status"),
    t("reserveColumn"),
    t("reserveFor"),
    t("reserveReason"),
  ];
  const rows = getFilteredStockRows().map((row, idx) => {
    const store = getStore(row.storeId);
    return [
      idx + 1,
      row.imageUrl || "",
      row.model || "",
      row.info || "",
      stockLocationLabel(row.locationType),
      row.locationType === "warehouse" ? t("warehouseOnly") : (store?.name || ""),
      numberFmt(row.qty || 0),
      stockStatusLabel(row.status),
      row.reservation ? reserveOwnerLabel(row) : "",
      row.reservation?.reservedFor || "",
      row.reservation?.note || "",
    ];
  });
  await exportRowsToExcel({
    title: t("stockList"),
    sheetName: t("stockTitle"),
    fileName: `warehouse_stock_${state.lang}.xlsx`,
    headers,
    rows,
    imageColumnIndex: 1,
  });
}

async function importStockExcel(e) {
  if (!canWarehouseAdmin()) return;
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const records = await importExcelFile(file);
    let imported = 0;
    let skipped = 0;
    for (const r of records) {
      const model = String(excelPickI18n(r, "furnitureModel", ["Model", "Mebel modeli"])).trim();
      if (!model) {
        skipped += 1;
        continue;
      }
      const qty = Math.max(0, Number(excelPickI18n(r, "quantity", ["Qty", "Soni"]) || 0));
      const info = String(excelPickI18n(r, "furnitureInfo", ["Info", "Ma'lumoti"])).trim();
      const status = normalizeStockStatus(excelPickI18n(r, "status", ["Status", "Holat"]) || "available");
      const locationRaw = String(excelPickI18n(r, "locationType", ["Location", "Joylashuv"]) || "showroom").toLowerCase();
      const hasWarehouse = locationRaw.includes("ombor") || locationRaw.includes("warehouse");
      const hasStore = locationRaw.includes("do'kon") || locationRaw.includes("showroom") || locationRaw.includes("shop") || locationRaw.includes("store");
      const locationType = hasWarehouse && hasStore ? "both" : (hasWarehouse ? "warehouse" : "showroom");
      const storeName = String(excelPickI18n(r, "store", ["Store", "Do'kon"])).trim().toLowerCase();
      const store = state.db.stores.find((s) => s.name.toLowerCase() === storeName);
      const storeId = locationType === "warehouse" ? "" : (store?.id || "");
      if (locationType !== "warehouse" && !storeId) {
        skipped += 1;
        continue;
      }
      let imageUrl = "";
      if (r.__image) {
        const dataUrl = await compressImageDataUrl(excelImageToDataUrl(r.__image));
        imageUrl = await saveWarehouseImageToServer(`warehouse_stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, dataUrl);
      } else {
        imageUrl = String(excelPickI18n(r, "furnitureImage", ["Image", "Rasm"])).trim();
      }
      state.db.warehouseStock.unshift({
        id: uid("stock"),
        imageUrl,
        model,
        info,
        qty,
        locationType,
        storeId,
        status,
        updatedAt: new Date().toISOString(),
      });
      imported += 1;
    }
    await persistWarehouseChanges();
    renderWarehouse();
    if (!imported) showToast(t("importedNone"), "error");
    else showToast(template(t("importedCount"), { imported, skipped }));
  } catch {
    showToast(t("saveFailed"), "error");
  } finally {
    e.target.value = "";
  }
}

