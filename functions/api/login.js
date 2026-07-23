import { restRequest } from "./_supabase.js";
import { createSessionToken } from "./_auth.js";

export async function onRequestGet() {
  return Response.json({ success: false, error: "method_not_allowed", hint: "Use POST /api/login" }, { status: 405 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const login = String(data?.login || "").trim();
    const password = String(data?.password || "").trim();
    if (!login || !password) return Response.json({ success: false }, { status: 400 });

    // Password is verified inside Postgres via bcrypt (pgcrypto). The plaintext
    // password is only ever sent over HTTPS to this one RPC call - it is never
    // compared or stored in application code.
    const rows = await restRequest(env, "rpc/verify_login", {
      method: "POST",
      body: { p_login: login, p_password: password },
    });
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!row) {
      // Same response whether the login doesn't exist or the password is wrong,
      // so callers can't enumerate valid usernames.
      return Response.json({ success: false });
    }

    const stores = await restRequest(env, "stores", { query: { select: "id,name" } });
    const storeName = (Array.isArray(stores) ? stores : []).find((s) => s.id === row.store_id)?.name || "";

    const user = {
      id: row.id,
      full_name: row.full_name || "",
      login: row.login || "",
      role: row.role || "manager",
      phone: String(row.phone || ""),
      showroom: storeName,
      store_id: row.store_id || null,
      created_at: row.created_at || null,
    };

    const token = await createSessionToken(env, user);

    return Response.json({ success: true, token, user });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
