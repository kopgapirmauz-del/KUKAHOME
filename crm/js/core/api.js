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

