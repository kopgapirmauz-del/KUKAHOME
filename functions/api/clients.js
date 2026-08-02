import { ensureStoreByName, first, getServiceRoleKey, getSupabaseUrl, listStores, restRequest } from "./_supabase.js";
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

function normalizeCurrency(value) {
  return String(value || "").trim().toUpperCase() === "USD" ? "USD" : "UZS";
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
    // Keep the database IDs alongside the display names. The client module
    // uses these values for filters and manager visibility, so it must not
    // infer an assignment from a possibly non-unique full name.
    store_id: row.store_id || null,
    manager_id: row.manager_id || null,
    date: row.date || "",
    showroom: storeName,
    manager: managerName,
    phone: row.phone || "",
    source: row.source || "new_client",
    interest: row.interest || "",
    note: row.note || "",
    status: row.status || "",
    price: Number(row.price || 0),
    currency: normalizeCurrency(row.currency),
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
  const pages = [];
  let total = null;

  while (true) {
    const url = new URL("/rest/v1/clients", getSupabaseUrl(env));
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));
    const key = getServiceRoleKey(env);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "count=exact",
        "Range-Unit": "items",
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase clients page failed: ${res.status} ${text}`);
    }
    const range = String(res.headers.get("content-range") || "");
    const match = range.match(/\/(\d+)$/);
    if (match) total = Number(match[1]);

    const rows = await res.json();
    const chunk = Array.isArray(rows) ? rows : [];
    pages.push({ offset, count: chunk.length, contentRange: range });
    all.push(...chunk);
    if (total !== null && all.length >= total) break;
    if (chunk.length < pageSize) break;
    offset += pageSize;
  }
  return { rows: all, pages, total };
}

// Roles that can see every client, not just their own. targetolog is
// view-only (blocked explicitly in POST/PUT below) but still needs full
// read visibility, same as the full-access roles.
const FULL_VISIBILITY_ROLES = ["admin", "hr", "director", "targetolog", "community_manager", "employee"];
const CLIENTS_READ_ONLY_ROLES = ["targetolog"];
export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const query = {
      select: "id,date,store_id,manager_id,phone,source,interest,note,status,price,currency,result,created_at",
      // A stable secondary sort prevents records with equal timestamps from
      // moving between requests while paginating.
      order: "created_at.desc,id.desc",
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

    const pageResult = rows && typeof rows === "object" && Array.isArray(rows.rows)
      ? rows
      : { rows: Array.isArray(rows) ? rows : [], pages: [], total: null };
    const clients = pageResult.rows;
    const output = clients.map((row) => normalizeClientRow(row, stores, users));
    const debug = new URL(request.url).searchParams.get("debug") === "1";
    return Response.json(debug ? {
      success: true,
      totalFetched: output.length,
      pages: pageResult.pages,
      supabaseTotal: pageResult.total,
      items: output,
    } : output, {
      headers: {
        "X-CRM-Clients-Version": "20260724-currency-v1",
        "X-CRM-Clients-Count": String(clients.length),
        "X-CRM-Clients-Pages": String(pageResult.pages.length),
      },
    });
  } catch {
    return Response.json([], { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  if (CLIENTS_READ_ONLY_ROLES.includes(session.role)) {
    return Response.json({ success: false, error: "forbidden" }, { status: 403 });
  }

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
        currency: normalizeCurrency(data?.currency),
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
  if (CLIENTS_READ_ONLY_ROLES.includes(session.role)) {
    return Response.json({ success: false, error: "forbidden" }, { status: 403 });
  }

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
    const requestedManager = String(data?.manager || "").trim();
    const manager = FULL_VISIBILITY_ROLES.includes(session.role)
      ? (requestedManager ? await findUserByFullName(env, requestedManager) : null)
      : await findUserById(env, session.uid);

    const patch = {
      date: parseDateForDb(data?.date),
      store_id: store?.id || null,
      phone: String(data?.phone || ""),
      source: String(data?.source || "new_client"),
      interest: String(data?.interest || ""),
      note: String(data?.note || ""),
      status: String(data?.status || ""),
      price: parsePrice(data?.price),
      currency: normalizeCurrency(data?.currency),
      result: String(data?.result || ""),
    };

    // Only reassign when a manager was actually named and resolved. Writing
    // manager_id unconditionally meant `null` whenever findUserByFullName
    // missed - an admin fixing a typo in the note without resending the
    // manager, or a manager whose full_name had been edited since the row was
    // rendered - which silently orphaned the client. It then vanished from
    // that manager's list, because GET filters on manager_id, and the previous
    // owner was unrecoverable.
    if (manager?.id) patch.manager_id = manager.id;

    await restRequest(env, `clients?id=eq.${encodeURIComponent(clientId)}`, {
      method: "PATCH",
      body: patch,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
