import { storageDownload, storageUpload } from "./_supabase.js";
import { requireAuth } from "./_auth.js";
import {
  normalizeDbShape,
  removeCredentialMaterial,
  SNAPSHOT_BUCKET,
  SNAPSHOT_PATH,
  syncWarehouseTables,
} from "./db.js";

function cleanOrder(order) {
  if (!order || typeof order !== "object") return null;
  const safe = { ...order };
  delete safe.listOpen;
  delete safe.search;
  safe.id = String(safe.id || "");
  safe.stageKey = String(safe.stageKey || "from_china");
  safe.eta = String(safe.eta || "");
  safe.items = (Array.isArray(safe.items) ? safe.items : [])
    .filter((item) => item && typeof item === "object")
    .map((item) => ({ ...item }));
  return safe.id ? safe : null;
}

function cleanStock(row) {
  if (!row || typeof row !== "object") return null;
  const safe = { ...row };
  safe.id = String(safe.id || "");
  return safe.id ? safe : null;
}

function warehousePayload(raw) {
  return {
    warehouseOrders: (Array.isArray(raw?.warehouseOrders) ? raw.warehouseOrders : [])
      .map(cleanOrder)
      .filter(Boolean),
    warehouseStock: (Array.isArray(raw?.warehouseStock) ? raw.warehouseStock : [])
      .map(cleanStock)
      .filter(Boolean),
  };
}

function expectedVersion(request) {
  return String(request.headers.get("If-Match") || "")
    .replace(/^W\//, "")
    .replace(/^"|"$/g, "");
}

async function readSnapshot(env) {
  const file = await storageDownload(env, SNAPSHOT_BUCKET, SNAPSHOT_PATH);
  if (!file) throw new Error("snapshot_missing");
  return removeCredentialMaterial(normalizeDbShape(await file.json()));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  try {
    const snapshot = await readSnapshot(env);
    const warehouse = warehousePayload(snapshot);
    return Response.json({
      success: true,
      ...warehouse,
      version: String(snapshot.meta?.warehouseVersion || snapshot.meta?.updatedAt || ""),
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ success: false, error: "warehouse_load_failed" }, { status: 503 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "skladchi", "director"]);
  if (session instanceof Response) return session;

  let raw;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ success: false, error: "invalid_json" }, { status: 400 });
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return Response.json({ success: false, error: "invalid_warehouse_state" }, { status: 400 });
  }

  try {
    const snapshot = await readSnapshot(env);
    // Version-checked against its own field, not the whole-snapshot
    // meta.updatedAt - that one is bumped by every unrelated save (a client
    // edit, a read notification, the login counter), which would otherwise
    // make ordinary warehouse writes fail with a false-positive conflict any
    // time something else in the CRM was saved in between the GET and PUT.
    const currentVersion = String(snapshot.meta?.warehouseVersion || snapshot.meta?.updatedAt || "");
    const requestedVersion = expectedVersion(request);
    if (currentVersion && !requestedVersion) {
      return Response.json({
        success: false,
        error: "snapshot_version_required",
        currentVersion,
      }, { status: 428 });
    }
    if (currentVersion && currentVersion !== requestedVersion) {
      return Response.json({
        success: false,
        error: "snapshot_version_conflict",
        currentVersion,
      }, { status: 409 });
    }

    const warehouse = warehousePayload(raw);
    const version = new Date().toISOString();
    snapshot.warehouseOrders = warehouse.warehouseOrders;
    snapshot.warehouseStock = warehouse.warehouseStock;
    snapshot.meta.warehouseVersion = version;
    snapshot.meta.updatedAt = version;
    snapshot.meta.remoteVersion = version;
    snapshot.meta.extendedDataVersion = version;
    snapshot.meta.extendedDataMirroredAt = "";
    await storageUpload(
      env,
      SNAPSHOT_BUCKET,
      SNAPSHOT_PATH,
      new TextEncoder().encode(JSON.stringify(snapshot)),
      "application/json",
    );

    // The private snapshot is already durable. Mirror relational warehouse
    // tables after the response, without a second snapshot upload that could
    // race with a newer writer and restore stale data.
    const mirror = syncWarehouseTables(env, snapshot).catch(() => {});
    if (typeof context.waitUntil === "function") context.waitUntil(mirror);
    return Response.json({ success: true, version });
  } catch (error) {
    const detail = String(error?.message || "warehouse_write_failed").slice(0, 300);
    return Response.json({
      success: false,
      error: "warehouse_write_failed",
      detail,
    }, { status: 503 });
  }
}
