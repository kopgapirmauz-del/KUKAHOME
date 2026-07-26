import {
  first,
  listStores,
  restRequest,
  storageDownload,
  storageList,
  storageRemove,
  storageUpload,
} from "./_supabase.js";
import { requireAuth } from "./_auth.js";

const BUCKET = "crm-data-private";
const PREFIX = "pipeline";
const STAGES = new Set([
  "new",
  "contacted",
  "consultation",
  "measurement",
  "proposal",
  "decision",
  "won",
  "lost",
]);
const TEMPERATURES = new Set(["hot", "warm", "cold"]);
const CURRENCIES = new Set(["UZS", "USD"]);
const PIPELINE_ROLES = ["admin", "manager"];

function safeClientId(value) {
  const id = String(value || "").trim();
  return /^[A-Za-z0-9_-]{1,120}$/.test(id) ? id : "";
}

function objectPath(clientId) {
  return `${PREFIX}/${safeClientId(clientId)}.json`;
}

function listedObjectPath(value) {
  const name = String(value || "").trim().replace(/^\/+/, "");
  return name.startsWith(`${PREFIX}/`) ? name : `${PREFIX}/${name}`;
}

function cleanText(value, max = 2000) {
  return String(value || "").trim().slice(0, max);
}

function cleanDateTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function cleanMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number >= 0 ? Math.min(number, 1_000_000_000_000) : 0;
}

function normalizePipelineInput(data) {
  const stage = String(data?.stage || "new").trim().toLowerCase();
  const temperature = String(data?.temperature || "warm").trim().toLowerCase();
  const currency = String(data?.currency || "UZS").trim().toUpperCase();
  return {
    stage: STAGES.has(stage) ? stage : "new",
    temperature: TEMPERATURES.has(temperature) ? temperature : "warm",
    nextActionAt: cleanDateTime(data?.nextActionAt),
    lastContactAt: cleanDateTime(data?.lastContactAt),
    estimatedValue: cleanMoney(data?.estimatedValue),
    currency: CURRENCIES.has(currency) ? currency : "UZS",
    note: cleanText(data?.note),
    lostReason: cleanText(data?.lostReason, 500),
  };
}

// Returns null only when the object genuinely does not exist - storageDownload
// maps a 404 to null and throws on anything else. The previous catch-all made
// "no such record" and "storage returned 500" indistinguishable, and callers
// treat null as absent: during a transient Supabase outage the POST handler
// skipped its version check entirely and wrote as a create, resetting
// createdAt, discarding the whole history array and overwriting a concurrent
// edit while reporting created: true. Let the failure reach the handler so it
// answers with an error instead of silently overwriting.
async function readPipelineItem(env, clientId) {
  const file = await storageDownload(env, BUCKET, objectPath(clientId));
  if (!file) return null;
  const item = await file.json();
  return item && typeof item === "object" ? item : null;
}

async function listPipelineItems(env) {
  const objects = await storageList(env, BUCKET, PREFIX);
  const names = objects
    .map((item) => String(item?.name || ""))
    .filter((name) => name.endsWith(".json"));
  const items = [];
  for (let index = 0; index < names.length; index += 20) {
    const batch = names.slice(index, index + 20);
    const settled = await Promise.allSettled(batch.map(async (name) => {
      const file = await storageDownload(env, BUCKET, listedObjectPath(name));
      if (!file) return null;
      const item = await file.json();
      return item && typeof item === "object" ? item : null;
    }));
    settled.forEach((result) => {
      if (result.status === "fulfilled" && result.value?.clientId) items.push(result.value);
    });
  }
  return items;
}

async function listUsers(env) {
  const rows = await restRequest(env, "users", {
    query: { select: "id,full_name,login,role,store_id" },
  });
  return Array.isArray(rows) ? rows : [];
}

async function listClientsByIds(env, ids) {
  const unique = [...new Set(ids.map(safeClientId).filter(Boolean))];
  const rows = [];
  for (let index = 0; index < unique.length; index += 100) {
    const batch = unique.slice(index, index + 100);
    const chunk = await restRequest(env, "clients", {
      query: {
        select: "id,date,store_id,manager_id,phone,source,interest,note,status,price,currency,result,created_at",
        id: `in.(${batch.join(",")})`,
      },
    });
    if (Array.isArray(chunk)) rows.push(...chunk);
  }
  return rows;
}

async function getClient(env, clientId) {
  return restRequest(env, "clients", {
    query: {
      select: "id,date,store_id,manager_id,phone,source,interest,note,status,price,currency,result,created_at",
      id: `eq.${clientId}`,
      limit: "1",
    },
  }).then(first);
}

function canAccessClient(session, client) {
  if (!client) return false;
  if (session.role === "admin") return true;
  return String(client.manager_id || "") === String(session.uid || "");
}

function presentItem(item, client, storeById, userById) {
  const manager = userById.get(String(client.manager_id || ""));
  const store = storeById.get(String(client.store_id || ""));
  return {
    clientId: String(client.id),
    stage: STAGES.has(String(item.stage || "")) ? item.stage : "new",
    temperature: TEMPERATURES.has(String(item.temperature || "")) ? item.temperature : "warm",
    nextActionAt: String(item.nextActionAt || ""),
    lastContactAt: String(item.lastContactAt || ""),
    estimatedValue: cleanMoney(item.estimatedValue),
    currency: CURRENCIES.has(String(item.currency || "")) ? item.currency : "UZS",
    note: String(item.note || ""),
    lostReason: String(item.lostReason || ""),
    createdAt: String(item.createdAt || ""),
    updatedAt: String(item.updatedAt || ""),
    updatedBy: String(item.updatedBy || ""),
    history: Array.isArray(item.history) ? item.history.slice(-50) : [],
    client: {
      contact: String(client.phone || ""),
      interest: String(client.interest || ""),
      note: String(client.note || ""),
      source: String(client.source || ""),
      status: String(client.status || ""),
      result: String(client.result || ""),
      price: cleanMoney(client.price),
      currency: CURRENCIES.has(String(client.currency || "")) ? client.currency : "UZS",
      date: String(client.date || ""),
      createdAt: String(client.created_at || ""),
      managerId: String(client.manager_id || ""),
      managerName: String(manager?.full_name || ""),
      storeId: String(client.store_id || ""),
      storeName: String(store?.name || ""),
    },
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, PIPELINE_ROLES);
  if (session instanceof Response) return session;

  try {
    const requestedId = safeClientId(new URL(request.url).searchParams.get("client_id"));
    const pipelineItems = requestedId
      ? [await readPipelineItem(env, requestedId)].filter(Boolean)
      : await listPipelineItems(env);
    if (!pipelineItems.length) return Response.json({ success: true, items: [] });

    const [clients, stores, users] = await Promise.all([
      listClientsByIds(env, pipelineItems.map((item) => item.clientId)),
      listStores(env),
      listUsers(env),
    ]);
    const clientById = new Map(clients.map((client) => [String(client.id), client]));
    const storeById = new Map(stores.map((store) => [String(store.id), store]));
    const userById = new Map(users.map((user) => [String(user.id), user]));

    const items = pipelineItems
      .map((item) => {
        const client = clientById.get(String(item.clientId || ""));
        return canAccessClient(session, client) ? presentItem(item, client, storeById, userById) : null;
      })
      .filter(Boolean)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return Response.json({ success: true, items }, {
      headers: {
        "Cache-Control": "no-store",
        "X-CRM-Pipeline-Version": "20260724-v1",
      },
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: "pipeline_load_failed",
      detail: cleanText(error?.message, 300),
    }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, PIPELINE_ROLES);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const clientId = safeClientId(data?.clientId);
    if (!clientId) return Response.json({ success: false, error: "invalid_client" }, { status: 400 });
    const client = await getClient(env, clientId);
    if (!canAccessClient(session, client)) {
      return Response.json({ success: false, error: "forbidden" }, { status: client ? 403 : 404 });
    }

    const existing = await readPipelineItem(env, clientId);
    const expectedVersion = String(data?.version || "");
    if (existing && expectedVersion !== String(existing.updatedAt || "")) {
      return Response.json({ success: false, error: "version_conflict" }, { status: 409 });
    }

    const next = normalizePipelineInput(data);
    const now = new Date().toISOString();
    const history = Array.isArray(existing?.history) ? existing.history.slice(-49) : [];
    const stageChanged = !existing || String(existing.stage || "") !== next.stage;
    if (stageChanged) {
      history.push({
        from: existing ? String(existing.stage || "new") : "",
        to: next.stage,
        at: now,
        by: String(session.login || ""),
      });
    }

    const item = {
      clientId,
      ...next,
      createdAt: String(existing?.createdAt || now),
      updatedAt: now,
      updatedBy: String(session.login || ""),
      history,
    };
    await storageUpload(
      env,
      BUCKET,
      objectPath(clientId),
      new TextEncoder().encode(JSON.stringify(item)),
      "application/json",
    );
    return Response.json({ success: true, item, created: !existing });
  } catch (error) {
    return Response.json({
      success: false,
      error: "pipeline_save_failed",
      detail: cleanText(error?.message, 300),
    }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, PIPELINE_ROLES);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const clientId = safeClientId(data?.clientId);
    if (!clientId) return Response.json({ success: false, error: "invalid_client" }, { status: 400 });
    const client = await getClient(env, clientId);
    if (!canAccessClient(session, client)) {
      return Response.json({ success: false, error: "forbidden" }, { status: client ? 403 : 404 });
    }
    const existing = await readPipelineItem(env, clientId);
    if (!existing) {
      return Response.json({ success: false, error: "pipeline_item_not_found" }, { status: 404 });
    }
    const expectedVersion = String(data?.version || "");
    if (expectedVersion !== String(existing.updatedAt || "")) {
      return Response.json({ success: false, error: "version_conflict" }, { status: 409 });
    }
    await storageRemove(env, BUCKET, [objectPath(clientId)]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({
      success: false,
      error: "pipeline_delete_failed",
      detail: cleanText(error?.message, 300),
    }, { status: 500 });
  }
}
