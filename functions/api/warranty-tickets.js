import { restRequest } from "./_supabase.js";
import { requireAuth } from "./_auth.js";
import {
  asWarrantyString,
  cleanupExpiredWarrantyTickets,
  isUuid,
  removeWarrantyRecord,
} from "./_warranty.js";

function asString(v) {
  return asWarrantyString(v);
}

function normalizeBody(data) {
  const formData = data?.formData && typeof data.formData === "object" ? data.formData : {};
  return {
    ticket_no: Math.max(1, Number(data?.ticketNo || 0) || 1),
    store_id: asString(data?.storeId).replace(/^store_/, "") || null,
    manager_id: asString(data?.managerId).replace(/^(mgr_|user_)/, "") || null,
    sale_date: asString(data?.saleDate) || null,
    warranty_start_date: asString(data?.warrantyStartDate) || null,
    warranty_end_date: asString(data?.warrantyEndDate) || null,
    ticket_url: asString(data?.ticketUrl),
    ticket_data_url: asString(data?.ticketDataUrl),
    ticket_file_name: asString(data?.ticketFileName),
    form_data: {
      productName: asString(formData.productName),
      modelNo: asString(formData.modelNo),
      barcode: asString(formData.barcode),
      saleDate: asString(formData.saleDate),
      warrantyStartDate: asString(formData.warrantyStartDate),
      warrantyEndDate: asString(formData.warrantyEndDate),
      warrantyTerm: asString(formData.warrantyTerm),
      sellerOrg: asString(formData.sellerOrg),
      storeName: asString(formData.storeName),
      sellerName: asString(formData.sellerName),
    },
  };
}

function isDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(asString(value));
}

function isValidBody(body) {
  const form = body?.form_data || {};
  return Boolean(
    body?.store_id
      && body?.manager_id
      && isDateOnly(body.sale_date)
      && isDateOnly(body.warranty_start_date)
      && isDateOnly(body.warranty_end_date)
      && body.warranty_start_date <= body.warranty_end_date
      && asString(body.ticket_url).startsWith("/api/sales-check-file?file_name=")
      && /^warranty_ticket_[A-Za-z0-9_.-]+\.pdf$/.test(asString(body.ticket_file_name))
      && asString(form.productName)
      && asString(form.modelNo)
      && asString(form.barcode)
      && asString(form.warrantyTerm)
      && asString(form.sellerOrg)
  );
}

function mapOut(row) {
  return {
    id: String(row.id || ""),
    ticket_no: Number(row.ticket_no || 0),
    store_id: row.store_id ? `store_${row.store_id}` : "",
    manager_id: row.manager_id ? `mgr_${row.manager_id}` : "",
    sale_date: row.sale_date || "",
    warranty_start_date: row.warranty_start_date || "",
    warranty_end_date: row.warranty_end_date || "",
    ticket_url: String(row.ticket_url || ""),
    ticket_data_url: String(row.ticket_data_url || ""),
    ticket_file_name: String(row.ticket_file_name || ""),
    form_data: row.form_data && typeof row.form_data === "object" ? row.form_data : {},
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  // Every other verb in this file restricts roles, and DELETE enforces
  // row.manager_id === session.uid for managers, so per-manager ownership is
  // the intended model. The read path ignored both: any role - including hr
  // and skladchi, which cannot even create a ticket - received every ticket
  // for every showroom, with form_data and the full base64 PDF, plus the
  // ticket_file_name values needed to reach the stored objects directly.
  const session = await requireAuth(request, env, ["admin", "cashier", "manager", "director", "targetolog", "community_manager", "employee"]);
  if (session instanceof Response) return session;
  try {
    await cleanupExpiredWarrantyTickets(env);
    const query = {
      select: "id,ticket_no,store_id,manager_id,sale_date,warranty_start_date,warranty_end_date,ticket_url,ticket_data_url,ticket_file_name,form_data,created_at,updated_at",
      order: "created_at.desc",
    };
    if (session.role === "manager") query.manager_id = `eq.${session.uid}`;
    const rows = await restRequest(env, "warranty_tickets", { query });
    return Response.json({ success: true, items: (Array.isArray(rows) ? rows : []).map(mapOut) });
  } catch {
    return Response.json({ success: false, error: "warranty_load_failed" }, { status: 503 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "cashier", "manager", "director"]);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const body = normalizeBody(data);
    const id = asString(data?.id);
    if (!isUuid(id)) {
      return Response.json({ success: false, error: "invalid_ticket_id" }, { status: 400 });
    }
    body.id = id;
    if (session.role === "manager") {
      body.manager_id = asString(session.uid);
      body.store_id = asString(session.storeId);
    }
    if (!isValidBody(body)) {
      return Response.json({ success: false, error: "invalid_payload" }, { status: 400 });
    }
    const inserted = await restRequest(env, "warranty_tickets", {
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
  const session = await requireAuth(request, env, ["admin", "cashier", "director"]);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const id = asString(data?.id);
    if (!isUuid(id)) return Response.json({ success: false, error: "invalid_ticket_id" }, { status: 400 });
    const body = normalizeBody(data);
    if (!isValidBody(body)) {
      return Response.json({ success: false, error: "invalid_payload" }, { status: 400 });
    }
    const updated = await restRequest(env, "warranty_tickets", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      body,
      prefer: "return=representation",
    });
    return Response.json({ success: true, item: mapOut(Array.isArray(updated) ? updated[0] : updated || {}) });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "cashier", "manager", "director"]);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const id = asString(data?.id);
    if (!isUuid(id)) return Response.json({ success: false, error: "invalid_ticket_id" }, { status: 400 });

    const existing = await restRequest(env, "warranty_tickets", {
      query: {
        select: "id,ticket_file_name,manager_id",
        id: `eq.${id}`,
        limit: "1",
      },
    });
    const row = Array.isArray(existing) && existing.length ? existing[0] : null;
    if (!row) return Response.json({ success: false, error: "ticket_not_found" }, { status: 404 });
    if (session.role === "manager" && asString(row.manager_id) !== asString(session.uid)) {
      return Response.json({ success: false, error: "forbidden" }, { status: 403 });
    }
    await removeWarrantyRecord(env, row);
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
