import { restRequest } from "./_supabase.js";
import { requireAuth } from "./_auth.js";
import { telegramSendMessage, metaSendMessage, getChannel } from "./_social.js";
import {
  canUseInbox,
  getAccessibleConversation,
  patchAccessibleConversation,
} from "./_conversation_access.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  if (!canUseInbox(session)) {
    return Response.json({ success: false, error: "forbidden", items: [] }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const conversationId = String(url.searchParams.get("conversation_id") || "").trim();
    if (!conversationId) return Response.json({ success: false, items: [] }, { status: 400 });
    const conversation = await getAccessibleConversation(env, conversationId, session);
    if (!conversation) {
      return Response.json({ success: false, error: "forbidden", items: [] }, { status: 403 });
    }

    const rows = await restRequest(env, "messages", {
      query: {
        select: "id,direction,sender_type,message_type,body,attachment_url,created_at",
        conversation_id: `eq.${conversationId}`,
        order: "created_at.asc",
        limit: "500",
      },
    });

    // Merely previewing an unassigned thread must not silently claim it or
    // remove the unread signal for other managers.
    if (session.role === "admin" || String(conversation.assigned_manager_id || "") === String(session.uid)) {
      await restRequest(env, "conversations", {
        method: "PATCH",
        query: { id: `eq.${conversationId}` },
        body: { unread_count: 0 },
      });
    }

    return Response.json({ success: true, items: Array.isArray(rows) ? rows : [] });
  } catch {
    return Response.json({ success: false, items: [] }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  if (!canUseInbox(session)) {
    return Response.json({ success: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const conversationId = String(data?.conversation_id || "").trim();
    const text = String(data?.body || "").trim();
    if (!conversationId || !text) return Response.json({ success: false }, { status: 400 });

    const convo = await getAccessibleConversation(env, conversationId, session);
    if (!convo) return Response.json({ success: false, error: "forbidden" }, { status: 403 });

    // Claim first, then send. This avoids two managers replying to the same
    // previously-unassigned lead at the same time.
    const claimed = await patchAccessibleConversation(env, convo, session, {
      status: "open",
      unread_count: 0,
    });
    if (!claimed) {
      return Response.json({ success: false, error: "already_claimed" }, { status: 409 });
    }

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

    await restRequest(env, "conversations", {
      method: "PATCH",
      query: { id: `eq.${conversationId}` },
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
