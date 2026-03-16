export async function onRequestGet(context) {
  const { env } = context;

  const result = await env.DB.prepare(
    "SELECT * FROM managers ORDER BY id DESC"
  ).all();

  return Response.json({ success: true, items: result.results || [] });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();

  await env.DB.prepare(`
    INSERT INTO managers (full_name, login, password, role, showroom)
    VALUES (?, ?, ?, ?, ?)
  `)
    .bind(
      data.full_name || "",
      data.login || "",
      data.password || "",
      data.role || "manager",
      data.showroom || ""
    )
    .run();

  return Response.json({ success: true });
}
