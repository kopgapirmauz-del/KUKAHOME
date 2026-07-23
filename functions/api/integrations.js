import { restRequest, first } from "./_supabase.js";
import { requireAuth } from "./_auth.js";
import { telegramCall, telegramSetWebhook, randomToken } from "./_social.js";

function publicChannel(row) {
  // Never send the access token back to the browser.
  return {
    id: row.id,
    platform: row.platform,
    display_name: row.display_name || "",
    external_account_id: row.external_account_id || "",
    status: row.status,
    last_error: row.last_error || "",
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
    return Response.json({ success: true, items: (Array.isArray(rows) ? rows : []).map(publicChannel) });
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
    if (!["telegram", "facebook", "instagram"].includes(platform)) {
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
          connected_by: session.uid,
        },
        prefer: "return=representation",
      });
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
    const inserted = await restRequest(env, "social_channels", {
      method: "POST",
      body: {
        platform,
        display_name: String(data?.displayName || "").trim() || platform,
        external_account_id: externalAccountId,
        access_token: pageAccessToken,
        webhook_verify_token: secretToken,
        status: "pending",
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
