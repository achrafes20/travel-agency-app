import assert from "node:assert/strict";
import {createRequire} from "node:module";
import os from "node:os";
import path from "node:path";
assert.equal(process.env.PAYMENT_ISOLATED_TEST,"1","Ce contrôle prépare le panier de Sarah : utiliser une base isolée.");
const base=process.env.FRONTEND_BASE||"http://127.0.0.1:5500/frontend",apiBase=process.env.API_BASE||"http://localhost:8084",password=process.env.DEMO_PASSWORD;
assert.ok(password,"Exporter DEMO_PASSWORD.");
const require=createRequire(path.join(os.tmpdir(),"atlas-phase1-browser-tools","package.json"));
const {chromium}=require("playwright-core");
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
const checks=[],contexts=[];
async function session(email,area){
 const context=await browser.newContext({acceptDownloads:true});contexts.push(context);
 await context.addInitScript(api=>{window.APP_CONFIG={apiBase:api};},apiBase);
 const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/connexion.html",{waitUntil:"networkidle"});await page.locator("#login-email").fill(email);await page.locator("#login-password").fill(password);
 await page.locator("#login-form button[type=submit]").click();await page.waitForURL("**/"+area+"/index.html**");return {context,page,errors};
}
try{
 const client=await session("sarah.benali@example.com","client"),page=client.page;
 await page.evaluate(()=>api.delete("/api/cart"));
 const posts=[];page.on("request",request=>{
  if(request.method()==="POST"&&request.url()===apiBase+"/api/payments"){
   const body=request.postDataJSON();
   assert.ok(!Object.keys(body).some(k=>/number|cvv|cvc/i.test(k)),"Champ carte sensible transmis");
   assert.ok(!JSON.stringify(body).includes("4242424242424242"),"PAN transmis");
   posts.push({key:request.headers()["idempotency-key"],body});
  }
 });
 // Chaque exécution crée sa propre disponibilité : les essais précédents ne l'épuisent pas.
 const fixtureSupplier=await fetch(apiBase+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"karim.idrissi@atlasvoyage.ma",password})}).then(r=>r.json());
 const offers=await fetch(apiBase+"/api/offers").then(r=>r.json());
 const fixtureStart=new Date(Date.now()+86400000).toISOString().slice(0,10),fixtureEnd=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
 const fixture=await fetch(apiBase+"/api/offers",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+fixtureSupplier.token},body:JSON.stringify({type:"HOTEL",title:"Parcours navigateur paiement "+Date.now(),supplierId:fixtureSupplier.user.id,cityId:offers[0].cityId,basePrice:1000,stars:4,roomType:"Double",allowsPayOnArrival:true,active:true,availabilities:[{startAt:fixtureStart+"T00:00:00",endAt:fixtureEnd+"T23:59:59",capacity:20}]})});
 assert.equal(fixture.status,201);offers.unshift(await fixture.json());
 const hotel=offers.find(o=>o.type==="HOTEL"&&o.allowsPayOnArrival&&o.availabilities.some(p=>p.capacity>=4&&Date.parse(p.endAt+"Z")>Date.now()+7*86400000));assert.ok(hotel,"Hôtel disponible pour le parcours");
 const period=hotel.availabilities.find(p=>p.capacity>=4&&Date.parse(p.endAt+"Z")>Date.now()+7*86400000);
 const first=new Date(Math.max(Date.now()+3*86400000,Date.parse(period.startAt+"Z")+86400000)),last=new Date(first);last.setUTCDate(last.getUTCDate()+1);
 const start=first.toISOString().slice(0,10),end=last.toISOString().slice(0,10);
 async function prepare(method="ONLINE",throughUi=false){
  if(throughUi){
   await page.goto(base+"/offre.html?id="+hotel.id,{waitUntil:"networkidle"});await page.locator("#start-date").fill(start);await page.locator("#end-date").fill(end);
   await page.locator("#book-now").click();await page.waitForURL("**/client/index.html?page=panier");await page.locator('[data-page="checkout"]').click();
   await page.locator('#booking-module form button[type="submit"]').click();await page.waitForURL("**/client/index.html?page=payment&id=*");
  }else{
   const id=await page.evaluate(async({offerId,start,end,method})=>{
    await api.post("/api/cart/items",{offerId,quantity:1,travelCriteria:JSON.stringify({startDate:start,endDate:end,travelers:1})});
    return (await api.post("/api/bookings",{paymentMethod:method})).id;
   },{offerId:hotel.id,start,end,method});
   await page.goto(base+"/client/index.html?page=payment&id="+id,{waitUntil:"networkidle"});
  }
  await page.locator(".pm-payment-form form").waitFor();return new URL(page.url()).searchParams.get("id");
 }
 async function fill(number){
  await page.locator("[data-card-name]").fill("CLIENT TEST");await page.locator("[data-card-number]").fill(number);
  await page.locator("[data-card-exp]").fill("12/30");await page.locator("[data-card-cvc]").fill("123");
 }
 async function submit(){await page.locator('.pm-payment-form form [type="submit"]').click();}
 async function result(id){return page.evaluate(id=>api.get("/api/payments?bookingId="+id),id);}
 const firstId=await prepare("ONLINE",true);await fill("4242 4242 4242 4242");await submit();await page.waitForURL("**/client/index.html?page=confirmation&id=*&status=success");
 await page.locator(".pm-receipt .bk-PAID").waitFor();const paid=(await result(firstId)).at(-1);assert.equal(paid.status,"PAID");
 assert.ok(await page.getByText("MODE SANDBOX — aucun débit réel",{exact:true}).count());checks.push("Panier → réservation → carte sandbox → confirmation réelle");
 const download=page.waitForEvent("download");await page.locator('[data-bk-action="voucher"]').click();assert.match((await download).suggestedFilename(),/BK-[0-9]{4}-[0-9]{6}\.pdf/);checks.push("Voucher confirmé");
 const failedId=await prepare();await fill("4000 0000 0000 0002");await submit();await page.locator(".pm-recent .bk-FAILED").waitFor();
 assert.equal(await page.locator("[data-card-number]").inputValue(),"");assert.equal(await page.locator("[data-card-cvc]").inputValue(),"");
 await page.locator(".pm-new-attempt").click();await fill("4242 4242 4242 4242");await submit();await page.waitForURL("**/client/index.html?page=confirmation&id=*&status=success");checks.push("Refus puis nouvelle tentative ; champs sensibles effacés");
 const retryId=await prepare();let firstRequest=true;
 await page.route("**/api/payments",async route=>{
  if(route.request().method()==="POST"&&firstRequest){firstRequest=false;await route.fetch();await route.abort("failed");}else await route.continue();
 });
 await fill("4242 4242 4242 4242");await submit();await page.getByText("Réessayer la même demande",{exact:true}).waitFor();
 const retryKey=posts.at(-1).key;await submit();await page.waitForURL("**/client/index.html?page=confirmation&id=*&status=success");assert.equal(posts.at(-1).key,retryKey);assert.equal((await result(retryId)).length,1);
 await page.unroute("**/api/payments");checks.push("Réponse réseau perdue : même clé, un seul paiement");
 const cashId=await prepare("PAY_ON_ARRIVAL");await submit();await page.waitForURL("**/client/index.html?page=confirmation&id=*&status=success");
 const cash=(await result(cashId)).at(-1);assert.equal(cash.method,"CASH_ON_ARRIVAL");assert.equal(cash.status,"PENDING");
 const staff=await session("nadia.elfassi@atlasvoyage.ma","agent");
 await staff.page.goto(base+"/agent/index.html?page=payments",{waitUntil:"networkidle"});
 await staff.page.locator('.bk-filters [name="search"]').fill(cash.bookingReference);await staff.page.locator(".bk-filters").evaluate(form=>form.requestSubmit());
 await staff.page.locator("[data-payment]").first().click();await staff.page.locator(".pm-collect").click();
 const collection=staff.page.locator("dialog form").last();assert.equal(await collection.locator('[name="amount"]').getAttribute("readonly"),"");
 await collection.locator('[name="reason"]').fill("Encaissement de contrôle");await collection.locator('[type="submit"]').click();await staff.page.locator(".pm-drawer .bk-PAID").waitFor();
 await staff.page.locator(".bk-close").click();await staff.page.locator('[data-scope="cash-history"]').click();await staff.page.locator(".pm-results tbody tr").waitFor();checks.push("Agent : encaissement réel et historique");
 const admin=await session("omar.tazi@atlasvoyage.ma","admin");
 await admin.page.goto(base+"/admin/index.html?page=payments",{waitUntil:"networkidle"});await admin.page.locator('.bk-filters [name="search"]').fill(paid.bookingReference);
 await admin.page.locator(".bk-filters").evaluate(form=>form.requestSubmit());await admin.page.locator("[data-payment]").first().click();await admin.page.locator(".pm-refund").click();
 let refund=admin.page.locator("dialog form").last();await refund.locator('[name="amount"]').fill("25.00");await refund.locator('[name="reason"]').fill("Remboursement partiel de contrôle");await refund.locator('[type="submit"]').click();
 await admin.page.locator(".pm-drawer .bk-PARTIALLY_REFUNDED").waitFor();await admin.page.locator(".pm-refund").click();refund=admin.page.locator("dialog form").last();
 await refund.locator('[name="reason"]').fill("Solde du remboursement");await refund.locator('[type="submit"]').click();await admin.page.locator(".pm-drawer .bk-REFUNDED").waitFor();checks.push("Admin : remboursement partiel puis total, événements affichés");
 const supplier=await session("karim.idrissi@atlasvoyage.ma","supplier");
 await supplier.page.goto(base+"/supplier/index.html?page=bookings",{waitUntil:"networkidle"});
 await supplier.page.locator('.bk-filters [name="search"]').fill(cash.bookingReference);await supplier.page.locator(".bk-filters").evaluate(form=>form.requestSubmit());
 await supplier.page.locator("[data-bk-id]").first().click();await supplier.page.locator(".bk-detail .bk-PAID").waitFor();
 assert.equal(await supplier.page.locator(".pm-receipt").count(),0);checks.push("Fournisseur : statut réel, aucune donnée carte");
 for(const s of [client,staff,admin,supplier])assert.deepEqual(s.errors,[],"Aucune erreur JavaScript");
 console.log(JSON.stringify({result:"OK",checks},null,2));
}finally{for(const context of contexts)await context.close();await browser.close();}

