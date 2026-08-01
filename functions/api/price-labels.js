import { restRequest } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asString(v) {
  return String(v ?? "").trim();
}

function isUuid(v) {
  return UUID_RE.test(asString(v));
}

function normalizeBody(data) {
  const discountMode = asString(data?.discountMode) === "with" ? "with" : "without";
  const costPrice = Number(data?.costPrice);
  const discountPrice = Number(data?.discountPrice);
  return {
    furniture_type: asString(data?.furnitureType),
    model: asString(data?.model),
    info: asString(data?.info),
    size: asString(data?.size),
    store_id: asString(data?.storeId).replace(/^store_/, "") || null,
    image_url: asString(data?.imageUrl),
    discount_mode: discountMode,
    cost_price: Number.isFinite(costPrice) ? costPrice : 0,
    discount_price: discountMode === "with" && Number.isFinite(discountPrice) ? discountPrice : null,
  };
}

function isValidBody(body) {
  return Boolean(
    body.furniture_type
      && body.model
      && body.cost_price >= 0
      && (body.discount_mode !== "with" || (body.discount_price !== null && body.discount_price >= 0)),
  );
}

function mapOut(row) {
  return {
    id: String(row.id || ""),
    imageUrl: String(row.image_url || ""),
    furnitureType: String(row.furniture_type || ""),
    model: String(row.model || ""),
    info: String(row.info || ""),
    size: String(row.size || ""),
    storeId: row.store_id ? `store_${row.store_id}` : "",
    discountMode: row.discount_mode === "with" ? "with" : "without",
    costPrice: row.cost_price != null ? String(row.cost_price) : "",
    discountPrice: row.discount_price != null ? String(row.discount_price) : "",
    createdBy: row.created_by ? `mgr_${row.created_by}` : "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  try {
    const rows = await restRequest(env, "price_labels", {
      query: {
        select: "id,image_url,furniture_type,model,info,size,store_id,discount_mode,cost_price,discount_price,created_by,created_at,updated_at",
        order: "created_at.desc",
      },
    });
    return Response.json({ success: true, items: (Array.isArray(rows) ? rows : []).map(mapOut) });
  } catch {
    return Response.json({ success: false, error: "price_labels_load_failed" }, { status: 503 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const body = normalizeBody(data);
    if (!isValidBody(body)) {
      return Response.json({ success: false, error: "invalid_payload" }, { status: 400 });
    }
    body.created_by = session.uid;
    const inserted = await restRequest(env, "price_labels", {
      method: "POST",
      body,
      prefer: "return=representation",
    });
    return Response.json({ success: true, item: mapOut(Array.isArray(inserted) ? inserted[0] : inserted || {}) });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const id = asString(data?.id);
    if (!isUuid(id)) return Response.json({ success: false, error: "invalid_label_id" }, { status: 400 });
    const body = normalizeBody(data);
    if (!isValidBody(body)) {
      return Response.json({ success: false, error: "invalid_payload" }, { status: 400 });
    }
    body.updated_at = new Date().toISOString();
    const updated = await restRequest(env, "price_labels", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body,
      prefer: "return=representation",
    });
    const row = Array.isArray(updated) ? updated[0] : updated;
    if (!row) return Response.json({ success: false, error: "label_not_found" }, { status: 404 });
    return Response.json({ success: true, item: mapOut(row) });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const id = asString(data?.id);
    if (!isUuid(id)) return Response.json({ success: false, error: "invalid_label_id" }, { status: 400 });
    await restRequest(env, "price_labels", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
