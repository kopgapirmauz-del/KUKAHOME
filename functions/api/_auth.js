import { getServiceRoleKey, restRequest } from "./_supabase.js";

// ---------------------------------------------------------------------------
// Stateless, signed session tokens (HMAC-SHA256) for the CRM API.
//
// Why this design:
// - Cloudflare Pages Functions are stateless edge workers; we avoid needing a
//   separate sessions table by signing a small JSON payload with a secret key
//   derived from the existing SUPABASE_SERVICE_ROLE_KEY (never sent to the
//   client, never logged). This means no new secret has to be configured.
// - Every protected endpoint verifies the token itself; nothing trusts
//   client-supplied "role" or "login" query/body params anymore.
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

let cachedKeyPromise = null;

async function getSigningKey(env) {
  if (!cachedKeyPromise) {
    cachedKeyPromise = (async () => {
      const material = `${getServiceRoleKey(env)}::crm-session::v1`;
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
      return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
    })();
  }
  return cachedKeyPromise;
}

function toBase64Url(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function createSessionToken(env, user) {
  const payload = {
    uid: String(user.id),
    login: String(user.login || ""),
    role: String(user.role || "manager"),
    storeId: user.store_id || null,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getSigningKey(env);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const sig = toBase64Url(sigBuf);
  return `${body}.${sig}`;
}

export async function verifySessionToken(env, token) {
  try {
    const raw = String(token || "");
    const dot = raw.lastIndexOf(".");
    if (dot < 1) return null;
    const body = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const key = await getSigningKey(env);
    const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(sig), new TextEncoder().encode(body));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (!payload?.exp || Date.now() > Number(payload.exp)) return null;
    if (!payload?.uid) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractToken(request) {
  const header = request.headers.get("Authorization") || request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

/**
 * Verifies the caller's session. Returns the verified payload ({uid, login, role, storeId})
 * or null if there is no valid session.
 */
export async function getSession(request, env) {
  const token = extractToken(request);
  if (!token) return null;
  return verifySessionToken(env, token);
}

/**
 * Use at the top of any protected handler:
 *   const session = await requireAuth(request, env);
 *   if (session instanceof Response) return session; // not authenticated
 *
 * Pass allowedRoles (e.g. ["admin"]) to also enforce role-based access.
 */
export async function requireAuth(request, env, allowedRoles = null) {
  let session = await getSession(request, env);
  if (!session) {
    return Response.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const rows = await restRequest(env, "users", {
      query: {
        select: "id,login,role,store_id",
        id: `eq.${session.uid}`,
        limit: "1",
      },
    });
    const current = (Array.isArray(rows) ? rows : [])
      .find((row) => String(row?.id || "") === String(session.uid || ""));
    if (!current) {
      return Response.json({ success: false, error: "session_user_not_found" }, { status: 401 });
    }
    session = {
      ...session,
      login: String(current.login || ""),
      role: String(current.role || "manager"),
      storeId: current.store_id || null,
    };
  } catch {
    return Response.json({ success: false, error: "session_verification_failed" }, { status: 503 });
  }
  if (Array.isArray(allowedRoles) && allowedRoles.length && !allowedRoles.includes(session.role)) {
    return Response.json({ success: false, error: "forbidden" }, { status: 403 });
  }
  return session;
}
