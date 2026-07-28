import { restRequest, first } from "./_supabase.js";
import { requireAuth } from "./_auth.js";
import {
  canUseInbox,
  getAccessibleConversation,
  patchAccessibleConversation,
} from "./_conversation_access.js";

const ALLOWED_STATUSES = new Set(["new", "open", "answered", "closed"]);

function mapOut(row, channelsById, usersById) {
  const channel = channelsById.get(row.channel_id);
  return {
    id: row.id,
    platform: row.platform,
    channel_name: channel?.display_name || row.platform,
    contact_name: row.contact_name || "",
    contact_handle: row.contact_handle || "",
    status: row.status,
    is_lead: Boolean(row.is_lead),
    client_id: row.client_id || null,
    assigned_manager_id: row.assigned_manager_id || null,
    assigned_manager_name: usersById.get(row.assigned_manager_id) || "",
    business_connection_id: row.business_connection_id || null,
    last_message_at: row.last_message_at,
    last_inbound_at: row.last_inbound_at || null,
    last_outbound_at: row.last_outbound_at || null,
    first_response_at: row.first_response_at || null,
    last_message_preview: row.last_message_preview || "",
    unread_count: Number(row.unread_count || 0),
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  if (!canUseInbox(session)) {
    return Response.json({ success: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const status = String(url.searchParams.get("status") || "").trim();
    const platform = String(url.searchParams.get("platform") || "").trim();
    const mineOnly = url.searchParams.get("mine") === "1";

    const query = {
      select: "*",
      order: "last_message_at.desc",
      limit: "200",
    };
    if (status) query.status = `eq.${status}`;
    if (platform) query.platform = `eq.${platform}`;
    if (session.role === "manager") {
      query.or = `(assigned_manager_id.eq.${session.uid},assigned_manager_id.is.null)`;
    } else if (mineOnly) {
      query.assigned_manager_id = `eq.${session.uid}`;
    }

    const [rows, channels, users] = await Promise.all([
      restRequest(env, "conversations", { query }),
      restRequest(env, "social_channels", { query: { select: "id,display_name" } }),
      restRequest(env, "users", { query: { select: "id,full_name" } }),
    ]);

    const channelsById = new Map((Array.isArray(channels) ? channels : []).map((c) => [c.id, c]));
    const usersById = new Map((Array.isArray(users) ? users : []).map((u) => [u.id, u.full_name]));

    return Response.json({
      success: true,
      items: (Array.isArray(rows) ? rows : []).map((row) => mapOut(row, channelsById, usersById)),
    });
  } catch {
    return Response.json({ success: false, items: [] }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  if (!canUseInbox(session)) {
    return Response.json({ success: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false }, { status: 400 });

    let conversation = await getAccessibleConversation(env, id, session);
    if (!conversation) {
      return Response.json({ success: false, error: "forbidden" }, { status: 403 });
    }

    const patch = {};
    if (data.status) {
      const status = String(data.status);
      if (!ALLOWED_STATUSES.has(status)) {
        return Response.json({ success: false, error: "invalid_status" }, { status: 400 });
      }
      patch.status = status;
    }
    if (data.assigned_manager_id !== undefined) {
      const requestedId = data.assigned_manager_id ? String(data.assigned_manager_id) : null;
      if (session.role === "manager" && requestedId !== String(session.uid)) {
        return Response.json({ success: false, error: "forbidden" }, { status: 403 });
      }
      patch.assigned_manager_id = requestedId;
    }
    if (data.mark_read) patch.unread_count = 0;

    // Converting a conversation into a client/lead in the main clients table.
    if (data.convert_to_lead && !conversation.client_id) {
      // Win the right to convert atomically: the PATCH only matches while
      // client_id is still null, so exactly one request proceeds. The previous
      // claim ran for managers only, so an admin double-clicking - or an admin
      // and a manager acting at once - both read client_id as null and both
      // inserted, leaving a duplicate lead the conversation never points at.
      const gated = await patchAccessibleConversation(
        env,
        conversation,
        session,
        { is_lead: true },
        { client_id: "is.null" },
      );
      if (!gated) {
        return Response.json({ success: false, error: "already_converted" }, { status: 409 });
      }
      conversation = gated;
      const convo = conversation;
      {
        const created = await restRequest(env, "clients", {
          method: "POST",
          body: {
            date: new Date().toISOString().slice(0, 10),
            phone: convo.contact_handle || convo.contact_name || "",
            source: `${convo.platform}_lead`,
            interest: convo.last_message_preview || "",
            note: `${convo.platform} orqali: ${convo.contact_name}`,
            status: "yellow",
            manager_id: convo.assigned_manager_id || session.uid,
          },
          prefer: "return=representation",
        });
        const clientRow = first(created);
        patch.is_lead = true;
        if (clientRow?.id) patch.client_id = clientRow.id;
      }
    }

    if (!Object.keys(patch).length) return Response.json({ success: false }, { status: 400 });

    const updated = await patchAccessibleConversation(env, conversation, session, patch);
    if (!updated) {
      return Response.json({ success: false, error: "already_claimed" }, { status: 409 });
    }

    return Response.json({ success: true, item: mapOut(updated, new Map(), new Map()) });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
