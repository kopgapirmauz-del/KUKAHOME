function enhanceSelectAsCustom(selectOrId) {
  const select = typeof selectOrId === "string" ? document.getElementById(selectOrId) : selectOrId;
  if (!select || select.tagName !== "SELECT") return;

  let wrap = select.closest(".custom-filter-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "custom-filter-wrap";
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
  }

  let btn = wrap.querySelector(":scope > .custom-filter-btn");
  let menu = wrap.querySelector(":scope > .custom-filter-menu");
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "custom-filter-btn";
    wrap.insertBefore(btn, select);
  }
  if (!menu) {
    menu = document.createElement("div");
    menu.className = "custom-filter-menu hidden";
    wrap.insertBefore(menu, select);
  }

  select.hidden = true;
  const selected = Array.from(select.options).find((item) => item.value === select.value);
  btn.textContent = selected?.textContent || select.options[0]?.textContent || "";
  btn.disabled = Boolean(select.disabled);
  wrap.classList.toggle("is-disabled", Boolean(select.disabled));
  menu.innerHTML = Array.from(select.options).map((item) => {
    const active = item.value === select.value ? "active" : "";
    return `<button class="custom-filter-option ${active}" type="button" data-filter-value="${escapeHtml(item.value)}">${escapeHtml(item.textContent || "")}</button>`;
  }).join("");

  menu.querySelectorAll("button[data-filter-value]").forEach((optionBtn) => {
    optionBtn.addEventListener("click", () => {
      select.value = optionBtn.dataset.filterValue || "";
      menu.classList.add("hidden");
      if (select.id === "stockLocationFilter") {
        state.stockLocationFilter = select.value;
        if (state.stockLocationFilter === "warehouse") state.stockStoreFilter = "";
      }
      if (select.id === "stockStoreFilter") {
        state.stockStoreFilter = select.value;
      }
      select.dispatchEvent(new Event("change", { bubbles: true }));
      enhanceSelectAsCustom(select);
    });
  });

  if (wrap.dataset.customFilterBound === "1") return;
  wrap.dataset.customFilterBound = "1";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    document.querySelectorAll(".custom-filter-menu").forEach((el) => {
      if (el !== menu) el.classList.add("hidden");
    });
    menu.classList.toggle("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) menu.classList.add("hidden");
  });
}

function renderFilters() {
  updateClientsToolbarAccess();
  refs.statusFilter.innerHTML = [
    option("", t("allStatus")),
    option("green", t("green")),
    option("yellow", t("yellow")),
    option("red", t("red")),
  ].join("");
  refs.sourceFilter.innerHTML = [
    option("", t("allSources")),
    option("website", t("sourceWebsite")),
    option("meta", t("sourceMeta")),
    option("instagram", t("sourceInstagram")),
    option("telegram", t("sourceTelegram")),
    option("new_client", t("sourceNewClient")),
    option("old_client", t("sourceOldClient")),
    option("potential_client", t("sourcePotential")),
    option("partnership", t("sourcePartnership")),
    option("broker", t("sourceBroker")),
    option("interior_designer", t("sourceInteriorDesigner")),
  ].join("");
  refs.attendanceFilter.innerHTML = [
    option("", t("allAttendance")),
    option("yes", t("attendedYes")),
    option("no", t("attendedNo")),
  ].join("");
  refs.storeFilter.innerHTML = [
    option("", t("allStores")),
    ...state.db.stores.map((s) => option(s.id, s.name)),
  ].join("");
  const allowedManagers = managersByStore(state.filters.storeId);
  refs.managerFilter.innerHTML = [
    option("", t("allManagers")),
    ...allowedManagers.map((m) => option(m.id, `${m.firstName} ${m.lastName}`)),
  ].join("");
  if (state.filters.managerId && !allowedManagers.some((m) => m.id === state.filters.managerId)) {
    state.filters.managerId = "";
  }
  const managerMode = state.user.role === "manager";
  refs.storeFilter.disabled = managerMode;
  refs.managerFilter.disabled = managerMode;
  refs.statusFilter.value = state.filters.status;
  refs.sourceFilter.value = state.filters.source;
  refs.attendanceFilter.value = state.filters.attended;
  refs.storeFilter.value = state.filters.storeId;
  refs.managerFilter.value = state.filters.managerId;
  refs.searchInput.value = state.filters.search;
  renderClientFilterMenus();
}

function renderClientFilterMenus() {
  [
    { key: "status", field: "status" },
    { key: "source", field: "source" },
    { key: "attendance", field: "attended" },
    { key: "store", field: "storeId" },
    { key: "manager", field: "managerId" },
  ].forEach(renderClientFilterMenu);
}

function closeClientFilterMenus(exceptKey = "") {
  ["status", "source", "attendance", "store", "manager"].forEach((key) => {
    if (key === exceptKey) return;
    refs[`${key}FilterMenu`]?.classList.add("hidden");
  });
}

function renderClientFilterMenu({ key, field }) {
  const select = refs[`${key}Filter`];
  const wrap = refs[`${key}FilterWrap`];
  const btn = refs[`${key}FilterBtn`];
  const menu = refs[`${key}FilterMenu`];
  if (!select || !wrap || !btn || !menu) return;

  const selected = Array.from(select.options).find((item) => item.value === String(state.filters[field] || ""));
  btn.textContent = selected?.textContent || select.options[0]?.textContent || "";
  btn.disabled = Boolean(select.disabled);
  wrap.classList.toggle("is-disabled", Boolean(select.disabled));
  menu.innerHTML = Array.from(select.options).map((item) => {
    const active = item.value === String(state.filters[field] || "") ? "active" : "";
    return `<button class="custom-filter-option ${active}" type="button" data-filter-value="${escapeHtml(item.value)}">${escapeHtml(item.textContent || "")}</button>`;
  }).join("");

  menu.querySelectorAll("button[data-filter-value]").forEach((optionBtn) => {
    optionBtn.addEventListener("click", () => {
      menu.classList.add("hidden");
      onFilterChange(field, optionBtn.dataset.filterValue || "");
    });
  });

  if (wrap.dataset.bound === "1") return;
  wrap.dataset.bound = "1";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    const willOpen = menu.classList.contains("hidden");
    closeClientFilterMenus(key);
    menu.classList.toggle("hidden", !willOpen);
  });
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) menu.classList.add("hidden");
  });
}

function updateClientsToolbarAccess() {
  const readOnly = typeof isClientReadOnlyRole === "function" ? isClientReadOnlyRole() : false;
  const canCreate = typeof canCreateClientBase === "function" ? canCreateClientBase() : false;
  if (refs.addClientBtn) refs.addClientBtn.classList.toggle("hidden", !canCreate);
  if (refs.exportBtn) refs.exportBtn.classList.toggle("hidden", readOnly);
  if (refs.excelInput) {
    const importWrap = refs.excelInput.closest(".toolbar-btn-import");
    if (importWrap) importWrap.classList.toggle("hidden", readOnly);
  }
}

function onFilterChange(field, value) {
  state.filters[field] = value;
  renderClientFilterMenus();
  if (field === "storeId" && state.user.role === "admin") {
    const allowedManagerIds = new Set(managersByStore(value).map((m) => m.id));
    if (state.filters.managerId && !allowedManagerIds.has(state.filters.managerId)) {
      state.filters.managerId = "";
    }
    renderFilters();
  }
  state.pageIndex = 1;
  renderTableWithLoading();
}

function clearFilters() {
  state.filters.search = "";
  state.filters.status = "";
  state.filters.source = "";
  state.filters.attended = "";
  state.filters.storeId = "";
  state.filters.managerId = "";
  state.dateRange = { from: "", to: "" };
  refs.dateRangeForm.reset();
  updateDateChip();
  renderFilters();
  renderTableWithLoading();
}

function openDateRangeModal(mode = "clients") {
  state.dateModalMode = mode === "hr" ? "hr" : "clients";
  const activeRange = state.dateModalMode === "hr" ? state.hrDateRange : state.dateRange;
  refs.dateRangeForm.from.value = activeRange.from || "";
  refs.dateRangeForm.to.value = activeRange.to || "";
  closeSidebar();
  toggleModal(refs.dateModal, true);
}

function onDateRangeSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.dateRangeForm);
  const nextRange = {
    from: String(fd.get("from") || ""),
    to: String(fd.get("to") || ""),
  };
  if (state.dateModalMode === "hr") state.hrDateRange = nextRange;
  else state.dateRange = nextRange;
  toggleModal(refs.dateModal, false);
  updateDateChip();
  if (state.dateModalMode === "hr") {
    if (typeof renderHRDashboard === "function") renderHRDashboard();
  } else {
    state.pageIndex = 1;
    renderTableWithLoading();
  }
}

function clearDateRange() {
  if (state.dateModalMode === "hr") state.hrDateRange = { from: "", to: "" };
  else state.dateRange = { from: "", to: "" };
  refs.dateRangeForm.reset();
  toggleModal(refs.dateModal, false);
  updateDateChip();
  if (state.dateModalMode === "hr") {
    if (typeof renderHRDashboard === "function") renderHRDashboard();
  } else {
    renderTableWithLoading();
  }
}

function applyPresetRange(type) {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from = to;
  if (type === "last7") from = shiftDate(now, -6);
  if (type === "last30") from = shiftDate(now, -29);
  if (type === "thisMonth") from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  if (type === "thisYear") from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  refs.dateRangeForm.from.value = from;
  refs.dateRangeForm.to.value = to;
  if (state.dateModalMode === "hr") state.hrDateRange = { from, to };
  else state.dateRange = { from, to };
  document.querySelectorAll(".preset-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.range === type));
  updateDateChip();
  if (state.dateModalMode === "hr") {
    if (typeof renderHRDashboard === "function") renderHRDashboard();
  } else {
    renderTableWithLoading();
  }
}

function updateDateChip() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.dateRange.from || state.dateRange.to) {
    refs.dateFilterBtn.textContent = `${fmtDate(state.dateRange.from || "-")} - ${fmtDate(state.dateRange.to || "-")}`;
  } else {
    refs.dateFilterBtn.textContent = `${t("today")}: ${fmtDate(today)}`;
  }
  if (!refs.hrDateFilterBtn) return;
  if (state.hrDateRange.from || state.hrDateRange.to) {
    refs.hrDateFilterBtn.textContent = `${fmtDate(state.hrDateRange.from || "-")} - ${fmtDate(state.hrDateRange.to || "-")}`;
    return;
  }
  refs.hrDateFilterBtn.textContent = `${t("today")}: ${fmtDate(today)}`;
}
