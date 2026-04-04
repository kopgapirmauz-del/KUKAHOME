import { restRequest } from "./_supabase.js";

export async function onRequestGet(context) {
  const { env } = context;
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
