function startRemoteSync() {
  if (!REMOTE_DB_ENABLED) return;
  clearInterval(remoteSyncTimer);
  remoteSyncTimer = setInterval(syncFromRemote, REMOTE_SYNC_INTERVAL);
}

let remoteSnapshotSyncRunning = false;

function hasOpenWarehouseEditor() {
  return [refs.incomingModal, refs.stockModal, refs.stockReserveModal]
    .some((el) => el && !el.classList.contains("hidden"));
}

async function syncFromRemote() {
  if (!REMOTE_DB_ENABLED || !state.db) return;
  if (!state.user) return;
  await Promise.all([
    loadNotificationsFromApi(),
    loadWarrantyTicketsFromApi(),
    state.page !== "integrations" && typeof refreshInboxUnreadBadge === "function" ? refreshInboxUnreadBadge() : Promise.resolve(),
  ]);
  renderNotifications();
  if (state.page === "warranty" && typeof renderWarrantyChecks === "function") {
    renderWarrantyChecks();
  }

  // Do not replace a local change that is still being saved, or data in a
  // warehouse form the user has not submitted yet.
  if (remoteSnapshotSyncRunning || remotePushRunning || queuedRemoteDB || warehouseStateSaveRunning || hasOpenWarehouseEditor()) return;
  remoteSnapshotSyncRunning = true;
  try {
    // The warehouse-state fetch downloads and re-parses the whole private
    // snapshot server-side just to read two of its keys. Doing that on this
    // poll's cadence for every open tab regardless of page - not just tabs
    // actually looking at the warehouse - was a real source of the reported
    // slowness, so only keep it warm while the warehouse page is open.
    const [warehouseChanged, changedKeys] = await Promise.all([
      state.page === "warehouse" ? loadWarehouseStateFromApi() : Promise.resolve(false),
      refreshExtendedDataAfterAuth(),
    ]);
    const incomingChanged = changedKeys.includes("warehouseIncoming");
    if ((warehouseChanged || incomingChanged) && state.page === "warehouse") renderWarehouse();
  } finally {
    remoteSnapshotSyncRunning = false;
  }
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

async function syncFromApi() {
  if (!REMOTE_DB_ENABLED || !state.user) return;
  await Promise.all([
    loadManagersAndShowrooms(),
    loadClients(),
    loadNotificationsFromApi(),
    loadWarrantyTicketsFromApi(),
    loadWarehouseStateFromApi(),
  ]);
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
  safe.users.forEach((u) => {
    u.phone = String(u.phone || "");
    u.loginCount = Math.max(0, Number(u.loginCount || 0));
    u.lastLoginAt = String(u.lastLoginAt || "");
    if (REMOTE_DB_ENABLED) {
      // Password verification belongs to the server. Remove legacy plaintext
      // values and password hashes from browser memory and localStorage.
      u.password = "";
      delete u.password_hash;
      delete u.passwordHash;
    }
  });
  safe.clients = Array.isArray(safe.clients) ? safe.clients : [];
  safe.salesChecks = Array.isArray(safe.salesChecks) ? safe.salesChecks : [];
  safe.notifications = Array.isArray(safe.notifications) ? safe.notifications : [];
  safe.warehouseOrders = Array.isArray(safe.warehouseOrders) ? safe.warehouseOrders : [];
  safe.warehouseIncoming = Array.isArray(safe.warehouseIncoming) ? safe.warehouseIncoming : [];
  safe.warehouseStock = Array.isArray(safe.warehouseStock) ? safe.warehouseStock : [];
  safe.warrantyTickets = Array.isArray(safe.warrantyTickets) ? safe.warrantyTickets : [];
  safe.vacancies = Array.isArray(safe.vacancies) ? safe.vacancies : [];
  safe.vacancyOpenings = Array.isArray(safe.vacancyOpenings) ? safe.vacancyOpenings : [];
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
    if (row.receiptUrl && row.receiptDataUrl.startsWith("data:")) row.receiptDataUrl = "";
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
  safe.warrantyTickets.forEach((row, idx) => {
    row.id = String(row.id || uid("warranty"));
    row.ticketNo = Math.max(1, Number(row.ticketNo || 0)) || (idx + 1);
    row.storeId = String(row.storeId || "");
    row.managerId = String(row.managerId || "");
    row.ticketUrl = String(row.ticketUrl || "");
    row.ticketDataUrl = String(row.ticketDataUrl || "");
    if (row.ticketUrl && row.ticketDataUrl.startsWith("data:")) row.ticketDataUrl = "";
    row.ticketFileName = String(row.ticketFileName || "");
    row.saleDate = String(row.saleDate || "");
    row.createdAt = String(row.createdAt || new Date().toISOString());
    if (!row.formData || typeof row.formData !== "object") row.formData = {};
    row.formData.productName = String(row.formData.productName || "");
    row.formData.modelNo = String(row.formData.modelNo || "");
    row.formData.barcode = String(row.formData.barcode || "");
    row.formData.saleDate = String(row.formData.saleDate || row.saleDate || "");
    row.formData.warrantyStartDate = String(row.formData.warrantyStartDate || row.formData.saleDate || "");
    row.formData.warrantyEndDate = String(row.formData.warrantyEndDate || "");
    row.formData.warrantyTerm = String(row.formData.warrantyTerm || "");
    row.formData.sellerOrg = String(row.formData.sellerOrg || "");
    row.formData.sellerSign = String(row.formData.sellerSign || "");
    row.formData.buyerSign = String(row.formData.buyerSign || "");
    row.formData.storeName = String(row.formData.storeName || "");
    row.formData.sellerName = String(row.formData.sellerName || "");
  });
  safe.vacancies.forEach((v, idx) => {
    v.id = String(v.id || uid(`vac_${idx}`));
    v.fullName = String(v.fullName || v.full_name || v.name || "");
    v.phone = String(v.phone || v.contact || "");
    v.position = String(v.position || v.vacancy || "");
    v.source = String(v.source || "website");
    v.status = String(v.status || "new").toLowerCase();
    v.createdAt = String(v.createdAt || v.created_at || new Date().toISOString());
  });
  safe.vacancyOpenings.forEach((v, idx) => {
    v.id = String(v.id || uid(`opening_${idx}`));
    v.position = String(v.position || v.title || "");
    v.regulation = String(v.regulation || v.note || "");
    v.source = "vacancy_opening";
    v.createdAt = String(v.createdAt || v.created_at || new Date().toISOString());
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

// Only allow http(s) links (and root-relative paths) to be used as href/src.
// Blocks javascript:, data:, vbscript: and similar schemes that could be
// injected via public-facing forms (e.g. HR vacancy applications).
function isSafeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) return true;
  if (/^data:(image\/|application\/pdf)/i.test(raw)) return true;
  try {
    const url = new URL(raw, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  if (source === "website") return t("sourceWebsite");
  if (source === "meta" || source === "instagram") return t("sourceMeta");
  if (source === "telegram") return t("sourceTelegram");
  if (source === "old_client") return t("sourceOldClient");
  if (source === "potential_client") return t("sourcePotential");
  if (source === "partnership") return t("sourcePartnership");
  if (source === "broker") return t("sourceBroker");
  if (source === "interior_designer") return t("sourceInteriorDesigner");
  return t("sourceNewClient");
}

function numberFmt(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return "0";
  const parts = n.toFixed(2).replace(/\.00$/, "").split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
}

function parseNumericInput(value) {
  const raw = String(value ?? "").replace(/\s+/g, "").replace(/,/g, ".").trim();
  if (!raw) return 0;
  const n = Number(raw.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatNumberInputValue(value) {
  const raw = String(value ?? "").replace(/\s+/g, "").trim();
  if (!raw) return "";
  const clean = raw.replace(/\D+/g, "");
  const intPart = (clean || "0").replace(/^0+(\d)/, "$1");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return grouped;
}

function initGroupedNumberInputs() {
  const names = new Set(["price", "qty", "startPrice", "finalPrice", "totalAmount", "prepayment"]);
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (!names.has(String(el.name || ""))) return;
    const next = formatNumberInputValue(el.value);
    if (next !== el.value) el.value = next;
  });
}

function formatUzPhone(value) {
  const digits = String(value ?? "").replace(/\D+/g, "");
  if (!digits) return "";
  let local = digits;
  if (local.startsWith("998")) local = local.slice(3);
  local = local.slice(0, 9);
  const p1 = local.slice(0, 2);
  const p2 = local.slice(2, 5);
  const p3 = local.slice(5, 7);
  const p4 = local.slice(7, 9);
  let out = "+998";
  if (p1) out += ` ${p1}`;
  if (p2) out += ` ${p2}`;
  if (p3) out += ` ${p3}`;
  if (p4) out += ` ${p4}`;
  return out;
}

function initUzPhoneInputs() {
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (String(el.name || "") !== "phone") return;
    const next = formatUzPhone(el.value);
    if (next !== el.value) el.value = next;
  });
  document.querySelectorAll("input[name='phone']").forEach((el) => {
    if (!(el instanceof HTMLInputElement)) return;
    el.value = formatUzPhone(el.value);
  });
}

function shiftDate(base, diff) {
  const d = new Date(base);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

