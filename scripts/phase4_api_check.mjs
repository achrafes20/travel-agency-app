import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
assert.equal(process.env.NOTIFICATION_ISOLATED_TEST,"1","Utiliser une base isolée et NOTIFICATION_ISOLATED_TEST=1.");
const base=process.env.API_BASE||"http://localhost:8086",mailpit=process.env.MAILPIT_BASE||"http://127.0.0.1:8025",password=process.env.DEMO_PASSWORD;
assert.ok(password,"Exporter DEMO_PASSWORD.");
async function request(path,{token,method="GET",body,key}={}){
 const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(key?{"Idempotency-Key":key}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return{status:response.status,body:await response.json().catch(()=>null)};
}
const login=async email=>{const r=await request("/api/auth/login",{method:"POST",body:{email,password}});assert.equal(r.status,200);return r.body;};
const admin=await login("omar.tazi@atlasvoyage.ma"),supplier=await login("karim.idrissi@atlasvoyage.ma"),otherSupplier=await login("vols@atlasvoyage.ma"),agent=await login("nadia.elfassi@atlasvoyage.ma");
const email="notifications-"+randomUUID()+"@example.test";
const registered=await request("/api/auth/register",{method:"POST",body:{fullName:"Client Notifications",email,password:"Voyage!Securise42"}});
assert.equal(registered.status,201);const client=registered.body;
const list=async(token,query="")=>(await request("/api/notifications?size=50"+query,{token})).body;
let notices=await list(client.token);assert.equal(notices.totalElements,1);assert.equal(notices.content[0].type,"ACCOUNT_WELCOME");
assert.equal((await request("/api/notifications")).status,401);
const welcome=notices.content[0];
assert.equal((await request("/api/notifications/"+welcome.id+"/read",{method:"POST",token:otherSupplier.token,body:{}})).status,404);
assert.equal((await request("/api/notifications/"+welcome.id,{method:"DELETE",token:otherSupplier.token})).status,404);
assert.equal((await request("/api/notifications?size=999",{token:client.token})).body.size,50);
await request("/api/notifications/"+welcome.id+"/read",{method:"POST",token:client.token,body:{}});
assert.equal((await request("/api/notifications/unread-count",{token:client.token})).body.count,0);
const catalogue=(await request("/api/offers")).body;
const start=new Date(Date.now()+6*86400000).toISOString().slice(0,10),end=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
const createdOffer=await request("/api/offers",{method:"POST",token:supplier.token,body:{type:"HOTEL",title:"Contrôle notifications "+randomUUID(),supplierId:supplier.user.id,cityId:catalogue[0].cityId,basePrice:1000,active:true,allowsPayOnArrival:true,stars:4,roomType:"Double",availabilities:[{startAt:start+"T00:00:00",endAt:end+"T23:59:59",capacity:10}]}});
assert.equal(createdOffer.status,201);
const foreignCount=(await list(otherSupplier.token)).totalElements,adminCount=(await list(admin.token)).totalElements;
assert.equal((await request("/api/offers/"+createdOffer.body.id+"/moderation",{method:"POST",token:admin.token,body:{active:false,reason:"Vérification des informations"}})).status,200);
assert.equal((await list(otherSupplier.token)).totalElements,foreignCount);assert.equal((await list(admin.token)).totalElements,adminCount);
assert.ok((await list(supplier.token)).content.some(n=>n.type==="OFFER_DEACTIVATED"&&n.message.includes("Vérification des informations")));
await request("/api/offers/"+createdOffer.body.id+"/moderation",{method:"POST",token:admin.token,body:{active:true,reason:"Informations validées"}});
assert.equal((await request("/api/cart/items",{method:"POST",token:client.token,body:{offerId:createdOffer.body.id,quantity:1,travelCriteria:JSON.stringify({startDate:start,endDate:end,travelers:1})}})).status,200);
const booking=await request("/api/bookings",{method:"POST",token:client.token,body:{paymentMethod:"ONLINE"}});assert.equal(booking.status,201);
const paid=await request("/api/payments",{method:"POST",token:client.token,key:randomUUID(),body:{bookingId:booking.body.id,method:"CARD",cardToken:"tok_sandbox_success",cardBrand:"VISA",cardLast4:"4242"}});assert.equal(paid.status,201);assert.equal(paid.body.status,"PAID");
const types=(await list(client.token)).content.map(n=>n.type);for(const type of ["BOOKING_CREATED","BOOKING_CONFIRMED","PAYMENT_RECEIVED"])assert.ok(types.includes(type));
assert.ok((await list(agent.token)).content.some(n=>n.type==="BOOKING_CREATED"&&n.message.includes(booking.body.reference)));
const refunded=await request("/api/payments/"+paid.body.id+"/refund",{method:"POST",token:admin.token,key:randomUUID(),body:{reason:"Contrôle notifications de remboursement"}});assert.equal(refunded.status,200);
assert.ok((await list(client.token)).content.some(n=>n.type==="BOOKING_CANCELLED"));
const prefs={emailEnabled:false,inAppEnabled:true,bookingEmail:false,paymentEmail:false,offerEmail:false,supportEmail:false};
assert.equal((await request("/api/notifications/preferences",{method:"PUT",token:client.token,body:prefs})).status,200);
assert.equal((await request("/api/notifications/preferences",{token:client.token})).body.emailEnabled,false);
assert.equal((await request("/api/notifications/read-all",{method:"POST",token:client.token,body:{}})).status,200);
assert.equal((await request("/api/notifications/unread-count",{token:client.token})).body.count,0);
assert.equal((await request("/api/notifications/"+welcome.id,{method:"DELETE",token:client.token})).status,204);
let received=[];
for(let i=0;i<50;i++){
 const inbox=await fetch(mailpit+"/api/v1/messages?limit=200").then(r=>r.json());
 received=inbox.messages.filter(m=>m.To.some(to=>to.Address===email));
 if(received.length>=5)break;await new Promise(r=>setTimeout(r,100));
}
assert.ok(received.length>=5,"Bienvenue, création, confirmation, reçu, annulation reçus par SMTP");
for(const m of received){const details=await fetch(mailpit+"/api/v1/message/"+m.ID).then(r=>r.json());assert.ok(details.HTML.includes("Atlas"));assert.ok(details.Text.includes("Atlas Voyage"));}
console.log(JSON.stringify({result:"OK",checks:["Inscription et cloche API","Propriété 404 et authentification 401","Pagination et préférences","Modération propriétaire uniquement","Booking et Payment réellement branchés","Remboursement et annulation notifiés","Lecture/suppression","SMTP Mailpit : HTML et texte reçus"],emails:received.length},null,2));
