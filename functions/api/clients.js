export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

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

  const manager = url.searchParams.get("manager");
  const role = url.searchParams.get("role");

  let query;
  if (role === "admin") {
    query = "SELECT * FROM clients ORDER BY id DESC";
  } else {
    query = "SELECT * FROM clients WHERE manager=? ORDER BY id DESC";
  }

  const result = role === "admin"
    ? await env.DB.prepare(query).all()
    : await env.DB.prepare(query).bind(manager).all();

  return Response.json(result.results || []);
}

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
    INSERT INTO clients
    (date, showroom, manager, phone, source, interest, note, status, price, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      data.date,
      data.showroom,
      data.manager,
      data.phone,
      data.source,
      data.interest,
      data.note,
      data.status,
      data.price,
      data.result
    )
    .run();

  if ((data.creator_role || "") === "manager") {
    const admins = await env.DB.prepare("SELECT login FROM managers WHERE role='admin'").all();
    const adminRows = admins.results || [];
    for (const admin of adminRows) {
      await env.DB.prepare(`
        INSERT INTO notifications (type, to_login, actor_login, client_contact, is_read)
        VALUES (?, ?, ?, ?, 0)
      `)
        .bind("new_client_from_manager", admin.login || "", data.creator_login || "", data.phone || "-")
        .run();
    }
  }

  if ((data.creator_role || "") === "admin" && data.assigned_manager_login) {
    await env.DB.prepare(`
      INSERT INTO notifications (type, to_login, actor_login, client_contact, is_read)
      VALUES (?, ?, ?, ?, 0)
    `)
      .bind("assigned_by_admin", data.assigned_manager_login, data.creator_login || "", data.phone || "-")
      .run();
  }

  return Response.json({ success: true });
}
