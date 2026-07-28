import { restRequest, storageRemove } from "./_supabase.js";

const WARRANTY_BUCKET = "crm-private";

export function asWarrantyString(value) {
  return String(value || "").trim();
}
export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(asWarrantyString(value));
}

export function tashkentToday() {
  return new Date(Date.now() + (5 * 60 * 60 * 1000)).toISOString().slice(0, 10);
}

export function isWarrantyExpired(row, today = tashkentToday()) {
  const endDate = asWarrantyString(row?.warranty_end_date || row?.warrantyEndDate).slice(0, 10);
  return Boolean(endDate && endDate < today);
}

// Same rule as sales-check-file.js: a stored ticket is always a flat name
// under sales-checks/, so anything carrying a path separator or a relative
// segment is rejected rather than used to address an arbitrary object.
export function warrantyObjectPath(fileName) {
  const clean = asWarrantyString(fileName);
  if (!clean || clean.length > 200) return "";
  if (!/^[A-Za-z0-9_.-]+$/.test(clean)) return "";
  if (clean.includes("..")) return "";
  return `sales-checks/${clean}`;
}

export async function removeWarrantyFile(env, fileName) {
  const objectPath = warrantyObjectPath(fileName);
  if (!objectPath) return false;
  try {
    await storageRemove(env, WARRANTY_BUCKET, [objectPath]);
    return true;
  } catch {
    // A missing object must not keep an expired database record alive.
    return false;
  }
}

export async function removeWarrantyRecord(env, row) {
  const id = asWarrantyString(row?.id);
  if (!id) return false;
  await removeWarrantyFile(env, row?.ticket_file_name);
  await restRequest(env, "warranty_tickets", {
    method: "DELETE",
    query: { id: `eq.${id}` },
  });
  return true;
}

export async function cleanupExpiredWarrantyTickets(env, today = tashkentToday()) {
  const rows = await restRequest(env, "warranty_tickets", {
    query: {
      select: "id,ticket_file_name,warranty_end_date",
      warranty_end_date: `lt.${today}`,
    },
  });
  const expired = Array.isArray(rows) ? rows : [];
  if (!expired.length) return 0;

  await Promise.all(expired.map((row) => removeWarrantyFile(env, row.ticket_file_name)));
  await restRequest(env, "warranty_tickets", {
    method: "DELETE",
    query: { warranty_end_date: `lt.${today}` },
  });
  return expired.length;
}
