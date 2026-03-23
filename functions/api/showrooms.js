export async function onRequestGet(context) {
  const { env } = context;

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS showrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const result = await env.DB.prepare(
    "SELECT * FROM showrooms ORDER BY id DESC"
  ).all();

  return Response.json({ success: true, items: result.results || [] });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS showrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    INSERT INTO showrooms (name)
    VALUES (?)
  `)
    .bind(data.name || "")
    .run();

  return Response.json({ success: true });
}
