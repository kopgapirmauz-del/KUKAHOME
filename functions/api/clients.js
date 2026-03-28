import { ensureStoreByName, first, listStores, restRequest } from "./_supabase.js";

async function listUsers(env) {
  const rows = await restRequest(env, "users", {
    query: { select: "id,full_name,login,role,store_id" },
  });
  return Array.isArray(rows) ? rows : [];
}

function parsePrice(value) {
  const raw = String(value ?? "").replace(/[^0-9.-]/g, "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function normalizeClientRow(row, stores, users) {
  const storeName = stores.find((s) => s.id === row.store_id)?.name || "";
  const managerName = users.find((u) => u.id === row.manager_id)?.full_name || "";
  return {
    id: row.id,
    date: row.date || "",
    showroom: storeName,
    manager: managerName,
    phone: row.phone || "",
    source: row.source || "new_client",
    interest: row.interest || "",
    note: row.note || "",
    status: row.status || "",
    price: Number(row.price || 0),
    result: row.result || "",
    created_at: row.created_at || null,
  };
}

async function findUserByLogin(env, login) {
  const rows = await restRequest(env, "users", {
    query: {
      select: "id,login,role",
      login: `eq.${String(login || "").trim()}`,
      limit: "1",
    },
  });
  return first(rows);
}

async function findUserByFullName(env, fullName) {
  const users = await listUsers(env);
  const target = String(fullName || "").trim().toLowerCase();
  return users.find((u) => String(u.full_name || "").trim().toLowerCase() === target) || null;
}

async function createNotification(env, payload) {
  await restRequest(env, "notifications", {
    method: "POST",
    body: payload,
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const managerName = String(url.searchParams.get("manager") || "").trim();
    const role = String(url.searchParams.get("role") || "manager").trim().toLowerCase();

    let managerId = null;
    if (role !== "admin") {
      const manager = await findUserByFullName(env, managerName);
      managerId = manager?.id || null;
      if (!managerId) return Response.json([]);
    }

    const query = {
      select: "id,date,store_id,manager_id,phone,source,interest,note,status,price,result,created_at",
      order: "created_at.desc",
    };
    if (managerId) query.manager_id = `eq.${managerId}`;

    const [rows, stores, users] = await Promise.all([
      restRequest(env, "clients", { query }),
      listStores(env),
      listUsers(env),
    ]);

    const clients = Array.isArray(rows) ? rows : [];
    return Response.json(clients.map((row) => normalizeClientRow(row, stores, users)));
  } catch {
    return Response.json([], { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const store = await ensureStoreByName(env, data?.showroom || "");
    const manager = await findUserByFullName(env, data?.manager || "");

    await restRequest(env, "clients", {
      method: "POST",
      body: {
        date: String(data?.date || "") || null,
        store_id: store?.id || null,
        manager_id: manager?.id || null,
        phone: String(data?.phone || ""),
        source: String(data?.source || "new_client"),
        interest: String(data?.interest || ""),
        note: String(data?.note || ""),
        status: String(data?.status || ""),
        price: parsePrice(data?.price),
        result: String(data?.result || ""),
      },
    });

    const creatorRole = String(data?.creator_role || "").trim().toLowerCase();
    const actor = await findUserByLogin(env, data?.creator_login || "");
    const clientContact = String(data?.phone || "-");

    if (creatorRole === "manager" || creatorRole === "website") {
      const admins = await restRequest(env, "users", {
        query: { select: "id,login", role: "eq.admin" },
      });
      for (const admin of Array.isArray(admins) ? admins : []) {
        await createNotification(env, {
          type: creatorRole === "website" ? "new_lead_from_site" : "new_client_from_manager",
          to_user_id: admin.id,
          actor_user_id: actor?.id || null,
          client_contact: clientContact,
          is_read: false,
        });
      }
    }

    if (creatorRole === "admin" && data?.assigned_manager_login) {
      const assigned = await findUserByLogin(env, data.assigned_manager_login);
      if (assigned?.id) {
        await createNotification(env, {
          type: "assigned_by_admin",
          to_user_id: assigned.id,
          actor_user_id: actor?.id || null,
          client_contact: clientContact,
          is_read: false,
        });
      }
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const clientId = String(data?.id || "").trim();
    if (!clientId) return Response.json({ success: false }, { status: 400 });

    const store = await ensureStoreByName(env, data?.showroom || "");
    const manager = await findUserByFullName(env, data?.manager || "");

    await restRequest(env, `clients?id=eq.${encodeURIComponent(clientId)}`, {
      method: "PATCH",
      body: {
        date: String(data?.date || "") || null,
        store_id: store?.id || null,
        manager_id: manager?.id || null,
        phone: String(data?.phone || ""),
        source: String(data?.source || "new_client"),
        interest: String(data?.interest || ""),
        note: String(data?.note || ""),
        status: String(data?.status || ""),
        price: parsePrice(data?.price),
        result: String(data?.result || ""),
      },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
