export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      showroom TEXT,
      manager TEXT,
      phone TEXT,
      source TEXT,
      interest TEXT,
      note TEXT,
      status TEXT,
      price INTEGER,
      result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare("DELETE FROM clients WHERE id=?")
    .bind(data.id)
    .run();

  return Response.json({ success: true });
}
