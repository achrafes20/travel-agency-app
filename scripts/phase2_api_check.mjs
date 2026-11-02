import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
assert.equal(process.env.BOOKING_ISOLATED_TEST,"1","Ce test crée des comptes/offres : utiliser une base isolée et BOOKING_ISOLATED_TEST=1.");
const base=process.env.API_BASE||"http://localhost:8081", demo=process.env.DEMO_PASSWORD;
assert.ok(demo,"DEMO_PASSWORD requis");
async function call(path,{token,method="GET",body}={}){
 const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>null);return {status:response.status,data};
}
const login=await call("/api/auth/login",{method:"POST",body:{email:"karim.idrissi@atlasvoyage.ma",password:demo}});assert.equal(login.status,200);
const supplier=login.data, catalogue=(await call("/api/offers")).data, cityId=catalogue[0].cityId;
const start=new Date();start.setDate(start.getDate()+7);const finish=new Date(start);finish.setDate(finish.getDate()+1);
const from=start.toISOString().slice(0,10),to=finish.toISOString().slice(0,10);
async function offer(capacity){
 const r=await call("/api/offers",{token:supplier.token,method:"POST",body:{type:"HOTEL",title:"Contrôle concurrence "+randomUUID(),cityId,supplierId:supplier.user.id,basePrice:100,stars:4,roomType:"Double",allowsPayOnArrival:true,active:true,availabilities:[{startAt:from+"T00:00:00",endAt:to+"T23:59:59",capacity}]}});
 assert.equal(r.status,201,JSON.stringify(r.data));return r.data;
}
const clients=[];
for(let i=0;i<8;i++){
 const r=await call("/api/auth/register",{method:"POST",body:{fullName:"Concurrent "+i,email:"concurrent-"+randomUUID()+"@test.ma",password:"Voyage!1aA"+randomBytes(18).toString("base64url")}});
 assert.equal(r.status,201,JSON.stringify(r.data));clients.push(r.data);
}
async function prepare(o){
 for(const c of clients){
  await call("/api/cart",{token:c.token,method:"DELETE"});
  const r=await call("/api/cart/items",{token:c.token,method:"POST",body:{offerId:o.id,quantity:1,travelCriteria:JSON.stringify({startDate:from,endDate:to,travelers:1})}});
  assert.equal(r.status,200,JSON.stringify(r.data));
 }
}
const one=await offer(1);await prepare(one);
const results=await Promise.all(clients.map(c=>call("/api/bookings",{token:c.token,method:"POST",body:{paymentMethod:"ONLINE"}})));
assert.equal(results.filter(r=>r.status===201).length,1);
assert.equal(results.filter(r=>r.data.code==="CAPACITY_EXCEEDED").length,7);
assert.equal((await call("/api/offers/"+one.id)).data.availabilities[0].capacity,0);
const winner=results.findIndex(r=>r.status===201);
assert.equal((await call("/api/bookings/"+results[winner].data.id+"/cancel",{token:clients[winner].token,method:"POST",body:{}})).status,200);
assert.equal((await call("/api/offers/"+one.id)).data.availabilities[0].capacity,1);
const many=await offer(8);await prepare(many);
const sequence=await Promise.all(clients.map(c=>call("/api/bookings",{token:c.token,method:"POST",body:{paymentMethod:"ONLINE"}})));
assert.ok(sequence.every(r=>r.status===201),JSON.stringify(sequence.map(r=>({status:r.status,code:r.data.code}))));
const refs=sequence.map(r=>r.data.reference).sort();assert.equal(new Set(refs).size,8);
assert.equal(Number(refs.at(-1).slice(8))-Number(refs[0].slice(8)),7);
assert.equal((await call("/api/offers/"+many.id)).data.availabilities[0].capacity,0);
for(let i=0;i<clients.length;i++)assert.equal((await call("/api/bookings/"+sequence[i].data.id+"/cancel",{token:clients[i].token,method:"POST",body:{}})).status,200);
assert.equal((await call("/api/offers/"+many.id)).data.availabilities[0].capacity,8);
console.log(JSON.stringify({result:"OK",capacityOne:"1 succès / 7 CAPACITY_EXCEEDED",references:refs,restoration:"1/1 et 8/8"},null,2));

