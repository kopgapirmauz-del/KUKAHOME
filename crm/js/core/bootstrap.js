async function init() {
  cacheRefs();
  await seedDB();
  purgeDemoSalesChecks();
  bindEvents();
  setLanguage("uz");
  restoreRememberedCredentials();
  await restoreSession();
  startRemoteSync();
}

function purgeDemoSalesChecks() {
  state.db.salesChecks = Array.isArray(state.db.salesChecks) ? state.db.salesChecks : [];
  const before = state.db.salesChecks.length;
  state.db.salesChecks = state.db.salesChecks.filter((row) => {
    const receipt = String(row?.receiptUrl || "");
    return !receipt.startsWith("data:text/plain,Demo%20Sotuv%20Cheki%20%23");
  });
  if (state.db.salesChecks.length !== before) saveDB();
}

function cacheRefs() {
  const ids = [
    "authView", "appView", "loginForm", "authHelp", "rememberMe", "authLangBtn", "authLangMenu", "langBtn", "langMenu", "profileName", "profileRole",
    "profileStore", "dateFilterBtn", "logoutBtn", "addClientBtn", "menuToggle", "sidebar", "sidebarBackdrop", "pageTitle", "pageSubtitle",
    "clientsPage", "settingsPage", "integrationsPage", "warehousePage", "salesPage", "hrPage", "warrantyPage", "priceLabelPage", "searchInput", "statusFilter", "attendanceFilter", "storeFilter", "managerFilter", "clearFilters", "excelInput", "exportBtn",
    "tableHeadRow", "clientsTbody", "pagination", "countInfo", "tableLoading", "clientModal",
    "clientModalTitle", "clientForm", "closeClientModal", "dateModal", "dateRangeForm", "clearDateRange", "toast", "profileForm", "adminLoginField",
    "adminSettings", "managerForm", "managerStoreField", "managerStoreSelect", "managerList", "storeForm", "storeList",
    "openManagerModal", "openStoreModal", "managerModal", "storeModal", "closeManagerModal", "closeStoreModal", "storeModalTitle",
    "passwordForm", "passwordSettingsCard", "managerEditModal", "managerEditForm", "managerEditStoreField", "managerEditStoreSelect", "managerRoleSelect", "managerEditRoleSelect", "closeManagerEditModal",
    "notifBtn", "notifMenu", "notifCount", "notifList", "notifMarkRead", "notifPager", "notifPrev", "notifNext", "notifPageInfo",
    "warehouseTabs", "warehouseBackWrap", "warehouseBackBtn", "warehouseIncomingTab", "warehouseStockTab", "incomingSection", "stockSection", "incomingOrdersList", "addIncomingOrderBtn", "incomingForm", "incomingFullFields", "incomingStageFields", "stockForm", "stockTbody", "stockStoreSelect", "stockSearchInput", "stockExportBtn", "stockImportInput", "stockLocationFilter", "stockStoreFilter", "addStockBtn", "stockModal", "stockModalTitle", "closeStockModal", "stockLocationWarehouse", "stockLocationShowroom", "stockReserveModal", "stockReserveForm", "closeStockReserveModal", "deleteStockReserveBtn", "salesSearchInput", "salesStoreFilter", "salesManagerFilter", "salesExportBtn", "salesClearFilters", "addSalesCheckBtn", "salesTbody", "salesCountInfo", "salesPagination", "salesCheckModal", "salesCheckForm", "salesStoreSelect", "salesManagerSelect", "salesItemsRows", "addSalesItemRowBtn", "closeSalesCheckModal", "saveSalesCheckBtn", "warrantySearchInput", "warrantyStoreFilter", "warrantyManagerFilter", "warrantyExportBtn", "warrantyClearFilters", "addWarrantyTicketBtn", "warrantyTbody", "warrantyCountInfo", "warrantyPagination", "warrantyTicketModal", "warrantyTicketModalTitle", "warrantyTicketForm", "warrantyTicketStoreSelect", "warrantyTicketManagerSelect", "closeWarrantyTicketModal", "saveWarrantyTicketBtn", "hrDateFilterBtn", "hrSummaryGrid", "hrAttendanceChart", "hrPunctualityRing", "hrTopManagers", "hrLateLeaders", "hrVacancyCount", "hrVacancyTbody", "hrCreateVacancyForm", "hrVacancyPositionInput", "hrVacancyRegulationInput", "hrCreateVacancyCancelBtn", "settingsProfileTab", "settingsUsersTab", "settingsProfilePage", "settingsUsersPage", "incomingModal", "incomingModalTitle", "closeIncomingModal", "incomingStageSelect", "confirmModal", "confirmModalTitle", "confirmModalMessage", "confirmOkBtn", "confirmCancelBtn", "mobileDock", "mobileDockSlot1", "mobileDockSlot2", "mobileDockSlot3", "mobileDockSlot4", "mobileDockSlot5", "mobileMoreBtn", "mobileMoreSheet", "mobileMoreBackdrop", "mobileMoreClose", "mobileMoreList", "scrollTopBtn",
  ];
  ids.push("integrationSettingsModal");
  ids.forEach((id) => {
    refs[id] = document.getElementById(id);
  });
}

async function seedDB() {
  const existing = localStorage.getItem(LS_DB);
  let localDB = null;
  if (existing) {
    try {
      localDB = normalizeDBShape(JSON.parse(existing));
    } catch {
      localDB = null;
      localStorage.removeItem(LS_DB);
    }
  }

  if (REMOTE_DB_ENABLED) {
    const remoteDB = await fetchRemoteDB();
    if (remoteDB && hasCoreData(remoteDB)) {
      if (localDB && hasCoreData(localDB)) {
        const remoteExtended = extendedDataScore(remoteDB);
        const localExtended = extendedDataScore(localDB);
        if (remoteExtended === 0 && localExtended > 0) {
          state.db = localDB;
          localStorage.setItem(LS_DB, JSON.stringify(state.db));
          await pushRemoteDB(state.db);
          return;
        }
      }
      state.db = normalizeDBShape(remoteDB);
      localStorage.setItem(LS_DB, JSON.stringify(state.db));
      return;
    }
    if (localDB && hasCoreData(localDB)) {
      state.db = localDB;
      localStorage.setItem(LS_DB, JSON.stringify(state.db));
      return;
    }
    state.db = createDefaultDB();
    localStorage.setItem(LS_DB, JSON.stringify(state.db));
    await pushRemoteDB(state.db);
    return;
  }

  if (localDB && hasCoreData(localDB)) {
    state.db = localDB;
    return;
  }
  state.db = createDefaultDB();
  localStorage.setItem(LS_DB, JSON.stringify(state.db));
}

function extendedDataScore(db) {
  const safe = db && typeof db === "object" ? db : {};
  const lists = [
    safe.salesChecks,
    safe.warehouseOrders,
    safe.warehouseIncoming,
    safe.warehouseStock,
    safe.warrantyTickets,
    safe.vacancies,
    safe.vacancyOpenings,
  ];
  return lists.reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
}

function createDefaultDB() {
  const db = {
    meta: { updatedAt: new Date().toISOString() },
    stores: [],
    users: [],
    notifications: [],
    clients: [],
    salesChecks: [],
    warehouseOrders: [],
    warehouseIncoming: [],
    warehouseStock: [],
    warrantyTickets: [],
  };
  const admin = {
    id: uid("user"),
    role: "admin",
    login: "admin",
    password: "admin123",
    phone: "",
    firstName: "Asosiy",
    lastName: "Admin",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&auto=format&fit=crop",
    storeId: "",
  };
  db.users.push(admin);
  return db;
}

function ensureDemoSalesChecks() {
  state.db.salesChecks = Array.isArray(state.db.salesChecks) ? state.db.salesChecks : [];
  if (state.db.salesChecks.length) return;

  if (!state.db.stores.length) {
    state.db.stores.push(
      { id: uid("store"), name: "Arca" },
      { id: uid("store"), name: "Sergeli" },
      { id: uid("store"), name: "Chilonzor" },
    );
  }

  const managerUsers = managers();
  if (!managerUsers.length) {
    const firstStore = state.db.stores[0]?.id || "";
    state.db.users.push(
      { id: uid("user"), role: "manager", login: "sotuvchi1", password: "12345", phone: "", firstName: "Ali", lastName: "Karimov", avatar: defaultAvatar(), storeId: firstStore },
      { id: uid("user"), role: "manager", login: "sotuvchi2", password: "12345", phone: "", firstName: "Sardor", lastName: "Qodirov", avatar: defaultAvatar(), storeId: state.db.stores[1]?.id || firstStore },
      { id: uid("user"), role: "manager", login: "sotuvchi3", password: "12345", phone: "", firstName: "Javohir", lastName: "Ergashev", avatar: defaultAvatar(), storeId: state.db.stores[2]?.id || firstStore },
    );
  }

  const sellers = managers();
  const now = new Date();
  const demoRows = [0, 1, 2].map((i) => {
    const seller = sellers[i % sellers.length] || state.db.users[0];
    const storeId = seller.storeId || state.db.stores[i % state.db.stores.length]?.id || "";
    const createdAt = new Date(now.getTime() - i * 86400000).toISOString();
    return {
      id: uid("sale"),
      checkNo: i + 1,
      storeId,
      managerId: seller.id,
      createdAt,
      orderDate: createdAt.slice(0, 10),
      receiptUrl: `data:text/plain,Demo%20Sotuv%20Cheki%20%23${i + 1}`,
      receiptDataUrl: "",
      receiptFileName: `sales_check_${i + 1}.pdf`,
      formData: {
        customerName: ["Dilshod Akbarov", "Madina Yusupova", "Umid Xasanov"][i],
        customerPhone: ["+998901112233", "+998998887766", "+998935551144"][i],
        orderDate: createdAt.slice(0, 10),
        sellerPhone: ["+998901234567", "+998907654321", "+998909090909"][i],
        deliveryDate: createdAt.slice(0, 10),
        deliveryAddress: ["Yunusobod 12", "Chilonzor 18", "Sergeli 6"][i],
        totalAmount: ["28 000 000 UZS", "18 500 000 UZS", "2200 USD"][i],
        prepayment: ["10 000 000 UZS", "8 000 000 UZS", "500 USD"][i],
        customerFloor: "5-qavat",
        elevatorInfo: "Bor, 1.2x2.0",
        deliveryPaid: "Ha",
        doorFits: "Ha",
        agreesNoReturn: "Ha",
        warnedAboutIssue: "Ha",
        items: [
          { model: ["Kuka Soft 01", "Milano Plus", "Roma L" ][i], fabric: ["Mato", "Charm", "Mikrofibril"][i], spec: "Standart komplekt", qty: "1", unit: "dona", startPrice: ["15 000 000", "10 000 000", "1200"][i], startCurrency: i === 2 ? "USD" : "UZS", finalPrice: ["18 000 000", "12 500 000", "1500"][i], finalCurrency: i === 2 ? "USD" : "UZS", note: "" },
        ],
      },
    };
  });

  state.db.salesChecks = demoRows;
  saveDB();
}

function bindEvents() {
  refs.loginForm.addEventListener("submit", onLogin);
  refs.logoutBtn.addEventListener("click", logout);
  if (refs.addClientBtn) refs.addClientBtn.addEventListener("click", () => openClientModal());
  if (refs.exportBtn) refs.exportBtn.addEventListener("click", exportExcel);
  if (refs.excelInput) refs.excelInput.addEventListener("change", importExcel);
  refs.closeClientModal.addEventListener("click", closeClientModal);
  refs.clientModal.addEventListener("click", () => {});
  refs.clientForm.addEventListener("submit", onClientSubmit);
  refs.dateFilterBtn.addEventListener("click", () => {
    openDateRangeModal("clients");
  });
  if (refs.hrDateFilterBtn) {
    refs.hrDateFilterBtn.addEventListener("click", () => {
      openDateRangeModal("hr");
    });
  }
  refs.dateRangeForm.addEventListener("submit", onDateRangeSubmit);
  refs.clearDateRange.addEventListener("click", clearDateRange);
  refs.dateModal.addEventListener("click", () => {});
  refs.searchInput.addEventListener("input", (e) => onFilterChange("search", e.target.value));
  refs.statusFilter.addEventListener("change", (e) => onFilterChange("status", e.target.value));
  refs.attendanceFilter.addEventListener("change", (e) => onFilterChange("attended", e.target.value));
  refs.storeFilter.addEventListener("change", (e) => onFilterChange("storeId", e.target.value));
  refs.managerFilter.addEventListener("change", (e) => onFilterChange("managerId", e.target.value));
  refs.clearFilters.addEventListener("click", clearFilters);
  refs.menuToggle.addEventListener("click", () => setSidebarOpen(!refs.sidebar.classList.contains("open")));
  refs.sidebarBackdrop.addEventListener("click", closeSidebar);
  if (refs.stockExportBtn) refs.stockExportBtn.addEventListener("click", exportStockExcel);
  refs.profileForm.addEventListener("submit", onProfileSubmit);
  refs.passwordForm.addEventListener("submit", onPasswordSubmit);
  refs.managerForm.addEventListener("submit", onManagerAdd);
  refs.storeForm.addEventListener("submit", onStoreAdd);
  refs.incomingForm.addEventListener("submit", onIncomingSubmit);
  refs.stockForm.addEventListener("submit", onStockSubmit);
  refs.warehouseIncomingTab.addEventListener("click", () => switchWarehouseView("incoming"));
  refs.warehouseStockTab.addEventListener("click", () => switchWarehouseView("stock"));
  refs.warehouseBackBtn.addEventListener("click", () => switchWarehouseView(""));
  refs.addIncomingOrderBtn.addEventListener("click", addIncomingOrderCard);
  refs.stockSearchInput.addEventListener("input", (e) => {
    state.stockSearch = String(e.target.value || "").trim().toLowerCase();
    renderWarehouse();
  });
  refs.stockLocationFilter.addEventListener("change", (e) => {
    state.stockLocationFilter = String(e.target.value || "");
    renderWarehouse();
  });
  refs.stockStoreFilter.addEventListener("change", (e) => {
    state.stockStoreFilter = String(e.target.value || "");
    renderWarehouse();
  });
  refs.stockImportInput.addEventListener("change", importStockExcel);
  refs.addStockBtn.addEventListener("click", openStockModalForCreate);
  refs.closeStockModal.addEventListener("click", closeStockModal);
  if (refs.salesSearchInput) {
    refs.salesSearchInput.addEventListener("input", (e) => {
      state.salesFilters.search = String(e.target.value || "").trim().toLowerCase();
      state.salesPageIndex = 1;
      renderSalesChecks();
    });
  }
  if (refs.salesStoreFilter) {
    refs.salesStoreFilter.addEventListener("change", (e) => {
      state.salesFilters.storeId = String(e.target.value || "");
      state.salesPageIndex = 1;
      renderSalesChecks();
    });
  }
  if (refs.salesManagerFilter) {
    refs.salesManagerFilter.addEventListener("change", (e) => {
      state.salesFilters.managerId = String(e.target.value || "");
      state.salesPageIndex = 1;
      renderSalesChecks();
    });
  }
  if (refs.salesExportBtn) refs.salesExportBtn.addEventListener("click", exportSalesChecksExcel);
  if (refs.salesClearFilters) refs.salesClearFilters.addEventListener("click", clearSalesFilters);
  if (refs.addSalesCheckBtn) refs.addSalesCheckBtn.addEventListener("click", openSalesCheckModal);
  if (refs.addSalesItemRowBtn) refs.addSalesItemRowBtn.addEventListener("click", () => addSalesItemRow());
  if (refs.closeSalesCheckModal) refs.closeSalesCheckModal.addEventListener("click", closeSalesCheckModal);
  if (refs.saveSalesCheckBtn) refs.saveSalesCheckBtn.addEventListener("click", () => refs.salesCheckForm?.requestSubmit());
  if (refs.salesCheckForm) refs.salesCheckForm.addEventListener("submit", onSalesCheckSubmit);
  if (refs.salesCheckModal) refs.salesCheckModal.addEventListener("click", () => {});
  if (refs.warrantySearchInput) {
    refs.warrantySearchInput.addEventListener("input", (e) => {
      state.warrantyFilters.search = String(e.target.value || "").trim().toLowerCase();
      state.warrantyPageIndex = 1;
      renderWarrantyChecks();
    });
  }
  if (refs.warrantyStoreFilter) {
    refs.warrantyStoreFilter.addEventListener("change", (e) => {
      state.warrantyFilters.storeId = String(e.target.value || "");
      state.warrantyPageIndex = 1;
      renderWarrantyChecks();
    });
  }
  if (refs.warrantyManagerFilter) {
    refs.warrantyManagerFilter.addEventListener("change", (e) => {
      state.warrantyFilters.managerId = String(e.target.value || "");
      state.warrantyPageIndex = 1;
      renderWarrantyChecks();
    });
  }
  if (refs.warrantyExportBtn) refs.warrantyExportBtn.addEventListener("click", exportWarrantyTicketsExcel);
  if (refs.warrantyClearFilters) refs.warrantyClearFilters.addEventListener("click", clearWarrantyFilters);
  if (refs.addWarrantyTicketBtn) {
    refs.addWarrantyTicketBtn.addEventListener("click", () => {
      if (typeof openWarrantyTicketModal === "function") openWarrantyTicketModal();
    });
  }
  if (refs.closeWarrantyTicketModal) refs.closeWarrantyTicketModal.addEventListener("click", closeWarrantyTicketModal);
  if (refs.saveWarrantyTicketBtn) refs.saveWarrantyTicketBtn.addEventListener("click", () => refs.warrantyTicketForm?.requestSubmit());
  if (refs.warrantyTicketForm) refs.warrantyTicketForm.addEventListener("submit", onWarrantyTicketSubmit);
  if (refs.warrantyTicketModal) refs.warrantyTicketModal.addEventListener("click", () => {});
  if (refs.settingsProfileTab) refs.settingsProfileTab.addEventListener("click", () => switchSettingsTab("profile"));
  if (refs.settingsUsersTab) refs.settingsUsersTab.addEventListener("click", () => switchSettingsTab("users"));
  refs.stockReserveForm.addEventListener("submit", onStockReserveSubmit);
  refs.closeStockReserveModal.addEventListener("click", closeStockReserveModal);
  refs.deleteStockReserveBtn.addEventListener("click", onStockReserveDelete);
  refs.stockLocationWarehouse.addEventListener("change", syncStockStoreRequirement);
  refs.stockLocationShowroom.addEventListener("change", syncStockStoreRequirement);
  refs.stockModal.addEventListener("click", () => {});
  refs.stockReserveModal.addEventListener("click", () => {});
  refs.closeIncomingModal.addEventListener("click", () => {
    state.editingOrderId = null;
    state.editingIncomingItemId = null;
    state.incomingEditMode = "full";
    toggleModal(refs.incomingModal, false);
  });
  refs.incomingModal.addEventListener("click", () => {});
  refs.managerEditForm.addEventListener("submit", onManagerEditSubmit);
  refs.openManagerModal.addEventListener("click", () => {
    setAdminActionActive("user");
    refs.managerForm.reset();
    refs.managerRoleSelect.value = "manager";
    syncManagerRoleStoreFields("create");
    toggleModal(refs.managerModal, true);
  });
  refs.openStoreModal.addEventListener("click", () => {
    setAdminActionActive("store");
    openStoreModalForCreate();
  });
  refs.closeManagerModal.addEventListener("click", () => toggleModal(refs.managerModal, false));
  refs.closeStoreModal.addEventListener("click", closeStoreModal);
  refs.managerModal.addEventListener("click", () => {});
  refs.storeModal.addEventListener("click", () => {});
  refs.closeManagerEditModal.addEventListener("click", closeManagerEditModal);
  refs.managerEditModal.addEventListener("click", () => {});
  refs.managerRoleSelect.addEventListener("change", () => syncManagerRoleStoreFields("create"));
  refs.managerEditRoleSelect.addEventListener("change", () => syncManagerRoleStoreFields("edit"));
  refs.confirmOkBtn.addEventListener("click", () => resolveConfirm(true));
  refs.confirmCancelBtn.addEventListener("click", () => resolveConfirm(false));
  refs.confirmModal.addEventListener("click", () => {});

  window.addEventListener("storage", onStorageSync);

  document.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => switchPage(btn.dataset.page));
  });
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyPresetRange(btn.dataset.range));
  });
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#addSalesCheckBtn");
    if (trigger) {
      e.preventDefault();
      openSalesCheckModal();
    }
  });
  refs.langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    refs.notifMenu.classList.add("hidden");
    refs.mobileMoreSheet.classList.add("hidden");
    refs.langMenu.classList.toggle("hidden");
    refs.authLangMenu.classList.add("hidden");
  });
  refs.authLangBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    refs.notifMenu.classList.add("hidden");
    refs.mobileMoreSheet.classList.add("hidden");
    refs.authLangMenu.classList.toggle("hidden");
    refs.langMenu.classList.add("hidden");
  });
  refs.notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    [refs.clientModal, refs.dateModal, refs.managerModal, refs.storeModal, refs.managerEditModal, refs.incomingModal, refs.stockModal, refs.stockReserveModal, refs.salesCheckModal, refs.warrantyTicketModal, refs.confirmModal, refs.integrationSettingsModal]
      .forEach((el) => {
        if (el) el.classList.add("hidden");
      });
    state.notificationPage = 1;
    refs.notifMenu.classList.toggle("hidden");
    refs.langMenu.classList.add("hidden");
    refs.authLangMenu.classList.add("hidden");
    if (!refs.notifMenu.classList.contains("hidden")) renderNotifications();
  });
  refs.notifMenu.addEventListener("click", (e) => e.stopPropagation());
  refs.notifMarkRead.addEventListener("click", markNotificationsAsRead);
  refs.notifPrev.addEventListener("click", () => {
    state.notificationPage = Math.max(1, Number(state.notificationPage || 1) - 1);
    renderNotifications();
  });
  refs.notifNext.addEventListener("click", () => {
    state.notificationPage = Number(state.notificationPage || 1) + 1;
    renderNotifications();
  });
  window.addEventListener("pointerdown", primeNotificationAudio, { once: true });

  refs.mobileMoreBtn.addEventListener("click", () => {
    refs.mobileMoreSheet.classList.remove("hidden");
  });
  refs.mobileMoreClose.addEventListener("click", () => refs.mobileMoreSheet.classList.add("hidden"));
  refs.mobileMoreBackdrop.addEventListener("click", () => refs.mobileMoreSheet.classList.add("hidden"));
  refs.scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", updateScrollTopBtn);
  document.addEventListener("click", (e) => {
    if (!refs.langMenu.contains(e.target) && !refs.langBtn.contains(e.target)) refs.langMenu.classList.add("hidden");
    if (!refs.authLangMenu.contains(e.target) && !refs.authLangBtn.contains(e.target)) refs.authLangMenu.classList.add("hidden");
    if (!refs.notifMenu.contains(e.target) && !refs.notifBtn.contains(e.target)) refs.notifMenu.classList.add("hidden");
    if (!e.target.closest(".client-contact-wrap")) {
      if (typeof closeClientContactMenus === "function") closeClientContactMenus();
    }
  });
  initPasswordToggles();
  initGroupedNumberInputs();
  initUzPhoneInputs();
  if (typeof bindHrEvents === "function") bindHrEvents();
}

function updateScrollTopBtn() {
  if (!refs.scrollTopBtn) return;
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const shouldShow = isMobile && window.scrollY > 380;
  refs.scrollTopBtn.classList.toggle("hidden", !shouldShow);
}

function initPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      btn.classList.toggle("is-visible", !visible);
    });
  });
}

function restoreRememberedCredentials() {
  const data = localStorage.getItem(LS_REMEMBER);
  if (!data) return;
  try {
    const { login, password } = JSON.parse(data);
    if (login && password) {
      refs.loginForm.login.value = login;
      refs.loginForm.password.value = password;
      refs.rememberMe.checked = true;
    }
  } catch {
    localStorage.removeItem(LS_REMEMBER);
  }
}

async function restoreSession() {
  const userId = sessionStorage.getItem(LS_SESSION) || localStorage.getItem(LS_SESSION);
  state.user = state.db.users.find((u) => u.id === userId) || null;
  if (!state.user) {
    refreshUI();
    return;
  }
  await Promise.all([loadManagersAndShowrooms(), loadClients(), loadNotificationsFromApi()]);
  refreshUI();
}

function onStorageSync(event) {
  if (event.key !== LS_DB || !event.newValue) return;
  try {
    state.db = normalizeDBShape(JSON.parse(event.newValue));
  } catch {
    return;
  }
  if (!state.user) return;
  const sameUser = state.db.users.find((u) => u.id === state.user.id);
  if (!sameUser) {
    logout();
    return;
  }
  state.user = sameUser;
  renderProfile();
  switchPage(state.page, true);
  renderNotifications();
}

async function onLogin(e) {
  e.preventDefault();
  const user = await login();
  if (!user) {
    refs.authHelp.textContent = t("loginError");
    return;
  }
  refs.authHelp.textContent = "";
  const loginValue = String(refs.loginForm.login.value || "").trim();
  const passwordValue = String(refs.loginForm.password.value || "").trim();
  if (refs.rememberMe.checked) {
    localStorage.setItem(LS_REMEMBER, JSON.stringify({ login: loginValue, password: passwordValue }));
  } else {
    localStorage.removeItem(LS_REMEMBER);
  }
  state.user = user;
  const profile = state.db.users.find((u) => u.id === user.id);
  if (profile) {
    profile.loginCount = Math.max(0, Number(profile.loginCount || 0)) + 1;
    profile.lastLoginAt = new Date().toISOString();
    state.user = profile;
    saveDB();
  }
  state.notificationPrimed = false;
  state.lastUnreadCount = 0;
  sessionStorage.setItem(LS_SESSION, user.id);
  localStorage.setItem(LS_SESSION, user.id);
  await Promise.all([loadManagersAndShowrooms(), loadClients(), loadNotificationsFromApi()]);
  refreshUI();
}

async function login() {
  const fd = new FormData(refs.loginForm);
  const loginValue = String(fd.get("login") || "").trim();
  const passwordValue = String(fd.get("password") || "").trim();
  if (!loginValue || !passwordValue) return null;

  const apiUser = await loginViaApi(loginValue, passwordValue);
  if (REMOTE_DB_ENABLED) return apiUser;
  if (apiUser) return apiUser;
  return state.db.users.find((u) => u.login === loginValue && u.password === passwordValue) || null;
}

async function loginViaApi(loginValue, passwordValue) {
  try {
    const res = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginValue, password: passwordValue }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success || !data.user) return null;
    return upsertUserFromApi(data.user);
  } catch {
    return null;
  }
}

function logout() {
  state.user = null;
  state.notificationPrimed = false;
  state.lastUnreadCount = 0;
  sessionStorage.removeItem(LS_SESSION);
  localStorage.removeItem(LS_SESSION);
  refreshUI();
}

function refreshUI() {
  const isAuth = Boolean(state.user);
  refs.authView.classList.toggle("hidden", isAuth);
  refs.appView.classList.toggle("hidden", !isAuth);
  if (!isAuth) {
    if (refs.mobileDock) refs.mobileDock.classList.add("hidden");
    if (refs.mobileMoreSheet) refs.mobileMoreSheet.classList.add("hidden");
    if (refs.scrollTopBtn) refs.scrollTopBtn.classList.add("hidden");
    closeSidebar();
    refs.authHelp.textContent = "";
    refs.notifMenu.classList.add("hidden");
    renderLanguageMenus();
    document.body.classList.remove("booting");
    return;
  }
  if (refs.mobileDock) refs.mobileDock.classList.remove("hidden");
  updateRoleBasedMenus();
  if (state.user.role === "manager") {
    state.filters.storeId = "";
    state.filters.managerId = "";
  } else {
    state.filters.storeId = "";
    state.filters.managerId = "";
  }
  renderProfile();
  renderLanguageMenus();
  renderNotifications();
  if (REMOTE_DB_ENABLED) loadNotificationsFromApi().then(renderNotifications);
  switchPage(state.page, true);
  updateScrollTopBtn();
  document.body.classList.remove("booting");
}

function renderProfile() {
  const store = getStore(state.user.storeId);
  refs.profileName.textContent = `${state.user.firstName} ${state.user.lastName}`;
  refs.profileRole.textContent = roleLabel(state.user.role);
  refs.profileStore.textContent = store ? store.name : "";
  updateDateChip();
}

function renderLanguageMenus() {
  [
    { btn: refs.langBtn, menu: refs.langMenu },
    { btn: refs.authLangBtn, menu: refs.authLangMenu },
  ].forEach(({ btn, menu }) => {
    const current = LANG_OPTIONS.find((l) => l.value === state.lang) || LANG_OPTIONS[0];
    btn.innerHTML = `<img src="${current.flag}" alt="${current.code}" />`;
    menu.innerHTML = LANG_OPTIONS.map((l) => {
      const active = l.value === state.lang ? "active" : "";
      return `<button type="button" class="lang-item ${active}" data-lang="${l.value}"><img src="${l.flag}" alt="${I18N[l.value].langName}" /><span class="lang-meta"><span>${I18N[l.value].langName}</span></span></button>`;
    }).join("");
    menu.querySelectorAll(".lang-item").forEach((item) => {
      item.addEventListener("click", () => {
        setLanguage(item.dataset.lang);
        refs.langMenu.classList.add("hidden");
        refs.authLangMenu.classList.add("hidden");
      });
    });
  });
}

function renderNotifications() {
  if (!state.user || !refs.notifList) return;
  const list = getUserNotifications();
  const PAGE_SIZE = 5;
  const unread = list.filter((n) => !isNotificationRead(n)).length;
  if (!state.notificationPrimed) {
    state.notificationPrimed = true;
    state.lastUnreadCount = unread;
  } else if (unread > state.lastUnreadCount) {
    playNotificationSound();
    state.lastUnreadCount = unread;
  } else {
    state.lastUnreadCount = unread;
  }
  refs.notifCount.textContent = unread > 99 ? "99+" : String(unread);
  refs.notifCount.classList.toggle("hidden", unread === 0);
  refs.notifMarkRead.textContent = t("markAllRead");

  if (!list.length) {
    refs.notifList.innerHTML = `<p class="notif-empty">${escapeHtml(t("noNotifications"))}</p>`;
    refs.notifPager.classList.add("hidden");
    return;
  }

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if (state.notificationPage > totalPages) state.notificationPage = totalPages;
  if (state.notificationPage < 1) state.notificationPage = 1;
  const start = (state.notificationPage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  refs.notifList.innerHTML = pageItems.map((n) => {
    const read = isNotificationRead(n);
    const unreadClass = read ? "" : "unread";
    const readAction = read
      ? `<span class="notif-mark done" title="${escapeHtml(t("markRead"))}"><svg viewBox="0 0 24 24"><path d="M20.3 6.7a1 1 0 0 0-1.4-1.4l-9 9-3.2-3.2a1 1 0 0 0-1.4 1.4l3.9 3.9a1 1 0 0 0 1.4 0l9.7-9.7Z"/></svg></span>`
      : `<button type="button" class="notif-mark" data-notif-read="${escapeHtml(n.id)}" title="${escapeHtml(t("markRead"))}"><svg viewBox="0 0 24 24"><path d="M20.3 6.7a1 1 0 0 0-1.4-1.4l-9 9-3.2-3.2a1 1 0 0 0-1.4 1.4l3.9 3.9a1 1 0 0 0 1.4 0l9.7-9.7Z"/></svg></button>`;
    const deleteAction = `<button type="button" class="notif-mark delete" data-notif-delete="${escapeHtml(n.id)}" title="${escapeHtml(t("deleteAction"))}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>`;
    const notifClientId = escapeHtml(String(n.clientId || n.client_id || ""));
    const notifContact = escapeHtml(String(n.clientContact || n.client_contact || ""));
    return `<div class="notif-item ${unreadClass}" data-notif-open="${escapeHtml(String(n.id || ""))}" data-notif-client="${notifClientId}" data-notif-contact="${notifContact}"><div class="notif-row"><div>${escapeHtml(notificationText(n))}</div><span class="notif-actions">${readAction}${deleteAction}</span></div><div class="notif-time">${escapeHtml(fmtDateTime(n.createdAt || n.created_at))}</div></div>`;
  }).join("");

  refs.notifList.querySelectorAll("button[data-notif-read]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await markNotificationAsRead(btn.dataset.notifRead);
      renderNotifications();
    });
  });
  refs.notifList.querySelectorAll("button[data-notif-delete]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteNotification(btn.dataset.notifDelete);
      renderNotifications();
    });
  });
  refs.notifList.querySelectorAll(".notif-item[data-notif-open]").forEach((item) => {
    item.addEventListener("click", async () => {
      const notifId = String(item.dataset.notifOpen || "");
      const directClientId = String(item.dataset.notifClient || "");
      if (!notifId) return;
      await markNotificationAsRead(notifId);
      refs.notifMenu.classList.add("hidden");
      switchPage("clients");
      const role = String(state.user?.role || "");
      const accessibleRows = (state.db.clients || []).filter((c) => {
        if (role === "admin") return true;
        if (role === "manager") return String(c.managerId || "") === String(state.user?.id || "") || String(c.createdBy || "") === String(state.user?.id || "");
        return true;
      });
      const targetIndex = accessibleRows.findIndex((c) => String(c.id || "") === directClientId);
      state.filters.search = "";
      state.filters.status = "";
      state.filters.attended = "";
      state.filters.storeId = "";
      state.filters.managerId = "";
      state.dateRange = { from: "", to: "" };
      state.highlightedClientId = directClientId || null;
      state.pageIndex = targetIndex >= 0 ? Math.floor(targetIndex / PAGE_SIZE) + 1 : 1;
      renderFilters();
      renderTableWithLoading();
      setTimeout(() => {
        const targetRow = refs.clientsTbody?.querySelector(`tr[data-client-id="${CSS.escape(String(directClientId || ""))}"]`);
        if (targetRow) targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 220);
      setTimeout(() => {
        state.highlightedClientId = null;
        renderTableWithLoading();
      }, 2200);
    });
  });

  refs.notifPager.classList.toggle("hidden", totalPages <= 1);
  refs.notifPageInfo.textContent = `${state.notificationPage} / ${totalPages}`;
  refs.notifPrev.disabled = state.notificationPage <= 1;
  refs.notifNext.disabled = state.notificationPage >= totalPages;
}

function primeNotificationAudio() {
  if (!notificationAudioEl) {
    notificationAudioEl = new Audio("js/modules/notifications/notification.mp3");
    notificationAudioEl.preload = "auto";
    notificationAudioEl.volume = 1;
  }
  try {
    notificationAudioEl.load();
  } catch {
    // ignore load failures
  }
}

function playNotificationSound() {
  try {
    primeNotificationAudio();
    if (!notificationAudioEl) return;
    notificationAudioEl.currentTime = 0;
    const playPromise = notificationAudioEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {
    // ignore audio playback failures
  }
}

function notificationText(notification) {
  const contact = notification.clientContact || notification.client_contact || "-";
  if (notification.type === "assigned_by_admin") {
    return template(t("notifAssignedByAdmin"), { contact });
  }
  if (notification.type === "new_client_from_manager") {
    if (notification.actor_login) {
      return template(t("notifNewClientFromManager"), { contact, manager: notification.actor_login || "-" });
    }
    const actor = getUser(notification.actorId);
    return template(t("notifNewClientFromManager"), { contact, manager: fullName(actor) || "-" });
  }
  if (notification.type === "new_lead_from_site") {
    return template(t("notifNewLeadFromSite"), { contact });
  }
  return contact;
}

function getUserNotifications() {
  if (REMOTE_DB_ENABLED) {
    return (state.remoteNotifications || []).slice().sort((a, b) => (Date.parse(b.created_at || b.createdAt || "") || 0) - (Date.parse(a.created_at || a.createdAt || "") || 0));
  }
  return (state.db.notifications || [])
    .filter((n) => n.toUserId === state.user.id)
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0));
}

function isNotificationRead(notification) {
  if (REMOTE_DB_ENABLED) return Number(notification.is_read || 0) === 1;
  return Array.isArray(notification.readBy) && notification.readBy.includes(state.user.id);
}

async function markNotificationsAsRead() {
  if (!state.user) return;
  if (REMOTE_DB_ENABLED) {
    await markAllNotificationsAsReadViaApi();
    await loadNotificationsFromApi();
    renderNotifications();
    return;
  }
  let changed = false;
  (state.db.notifications || []).forEach((n) => {
    if (n.toUserId !== state.user.id) return;
    if (!Array.isArray(n.readBy)) n.readBy = [];
    if (n.readBy.includes(state.user.id)) return;
    n.readBy.push(state.user.id);
    changed = true;
  });
  if (!changed) return;
  saveDB();
  renderNotifications();
}

async function deleteNotification(notificationId) {
  if (!state.user || !notificationId) return;
  if (REMOTE_DB_ENABLED) {
    await deleteNotificationViaApi(notificationId);
    await loadNotificationsFromApi();
    return;
  }
  state.db.notifications = (state.db.notifications || []).filter((n) => n.id !== notificationId);
  saveDB();
}

async function markNotificationAsRead(notificationId) {
  if (!state.user || !notificationId) return;
  if (REMOTE_DB_ENABLED) {
    await markNotificationAsReadViaApi(notificationId);
    await loadNotificationsFromApi();
    renderNotifications();
    return;
  }
  const notification = (state.db.notifications || []).find((n) => n.id === notificationId && n.toUserId === state.user.id);
  if (!notification) return;
  if (!Array.isArray(notification.readBy)) notification.readBy = [];
  if (notification.readBy.includes(state.user.id)) return;
  notification.readBy.push(state.user.id);
  saveDB();
  renderNotifications();
}

function addNotification(payload) {
  if (REMOTE_DB_ENABLED) {
    createNotificationViaApi(payload);
    return;
  }
  state.db.notifications = state.db.notifications || [];
  state.db.notifications.unshift({
    id: uid("notif"),
    type: payload.type,
    toUserId: payload.toUserId,
    actorId: payload.actorId,
    clientId: payload.clientId,
    clientContact: payload.clientContact || "-",
    createdAt: new Date().toISOString(),
    readBy: [],
  });
  if (state.db.notifications.length > MAX_NOTIFICATIONS) {
    state.db.notifications = state.db.notifications.slice(0, MAX_NOTIFICATIONS);
  }
}

function setLanguage(lang) {
  state.lang = I18N[lang] ? lang : "uz";
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    if ("placeholder" in el) el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  refs.searchInput.placeholder = t("searchPlaceholder");
  if (refs.stockSearchInput) refs.stockSearchInput.placeholder = t("stockSearchPlaceholder");
  if (refs.salesSearchInput) refs.salesSearchInput.placeholder = t("salesSearchPlaceholder");
  if (refs.warrantySearchInput) refs.warrantySearchInput.placeholder = t("warrantySearchPlaceholder");
  renderLanguageMenus();
  renderNotifications();
  if (state.user) {
    renderProfile();
    updateRoleBasedMenus();
    switchPage(state.page, true);
  }
}

function t(key) {
  return I18N[state.lang][key] || key;
}

function switchPage(page, keepPageIndex) {
  if (state.user) {
    const allAllowed = getAllowedPagesByRole(state.user.role);
    if (!allAllowed.includes(page)) page = "clients";
  }
  state.page = page;
  if (!keepPageIndex) state.pageIndex = 1;
  if (page === "warehouse" && !keepPageIndex) {
    state.warehouseView = "";
  }
  document.querySelectorAll(".menu-item").forEach((m) => m.classList.toggle("active", m.dataset.page === page));
  updateMobileDockActive();
  refs.clientsPage.classList.toggle("hidden", page !== "clients");
  refs.settingsPage.classList.toggle("hidden", page !== "settings");
  refs.integrationsPage.classList.toggle("hidden", page !== "integrations");
  refs.warehousePage.classList.toggle("hidden", page !== "warehouse");
  refs.salesPage.classList.toggle("hidden", page !== "sales");
  refs.hrPage.classList.toggle("hidden", page !== "hr");
  refs.warrantyPage.classList.toggle("hidden", page !== "warranty");
  refs.priceLabelPage.classList.toggle("hidden", page !== "priceLabel");
  const pageMeta = {
    clients: { title: t("clientsTitle"), subtitle: t("clientsSubtitle") },
    settings: { title: t("settingsTitle"), subtitle: t("settingsSubtitle") },
    integrations: { title: t("integrationsTitle"), subtitle: t("integrationsSubtitle") },
    warehouse: { title: t("warehouseTitle"), subtitle: t("warehouseSubtitle") },
    sales: { title: t("salesCheckTitle"), subtitle: t("salesCheckSubtitle") },
    hr: { title: t("hrTitle"), subtitle: t("hrSubtitle") },
    warranty: { title: t("warrantyTitle"), subtitle: t("warrantySubtitle") },
    priceLabel: { title: t("priceLabelTitle"), subtitle: t("priceLabelSubtitle") },
  };
  const currentMeta = pageMeta[page] || pageMeta.clients;
  refs.pageTitle.textContent = currentMeta.title;
  refs.pageSubtitle.textContent = currentMeta.subtitle;
  closeSidebar();
  if (page === "clients") {
    renderFilters();
    renderTableWithLoading();
  } else if (page === "integrations") {
    if (typeof renderIntegrationsPage === "function") renderIntegrationsPage();
  } else if (page === "settings") {
    renderSettings();
  } else if (page === "warehouse") {
    renderWarehouse();
  } else if (page === "sales") {
    renderSalesChecks();
  } else if (page === "hr") {
    if (typeof renderHRDashboard === "function") renderHRDashboard();
  } else if (page === "warranty") {
    if (typeof loadWarrantyTicketsFromApi === "function") {
      loadWarrantyTicketsFromApi().finally(() => {
        if (typeof renderWarrantyChecks === "function") renderWarrantyChecks();
      });
    } else if (typeof renderWarrantyChecks === "function") {
      renderWarrantyChecks();
    }
  }
}

function getPrimaryPagesByRole(role) {
  if (role === "admin") return ["clients", "integrations", "warehouse", "sales", "hr", "warranty", "priceLabel", "settings"];
  if (role === "manager") return ["clients", "warehouse", "sales", "warranty", "priceLabel", "settings"];
  if (role === "hr") return ["clients", "warehouse", "hr", "sales", "warranty", "priceLabel", "settings"];
  if (role === "cashier") return ["clients", "warehouse", "sales", "warranty", "priceLabel", "settings"];
  if (role === "skladchi") return ["clients", "warehouse", "sales", "warranty", "priceLabel", "settings"];
  return ["clients", "priceLabel", "settings"];
}

function getAllowedPagesByRole(role) {
  return getPrimaryPagesByRole(role);
}

function updateRoleBasedMenus() {
  if (!state.user) return;
  const role = state.user.role;
  const primary = getPrimaryPagesByRole(role);
  const allowed = getAllowedPagesByRole(role);

  document.querySelectorAll(".menu-item").forEach((btn) => {
    const page = btn.dataset.page;
    btn.classList.toggle("hidden", !allowed.includes(page));
  });

  const firstFive = primary.slice(0, 5);
  const slots = [refs.mobileDockSlot1, refs.mobileDockSlot2, refs.mobileDockSlot3, refs.mobileDockSlot4, refs.mobileDockSlot5];
  const labelMap = {
    clients: t("menuClients"),
    integrations: t("menuIntegrations"),
    warehouse: t("menuWarehouse"),
    sales: t("menuSalesCheck"),
    hr: t("menuHR"),
    warranty: t("menuWarranty"),
    priceLabel: t("menuPriceLabel"),
    settings: t("menuSettings"),
  };
  const iconMap = {
    clients: "<svg viewBox='0 0 24 24'><path d='M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.7 0-5 1.34-5 3v1h10v-1c0-1.66-2.3-3-5-3Zm8 0c-.52 0-1.02.05-1.48.14A4.87 4.87 0 0 1 16 17v1h8v-1c0-1.66-2.3-3-5-3Z'/></svg>",
    integrations: "<svg viewBox='0 0 24 24'><path d='M7 7h4V3h2v4h4v2h-4v6h4v2h-4v4h-2v-4H7v-2h4V9H7V7Zm-4 8a3 3 0 1 1 3 3 3 3 0 0 1-3-3Zm12-10a3 3 0 1 1 3 3 3 3 0 0 1-3-3Z'/></svg>",
    warehouse: "<svg viewBox='0 0 24 24'><path d='M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z'/></svg>",
    sales: "<svg viewBox='0 0 24 24'><path d='M7 3h10v2h2a2 2 0 0 1 2 2v14H3V7a2 2 0 0 1 2-2h2V3Zm2 2h6V5H9v2Zm-4 4v10h14V9H5Zm2 2h10v2H7v-2Zm0 4h6v2H7v-2Z'/></svg>",
    hr: "<svg viewBox='0 0 24 24'><path d='M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-8 9v-1c0-3.31 3.58-6 8-6s8 2.69 8 6v1Z'/></svg>",
    warranty: "<svg viewBox='0 0 24 24'><path d='M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3Zm0 3.2 5 1.88V11c0 4.04-2.6 7.94-5 9.26C9.6 18.94 7 15.04 7 11V7.08l5-1.88Zm-1 3.3v5.3l4.2 2.45 1-1.73-3.2-1.86V8.5h-2Z'/></svg>",
    priceLabel: "<svg viewBox='0 0 24 24'><path d='M10 3H5a2 2 0 0 0-2 2v5l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82L10 3Zm-3.5 5A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8Z'/></svg>",
    settings: "<svg viewBox='0 0 24 24'><path d='M19.4 13a7.94 7.94 0 0 0 .05-2l2.02-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.38.96a7.84 7.84 0 0 0-1.73-1l-.36-2.52a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42L9.4 5.2a7.84 7.84 0 0 0-1.73 1l-2.38-.96a.5.5 0 0 0-.6.22L2.77 8.78a.5.5 0 0 0 .12.64L4.9 11a7.94 7.94 0 0 0 .05 2l-2.02 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.38-.96a7.84 7.84 0 0 0 1.73 1l.36 2.52a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.52a7.84 7.84 0 0 0 1.73-1l2.38.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z'/></svg>",
  };
  slots.forEach((slot, idx) => {
    const page = firstFive[idx];
    if (!slot || !page) {
      if (slot) slot.classList.add("hidden");
      return;
    }
    slot.classList.remove("hidden");
    slot.dataset.mobilePage = page;
    slot.innerHTML = `<span class=\"mobile-dock-icon\">${iconMap[page] || ""}</span><span class=\"mobile-dock-label\">${escapeHtml(labelMap[page] || page)}</span>`;
    slot.onclick = () => {
      switchPage(page);
      refs.mobileMoreSheet.classList.add("hidden");
    };
  });

  const secondary = allowed.filter((p) => !firstFive.includes(p));
  const moreItems = secondary.map((p) => {
    return `<button type=\"button\" class=\"mobile-more-item\" data-mobile-more-page=\"${p}\"><span class=\"mobile-more-icon\">${iconMap[p] || ""}</span><span class=\"mobile-more-label\">${escapeHtml(labelMap[p] || p)}</span></button>`;
  });
  moreItems.push(`<button type=\"button\" class=\"mobile-more-item mobile-more-logout\" data-mobile-more-action=\"logout\"><span class=\"mobile-more-icon\"><svg viewBox='0 0 24 24'><path d='M10 17v-3H3v-4h7V7l5 5-5 5Zm9 2h-7v-2h7V7h-7V5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z'/></svg></span><span class=\"mobile-more-label\">${escapeHtml(t("logout"))}</span></button>`);
  refs.mobileMoreList.innerHTML = moreItems.join("");
  refs.mobileMoreList.querySelectorAll("button[data-mobile-more-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchPage(btn.dataset.mobileMorePage);
      refs.mobileMoreSheet.classList.add("hidden");
    });
  });
  const mobileMoreLogoutBtn = refs.mobileMoreList.querySelector("button[data-mobile-more-action='logout']");
  if (mobileMoreLogoutBtn) {
    mobileMoreLogoutBtn.addEventListener("click", () => {
      refs.mobileMoreSheet.classList.add("hidden");
      logout();
    });
  }

  refs.mobileMoreBtn.classList.remove("hidden");
  refs.mobileMoreBtn.innerHTML = "<span class='mobile-dock-icon'><svg viewBox='0 0 24 24'><path d='M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z'/></svg></span>";
  updateMobileDockActive();
}

function updateMobileDockActive() {
  if (!refs.mobileDock) return;
  refs.mobileDock.querySelectorAll(".mobile-dock-btn[data-mobile-page]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mobilePage === state.page);
  });
}

