export async function onRequestGet(context) {
  const { env } = context;

  const result = await env.DB.prepare(
    "SELECT * FROM clients ORDER BY id DESC"
  ).all();

  return Response.json(result.results);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();

  await env.DB.prepare(
    `INSERT INTO clients (full_name, phone, source, interest, note, manager_login)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      data.full_name,
      data.phone,
      data.source,
      data.interest,
      data.note,
      data.manager_login
    )
    .run();

  return Response.json({ success: true });
}
