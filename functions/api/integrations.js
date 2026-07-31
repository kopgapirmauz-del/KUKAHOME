import { restRequest, first } from "./_supabase.js";
import { requireAuth } from "./_auth.js";
import {
  telegramCall,
  telegramSetWebhook,
  randomToken,
  validateAndSubscribeMetaChannel,
} from "./_social.js";
import { parseSheetUrl, fetchSheetCsv, syncAttendanceFromSheet } from "./_attendance.js";

function publicChannel(row) {
  // Never send the access token back to the browser.
  return {
    id: row.id,
    platform: row.platform,
    display_name: row.display_name || "",
    external_account_id: row.external_account_id || "",
    connection_type: row.connection_type || (row.platform === "telegram" ? "telegram_bot" : "manual"),
    business_connection_id: row.business_connection_id || "",
    status: row.status,
    last_error: row.last_error || "",
    health_checked_at: row.health_checked_at || null,
    token_expires_at: row.token_expires_at || null,
    created_at: row.created_at,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin"]);
  if (session instanceof Response) return session;

  try {
    const rows = await restRequest(env, "social_channels", {
      query: { select: "*", order: "created_at.desc" },
    });
    const metaAvailable = Boolean(
      String(env?.META_APP_ID || "").trim()
      && String(env?.META_APP_SECRET || "").trim()
      && String(env?.META_WEBHOOK_VERIFY_TOKEN || "").trim(),
    );
    return Response.json({
      success: true,
      meta_available: metaAvailable,
      items: (Array.isArray(rows) ? rows : []).map(publicChannel),
    });
  } catch {
    return Response.json({ success: false, items: [] }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin"]);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const platform = String(data?.platform || "").trim().toLowerCase();
    if (!["telegram", "facebook", "instagram", "google_sheets"].includes(platform)) {
      return Response.json({ success: false, error: "unsupported_platform" }, { status: 400 });
    }

    const origin = new URL(request.url).origin;

    if (platform === "telegram") {
      const botToken = String(data?.botToken || "").trim();
      if (!botToken) return Response.json({ success: false, error: "bot_token_required" }, { status: 400 });

      let me;
      try {
        me = await telegramCall(botToken, "getMe", {});
      } catch {
        return Response.json({ success: false, error: "invalid_bot_token" }, { status: 400 });
      }

      const secretToken = randomToken();
      const webhookUrl = `${origin}/api/telegram-webhook`;
      try {
        await telegramSetWebhook(botToken, webhookUrl, secretToken);
      } catch (err) {
        return Response.json({ success: false, error: `webhook_failed: ${err.message}` }, { status: 400 });
      }

      const inserted = await restRequest(env, "social_channels", {
        method: "POST",
        body: {
          platform: "telegram",
          display_name: `@${me.username || "bot"}`,
          external_account_id: String(me.id || ""),
          access_token: botToken,
          webhook_verify_token: secretToken,
          status: "connected",
          connection_type: "telegram_bot",
          health_checked_at: new Date().toISOString(),
          connected_by: session.uid,
        },
        prefer: "return=representation",
      });
      return Response.json({
        success: true,
        item: publicChannel(first(inserted) || {}),
        supports_business: Boolean(me.can_connect_to_business),
      });
    }

    if (platform === "google_sheets") {
      const sheetUrl = String(data?.sheetUrl || "").trim();
      const parsed = parseSheetUrl(sheetUrl);
      if (!parsed) return Response.json({ success: false, error: "invalid_sheet_url" }, { status: 400 });

      try {
        await fetchSheetCsv(parsed.spreadsheetId, parsed.gid);
      } catch (err) {
        return Response.json({
          success: false,
          error: err.message === "sheet_not_public" ? "sheet_not_public" : "sheet_unreachable",
        }, { status: 400 });
      }

      const inserted = await restRequest(env, "social_channels", {
        method: "POST",
        body: {
          platform: "google_sheets",
          display_name: "HR davomat (Google Sheets)",
          external_account_id: parsed.spreadsheetId,
          status: "connected",
          connection_type: "google_sheets",
          config: { sheetUrl, spreadsheetId: parsed.spreadsheetId, gid: parsed.gid },
          health_checked_at: new Date().toISOString(),
          connected_by: session.uid,
        },
        prefer: "return=representation",
      });

      try {
        await syncAttendanceFromSheet(env, first(inserted));
      } catch {
        // First sync can fail benignly (e.g. columns not recognized yet) -
        // the channel is still saved; /api/attendance will retry on demand.
      }

      return Response.json({ success: true, item: publicChannel(first(inserted) || {}) });
    }

    // Facebook / Instagram: store the page access token now. Actual message
    // delivery starts working once (a) Meta has approved the required
    // permissions for this app, and (b) the webhook URL below is registered
    // in the Meta App dashboard for this page/app.
    const pageAccessToken = String(data?.pageAccessToken || "").trim();
    const externalAccountId = String(data?.externalAccountId || "").trim();
    if (!pageAccessToken || !externalAccountId) {
      return Response.json({ success: false, error: "missing_fields" }, { status: 400 });
    }

    const secretToken = randomToken();
    const candidate = {
      platform,
      external_account_id: externalAccountId,
      access_token: pageAccessToken,
    };
    let metaConnection;
    try {
      metaConnection = await validateAndSubscribeMetaChannel(env, candidate);
    } catch (err) {
      return Response.json({
        success: false,
        error: "meta_connection_failed",
        provider_error: String(err?.message || "unknown"),
      }, { status: 400 });
    }
    const providerName = String(
      metaConnection?.profile?.username
      || metaConnection?.profile?.name
      || "",
    ).trim();
    const inserted = await restRequest(env, "social_channels", {
      method: "POST",
      body: {
        platform,
        display_name: String(data?.displayName || "").trim() || providerName || platform,
        external_account_id: externalAccountId,
        access_token: pageAccessToken,
        webhook_verify_token: secretToken,
        status: "pending",
        connection_type: platform === "instagram" ? "instagram_login" : "facebook_page",
        health_checked_at: new Date().toISOString(),
        connected_by: session.uid,
      },
      prefer: "return=representation",
    });
    const row = first(inserted);
    return Response.json({
      success: true,
      item: publicChannel(row || {}),
      webhook_url: `${origin}/api/meta-webhook`,
      verify_token: secretToken,
    });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin"]);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false }, { status: 400 });

    const channel = await restRequest(env, "social_channels", {
      query: { select: "*", id: `eq.${id}`, limit: "1" },
    }).then(first);

    if (channel?.platform === "telegram" && channel.access_token) {
      try {
        await telegramCall(channel.access_token, "deleteWebhook", {});
      } catch {
        // ignore - still disconnect locally
      }
    }

    await restRequest(env, `social_channels?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status: "disconnected", access_token: null },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
