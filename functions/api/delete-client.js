import { restRequest } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, ["admin", "director", "community_manager"]);
  if (session instanceof Response) return session;

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
