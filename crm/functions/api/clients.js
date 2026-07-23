import { ensureStoreByName, first, listStores, restRequest } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

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

function parseDateForDb(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
  if (m) {
    const yy = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${yy}-${m[2]}-${m[1]}`;
  }
  return null;
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

async function findUserById(env, id) {
  if (!id) return null;
  const rows = await restRequest(env, "users", {
    query: { select: "id,login,role", id: `eq.${id}`, limit: "1" },
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

async function listAllClients(env, query) {
  const pageSize = 1000;
  let offset = 0;
  const all = [];
  while (true) {
    const rows = await restRequest(env, "clients", {
      query: {
        ...(query || {}),
      },
      range: `${offset}-${offset + pageSize - 1}`,
    });
    const chunk = Array.isArray(rows) ? rows : [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

// Roles that can see every client, not just their own.
const FULL_VISIBILITY_ROLES = ["admin", "hr"];

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const query = {
      select: "id,date,store_id,manager_id,phone,source,interest,note,status,price,result,created_at",
      order: "created_at.desc",
    };
    // Server decides visibility from the verified session - never from a
    // client-supplied "role"/"manager" query param.
    if (!FULL_VISIBILITY_ROLES.includes(session.role)) {
      query.manager_id = `eq.${session.uid}`;
    }

    const [rows, stores, users] = await Promise.all([
      listAllClients(env, query),
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
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const store = await ensureStoreByName(env, data?.showroom || "");
    // Managers can only create clients assigned to themselves.
    const manager = FULL_VISIBILITY_ROLES.includes(session.role)
      ? (await findUserByFullName(env, data?.manager || "")) || (await findUserById(env, session.uid))
      : await findUserById(env, session.uid);

    await restRequest(env, "clients", {
      method: "POST",
      body: {
        date: parseDateForDb(data?.date),
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

    try {
      const clientContact = String(data?.phone || "-");
      if (session.role === "manager") {
        const admins = await restRequest(env, "users", {
          query: { select: "id,login", role: "eq.admin" },
        });
        for (const admin of Array.isArray(admins) ? admins : []) {
          await createNotification(env, {
            type: "new_client_from_manager",
            to_user_id: admin.id,
            actor_user_id: session.uid,
            client_contact: clientContact,
            is_read: false,
          });
        }
      }

      if (session.role === "admin" && data?.assigned_manager_login) {
        const assigned = await restRequest(env, "users", {
          query: { select: "id,login", login: `eq.${String(data.assigned_manager_login).trim()}`, limit: "1" },
        }).then(first);
        if (assigned?.id) {
          await createNotification(env, {
            type: "assigned_by_admin",
            to_user_id: assigned.id,
            actor_user_id: session.uid,
            client_contact: clientContact,
            is_read: false,
          });
        }
      }
    } catch {
      // ignore notification failures, client already saved
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const clientId = String(data?.id || "").trim();
    if (!clientId) return Response.json({ success: false }, { status: 400 });

    // Managers may only edit their own clients.
    if (!FULL_VISIBILITY_ROLES.includes(session.role)) {
      const existing = await restRequest(env, "clients", {
        query: { select: "id,manager_id", id: `eq.${clientId}`, limit: "1" },
      }).then(first);
      if (!existing || String(existing.manager_id || "") !== String(session.uid)) {
        return Response.json({ success: false, error: "forbidden" }, { status: 403 });
      }
    }

    const store = await ensureStoreByName(env, data?.showroom || "");
    const manager = FULL_VISIBILITY_ROLES.includes(session.role)
      ? await findUserByFullName(env, data?.manager || "")
      : await findUserById(env, session.uid);

    await restRequest(env, `clients?id=eq.${encodeURIComponent(clientId)}`, {
      method: "PATCH",
      body: {
        date: parseDateForDb(data?.date),
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
