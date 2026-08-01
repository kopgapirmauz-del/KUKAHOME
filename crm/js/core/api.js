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
    const res = await apiFetch(API_SHOWROOMS_URL, { cache: "no-store" });
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
    const res = await apiFetch(API_MANAGERS_URL, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.items)) return false;

    const adminUsers = state.db.users.filter((u) => u.role === "admin");
    const mappedManagers = data.items.map((item) => {
      const user = upsertUserFromApi(item);
      if (!user) return null;
      return user;
    }).filter(Boolean);
    state.db.users = dedupeAdminUsers([...adminUsers, ...mappedManagers]);
    return true;
  } catch {
    return false;
  }
}

function dedupeAdminUsers(users) {
  const list = Array.isArray(users) ? users : [];
  const winners = new Map();
  const identity = (user) => {
    const login = String(user?.login || "").trim().toLowerCase();
    const name = `${String(user?.firstName || "").trim()} ${String(user?.lastName || "").trim()}`
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    return login ? `login:${login}` : `name:${name}`;
  };
  const priority = (user) => {
    if (String(user?.id || "") === String(state.user?.id || "")) return 3;
    if (String(user?.id || "").startsWith("mgr_")) return 2;
    return 1;
  };
  list.forEach((user) => {
    if (String(user?.role || "").trim().toLowerCase() !== "admin") return;
    const key = identity(user);
    const current = winners.get(key);
    if (!current || priority(user) > priority(current)) winners.set(key, user);
  });
  return list.filter((user) => (
    String(user?.role || "").trim().toLowerCase() !== "admin"
    || winners.get(identity(user)) === user
  ));
}

async function loadClientsFromApi() {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const isManager = String(state.user.role || "") === "manager";
    const manager = encodeURIComponent(isManager ? fullName(state.user) : "");
    const role = encodeURIComponent(isManager ? "manager" : "admin");
    const res = await apiFetch(`${API_CLIENTS_URL}?manager=${manager}&role=${role}`, { cache: "no-store" });
    if (!res.ok) return false;
    const rows = await res.json();
    if (!Array.isArray(rows)) return false;
    const existingById = new Map((state.db.clients || []).map((c) => [String(c.id), String(c.currency || "UZS")]));
    const mapped = rows.map((row) => mapApiClientToLocal(row, existingById));
    // A successful API refresh replaces stale browser-only rows so the count matches Supabase.
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
    const res = await apiFetch(API_WARRANTY_TICKETS_URL, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.items)) return false;
    state.db.warrantyTickets = data.items.map((row) => mapWarrantyTicketApiToLocal(row));
    return true;
  } catch {
    return false;
  }
}

function warehouseUiStateById() {
  return new Map((Array.isArray(state.db?.warehouseOrders) ? state.db.warehouseOrders : []).map((order) => [
    String(order?.id || ""),
    {
      listOpen: Boolean(order?.listOpen),
      search: String(order?.search || ""),
    },
  ]));
}

function durableWarehouseOrders(orders) {
  return (Array.isArray(orders) ? orders : []).map((order) => {
    const safe = { ...order };
    delete safe.listOpen;
    delete safe.search;
    safe.items = (Array.isArray(safe.items) ? safe.items : []).map((item) => ({ ...item }));
    return safe;
  });
}

function mergeWarehouseUiState(orders, uiState) {
  return durableWarehouseOrders(orders).map((order) => {
    const ui = uiState.get(String(order?.id || "")) || {};
    return {
      ...order,
      listOpen: Boolean(ui.listOpen),
      search: String(ui.search || ""),
    };
  });
}

let warehouseStateSaveRunning = false;
let warehouseStateSaveChain = Promise.resolve(true);

// The server state both sides last agreed on. Used as the merge base so a
// rejected write can be rebased onto the newest version instead of thrown away.
let warehouseSyncBase = { warehouseOrders: [], warehouseStock: [] };

function captureWarehouseBase(orders, stock) {
  warehouseSyncBase = {
    warehouseOrders: durableWarehouseOrders(orders),
    warehouseStock: (Array.isArray(stock) ? stock : []).map((row) => ({ ...row })),
  };
}

// Versions are ISO timestamps, so lexical order is chronological order. A poll
// whose response was already in flight when a newer write landed must not roll
// the token backwards - that stale token is exactly what turns the next save
// into a phantom conflict. Explicit conflict recovery passes `authoritative`
// and may set whatever the server currently holds.
function adoptRemoteVersion(next, options = {}) {
  state.db.meta = state.db.meta && typeof state.db.meta === "object" ? state.db.meta : {};
  const current = String(state.db.meta.remoteVersion || "");
  const value = String(next || "");
  if (!options.authoritative && current && value && value < current) return current;
  state.db.meta.remoteVersion = value || current;
  return state.db.meta.remoteVersion;
}

function indexWarehouseById(list) {
  return new Map((Array.isArray(list) ? list : [])
    .filter((row) => row && String(row.id || ""))
    .map((row) => [String(row.id), row]));
}

function sameWarehouseRow(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// Three-way merge keyed by id. `base` is the last agreed state, `mine` is this
// tab's intent, `theirs` is what the server holds now. Local additions, edits
// and deletions are replayed onto the server state, so two people editing the
// same collection at once keep both changes instead of one silently winning.
function mergeRowsById(base, mine, theirs, mergeRow) {
  const baseById = indexWarehouseById(base);
  const theirsById = indexWarehouseById(theirs);
  const seen = new Set();
  const out = [];

  (Array.isArray(mine) ? mine : []).forEach((row) => {
    const id = String(row?.id || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    const baseRow = baseById.get(id);
    const theirRow = theirsById.get(id);
    if (!baseRow) {
      // Added locally. Nothing on the server can have superseded it.
      out.push(row);
      return;
    }
    if (!theirRow) {
      // Removed remotely. Only resurrect it if this tab also edited it.
      if (!sameWarehouseRow(baseRow, row)) out.push(row);
      return;
    }
    if (!sameWarehouseRow(baseRow, row)) {
      out.push(mergeRow ? mergeRow(baseRow, row, theirRow) : row);
      return;
    }
    // Untouched locally - take the server copy so remote edits survive.
    out.push(mergeRow ? mergeRow(baseRow, row, theirRow) : theirRow);
  });

  (Array.isArray(theirs) ? theirs : []).forEach((row) => {
    const id = String(row?.id || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    // Present remotely but not locally: a remote addition unless this tab
    // deleted it (in which case it was in the agreed base).
    if (!baseById.has(id)) out.push(row);
  });

  return out;
}

function mergeWarehouseOrder(baseOrder, mineOrder, theirOrder) {
  const merged = { ...theirOrder, ...mineOrder };
  merged.items = mergeRowsById(
    baseOrder?.items || [],
    mineOrder?.items || [],
    theirOrder?.items || [],
  );
  return merged;
}

async function fetchWarehouseStateFromApi() {
  const res = await apiFetch(API_WAREHOUSE_STATE_URL, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.success || !Array.isArray(data.warehouseOrders) || !Array.isArray(data.warehouseStock)) {
    return null;
  }
  return data;
}

function applyWarehouseState(orders, stock, version, options = {}) {
  const uiState = warehouseUiStateById();
  const nextOrders = mergeWarehouseUiState(orders, uiState);
  const nextStock = (Array.isArray(stock) ? stock : []).map((row) => ({ ...row }));
  const changed = JSON.stringify(state.db.warehouseOrders) !== JSON.stringify(nextOrders)
    || JSON.stringify(state.db.warehouseStock) !== JSON.stringify(nextStock);
  state.db.warehouseOrders = nextOrders;
  state.db.warehouseStock = nextStock;
  adoptRemoteVersion(version, options);
  // The merge base must always track the server's own copy, never a locally
  // merged result. If a local addition ends up in the base, the next rebase
  // reads it as a row the server deleted and silently drops it.
  const base = options.base || { warehouseOrders: nextOrders, warehouseStock: nextStock };
  captureWarehouseBase(base.warehouseOrders, base.warehouseStock);
  try {
    localStorage.setItem(LS_DB, JSON.stringify(state.db));
  } catch {
    // Retain the last server state in memory if browser storage is unavailable.
  }
  return changed;
}

async function loadWarehouseStateFromApi(options = {}) {
  if (!REMOTE_DB_ENABLED || !state.user || (warehouseStateSaveRunning && !options.force)) return false;
  try {
    const data = await fetchWarehouseStateFromApi();
    if (!data) return false;
    // Background polls merge instead of replacing. A poll that was already in
    // flight when the user added furniture would otherwise wipe that row
    // before its save had a chance to run.
    const orders = mergeRowsById(
      warehouseSyncBase.warehouseOrders,
      durableWarehouseOrders(state.db.warehouseOrders),
      data.warehouseOrders,
      mergeWarehouseOrder,
    );
    const stock = mergeRowsById(
      warehouseSyncBase.warehouseStock,
      Array.isArray(state.db.warehouseStock) ? state.db.warehouseStock : [],
      data.warehouseStock,
    );
    return applyWarehouseState(orders, stock, data.version, {
      authoritative: Boolean(options.force),
      base: { warehouseOrders: data.warehouseOrders, warehouseStock: data.warehouseStock },
    });
  } catch {
    return false;
  }
}

function saveWarehouseStateToApi() {
  if (!REMOTE_DB_ENABLED) {
    saveDB({ queueRemote: false });
    return Promise.resolve(true);
  }
  if (!state.user) return Promise.resolve(false);
  saveDB({ queueRemote: false });

  const saveRequestedState = async () => {
    warehouseStateSaveRunning = true;
    try {
      // Read the payload when the request actually runs, not when it was
      // queued, so a queued save publishes every edit made while it waited.
      let warehouse = {
        warehouseOrders: durableWarehouseOrders(state.db.warehouseOrders),
        warehouseStock: Array.isArray(state.db.warehouseStock)
          ? state.db.warehouseStock.map((row) => ({ ...row }))
          : [],
      };

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const version = String(state.db?.meta?.remoteVersion || "");
        const headers = { "Content-Type": "application/json" };
        if (version) headers["If-Match"] = `"${version}"`;
        const res = await apiFetch(API_WAREHOUSE_STATE_URL, {
          method: "PUT",
          headers,
          body: JSON.stringify(warehouse),
        });

        if (res.status === 409 || res.status === 428) {
          // Someone else wrote first. Rebase this edit onto their version and
          // retry rather than discarding what the user just entered.
          const fresh = await fetchWarehouseStateFromApi();
          if (!fresh) {
            showToast(t("syncConflict"), "error");
            return "conflict";
          }
          warehouse = {
            warehouseOrders: mergeRowsById(
              warehouseSyncBase.warehouseOrders,
              warehouse.warehouseOrders,
              fresh.warehouseOrders,
              mergeWarehouseOrder,
            ),
            warehouseStock: mergeRowsById(
              warehouseSyncBase.warehouseStock,
              warehouse.warehouseStock,
              fresh.warehouseStock,
            ),
          };
          applyWarehouseState(warehouse.warehouseOrders, warehouse.warehouseStock, fresh.version, {
            authoritative: true,
            base: { warehouseOrders: fresh.warehouseOrders, warehouseStock: fresh.warehouseStock },
          });
          continue;
        }

        if (!res.ok) return false;
        const result = await res.json().catch(() => null);
        if (!result?.success || !result.version) return false;
        applyWarehouseState(warehouse.warehouseOrders, warehouse.warehouseStock, result.version, {
          authoritative: true,
        });
        return true;
      }

      showToast(t("syncConflict"), "error");
      return "conflict";
    } catch {
      return false;
    } finally {
      warehouseStateSaveRunning = false;
    }
  };

  // Fast repeated taps (for example quantity +/-) are serialized. Every call
  // rebases onto the version accepted just before it.
  warehouseStateSaveChain = warehouseStateSaveChain
    .catch(() => false)
    .then(saveRequestedState);
  return warehouseStateSaveChain;
}

async function addWarrantyTicketViaApi(row) {
  if (!REMOTE_DB_ENABLED) return null;
  try {
    const res = await apiFetch(API_WARRANTY_TICKETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row || {}),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.success && data?.item ? mapWarrantyTicketApiToLocal(data.item) : null;
  } catch {
    return null;
  }
}

async function updateWarrantyTicketViaApi(id, row) {
  if (!REMOTE_DB_ENABLED) return false;
  try {
    const res = await apiFetch(API_WARRANTY_TICKETS_URL, {
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
    const res = await apiFetch(API_WARRANTY_TICKETS_URL, {
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
    const res = await apiFetch(API_CLIENTS_URL, {
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
    const res = await apiFetch(API_MANAGERS_URL, {
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
    const res = await apiFetch(API_SHOWROOMS_URL, {
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

async function updateShowroomViaApi(storeId, name) {
  if (!REMOTE_DB_ENABLED) return false;
  const rawId = String(storeId || "").replace(/^store_/, "");
  if (!rawId || !name) return false;
  try {
    const res = await apiFetch(API_SHOWROOMS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rawId, name }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

async function deleteShowroomViaApi(storeId) {
  if (!REMOTE_DB_ENABLED) return false;
  const rawId = String(storeId || "").replace(/^store_/, "");
  if (!rawId) return false;
  try {
    const res = await apiFetch(API_SHOWROOMS_URL, {
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

async function updateCurrentUserViaApi(payload) {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const res = await apiFetch(API_PROFILE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: payload.full_name,
        login: payload.login,
        phone: payload.phone || "",
        telegram_id: payload.telegram_id || "",
        current_password: payload.current_password || "",
        new_password: payload.new_password || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success !== true || !data.user) {
      return { ok: false, error: String(data?.error || "profile_update_failed"), status: res.status };
    }
    if (data.token) setApiToken(data.token);
    const updated = upsertUserFromApi(data.user);
    if (updated) state.user = updated;
    return { ok: true, user: updated };
  } catch {
    return { ok: false, error: "profile_update_failed", status: 0 };
  }
}

async function updateManagerViaApi(payload) {
  if (!REMOTE_DB_ENABLED) return false;
  const rawId = String(payload?.id || "").replace(/^(mgr_|user_)/, "");
  if (!rawId) return false;
  try {
    const res = await apiFetch(API_MANAGERS_URL, {
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
        telegram_id: payload.telegram_id || "",
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
    const res = await apiFetch(API_MANAGERS_URL, {
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
    const res = await apiFetch(API_DELETE_CLIENT_URL, {
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
    const res = await apiFetch(API_CLIENTS_URL, {
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
    telegramId: String(apiUser.telegram_id || ""),
  };
  let existingIndex = state.db.users.findIndex((u) => String(u.id) === userId);
  if (existingIndex < 0 && apiRole === "admin") {
    const normalizedLogin = String(mapped.login || "").trim().toLowerCase();
    existingIndex = state.db.users.findIndex((u) => (
      String(u?.role || "").trim().toLowerCase() === "admin"
      && String(u?.login || "").trim().toLowerCase() === normalizedLogin
    ));
  }
  if (existingIndex >= 0) {
    state.db.users[existingIndex] = { ...state.db.users[existingIndex], ...mapped };
  } else {
    state.db.users.push(mapped);
  }
  state.db.users = dedupeAdminUsers(state.db.users);
  return state.db.users.find((u) => String(u.id) === userId)
    || state.db.users.find((u) => (
      String(u?.role || "").trim().toLowerCase() === apiRole
      && String(u?.login || "").trim().toLowerCase() === String(mapped.login || "").trim().toLowerCase()
    ));
}

function mapApiClientToLocal(row, existingCurrencyById) {
  const rawStoreId = String(row.store_id || row.storeId || "").trim();
  const mappedStoreId = rawStoreId ? `store_${rawStoreId}` : "";
  const storeId = mappedStoreId && state.db.stores.some((store) => String(store.id) === mappedStoreId)
    ? mappedStoreId
    : ensureStoreByName(row.showroom);
  const rawManagerId = String(row.manager_id || row.managerId || "").trim();
  const mappedManagerId = rawManagerId ? `mgr_${rawManagerId}` : "";
  const managerName = String(row.manager || "").trim().toLowerCase();
  const matchedManager = state.db.users.find((u) => u.role === "manager" && fullName(u).toLowerCase() === managerName);
  let managerId = mappedManagerId || matchedManager?.id || "";
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
  if (raw.includes("web")) return "website";
  if (raw.includes("meta") || raw.includes("inst")) return "meta";
  if (raw.includes("tele")) return "telegram";
  if (raw.includes("hamkor") || raw.includes("partner")) return "partnership";
  if (raw.includes("broker")) return "broker";
  if (raw.includes("inter") || raw.includes("designer")) return "interior_designer";
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
  const source = sourceRaw.includes("web")
    ? "website"
    : sourceRaw.includes("meta") || sourceRaw.includes("inst")
      ? "meta"
      : sourceRaw.includes("tele")
        ? "telegram"
        : sourceRaw.includes("hamkor") || sourceRaw.includes("partner")
          ? "partnership"
          : sourceRaw.includes("broker")
            ? "broker"
            : sourceRaw.includes("inter") || sourceRaw.includes("designer")
              ? "interior_designer"
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

function parseClientContact(contact) {
  const raw = String(contact || "").trim();
  if (!raw) return {
    raw: "",
    display: "-",
    telHref: "",
    tgHref: "",
    hasExplicitLink: false,
    explicitHref: "",
  };

  const explicitLinkMatch = raw.match(/(https?:\/\/\S+|(?:t\.me|telegram\.me)\/\S+)/i);
  const linkText = explicitLinkMatch ? String(explicitLinkMatch[1] || "").trim() : "";
  const explicitHref = linkText
    ? (/^https?:\/\//i.test(linkText) ? linkText : `https://${linkText}`)
    : "";
  const hasExplicitLink = Boolean(linkText);

  let tgHref = "";
  const tgMatch = raw.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]+)/i);
  if (tgMatch?.[1]) tgHref = `https://t.me/${tgMatch[1]}`;
  if (!tgHref) {
    const usernameMatch = raw.match(/@([A-Za-z0-9_]{4,})/);
    if (usernameMatch?.[1]) tgHref = `https://t.me/${usernameMatch[1]}`;
  }

  const digits = raw.replace(/\D+/g, "");
  let telDigits = "";
  if (digits.length >= 9) {
    if (digits.startsWith("998")) telDigits = digits.slice(0, 12);
    else telDigits = `998${digits.slice(-9)}`;
  }
  const telHref = telDigits ? `tel:+${telDigits}` : "";
  const phoneDisplay = telDigits ? formatUzPhone(telDigits) : "";
  const display = hasExplicitLink && !phoneDisplay ? linkText : (phoneDisplay || raw);

  return {
    raw,
    display,
    telHref,
    tgHref,
    hasExplicitLink,
    linkText,
    explicitHref,
    phoneDisplay,
    copyText: phoneDisplay || raw,
  };
}

function clientContactCellHtml(contact) {
  const parsed = parseClientContact(contact);
  if (parsed.display === "-") return `<span class="cell-text cell-contact contact-single-line">-</span>`;
  const linkHtml = parsed.hasExplicitLink && parsed.explicitHref
    ? `<a class="client-contact-link raw-link" href="${escapeHtml(parsed.explicitHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(parsed.linkText)}</a>`
    : "";
  if (!parsed.phoneDisplay) {
    if (linkHtml) return `<span class="client-contact-wrap contact-single-line">${linkHtml}</span>`;
    if (parsed.tgHref) {
      return `<span class="client-contact-wrap contact-single-line"><a class="client-contact-link raw-link" href="${escapeHtml(parsed.tgHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(parsed.display)}</a></span>`;
    }
    return `<span class="client-contact-wrap contact-single-line"><span class="cell-text cell-contact">${escapeHtml(parsed.display)}</span></span>`;
  }
  const phoneHtml = parsed.telHref
    ? `<a class="client-contact-link raw-link" href="${escapeHtml(parsed.telHref)}">${escapeHtml(parsed.phoneDisplay)}</a>`
    : `<span class="cell-text cell-contact">${escapeHtml(parsed.phoneDisplay)}</span>`;
  return `<span class="client-contact-wrap contact-single-line">${phoneHtml}${linkHtml}</span>`;
}

function toggleModal(el, show) {
  if (!el) return;
  if (show) {
    if (typeof closePipelineModals === "function") closePipelineModals();
    document.querySelectorAll(".custom-filter-menu, .source-filter-menu").forEach((menu) => menu.classList.add("hidden"));
    const modalRefs = [
      refs.clientModal,
      refs.dateModal,
      refs.managerModal,
      refs.storeModal,
      refs.managerEditModal,
      refs.incomingModal,
      refs.stockModal,
      refs.stockReserveModal,
      refs.salesCheckModal,
      refs.warrantyTicketModal,
      refs.confirmModal,
      refs.integrationSettingsModal,
      refs.hrBarDetailModal,
    ];
    modalRefs.forEach((modalEl) => {
      if (modalEl && modalEl !== el) modalEl.classList.add("hidden");
    });
    if (refs.notifMenu) refs.notifMenu.classList.add("hidden");
    if (refs.langMenu) refs.langMenu.classList.add("hidden");
    if (refs.authLangMenu) refs.authLangMenu.classList.add("hidden");
    if (refs.mobileMoreSheet) refs.mobileMoreSheet.classList.add("hidden");
    closeSidebar();
  }
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
  const modalOpen = [refs.clientModal, refs.dateModal, refs.managerModal, refs.storeModal, refs.managerEditModal, refs.incomingModal, refs.stockModal, refs.stockReserveModal, refs.salesCheckModal, refs.warrantyTicketModal, refs.confirmModal, refs.integrationSettingsModal]
    .some((el) => el && !el.classList.contains("hidden"));
  const pipelineModalOpen = Boolean(document.querySelector(".pipeline-modal:not(.hidden)"));
  document.body.classList.toggle("ui-lock", sidebarOpen || modalOpen || pipelineModalOpen);
}

function showToast(message, tone = "default") {
  if (!refs.toast) return;
  const nearScroll = tone === "error" && refs.scrollTopBtn && !refs.scrollTopBtn.classList.contains("hidden");
  refs.toast.classList.toggle("toast-error", tone === "error");
  refs.toast.classList.toggle("toast-near-scroll", nearScroll);
  refs.toast.textContent = message;
  refs.toast.classList.remove("hidden");
  setTimeout(() => {
    refs.toast.classList.add("hidden");
    refs.toast.classList.remove("toast-error");
    refs.toast.classList.remove("toast-near-scroll");
  }, 1700);
}

let connectSuccessTimer = null;
function showConnectSuccess(title, note = "") {
  const overlay = document.getElementById("connectSuccessOverlay");
  if (!overlay) return;
  const titleEl = document.getElementById("connectSuccessTitle");
  const noteEl = document.getElementById("connectSuccessNote");
  if (titleEl) titleEl.textContent = title || "Ulandi!";
  if (noteEl) noteEl.textContent = note || "";
  overlay.classList.remove("hidden");
  // Force a reflow so the enter transition/animation replays on repeated calls.
  void overlay.offsetWidth;
  overlay.classList.add("is-visible");
  clearTimeout(connectSuccessTimer);
  const close = () => {
    overlay.classList.remove("is-visible");
    setTimeout(() => overlay.classList.add("hidden"), 220);
  };
  overlay.onclick = close;
  connectSuccessTimer = setTimeout(close, 2200);
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

function canCreateClientBase() {
  const role = state.user?.role;
  return role === "admin" || role === "manager";
}

function canEditClientBase() {
  const role = state.user?.role;
  return role === "admin" || role === "manager";
}

function isClientReadOnlyRole() {
  return ["hr", "cashier", "skladchi"].includes(String(state.user?.role || ""));
}

function isManagerLikeUser() {
  return Boolean(state.user) && state.user.role !== "admin";
}

function canCreateSalesCheck() {
  const role = state.user?.role;
  return ["admin", "cashier", "manager"].includes(role);
}

function canDeleteSalesCheck() {
  const role = state.user?.role;
  return role === "admin" || role === "cashier";
}

function canDeleteWarrantyTicket() {
  const role = state.user?.role;
  return role === "admin" || role === "cashier";
}

function canWarehouseAdmin() {
  return state.user?.role === "admin" || state.user?.role === "skladchi";
}

let queuedRemoteDB = null;
let remotePushRunning = false;
let remotePushWaiters = [];

function settleRemotePushWaiters(result) {
  const waiters = remotePushWaiters;
  remotePushWaiters = [];
  waiters.forEach((waiter) => {
    clearTimeout(waiter.timer);
    waiter.resolve(result);
  });
}

function queueRemoteDBPush(db, waitForCompletion = false) {
  if (!REMOTE_DB_ENABLED) return Promise.resolve(true);
  // Startup runs before authentication and must never create an unauthorised
  // retry loop. The first authenticated refresh establishes remoteVersion;
  // only then is it safe to publish a snapshot.
  if (!state.user || !getApiToken()) return Promise.resolve(false);
  try {
    queuedRemoteDB = JSON.parse(JSON.stringify(db));
  } catch {
    queuedRemoteDB = db;
  }
  let completion = Promise.resolve(true);
  if (waitForCompletion) completion = new Promise((resolve) => {
    const waiter = {
      resolve,
      timer: setTimeout(() => {
        remotePushWaiters = remotePushWaiters.filter((item) => item !== waiter);
        resolve(false);
      }, 15000),
    };
    remotePushWaiters.push(waiter);
  });
  if (!remotePushRunning) flushRemoteDBPush();
  return completion;
}

async function flushRemoteDBPush() {
  if (!queuedRemoteDB || remotePushRunning) return;
  remotePushRunning = true;
  let payload = queuedRemoteDB;
  queuedRemoteDB = null;
  let result = await pushRemoteDB(payload);
  // Another session wrote first. Replay this payload's snapshot-only edits
  // onto their version and try again. Dropping it here is what silently lost
  // a sales check whenever two managers saved at the same moment.
  for (let attempt = 0; result === "conflict" && attempt < 3; attempt += 1) {
    const rebased = await rebaseSnapshotPush(payload);
    if (!rebased) break;
    payload = rebased;
    result = await pushRemoteDB(payload);
  }
  remotePushRunning = false;
  if (result === "conflict") {
    // Still losing the race after repeated rebases. The merged state is in
    // state.db and localStorage, so the next save republishes it.
    queuedRemoteDB = null;
    showToast(t("syncConflict"), "error");
    settleRemotePushWaiters("conflict");
    return;
  }
  if (!result) {
    // A user can make another edit while this request is in flight. Never
    // replace that newer queued snapshot with the older failed payload.
    if (!queuedRemoteDB) queuedRemoteDB = payload;
    setTimeout(flushRemoteDBPush, 1800);
    return;
  }
  // The server accepted this payload, so it is now the agreed base that the
  // next poll and the next rebase measure local changes against.
  captureSnapshotBase(payload);
  if (queuedRemoteDB) {
    // An edit made while the previous upload was in flight was cloned with
    // the previous version. Rebase that queued payload onto the version the
    // server just accepted so sequential edits from one tab cannot conflict
    // with each other.
    queuedRemoteDB.meta = queuedRemoteDB.meta && typeof queuedRemoteDB.meta === "object"
      ? queuedRemoteDB.meta
      : {};
    queuedRemoteDB.meta.remoteVersion = String(state.db?.meta?.remoteVersion || "");
    setTimeout(flushRemoteDBPush, 80);
    return;
  }
  settleRemotePushWaiters(true);
}

function saveDB(options = {}) {
  state.db.meta = state.db.meta && typeof state.db.meta === "object" ? state.db.meta : {};
  state.db.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(LS_DB, JSON.stringify(state.db));
  if (options.queueRemote !== false) queueRemoteDBPush(state.db);
}

async function saveDBNow() {
  saveDB({ queueRemote: false });
  return queueRemoteDBPush(state.db, true);
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
    const res = await apiFetch(API_DB_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.meta && typeof data.meta === "object") {
      data.meta.remoteVersion = String(data.meta.remoteVersion || data.meta.updatedAt || "");
    }
    return data;
  } catch {
    return null;
  }
}

// The very first load (seedDB, before login) can't call /api/db yet since
// there is no session token. Call this right after authentication succeeds
// so warehouse/sales-check/warranty/vacancy data (which lives in the
// whole-DB snapshot) actually gets pulled in for the session.
// Collections that exist only inside the whole-DB snapshot, so this browser's
// copy is the only record of an edit until it reaches the server. Everything
// else (clients, users, stores, notifications, warranty tickets) has its own
// endpoint that is authoritative and replaces the local copy on load, so a
// rebase takes the server's version of those rather than republishing ours.
const SNAPSHOT_OWNED_KEYS = [
  "salesChecks",
  "warehouseIncoming",
  "vacancies",
  "vacancyOpenings",
  "integrations",
  "priceLabels",
];

// Snapshot-only state that is an object rather than an id-keyed array. The
// lead board and the price labels have no endpoint of their own either, so
// leaving them out of the merge meant a poll adopted the newer version token
// while keeping this browser's stale copy - the next save then overwrote
// another admin's lead move with a valid If-Match and no conflict at all.
const SNAPSHOT_OWNED_OBJECT_LISTS = {
  integrations: ["connections", "columns", "leads"],
};

function mergeIntegrations(base, mine, theirs) {
  const b = base && typeof base === "object" ? base : {};
  const m = mine && typeof mine === "object" ? mine : {};
  const t = theirs && typeof theirs === "object" ? theirs : {};
  const merged = { ...t, ...m };
  SNAPSHOT_OWNED_OBJECT_LISTS.integrations.forEach((list) => {
    merged[list] = mergeRowsById(b[list] || [], m[list] || [], t[list] || []);
  });
  return merged;
}

// priceLabels.entries is a map keyed by label id, and each value carries its
// own updatedAt, so the newer edit wins per label. A key present in the base
// but gone locally was deleted here and stays deleted.
function mergePriceLabels(base, mine, theirs) {
  const b = base?.entries && typeof base.entries === "object" ? base.entries : {};
  const m = mine?.entries && typeof mine.entries === "object" ? mine.entries : {};
  const t = theirs?.entries && typeof theirs.entries === "object" ? theirs.entries : {};
  const entries = {};
  new Set([...Object.keys(m), ...Object.keys(t)]).forEach((id) => {
    const mineRow = m[id];
    const theirRow = t[id];
    if (!mineRow) {
      if (!(id in b)) entries[id] = theirRow;
      return;
    }
    if (!theirRow) {
      entries[id] = mineRow;
      return;
    }
    const mineAt = String(mineRow.updatedAt || "");
    const theirAt = String(theirRow.updatedAt || "");
    entries[id] = theirAt > mineAt ? theirRow : mineRow;
  });
  return { ...(theirs || {}), ...(mine || {}), entries };
}

function mergeSnapshotKey(key, base, mine, theirs) {
  if (key === "integrations") return mergeIntegrations(base, mine, theirs);
  if (key === "priceLabels") return mergePriceLabels(base, mine, theirs);
  return mergeRowsById(
    Array.isArray(base) ? base : [],
    Array.isArray(mine) ? mine : [],
    Array.isArray(theirs) ? theirs : [],
  );
}

function snapshotValueIsPresent(value) {
  return Array.isArray(value) || (value && typeof value === "object");
}

let snapshotSyncBase = {};
let snapshotBaseReady = false;

function captureSnapshotBase(source) {
  const next = {};
  SNAPSHOT_OWNED_KEYS.forEach((key) => {
    const value = source?.[key];
    if (Array.isArray(value)) next[key] = value.map((row) => ({ ...row }));
    else if (value && typeof value === "object") {
      try {
        next[key] = JSON.parse(JSON.stringify(value));
      } catch {
        next[key] = {};
      }
    } else next[key] = key === "integrations" || key === "priceLabels" ? {} : [];
  });
  snapshotSyncBase = next;
  snapshotBaseReady = true;
}

async function refreshExtendedDataAfterAuth() {
  if (!REMOTE_DB_ENABLED || !state.user) return [];
  const remoteDB = await fetchRemoteDB();
  if (!remoteDB || typeof remoteDB !== "object") return [];
  // This response may have left the server before a warehouse write landed.
  // Adopting its version unconditionally would roll the token backwards and
  // make the next warehouse save fail as a phantom conflict.
  adoptRemoteVersion(remoteDB.meta?.remoteVersion || remoteDB.meta?.updatedAt);
  // The first authenticated read establishes server truth for the session.
  // After that this also runs on the 4s poll, where replacing outright would
  // wipe a sales check or vacancy the user added but has not yet saved.
  const hasBase = snapshotBaseReady;
  const changedKeys = [];
  for (const key of SNAPSHOT_OWNED_KEYS) {
    if (!snapshotValueIsPresent(remoteDB[key])) continue;
    const current = snapshotValueIsPresent(state.db[key])
      ? state.db[key]
      : (Array.isArray(remoteDB[key]) ? [] : {});
    const next = hasBase
      ? mergeSnapshotKey(key, snapshotSyncBase[key], current, remoteDB[key])
      : remoteDB[key];
    if (JSON.stringify(current) === JSON.stringify(next)) continue;
    state.db[key] = next;
    changedKeys.push(key);
  }
  captureSnapshotBase(remoteDB);
  if (changedKeys.length || state.db.meta.remoteVersion) {
    try {
      localStorage.setItem(LS_DB, JSON.stringify(state.db));
    } catch {
      // storage full or unavailable - keep going in-memory
    }
  }
  return changedKeys;
}

// A conflict means another session wrote first. Replay this payload's
// snapshot-only edits onto the newest server state so the push can be retried
// instead of discarded. Starting from the server's own snapshot also stops a
// queued whole-DB push from republishing a stale copy of data that belongs to
// a dedicated endpoint.
async function rebaseSnapshotPush(payload) {
  const remoteDB = await fetchRemoteDB();
  if (!remoteDB || typeof remoteDB !== "object") return null;
  let rebased;
  try {
    rebased = JSON.parse(JSON.stringify(remoteDB));
  } catch {
    return null;
  }
  SNAPSHOT_OWNED_KEYS.forEach((key) => {
    const isObjectKey = key === "integrations" || key === "priceLabels";
    const empty = isObjectKey ? {} : [];
    const mine = snapshotValueIsPresent(payload?.[key]) ? payload[key] : empty;
    const theirs = snapshotValueIsPresent(remoteDB[key]) ? remoteDB[key] : empty;
    // With no agreed base yet the empty default makes this a union, which
    // keeps both sides. Treating the server copy as the base instead would
    // read every row this session never loaded as a local deletion.
    const merged = mergeSnapshotKey(key, snapshotSyncBase[key] || empty, mine, theirs);
    rebased[key] = merged;
    // The merged result has to land in state.db too, or this browser keeps
    // showing the state the server just rejected and republishes it later.
    state.db[key] = merged;
  });
  captureSnapshotBase(remoteDB);
  adoptRemoteVersion(remoteDB.meta?.remoteVersion || remoteDB.meta?.updatedAt, { authoritative: true });
  rebased.meta = rebased.meta && typeof rebased.meta === "object" ? rebased.meta : {};
  rebased.meta.remoteVersion = String(state.db?.meta?.remoteVersion || "");
  try {
    localStorage.setItem(LS_DB, JSON.stringify(state.db));
  } catch {
    // The retry below is what actually makes the edit durable.
  }
  return rebased;
}

async function pushRemoteDB(db) {
  try {
    const remoteVersion = String(db?.meta?.remoteVersion || "");
    const headers = { "Content-Type": "application/json" };
    if (remoteVersion) headers["If-Match"] = `"${remoteVersion}"`;
    const res = await apiFetch(API_DB_URL, {
      method: "PUT",
      headers,
      body: JSON.stringify(db),
    });
    // The caller rebases and retries. Reporting the conflict here (and
    // toasting) would fire once per attempt and discard the pending edit.
    if (res.status === 409 || res.status === 428) return "conflict";
    if (!res.ok) return false;
    const result = await res.json().catch(() => null);
    // The encrypted private snapshot is the recovery source of truth. A
    // relational mirror failure is reported by the API for diagnostics, but
    // it must not turn a successfully stored snapshot into a user-facing
    // "save failed" error.
    if (result?.version) {
      // Our own write just defined the newest version.
      adoptRemoteVersion(result.version, { authoritative: true });
      try {
        localStorage.setItem(LS_DB, JSON.stringify(state.db));
      } catch {
        // Keep the in-memory version even if browser storage is unavailable.
      }
    }
    return !result || result.ok === true;
  } catch {
    return false;
  }
}

async function loadNotificationsFromApi() {
  if (!REMOTE_DB_ENABLED || !state.user) return false;
  try {
    const to = encodeURIComponent(state.user.login || "");
    const res = await apiFetch(`${API_NOTIFICATIONS_URL}?to=${to}`, { cache: "no-store" });
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
    const res = await apiFetch(API_NOTIFICATIONS_URL, {
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
    const res = await apiFetch(API_NOTIFICATIONS_URL, {
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
    const res = await apiFetch(API_NOTIFICATIONS_URL, {
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
    const res = await apiFetch(API_NOTIFICATIONS_URL, {
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
    const res = await apiFetch(`${API_VACANCIES_URL}?type=applications`, { cache: "no-store" });
    if (!res.ok) return Array.isArray(state.db?.vacancies) ? state.db.vacancies : [];
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
    const parseVacancyMeta = (rawNote) => {
      const raw = String(rawNote || "").trim();
      if (!raw.startsWith("__VACMETA__")) return null;
      try {
        const parsed = JSON.parse(raw.slice(11));
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch {
        return null;
      }
    };
    const mapped = rows.map((row, idx) => {
      const rawNote = String(row.note || "").trim();
      const meta = parseVacancyMeta(rawNote) || {};
      const phone = String(row.phone || row.contact || row.telegram || meta.phone || "").trim();
      const avatar = String(row.photo_url || row.image_url || row.avatar_url || row.avatarUrl || meta.photoDataUrl || "").trim();
      const cleanNote = rawNote.startsWith("__VACMETA__") ? String(meta.additionalInfo || "").trim() : rawNote;
      return {
        id: String(row.id || uid("vac" + idx)),
        fullName: String(row.full_name || row.name || row.fio || "").trim(),
        phone,
        position: String(row.position || row.vacancy || row.role || meta.desiredPosition || meta.vacancyTitle || "").trim(),
        desiredPosition: String(meta.desiredPosition || "").trim(),
        desiredPositionCode: String(meta.desiredPositionCode || "").trim(),
        vacancyTitle: String(meta.vacancyTitle || row.position || "").trim(),
        resumeUrl: String(row.resume_url || row.resumeUrl || row.cv_url || row.cvUrl || "").trim() || ((rawNote.startsWith("http") || rawNote.startsWith("/")) ? rawNote : ""),
        resumeFileName: String(row.resume_file_name || row.resumeFileName || "").trim(),
        avatarUrl: avatar,
        note: cleanNote,
        source: String(row.source || "website").trim(),
        status: String(row.status || "new").trim().toLowerCase(),
        createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
        birthDate: String(meta.birthDate || "").trim(),
        languages: Array.isArray(meta.languages) ? meta.languages : [],
        otherLanguage: String(meta.otherLanguage || "").trim(),
        jobs: Array.isArray(meta.jobs) ? meta.jobs : [],
        expectedSalary: String(meta.expectedSalary || "").trim(),
        salaryCurrency: String(meta.salaryCurrency || "UZS").trim(),
        additionalInfo: String(meta.additionalInfo || "").trim(),
        lang: String(meta.lang || "uz").trim().toLowerCase(),
      };
    }).filter((row) => (row.fullName || row.phone || row.position) && row.source !== "vacancy_opening");
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
    const createdAt = publishDate ? new Date(`${publishDate}T09:00:00`).toISOString() : new Date().toISOString();
    const res = await apiFetch(API_VACANCIES_URL, {
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
    const createdAt = publishDate ? new Date(`${publishDate}T09:00:00`).toISOString() : new Date().toISOString();
    const res = await apiFetch(API_VACANCIES_URL, {
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
    const res = await apiFetch(API_VACANCIES_URL, {
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
    const res = await apiFetch(`${API_VACANCIES_URL}?type=openings`, { cache: "no-store" });
    if (!res.ok) return Array.isArray(state.db?.vacancyOpenings) ? state.db.vacancyOpenings : [];
    const payload = await res.json();
    const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
    const mapped = rows.map((row, idx) => ({
      id: String(row.id || uid("opening" + idx)),
      position: String(row.position || row.title || row.vacancy || "").trim(),
      regulation: String(row.description || row.note || row.regulation || row.details || "").trim(),
      createdAt: String(row.published_at || row.created_at || row.createdAt || new Date().toISOString()),
      source: "vacancy_opening",
    })).filter((row) => row.position);
    state.db.vacancyOpenings = mapped;
    localStorage.setItem(LS_DB, JSON.stringify(state.db));
    return mapped;
  } catch {
    return Array.isArray(state.db?.vacancyOpenings) ? state.db.vacancyOpenings : [];
  }
}

async function deleteVacancyViaApi(vacancyId, type = "application") {
  if (!REMOTE_DB_ENABLED) return false;
  const id = String(vacancyId || "").trim();
  if (!id) return false;
  try {
    const res = await apiFetch(API_VACANCIES_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({ success: true }));
    return Boolean(data?.success !== false);
  } catch {
    return false;
  }
}

