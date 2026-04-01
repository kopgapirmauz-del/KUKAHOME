import { restRequest } from "./_supabase.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false }, { status: 400 });

    await restRequest(env, `clients?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
