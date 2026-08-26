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

// Fallback for deployments whose database still has the pre-2026-08 verify_login
// (bcrypt-only, so a row whose password_hash is still plaintext never matched).
// The current verify_login handles legacy rows itself, so this only runs when
// the RPC is unavailable. Deliberately an exact login match: PostgREST's
// `ilike` treats %, _ and * as wildcards, which would turn a crafted login into
// "match any user".
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
  // to bcrypt without a bulk password reset. Best effort only - a failed
  // upgrade must not turn a valid password into a login error.
  try {
    await restRequest(env, "rpc/set_user_password", {
      method: "POST",
      body: { p_user_id: legacy.id, p_new_password: password },
    });
  } catch {
    // keep the plaintext row; the next successful login retries the upgrade
  }
  delete legacy.password_hash;
  return legacy;
}

async function resolveStoreName(env, storeId) {
  if (!storeId) return "";
  // Never fatal: the showroom label is cosmetic, and a transient failure here
  // used to fail the whole login with a 500, which the UI showed as
  // "login yoki parol noto'g'ri" even though the password was correct.
  try {
    const stores = await restRequest(env, "stores", { query: { select: "id,name" } });
    return (Array.isArray(stores) ? stores : []).find((s) => s.id === storeId)?.name || "";
  } catch {
    return "";
  }
}

export async function onRequestGet() {
  return Response.json({ success: false, error: "method_not_allowed", hint: "Use POST /api/login" }, { status: 405 });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data = null;
  try {
    data = await request.json();
  } catch {
    return Response.json({ success: false, error: "invalid_request" }, { status: 400 });
  }

  // Trim on the way in: a mobile keyboard or a copy-paste routinely appends a
  // space, and the same trimming is applied wherever a password is stored
  // (managers.js, profile.js), so the two sides stay symmetric.
  const login = String(data?.login || "").trim();
  const password = String(data?.password || "").trim();
  if (!login || !password) {
    return Response.json({ success: false, error: "missing_credentials" }, { status: 400 });
  }

  // Password is verified inside Postgres via bcrypt (pgcrypto). The plaintext
  // password is only ever sent over HTTPS to this one RPC call - it is never
  // compared or stored in application code.
  let row = null;
  let backendFailed = false;
  try {
    const rows = await restRequest(env, "rpc/verify_login", {
      method: "POST",
      body: { p_login: login, p_password: password },
    });
    row = first(rows);
  } catch {
    backendFailed = true;
  }

  if (!row) {
    try {
      row = await migrateLegacyLogin(env, login, password);
    } catch {
      backendFailed = true;
    }
  }

  if (!row) {
    // A database/config outage must not be reported as a wrong password -
    // that is what made a correct password look rejected and sent users
    // resetting credentials that were never the problem.
    if (backendFailed) {
      return Response.json({ success: false, error: "login_unavailable" }, { status: 503 });
    }
    // Otherwise: same response whether the login doesn't exist or the password
    // is wrong, so callers can't enumerate valid usernames.
    return Response.json({ success: false, error: "invalid_credentials" });
  }

  try {
    const user = {
      id: row.id,
      full_name: row.full_name || "",
      login: row.login || "",
      role: row.role || "manager",
      phone: String(row.phone || ""),
      showroom: await resolveStoreName(env, row.store_id),
      store_id: row.store_id || null,
      created_at: row.created_at || null,
    };

    const token = await createSessionToken(env, user);

    return Response.json({ success: true, token, user });
  } catch {
    return Response.json({ success: false, error: "login_unavailable" }, { status: 503 });
  }
}
