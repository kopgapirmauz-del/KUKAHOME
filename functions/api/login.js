export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT,
      login TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'manager',
      showroom TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    INSERT OR IGNORE INTO managers (full_name, login, password, role, showroom)
    VALUES ('Asosiy Admin', 'admin', 'admin123', 'admin', '')
  `).run();

  const user = await env.DB.prepare(
    "SELECT * FROM managers WHERE login=? AND password=?"
  )
    .bind(data.login, data.password)
    .first();

  if (!user) {
    return Response.json({ success: false });
  }

  return Response.json({
    success: true,
    user,
  });
}
