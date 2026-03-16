export async function onRequestPost(context) {
  const { request, env } = context
  const data = await request.json()

  const user = await env.DB.prepare(
    "SELECT * FROM managers WHERE login=? AND password=?"
  )
  .bind(data.login, data.password)
  .first()

  if(!user){
    return Response.json({success:false})
  }

  return Response.json({
    success:true,
    user:user
  })
}
