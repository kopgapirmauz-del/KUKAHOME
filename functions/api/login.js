import { first, listStores, normalizeRole, restRequest } from "./_supabase.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const login = String(data?.login || "").trim();
    const password = String(data?.password || "").trim();
    if (!login || !password) return Response.json({ success: false }, { status: 400 });

    let rows;
    try {
      rows = await restRequest(env, "users", {
        query: {
          select: "id,full_name,login,password_hash,role,store_id,phone,created_at",
          login: `eq.${login}`,
          limit: "1",
        },
      });
    } catch {
      rows = await restRequest(env, "users", {
        query: {
          select: "id,full_name,login,password_hash,role,store_id,created_at",
          login: `eq.${login}`,
          limit: "1",
        },
      });
    }
    const row = first(rows);
    if (!row || String(row.password_hash || "") !== password) {
      return Response.json({ success: false });
    }

    const stores = await listStores(env);
    const storeName = stores.find((s) => s.id === row.store_id)?.name || "";

    return Response.json({
      success: true,
      user: {
        id: row.id,
        full_name: row.full_name || "",
        login: row.login || "",
        password,
        role: normalizeRole(row.role),
        phone: String(row.phone || ""),
        showroom: storeName,
        created_at: row.created_at || null,
      },
    });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
