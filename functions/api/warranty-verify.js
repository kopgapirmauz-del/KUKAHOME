import { restRequest } from "./_supabase.js";
import {
  asWarrantyString,
  isUuid,
  isWarrantyExpired,
  removeWarrantyRecord,
} from "./_warranty.js";

function publicTicket(row) {
  const formData = row?.form_data && typeof row.form_data === "object" ? row.form_data : {};
  return {
    status: "valid",
    ticketNo: Number(row?.ticket_no || 0),
    productName: asWarrantyString(formData.productName),
    modelNo: asWarrantyString(formData.modelNo),
    barcode: asWarrantyString(formData.barcode),
    saleDate: asWarrantyString(row?.sale_date || formData.saleDate),
    warrantyStartDate: asWarrantyString(row?.warranty_start_date || formData.warrantyStartDate),
    warrantyEndDate: asWarrantyString(row?.warranty_end_date || formData.warrantyEndDate),
    warrantyTerm: asWarrantyString(formData.warrantyTerm),
    sellerOrg: asWarrantyString(formData.sellerOrg || formData.storeName),
  };
}
function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const id = asWarrantyString(new URL(request.url).searchParams.get("id"));
  if (!isUuid(id)) return json({ status: "invalid", error: "invalid_ticket_id" }, 400);

  try {
    const rows = await restRequest(env, "warranty_tickets", {
      query: {
        select: "id,ticket_no,sale_date,warranty_start_date,warranty_end_date,ticket_file_name,form_data",
        id: `eq.${id}`,
        limit: "1",
      },
    });
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!row) return json({ status: "not_found", error: "ticket_not_found" }, 404);

    if (isWarrantyExpired(row)) {
      await removeWarrantyRecord(env, row);
      return json({
        status: "expired",
        ticketNo: Number(row.ticket_no || 0),
        warrantyEndDate: asWarrantyString(row.warranty_end_date),
      }, 410);
    }

    return json(publicTicket(row));
  } catch {
    return json({ status: "unavailable", error: "verification_unavailable" }, 503);
  }
}
