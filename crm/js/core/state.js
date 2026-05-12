const state = {
  db: null,
  user: null,
  lang: "uz",
  page: "clients",
  pageIndex: 1,
  editingClientId: null,
  dateRange: { from: "", to: "" },
  hrDateRange: { from: "", to: "" },
  dateModalMode: "clients",
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
  warrantyFilters: {
    search: "",
    storeId: "",
    managerId: "",
  },
  warrantyPageIndex: 1,
  editingWarrantyTicketId: null,
  settingsTab: "profile",
  remoteNotifications: [],
  notificationPage: 1,
  notificationPrimed: false,
  lastUnreadCount: 0,
  highlightedClientId: null,
};

const refs = {};
let remoteSyncTimer = null;
let notificationAudioCtx = null;
let notificationAudioEl = null;
let confirmResolver = null;

