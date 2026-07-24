import { ensureStoreByName, first, listStores, normalizeRole, restRequest } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

const MANAGED_ROLES = new Set(["manager", "hr", "cashier", "skladchi"]);

function formatApiUser(row, stores) {
  const storeName = stores.find((s) => s.id === row.store_id)?.name || "";
  return {
    id: row.id,
    full_name: row.full_name || "",
    login: row.login || "",
    password: "",
    role: normalizeRole(row.role),
    phone: String(row.phone || ""),
    showroom: storeName,
    created_at: row.created_at || null,
  };
}

async function hashAndSetPassword(env, userId, plainPassword) {
  if (!plainPassword) return;
  await restRequest(env, "rpc/set_user_password", {
    method: "POST",
    body: { p_user_id: userId, p_new_password: plainPassword },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin"]);
  if (session instanceof Response) return session;

  try {
    let users;
    try {
      users = await restRequest(env, "users", {
        query: {
          select: "id,full_name,login,role,store_id,phone,created_at",
          role: "neq.admin",
          order: "created_at.desc",
        },
      });
    } catch {
      users = await restRequest(env, "users", {
        query: {
          select: "id,full_name,login,role,store_id,created_at",
          role: "neq.admin",
          order: "created_at.desc",
        },
      });
    }
    const stores = await listStores(env);

    const rows = Array.isArray(users) ? users : [];
    return Response.json({ success: true, items: rows.map((row) => formatApiUser(row, stores)) });
  } catch {
    return Response.json({ success: false, items: [] }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin"]);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const role = normalizeRole(data?.role || "manager");
    if (!MANAGED_ROLES.has(role)) {
      return Response.json({ success: false, error: "invalid_managed_role" }, { status: 400 });
    }
    const showroom = String(data?.showroom || "").trim();
    const needsStore = role === "manager";
    const password = String(data?.password || "").trim();
    if (!password) return Response.json({ success: false, error: "password_required" }, { status: 400 });

    let storeId = null;
    if (needsStore && showroom) {
      const store = await ensureStoreByName(env, showroom);
      storeId = store?.id || null;
    }

    const body = {
      full_name: String(data?.full_name || "").trim(),
      login: String(data?.login || "").trim(),
      // Placeholder value; overwritten immediately below via the bcrypt RPC.
      // Never store a plaintext password here.
      password_hash: crypto.randomUUID(),
      phone: String(data?.phone || "").trim(),
      role,
      store_id: storeId,
    };

    let inserted;
    try {
      inserted = await restRequest(env, "users", { method: "POST", body, prefer: "return=representation" });
    } catch {
      delete body.phone;
      inserted = await restRequest(env, "users", { method: "POST", body, prefer: "return=representation" });
    }
    const row = first(inserted);
    if (row?.id) await hashAndSetPassword(env, row.id, password);

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin"]);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const role = normalizeRole(data?.role || "manager");
    if (!MANAGED_ROLES.has(role)) {
      return Response.json({ success: false, error: "invalid_managed_role" }, { status: 400 });
    }
    const showroom = String(data?.showroom || "").trim();
    const password = String(data?.password || "").trim();
    const rawId = String(data?.id || "").trim();
    const userId = rawId.replace(/^mgr_/, "");
    if (!userId) return Response.json({ success: false }, { status: 400 });
    const target = await restRequest(env, "users", {
      query: { select: "id,role", id: `eq.${userId}`, limit: "1" },
    }).then(first);
    if (!target) return Response.json({ success: false, error: "user_not_found" }, { status: 404 });
    if (String(target.role || "").toLowerCase() === "admin") {
      return Response.json({ success: false, error: "primary_admin_protected" }, { status: 403 });
    }

    let storeId = null;
    if (role === "manager" && showroom) {
      const store = await ensureStoreByName(env, showroom);
      storeId = store?.id || null;
    }

    const patch = {
      full_name: String(data?.full_name || "").trim(),
      login: String(data?.login || "").trim(),
      phone: String(data?.phone || "").trim(),
      role,
      store_id: storeId,
    };

    try {
      await restRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: patch });
    } catch {
      delete patch.phone;
      await restRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: patch });
    }

    if (password) await hashAndSetPassword(env, userId, password);

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin"]);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const rawId = String(data?.id || "").trim();
    const userId = rawId.replace(/^mgr_/, "");
    if (!userId) return Response.json({ success: false }, { status: 400 });

    await restRequest(env, `users?id=eq.${encodeURIComponent(userId)}&role=neq.admin`, {
      method: "DELETE",
    });

    await restRequest(env, `clients?manager_id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: { manager_id: null },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
