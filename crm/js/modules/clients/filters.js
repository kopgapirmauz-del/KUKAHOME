function renderFilters() {
  refs.statusFilter.innerHTML = [
    option("", t("allStatus")),
    option("green", t("green")),
    option("yellow", t("yellow")),
    option("red", t("red")),
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
  refs.attendanceFilter.value = state.filters.attended;
  refs.storeFilter.value = state.filters.storeId;
  refs.managerFilter.value = state.filters.managerId;
  refs.searchInput.value = state.filters.search;
}

function onFilterChange(field, value) {
  state.filters[field] = value;
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
  state.filters.attended = "";
  state.filters.storeId = state.user.role === "manager" ? state.user.storeId : "";
  state.filters.managerId = state.user.role === "manager" ? state.user.id : "";
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
