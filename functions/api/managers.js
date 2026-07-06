import { ensureStoreByName, listStores, normalizeRole, restRequest } from "./_supabase.js";

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

export async function onRequestGet(context) {
  const { env } = context;
  try {
    let users;
    try {
      users = await restRequest(env, "users", {
        query: {
          select: "id,full_name,login,password_hash,role,store_id,phone,created_at",
          role: "neq.admin",
          order: "created_at.desc",
        },
      });
    } catch {
      users = await restRequest(env, "users", {
        query: {
          select: "id,full_name,login,password_hash,role,store_id,created_at",
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
  try {
    const data = await request.json();
    const role = normalizeRole(data?.role || "manager");
    const showroom = String(data?.showroom || "").trim();
    const needsStore = role === "manager";

    let storeId = null;
    if (needsStore && showroom) {
      const store = await ensureStoreByName(env, showroom);
      storeId = store?.id || null;
    }

    const body = {
      full_name: String(data?.full_name || "").trim(),
      login: String(data?.login || "").trim(),
      password_hash: String(data?.password || "").trim(),
      phone: String(data?.phone || "").trim(),
      role,
      store_id: storeId,
    };
    try {
      await restRequest(env, "users", {
        method: "POST",
        body,
      });
    } catch {
      delete body.phone;
      await restRequest(env, "users", {
        method: "POST",
        body,
      });
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
    const role = normalizeRole(data?.role || "manager");
    const showroom = String(data?.showroom || "").trim();
    const password = String(data?.password || "").trim();
    const rawId = String(data?.id || "").trim();
    const userId = rawId.replace(/^mgr_/, "");
    if (!userId) return Response.json({ success: false }, { status: 400 });

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
    if (password) patch.password_hash = password;

    try {
      await restRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: patch,
      });
    } catch {
      delete patch.phone;
      await restRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: patch,
      });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const rawId = String(data?.id || "").trim();
    const userId = rawId.replace(/^mgr_/, "");
    if (!userId) return Response.json({ success: false }, { status: 400 });

    await restRequest(env, `users?id=eq.${encodeURIComponent(userId)}&role=neq.admin`, {
      method: "DELETE",
    });

    await restRequest(env, `clients?manager_id=eq.${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
