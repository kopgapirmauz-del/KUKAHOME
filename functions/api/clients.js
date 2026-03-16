export async function onRequestGet(context){
 const {request, env} = context
 const url = new URL(request.url)

 const manager = url.searchParams.get("manager")
 const role = url.searchParams.get("role")

 let query

 if(role === "admin"){
   query = "SELECT * FROM clients ORDER BY id DESC"
 } else {
   query = "SELECT * FROM clients WHERE manager=? ORDER BY id DESC"
 }

 const result = role === "admin"
   ? await env.DB.prepare(query).all()
   : await env.DB.prepare(query).bind(manager).all()

 return Response.json(result.results)
}


export async function onRequestPost(context){
 const {request, env} = context
 const data = await request.json()

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
 .run()

 return Response.json({success:true})
}
