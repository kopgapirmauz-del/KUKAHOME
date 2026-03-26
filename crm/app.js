const LS_DB = "premium_crm_db_v2";
const LS_SESSION = "premium_crm_session_v2";
const LS_REMEMBER = "premium_crm_remember_v2";
const PAGE_SIZE = 10;
const MAX_NOTIFICATIONS = 200;
const SALES_PAGE_SIZE = 10;
const REMOTE_DB_ENABLED = location.protocol === "http:" || location.protocol === "https:";
const API_DB_URL = "/api/db";
const REMOTE_SYNC_INTERVAL = 4000;
const API_LOGIN_URL = "/api/login";
const API_CLIENTS_URL = "/api/clients";
const API_DELETE_CLIENT_URL = "/api/delete-client";
const API_MANAGERS_URL = "/api/managers";
const API_SHOWROOMS_URL = "/api/showrooms";
const API_NOTIFICATIONS_URL = "/api/notifications";
const API_SALES_CHECK_FILE_URL = "/api/sales-check-file";

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
    menuIntegrations: "Integratsiyalar",
    menuWarehouse: "Ombor",
    menuSalesCheck: "Sotuv cheki",
    menuHR: "HR bo'limi",
    menuPriceLabel: "Narx yorlig'i",
    menuSettings: "Sozlamalar",
    addClient: "Mijoz qo'shish",
    logout: "Chiqish",
    importExcel: "Excel import",
    exportExcel: "Excel export",
    clearFilter: "Tozalash",
    profileSettings: "Profil sozlamalari",
    usersAndStores: "Foydalanuvchi va do'konlar",
    firstName: "Ism",
    lastName: "Familya",
    avatar: "Profil rasmi URL",
    save: "Saqlash",
    adminTools: "Admin boshqaruvi",
    addManager: "Foydalanuvchi qo'shish",
    managerList: "Foydalanuvchilar",
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
    settingsSubtitle: "Profil, foydalanuvchi va do'konlarni boshqarish",
    integrationsTitle: "Integratsiyalar",
    integrationsSubtitle: "Facebook, Instagram, Telegram va boshqa xizmatlarni ulash",
    warehouseTitle: "Ombor",
    warehouseSubtitle: "Mahsulot qoldig'i, kirim-chiqim va ombor nazorati",
    incomingTitle: "Xitoydan kelayotgan mebellar",
    incomingSubtitle: "Buyurtma qilingan mebellarni ko'rish va qaysi bosqichda yetib kelmoqda",
    stockTitle: "Ombor va showroomlardagi mebellar",
    stockSubtitle: "Hozirda omborda mavjud mebellar va showroomlar kesimidagi mebellar ro'yxati",
    incomingList: "Kelayotgan buyurtmalar",
    stockList: "Mavjud mebellar",
    furnitureModel: "Mebel modeli",
    furnitureNumber: "№",
    furnitureImage: "Rasm",
    furnitureInfo: "Ma'lumoti",
    quantity: "Soni",
    stage: "Bosqich",
    eta: "Taxminiy sana",
    locationType: "Joylashuv",
    warehouseOnly: "Ombor",
    showroomOnly: "Do'kon",
    storeAndWarehouse: "Do'kon + Ombor",
    noWarehouseData: "Hozircha ma'lumot yo'q",
    warehouseBack: "Orqaga qaytish",
    addFurniture: "Mebel qo'shish",
    viewList: "Ro'yxatni ko'rish",
    addIncomingOrder: "Yangi buyurtma qo'shish",
    deliveryFlow: "Yetib kelish jarayoni",
    stageFromChina: "Xitoydan chiqdi",
    stageNearBorder: "Chegaraga yaqinlashdi",
    stageAtBorder: "Chegarada",
    stageEnteredCountry: "Mamlakatga kirdi",
    stageArrivedDate: "Yetib kelish sanasi",
    salesCheckTitle: "Sotuv cheki",
    salesCheckSubtitle: "Cheklar tarixi, to'lovlar va hujjatlarni boshqarish",
    hrTitle: "HR bo'limi",
    hrSubtitle: "Xodimlar bo'yicha jarayonlar va ma'lumotlar bo'limi",
    priceLabelTitle: "Narx yorlig'i",
    priceLabelSubtitle: "Mahsulotlar uchun narx yorliqlarini tayyorlash bo'limi",
    addSalesCheck: "Sotuv chekini yaratish",
    salesSearchPlaceholder: "Do'kon yoki menedjer bo'yicha qidirish",
    salesReceiptUpload: "Sotuv chekini yuklash",
    salesNoData: "Sotuv cheklari topilmadi",
    salesFileMissing: "Fayl yo'q",
    salesCreated: "Sotuv cheki qo'shildi",
    salesUpdated: "Sotuv cheki yangilandi",
    salesDeleted: "Sotuv cheki o'chirildi",
    checkNumber: "Chek raqami",
    sellerNameLabel: "Sotuvchi ismi",
    orderParty: "Buyurtma beruvchi tomon",
    customerName: "Mijozning ismi",
    customerPhone: "Telefon raqami",
    supplier: "Ta'minotchi",
    sellerPhone: "Sotuvchi telefoni",
    paymentMethod: "To'lov usuli",
    deliveryDate: "Yetkazib berish sanasi",
    totalAmount: "Buyurtmaning umumiy summasi",
    prepayment: "Oldi to'lov miqdori",
    deliveryAddress: "Yetkazib berish manzili",
    productsRows: "Mahsulot qatorlari",
    orderNotes: "Buyurtma haqida ma'lumot",
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
    managerAdded: "Foydalanuvchi qo'shildi",
    managerDeleted: "Foydalanuvchi o'chirildi",
    storeAdded: "Do'kon qo'shildi",
    storeUpdated: "Do'kon yangilandi",
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
    managerUpdated: "Foydalanuvchi yangilandi",
    editManagerTitle: "Foydalanuvchini tahrirlash",
    editStoreTitle: "Do'konni tahrirlash",
    searchPlaceholder: "Telefon, qiziqish, fikr bo'yicha qidiruv",
    incomingSearchPlaceholder: "Model, ma'lumot yoki soni bo'yicha qidirish",
    stockSearchPlaceholder: "Model, do'kon yoki soni bo'yicha qidirish",
    stockToolbarHint: "Filter orqali kerakli mebellarni toping va eksport/import qiling",
    allLocations: "Barcha joylashuvlar",
    warehouseAndShowroom: "Do'kon + Ombor",
    editFurniture: "Mebelni tahrirlash",
    statusAvailable: "Mavjud",
    statusSold: "Sotilgan",
    statusUnavailable: "Mavjud emas",
    statusReserved: "Band qilingan",
    reserveColumn: "Band qilgan",
    reserveAction: "Band qilish",
    reserveModalTitle: "Mebelni band qilish",
    reserveFor: "Kimga",
    reserveReason: "Nima uchun",
    deleteReservation: "Bandni o'chirish",
    notReserved: "Band qilinmagan",
    action: "Amallar",
    number: "№",
    loginTaken: "Bu login band",
    rangeToday: "Bugun",
    range7: "Oxirgi 7 kun",
    range30: "Oxirgi 30 kun",
    rangeMonth: "Shu oy",
    rangeYear: "Shu yil",
    timezone: "Vaqt zonasi: Asia/Tashkent",
    testModeBanner: "Sayt test rejimida ishlayapti. Kamchilik va muammolar tez orada bartaraf etiladi.",
    langName: "O'zbek",
    notifications: "Bildirishnomalar",
    markAllRead: "Hammasini o'qilgan qilish",
    markRead: "O'qilgan",
    noNotifications: "Hozircha bildirishnoma yo'q",
    notifAssignedByAdmin: "Admin sizga yangi mijoz biriktirdi: {contact}",
    notifNewClientFromManager: "{manager} yangi mijoz qo'shdi: {contact}",
    notifNewLeadFromSite: "Saytdan yangi murojaat: {contact}",
    saveChanges: "Saqlash",
    unsavedChanges: "Saqlanmagan o'zgarishlar bor",
    changesSaved: "O'zgarishlar storage ga saqlandi",
    saveFailed: "Saqlashda xatolik. Serverni tekshiring",
    saveNeedServer: "Server orqali oching: saqlash uchun API kerak",
    confirmDeleteTitle: "O'chirishni tasdiqlang",
    deleteAction: "O'chirish",
    deletePermanentWarning: "O'chirilgan ma'lumot butunlay o'chadi va qayta tiklanmaydi. Davom etasizmi?",
  },
  ru: {
    loginTitle: "Система клиентской базы",
    loginSubtitle: "Профессиональная CRM-панель для админа и менеджеров",
    loginInput: "Логин",
    passwordInput: "Пароль",
    loginBtn: "Войти",
    rememberMe: "Запомнить меня",
    menuClients: "Клиентская база",
    menuIntegrations: "Интеграции",
    menuWarehouse: "Склад",
    menuSalesCheck: "Чек продаж",
    menuHR: "HR отдел",
    menuPriceLabel: "Ценники",
    menuSettings: "Настройки",
    addClient: "Добавить клиента",
    logout: "Выход",
    importExcel: "Импорт Excel",
    exportExcel: "Экспорт Excel",
    clearFilter: "Очистить",
    profileSettings: "Настройки профиля",
    usersAndStores: "Пользователи и магазины",
    firstName: "Имя",
    lastName: "Фамилия",
    avatar: "URL фото профиля",
    save: "Сохранить",
    adminTools: "Инструменты администратора",
    addManager: "Добавить пользователя",
    managerList: "Пользователи",
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
    settingsSubtitle: "Профиль, пользователи и магазины",
    integrationsTitle: "Интеграции",
    integrationsSubtitle: "Подключение Facebook, Instagram, Telegram и других сервисов",
    warehouseTitle: "Склад",
    warehouseSubtitle: "Остатки, приход-расход и контроль склада",
    incomingTitle: "Мебель в пути из Китая",
    incomingSubtitle: "Просмотр заказанной мебели и текущего этапа доставки",
    stockTitle: "Мебель на складе и в шоурумах",
    stockSubtitle: "Текущие остатки на складе и по шоурумам",
    incomingList: "Заказы в пути",
    stockList: "Наличие мебели",
    furnitureModel: "Модель мебели",
    furnitureNumber: "№",
    furnitureImage: "Фото",
    furnitureInfo: "Описание",
    quantity: "Количество",
    stage: "Этап",
    eta: "Ориентировочная дата",
    locationType: "Локация",
    warehouseOnly: "Склад",
    showroomOnly: "Магазин",
    storeAndWarehouse: "Магазин + склад",
    noWarehouseData: "Пока нет данных",
    warehouseBack: "Назад",
    addFurniture: "Добавить мебель",
    viewList: "Показать список",
    addIncomingOrder: "Добавить новый заказ",
    deliveryFlow: "Этап доставки",
    stageFromChina: "Вышло из Китая",
    stageNearBorder: "Приближается к границе",
    stageAtBorder: "На границе",
    stageEnteredCountry: "Вошло в страну",
    stageArrivedDate: "Дата прибытия",
    salesCheckTitle: "Чек продаж",
    salesCheckSubtitle: "История чеков, оплаты и документы по продажам",
    hrTitle: "HR отдел",
    hrSubtitle: "Раздел кадровых процессов и данных сотрудников",
    priceLabelTitle: "Ценники",
    priceLabelSubtitle: "Раздел подготовки ценников для товаров",
    addSalesCheck: "Создать чек продажи",
    salesSearchPlaceholder: "Поиск по магазину или менеджеру",
    salesReceiptUpload: "Скачать чек продажи",
    salesNoData: "Чеки продаж не найдены",
    salesFileMissing: "Файл отсутствует",
    salesCreated: "Чек продажи добавлен",
    salesUpdated: "Чек продажи обновлен",
    salesDeleted: "Чек продажи удален",
    checkNumber: "Номер чека",
    sellerNameLabel: "Имя продавца",
    orderParty: "Заказчик",
    customerName: "Имя клиента",
    customerPhone: "Телефон",
    supplier: "Поставщик",
    sellerPhone: "Телефон продавца",
    paymentMethod: "Способ оплаты",
    deliveryDate: "Дата доставки",
    totalAmount: "Общая сумма заказа",
    prepayment: "Сумма предоплаты",
    deliveryAddress: "Адрес доставки",
    productsRows: "Строки товаров",
    orderNotes: "Информация о заказе",
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
    storeUpdated: "Магазин обновлен",
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
    editManagerTitle: "Редактирование пользователя",
    editStoreTitle: "Редактирование магазина",
    searchPlaceholder: "Поиск по телефону, интересу и комментарию",
    incomingSearchPlaceholder: "Поиск по модели, описанию или количеству",
    stockSearchPlaceholder: "Поиск по модели, магазину или количеству",
    stockToolbarHint: "Используйте фильтры для поиска мебели и экспорта/импорта",
    allLocations: "Все локации",
    warehouseAndShowroom: "Магазин + склад",
    editFurniture: "Редактировать мебель",
    statusAvailable: "В наличии",
    statusSold: "Продано",
    statusUnavailable: "Нет в наличии",
    statusReserved: "Забронировано",
    reserveColumn: "Кто забронировал",
    reserveAction: "Бронь",
    reserveModalTitle: "Бронирование мебели",
    reserveFor: "Кому",
    reserveReason: "Причина",
    deleteReservation: "Снять бронь",
    notReserved: "Не забронировано",
    action: "Действия",
    number: "№",
    loginTaken: "Логин уже занят",
    rangeToday: "Сегодня",
    range7: "Последние 7 дней",
    range30: "Последние 30 дней",
    rangeMonth: "Этот месяц",
    rangeYear: "Этот год",
    timezone: "Часовой пояс: Asia/Tashkent",
    testModeBanner: "Сайт работает в тестовом режиме. Недочеты и ошибки скоро будут устранены.",
    langName: "Русский",
    notifications: "Уведомления",
    markAllRead: "Отметить все прочитанным",
    markRead: "Прочитано",
    noNotifications: "Уведомлений пока нет",
    notifAssignedByAdmin: "Админ назначил вам нового клиента: {contact}",
    notifNewClientFromManager: "{manager} добавил нового клиента: {contact}",
    notifNewLeadFromSite: "Новая заявка с сайта: {contact}",
    saveChanges: "Сохранить",
    unsavedChanges: "Есть несохраненные изменения",
    changesSaved: "Изменения сохранены в storage",
    saveFailed: "Ошибка сохранения. Проверьте сервер",
    saveNeedServer: "Откройте через сервер: для сохранения нужен API",
    confirmDeleteTitle: "Подтвердите удаление",
    deleteAction: "Удалить",
    deletePermanentWarning: "Удаленные данные будут удалены без возможности восстановления. Продолжить?",
  },
  zh: {
    loginTitle: "客户管理系统",
    loginSubtitle: "面向管理员和销售经理的专业 CRM 面板",
    loginInput: "登录名",
    passwordInput: "密码",
    loginBtn: "登录",
    rememberMe: "记住账号",
    menuClients: "客户库",
    menuIntegrations: "集成",
    menuWarehouse: "仓库",
    menuSalesCheck: "销售小票",
    menuHR: "HR 部门",
    menuPriceLabel: "价格标签",
    menuSettings: "设置",
    addClient: "添加客户",
    logout: "退出",
    importExcel: "导入 Excel",
    exportExcel: "导出 Excel",
    clearFilter: "清除",
    profileSettings: "个人设置",
    usersAndStores: "用户和门店",
    firstName: "名字",
    lastName: "姓氏",
    avatar: "头像 URL",
    save: "保存",
    adminTools: "管理员工具",
    addManager: "添加用户",
    managerList: "用户列表",
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
    settingsSubtitle: "管理个人资料、用户与门店",
    integrationsTitle: "集成",
    integrationsSubtitle: "连接 Facebook、Instagram、Telegram 等服务",
    warehouseTitle: "仓库",
    warehouseSubtitle: "库存、入库出库与仓库监控",
    incomingTitle: "中国在途家具",
    incomingSubtitle: "查看已下单家具及当前到货阶段",
    stockTitle: "仓库与展厅家具",
    stockSubtitle: "当前仓库库存与各展厅家具清单",
    incomingList: "在途订单",
    stockList: "现有库存",
    furnitureModel: "家具型号",
    furnitureNumber: "编号",
    furnitureImage: "图片",
    furnitureInfo: "说明",
    quantity: "数量",
    stage: "阶段",
    eta: "预计日期",
    locationType: "位置",
    warehouseOnly: "仓库",
    showroomOnly: "门店",
    storeAndWarehouse: "门店 + 仓库",
    noWarehouseData: "暂无数据",
    warehouseBack: "返回",
    addFurniture: "添加家具",
    viewList: "查看列表",
    addIncomingOrder: "添加新订单",
    deliveryFlow: "配送流程",
    stageFromChina: "已从中国发出",
    stageNearBorder: "接近边境",
    stageAtBorder: "在边境",
    stageEnteredCountry: "已进入国家",
    stageArrivedDate: "到达日期",
    salesCheckTitle: "销售小票",
    salesCheckSubtitle: "小票历史、付款记录和销售文档管理",
    hrTitle: "HR 部门",
    hrSubtitle: "员工流程与资料管理模块",
    priceLabelTitle: "价格标签",
    priceLabelSubtitle: "商品价格标签制作模块",
    addSalesCheck: "创建销售小票",
    salesSearchPlaceholder: "按门店或经理搜索",
    salesReceiptUpload: "下载销售小票",
    salesNoData: "未找到销售小票",
    salesFileMissing: "无文件",
    salesCreated: "销售小票已添加",
    salesUpdated: "销售小票已更新",
    salesDeleted: "销售小票已删除",
    checkNumber: "小票编号",
    sellerNameLabel: "销售姓名",
    orderParty: "下单方",
    customerName: "客户姓名",
    customerPhone: "电话",
    supplier: "供应商",
    sellerPhone: "销售电话",
    paymentMethod: "付款方式",
    deliveryDate: "送货日期",
    totalAmount: "订单总金额",
    prepayment: "预付款",
    deliveryAddress: "送货地址",
    productsRows: "商品行",
    orderNotes: "订单说明",
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
    storeUpdated: "门店已更新",
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
    editManagerTitle: "编辑用户",
    editStoreTitle: "编辑门店",
    searchPlaceholder: "按电话、兴趣、反馈搜索",
    incomingSearchPlaceholder: "按型号、说明或数量搜索",
    stockSearchPlaceholder: "按型号、门店或数量搜索",
    stockToolbarHint: "通过筛选快速查找家具并进行导入/导出",
    allLocations: "全部位置",
    warehouseAndShowroom: "门店 + 仓库",
    editFurniture: "编辑家具",
    statusAvailable: "有库存",
    statusSold: "已售出",
    statusUnavailable: "无库存",
    statusReserved: "已预留",
    reserveColumn: "预留人",
    reserveAction: "预留",
    reserveModalTitle: "预留家具",
    reserveFor: "给谁",
    reserveReason: "原因",
    deleteReservation: "取消预留",
    notReserved: "未预留",
    action: "操作",
    number: "编号",
    loginTaken: "该登录名已被使用",
    rangeToday: "今天",
    range7: "最近 7 天",
    range30: "最近 30 天",
    rangeMonth: "本月",
    rangeYear: "今年",
    timezone: "时区: Asia/Tashkent",
    testModeBanner: "网站当前处于测试模式。问题和缺陷将很快修复。",
    langName: "中文",
    notifications: "通知",
    markAllRead: "全部标记已读",
    markRead: "已读",
    noNotifications: "暂无通知",
    notifAssignedByAdmin: "管理员为你分配了新客户: {contact}",
    notifNewClientFromManager: "{manager} 新增了客户: {contact}",
    notifNewLeadFromSite: "网站新咨询: {contact}",
    saveChanges: "保存",
    unsavedChanges: "有未保存的更改",
    changesSaved: "更改已保存到 storage",
    saveFailed: "保存失败，请检查服务器",
    saveNeedServer: "请通过服务器打开，保存需要 API",
    confirmDeleteTitle: "确认删除",
    deleteAction: "删除",
    deletePermanentWarning: "删除后数据将被永久移除且无法恢复，是否继续？",
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
  editingStoreId: null,
  warehouseView: "",
  incomingEditMode: "full",
  editingOrderId: null,
  editingIncomingItemId: null,
  editingStockId: null,
  editingReserveStockId: null,
  editingSalesCheckId: null,
  stockSearch: "",
  stockLocationFilter: "",
  stockStoreFilter: "",
  salesFilters: {
    search: "",
    storeId: "",
    managerId: "",
  },
  salesPageIndex: 1,
  settingsTab: "profile",
  remoteNotifications: [],
  notificationPrimed: false,
  lastUnreadCount: 0,
};

const refs = {};
let remoteSyncTimer = null;
let notificationAudioCtx = null;
let confirmResolver = null;

init().catch((err) => {
  document.body.classList.remove("booting");
  const authView = document.getElementById("authView");
  const appView = document.getElementById("appView");
  if (authView) authView.classList.remove("hidden");
  if (appView) appView.classList.add("hidden");
  console.error("CRM init failed:", err);
});

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
      ? `<span class="notif-mark done">✓</span>`
      : `<button type="button" class="notif-mark" data-notif-read="${escapeHtml(n.id)}" title="${escapeHtml(t("markRead"))}">✓</button>`;
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
  const managerMode = state.user.role !== "admin";
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
  state.filters.storeId = state.user.role !== "admin" ? state.user.storeId : "";
  state.filters.managerId = state.user.role !== "admin" ? state.user.id : "";
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
  const chunkSize = 10;
  const showChunkNav = pageCount > chunkSize;
  const currentChunk = Math.floor((state.pageIndex - 1) / chunkSize);
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
      if (target === state.pageIndex) return;
      state.pageIndex = target;
      renderTableWithLoading();
    });
    refs.pagination.appendChild(prev);
  }

  for (let i = chunkStart; i <= chunkEnd; i += 1) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `page-btn ${state.pageIndex === i ? "active" : ""}`;
    b.textContent = String(i);
    b.addEventListener("click", () => {
      state.pageIndex = i;
      renderTableWithLoading();
    });
    refs.pagination.appendChild(b);
  }

  if (showChunkNav) {
    const next = document.createElement("button");
    next.type = "button";
    next.className = "page-btn";
    next.textContent = ">";
    next.disabled = chunkEnd >= pageCount;
    next.addEventListener("click", () => {
      const target = Math.min(pageCount, chunkStart + chunkSize);
      if (target === state.pageIndex) return;
      state.pageIndex = target;
      renderTableWithLoading();
    });
    refs.pagination.appendChild(next);
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
  closeSidebar();
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

  const requiredByRole = state.user.role !== "admin";
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

async function onClientSubmit(e) {
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
  const managerNeedsAll = state.user.role !== "admin";
  const managerMissing = !payload.interest || !payload.comment || !payload.attended || !payload.status || payload.price === null || Number.isNaN(payload.price);
  const invalidPrice = payload.price !== null && Number.isNaN(payload.price);
  if (!payload.date || !payload.contact || !payload.source || !payload.managerId || !payload.storeId || invalidPrice || (managerNeedsAll && managerMissing)) {
    showToast(t("fillRequired"));
    return;
  }

  if (state.editingClientId) {
    const client = state.db.clients.find((x) => x.id === state.editingClientId);
    const updatedClient = { ...(client || {}), ...payload };
    const updatedViaApi = await updateClientViaApi(state.editingClientId, updatedClient);
    if (!updatedViaApi) {
      Object.assign(client, payload);
      saveDB();
    } else {
      await loadClients();
    }
    showToast(t("updated"));
  } else {
    const createdClient = {
      id: uid("client"),
      ...payload,
      createdAt: new Date().toISOString(),
      createdBy: state.user.id,
    };
    const apiCreated = await addClient(createdClient);
    if (!apiCreated) {
      state.db.clients.unshift(createdClient);
    }
    if (state.user.role === "admin" && createdClient.managerId) {
      addNotification({
        type: "assigned_by_admin",
        toUserId: createdClient.managerId,
        actorId: state.user.id,
        clientId: createdClient.id,
        clientContact: createdClient.contact,
      });
    }
    if (state.user.role !== "admin" && !apiCreated) {
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
    saveDB();
    if (apiCreated) {
      await loadClients();
      await loadNotificationsFromApi();
    }
  }
  closeClientModal();
  renderTableWithLoading();
}

async function deleteClient(id) {
  if (state.user.role !== "admin") return;
  if (!(await confirmPermanentDelete())) return;
  const removedViaApi = await deleteClientViaApi(id);
  if (!removedViaApi) {
    state.db.clients = state.db.clients.filter((c) => c.id !== id);
    saveDB();
  } else {
    await loadClients();
  }
  showToast(t("deleted"));
  renderTableWithLoading();
}

async function onProfileSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.profileForm);
  state.user.firstName = String(fd.get("firstName") || "").trim();
  state.user.lastName = String(fd.get("lastName") || "").trim();
  if (state.user.role === "admin") {
    const adminLogin = String(fd.get("adminLogin") || "").trim();
    if (!adminLogin) {
      showToast(t("fillRequired"));
      return;
    }
    const loginUsed = state.db.users.some((u) => u.login === adminLogin && u.id !== state.user.id);
    if (loginUsed) {
      showToast(t("loginTaken"));
      return;
    }
    state.user.login = adminLogin;
  }
  if (REMOTE_DB_ENABLED) {
    const updated = await updateCurrentUserViaApi({
      full_name: fullName(state.user),
      login: state.user.login,
      password: state.user.password,
      role: state.user.role,
      showroom: getStore(state.user.storeId)?.name || "",
    });
    if (!updated) {
      showToast(t("saveFailed"));
      return;
    }
  }
  saveDB();
  localStorage.removeItem(LS_REMEMBER);
  renderProfile();
  showToast(t("profileSaved"));
}

async function onPasswordSubmit(e) {
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
  if (REMOTE_DB_ENABLED) {
    const updated = await updateCurrentUserViaApi({
      full_name: fullName(state.user),
      login: state.user.login,
      password: state.user.password,
      role: state.user.role,
      showroom: getStore(state.user.storeId)?.name || "",
    });
    if (!updated) {
      showToast(t("saveFailed"));
      return;
    }
  }
  saveDB();
  localStorage.removeItem(LS_REMEMBER);
  refs.passwordForm.reset();
  showToast(t("passwordUpdated"));
}

function renderSettings() {
  refs.profileForm.firstName.value = state.user.firstName;
  refs.profileForm.lastName.value = state.user.lastName;
  const isAdmin = state.user.role === "admin";
  refs.adminLoginField.classList.toggle("hidden", !isAdmin);
  refs.profileForm.adminLogin.required = isAdmin;
  refs.profileForm.adminLogin.value = isAdmin ? state.user.login : "";
  refs.adminSettings.classList.toggle("hidden", !isAdmin);
  refs.passwordSettingsCard.classList.toggle("hidden", false);
  if (refs.settingsUsersTab) refs.settingsUsersTab.classList.toggle("hidden", !isAdmin);
  setAdminActionActive(null);
  const requestedTab = isAdmin ? state.settingsTab : "profile";
  switchSettingsTab(requestedTab);
  if (!isAdmin) return;

  refs.managerRoleSelect.value = "manager";
  refs.managerStoreSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");
  syncManagerRoleStoreFields("create");

  refs.managerList.innerHTML = state.db.users.filter((u) => u.role !== "admin").map((m, idx) => {
    const store = getStore(m.storeId);
    const name = `${m.lastName || ""} ${m.firstName || ""}`.trim() || m.login || "-";
    const roleText = roleLabel(m.role);
    const lineText = m.role === "manager"
      ? `${idx + 1}. ${name} (${roleText}) - ${store ? store.name : "-"}`
      : `${idx + 1}. ${name} (${roleText})`;
    return `<li><span class="user-row-text">${lineText}</span><span class="chip-actions"><button class="action-btn" data-edit-mid="${m.id}" aria-label="edit"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" data-mid="${m.id}" aria-label="delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span></li>`;
  }).join("");
  refs.managerList.querySelectorAll("button[data-edit-mid]").forEach((btn) => {
    btn.addEventListener("click", () => openManagerEditModal(btn.dataset.editMid));
  });
  refs.managerList.querySelectorAll("button[data-mid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.mid;
      if (!(await confirmPermanentDelete())) return;
      state.db.users = state.db.users.filter((u) => u.id !== id);
      state.db.clients = state.db.clients.filter((c) => c.managerId !== id);
      saveDB();
      renderSettings();
      renderFilters();
      renderTableWithLoading();
      showToast(t("managerDeleted"));
    });
  });

  refs.storeList.innerHTML = state.db.stores.map((s, idx) => `<li><span class="store-row-text">${idx + 1}. ${s.name}</span><span class="chip-actions"><button class="action-btn" data-edit-sid="${s.id}" aria-label="edit"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" data-sid="${s.id}" aria-label="delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span></li>`).join("");
  refs.storeList.querySelectorAll("button[data-edit-sid]").forEach((btn) => {
    btn.addEventListener("click", () => openStoreEditModal(btn.dataset.editSid));
  });
  refs.storeList.querySelectorAll("button[data-sid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.sid;
      const inUse = state.db.users.some((u) => u.storeId === id) || state.db.clients.some((c) => c.storeId === id);
      if (inUse) {
        showToast(t("cannotDeleteStore"));
        return;
      }
      if (!(await confirmPermanentDelete())) return;
      state.db.stores = state.db.stores.filter((s) => s.id !== id);
      saveDB();
      renderSettings();
      renderFilters();
      showToast(t("storeDeleted"));
    });
  });
}

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
  refs.salesStoreFilter.innerHTML = [
    option("", t("allStores")),
    ...state.db.stores.map((s) => option(s.id, s.name)),
  ].join("");
  refs.salesManagerFilter.innerHTML = [
    option("", t("allManagers")),
    ...managers().map((m) => option(m.id, `${m.firstName} ${m.lastName}`)),
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

  const logo = await loadImageToCanvas("chek/file/logo.png");
  if (logo) ctx.drawImage(logo, 86, 22, 120, 96);
  const qr = await loadImageToCanvas("chek/file/qr.png");
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
      state.db.warehouseOrders = state.db.warehouseOrders.filter((x) => x.id !== btn.dataset.orderDelete);
      saveDB();
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
      order.items = (order.items || []).filter((x) => x.id !== btn.dataset.itemDelete);
      saveDB();
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
  refs.stockStoreFilter.value = state.stockStoreFilter;
  refs.stockLocationFilter.value = state.stockLocationFilter;

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
    btn.addEventListener("click", () => {
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
      saveDB();
      renderWarehouse();
    });
  });
  refs.stockTbody.querySelectorAll("button[data-stock-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.db.warehouseStock.find((x) => x.id === btn.dataset.stockDelete);
      if (!row || !isAdmin || !canManageStockRow(row)) return;
      if (!(await confirmPermanentDelete())) return;
      state.db.warehouseStock = state.db.warehouseStock.filter((x) => x.id !== row.id);
      saveDB();
      renderWarehouse();
    });
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
      <div class="incoming-preview-row">${renderIncomingTimeline(order.stageKey, order.eta)}${actions}</div>
      <div class="warehouse-top-actions">
        <button class="btn btn-light" data-order-toggle="${order.id}" type="button"><span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h16v2H4v-2Z"/></svg></span><span>${escapeHtml(t("viewList"))}</span></button>
      </div>
      <div class="incoming-list-wrap ${order.listOpen ? "" : "hidden"}">
        <div class="warehouse-head-actions">
          ${isAdmin ? `<button class="btn btn-primary" data-order-add-item="${order.id}" type="button"><span class="warehouse-add-plus" aria-hidden="true">+</span><span>${escapeHtml(t("addFurniture"))}</span></button>` : ""}
          <input class="search warehouse-search" data-order-search="${order.id}" placeholder="${escapeHtml(t("incomingSearchPlaceholder"))}" value="${escapeHtml(order.search)}" />
          ${isAdmin ? `<label class="toolbar-btn toolbar-btn-import warehouse-import-btn"><input type="file" data-order-import="${order.id}" accept=".xlsx,.xls,.csv" hidden /><span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-18-5.5 5.5 1.42 1.42L11 5.84V16h2V5.84l3.08 3.08 1.42-1.42L12 2Z"/></svg></span><span>${escapeHtml(t("importExcel"))}</span></label>` : ""}
          <button class="toolbar-btn warehouse-export-btn" data-order-export="${order.id}" type="button"><span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-16v10.16l-3.08-3.08-1.42 1.42L12 18l5.5-5.5-1.42-1.42L13 14.16V4h-2Z"/></svg></span><span>${escapeHtml(t("exportExcel"))}</span></button>
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

function addIncomingOrderCard() {
  if (!canWarehouseAdmin()) return;
  const orders = ensureWarehouseOrders();
  orders.unshift({ id: uid("order"), stageKey: "from_china", eta: "", listOpen: false, search: "", items: [] });
  saveDB();
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
    if (state.stockLocationFilter && row.locationType !== state.stockLocationFilter) return false;
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
  if (!(await confirmPermanentDelete())) return;
  row.reservation = null;
  row.updatedAt = new Date().toISOString();
  saveDB();
  closeStockReserveModal();
  renderWarehouse();
}

function onStockReserveSubmit(e) {
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
  saveDB();
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
    { key: "entered_country", label: t("stageEnteredCountry") },
    { key: "arrived_date", label: t("stageArrivedDate") },
  ];
}

function normalizeIncomingStageKey(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (incomingStages().some((s) => s.key === value)) return value;
  if (value.includes("xitoy") || value.includes("china")) return "from_china";
  if (value.includes("yaqin") || value.includes("near")) return "near_border";
  if (value.includes("chegara") || value.includes("border")) return "at_border";
  if (value.includes("kirdi") || value.includes("entered")) return "entered_country";
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

async function readImageAsDataUrl(file) {
  if (!file) return "";
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
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
  const qty = Number(fd.get("qty") || 0);
  const stageKey = normalizeIncomingStageKey(fd.get("stageKey"));
  const eta = String(fd.get("eta") || "");
  if (state.incomingEditMode !== "stage" && (!model || qty <= 0)) {
    showToast(t("fillRequired"));
    return;
  }
  const imageFile = refs.incomingForm.image.files?.[0] || null;
  const imageUrl = await readImageAsDataUrl(imageFile);
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
    if (imageUrl) target.imageUrl = imageUrl;
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
  saveDB();
  renderWarehouse();
}

async function onStockSubmit(e) {
  e.preventDefault();
  if (!canWarehouseAdmin()) return;
  const fd = new FormData(refs.stockForm);
  const model = String(fd.get("model") || "").trim();
  const info = String(fd.get("info") || "").trim();
  const qty = Number(fd.get("qty") || 0);
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
  const imageUrl = await readImageAsDataUrl(imageFile);

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
    if (imageUrl) row.imageUrl = imageUrl;
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
      if (imageUrl) existing.imageUrl = imageUrl;
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
  saveDB();
  renderWarehouse();
}

function exportIncomingExcel(orderId) {
  if (!canWarehouseAdmin()) return;
  const order = ensureWarehouseOrders().find((x) => x.id === orderId);
  if (!order) return;
  const rows = (order.items || []).map((row, idx) => ({
    No: idx + 1,
    Model: row.model || "",
    Info: row.info || "",
    Qty: row.qty || 0,
    Stage: incomingStageLabel(row.stageKey || row.stage),
    ETA: row.eta || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Incoming");
  XLSX.writeFile(wb, "incoming_orders.xlsx");
}

function importIncomingExcel(e, orderId) {
  if (!canWarehouseAdmin()) return;
  const order = ensureWarehouseOrders().find((x) => x.id === orderId);
  if (!order) return;
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const wb = XLSX.read(evt.target.result, { type: "binary" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    rows.forEach((r) => {
      const model = String(r.Model || r.model || r["Mebel modeli"] || "").trim();
      if (!model) return;
      const qty = Number(r.Qty || r.qty || r["Soni"] || r["Nechta"] || 0);
      const info = String(r.Info || r.info || r["Ma'lumoti"] || "").trim();
      const stageKey = normalizeIncomingStageKey(r.Stage || r.stage || r["Bosqich"] || "from_china");
      const eta = String(r.ETA || r.eta || r["Taxminiy sana"] || "").trim();
      order.items.unshift({
        id: uid("incoming"),
        imageUrl: "",
        model,
        info,
        qty: Math.max(0, qty || 0),
        stageKey,
        eta,
        createdAt: new Date().toISOString(),
      });
    });
    saveDB();
    renderWarehouse();
    e.target.value = "";
  };
  reader.readAsBinaryString(file);
}

function exportStockExcel() {
  if (!canWarehouseAdmin()) return;
  const rows = getFilteredStockRows()
    .map((row, idx) => {
      const store = getStore(row.storeId);
      return {
        No: idx + 1,
        Image: row.imageUrl || "",
        Model: row.model || "",
        Info: row.info || "",
        Location: stockLocationLabel(row.locationType),
        Store: row.locationType === "warehouse" ? t("warehouseOnly") : (store?.name || ""),
        Qty: row.qty || 0,
        Status: stockStatusLabel(row.status),
        ReservedBy: row.reservation ? reserveOwnerLabel(row) : "",
        ReservedFor: row.reservation?.reservedFor || "",
        ReservationNote: row.reservation?.note || "",
      };
    });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock");
  XLSX.writeFile(wb, "warehouse_stock.xlsx");
}

function importStockExcel(e) {
  if (!canWarehouseAdmin()) return;
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const wb = XLSX.read(evt.target.result, { type: "binary" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    rows.forEach((r) => {
      const model = String(r.Model || r.model || r["Mebel modeli"] || "").trim();
      if (!model) return;
      const qty = Math.max(0, Number(r.Qty || r.qty || r["Soni"] || 0));
      const info = String(r.Info || r.info || r["Ma'lumoti"] || "").trim();
      const imageUrl = String(r.Image || r.image || r["Rasm"] || "").trim();
      const status = normalizeStockStatus(r.Status || r.status || r["Holat"] || "available");
      const locationRaw = String(r.Location || r.location || r["Joylashuv"] || "showroom").toLowerCase();
      const hasWarehouse = locationRaw.includes("ombor") || locationRaw.includes("склад") || locationRaw.includes("仓") || locationRaw.includes("warehouse");
      const hasStore = locationRaw.includes("do'kon") || locationRaw.includes("магаз") || locationRaw.includes("门店") || locationRaw.includes("showroom") || locationRaw.includes("shop") || locationRaw.includes("store");
      const locationType = hasWarehouse && hasStore ? "both" : (hasWarehouse ? "warehouse" : "showroom");
      const storeName = String(r.Store || r.store || r["Do'kon"] || "").trim().toLowerCase();
      const store = state.db.stores.find((s) => s.name.toLowerCase() === storeName);
      const storeId = locationType === "warehouse" ? "" : (store?.id || "");
      if (locationType !== "warehouse" && !storeId) return;
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
    });
    saveDB();
    renderWarehouse();
    e.target.value = "";
  };
  reader.readAsBinaryString(file);
}

async function onManagerAdd(e) {
  e.preventDefault();
  if (state.user.role !== "admin") return;
  const fd = new FormData(refs.managerForm);
  const login = String(fd.get("login") || "").trim();
  if (state.db.users.some((u) => u.login === login)) {
    showToast(t("loginTaken"));
    return;
  }
  const role = String(fd.get("role") || "manager");
  const storeIdRaw = String(fd.get("storeId") || "");
  const storeId = roleNeedsStore(role) ? storeIdRaw : "";
  if (roleNeedsStore(role) && !storeId) {
    showToast(t("fillRequired"));
    return;
  }
  const showroom = getStore(storeId)?.name || "";
  const firstName = String(fd.get("firstName") || "").trim();
  const lastName = String(fd.get("lastName") || "").trim();
  const password = String(fd.get("password") || "").trim();

  const savedViaApi = await addManagerViaApi({
    full_name: `${firstName} ${lastName}`.trim(),
    login,
    password,
    role,
    showroom,
  });

  if (!savedViaApi) {
    state.db.users.push({
      id: uid("user"),
      role,
      firstName,
      lastName,
      login,
      password,
      storeId,
      avatar: defaultAvatar(),
    });
    saveDB();
  } else {
    await loadManagersFromApi();
  }
  refs.managerForm.reset();
  refs.managerRoleSelect.value = "manager";
  syncManagerRoleStoreFields("create");
  renderSettings();
  renderFilters();
  showToast(t("managerAdded"));
  toggleModal(refs.managerModal, false);
}

function openManagerEditModal(managerId) {
  if (state.user.role !== "admin") return;
  setAdminActionActive("user");
  state.editingManagerId = managerId;
  const manager = state.db.users.find((u) => u.id === managerId && u.role !== "admin");
  if (!manager) return;
  refs.managerEditStoreSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");
  refs.managerEditRoleSelect.value = manager.role || "manager";
  refs.managerEditForm.firstName.value = manager.firstName;
  refs.managerEditForm.lastName.value = manager.lastName;
  refs.managerEditForm.login.value = manager.login;
  refs.managerEditForm.password.value = manager.password;
  refs.managerEditForm.storeId.value = manager.storeId || "";
  syncManagerRoleStoreFields("edit");
  toggleModal(refs.managerEditModal, true);
}

function closeManagerEditModal() {
  toggleModal(refs.managerEditModal, false);
  refs.managerEditForm.reset();
  state.editingManagerId = null;
}

function onManagerEditSubmit(e) {
  e.preventDefault();
  if (state.user.role !== "admin") return;
  if (!state.editingManagerId) return;
  const manager = state.db.users.find((u) => u.id === state.editingManagerId && u.role !== "admin");
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
  manager.role = String(fd.get("role") || "manager");
  const nextStoreId = String(fd.get("storeId") || "");
  if (roleNeedsStore(manager.role) && !nextStoreId) {
    showToast(t("fillRequired"));
    return;
  }
  manager.storeId = roleNeedsStore(manager.role) ? nextStoreId : "";
  saveDB();
  renderSettings();
  renderFilters();
  renderTableWithLoading();
  closeManagerEditModal();
  showToast(t("managerUpdated"));
}

function openStoreModalForCreate() {
  setAdminActionActive("store");
  state.editingStoreId = null;
  refs.storeModalTitle.textContent = t("addStore");
  refs.storeForm.reset();
  toggleModal(refs.storeModal, true);
}

function openStoreEditModal(storeId) {
  setAdminActionActive("store");
  state.editingStoreId = storeId;
  const store = getStore(storeId);
  if (!store) return;
  refs.storeModalTitle.textContent = t("editStoreTitle");
  refs.storeForm.storeName.value = store.name;
  toggleModal(refs.storeModal, true);
}

function closeStoreModal() {
  toggleModal(refs.storeModal, false);
  refs.storeForm.reset();
  state.editingStoreId = null;
}

async function onStoreAdd(e) {
  e.preventDefault();
  if (state.user.role !== "admin") return;
  const fd = new FormData(refs.storeForm);
  const storeName = String(fd.get("storeName") || "").trim();
  if (!storeName) return;
  if (state.editingStoreId) {
    const store = getStore(state.editingStoreId);
    if (!store) return;
    store.name = storeName;
    showToast(t("storeUpdated"));
    saveDB();
  } else {
    const savedViaApi = await addShowroomViaApi(storeName);
    if (!savedViaApi) {
      state.db.stores.push({ id: uid("store"), name: storeName });
      saveDB();
    } else {
      await loadShowroomsFromApi();
    }
    showToast(t("storeAdded"));
  }
  renderSettings();
  renderFilters();
  closeStoreModal();
}

async function loadClients() {
  return loadClientsFromApi();
}

async function loadManagersAndShowrooms() {
  await loadShowroomsFromApi();
  await loadManagersFromApi();
}

async function loadShowroomsFromApi() {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await fetch(API_SHOWROOMS_URL, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.items)) return false;
    const existing = new Map(state.db.stores.map((s) => [String(s.id), s]));
    const mapped = data.items.map((item) => {
      const id = `store_${item.id}`;
      const current = existing.get(id);
      return {
        id,
        name: String(item.name || current?.name || ""),
      };
    }).filter((s) => s.name);
    if (mapped.length) state.db.stores = mapped;
    return true;
  } catch {
    return false;
  }
}

async function loadManagersFromApi() {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await fetch(API_MANAGERS_URL, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.items)) return false;

    const adminUsers = state.db.users.filter((u) => u.role === "admin");
    const mappedManagers = data.items.map((item) => {
      const user = upsertUserFromApi(item);
      if (!user) return null;
      return user;
    }).filter(Boolean);
    state.db.users = [...adminUsers, ...mappedManagers];
    return true;
  } catch {
    return false;
  }
}

async function loadClientsFromApi() {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const manager = encodeURIComponent(fullName(state.user));
    const role = encodeURIComponent(state.user.role || "manager");
    const res = await fetch(`${API_CLIENTS_URL}?manager=${manager}&role=${role}`, { cache: "no-store" });
    if (!res.ok) return false;
    const rows = await res.json();
    if (!Array.isArray(rows)) return false;
    state.db.clients = rows.map((row) => mapApiClientToLocal(row));
    return true;
  } catch {
    return false;
  }
}

async function addClient(client) {
  return addClientViaApi(client);
}

async function updateClientViaApi(clientId, client) {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const managerName = fullName(getUser(client.managerId)) || fullName(state.user);
    const showroomName = getStore(client.storeId)?.name || "";
    const payload = {
      id: clientId,
      date: client.date,
      showroom: showroomName,
      manager: managerName,
      phone: client.contact,
      source: client.source,
      interest: client.interest,
      note: client.comment,
      status: client.status || "",
      price: client.price ?? 0,
      result: client.attended || "",
    };
    const res = await fetch(API_CLIENTS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function addManagerViaApi(payload) {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await fetch(API_MANAGERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

async function addShowroomViaApi(name) {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await fetch(API_SHOWROOMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

async function updateCurrentUserViaApi(payload) {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  const rawId = String(state.user.id || "").replace(/^mgr_/, "");
  if (!rawId) return false;
  try {
    const res = await fetch(API_MANAGERS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: rawId,
        full_name: payload.full_name,
        login: payload.login,
        password: payload.password,
        role: payload.role,
        showroom: payload.showroom,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

async function deleteClientViaApi(clientId) {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const res = await fetch(API_DELETE_CLIENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success ?? true);
  } catch {
    return false;
  }
}

async function addClientViaApi(client) {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const assignedManager = getUser(client.managerId);
    const managerName = fullName(assignedManager) || fullName(state.user);
    const showroomName = getStore(client.storeId)?.name || "";
    const payload = {
      date: client.date,
      showroom: showroomName,
      manager: managerName,
      phone: client.contact,
      source: client.source,
      interest: client.interest,
      note: client.comment,
      status: client.status,
      price: client.price ?? 0,
      result: client.attended,
      creator_role: state.user.role,
      creator_login: state.user.login,
      assigned_manager_login: assignedManager?.login || "",
    };
    const res = await fetch(API_CLIENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function upsertUserFromApi(apiUser) {
  const fullNameRaw = String(apiUser.full_name || "").trim();
  const parts = fullNameRaw.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "User";
  const lastName = parts.slice(1).join(" ");
  const userId = `mgr_${String(apiUser.id || uid("user"))}`;
  const showroomName = String(apiUser.showroom || "").trim();
  const apiRole = apiUser.role || "manager";
  const mapped = {
    id: userId,
    role: apiRole,
    login: String(apiUser.login || ""),
    password: String(apiUser.password || ""),
    firstName,
    lastName,
    avatar: defaultAvatar(),
    storeId: roleNeedsStore(apiRole) ? ensureStoreByName(showroomName) : "",
  };
  const existingIndex = state.db.users.findIndex((u) => String(u.id) === userId);
  if (existingIndex >= 0) {
    state.db.users[existingIndex] = { ...state.db.users[existingIndex], ...mapped };
  } else {
    state.db.users.push(mapped);
  }
  return state.db.users.find((u) => String(u.id) === userId);
}

function mapApiClientToLocal(row) {
  const storeId = ensureStoreByName(row.showroom);
  const managerName = String(row.manager || "").trim().toLowerCase();
  const matchedManager = state.db.users.find((u) => u.role === "manager" && fullName(u).toLowerCase() === managerName);
  let managerId = matchedManager?.id || "";
  if (!managerId && state.user?.role === "manager") managerId = state.user.id;
  return {
    id: String(row.id || uid("client")),
    date: String(row.date || ""),
    contact: String(row.phone || ""),
    source: normalizeSourceValue(row.source),
    interest: String(row.interest || ""),
    comment: String(row.note || ""),
    attended: normalizeAttendanceValue(row.result),
    price: Number(row.price) || 0,
    currency: "UZS",
    status: normalizeStatusValue(row.status),
    storeId,
    managerId,
    createdAt: row.created_at || new Date().toISOString(),
    createdBy: managerId,
  };
}

function ensureStoreByName(name) {
  const value = String(name || "").trim();
  if (!value) return "";
  const existing = state.db.stores.find((s) => s.name.toLowerCase() === value.toLowerCase());
  if (existing) return existing.id;
  const id = uid("store");
  state.db.stores.push({ id, name: value });
  return id;
}

function normalizeSourceValue(source) {
  const raw = String(source || "").toLowerCase();
  if (raw.includes("inst")) return "instagram";
  if (raw.includes("pot")) return "potential_client";
  if (raw.includes("new") || raw.includes("yangi")) return "new_client";
  return "new_client";
}

function normalizeAttendanceValue(value) {
  const raw = String(value || "").toLowerCase();
  if (!raw) return "";
  if (raw === "yes" || raw.includes("keldi")) return "yes";
  if (raw === "no" || raw.includes("kelmadi")) return "no";
  return "";
}

function normalizeStatusValue(value) {
  const raw = String(value || "").trim().toLowerCase();
  return ["green", "yellow", "red"].includes(raw) ? raw : "";
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
  syncUiLock();
}

function closeSidebar() {
  setSidebarOpen(false);
}

function setSidebarOpen(show) {
  refs.sidebar.classList.toggle("open", show);
  refs.sidebarBackdrop.classList.toggle("hidden", !show);
  syncUiLock();
}

function syncUiLock() {
  const sidebarOpen = refs.sidebar && refs.sidebar.classList.contains("open");
  const modalOpen = [refs.clientModal, refs.dateModal, refs.managerModal, refs.storeModal, refs.managerEditModal, refs.incomingModal, refs.stockModal, refs.stockReserveModal, refs.salesCheckModal, refs.confirmModal]
    .some((el) => el && !el.classList.contains("hidden"));
  document.body.classList.toggle("ui-lock", sidebarOpen || modalOpen);
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

function roleLabel(role) {
  if (role === "admin") return t("roleAdmin");
  if (role === "hr") return "HR";
  if (role === "cashier") return "Kassir";
  if (role === "skladchi") return "Omborchi";
  return t("roleManager");
}

function canSalesAdmin() {
  return state.user?.role === "admin" || state.user?.role === "cashier";
}

function isManagerLikeUser() {
  return Boolean(state.user) && state.user.role !== "admin";
}

function canCreateSalesCheck() {
  const role = state.user?.role;
  return ["admin", "manager", "hr", "cashier", "skladchi"].includes(role);
}

function canWarehouseAdmin() {
  return state.user?.role === "admin" || state.user?.role === "skladchi";
}

function saveDB() {
  state.db.meta = state.db.meta && typeof state.db.meta === "object" ? state.db.meta : {};
  state.db.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(LS_DB, JSON.stringify(state.db));
  if (REMOTE_DB_ENABLED) pushRemoteDB(state.db);
}

function hasCoreData(db) {
  return Array.isArray(db?.users) && db.users.length > 0;
}

async function fetchRemoteDB() {
  try {
    const res = await fetch(API_DB_URL, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function pushRemoteDB(db) {
  try {
    const res = await fetch(API_DB_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(db),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadNotificationsFromApi() {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const to = encodeURIComponent(state.user.login || "");
    const res = await fetch(`${API_NOTIFICATIONS_URL}?to=${to}`, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    state.remoteNotifications = Array.isArray(data?.items) ? data.items : [];
    return true;
  } catch {
    return false;
  }
}

async function createNotificationViaApi(payload) {
  if (!REMOTE_DB_ENABLED) return false;
  const toUser = getUser(payload.toUserId);
  const actor = getUser(payload.actorId);
  if (!toUser?.login) return false;
  try {
    const res = await fetch(API_NOTIFICATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: payload.type,
        to_login: toUser.login,
        actor_login: actor?.login || "",
        client_contact: payload.clientContact || "-",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function markNotificationAsReadViaApi(id) {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const res = await fetch(API_NOTIFICATIONS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, to_login: state.user.login }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function markAllNotificationsAsReadViaApi() {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const res = await fetch(API_NOTIFICATIONS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_login: state.user.login, all: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function startRemoteSync() {
  if (!REMOTE_DB_ENABLED) return;
  clearInterval(remoteSyncTimer);
  remoteSyncTimer = setInterval(syncFromRemote, REMOTE_SYNC_INTERVAL);
}

async function syncFromRemote() {
  if (!REMOTE_DB_ENABLED || !state.db) return;
  if (state.user) await loadNotificationsFromApi();
  const remote = await fetchRemoteDB();
  if (!remote || !hasCoreData(remote)) {
    if (state.user) {
      await syncFromApi();
      renderNotifications();
    }
    return;
  }
  const next = normalizeDBShape(remote);
  const currentVersion = String(state.db.meta?.updatedAt || "");
  const nextVersion = String(next.meta?.updatedAt || "");
  if (currentVersion && nextVersion && currentVersion === nextVersion) return;
  state.db = next;
  localStorage.setItem(LS_DB, JSON.stringify(state.db));
  if (!state.user) return;
  const sameUser = state.db.users.find((u) => u.id === state.user.id);
  if (!sameUser) {
    logout();
    return;
  }
  state.user = sameUser;
  renderProfile();
  renderNotifications();
  switchPage(state.page, true);
}

async function syncFromApi() {
  if (!REMOTE_DB_ENABLED || !state.user) return;
  await Promise.all([loadManagersAndShowrooms(), loadClients(), loadNotificationsFromApi()]);
  const sameUser = state.db.users.find((u) => u.id === state.user.id)
    || state.db.users.find((u) => u.login === state.user.login && u.role === state.user.role);
  if (!sameUser) {
    logout();
    return;
  }
  state.user = sameUser;
  renderProfile();
  renderNotifications();
  switchPage(state.page, true);
}

function normalizeDBShape(db) {
  const safe = db || {};
  safe.meta = safe.meta && typeof safe.meta === "object" ? safe.meta : {};
  if (!safe.meta.updatedAt) safe.meta.updatedAt = new Date(0).toISOString();
  safe.stores = Array.isArray(safe.stores) ? safe.stores : [];
  safe.users = Array.isArray(safe.users) ? safe.users : [];
  safe.clients = Array.isArray(safe.clients) ? safe.clients : [];
  safe.salesChecks = Array.isArray(safe.salesChecks) ? safe.salesChecks : [];
  safe.notifications = Array.isArray(safe.notifications) ? safe.notifications : [];
  safe.warehouseOrders = Array.isArray(safe.warehouseOrders) ? safe.warehouseOrders : [];
  safe.warehouseIncoming = Array.isArray(safe.warehouseIncoming) ? safe.warehouseIncoming : [];
  safe.warehouseStock = Array.isArray(safe.warehouseStock) ? safe.warehouseStock : [];
  if (!safe.warehouseOrders.length && safe.warehouseIncoming.length) {
    safe.warehouseOrders = [{
      id: uid("order"),
      stageKey: safe.warehouseIncoming[0].stageKey || "from_china",
      eta: safe.warehouseIncoming[0].eta || "",
      listOpen: false,
      search: "",
      items: safe.warehouseIncoming.map((x) => ({ ...x })),
    }];
  }
  safe.warehouseStock.forEach((row) => {
    row.imageUrl = String(row.imageUrl || "");
    row.info = String(row.info || "");
    row.locationType = ["warehouse", "showroom", "both"].includes(String(row.locationType || "")) ? row.locationType : "showroom";
    row.storeId = row.locationType === "warehouse" ? "" : String(row.storeId || "");
    row.status = normalizeStockStatus(row.status);
    row.qty = Math.max(0, Number(row.qty || 0));
    if (!row.reservation || typeof row.reservation !== "object") {
      row.reservation = null;
    } else {
      row.reservation.byUserId = String(row.reservation.byUserId || "");
      row.reservation.byUserName = String(row.reservation.byUserName || "");
      row.reservation.reservedFor = String(row.reservation.reservedFor || "");
      row.reservation.note = String(row.reservation.note || "");
      row.reservation.updatedAt = String(row.reservation.updatedAt || "");
    }
  });
  safe.salesChecks.forEach((row, idx) => {
    row.id = String(row.id || uid("sale"));
    row.checkNo = Math.max(1, Number(row.checkNo || 0)) || (idx + 1);
    row.storeId = String(row.storeId || "");
    row.managerId = String(row.managerId || "");
    row.orderDate = String(row.orderDate || "");
    row.receiptUrl = String(row.receiptUrl || "");
    row.receiptDataUrl = String(row.receiptDataUrl || "");
    row.receiptFileName = String(row.receiptFileName || "");
    row.createdAt = String(row.createdAt || new Date().toISOString());
    if (!row.formData || typeof row.formData !== "object") row.formData = {};
    row.formData.orderParty = String(row.formData.orderParty || "");
    row.formData.customerName = String(row.formData.customerName || "");
    row.formData.customerPhone = String(row.formData.customerPhone || "");
    row.formData.orderDate = String(row.formData.orderDate || row.orderDate || "");
    row.formData.supplier = String(row.formData.supplier || "KUKA HOME");
    row.formData.sellerPhone = String(row.formData.sellerPhone || "");
    row.formData.paymentMethod = String(row.formData.paymentMethod || "naqd");
    row.formData.deliveryDate = String(row.formData.deliveryDate || "");
    row.formData.deliveryAddress = String(row.formData.deliveryAddress || "");
    row.formData.totalAmount = String(row.formData.totalAmount || "");
    row.formData.prepayment = String(row.formData.prepayment || "");
    row.formData.itemsText = String(row.formData.itemsText || "");
    row.formData.orderNotes = String(row.formData.orderNotes || "");
    row.formData.customerFloor = String(row.formData.customerFloor || "");
    row.formData.elevatorInfo = String(row.formData.elevatorInfo || "");
    row.formData.deliveryPaid = String(row.formData.deliveryPaid || "");
    row.formData.doorFits = String(row.formData.doorFits || "");
    row.formData.agreesNoReturn = String(row.formData.agreesNoReturn || "");
    row.formData.warnedAboutIssue = String(row.formData.warnedAboutIssue || "");
    row.formData.items = Array.isArray(row.formData.items) ? row.formData.items : [];
  });
  const usedCheckNos = new Set();
  safe.salesChecks.forEach((row, idx) => {
    let no = Number(row.checkNo || 0);
    if (!Number.isFinite(no) || no <= 0 || usedCheckNos.has(no)) {
      no = idx + 1;
      while (usedCheckNos.has(no)) no += 1;
    }
    row.checkNo = no;
    usedCheckNos.add(no);
  });
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
