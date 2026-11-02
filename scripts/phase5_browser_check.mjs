import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile,mkdir} from "node:fs/promises";
import {randomUUID,randomBytes} from "node:crypto";
import os from "node:os";
import path from "node:path";
const base=process.env.FRONTEND_BASE||"http://127.0.0.1:5500/frontend",apiBase=process.env.API_BASE||"http://localhost:8087",password=process.env.DEMO_PASSWORD;
assert.ok(password,"Exporter DEMO_PASSWORD.");
const require=createRequire(path.join(os.tmpdir(),"atlas-phase1-browser-tools","package.json"));
const {chromium}=require("playwright-core");
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
const checks=[];
async function session(email,area,{blockChart=false}={}){
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}});
 await context.addInitScript(api=>{window.APP_CONFIG={apiBase:api};},apiBase);
 if(blockChart)await context.route("**/chart.js@4.4.8/**",r=>r.abort());
 const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/connexion.html",{waitUntil:"networkidle"});
 await page.locator("#login-email").fill(email);await page.locator("#login-password").fill(password);await page.locator("#login-form button[type=submit]").click();
 await page.waitForURL("**/"+area+"/index.html**");
 await page.goto(base+"/"+area+"/index.html?page=dashboard&period=30d",{waitUntil:"networkidle"});await page.locator(".st-kpi-value").first().waitFor();
 return{context,page,errors};
}
try{
 const admin=await session("omar.tazi@atlasvoyage.ma","admin"),page=admin.page;
 await page.waitForFunction(()=>window.Chart&&Object.keys(Chart.instances).length===3);
 assert.equal(await page.locator(".st-period[aria-pressed=true]").textContent(),"30 jours");
 for(const period of ["7d","12m","30d"]){
  await page.locator('[data-period="'+period+'"]').click();await page.waitForFunction(()=>!document.querySelector('.st-dashboard [aria-busy="true"]'));
  await page.waitForFunction(()=>Object.keys(Chart.instances).length===3);assert.equal(new URL(page.url()).searchParams.get("period"),period);
 }
 const downloadEvent=page.waitForEvent("download");await page.getByRole("button",{name:"Exporter réservations (CSV)",exact:true}).click();
 const download=await downloadEvent,bytes=await readFile(await download.path());assert.deepEqual([...bytes.subarray(0,3)],[239,187,191]);
 checks.push("Admin réel : trois graphiques, périodes sans fuite, CSV authentifié avec BOM");
 // Une réponse tardive de 7d ne doit pas remplacer 12m.
 await page.route("**/api/stats/admin?period=7d",async route=>{const response=await route.fetch();await new Promise(resolve=>setTimeout(resolve,800));await route.fulfill({response}).catch(()=>{});});
 await page.locator('[data-period="7d"]').click();await page.locator('[data-period="12m"]').click();
 await page.waitForFunction(()=>!document.querySelector('.st-dashboard [aria-busy="true"]')&&Object.values(Chart.instances).some(c=>c.config.type==="bar"&&c.data.labels.length===12));
 assert.equal(await page.locator('.st-period[aria-pressed="true"]').textContent(),"12 mois");await page.unroute("**/api/stats/admin?period=7d");
 await page.route("**/api/stats/admin?period=*",route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({message:"Erreur de contrôle"})}));
 await page.getByRole("button",{name:"Actualiser",exact:true}).click();await page.locator(".st-dashboard").getByText("Statistiques indisponibles",{exact:true}).first().waitFor();
 await page.unroute("**/api/stats/admin?period=*");await page.getByRole("button",{name:"Réessayer",exact:true}).first().click();await page.locator(".st-kpi-value").first().waitFor();
 // Injection dans une réponse de test : aucun HTML ne doit être interprété.
 await page.route("**/api/stats/admin?period=*",async route=>{const response=await route.fetch(),data=await response.json();if(data.topOffers[0])data.topOffers[0].title='<img src=x onerror="window.statsXss=true">';await route.fulfill({response,json:data});});
 await page.getByRole("button",{name:"Actualiser",exact:true}).click();await page.getByText('<img src=x onerror="window.statsXss=true">',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.statsXss),undefined);await page.unroute("**/api/stats/admin?period=*");
 await page.evaluate(()=>StatsUI.dispose());assert.equal(await page.evaluate(()=>Object.keys(Chart.instances).length),0);
 checks.push("Réponse obsolète ignorée, erreur/réessai et protection XSS, destruction des graphiques");
 const supplier=await session("karim.idrissi@atlasvoyage.ma","supplier");
 await supplier.page.waitForFunction(()=>window.Chart&&Object.keys(Chart.instances).length===1);
 assert.match(await supplier.page.locator('.st-heading h1').textContent(),/Karim/);
 await supplier.page.goto(base+"/supplier/index.html?page=inventory&offerId=1",{waitUntil:"networkidle"});
 await supplier.page.waitForFunction(()=>document.querySelector("#inventory-count")?.textContent.includes("affich"));assert.ok(await supplier.page.locator("#inventory-body tr").count()<=1);
 await supplier.page.locator("#inventory-reset").click();assert.equal(new URL(supplier.page.url()).searchParams.has("offerId"),false);
 checks.push("Fournisseur : nom réel, graphique six mois, lien disponibilités filtré et réinitialisation");
 const agent=await session("nadia.elfassi@atlasvoyage.ma","agent");await agent.page.getByText("Bientôt disponible",{exact:true}).waitFor();
 const client=await session("sarah.benali@example.com","client");assert.ok(await client.page.locator(".st-kpi-value").count()>=4);
 assert.equal(await client.page.locator(".offer-grid").count(),0);checks.push("Agent et client : listes réelles, tickets indisponibles, aucun catalogue client ajouté");
 if(process.env.STATS_ISOLATED_TEST==="1"){
  const response=await fetch(apiBase+"/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName:"Client vide",email:"stats-browser-"+randomUUID()+"@test.ma",password:"Voyage!1aA"+randomBytes(18).toString("base64url")})});
  assert.equal(response.status,201);const fresh=await response.json(),context=await browser.newContext();
  await context.addInitScript(({api,session})=>{window.APP_CONFIG={apiBase:api};sessionStorage.setItem("atlas-token",session.token);sessionStorage.setItem("atlas-user",JSON.stringify(session.user));},{api:apiBase,session:fresh});
  const empty=await context.newPage();await empty.goto(base+"/client/index.html?page=dashboard",{waitUntil:"networkidle"});
  await empty.getByText("Aucune réservation sur cette période.",{exact:true}).waitFor();
  await empty.getByRole("link",{name:"Découvrir les offres",exact:true}).waitFor();checks.push("Vrai compte vide : zéro réservation, prochain voyage vide et lien catalogue public");
 }
 const fallback=await session("omar.tazi@atlasvoyage.ma","admin",{blockChart:true});
 await fallback.page.locator(".st-charts").getByText("Le graphique est indisponible.",{exact:false}).first().waitFor();assert.equal(await fallback.page.locator(".st-kpi-value").count(),6);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>StatsUI.mount(document.getElementById("stats-module"),"ADMIN"));await page.locator(".st-kpi-value").first().waitFor();
 assert.ok(await page.evaluate(()=>document.querySelector('.st-kpis').getBoundingClientRect().width<=390));
 await mkdir("backend/target/phase5-browser",{recursive:true});await page.screenshot({path:"backend/target/phase5-browser/admin-mobile.png",fullPage:true});
 for(const [area,s]of [["supplier",supplier],["agent",agent],["client",client]]){
  await s.page.setViewportSize({width:390,height:844});
  await s.page.goto(base+"/"+area+"/index.html?page=dashboard",{waitUntil:"networkidle"});await s.page.locator(".st-kpi-value").first().waitFor();
  assert.ok(await s.page.evaluate(()=>document.querySelector('.st-kpis').getBoundingClientRect().width<=390),area+" mobile");
  await s.page.screenshot({path:"backend/target/phase5-browser/"+area+"-mobile.png",fullPage:true});
 }
 for(const s of [admin,supplier,agent,client,fallback])assert.deepEqual(s.errors,[],"Console JavaScript");
 checks.push("CDN bloqué : repli local sans perte des KPI ; affichage mobile et consoles sans erreur");
 console.log(JSON.stringify({result:"OK",checks},null,2));
}finally{await browser.close();}
