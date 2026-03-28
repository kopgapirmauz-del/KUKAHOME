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

