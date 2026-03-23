export async function onRequestGet(context) {
  const { env } = context;

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

  const result = await env.DB.prepare(
    "SELECT * FROM managers WHERE role='manager' ORDER BY id DESC"
  ).all();

  return Response.json({ success: true, items: result.results || [] });
}

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

export async function onRequestPut(context) {
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
    UPDATE managers
    SET full_name=?, login=?, password=?, role=?, showroom=?
    WHERE id=?
  `)
    .bind(
      data.full_name || "",
      data.login || "",
      data.password || "",
      data.role || "manager",
      data.showroom || "",
      data.id
    )
    .run();

  return Response.json({ success: true });
}
