async function init() {
  cacheRefs();
  await seedDB();
  ensureDemoSalesChecks();
  bindEvents();
  setLanguage("uz");
  restoreRememberedCredentials();
  await restoreSession();
  startRemoteSync();
}

function cacheRefs() {
  const ids = [
    "authView", "appView", "loginForm", "authHelp", "rememberMe", "authLangBtn", "authLangMenu", "langBtn", "langMenu", "profileName", "profileRole",
    "profileStore", "dateFilterBtn", "logoutBtn", "addClientBtn", "menuToggle", "sidebar", "sidebarBackdrop", "pageTitle", "pageSubtitle",
    "clientsPage", "settingsPage", "integrationsPage", "warehousePage", "salesPage", "hrPage", "priceLabelPage", "searchInput", "statusFilter", "attendanceFilter", "storeFilter", "managerFilter", "clearFilters", "excelInput", "exportBtn",
    "tableHeadRow", "clientsTbody", "pagination", "countInfo", "tableLoading", "clientModal",
    "clientModalTitle", "clientForm", "closeClientModal", "dateModal", "dateRangeForm", "clearDateRange", "toast", "profileForm", "adminLoginField",
    "adminSettings", "managerForm", "managerStoreField", "managerStoreSelect", "managerList", "storeForm", "storeList",
    "openManagerModal", "openStoreModal", "managerModal", "storeModal", "closeManagerModal", "closeStoreModal", "storeModalTitle",
    "passwordForm", "passwordSettingsCard", "managerEditModal", "managerEditForm", "managerEditStoreField", "managerEditStoreSelect", "managerRoleSelect", "managerEditRoleSelect", "closeManagerEditModal",
    "notifBtn", "notifMenu", "notifCount", "notifList", "notifMarkRead",
    "warehouseTabs", "warehouseBackWrap", "warehouseBackBtn", "warehouseIncomingTab", "warehouseStockTab", "incomingSection", "stockSection", "incomingOrdersList", "addIncomingOrderBtn", "incomingForm", "incomingFullFields", "incomingStageFields", "stockForm", "stockTbody", "stockStoreSelect", "stockSearchInput", "stockExportBtn", "stockImportInput", "stockLocationFilter", "stockStoreFilter", "addStockBtn", "stockModal", "stockModalTitle", "closeStockModal", "stockLocationWarehouse", "stockLocationShowroom", "stockReserveModal", "stockReserveForm", "closeStockReserveModal", "deleteStockReserveBtn", "salesSearchInput", "salesStoreFilter", "salesManagerFilter", "salesExportBtn", "salesClearFilters", "addSalesCheckBtn", "salesTbody", "salesCountInfo", "salesPagination", "salesCheckModal", "salesCheckForm", "salesStoreSelect", "salesManagerSelect", "salesItemsRows", "addSalesItemRowBtn", "closeSalesCheckModal", "saveSalesCheckBtn", "settingsProfileTab", "settingsUsersTab", "settingsProfilePage", "settingsUsersPage", "incomingModal", "incomingModalTitle", "closeIncomingModal", "incomingStageSelect", "confirmModal", "confirmModalTitle", "confirmModalMessage", "confirmOkBtn", "confirmCancelBtn",
  ];
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
  };
  const admin = {
    id: uid("user"),
    role: "admin",
    login: "admin",
    password: "admin123",
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
      { id: uid("user"), role: "manager", login: "sotuvchi1", password: "12345", firstName: "Ali", lastName: "Karimov", avatar: defaultAvatar(), storeId: firstStore },
      { id: uid("user"), role: "manager", login: "sotuvchi2", password: "12345", firstName: "Sardor", lastName: "Qodirov", avatar: defaultAvatar(), storeId: state.db.stores[1]?.id || firstStore },
      { id: uid("user"), role: "manager", login: "sotuvchi3", password: "12345", firstName: "Javohir", lastName: "Ergashev", avatar: defaultAvatar(), storeId: state.db.stores[2]?.id || firstStore },
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
    closeSidebar();
    toggleModal(refs.dateModal, true);
  });
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
    refs.langMenu.classList.toggle("hidden");
    refs.authLangMenu.classList.add("hidden");
  });
  refs.authLangBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    refs.authLangMenu.classList.toggle("hidden");
    refs.langMenu.classList.add("hidden");
  });
  refs.notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    refs.notifMenu.classList.toggle("hidden");
    refs.langMenu.classList.add("hidden");
    refs.authLangMenu.classList.add("hidden");
  });
  refs.notifMarkRead.addEventListener("click", markNotificationsAsRead);
  window.addEventListener("pointerdown", primeNotificationAudio, { once: true });
  document.addEventListener("click", (e) => {
    if (!refs.langMenu.contains(e.target) && !refs.langBtn.contains(e.target)) refs.langMenu.classList.add("hidden");
    if (!refs.authLangMenu.contains(e.target) && !refs.authLangBtn.contains(e.target)) refs.authLangMenu.classList.add("hidden");
    if (!refs.notifMenu.contains(e.target) && !refs.notifBtn.contains(e.target)) refs.notifMenu.classList.add("hidden");
  });

  initPasswordToggles();
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
  localStorage.removeItem(LS_SESSION);
  const userId = sessionStorage.getItem(LS_SESSION);
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
  state.notificationPrimed = false;
  state.lastUnreadCount = 0;
  sessionStorage.setItem(LS_SESSION, user.id);
  await Promise.all([loadManagersAndShowrooms(), loadClients(), loadNotificationsFromApi()]);
  refreshUI();
}

async function login() {
  const fd = new FormData(refs.loginForm);
  const loginValue = String(fd.get("login") || "").trim();
  const passwordValue = String(fd.get("password") || "").trim();
  if (!loginValue || !passwordValue) return null;

  const apiUser = await loginViaApi(loginValue, passwordValue);
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
    closeSidebar();
    refs.authHelp.textContent = "";
    refs.notifMenu.classList.add("hidden");
    renderLanguageMenus();
    document.body.classList.remove("booting");
    return;
  }
  if (state.user.role !== "admin") {
    state.filters.storeId = state.user.storeId || "";
    state.filters.managerId = state.user.id;
  }
  renderProfile();
  renderLanguageMenus();
  renderNotifications();
  if (REMOTE_DB_ENABLED) loadNotificationsFromApi().then(renderNotifications);
  switchPage(state.page, true);
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
    return;
  }

  refs.notifList.innerHTML = list.slice(0, 50).map((n) => {
    const read = isNotificationRead(n);
    const unreadClass = read ? "" : "unread";
    const action = read
      ? `<span class="notif-mark done">вњ“</span>`
      : `<button type="button" class="notif-mark" data-notif-read="${escapeHtml(n.id)}" title="${escapeHtml(t("markRead"))}">вњ“</button>`;
    return `<div class="notif-item ${unreadClass}"><div class="notif-row"><div>${escapeHtml(notificationText(n))}</div>${action}</div><div class="notif-time">${escapeHtml(fmtDateTime(n.createdAt || n.created_at))}</div></div>`;
  }).join("");

  refs.notifList.querySelectorAll("button[data-notif-read]").forEach((btn) => {
    btn.addEventListener("click", () => markNotificationAsRead(btn.dataset.notifRead));
  });
}

function primeNotificationAudio() {
  if (!notificationAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    notificationAudioCtx = new Ctx();
  }
  if (notificationAudioCtx.state === "suspended") {
    notificationAudioCtx.resume().catch(() => {});
  }
}

function playNotificationSound() {
  try {
    primeNotificationAudio();
    if (!notificationAudioCtx) return;
    const now = notificationAudioCtx.currentTime;
    const noteA = notificationAudioCtx.createOscillator();
    const noteB = notificationAudioCtx.createOscillator();
    const gain = notificationAudioCtx.createGain();

    noteA.type = "sine";
    noteB.type = "triangle";
    noteA.frequency.setValueAtTime(784, now);
    noteB.frequency.setValueAtTime(1046, now + 0.1);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    noteA.connect(gain);
    noteB.connect(gain);
    gain.connect(notificationAudioCtx.destination);

    noteA.start(now);
    noteA.stop(now + 0.22);
    noteB.start(now + 0.1);
    noteB.stop(now + 0.3);
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
  refs.searchInput.placeholder = t("searchPlaceholder");
  if (refs.stockSearchInput) refs.stockSearchInput.placeholder = t("stockSearchPlaceholder");
  if (refs.salesSearchInput) refs.salesSearchInput.placeholder = t("salesSearchPlaceholder");
  renderLanguageMenus();
  renderNotifications();
  if (state.user) {
    renderProfile();
    switchPage(state.page, true);
  }
}

function t(key) {
  return I18N[state.lang][key] || key;
}

function switchPage(page, keepPageIndex) {
  state.page = page;
  if (!keepPageIndex) state.pageIndex = 1;
  if (page === "warehouse" && !keepPageIndex) {
    state.warehouseView = "";
  }
  document.querySelectorAll(".menu-item").forEach((m) => m.classList.toggle("active", m.dataset.page === page));
  refs.clientsPage.classList.toggle("hidden", page !== "clients");
  refs.settingsPage.classList.toggle("hidden", page !== "settings");
  refs.integrationsPage.classList.toggle("hidden", page !== "integrations");
  refs.warehousePage.classList.toggle("hidden", page !== "warehouse");
  refs.salesPage.classList.toggle("hidden", page !== "sales");
  refs.hrPage.classList.toggle("hidden", page !== "hr");
  refs.priceLabelPage.classList.toggle("hidden", page !== "priceLabel");
  const pageMeta = {
    clients: { title: t("clientsTitle"), subtitle: t("clientsSubtitle") },
    settings: { title: t("settingsTitle"), subtitle: t("settingsSubtitle") },
    integrations: { title: t("integrationsTitle"), subtitle: t("integrationsSubtitle") },
    warehouse: { title: t("warehouseTitle"), subtitle: t("warehouseSubtitle") },
    sales: { title: t("salesCheckTitle"), subtitle: t("salesCheckSubtitle") },
    hr: { title: t("hrTitle"), subtitle: t("hrSubtitle") },
    priceLabel: { title: t("priceLabelTitle"), subtitle: t("priceLabelSubtitle") },
  };
  const currentMeta = pageMeta[page] || pageMeta.clients;
  refs.pageTitle.textContent = currentMeta.title;
  refs.pageSubtitle.textContent = currentMeta.subtitle;
  closeSidebar();
  if (page === "clients") {
    renderFilters();
    renderTableWithLoading();
  } else if (page === "settings") {
    renderSettings();
  } else if (page === "warehouse") {
    renderWarehouse();
  } else if (page === "sales") {
    renderSalesChecks();
  }
}

