import { restRequest, storageRemove } from "./_supabase.js";

const BUCKET = "crm-private";

function asString(v) {
  return String(v || "").trim();
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
  const { env } = context;
  try {
    const rows = await restRequest(env, "warranty_tickets", {
      query: {
        select: "id,ticket_no,store_id,manager_id,sale_date,warranty_start_date,warranty_end_date,ticket_url,ticket_data_url,ticket_file_name,form_data,created_at,updated_at",
        order: "created_at.desc",
      },
    });
    return Response.json({ success: true, items: (Array.isArray(rows) ? rows : []).map(mapOut) });
  } catch {
    return Response.json({ success: true, items: [] });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const body = normalizeBody(data);
    if (!body.store_id || !body.manager_id || !body.sale_date || !body.warranty_start_date || !body.warranty_end_date) {
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
  try {
    const data = await request.json();
    const id = asString(data?.id);
    if (!id) return Response.json({ success: false, error: "missing_id" }, { status: 400 });
    const body = normalizeBody(data);
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
  try {
    const data = await request.json();
    const id = asString(data?.id);
    if (!id) return Response.json({ success: false, error: "missing_id" }, { status: 400 });

    const existing = await restRequest(env, "warranty_tickets", {
      query: {
        select: "id,ticket_file_name",
        id: `eq.${id}`,
        limit: "1",
      },
    });
    const row = Array.isArray(existing) && existing.length ? existing[0] : null;
    const fileName = asString(row?.ticket_file_name);
    if (fileName) {
      const objectPath = fileName.includes("/") ? fileName.replace(/^\/+/, "") : `sales-checks/${fileName}`;
      try {
        await storageRemove(env, BUCKET, [objectPath]);
      } catch {
        // continue removing DB row even if storage file is missing
      }
    }

    await restRequest(env, "warranty_tickets", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
