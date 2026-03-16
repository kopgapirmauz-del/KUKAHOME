const LS_DB = "premium_crm_db_v1";
const LS_SESSION = "premium_crm_session_v1";
const LS_REMEMBER = "premium_crm_remember_v1";
const PAGE_SIZE = 30;
const MAX_NOTIFICATIONS = 200;

const FLAG_BASE = "../assets/images/icons";

const I18N = {
  uz: {
    loginTitle: "Klient Baza Tizimi",
    loginSubtitle: "Admin va sotuv menedjerlari uchun professional boshqaruv paneli",
    loginInput: "Login",
    passwordInput: "Parol",
    loginBtn: "Kirish",
    rememberMe: "Eslab qolish",
    menuClients: "Klient bazasi",
    menuSettings: "Sozlamalar",
    addClient: "Mijoz qo'shish",
    logout: "Chiqish",
    importExcel: "Excel import",
    exportExcel: "Excel export",
    clearFilter: "Tozalash",
    profileSettings: "Profil sozlamalari",
    firstName: "Ism",
    lastName: "Familya",
    avatar: "Profil rasmi URL",
    save: "Saqlash",
    adminTools: "Admin boshqaruvi",
    addManager: "Menedjer qo'shish",
    managerList: "Menedjerlar",
    addStore: "Do'kon qo'shish",
    storeList: "Do'konlar",
    date: "Sana",
    contact: "Telefon yoki link",
    source: "Qayerdan keldi",
    sourceInstagram: "Instagram",
    sourceNewClient: "Yangi mijoz",
    sourcePotential: "Potensial mijoz",
    interest: "Qiziqish",
    comment: "Fikr",
    attended: "Keldi/Kelmadi",
    price: "Sotuv narxi",
    status: "Holat",
    store: "Do'kon",
    manager: "Menedjer",
    cancel: "Bekor qilish",
    dateRange: "Sana oralig'i",
    from: "Dan",
    to: "Gacha",
    apply: "Qo'llash",
    clientsTitle: "Klientlar boshqaruvi",
    clientsSubtitle: "Tez filter, tahrirlash va Excel bilan ishlash",
    settingsTitle: "Shaxsiy sozlamalar",
    settingsSubtitle: "Profil, menedjerlar va do'konlarni boshqarish",
    roleAdmin: "Admin",
    roleManager: "Sotuv menedjeri",
    today: "Bugun",
    allStatus: "Barcha holatlar",
    allAttendance: "Keldi/Kelmadi (barchasi)",
    allStores: "Barcha do'konlar",
    allManagers: "Barcha menedjerlar",
    attendedYes: "Keldi",
    attendedNo: "Kelmadi",
    green: "Yashil",
    yellow: "Sariq",
    red: "Qizil",
    noData: "Ma'lumot topilmadi",
    created: "Mijoz qo'shildi",
    updated: "Mijoz yangilandi",
    deleted: "Mijoz o'chirildi",
    loginError: "Login yoki parol noto'g'ri",
    profileSaved: "Profil saqlandi",
    managerAdded: "Menedjer qo'shildi",
    managerDeleted: "Menedjer o'chirildi",
    storeAdded: "Do'kon qo'shildi",
    storeDeleted: "Do'kon o'chirildi",
    cannotDeleteStore: "Do'konda bog'langan yozuvlar bor",
    imported: "Excel import yakunlandi",
    exported: "Excel fayl yuklandi",
    pageInfo: "{total} ta yozuvdan {shown} tasi",
    addClientTitle: "Yangi mijoz qo'shish",
    editClientTitle: "Mijozni tahrirlash",
    fillRequired: "Majburiy maydonlarni to'ldiring",
    currentPassword: "Joriy parol",
    newPassword: "Yangi parol",
    confirmPassword: "Parolni tasdiqlash",
    updatePassword: "Parolni yangilash",
    passwordUpdated: "Parol yangilandi",
    passwordMismatch: "Yangi parollar mos emas",
    currentPasswordWrong: "Joriy parol noto'g'ri",
    managerUpdated: "Menedjer yangilandi",
    editManagerTitle: "Menedjerni tahrirlash",
    searchPlaceholder: "Telefon, qiziqish, fikr bo'yicha qidiruv",
    action: "Amallar",
    number: "№",
    loginTaken: "Bu login band",
    rangeToday: "Bugun",
    range7: "Oxirgi 7 kun",
    range30: "Oxirgi 30 kun",
    rangeMonth: "Shu oy",
    rangeYear: "Shu yil",
    timezone: "Vaqt zonasi: Asia/Tashkent",
    langName: "O'zbek",
    notifications: "Bildirishnomalar",
    markAllRead: "Hammasini o'qilgan qilish",
    noNotifications: "Hozircha bildirishnoma yo'q",
    notifAssignedByAdmin: "Admin sizga yangi mijoz biriktirdi: {contact}",
    notifNewClientFromManager: "{manager} yangi mijoz qo'shdi: {contact}",
  },
  ru: {
    loginTitle: "Система клиентской базы",
    loginSubtitle: "Профессиональная CRM-панель для админа и менеджеров",
    loginInput: "Логин",
    passwordInput: "Пароль",
    loginBtn: "Войти",
    rememberMe: "Запомнить меня",
    menuClients: "Клиентская база",
    menuSettings: "Настройки",
    addClient: "Добавить клиента",
    logout: "Выход",
    importExcel: "Импорт Excel",
    exportExcel: "Экспорт Excel",
    clearFilter: "Очистить",
    profileSettings: "Настройки профиля",
    firstName: "Имя",
    lastName: "Фамилия",
    avatar: "URL фото профиля",
    save: "Сохранить",
    adminTools: "Инструменты администратора",
    addManager: "Добавить менеджера",
    managerList: "Менеджеры",
    addStore: "Добавить магазин",
    storeList: "Магазины",
    date: "Дата",
    contact: "Телефон или ссылка",
    source: "Источник",
    sourceInstagram: "Instagram",
    sourceNewClient: "Новый клиент",
    sourcePotential: "Потенциальный клиент",
    interest: "Интерес",
    comment: "Комментарий",
    attended: "Пришел/Не пришел",
    price: "Сумма продажи",
    status: "Статус",
    store: "Магазин",
    manager: "Менеджер",
    cancel: "Отмена",
    dateRange: "Диапазон дат",
    from: "С",
    to: "По",
    apply: "Применить",
    clientsTitle: "Управление клиентами",
    clientsSubtitle: "Быстрая фильтрация, редактирование и Excel",
    settingsTitle: "Личные настройки",
    settingsSubtitle: "Профиль, менеджеры и магазины",
    roleAdmin: "Админ",
    roleManager: "Менеджер продаж",
    today: "Сегодня",
    allStatus: "Все статусы",
    allAttendance: "Пришел/Не пришел (все)",
    allStores: "Все магазины",
    allManagers: "Все менеджеры",
    attendedYes: "Пришел",
    attendedNo: "Не пришел",
    green: "Зеленый",
    yellow: "Желтый",
    red: "Красный",
    noData: "Данные не найдены",
    created: "Клиент добавлен",
    updated: "Клиент обновлен",
    deleted: "Клиент удален",
    loginError: "Неверный логин или пароль",
    profileSaved: "Профиль сохранен",
    managerAdded: "Менеджер добавлен",
    managerDeleted: "Менеджер удален",
    storeAdded: "Магазин добавлен",
    storeDeleted: "Магазин удален",
    cannotDeleteStore: "У магазина есть связанные записи",
    imported: "Импорт Excel завершен",
    exported: "Файл Excel выгружен",
    pageInfo: "Показано {shown} из {total}",
    addClientTitle: "Добавление клиента",
    editClientTitle: "Редактирование клиента",
    fillRequired: "Заполните обязательные поля",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    confirmPassword: "Подтвердите пароль",
    updatePassword: "Обновить пароль",
    passwordUpdated: "Пароль обновлен",
    passwordMismatch: "Новые пароли не совпадают",
    currentPasswordWrong: "Текущий пароль неверный",
    managerUpdated: "Менеджер обновлен",
    editManagerTitle: "Редактирование менеджера",
    searchPlaceholder: "Поиск по телефону, интересу и комментарию",
    action: "Действия",
    number: "№",
    loginTaken: "Логин уже занят",
    rangeToday: "Сегодня",
    range7: "Последние 7 дней",
    range30: "Последние 30 дней",
    rangeMonth: "Этот месяц",
    rangeYear: "Этот год",
    timezone: "Часовой пояс: Asia/Tashkent",
    langName: "Русский",
    notifications: "Уведомления",
    markAllRead: "Отметить все прочитанным",
    noNotifications: "Уведомлений пока нет",
    notifAssignedByAdmin: "Админ назначил вам нового клиента: {contact}",
    notifNewClientFromManager: "{manager} добавил нового клиента: {contact}",
  },
  zh: {
    loginTitle: "客户管理系统",
    loginSubtitle: "面向管理员和销售经理的专业 CRM 面板",
    loginInput: "登录名",
    passwordInput: "密码",
    loginBtn: "登录",
    rememberMe: "记住账号",
    menuClients: "客户库",
    menuSettings: "设置",
    addClient: "添加客户",
    logout: "退出",
    importExcel: "导入 Excel",
    exportExcel: "导出 Excel",
    clearFilter: "清除",
    profileSettings: "个人设置",
    firstName: "名字",
    lastName: "姓氏",
    avatar: "头像 URL",
    save: "保存",
    adminTools: "管理员工具",
    addManager: "添加经理",
    managerList: "经理列表",
    addStore: "添加门店",
    storeList: "门店列表",
    date: "日期",
    contact: "电话或链接",
    source: "客户来源",
    sourceInstagram: "Instagram",
    sourceNewClient: "新客户",
    sourcePotential: "潜在客户",
    interest: "兴趣",
    comment: "反馈",
    attended: "到店/未到店",
    price: "成交金额",
    status: "状态",
    store: "门店",
    manager: "经理",
    cancel: "取消",
    dateRange: "日期范围",
    from: "开始",
    to: "结束",
    apply: "应用",
    clientsTitle: "客户管理",
    clientsSubtitle: "快速筛选、编辑与 Excel",
    settingsTitle: "个人配置",
    settingsSubtitle: "管理个人资料、经理与门店",
    roleAdmin: "管理员",
    roleManager: "销售经理",
    today: "今天",
    allStatus: "全部状态",
    allAttendance: "到店/未到店（全部）",
    allStores: "全部门店",
    allManagers: "全部经理",
    attendedYes: "到店",
    attendedNo: "未到店",
    green: "绿色",
    yellow: "黄色",
    red: "红色",
    noData: "暂无数据",
    created: "客户已添加",
    updated: "客户已更新",
    deleted: "客户已删除",
    loginError: "登录名或密码错误",
    profileSaved: "资料已保存",
    managerAdded: "经理已添加",
    managerDeleted: "经理已删除",
    storeAdded: "门店已添加",
    storeDeleted: "门店已删除",
    cannotDeleteStore: "该门店存在关联记录",
    imported: "Excel 导入完成",
    exported: "Excel 文件已导出",
    pageInfo: "共 {total} 条，当前显示 {shown} 条",
    addClientTitle: "添加客户",
    editClientTitle: "编辑客户",
    fillRequired: "请填写必填项",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "确认密码",
    updatePassword: "更新密码",
    passwordUpdated: "密码已更新",
    passwordMismatch: "两次新密码不一致",
    currentPasswordWrong: "当前密码错误",
    managerUpdated: "经理已更新",
    editManagerTitle: "编辑经理",
    searchPlaceholder: "按电话、兴趣、反馈搜索",
    action: "操作",
    number: "编号",
    loginTaken: "该登录名已被使用",
    rangeToday: "今天",
    range7: "最近 7 天",
    range30: "最近 30 天",
    rangeMonth: "本月",
    rangeYear: "今年",
    timezone: "时区: Asia/Tashkent",
    langName: "中文",
    notifications: "通知",
    markAllRead: "全部标记已读",
    noNotifications: "暂无通知",
    notifAssignedByAdmin: "管理员为你分配了新客户: {contact}",
    notifNewClientFromManager: "{manager} 新增了客户: {contact}",
  },
};

const LANG_OPTIONS = [
  { value: "uz", code: "UZ", flag: `${FLAG_BASE}/flaguz.svg` },
  { value: "ru", code: "RU", flag: `${FLAG_BASE}/flagrus.svg` },
  { value: "zh", code: "CN", flag: `${FLAG_BASE}/flagchina.svg` },
];

const state = {
  db: null,
  user: null,
  lang: "uz",
  page: "clients",
  pageIndex: 1,
  editingClientId: null,
  dateRange: { from: "", to: "" },
  filters: {
    search: "",
    status: "",
    attended: "",
    storeId: "",
    managerId: "",
  },
  editingManagerId: null,
};

const refs = {};

init();

function init() {
  cacheRefs();
  seedDB();
  bindEvents();
  setLanguage("uz");
  restoreRememberedCredentials();
  restoreSession();
}

function cacheRefs() {
  const ids = [
    "authView", "appView", "loginForm", "authHelp", "rememberMe", "authLangBtn", "authLangMenu", "langBtn", "langMenu", "profileName", "profileRole",
    "profileStore", "dateFilterBtn", "logoutBtn", "addClientBtn", "menuToggle", "sidebar", "pageTitle", "pageSubtitle",
    "clientsPage", "settingsPage", "searchInput", "statusFilter", "attendanceFilter", "storeFilter", "managerFilter", "clearFilters",
    "tableHeadRow", "clientsTbody", "pagination", "countInfo", "tableLoading", "exportBtn", "excelInput", "clientModal",
    "clientModalTitle", "clientForm", "closeClientModal", "dateModal", "dateRangeForm", "clearDateRange", "toast", "profileForm",
    "adminSettings", "managerForm", "managerStoreSelect", "managerList", "storeForm", "storeList",
    "openManagerModal", "openStoreModal", "managerModal", "storeModal", "closeManagerModal", "closeStoreModal",
    "passwordForm", "passwordSettingsCard", "managerEditModal", "managerEditForm", "managerEditStoreSelect", "closeManagerEditModal",
    "notifBtn", "notifMenu", "notifCount", "notifList", "notifMarkRead",
  ];
  ids.forEach((id) => {
    refs[id] = document.getElementById(id);
  });
}

function seedDB() {
  const existing = localStorage.getItem(LS_DB);
  if (existing) {
    state.db = normalizeDBShape(JSON.parse(existing));
    return;
  }
  const now = new Date().toISOString().slice(0, 10);
  state.db = {
    stores: [
      { id: uid("store"), name: "Kuka Home Tashkent" },
      { id: uid("store"), name: "Kuka Home Samarkand" },
    ],
    users: [],
    notifications: [],
    clients: [
      {
        id: uid("client"),
        date: now,
        contact: "+998 90 123 45 67",
        source: "instagram",
        interest: "Divan premium",
        comment: "Narx va yetkazib berishga qiziqdi",
        attended: "yes",
        price: 1200,
        currency: "USD",
        status: "green",
        storeId: "",
        managerId: "",
        createdAt: new Date().toISOString(),
        createdBy: "",
      },
    ],
  };
  const admin = {
    id: uid("user"),
    role: "admin",
    login: "admin",
    password: "admin123",
    firstName: "System",
    lastName: "Admin",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&auto=format&fit=crop",
    storeId: "",
  };
  const m1 = {
    id: uid("user"),
    role: "manager",
    login: "manager1",
    password: "123456",
    firstName: "Ali",
    lastName: "Karimov",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop",
    storeId: state.db.stores[0].id,
  };
  const m2 = {
    id: uid("user"),
    role: "manager",
    login: "manager2",
    password: "123456",
    firstName: "Madina",
    lastName: "Rasulova",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80&auto=format&fit=crop",
    storeId: state.db.stores[1].id,
  };
  state.db.users.push(admin, m1, m2);
  state.db.clients[0].storeId = m1.storeId;
  state.db.clients[0].managerId = m1.id;
  state.db.clients[0].createdBy = admin.id;
  saveDB();
}

function bindEvents() {
  refs.loginForm.addEventListener("submit", onLogin);
  refs.logoutBtn.addEventListener("click", logout);
  refs.addClientBtn.addEventListener("click", () => openClientModal());
  refs.closeClientModal.addEventListener("click", closeClientModal);
  refs.clientModal.addEventListener("click", (e) => e.target === refs.clientModal && closeClientModal());
  refs.clientForm.addEventListener("submit", onClientSubmit);
  refs.dateFilterBtn.addEventListener("click", () => toggleModal(refs.dateModal, true));
  refs.dateRangeForm.addEventListener("submit", onDateRangeSubmit);
  refs.clearDateRange.addEventListener("click", clearDateRange);
  refs.dateModal.addEventListener("click", (e) => e.target === refs.dateModal && toggleModal(refs.dateModal, false));
  refs.searchInput.addEventListener("input", (e) => onFilterChange("search", e.target.value));
  refs.statusFilter.addEventListener("change", (e) => onFilterChange("status", e.target.value));
  refs.attendanceFilter.addEventListener("change", (e) => onFilterChange("attended", e.target.value));
  refs.storeFilter.addEventListener("change", (e) => onFilterChange("storeId", e.target.value));
  refs.managerFilter.addEventListener("change", (e) => onFilterChange("managerId", e.target.value));
  refs.clearFilters.addEventListener("click", clearFilters);
  refs.menuToggle.addEventListener("click", () => refs.sidebar.classList.toggle("open"));
  refs.exportBtn.addEventListener("click", exportExcel);
  refs.excelInput.addEventListener("change", importExcel);
  refs.profileForm.addEventListener("submit", onProfileSubmit);
  refs.passwordForm.addEventListener("submit", onPasswordSubmit);
  refs.managerForm.addEventListener("submit", onManagerAdd);
  refs.storeForm.addEventListener("submit", onStoreAdd);
  refs.managerEditForm.addEventListener("submit", onManagerEditSubmit);
  refs.openManagerModal.addEventListener("click", () => toggleModal(refs.managerModal, true));
  refs.openStoreModal.addEventListener("click", () => toggleModal(refs.storeModal, true));
  refs.closeManagerModal.addEventListener("click", () => toggleModal(refs.managerModal, false));
  refs.closeStoreModal.addEventListener("click", () => toggleModal(refs.storeModal, false));
  refs.managerModal.addEventListener("click", (e) => e.target === refs.managerModal && toggleModal(refs.managerModal, false));
  refs.storeModal.addEventListener("click", (e) => e.target === refs.storeModal && toggleModal(refs.storeModal, false));
  refs.closeManagerEditModal.addEventListener("click", closeManagerEditModal);
  refs.managerEditModal.addEventListener("click", (e) => e.target === refs.managerEditModal && closeManagerEditModal());

  window.addEventListener("storage", onStorageSync);

  document.querySelectorAll(".menu-item").forEach((btn) => {
    btn.addEventListener("click", () => switchPage(btn.dataset.page));
  });
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyPresetRange(btn.dataset.range));
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

function restoreSession() {
  const userId = localStorage.getItem(LS_SESSION);
  state.user = state.db.users.find((u) => u.id === userId) || null;
  refreshUI();
}

function onStorageSync(event) {
  if (event.key !== LS_DB || !event.newValue) return;
  state.db = normalizeDBShape(JSON.parse(event.newValue));
  if (!state.user) return;
  const sameUser = state.db.users.find((u) => u.id === state.user.id);
  if (!sameUser) {
    logout();
    return;
  }
  state.user = sameUser;
  renderProfile();
  if (state.page === "clients") {
    renderFilters();
    renderTableWithLoading();
  } else {
    renderSettings();
  }
  renderNotifications();
}

function onLogin(e) {
  e.preventDefault();
  const fd = new FormData(refs.loginForm);
  const login = String(fd.get("login") || "").trim();
  const password = String(fd.get("password") || "").trim();
  const user = state.db.users.find((u) => u.login === login && u.password === password);
  if (!user) {
    refs.authHelp.textContent = t("loginError");
    return;
  }
  refs.authHelp.textContent = "";
  if (refs.rememberMe.checked) {
    localStorage.setItem(LS_REMEMBER, JSON.stringify({ login, password }));
  } else {
    localStorage.removeItem(LS_REMEMBER);
  }
  state.user = user;
  localStorage.setItem(LS_SESSION, user.id);
  refreshUI();
}

function logout() {
  state.user = null;
  localStorage.removeItem(LS_SESSION);
  refreshUI();
}

function refreshUI() {
  const isAuth = Boolean(state.user);
  refs.authView.classList.toggle("hidden", isAuth);
  refs.appView.classList.toggle("hidden", !isAuth);
  if (!isAuth) {
    refs.authHelp.textContent = "";
    refs.notifMenu.classList.add("hidden");
    renderLanguageMenus();
    return;
  }
  if (state.user.role === "manager") {
    state.filters.storeId = state.user.storeId || "";
    state.filters.managerId = state.user.id;
  }
  renderProfile();
  renderLanguageMenus();
  renderNotifications();
  switchPage(state.page, true);
}

function renderProfile() {
  const store = getStore(state.user.storeId);
  refs.profileName.textContent = `${state.user.firstName} ${state.user.lastName}`;
  refs.profileRole.textContent = state.user.role === "admin" ? t("roleAdmin") : t("roleManager");
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
      return `<button type="button" class="lang-item ${active}" data-lang="${l.value}"><img src="${l.flag}" alt="${l.code}" /><span class="lang-meta"><span class="lang-code">${l.code}</span><span>${I18N[l.value].langName}</span></span></button>`;
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
  const unread = list.filter((n) => !isNotificationRead(n, state.user.id)).length;
  refs.notifCount.textContent = unread > 99 ? "99+" : String(unread);
  refs.notifCount.classList.toggle("hidden", unread === 0);
  refs.notifMarkRead.textContent = t("markAllRead");

  if (!list.length) {
    refs.notifList.innerHTML = `<p class="notif-empty">${escapeHtml(t("noNotifications"))}</p>`;
    return;
  }

  refs.notifList.innerHTML = list.slice(0, 50).map((n) => {
    const unreadClass = isNotificationRead(n, state.user.id) ? "" : "unread";
    return `<div class="notif-item ${unreadClass}"><div>${escapeHtml(notificationText(n))}</div><div class="notif-time">${escapeHtml(fmtDateTime(n.createdAt))}</div></div>`;
  }).join("");
}

function notificationText(notification) {
  const contact = notification.clientContact || "-";
  if (notification.type === "assigned_by_admin") {
    return template(t("notifAssignedByAdmin"), { contact });
  }
  if (notification.type === "new_client_from_manager") {
    const actor = getUser(notification.actorId);
    return template(t("notifNewClientFromManager"), { contact, manager: fullName(actor) || "-" });
  }
  return contact;
}

function getUserNotifications() {
  return (state.db.notifications || [])
    .filter((n) => n.toUserId === state.user.id)
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0));
}

function isNotificationRead(notification, userId) {
  return Array.isArray(notification.readBy) && notification.readBy.includes(userId);
}

function markNotificationsAsRead() {
  if (!state.user) return;
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

function addNotification(payload) {
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
  document.querySelectorAll(".menu-item").forEach((m) => m.classList.toggle("active", m.dataset.page === page));
  refs.clientsPage.classList.toggle("hidden", page !== "clients");
  refs.settingsPage.classList.toggle("hidden", page !== "settings");
  refs.pageTitle.textContent = page === "clients" ? t("clientsTitle") : t("settingsTitle");
  refs.pageSubtitle.textContent = page === "clients" ? t("clientsSubtitle") : t("settingsSubtitle");
  refs.sidebar.classList.remove("open");
  if (page === "clients") {
    renderFilters();
    renderTableWithLoading();
  } else {
    renderSettings();
  }
}

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

function onDateRangeSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.dateRangeForm);
  state.dateRange.from = String(fd.get("from") || "");
  state.dateRange.to = String(fd.get("to") || "");
  toggleModal(refs.dateModal, false);
  updateDateChip();
  state.pageIndex = 1;
  renderTableWithLoading();
}

function clearDateRange() {
  state.dateRange = { from: "", to: "" };
  refs.dateRangeForm.reset();
  toggleModal(refs.dateModal, false);
  updateDateChip();
  renderTableWithLoading();
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
  state.dateRange = { from, to };
  document.querySelectorAll(".preset-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.range === type));
  updateDateChip();
  renderTableWithLoading();
}

function updateDateChip() {
  if (state.dateRange.from || state.dateRange.to) {
    refs.dateFilterBtn.textContent = `${fmtDate(state.dateRange.from || "-")} - ${fmtDate(state.dateRange.to || "-")}`;
    return;
  }
  refs.dateFilterBtn.textContent = `${t("today")}: ${fmtDate(new Date().toISOString().slice(0, 10))}`;
}

function renderTableWithLoading() {
  refs.tableLoading.classList.add("show");
  setTimeout(() => {
    renderTable();
    refs.tableLoading.classList.remove("show");
  }, 120);
}

function renderTable() {
  const isAdmin = state.user.role === "admin";
  const headers = [
    t("number"),
    t("date"),
    ...(isAdmin ? [t("store"), t("manager")] : []),
    t("contact"),
    t("source"),
    t("interest"),
    t("comment"),
    t("attended"),
    t("price"),
    t("status"),
    t("action"),
  ];
  refs.tableHeadRow.innerHTML = headers.map((h) => `<th>${h}</th>`).join("");

  const rows = getFilteredClients();
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (state.pageIndex > pageCount) state.pageIndex = pageCount;
  const start = (state.pageIndex - 1) * PAGE_SIZE;
  const current = rows.slice(start, start + PAGE_SIZE);

  if (!current.length) {
    refs.clientsTbody.innerHTML = `<tr><td colspan="${headers.length}">${t("noData")}</td></tr>`;
  } else {
    refs.clientsTbody.innerHTML = current.map((c, idx) => {
      const manager = getUser(c.managerId);
      const store = getStore(c.storeId);
      const canDelete = isAdmin;
      const price = (c.price || c.price === 0) ? `${numberFmt(c.price)} ${c.currency || "UZS"}` : "-";
      const attendedText = c.attended === "yes" ? t("attendedYes") : c.attended === "no" ? t("attendedNo") : "-";
      const statusCell = ["green", "yellow", "red"].includes(c.status) ? `<span class="tag ${c.status}">${t(c.status)}</span>` : "-";
      const cells = [
        start + idx + 1,
        fmtDate(c.date),
        ...(isAdmin ? [
          `<span class="cell-text cell-store">${escapeHtml(store ? store.name : "-")}</span>`,
          `<span class="cell-text cell-manager">${escapeHtml(manager ? `${manager.firstName} ${manager.lastName}` : "-")}</span>`,
        ] : []),
        `<span class="cell-text cell-contact">${escapeHtml(c.contact)}</span>`,
        `<span class="cell-text">${escapeHtml(sourceLabel(c.source))}</span>`,
        `<span class="cell-text cell-interest">${escapeHtml(c.interest || "-")}</span>`,
        `<span class="cell-text cell-comment">${escapeHtml(c.comment || "-")}</span>`,
        attendedText,
        price,
        statusCell,
        `<div class="action-pack"><button class="action-btn" data-action="edit" data-id="${c.id}" aria-label="edit"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button>${canDelete ? `<button class="action-btn" data-action="delete" data-id="${c.id}" aria-label="delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>` : ""}</div>`,
      ];
      return `<tr>${cells.map((v, i) => `<td data-label="${headers[i]}">${v}</td>`).join("")}</tr>`;
    }).join("");
  }

  refs.countInfo.textContent = t("pageInfo").replace("{total}", total).replace("{shown}", current.length);
  renderPagination(pageCount);

  refs.clientsTbody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === "edit") openClientModal(id);
      if (btn.dataset.action === "delete") deleteClient(id);
    });
  });
}

function renderPagination(pageCount) {
  refs.pagination.innerHTML = "";
  for (let i = 1; i <= pageCount; i += 1) {
    const b = document.createElement("button");
    b.className = `page-btn ${state.pageIndex === i ? "active" : ""}`;
    b.textContent = String(i);
    b.addEventListener("click", () => {
      state.pageIndex = i;
      renderTableWithLoading();
    });
    refs.pagination.appendChild(b);
  }
}

function getFilteredClients() {
  return state.db.clients
    .filter((c) => (state.user.role === "admin" ? true : c.managerId === state.user.id))
    .filter((c) => (state.filters.status ? c.status === state.filters.status : true))
    .filter((c) => (state.filters.attended ? c.attended === state.filters.attended : true))
    .filter((c) => (state.filters.storeId ? c.storeId === state.filters.storeId : true))
    .filter((c) => (state.filters.managerId ? c.managerId === state.filters.managerId : true))
    .filter((c) => {
      if (!state.dateRange.from && !state.dateRange.to) return true;
      if (state.dateRange.from && c.date < state.dateRange.from) return false;
      if (state.dateRange.to && c.date > state.dateRange.to) return false;
      return true;
    })
    .filter((c) => {
      const q = state.filters.search.trim().toLowerCase();
      if (!q) return true;
      return [c.contact, c.interest, c.comment, sourceLabel(c.source)].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aTs = Date.parse(a.createdAt || "") || 0;
      const bTs = Date.parse(b.createdAt || "") || 0;
      if (aTs !== bTs) return bTs - aTs;
      const aDate = String(a.date || "");
      const bDate = String(b.date || "");
      if (aDate === bDate) return 0;
      return aDate < bDate ? 1 : -1;
    });
}

function openClientModal(clientId) {
  state.editingClientId = clientId || null;
  const editing = state.db.clients.find((c) => c.id === clientId);
  refs.clientModalTitle.textContent = editing ? t("editClientTitle") : t("addClientTitle");
  const fd = refs.clientForm;

  const optionalForAdmin = state.user.role === "admin";
  fd.querySelector("select[name='attended']").innerHTML = [
    ...(optionalForAdmin ? [option("", "-")] : []),
    option("yes", t("attendedYes")),
    option("no", t("attendedNo")),
  ].join("");
  fd.querySelector("select[name='source']").innerHTML = [
    option("", "-"),
    option("instagram", t("sourceInstagram")),
    option("new_client", t("sourceNewClient")),
    option("potential_client", t("sourcePotential")),
  ].join("");
  fd.querySelector("select[name='currency']").innerHTML = [option("UZS", "UZS"), option("USD", "USD")].join("");
  fd.querySelector("select[name='status']").innerHTML = [
    ...(optionalForAdmin ? [option("", "-")] : []),
    option("green", t("green")),
    option("yellow", t("yellow")),
    option("red", t("red")),
  ].join("");
  const storeSelect = fd.querySelector("select[name='storeId']");
  const managerSelect = fd.querySelector("select[name='managerId']");
  storeSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");

  const syncManagerOptions = (preferredManagerId = "") => {
    const scopedManagers = managersByStore(storeSelect.value);
    managerSelect.innerHTML = scopedManagers.map((m) => option(m.id, `${m.firstName} ${m.lastName}`)).join("");
    if (!scopedManagers.length) {
      managerSelect.innerHTML = option("", "-");
      managerSelect.value = "";
      return;
    }
    if (preferredManagerId && scopedManagers.some((m) => m.id === preferredManagerId)) {
      managerSelect.value = preferredManagerId;
      return;
    }
    managerSelect.value = scopedManagers[0].id;
  };

  storeSelect.onchange = () => syncManagerOptions();

  const adminOnly = fd.querySelectorAll(".admin-only");
  adminOnly.forEach((el) => el.classList.toggle("hidden", state.user.role !== "admin"));

  const requiredByRole = state.user.role === "manager";
  fd.querySelector("[name='source']").required = true;
  ["interest", "comment", "attended", "price", "status"].forEach((name) => {
    fd.querySelector(`[name='${name}']`).required = requiredByRole;
  });

  if (!editing) {
    fd.reset();
    fd.date.value = new Date().toISOString().slice(0, 10);
    fd.attended.value = optionalForAdmin ? "" : "yes";
    fd.source.value = "";
    fd.status.value = optionalForAdmin ? "" : "green";
    fd.currency.value = "UZS";
    if (state.user.role === "admin") {
      const firstManager = managers()[0];
      fd.storeId.value = firstManager ? firstManager.storeId : state.db.stores[0]?.id || "";
      syncManagerOptions(firstManager ? firstManager.id : "");
    } else {
      fd.storeId.value = state.user.storeId;
      syncManagerOptions(state.user.id);
    }
  } else {
    fd.date.value = editing.date;
    fd.contact.value = editing.contact;
    fd.source.value = editing.source || "";
    fd.interest.value = editing.interest;
    fd.comment.value = editing.comment;
    fd.attended.value = editing.attended;
    fd.price.value = editing.price;
    fd.currency.value = editing.currency;
    fd.status.value = editing.status;
    fd.storeId.value = editing.storeId;
    syncManagerOptions(editing.managerId);
  }
  toggleModal(refs.clientModal, true);
}

function closeClientModal() {
  toggleModal(refs.clientModal, false);
  state.editingClientId = null;
}

function onClientSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.clientForm);
  const payload = {
    date: String(fd.get("date") || ""),
    contact: String(fd.get("contact") || "").trim(),
    source: String(fd.get("source") || "").trim(),
    interest: String(fd.get("interest") || "").trim(),
    comment: String(fd.get("comment") || "").trim(),
    attended: String(fd.get("attended") || ""),
    price: String(fd.get("price") || "").trim() === "" ? null : Number(fd.get("price")),
    currency: String(fd.get("currency") || "UZS"),
    status: String(fd.get("status") || "").trim(),
    storeId: state.user.role === "admin" ? String(fd.get("storeId") || "") : state.user.storeId,
    managerId: state.user.role === "admin" ? String(fd.get("managerId") || "") : state.user.id,
  };
  const managerNeedsAll = state.user.role === "manager";
  const managerMissing = !payload.interest || !payload.comment || !payload.attended || !payload.status || payload.price === null || Number.isNaN(payload.price);
  const invalidPrice = payload.price !== null && Number.isNaN(payload.price);
  if (!payload.date || !payload.contact || !payload.source || !payload.managerId || !payload.storeId || invalidPrice || (managerNeedsAll && managerMissing)) {
    showToast(t("fillRequired"));
    return;
  }

  if (state.editingClientId) {
    const client = state.db.clients.find((x) => x.id === state.editingClientId);
    Object.assign(client, payload);
    showToast(t("updated"));
  } else {
    const createdClient = {
      id: uid("client"),
      ...payload,
      createdAt: new Date().toISOString(),
      createdBy: state.user.id,
    };
    state.db.clients.unshift(createdClient);
    if (state.user.role === "admin" && createdClient.managerId) {
      addNotification({
        type: "assigned_by_admin",
        toUserId: createdClient.managerId,
        actorId: state.user.id,
        clientId: createdClient.id,
        clientContact: createdClient.contact,
      });
    }
    if (state.user.role === "manager") {
      admins().forEach((admin) => {
        addNotification({
          type: "new_client_from_manager",
          toUserId: admin.id,
          actorId: state.user.id,
          clientId: createdClient.id,
          clientContact: createdClient.contact,
        });
      });
    }
    showToast(t("created"));
  }
  saveDB();
  closeClientModal();
  renderTableWithLoading();
}

function deleteClient(id) {
  if (state.user.role !== "admin") return;
  state.db.clients = state.db.clients.filter((c) => c.id !== id);
  saveDB();
  showToast(t("deleted"));
  renderTableWithLoading();
}

function onProfileSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.profileForm);
  state.user.firstName = String(fd.get("firstName") || "").trim();
  state.user.lastName = String(fd.get("lastName") || "").trim();
  saveDB();
  renderProfile();
  showToast(t("profileSaved"));
}

function onPasswordSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.passwordForm);
  const currentPassword = String(fd.get("currentPassword") || "").trim();
  const newPassword = String(fd.get("newPassword") || "").trim();
  const confirmPassword = String(fd.get("confirmPassword") || "").trim();
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast(t("fillRequired"));
    return;
  }
  if (state.user.password !== currentPassword) {
    showToast(t("currentPasswordWrong"));
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast(t("passwordMismatch"));
    return;
  }
  state.user.password = newPassword;
  saveDB();
  refs.passwordForm.reset();
  showToast(t("passwordUpdated"));
}

function renderSettings() {
  refs.profileForm.firstName.value = state.user.firstName;
  refs.profileForm.lastName.value = state.user.lastName;
  const isAdmin = state.user.role === "admin";
  refs.adminSettings.classList.toggle("hidden", !isAdmin);
  refs.passwordSettingsCard.classList.toggle("hidden", isAdmin);
  if (!isAdmin) return;

  refs.managerStoreSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");

  refs.managerList.innerHTML = managers().map((m) => {
    const store = getStore(m.storeId);
    return `<li><span>${m.firstName} ${m.lastName} (${m.login}) - ${store ? store.name : "-"}</span><span class="chip-actions"><button class="action-btn" data-edit-mid="${m.id}" aria-label="edit"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" data-mid="${m.id}" aria-label="delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span></li>`;
  }).join("");
  refs.managerList.querySelectorAll("button[data-edit-mid]").forEach((btn) => {
    btn.addEventListener("click", () => openManagerEditModal(btn.dataset.editMid));
  });
  refs.managerList.querySelectorAll("button[data-mid]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mid;
      state.db.users = state.db.users.filter((u) => u.id !== id);
      state.db.clients = state.db.clients.filter((c) => c.managerId !== id);
      saveDB();
      renderSettings();
      renderFilters();
      renderTableWithLoading();
      showToast(t("managerDeleted"));
    });
  });

  refs.storeList.innerHTML = state.db.stores.map((s) => `<li><span>${s.name}</span><button class="action-btn" data-sid="${s.id}" aria-label="delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></li>`).join("");
  refs.storeList.querySelectorAll("button[data-sid]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.sid;
      const inUse = state.db.users.some((u) => u.storeId === id) || state.db.clients.some((c) => c.storeId === id);
      if (inUse) {
        showToast(t("cannotDeleteStore"));
        return;
      }
      state.db.stores = state.db.stores.filter((s) => s.id !== id);
      saveDB();
      renderSettings();
      renderFilters();
      showToast(t("storeDeleted"));
    });
  });
}

function onManagerAdd(e) {
  e.preventDefault();
  const fd = new FormData(refs.managerForm);
  const login = String(fd.get("login") || "").trim();
  if (state.db.users.some((u) => u.login === login)) {
    showToast(t("loginTaken"));
    return;
  }
  state.db.users.push({
    id: uid("user"),
    role: "manager",
    firstName: String(fd.get("firstName") || "").trim(),
    lastName: String(fd.get("lastName") || "").trim(),
    login,
    password: String(fd.get("password") || "").trim(),
    storeId: String(fd.get("storeId") || ""),
    avatar: defaultAvatar(),
  });
  refs.managerForm.reset();
  saveDB();
  renderSettings();
  renderFilters();
  showToast(t("managerAdded"));
  toggleModal(refs.managerModal, false);
}

function openManagerEditModal(managerId) {
  state.editingManagerId = managerId;
  const manager = state.db.users.find((u) => u.id === managerId && u.role === "manager");
  if (!manager) return;
  refs.managerEditStoreSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");
  refs.managerEditForm.firstName.value = manager.firstName;
  refs.managerEditForm.lastName.value = manager.lastName;
  refs.managerEditForm.login.value = manager.login;
  refs.managerEditForm.password.value = manager.password;
  refs.managerEditForm.storeId.value = manager.storeId;
  toggleModal(refs.managerEditModal, true);
}

function closeManagerEditModal() {
  toggleModal(refs.managerEditModal, false);
  refs.managerEditForm.reset();
  state.editingManagerId = null;
}

function onManagerEditSubmit(e) {
  e.preventDefault();
  if (!state.editingManagerId) return;
  const manager = state.db.users.find((u) => u.id === state.editingManagerId && u.role === "manager");
  if (!manager) return;
  const fd = new FormData(refs.managerEditForm);
  const login = String(fd.get("login") || "").trim();
  const loginUsed = state.db.users.some((u) => u.login === login && u.id !== manager.id);
  if (loginUsed) {
    showToast(t("loginTaken"));
    return;
  }
  manager.firstName = String(fd.get("firstName") || "").trim();
  manager.lastName = String(fd.get("lastName") || "").trim();
  manager.login = login;
  manager.password = String(fd.get("password") || "").trim();
  manager.storeId = String(fd.get("storeId") || "");
  saveDB();
  renderSettings();
  renderFilters();
  renderTableWithLoading();
  closeManagerEditModal();
  showToast(t("managerUpdated"));
}

function onStoreAdd(e) {
  e.preventDefault();
  const fd = new FormData(refs.storeForm);
  const storeName = String(fd.get("storeName") || "").trim();
  if (!storeName) return;
  state.db.stores.push({ id: uid("store"), name: storeName });
  refs.storeForm.reset();
  saveDB();
  renderSettings();
  renderFilters();
  showToast(t("storeAdded"));
  toggleModal(refs.storeModal, false);
}

function exportExcel() {
  const data = getFilteredClients().map((c, i) => ({
    No: i + 1,
    Date: c.date,
    Store: getStore(c.storeId)?.name || "",
    Manager: fullName(getUser(c.managerId)),
    Contact: c.contact,
    Source: sourceLabel(c.source),
    Interest: c.interest,
    Comment: c.comment,
    Attended: c.attended,
    Price: c.price,
    Currency: c.currency,
    Status: c.status,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  XLSX.writeFile(wb, "clients_export.xlsx");
  showToast(t("exported"));
}

function importExcel(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const wb = XLSX.read(evt.target.result, { type: "binary" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    const now = Date.now();
    rows.forEach((r) => {
      const m = normalizeRow(r);
      if (!m.date || !m.contact) return;
      state.db.clients.push({
        id: uid("client"),
        date: m.date,
        contact: m.contact,
        source: m.source,
        interest: m.interest,
        comment: m.comment,
        attended: m.attended,
        price: Number(m.price) || 0,
        currency: m.currency,
        status: m.status,
        storeId: m.storeId || (state.user.role === "admin" ? state.db.stores[0]?.id || "" : state.user.storeId),
        managerId: m.managerId || (state.user.role === "admin" ? managers()[0]?.id || "" : state.user.id),
        createdAt: new Date(now + Math.floor(Math.random() * 1000)).toISOString(),
        createdBy: state.user.id,
      });
    });
    saveDB();
    renderTableWithLoading();
    showToast(t("imported"));
    refs.excelInput.value = "";
  };
  reader.readAsBinaryString(file);
}

function normalizeRow(row) {
  const data = {};
  Object.keys(row).forEach((k) => {
    data[k.toLowerCase().trim()] = row[k];
  });
  const storeName = String(data.store || data.showroom || "").trim();
  const sourceRaw = String(data.source || data.manba || data.channel || "").trim().toLowerCase();
  const source = sourceRaw.includes("inst")
    ? "instagram"
    : sourceRaw.includes("pot")
      ? "potential_client"
      : sourceRaw.includes("new") || sourceRaw.includes("yangi")
        ? "new_client"
        : "new_client";
  const managerName = String(data.manager || "").trim().toLowerCase();
  const manager = managers().find((m) => `${m.firstName} ${m.lastName}`.toLowerCase() === managerName);
  const store = state.db.stores.find((s) => s.name.toLowerCase() === storeName.toLowerCase());
  return {
    date: String(data.date || data.sana || "").slice(0, 10),
    contact: String(data.contact || data.phone || data.telefon || "").trim(),
    source,
    interest: String(data.interest || data.qiziqish || "").trim(),
    comment: String(data.comment || data.fikr || "").trim(),
    attended: String(data.attended || data.keldi || "yes").toLowerCase().startsWith("n") ? "no" : "yes",
    price: data.price || data.narx || 0,
    currency: String(data.currency || data.valyuta || "UZS").toUpperCase() === "USD" ? "USD" : "UZS",
    status: ["green", "yellow", "red"].includes(String(data.status || "").toLowerCase()) ? String(data.status).toLowerCase() : "green",
    storeId: store?.id,
    managerId: manager?.id,
  };
}

function toggleModal(el, show) {
  el.classList.toggle("hidden", !show);
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.remove("hidden");
  setTimeout(() => refs.toast.classList.add("hidden"), 1700);
}

function managers() {
  return state.db.users.filter((u) => u.role === "manager");
}

function admins() {
  return state.db.users.filter((u) => u.role === "admin");
}

function managersByStore(storeId) {
  if (!storeId) return managers();
  return managers().filter((m) => m.storeId === storeId);
}

function getStore(id) {
  return state.db.stores.find((s) => s.id === id);
}

function getUser(id) {
  return state.db.users.find((u) => u.id === id);
}

function fullName(user) {
  return user ? `${user.firstName} ${user.lastName}` : "";
}

function saveDB() {
  localStorage.setItem(LS_DB, JSON.stringify(state.db));
}

function normalizeDBShape(db) {
  const safe = db || {};
  safe.stores = Array.isArray(safe.stores) ? safe.stores : [];
  safe.users = Array.isArray(safe.users) ? safe.users : [];
  safe.clients = Array.isArray(safe.clients) ? safe.clients : [];
  safe.notifications = Array.isArray(safe.notifications) ? safe.notifications : [];
  safe.clients.forEach((c, idx) => {
    if (!c.createdAt) {
      c.createdAt = c.date ? `${String(c.date).slice(0, 10)}T00:00:00.000Z` : new Date(0 + idx).toISOString();
    }
    if (!c.createdBy) c.createdBy = "";
    if (!c.source) c.source = "new_client";
  });
  safe.notifications.forEach((n) => {
    if (!n.createdAt) n.createdAt = new Date().toISOString();
    if (!Array.isArray(n.readBy)) n.readBy = [];
  });
  return safe;
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

function option(value, label) {
  return `<option value="${escapeHtml(String(value))}">${escapeHtml(String(label))}</option>`;
}

function defaultAvatar() {
  return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&q=80&auto=format&fit=crop";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtDate(iso) {
  if (!iso || iso === "-") return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

function fmtDateTime(iso) {
  const d = new Date(iso || "");
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hour}:${min}`;
}

function template(str, vars) {
  return Object.keys(vars).reduce((acc, key) => acc.replaceAll(`{${key}}`, String(vars[key])), str);
}

function sourceLabel(source) {
  if (source === "instagram") return t("sourceInstagram");
  if (source === "potential_client") return t("sourcePotential");
  return t("sourceNewClient");
}

function numberFmt(num) {
  return new Intl.NumberFormat(state.lang === "uz" ? "uz-UZ" : state.lang === "ru" ? "ru-RU" : "zh-CN", {
    maximumFractionDigits: 2,
  }).format(Number(num) || 0);
}

function shiftDate(base, diff) {
  const d = new Date(base);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
