import { first, restRequest, toBool } from "./_supabase.js";

async function userIdByLogin(env, login) {
  const value = String(login || "").trim();
  if (!value) return null;
  const rows = await restRequest(env, "users", {
    query: { select: "id,login", login: `eq.${value}`, limit: "1" },
  });
  return first(rows)?.id || null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const toLogin = String(url.searchParams.get("to") || "").trim();
    const toUserId = await userIdByLogin(env, toLogin);
    if (!toUserId) return Response.json({ success: true, items: [] });

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
      to_login: toLogin,
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
  try {
    const data = await request.json();
    const toUserId = await userIdByLogin(env, data?.to_login || "");
    const actorUserId = await userIdByLogin(env, data?.actor_login || "");
    if (!toUserId) return Response.json({ success: false }, { status: 400 });

    const type = String(data?.type || "new_client_from_manager");
    const clientContact = String(data?.client_contact || "-");
    const existing = await restRequest(env, "notifications", {
      query: {
        select: "id,created_at",
        to_user_id: `eq.${toUserId}`,
        type: `eq.${type}`,
        client_contact: `eq.${clientContact}`,
        actor_user_id: actorUserId ? `eq.${actorUserId}` : undefined,
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
  try {
    const data = await request.json();
    const toUserId = await userIdByLogin(env, data?.to_login || "");
    if (!toUserId) return Response.json({ success: false }, { status: 400 });
    const id = Number(data?.id || 0);
    if (!id) return Response.json({ success: false }, { status: 400 });

    await restRequest(env, `notifications?id=eq.${id}&to_user_id=eq.${encodeURIComponent(toUserId)}`, {
      method: "DELETE",
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const toUserId = await userIdByLogin(env, data?.to_login || "");
    if (!toUserId) return Response.json({ success: false }, { status: 400 });

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
