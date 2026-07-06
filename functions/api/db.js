import { listStores, restRequest, storageDownload, storageUpload } from "./_supabase.js";

const SNAPSHOT_BUCKET = "crm-private";
const SNAPSHOT_PATH = "system/crm-db.json";

function looksUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

function hash32(input, seed = 2166136261) {
  let h = seed >>> 0;
  const text = String(input || "");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function stableUuidFromAny(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (looksUuid(raw)) return raw;
  const p1 = hash32(`${raw}|1`);
  const p2 = hash32(`${raw}|2`);
  const p3 = hash32(`${raw}|3`);
  const p4 = hash32(`${raw}|4`);
  const hex = `${p1}${p2}${p3}${p4}`;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function toDateOnly(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return null;
  return new Date(ts).toISOString().slice(0, 10);
}

function stripRefPrefix(value) {
  return String(value || "").trim().replace(/^store_/, "").replace(/^(mgr_|user_)/, "");
}

function parseQty(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDbShape(db) {
  const safe = db && typeof db === "object" ? db : {};
  safe.meta = safe.meta && typeof safe.meta === "object" ? safe.meta : {};
  if (!safe.meta.updatedAt) safe.meta.updatedAt = new Date().toISOString();
  safe.stores = Array.isArray(safe.stores) ? safe.stores : [];
  safe.users = Array.isArray(safe.users) ? safe.users : [];
  safe.clients = Array.isArray(safe.clients) ? safe.clients : [];
  safe.notifications = Array.isArray(safe.notifications) ? safe.notifications : [];
  safe.salesChecks = Array.isArray(safe.salesChecks) ? safe.salesChecks : [];
  safe.warehouseOrders = Array.isArray(safe.warehouseOrders) ? safe.warehouseOrders : [];
  safe.warehouseIncoming = Array.isArray(safe.warehouseIncoming) ? safe.warehouseIncoming : [];
  safe.warehouseStock = Array.isArray(safe.warehouseStock) ? safe.warehouseStock : [];
  safe.warrantyTickets = Array.isArray(safe.warrantyTickets) ? safe.warrantyTickets : [];
  safe.vacancies = Array.isArray(safe.vacancies) ? safe.vacancies : [];
  safe.vacancyOpenings = Array.isArray(safe.vacancyOpenings) ? safe.vacancyOpenings : [];
  return safe;
}

function splitName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

async function buildFallbackFromSupabase(env) {
  let users;
  try {
    users = await restRequest(env, "users", {
      query: { select: "id,full_name,login,password_hash,role,store_id,phone,created_at", order: "created_at.desc" },
    });
  } catch {
    users = await restRequest(env, "users", {
      query: { select: "id,full_name,login,password_hash,role,store_id,created_at", order: "created_at.desc" },
    });
  }

  const [stores, clients, notifications] = await Promise.all([
    listStores(env),
    restRequest(env, "clients", {
      query: {
        select: "id,date,store_id,manager_id,phone,source,interest,note,status,price,result,created_at",
        order: "created_at.desc",
      },
    }),
    restRequest(env, "notifications", {
      query: { select: "id,type,to_user_id,actor_user_id,client_contact,is_read,created_at", order: "id.desc" },
    }),
  ]);

  const storeById = new Map((Array.isArray(stores) ? stores : []).map((s) => [s.id, s]));
  const usersRows = Array.isArray(users) ? users : [];
  const userById = new Map(usersRows.map((u) => [u.id, u]));

  const db = normalizeDbShape({
    meta: { updatedAt: new Date().toISOString() },
    stores: (Array.isArray(stores) ? stores : []).map((s) => ({
      id: `store_${s.id}`,
      name: String(s.name || ""),
    })),
    users: usersRows.map((u) => {
      const n = splitName(u.full_name);
      return {
        id: `mgr_${u.id}`,
        role: String(u.role || "manager"),
        login: String(u.login || ""),
        password: String(u.password_hash || ""),
        firstName: n.firstName,
        lastName: n.lastName,
        avatar: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&q=80&auto=format&fit=crop",
        storeId: u.store_id ? `store_${u.store_id}` : "",
        phone: String(u.phone || ""),
      };
    }),
    clients: (Array.isArray(clients) ? clients : []).map((c) => {
      const manager = c.manager_id ? userById.get(c.manager_id) : null;
      const store = c.store_id ? storeById.get(c.store_id) : null;
      return {
        id: String(c.id || ""),
        date: c.date || "",
        contact: String(c.phone || ""),
        source: String(c.source || "new_client"),
        interest: String(c.interest || ""),
        comment: String(c.note || ""),
        attended: String(c.result || ""),
        price: Number(c.price || 0),
        currency: "UZS",
        status: String(c.status || ""),
        storeId: store ? `store_${store.id}` : "",
        managerId: manager ? `mgr_${manager.id}` : "",
        createdAt: c.created_at || new Date().toISOString(),
        createdBy: manager ? `mgr_${manager.id}` : "",
      };
    }),
    notifications: (Array.isArray(notifications) ? notifications : []).map((n) => ({
      id: String(n.id || ""),
      type: String(n.type || "new_client_from_manager"),
      to_login: n.to_user_id && userById.get(n.to_user_id) ? userById.get(n.to_user_id).login : "",
      actor_login: n.actor_user_id && userById.get(n.actor_user_id) ? userById.get(n.actor_user_id).login : "",
      client_contact: String(n.client_contact || "-"),
      is_read: n.is_read ? 1 : 0,
      created_at: n.created_at || new Date().toISOString(),
    })),
  });

  const extended = await loadExtendedTables(env);
  if (extended.salesChecks.length) db.salesChecks = extended.salesChecks;
  if (extended.warehouseOrders.length) db.warehouseOrders = extended.warehouseOrders;
  if (extended.warehouseStock.length) db.warehouseStock = extended.warehouseStock;

  return db;
}

async function loadExtendedTables(env) {
  const out = {
    salesChecks: [],
    warehouseOrders: [],
    warehouseStock: [],
  };

  let salesRows = [];
  try {
    salesRows = await restRequest(env, "sales_checks", {
      query: {
        select: "id,check_no,store_id,manager_id,order_date,form_data,receipt_url,receipt_data_url,receipt_file_name,created_at",
        order: "created_at.desc",
      },
    });
  } catch {
    salesRows = [];
  }
  out.salesChecks = (Array.isArray(salesRows) ? salesRows : []).map((row) => ({
    id: String(row.id || ""),
    checkNo: Number(row.check_no || 0) || 1,
    storeId: row.store_id ? `store_${row.store_id}` : "",
    managerId: row.manager_id ? `mgr_${row.manager_id}` : "",
    orderDate: String(row.order_date || ""),
    formData: row.form_data && typeof row.form_data === "object" ? row.form_data : {},
    receiptUrl: String(row.receipt_url || ""),
    receiptDataUrl: String(row.receipt_data_url || ""),
    receiptFileName: String(row.receipt_file_name || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
  }));

  let orders = [];
  let orderItems = [];
  try {
    orders = await restRequest(env, "warehouse_orders", {
      query: {
        select: "id,stage_key,eta,created_at",
        order: "created_at.desc",
      },
    });
  } catch {
    orders = [];
  }
  try {
    orderItems = await restRequest(env, "warehouse_order_items", {
      query: {
        select: "id,order_id,model,info,qty,status,image_url,created_at",
        order: "created_at.desc",
      },
    });
  } catch {
    orderItems = [];
  }
  const grouped = new Map();
  (Array.isArray(orderItems) ? orderItems : []).forEach((item) => {
    const oid = String(item.order_id || "");
    if (!oid) return;
    if (!grouped.has(oid)) grouped.set(oid, []);
    grouped.get(oid).push({
      id: String(item.id || stableUuidFromAny(`${oid}:${item.model || ""}:${item.created_at || ""}`)),
      model: String(item.model || ""),
      info: String(item.info || ""),
      qty: parseQty(item.qty),
      status: String(item.status || "pending"),
      imageUrl: String(item.image_url || ""),
      createdAt: String(item.created_at || ""),
    });
  });
  out.warehouseOrders = (Array.isArray(orders) ? orders : []).map((row) => {
    const id = String(row.id || "");
    return {
      id,
      stageKey: String(row.stage_key || "from_china"),
      eta: String(row.eta || ""),
      listOpen: false,
      search: "",
      items: grouped.get(id) || [],
      createdAt: String(row.created_at || ""),
    };
  });

  let stockRows = [];
  try {
    stockRows = await restRequest(env, "warehouse_stock", {
      query: {
        select: "id,model,info,qty,location_type,store_id,status,reservation,image_url,created_at,updated_at",
        order: "created_at.desc",
      },
    });
  } catch {
    stockRows = [];
  }
  out.warehouseStock = (Array.isArray(stockRows) ? stockRows : []).map((row) => ({
    id: String(row.id || stableUuidFromAny(`${row.model || "stock"}:${row.created_at || ""}`)),
    model: String(row.model || ""),
    info: String(row.info || ""),
    qty: parseQty(row.qty),
    locationType: String(row.location_type || "showroom"),
    storeId: row.store_id ? `store_${row.store_id}` : "",
    status: String(row.status || "available"),
    reservation: row.reservation && typeof row.reservation === "object" ? row.reservation : null,
    imageUrl: String(row.image_url || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || row.created_at || ""),
  }));

  return out;
}

async function replaceTableRows(env, table, rows, fallbacks = []) {
  await restRequest(env, table, { method: "DELETE", query: { id: "not.is.null" } });
  if (!Array.isArray(rows) || !rows.length) return;

  const attempts = [rows].concat(fallbacks.filter((x) => Array.isArray(x) && x.length));
  let lastError = null;
  for (const batch of attempts) {
    try {
      await restRequest(env, table, {
        method: "POST",
        body: batch,
        prefer: "return=minimal",
      });
      return;
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError) throw lastError;
}

async function syncExtendedTables(env, payload) {
  const sales = Array.isArray(payload?.salesChecks) ? payload.salesChecks : [];
  const orders = Array.isArray(payload?.warehouseOrders) ? payload.warehouseOrders : [];
  const stock = Array.isArray(payload?.warehouseStock) ? payload.warehouseStock : [];

  const salesMapped = sales.map((row) => {
    const rawStore = stripRefPrefix(row.storeId);
    const rawManager = stripRefPrefix(row.managerId);
    return {
      id: stableUuidFromAny(row.id || `${row.checkNo || "check"}:${row.createdAt || ""}`),
      check_no: Math.max(1, Number(row.checkNo || 0) || 1),
      store_id: rawStore || null,
      manager_id: rawManager || null,
      order_date: toDateOnly(row.orderDate || row.createdAt),
      form_data: row.formData && typeof row.formData === "object" ? row.formData : {},
      receipt_url: String(row.receiptUrl || ""),
      receipt_data_url: String(row.receiptDataUrl || ""),
      receipt_file_name: String(row.receiptFileName || ""),
      created_at: String(row.createdAt || new Date().toISOString()),
    };
  });
  const salesMappedUuidOnly = salesMapped.map((row) => ({
    ...row,
    store_id: looksUuid(row.store_id) ? row.store_id : null,
    manager_id: looksUuid(row.manager_id) ? row.manager_id : null,
  }));

  const orderIdMap = new Map();
  const ordersMapped = orders.map((row) => {
    const id = stableUuidFromAny(row.id || `${row.stageKey || "stage"}:${row.createdAt || ""}`);
    orderIdMap.set(String(row.id || ""), id);
    return {
      id,
      stage_key: String(row.stageKey || "from_china"),
      eta: toDateOnly(row.eta),
      created_at: String(row.createdAt || new Date().toISOString()),
    };
  });

  const itemsMapped = [];
  orders.forEach((order) => {
    const orderId = orderIdMap.get(String(order.id || ""));
    if (!orderId) return;
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      itemsMapped.push({
        id: stableUuidFromAny(item.id || `${orderId}:${item.model || "model"}:${item.createdAt || ""}`),
        order_id: orderId,
        model: String(item.model || ""),
        info: String(item.info || ""),
        qty: parseQty(item.qty),
        status: String(item.status || "pending"),
        image_url: String(item.imageUrl || ""),
        created_at: String(item.createdAt || new Date().toISOString()),
      });
    });
  });

  const stockMapped = stock.map((row) => ({
    id: stableUuidFromAny(row.id || `${row.model || "stock"}:${row.createdAt || ""}`),
    model: String(row.model || ""),
    info: String(row.info || ""),
    qty: parseQty(row.qty),
    location_type: String(row.locationType || "showroom"),
    store_id: stripRefPrefix(row.storeId) || null,
    status: String(row.status || "available"),
    reservation: row.reservation && typeof row.reservation === "object" ? row.reservation : null,
    image_url: String(row.imageUrl || ""),
    created_at: String(row.createdAt || new Date().toISOString()),
    updated_at: String(row.updatedAt || row.createdAt || new Date().toISOString()),
  }));

  const stockMappedUuidOnly = stockMapped.map((row) => ({
    ...row,
    store_id: looksUuid(row.store_id) ? row.store_id : null,
  }));

  await replaceTableRows(env, "sales_checks", salesMapped, [salesMappedUuidOnly]);
  await replaceTableRows(env, "warehouse_orders", ordersMapped);
  await replaceTableRows(env, "warehouse_order_items", itemsMapped);
  await replaceTableRows(env, "warehouse_stock", stockMapped, [stockMappedUuidOnly]);
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const file = await storageDownload(env, SNAPSHOT_BUCKET, SNAPSHOT_PATH);
    if (file) {
      const json = normalizeDbShape(await file.json());
      try {
        const extended = await loadExtendedTables(env);
        if (extended.salesChecks.length) json.salesChecks = extended.salesChecks;
        if (extended.warehouseOrders.length) json.warehouseOrders = extended.warehouseOrders;
        if (extended.warehouseStock.length) json.warehouseStock = extended.warehouseStock;
      } catch {
        // keep snapshot only
      }
      return Response.json(json);
    }
    const fallback = await buildFallbackFromSupabase(env);
    return Response.json(fallback);
  } catch {
    return Response.json(normalizeDbShape({}));
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const payload = normalizeDbShape(await request.json());
    payload.meta.updatedAt = new Date().toISOString();
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    await storageUpload(env, SNAPSHOT_BUCKET, SNAPSHOT_PATH, bytes, "application/json");

    let mirrored = true;
    try {
      await syncExtendedTables(env, payload);
    } catch {
      mirrored = false;
    }

    return Response.json({ ok: true, mirrored });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
