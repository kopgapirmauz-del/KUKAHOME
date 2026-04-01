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
  if (currentVersion && nextVersion) {
    if (currentVersion === nextVersion) return;
    const currentTime = Date.parse(currentVersion) || 0;
    const nextTime = Date.parse(nextVersion) || 0;
    if (nextTime > 0 && currentTime > 0 && nextTime < currentTime) return;
  }
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
  safe.users.forEach((u) => {
    u.phone = String(u.phone || "");
    u.loginCount = Math.max(0, Number(u.loginCount || 0));
    u.lastLoginAt = String(u.lastLoginAt || "");
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

function buildStyledExportSheet(title, headers, rows) {
  const safeTitle = String(title || "Bo'lim").trim();
  const safeHeaders = Array.isArray(headers) ? headers.map((h) => String(h || "")) : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const aoa = [[safeTitle], safeHeaders, ...safeRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const colCount = Math.max(1, safeHeaders.length);
  const lastCol = colCount - 1;
  const lastRow = aoa.length - 1;

  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }];
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } }) };
  ws["!freeze"] = { xSplit: 0, ySplit: 2, topLeftCell: "A3", activePane: "bottomLeft", state: "frozen" };
  ws["!rows"] = [{ hpx: 34 }, { hpx: 30 }].concat(new Array(Math.max(0, safeRows.length)).fill({ hpx: 24 }));
  ws["!cols"] = safeHeaders.map((h, idx) => {
    if (idx === 0) return { wch: 6 };
    const contentMax = Math.max(String(h || "").length + 3, ...safeRows.map((r) => String((r || [])[idx] || "").length + 2));
    return { wch: Math.min(36, Math.max(12, contentMax)) };
  });

  const border = {
    top: { style: "thin", color: { rgb: "333333" } },
    bottom: { style: "thin", color: { rgb: "333333" } },
    left: { style: "thin", color: { rgb: "333333" } },
    right: { style: "thin", color: { rgb: "333333" } },
  };

  const setStyle = (r, c, style) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { t: "s", v: "" };
    ws[addr].s = style;
  };

  const titleStyle = {
    font: { name: "Times New Roman", sz: 14, bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    border,
  };
  for (let c = 0; c <= lastCol; c += 1) setStyle(0, c, titleStyle);

  const headerStyle = {
    font: { name: "Times New Roman", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "7A7A7A" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border,
  };
  for (let c = 0; c <= lastCol; c += 1) setStyle(1, c, headerStyle);

  const bodyStyle = {
    font: { name: "Times New Roman", sz: 14 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border,
  };
  for (let r = 2; r <= lastRow; r += 1) {
    for (let c = 0; c <= lastCol; c += 1) setStyle(r, c, bodyStyle);
  }

  return ws;
}

function writeStyledWorkbook(sheet, sheetName, fileName) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, String(sheetName || "Sheet1").slice(0, 31));
  try {
    XLSX.writeFile(wb, fileName, { cellStyles: true });
  } catch {
    XLSX.writeFile(wb, fileName);
  }
}

function shiftDate(base, diff) {
  const d = new Date(base);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

