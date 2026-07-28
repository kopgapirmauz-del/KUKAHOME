import { first, restRequest } from "./_supabase.js";
import { createSessionToken } from "./_auth.js";

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
}

async function secretsMatch(left, right) {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(String(left || ""))),
    crypto.subtle.digest("SHA-256", encoder.encode(String(right || ""))),
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    diff |= (a[i] || 0) ^ (b[i] || 0);
  }
  return diff === 0;
}

async function migrateLegacyLogin(env, login, password) {
  const legacy = await restRequest(env, "users", {
    query: {
      select: "id,full_name,login,password_hash,role,store_id,phone,created_at",
      login: `eq.${login}`,
      limit: "1",
    },
  }).then(first);
  if (!legacy || isBcryptHash(legacy.password_hash)) return null;
  if (!(await secretsMatch(legacy.password_hash, password))) return null;

  // Upgrade the matched legacy plaintext exactly once before issuing a
  // session. Existing CRM users can keep logging in while the database moves
  // to bcrypt without a bulk password reset.
  await restRequest(env, "rpc/set_user_password", {
    method: "POST",
    body: { p_user_id: legacy.id, p_new_password: password },
  });
  delete legacy.password_hash;
  return legacy;
}

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
    let rows = [];
    try {
      rows = await restRequest(env, "rpc/verify_login", {
        method: "POST",
        body: { p_login: login, p_password: password },
      });
    } catch {
      rows = [];
    }
    let row = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!row) row = await migrateLegacyLogin(env, login, password);
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
