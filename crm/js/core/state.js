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
  notificationPage: 1,
  notificationPrimed: false,
  lastUnreadCount: 0,
};

const refs = {};
let remoteSyncTimer = null;
let notificationAudioCtx = null;
let notificationAudioEl = null;
let confirmResolver = null;

