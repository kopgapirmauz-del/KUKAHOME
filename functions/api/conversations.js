import { restRequest, first } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

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
    last_message_at: row.last_message_at,
    last_message_preview: row.last_message_preview || "",
    unread_count: Number(row.unread_count || 0),
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

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
    if (mineOnly || session.role === "manager") query.assigned_manager_id = `eq.${session.uid}`;

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

  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false }, { status: 400 });

    const patch = {};
    if (data.status) patch.status = String(data.status);
    if (data.assigned_manager_id !== undefined) {
      patch.assigned_manager_id = data.assigned_manager_id ? String(data.assigned_manager_id) : null;
    }
    if (data.mark_read) patch.unread_count = 0;

    // Converting a conversation into a client/lead in the main clients table.
    if (data.convert_to_lead) {
      const convo = await restRequest(env, "conversations", {
        query: { select: "*", id: `eq.${id}`, limit: "1" },
      }).then(first);
      if (convo && !convo.client_id) {
        const created = await restRequest(env, "clients", {
          method: "POST",
          body: {
            date: new Date().toISOString().slice(0, 10),
            phone: convo.contact_handle || convo.contact_name || "",
            source: `${convo.platform}_lead`,
            note: `${convo.platform} orqali: ${convo.contact_name}`,
            status: "yangi",
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

    await restRequest(env, `conversations?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: patch,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
