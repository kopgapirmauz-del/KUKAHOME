import { restRequest } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const rows = await restRequest(env, "stores", {
      query: { select: "id,name,created_at", order: "created_at.desc" },
    });
    return Response.json({ success: true, items: Array.isArray(rows) ? rows : [] });
  } catch {
    return Response.json({ success: false, items: [] }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "director"]);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const name = String(data?.name || "").trim();
    if (!name) return Response.json({ success: false }, { status: 400 });

    await restRequest(env, "stores", {
      method: "POST",
      body: { name },
      prefer: "resolution=ignore-duplicates",
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "director"]);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    const name = String(data?.name || "").trim();
    if (!id || !name) return Response.json({ success: false }, { status: 400 });

    await restRequest(env, `stores?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { name },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "director"]);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false }, { status: 400 });

    // Detach any users/clients pointing at this store instead of leaving
    // dangling foreign keys or silently failing the delete.
    await restRequest(env, `users?store_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { store_id: null },
    });
    await restRequest(env, `clients?store_id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { store_id: null },
    });
    await restRequest(env, `stores?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
