import { restRequest, first } from "./_supabase.js";
import { requireAuth } from "./_auth.js";
import { telegramSendMessage, metaSendMessage, getChannel } from "./_social.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const url = new URL(request.url);
    const conversationId = String(url.searchParams.get("conversation_id") || "").trim();
    if (!conversationId) return Response.json({ success: false, items: [] }, { status: 400 });

    const rows = await restRequest(env, "messages", {
      query: {
        select: "id,direction,sender_type,message_type,body,attachment_url,created_at",
        conversation_id: `eq.${conversationId}`,
        order: "created_at.asc",
        limit: "500",
      },
    });

    await restRequest(env, `conversations?id=eq.${encodeURIComponent(conversationId)}`, {
      method: "PATCH",
      body: { unread_count: 0 },
    });

    return Response.json({ success: true, items: Array.isArray(rows) ? rows : [] });
  } catch {
    return Response.json({ success: false, items: [] }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const conversationId = String(data?.conversation_id || "").trim();
    const text = String(data?.body || "").trim();
    if (!conversationId || !text) return Response.json({ success: false }, { status: 400 });

    const convo = await restRequest(env, "conversations", {
      query: { select: "*", id: `eq.${conversationId}`, limit: "1" },
    }).then(first);
    if (!convo) return Response.json({ success: false, error: "not_found" }, { status: 404 });

    const channel = await getChannel(env, convo.channel_id);
    if (!channel?.access_token) {
      return Response.json({ success: false, error: "channel_not_connected" }, { status: 400 });
    }

    try {
      if (convo.platform === "telegram") {
        await telegramSendMessage(channel.access_token, convo.external_chat_id, text);
      } else {
        await metaSendMessage(channel.access_token, convo.external_chat_id, text);
      }
    } catch (err) {
      return Response.json({ success: false, error: `send_failed: ${err.message}` }, { status: 502 });
    }

    await restRequest(env, "messages", {
      method: "POST",
      body: {
        conversation_id: conversationId,
        direction: "out",
        sender_type: "manager",
        sender_user_id: session.uid,
        message_type: "text",
        body: text,
      },
    });

    await restRequest(env, `conversations?id=eq.${encodeURIComponent(conversationId)}`, {
      method: "PATCH",
      body: {
        status: "answered",
        last_message_at: new Date().toISOString(),
        last_message_preview: text.slice(0, 140),
      },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
