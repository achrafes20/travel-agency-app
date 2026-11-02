import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {randomUUID} from "node:crypto";
import os from "node:os";
import path from "node:path";
assert.equal(process.env.NOTIFICATION_ISOLATED_TEST,"1","Ce contrôle crée une offre : utiliser une base isolée.");
const apiBase=process.env.API_BASE||"http://localhost:8086",base=process.env.FRONTEND_BASE||"http://127.0.0.1:5500/frontend",password=process.env.DEMO_PASSWORD;
assert.ok(password,"Exporter DEMO_PASSWORD.");
const require=createRequire(path.join(os.tmpdir(),"atlas-phase1-browser-tools","package.json"));
const {chromium}=require("playwright-core");
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
const checks=[],contexts=[];
async function session(email,area){
 const context=await browser.newContext();contexts.push(context);await context.addInitScript(api=>{
  window.APP_CONFIG={apiBase:api};window.notificationTestTimers=new Set();
  const schedule=window.setTimeout.bind(window),cancel=window.clearTimeout.bind(window);
  window.setTimeout=(callback,delay,...args)=>{const id=schedule(()=>{window.notificationTestTimers.delete(id);callback(...args);},delay);if(delay===30000||delay===60000)window.notificationTestTimers.add(id);return id;};
  window.clearTimeout=id=>{window.notificationTestTimers.delete(id);cancel(id);};
 },apiBase);
 const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/connexion.html",{waitUntil:"networkidle"});await page.locator("#login-email").fill(email);await page.locator("#login-password").fill(password);
 await page.locator("#login-form button[type=submit]").click();await page.waitForURL("**/"+area+"/index.html**");
 await page.goto(base+"/"+area+"/index.html?page=notifications",{waitUntil:"networkidle"});await page.locator(".ntf-preference-form").waitFor();
 assert.equal(await page.locator(".ntf-module").count(),1);return{context,page,errors};
}
try{
 const supplier=await session("karim.idrissi@atlasvoyage.ma","supplier"),page=supplier.page;
 const badge=page.locator("#notification-toggle .ntf-count");await page.waitForFunction(()=>document.querySelector("#notification-toggle .ntf-count")?.textContent!=="");
 const previous=await badge.textContent();
 const adminSession=await fetch(apiBase+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"omar.tazi@atlasvoyage.ma",password})}).then(r=>r.json());
 const fixture=await page.evaluate(async()=>{const offers=await api.get("/api/offers");return api.post("/api/offers",{type:"HOTEL",title:"Vérification cloche "+crypto.randomUUID(),cityId:offers[0].cityId,supplierId:Auth.getUser().id,basePrice:250,stars:3,roomType:"Double",active:true,availabilities:[]});});
 await page.locator("#notification-toggle").click();await page.locator(".ntf-preview-list").waitFor();
 const reason="Modération navigateur "+randomUUID();
 const response=await fetch(apiBase+"/api/offers/"+fixture.id+"/moderation",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+adminSession.token},body:JSON.stringify({active:false,reason})});assert.equal(response.status,200);
 await page.waitForFunction(value=>document.querySelector("#notification-toggle .ntf-count").textContent!==value,previous,{timeout:40000});
 const notice=page.locator(".ntf-preview-list .ntf-open").filter({hasText:reason});await notice.waitFor();assert.equal(await notice.count(),1);
 checks.push("Polling réel : modération admin → compteur et panneau fournisseur actualisés");
 await page.keyboard.press("Escape");assert.equal(await page.locator("#notification-toggle").getAttribute("aria-expanded"),"false");
 assert.equal(await page.evaluate(()=>document.activeElement.id),"notification-toggle");
 await page.locator("#notification-toggle").click();await notice.waitFor();
 const id=await page.evaluate(async reason=>(await api.get("/api/notifications?size=50")).content.find(n=>n.message.includes(reason)).id,reason);
 await notice.click();await page.waitForURL("**/supplier/index.html?page=offers");
 const read=await page.evaluate(async id=>(await api.get("/api/notifications?size=50")).content.find(n=>n.id===id).read,id);assert.equal(read,true);
 checks.push("Navigation et lecture réelle ; fermeture Échap et retour du focus");
 for(const [email,area]of [["sarah.benali@example.com","client"],["nadia.elfassi@atlasvoyage.ma","agent"],["omar.tazi@atlasvoyage.ma","admin"]]){
  const s=await session(email,area),p=s.page;
  const old=await p.locator('[name="offerEmail"]').isChecked();await p.locator('[name="offerEmail"]').setChecked(!old);
  await p.locator('.ntf-preference-form button[type="submit"]').click();await p.locator(".ntf-toast").filter({hasText:"Préférences enregistrées"}).waitFor();
  assert.equal(await p.evaluate(async()=> (await api.get("/api/notifications/preferences")).offerEmail),!old);
  await p.locator('[name="offerEmail"]').setChecked(old);await p.locator('.ntf-preference-form button[type="submit"]').click();
  await p.locator('.ntf-filters select[aria-label="État de lecture"]').selectOption("false");
  await p.waitForFunction(()=>!document.querySelector('.ntf-results [aria-busy="true"]')&&!document.querySelector('.ntf-results .ntf-skeleton'));
  assert.equal(await p.evaluate(()=>NotificationsUI.safeUrl("javascript:alert(1)")),null);
  assert.deepEqual(s.errors,[],area+" console");checks.push(area+" : page réelle, filtre et préférences persistées");
 }
 assert.deepEqual(supplier.errors,[],"supplier console");
 await page.goto(base+"/supplier/index.html?page=notifications",{waitUntil:"networkidle"});
 await page.evaluate(()=>NotificationsUI.stop());assert.equal(await page.evaluate(()=>window.notificationTestTimers.size),0);
 assert.equal(await page.locator('#notification-toggle').getAttribute("aria-expanded"),"false");checks.push("Arrêt explicite du polling sans requête empilée");
 console.log(JSON.stringify({result:"OK",checks},null,2));
}finally{await browser.close();}
