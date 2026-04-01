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
    const previousClients = Array.isArray(state.db.clients) ? state.db.clients.slice() : [];
    const existingById = new Map((state.db.clients || []).map((c) => [String(c.id), String(c.currency || "UZS")]));
    const mapped = rows.map((row) => mapApiClientToLocal(row, existingById));
    if (state.user.role === "manager") {
      const ids = new Set(mapped.map((c) => String(c.id)));
      previousClients.forEach((client) => {
        if (String(client.createdBy || "") !== String(state.user.id || "")) return;
        if (ids.has(String(client.id))) return;
        mapped.push(client);
      });
    }
    state.db.clients = mapped;
    return true;
  } catch {
    return false;
  }
}

async function addClient(client) {
  return addClientViaApi(client);
}

function mapWarrantyTicketApiToLocal(row) {
  const id = String(row?.id || uid("warranty"));
  const ticketNo = Math.max(1, Number(row?.ticket_no || row?.ticketNo || 0)) || 1;
  const storeId = String(row?.store_id || row?.storeId || "");
  const managerId = String(row?.manager_id || row?.managerId || "");
  const createdAt = String(row?.created_at || row?.createdAt || new Date().toISOString());
  const saleDate = String(row?.sale_date || row?.saleDate || "");
  const warrantyStartDate = String(row?.warranty_start_date || row?.warrantyStartDate || saleDate || "");
  const warrantyEndDate = String(row?.warranty_end_date || row?.warrantyEndDate || "");
  const ticketUrl = String(row?.ticket_url || row?.ticketUrl || "");
  const ticketDataUrl = String(row?.ticket_data_url || row?.ticketDataUrl || "");
  const ticketFileName = String(row?.ticket_file_name || row?.ticketFileName || "");
  const formData = row?.form_data && typeof row.form_data === "object" ? row.form_data : (row?.formData && typeof row.formData === "object" ? row.formData : {});
  return {
    id,
    ticketNo,
    storeId,
    managerId,
    createdAt,
    saleDate,
    warrantyStartDate,
    warrantyEndDate,
    ticketUrl,
    ticketDataUrl,
    ticketFileName,
    formData: {
      productName: String(formData.productName || ""),
      modelNo: String(formData.modelNo || ""),
      barcode: String(formData.barcode || ""),
      saleDate: String(formData.saleDate || saleDate || ""),
      warrantyStartDate: String(formData.warrantyStartDate || warrantyStartDate || ""),
      warrantyEndDate: String(formData.warrantyEndDate || warrantyEndDate || ""),
      warrantyTerm: String(formData.warrantyTerm || ""),
      sellerOrg: String(formData.sellerOrg || ""),
      storeName: String(formData.storeName || ""),
      sellerName: String(formData.sellerName || ""),
    },
  };
}

async function loadWarrantyTicketsFromApi() {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await fetch(API_WARRANTY_TICKETS_URL, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.items)) return false;
    state.db.warrantyTickets = data.items.map((row) => mapWarrantyTicketApiToLocal(row));
    return true;
  } catch {
    return false;
  }
}

async function addWarrantyTicketViaApi(row) {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await fetch(API_WARRANTY_TICKETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row || {}),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

async function updateWarrantyTicketViaApi(id, row) {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await fetch(API_WARRANTY_TICKETS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...(row || {}) }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

async function deleteWarrantyTicketViaApi(id) {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await fetch(API_WARRANTY_TICKETS_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
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
      currency: String(client.currency || "UZS").toUpperCase(),
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
  const rawId = String(state.user.id || "").replace(/^(mgr_|user_)/, "");
  const basePayload = {
    id: rawId || undefined,
    current_login: String(payload.current_login || state.user.login || ""),
    full_name: payload.full_name,
    login: payload.login,
    password: payload.password,
    role: payload.role,
    showroom: payload.showroom,
    phone: payload.phone || "",
  };
  const attempts = [
    { url: API_MANAGERS_URL, body: { ...basePayload } },
    { url: API_MANAGERS_URL, body: { ...basePayload, id: undefined, login_old: basePayload.current_login } },
    { url: API_LOGIN_URL, body: { ...basePayload, login_old: basePayload.current_login } },
  ];
  for (const attempt of attempts) {
    try {
      const cleanBody = {};
      Object.keys(attempt.body).forEach((k) => {
        if (attempt.body[k] !== undefined) cleanBody[k] = attempt.body[k];
      });
      const res = await fetch(attempt.url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanBody),
      });
      if (!res.ok) continue;
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!data || data.success !== false) return true;
    } catch {
      // try next endpoint format
    }
  }
  return false;
}

async function updateManagerViaApi(payload) {
  if (!REMOTE_DB_ENABLED) return false;
  const rawId = String(payload?.id || "").replace(/^(mgr_|user_)/, "");
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
        phone: payload.phone || "",
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

async function deleteManagerViaApi(managerId) {
  if (!REMOTE_DB_ENABLED) return false;
  const rawId = String(managerId || "").replace(/^(mgr_|user_)/, "");
  if (!rawId) return false;
  try {
    const res = await fetch(API_MANAGERS_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rawId }),
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
      currency: String(client.currency || "UZS").toUpperCase(),
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
    phone: String(apiUser.phone || ""),
  };
  const existingIndex = state.db.users.findIndex((u) => String(u.id) === userId);
  if (existingIndex >= 0) {
    state.db.users[existingIndex] = { ...state.db.users[existingIndex], ...mapped };
  } else {
    state.db.users.push(mapped);
  }
  return state.db.users.find((u) => String(u.id) === userId);
}

function mapApiClientToLocal(row, existingCurrencyById) {
  const storeId = ensureStoreByName(row.showroom);
  const managerName = String(row.manager || "").trim().toLowerCase();
  const matchedManager = state.db.users.find((u) => u.role === "manager" && fullName(u).toLowerCase() === managerName);
  let managerId = matchedManager?.id || "";
  if (!managerId && state.user?.role === "manager") managerId = state.user.id;
  const creatorLogin = String(row.creator_login || row.creatorLogin || "").trim().toLowerCase();
  const creator = creatorLogin
    ? state.db.users.find((u) => String(u.login || "").trim().toLowerCase() === creatorLogin)
    : null;
  return {
    id: String(row.id || uid("client")),
    date: String(row.date || ""),
    contact: String(row.phone || ""),
    source: normalizeSourceValue(row.source),
    interest: String(row.interest || ""),
    comment: String(row.note || ""),
    attended: normalizeAttendanceValue(row.result),
    price: Number(row.price) || 0,
    currency: String(row.currency || existingCurrencyById?.get(String(row.id || "")) || "UZS").toUpperCase(),
    status: normalizeStatusValue(row.status),
    storeId,
    managerId,
    createdAt: row.created_at || new Date().toISOString(),
    createdBy: creator?.id || managerId,
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
  const headers = [
    t("number"),
    t("date"),
    t("store"),
    t("manager"),
    t("contact"),
    t("source"),
    t("interest"),
    t("comment"),
    t("attended"),
    t("price"),
    t("status"),
  ];
  const rows = getFilteredClients().map((c, i) => {
    const currency = String(c.currency || "UZS").toUpperCase() === "USD" ? "$" : "SO'M";
    const attended = c.attended === "yes" ? t("attendedYes") : c.attended === "no" ? t("attendedNo") : "";
    const status = c.status ? t(c.status) : "";
    return [
      i + 1,
      c.date || "",
      getStore(c.storeId)?.name || "",
      fullName(getUser(c.managerId)),
      c.contact || "",
      sourceLabel(c.source),
      c.interest || "",
      c.comment || "",
      attended,
      `${numberFmt(c.price || 0)} ${currency}`,
      status,
    ];
  });
  const ws = buildStyledExportSheet(t("clientsTitle"), headers, rows);
  writeStyledWorkbook(ws, t("menuClients"), `clients_${state.lang}.xlsx`);
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
  const modalOpen = [refs.clientModal, refs.dateModal, refs.managerModal, refs.storeModal, refs.managerEditModal, refs.incomingModal, refs.stockModal, refs.stockReserveModal, refs.salesCheckModal, refs.warrantyTicketModal, refs.confirmModal]
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
  return ["admin", "cashier", "manager"].includes(role);
}

function canWarehouseAdmin() {
  return state.user?.role === "admin" || state.user?.role === "skladchi";
}

let queuedRemoteDB = null;
let remotePushRunning = false;

function queueRemoteDBPush(db) {
  if (!REMOTE_DB_ENABLED) return;
  try {
    queuedRemoteDB = JSON.parse(JSON.stringify(db));
  } catch {
    queuedRemoteDB = db;
  }
  if (remotePushRunning) return;
  flushRemoteDBPush();
}

async function flushRemoteDBPush() {
  if (!queuedRemoteDB || remotePushRunning) return;
  remotePushRunning = true;
  const payload = queuedRemoteDB;
  queuedRemoteDB = null;
  const ok = await pushRemoteDB(payload);
  remotePushRunning = false;
  if (!ok) {
    queuedRemoteDB = payload;
    setTimeout(flushRemoteDBPush, 1800);
    return;
  }
  if (queuedRemoteDB) {
    setTimeout(flushRemoteDBPush, 80);
  }
}

function saveDB() {
  state.db.meta = state.db.meta && typeof state.db.meta === "object" ? state.db.meta : {};
  state.db.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(LS_DB, JSON.stringify(state.db));
  queueRemoteDBPush(state.db);
}

async function syncDbSnapshotNow() {
  if (!REMOTE_DB_ENABLED) return true;
  return pushRemoteDB(state.db);
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

async function deleteNotificationViaApi(id) {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const res = await fetch(API_NOTIFICATIONS_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, to_login: state.user.login }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchVacanciesViaApi() {
  if (!REMOTE_DB_ENABLED) return Array.isArray(state.db?.vacancies) ? state.db.vacancies : [];
  try {
    const res = await fetch(`${API_VACANCIES_URL}?type=applications`, { cache: "no-store" });
    if (!res.ok) return Array.isArray(state.db?.vacancies) ? state.db.vacancies : [];
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
    const mapped = rows.map((row, idx) => ({
      id: String(row.id || uid("vac" + idx)),
      fullName: String(row.full_name || row.name || row.fio || "").trim(),
      phone: String(row.phone || row.contact || row.telegram || "").trim(),
      position: String(row.position || row.vacancy || row.role || "").trim(),
      resumeUrl: String(row.resume_url || row.resumeUrl || row.cv_url || row.cvUrl || "").trim() || ((String(row.note || "").trim().startsWith("http") || String(row.note || "").trim().startsWith("/")) ? String(row.note || "").trim() : ""),
      resumeFileName: String(row.resume_file_name || row.resumeFileName || "").trim(),
      avatarUrl: String(row.photo_url || row.image_url || row.avatar_url || row.avatarUrl || "").trim(),
      note: String(row.note || "").trim(),
      source: String(row.source || "website").trim(),
      status: String(row.status || "new").trim().toLowerCase(),
      createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    })).filter((row) => (row.fullName || row.phone || row.position) && row.source !== "vacancy_opening");
    state.db.vacancies = mapped;
    localStorage.setItem(LS_DB, JSON.stringify(state.db));
    return mapped;
  } catch {
    return Array.isArray(state.db?.vacancies) ? state.db.vacancies : [];
  }
}

async function createVacancyOpeningViaApi(payload) {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const publishDate = String(payload?.publishDate || "").trim();
    const createdAt = publishDate ? `${publishDate}T09:00:00` : new Date().toISOString();
    const res = await fetch(API_VACANCIES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "opening",
        position: String(payload?.position || "").trim(),
        regulation: String(payload?.regulation || "").trim(),
        created_by: String(payload?.createdBy || "").trim(),
        created_at: createdAt,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({ success: true, item: null }));
    if (data?.success === false) return false;
    const item = data?.item && typeof data.item === "object" ? data.item : null;
    return {
      id: String(item?.id || ""),
      createdAt: String(item?.created_at || createdAt),
    };
  } catch {
    return false;
  }
}

async function updateVacancyOpeningViaApi(payload) {
  if (!REMOTE_DB_ENABLED) return false;
  const id = String(payload?.id || "").trim();
  if (!id) return false;
  try {
    const publishDate = String(payload?.publishDate || "").trim();
    const createdAt = publishDate ? `${publishDate}T09:00:00` : new Date().toISOString();
    const res = await fetch(API_VACANCIES_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        type: "opening",
        position: String(payload?.position || "").trim(),
        regulation: String(payload?.regulation || "").trim(),
        created_at: createdAt,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({ success: true, item: null }));
    if (data?.success === false) return false;
    const item = data?.item && typeof data.item === "object" ? data.item : null;
    return {
      id: String(item?.id || id),
      createdAt: String(item?.created_at || createdAt),
    };
  } catch {
    return false;
  }
}

async function updateVacancyApplicationResumeViaApi(payload) {
  if (!REMOTE_DB_ENABLED) return false;
  const id = String(payload?.id || "").trim();
  if (!id) return false;
  try {
    const res = await fetch(API_VACANCIES_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        type: "application",
        resume_url: String(payload?.resumeUrl || "").trim(),
        resume_file_name: String(payload?.resumeFileName || "").trim(),
      }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({ success: true }));
    return Boolean(data?.success !== false);
  } catch {
    return false;
  }
}

async function fetchVacancyOpeningsViaApi() {
  if (!REMOTE_DB_ENABLED) return Array.isArray(state.db?.vacancyOpenings) ? state.db.vacancyOpenings : [];
  try {
    const res = await fetch(`${API_VACANCIES_URL}?type=openings`, { cache: "no-store" });
    if (!res.ok) return Array.isArray(state.db?.vacancyOpenings) ? state.db.vacancyOpenings : [];
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
    const mapped = rows.map((row, idx) => ({
      id: String(row.id || uid("opening" + idx)),
      position: String(row.position || row.title || row.vacancy || "").trim(),
      regulation: String(row.note || row.regulation || row.details || "").trim(),
      createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
      source: "vacancy_opening",
    })).filter((row) => row.position);
    state.db.vacancyOpenings = mapped;
    localStorage.setItem(LS_DB, JSON.stringify(state.db));
    return mapped;
  } catch {
    return Array.isArray(state.db?.vacancyOpenings) ? state.db.vacancyOpenings : [];
  }
}

async function deleteVacancyViaApi(vacancyId) {
  if (!REMOTE_DB_ENABLED) return false;
  const id = String(vacancyId || "").trim();
  if (!id) return false;
  try {
    const res = await fetch(API_VACANCIES_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({ success: true }));
    return Boolean(data?.success !== false);
  } catch {
    return false;
  }
}

