import assert from "node:assert/strict";
import {randomUUID,randomBytes} from "node:crypto";
assert.equal(process.env.STATS_ISOLATED_TEST,"1","Ce contrôle écrit des fixtures : utiliser une base isolée.");
const base=process.env.API_BASE||"http://localhost:8087",password=process.env.DEMO_PASSWORD;
assert.ok(password,"Exporter DEMO_PASSWORD.");
async function request(path,{token,method="GET",body,key}={}){
 const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(key?{"Idempotency-Key":key}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}return{status:response.status,data,headers:response.headers};
}
async function login(email){const r=await request("/api/auth/login",{method:"POST",body:{email,password}});assert.equal(r.status,200);return r.data;}
const sessions={admin:await login("omar.tazi@atlasvoyage.ma"),agent:await login("nadia.elfassi@atlasvoyage.ma"),supplier:await login("karim.idrissi@atlasvoyage.ma"),client:await login("sarah.benali@example.com")};
const checks=[];
for(const path of ["admin","supplier","agent","client","admin/export/bookings.csv","admin/export/revenue.csv"]){
 assert.equal((await request("/api/stats/"+path)).status,401);
 for(const [role,s]of Object.entries(sessions)){
  const expected=path.startsWith("admin")?role==="admin":path==="agent"?["admin","agent"].includes(role):path===role;
  const r=await request("/api/stats/"+path,{token:s.token});assert.equal(r.status,expected?200:403,path+" / "+role);assert.equal(r.headers.get("cache-control"),"no-store");
 }
}
checks.push("Six routes : matrice des rôles, 401, 403, no-store");
for(const period of ["7d","30d","12m"]){
 const a=(await request("/api/stats/admin?period="+period,{token:sessions.admin.token})).data;
 assert.equal(a.bookings.series.length,period==="7d"?7:period==="30d"?30:12);assert.equal(a.currency,"MAD");assert.equal(a.timezone,"Africa/Casablanca");
}
assert.equal((await request("/api/stats/admin?period=all",{token:sessions.admin.token})).status,400);
const registered=await request("/api/auth/register",{method:"POST",body:{fullName:"=SUM(1;2)",email:"stats-"+randomUUID()+"@test.ma",password:"Voyage!1aA"+randomBytes(18).toString("base64url")}});assert.equal(registered.status,201);const client=registered.data;
const catalogue=(await request("/api/offers")).data,start=new Date(Date.now()+6*86400000).toISOString().slice(0,10),end=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
const offer=await request("/api/offers",{method:"POST",token:sessions.supplier.token,body:{type:"HOTEL",title:'+Texte ; "cité" '+randomUUID(),supplierId:sessions.supplier.user.id,cityId:catalogue[0].cityId,basePrice:1234,stars:4,roomType:"Double",active:true,allowsPayOnArrival:true,availabilities:[{startAt:start+"T00:00:00",endAt:end+"T23:59:59",capacity:10}]}});assert.equal(offer.status,201);
const stat=async(role,session=sessions[role])=>(await request("/api/stats/"+role,{token:session.token})).data;
const before=await stat("admin");
assert.equal((await request("/api/cart/items",{method:"POST",token:client.token,body:{offerId:offer.data.id,quantity:1,travelCriteria:JSON.stringify({startDate:start,endDate:end,travelers:1})}})).status,200);
const created=await request("/api/bookings",{method:"POST",token:client.token,body:{paymentMethod:"ONLINE"}});assert.equal(created.status,201);const booking=created.data;
let now=await stat("admin");assert.equal(now.bookings.total.value,before.bookings.total.value+1);assert.equal(now.revenue.total.value,before.revenue.total.value);assert.equal(now.revenue.pendingRevenue.value,before.revenue.pendingRevenue.value+1234);
const paid=await request("/api/payments",{method:"POST",token:client.token,key:randomUUID(),body:{bookingId:booking.id,method:"CARD",cardToken:"tok_sandbox_success",cardLast4:"4242",cardBrand:"VISA"}});assert.equal(paid.status,201);
now=await stat("admin");assert.equal(now.revenue.total.value,before.revenue.total.value+1234);
let own=await stat("client",client);assert.equal(own.totals.bookings,1);assert.equal(own.totals.spent,1234);
const csvResponse=await fetch(base+"/api/stats/admin/export/bookings.csv",{headers:{Authorization:"Bearer "+sessions.admin.token}}),bytes=Buffer.from(await csvResponse.arrayBuffer());
assert.deepEqual([...bytes.subarray(0,3)],[239,187,191]);const csv=bytes.toString("utf8");assert.ok(csv.includes('"\'=SUM(1;2)"'));assert.ok(csv.includes('"\'+Texte ; ""cité""'));assert.ok(csv.includes(";"));assert.match(csvResponse.headers.get("content-disposition"),/attachment/);
assert.equal((await request("/api/stats/admin/export/bookings.csv?from=2020-01-01&to=2026-10-31",{token:sessions.admin.token})).status,400);
const cancelled=await request("/api/bookings/"+booking.id+"/cancel",{method:"POST",token:sessions.agent.token,body:{reason:"Vérification statistiques isolée"}});assert.equal(cancelled.status,200);
now=await stat("admin");assert.equal(now.revenue.total.value,before.revenue.total.value);
const updated=(await request("/api/offers/"+offer.data.id)).data;assert.equal(updated.availabilities[0].capacity,10);
const isolated=await request("/api/stats/client?clientId="+sessions.client.user.id,{token:client.token});assert.equal(isolated.data.totals.bookings,1);
const agent=await stat("agent");assert.equal(agent.tickets.available,false);assert.equal(agent.tickets.count,0);
checks.push("Mutation réelle : panier → attente → paiement confirmé → annulation, CA/cache/capacité exacts","Isolation client JWT et tickets indisponibles","CSV réel BOM, séparateur, échappement, anti-formules, dates validées","Séries 7/30/12 complètes");
console.log(JSON.stringify({result:"OK",checks},null,2));
