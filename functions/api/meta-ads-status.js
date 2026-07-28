import { restRequest } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin"]);
  if (session instanceof Response) return session;
  try {
    const [pages, accounts, leads] = await Promise.all([
      restRequest(env, "social_channels", {
        query: {
          select: "id,display_name,external_account_id,status,last_error,health_checked_at,token_expires_at",
          platform: "eq.meta_ads",
          order: "created_at.desc",
        },
      }),
      restRequest(env, "meta_ad_accounts", {
        query: {
          select: "id,display_name,external_account_id,account_status,currency,timezone_name,status,updated_at",
          order: "updated_at.desc",
        },
      }),
      restRequest(env, "meta_ad_leads", {
        query: {
          select: "processing_status,campaign_name,provider_created_at,created_at",
          order: "created_at.desc",
          limit: "500",
        },
      }),
    ]);
    const leadRows = Array.isArray(leads) ? leads : [];
    return Response.json({
      success: true,
      pages: Array.isArray(pages) ? pages : [],
      ad_accounts: Array.isArray(accounts) ? accounts : [],
      leads: {
        total_recent: leadRows.length,
        completed: leadRows.filter((lead) => lead.processing_status === "completed").length,
        errors: leadRows.filter((lead) => lead.processing_status === "error").length,
        last_received_at: leadRows[0]?.provider_created_at || leadRows[0]?.created_at || null,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({
      success: false,
      error: "meta_ads_status_failed",
      detail: String(error?.message || "").slice(0, 300),
    }, { status: 500 });
  }
}
