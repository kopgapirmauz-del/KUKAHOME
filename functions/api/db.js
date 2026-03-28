import { listStores, restRequest, storageDownload, storageUpload } from "./_supabase.js";

const SNAPSHOT_BUCKET = "crm-private";
const SNAPSHOT_PATH = "system/crm-db.json";

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
  const [stores, users, clients, notifications] = await Promise.all([
    listStores(env),
    restRequest(env, "users", {
      query: { select: "id,full_name,login,password_hash,role,store_id,created_at", order: "created_at.desc" },
    }),
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

  return db;
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const file = await storageDownload(env, SNAPSHOT_BUCKET, SNAPSHOT_PATH);
    if (file) {
      const json = await file.json();
      return Response.json(normalizeDbShape(json));
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
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
