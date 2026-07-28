import { first, restRequest, toBool } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    // Always the caller's own notifications - never trust a client-supplied "to" login.
    const toUserId = session.uid;

    const rows = await restRequest(env, "notifications", {
      query: {
        select: "id,type,client_contact,is_read,created_at,to_user_id,actor_user_id",
        to_user_id: `eq.${toUserId}`,
        order: "id.desc",
      },
    });

    const users = await restRequest(env, "users", {
      query: { select: "id,login" },
    });
    const actorById = new Map((Array.isArray(users) ? users : []).map((u) => [u.id, u.login || ""]));

    const items = (Array.isArray(rows) ? rows : []).map((row) => ({
      id: row.id,
      type: row.type,
      to_login: session.login,
      actor_login: actorById.get(row.actor_user_id) || "",
      client_contact: row.client_contact || "-",
      is_read: row.is_read ? 1 : 0,
      created_at: row.created_at || null,
    }));

    return Response.json({ success: true, items });
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
    // Recipient can be a different user (e.g. notifying an admin), but the
    // actor is always the authenticated caller, never a client-supplied login.
    const toLogin = String(data?.to_login || "").trim();
    const toRows = await restRequest(env, "users", {
      query: { select: "id", login: `eq.${toLogin}`, limit: "1" },
    });
    const toUserId = first(toRows)?.id || null;
    if (!toUserId) return Response.json({ success: false }, { status: 400 });

    const actorUserId = session.uid;
    const type = String(data?.type || "new_client_from_manager");
    const clientContact = String(data?.client_contact || "-");
    const existing = await restRequest(env, "notifications", {
      query: {
        select: "id,created_at",
        to_user_id: `eq.${toUserId}`,
        type: `eq.${type}`,
        client_contact: `eq.${clientContact}`,
        actor_user_id: `eq.${actorUserId}`,
        order: "id.desc",
        limit: "1",
      },
    });
    const last = first(existing);
    if (last?.created_at) {
      const ago = Date.now() - Date.parse(last.created_at);
      if (Number.isFinite(ago) && ago >= 0 && ago < 10000) {
        return Response.json({ success: true, deduped: true });
      }
    }

    await restRequest(env, "notifications", {
      method: "POST",
      body: {
        type,
        to_user_id: toUserId,
        actor_user_id: actorUserId,
        client_contact: clientContact,
        is_read: false,
      },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const id = Number(data?.id || 0);
    if (!id) return Response.json({ success: false }, { status: 400 });

    // Scoped to the caller's own id - a user can never touch someone else's notification.
    await restRequest(env, `notifications?id=eq.${id}&to_user_id=eq.${encodeURIComponent(session.uid)}`, {
      method: "DELETE",
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const toUserId = session.uid;

    if (toBool(data?.all)) {
      await restRequest(env, `notifications?to_user_id=eq.${encodeURIComponent(toUserId)}`, {
        method: "PATCH",
        body: { is_read: true },
      });
      return Response.json({ success: true });
    }

    const id = Number(data?.id || 0);
    if (!id) return Response.json({ success: false }, { status: 400 });

    await restRequest(env, `notifications?id=eq.${id}&to_user_id=eq.${encodeURIComponent(toUserId)}`, {
      method: "PATCH",
      body: { is_read: true },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
