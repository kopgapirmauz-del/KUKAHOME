function getEnv(name, env) {
  const value = env?.[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return String(value);
}

export function getSupabaseUrl(env) {
  return getEnv("SUPABASE_URL", env);
}

export function getServiceRoleKey(env) {
  return getEnv("SUPABASE_SERVICE_ROLE_KEY", env);
}

function makeUrl(env, resource, query) {
  const base = getSupabaseUrl(env);
  const url = new URL(`/rest/v1/${resource}`, base);
  const entries = query ? Object.entries(query) : [];
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

export async function restRequest(env, resource, options = {}) {
  const key = getServiceRoleKey(env);
  const {
    method = "GET",
    query,
    body,
    prefer,
  } = options;

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
  if (prefer) headers.Prefer = prefer;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(makeUrl(env, resource, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${resource} failed: ${res.status} ${text}`);
  }

  if (res.status === 204) return null;
  const ct = String(res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) return null;
  return await res.json();
}

export function first(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export function toBool(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "t" || v === "yes";
}

export async function listStores(env) {
  const rows = await restRequest(env, "stores", {
    query: { select: "id,name", order: "name.asc" },
  });
  return Array.isArray(rows) ? rows : [];
}

export async function findStoreByName(env, name) {
  const target = String(name || "").trim().toLowerCase();
  if (!target) return null;
  const stores = await listStores(env);
  return stores.find((s) => String(s.name || "").trim().toLowerCase() === target) || null;
}

export async function ensureStoreByName(env, name) {
  const normalized = String(name || "").trim();
  if (!normalized) return null;
  const existing = await findStoreByName(env, normalized);
  if (existing) return existing;

  const inserted = await restRequest(env, "stores", {
    method: "POST",
    body: { name: normalized },
    prefer: "return=representation",
  });
  return first(inserted);
}

export function normalizeRole(role) {
  const r = String(role || "manager").trim().toLowerCase();
  if (["admin", "manager", "hr", "cashier", "skladchi"].includes(r)) return r;
  return "manager";
}

function storageObjectUrl(env, bucket, objectPath) {
  const base = getSupabaseUrl(env);
  const safePath = String(objectPath || "").split("/").map(encodeURIComponent).join("/");
  return new URL(`/storage/v1/object/${encodeURIComponent(bucket)}/${safePath}`, base);
}

export async function storageUpload(env, bucket, objectPath, bytes, contentType) {
  const key = getServiceRoleKey(env);
  const res = await fetch(storageObjectUrl(env, bucket, objectPath), {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase storage upload failed: ${res.status} ${text}`);
  }
  return true;
}

export async function storageDownload(env, bucket, objectPath) {
  const key = getServiceRoleKey(env);
  const res = await fetch(storageObjectUrl(env, bucket, objectPath), {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase storage download failed: ${res.status} ${text}`);
  }
  return res;
}

export async function storageRemove(env, bucket, objectPaths) {
  const key = getServiceRoleKey(env);
  const list = Array.isArray(objectPaths) ? objectPaths : [objectPaths];
  const res = await fetch(new URL(`/storage/v1/object/${encodeURIComponent(bucket)}`, getSupabaseUrl(env)), {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: list.map((x) => String(x || "")).filter(Boolean) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase storage remove failed: ${res.status} ${text}`);
  }
  return true;
}
