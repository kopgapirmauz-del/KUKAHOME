export async function onRequestPost(context){
 const {request, env} = context
 const data = await request.json()

 await env.DB.prepare(
 "DELETE FROM clients WHERE id=?"
 )
 .bind(data.id)
 .run()

 return Response.json({success:true})
}
