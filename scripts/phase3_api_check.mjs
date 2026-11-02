import assert from "node:assert/strict";
import {createHmac,randomUUID,randomBytes} from "node:crypto";
assert.equal(process.env.PAYMENT_ISOLATED_TEST,"1","Utiliser une base isolée et PAYMENT_ISOLATED_TEST=1.");
const base=process.env.API_BASE||"http://localhost:8084",password=process.env.DEMO_PASSWORD,secret=process.env.PAYMENT_WEBHOOK_SECRET;
assert.ok(password&&secret,"Exporter DEMO_PASSWORD et PAYMENT_WEBHOOK_SECRET pour le contrôle.");
async function request(path,{token,method="GET",body,key,headers={}}={}){
 const raw=body?JSON.stringify(body):undefined;
 const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(key?{"Idempotency-Key":key}:{}),...headers},...(raw?{body:raw}:{})});
 const data=await response.json().catch(()=>null);return{status:response.status,data,headers:response.headers};
}
const login=async email=>{const r=await request("/api/auth/login",{method:"POST",body:{email,password}});assert.equal(r.status,200);return r.data;};
const admin=await login("omar.tazi@atlasvoyage.ma"),supplier=await login("karim.idrissi@atlasvoyage.ma"),agent=await login("nadia.elfassi@atlasvoyage.ma");
const registration=await request("/api/auth/register",{method:"POST",body:{fullName:"Test Paiement",email:"payment-"+randomUUID()+"@test.ma",password:"Voyage!1aA"+randomBytes(18).toString("base64url")}});
assert.equal(registration.status,201);const client=registration.data;
const catalogue=(await request("/api/offers")).data;
const from=new Date();from.setDate(from.getDate()+5);const to=new Date(from);to.setDate(to.getDate()+1);
const start=from.toISOString().slice(0,10),end=to.toISOString().slice(0,10);
const offer=await request("/api/offers",{method:"POST",token:supplier.token,body:{type:"HOTEL",title:"Contrôle paiements "+randomUUID(),supplierId:supplier.user.id,cityId:catalogue[0].cityId,basePrice:1000,stars:4,roomType:"Double",allowsPayOnArrival:true,active:true,availabilities:[{startAt:start+"T00:00:00",endAt:end+"T23:59:59",capacity:20}]}});
assert.equal(offer.status,201);
async function booking(method="ONLINE"){
 assert.equal((await request("/api/cart/items",{method:"POST",token:client.token,body:{offerId:offer.data.id,quantity:1,travelCriteria:JSON.stringify({startDate:start,endDate:end,travelers:1})}})).status,200);
 const r=await request("/api/bookings",{method:"POST",token:client.token,body:{paymentMethod:method}});assert.equal(r.status,201);return r.data;
}
const card=(id,token="success")=>({bookingId:id,method:"CARD",cardToken:"tok_sandbox_"+token,cardLast4:"4242",cardBrand:"VISA"});
const pay=(b,key,body)=>request("/api/payments",{method:"POST",token:client.token,key,body:body||card(b.id)});
const b=await booking(),key=randomUUID();
const races=await Promise.all(Array.from({length:10},()=>pay(b,key)));
assert.ok(races.every(r=>[200,201].includes(r.status)));
assert.equal(new Set(races.map(r=>r.data.id)).size,1);assert.ok(races.every(r=>r.data.status==="PAID"));
const p=races[0].data;
assert.equal(races[0].headers.get("cache-control"),"no-store");
assert.equal((await pay(b,key,card(b.id,"declined"))).status,422);
const otherBooking=await booking();const different=await Promise.all(Array.from({length:10},()=>pay(otherBooking,randomUUID())));
assert.equal(different.filter(r=>r.status===201).length,1);assert.equal(different.filter(r=>r.status===409).length,9);
const refundKey=randomUUID(),refundBody={amount:250,reason:"Contrôle de remboursement"};
const refund=await request("/api/payments/"+p.id+"/refund",{token:admin.token,method:"POST",key:refundKey,body:refundBody});
assert.equal(refund.status,200);assert.equal(refund.data.status,"PARTIALLY_REFUNDED");
assert.equal((await request("/api/payments/"+p.id+"/refund",{token:admin.token,method:"POST",key:refundKey,body:refundBody})).data.refundedAmount,250);
assert.equal((await request("/api/payments/"+p.id+"/refund",{token:admin.token,method:"POST",key:randomUUID(),body:{amount:751,reason:"Dépassement"}})).status,409);
assert.equal((await request("/api/payments/"+p.id+"/refund",{token:admin.token,method:"POST",key:randomUUID(),body:{reason:"Solde"}})).data.status,"REFUNDED");
const cashBooking=await booking("PAY_ON_ARRIVAL"),cash=(await request("/api/payments?bookingId="+cashBooking.id,{token:client.token})).data[0];
const collectKey=randomUUID(),collectBody={amount:cash.amount,note:"Contrôle espèces"};
assert.equal((await request("/api/payments/"+cash.id+"/collect-cash",{token:agent.token,method:"POST",key:collectKey,body:collectBody})).data.status,"PAID");
assert.equal((await request("/api/payments/"+cash.id+"/collect-cash",{token:agent.token,method:"POST",key:collectKey,body:collectBody})).data.collectedBy,agent.user.id);
const failedBooking=await booking();assert.equal((await pay(failedBooking,randomUUID(),card(failedBooking.id,"declined"))).data.status,"FAILED");
assert.equal((await pay(failedBooking,randomUUID())).data.status,"PAID");
const webhookBooking=await booking(),webhookPayment=(await request("/api/payments?bookingId="+webhookBooking.id,{token:client.token})).data[0];
const event={eventId:"evt_"+randomUUID(),type:"payment.succeeded",providerReference:webhookPayment.providerReference,amount:1000};
const signature=createHmac("sha256",secret).update(JSON.stringify(event)).digest("hex");
const headers={"X-Atlas-Signature":signature,"X-Atlas-Timestamp":String(Math.floor(Date.now()/1000))};
assert.equal((await request("/api/payments/webhook",{method:"POST",body:event,headers})).data.status,"PROCESSED");
assert.equal((await request("/api/payments/webhook",{method:"POST",body:event,headers})).data.status,"IGNORED");
assert.equal((await request("/api/payments/"+p.id,{token:supplier.token})).status,403);
assert.equal((await request("/api/payments/admin")).status,401);
console.log(JSON.stringify({result:"OK",sameKey:"10 réponses, un paiement capturé",differentKeys:"1 succès, 9 conflits",refund:"partiel/rejeu/dépassement/solde",cash:"encaissement et rejeu",webhook:"signé et idempotent",access:"contrôlé"},null,2));

