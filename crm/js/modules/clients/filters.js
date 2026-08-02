const CUSTOM_FILTER_ICONS = {
  telegram: '<svg viewBox="0 0 24 24" width="15" height="15" fill="#229ed9" aria-hidden="true"><path d="M21.94 3.36 2.7 10.86c-1.28.5-1.27 1.2-.23 1.52l4.93 1.54 1.91 5.86c.23.63.35.88.78.88.36 0 .53-.16.75-.37l1.8-1.75 3.98 2.94c.85.47 1.46.23 1.68-.79l3.04-14.33c.31-1.25-.46-1.83-1.5-1.4Zm-11.63 9.9-1.5-4.6L18.02 6l-7.71 7.26Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="15" height="15" fill="#1877f2" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34v7.03C18.34 21.24 22 17.08 22 12.06Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="15" height="15" fill="#d6249f" aria-hidden="true"><path d="M12 2c-2.72 0-3.06.01-4.13.06-1.06.05-1.79.22-2.43.47a4.9 4.9 0 0 0-1.77 1.15A4.9 4.9 0 0 0 2.53 5.44c-.25.64-.42 1.37-.47 2.43C2.01 8.94 2 9.28 2 12s.01 3.06.06 4.13c.05 1.06.22 1.79.47 2.43a4.9 4.9 0 0 0 1.15 1.77 4.9 4.9 0 0 0 1.77 1.15c.64.25 1.37.42 2.43.47C8.94 21.99 9.28 22 12 22s3.06-.01 4.13-.06c1.06-.05 1.79-.22 2.43-.47a4.9 4.9 0 0 0 1.77-1.15 4.9 4.9 0 0 0 1.15-1.77c.25-.64.42-1.37.47-2.43.05-1.07.06-1.41.06-4.13s-.01-3.06-.06-4.13c-.05-1.06-.22-1.79-.47-2.43a4.9 4.9 0 0 0-1.15-1.77A4.9 4.9 0 0 0 18.56 2.53c-.64-.25-1.37-.42-2.43-.47C15.06 2.01 14.72 2 12 2Zm0 3.05c2.67 0 2.99.01 4.04.06.98.05 1.5.2 1.86.34.47.18.8.4 1.15.75.35.35.57.68.75 1.15.14.36.29.88.34 1.86.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.05.98-.2 1.5-.34 1.86-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.14-.88.29-1.86.34-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.98-.05-1.5-.2-1.86-.34a3.1 3.1 0 0 1-1.15-.75 3.1 3.1 0 0 1-.75-1.15c-.14-.36-.29-.88-.34-1.86-.05-1.05-.06-1.37-.06-4.04s.01-2.99.06-4.04c.05-.98.2-1.5.34-1.86.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.14.88-.29 1.86-.34 1.05-.05 1.37-.06 4.04-.06Zm0 3.05a5.15 5.15 0 1 0 0 10.3 5.15 5.15 0 0 0 0-10.3Zm0 8.5a3.35 3.35 0 1 1 0-6.7 3.35 3.35 0 0 1 0 6.7Zm5.35-8.7a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z"/></svg>',
};

function customFilterOptionLabel(item) {
  const icon = CUSTOM_FILTER_ICONS[item.dataset.icon || ""] || "";
  const text = escapeHtml(item.textContent || "");
  return icon ? `<span class="custom-filter-icon">${icon}</span>${text}` : text;
}

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

  select.hidden = true;  select.classList.add("no-custom-select");
  const selected = Array.from(select.options).find((item) => item.value === select.value);
  const btnOption = selected || select.options[0];
  btn.innerHTML = btnOption ? customFilterOptionLabel(btnOption) : "";
  btn.disabled = Boolean(select.disabled);
  wrap.classList.toggle("is-disabled", Boolean(select.disabled));
  menu.innerHTML = Array.from(select.options).map((item) => {
    const active = item.value === select.value ? "active" : "";
    return `<button class="custom-filter-option ${active}" type="button" data-filter-value="${escapeHtml(item.value)}">${customFilterOptionLabel(item)}</button>`;
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
  if (field === "storeId" && ["admin", "director", "hr", "targetolog", "community_manager", "employee"].includes(state.user.role)) {
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
