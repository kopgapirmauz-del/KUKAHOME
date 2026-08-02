import { restRequest, first } from "./_supabase.js";
import { requireAuth } from "./_auth.js";
import { syncAttendanceFromSheet } from "./_attendance.js";

const SYNC_COOLDOWN_MS = 60 * 1000;
let lastSyncAt = 0;

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "hr", "director"]);
  if (session instanceof Response) return session;

  try {
    const channel = await restRequest(env, "social_channels", {
      query: { select: "*", platform: "eq.google_sheets", status: "eq.connected", limit: "1" },
    }).then(first);

    let syncError = "";
    if (channel && Date.now() - lastSyncAt > SYNC_COOLDOWN_MS) {
      lastSyncAt = Date.now();
      try {
        await syncAttendanceFromSheet(env, channel);
        await restRequest(env, `social_channels?id=eq.${channel.id}`, {
          method: "PATCH",
          body: { last_error: null, health_checked_at: new Date().toISOString() },
        });
      } catch (err) {
        syncError = String(err?.message || "sync_failed");
        await restRequest(env, `social_channels?id=eq.${channel.id}`, {
          method: "PATCH",
          body: { last_error: syncError },
        }).catch(() => {});
      }
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const query = { select: "user_id,telegram_id,work_date,check_in,check_out", order: "work_date.desc", limit: "2000" };
    if (from) query.work_date = `gte.${from}`;
    if (to) query.work_date = query.work_date ? `${query.work_date}` : undefined;

    const rows = await restRequest(env, "attendance", { query });
    let items = Array.isArray(rows) ? rows : [];
    if (from) items = items.filter((r) => r.work_date >= from);
    if (to) items = items.filter((r) => r.work_date <= to);

    return Response.json({
      success: true,
      connected: Boolean(channel),
      sync_error: syncError,
      items,
    });
  } catch {
    return Response.json({ success: false, items: [] }, { status: 500 });
  }
}
