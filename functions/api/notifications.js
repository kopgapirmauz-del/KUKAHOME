export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const toLogin = String(url.searchParams.get("to") || "").trim();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      to_login TEXT,
      actor_login TEXT,
      client_contact TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const result = await env.DB.prepare(
    "SELECT * FROM notifications WHERE to_login=? ORDER BY id DESC"
  ).bind(toLogin).all();

  return Response.json({ success: true, items: result.results || [] });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      to_login TEXT,
      actor_login TEXT,
      client_contact TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    INSERT INTO notifications (type, to_login, actor_login, client_contact, is_read)
    VALUES (?, ?, ?, ?, 0)
  `)
    .bind(
      data.type || "new_client_from_manager",
      data.to_login || "",
      data.actor_login || "",
      data.client_contact || "-"
    )
    .run();

  return Response.json({ success: true });
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const data = await request.json();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      to_login TEXT,
      actor_login TEXT,
      client_contact TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  if (data.all) {
    await env.DB.prepare("UPDATE notifications SET is_read=1 WHERE to_login=?")
      .bind(data.to_login || "")
      .run();
    return Response.json({ success: true });
  }

  await env.DB.prepare("UPDATE notifications SET is_read=1 WHERE id=? AND to_login=?")
    .bind(data.id, data.to_login || "")
    .run();

  return Response.json({ success: true });
}
