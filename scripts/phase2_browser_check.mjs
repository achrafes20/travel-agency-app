import assert from "node:assert/strict";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
const require = createRequire(path.join(os.tmpdir(), "atlas-phase1-browser-tools", "package.json"));
const { chromium } = require("playwright-core");
const base = process.env.FRONTEND_BASE || "http://127.0.0.1:5500/frontend";
const apiBase = process.env.API_BASE || "http://localhost:8081";
const password = process.env.DEMO_PASSWORD;
assert.ok(password, "Exporter DEMO_PASSWORD");
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
const checks = [];
async function session(email, area) {
 const context = await browser.newContext({acceptDownloads:true});
 await context.addInitScript(api => { window.APP_CONFIG = {apiBase:api}; }, apiBase);
 const page = await context.newPage(), errors = [];
 page.on("pageerror", e => errors.push(e.message));
 await page.goto(base + "/connexion.html", {waitUntil:"networkidle"});
 await page.locator("#login-email").fill(email); await page.locator("#login-password").fill(password);
 await page.locator("#login-form button[type=submit]").click(); await page.waitForURL("**/" + area + "/index.html**");
 return {context,page,errors};
}
try {
 const {context,page,errors} = await session("sarah.benali@example.com", "client");
 // Ce contrôle doit cibler une base de démonstration isolée : il prépare le panier de Sarah.
 await page.evaluate(() => api.delete("/api/cart"));
 await page.goto(base + "/catalogue.html?type=H%C3%B4tels%20%26%20Riads",{waitUntil:"networkidle"});
 assert.ok(await page.locator("form").count()); checks.push("Catalogue réel accessible");
 const available = period => period.capacity > 0 && Date.parse(period.endAt+"Z") > Date.now()+6*86400000;
 const offer = await fetch(apiBase + "/api/offers").then(r => r.json()).then(rows => rows.find(o => o.type === "HOTEL" && o.allowsPayOnArrival && o.availabilities.some(available)));
 assert.ok(offer); const period=offer.availabilities.find(available);
 const from = new Date(Math.max(Date.now()+4*86400000,Date.parse(period.startAt+"Z")+86400000));
 const start = from.toISOString().slice(0,10), endDate = new Date(from); endDate.setDate(endDate.getDate()+1);
 await page.goto(base + "/offre.html?id=" + offer.id,{waitUntil:"networkidle"});
 await page.locator("#start-date").fill(start); await page.locator("#end-date").fill(endDate.toISOString().slice(0,10));
 await page.locator("#book-now").click(); await page.waitForURL("**/client/index.html?page=panier");
 await page.waitForLoadState("networkidle");
 await page.locator('[data-page="checkout"]').click();
 await page.locator('input[value="PAY_ON_ARRIVAL"]').check();
 await page.locator('#booking-module form button[type="submit"]').click();
 await page.waitForURL("**/client/index.html?page=payment&id=*");
 await page.locator('.pm-payment-form form button[type="submit"]').click();
 await page.waitForURL("**/client/index.html?page=confirmation&id=*&status=success");
 await page.locator(".bk-detail").waitFor();
 const ref = await page.locator(".bk-detail h2").textContent(), id = new URL(page.url()).searchParams.get("id");
 assert.match(ref,/BK-\d{4}-\d{6}/); assert.match(await page.locator(".bk-detail").textContent(),/Confirmée/);
 checks.push("Catalogue → panier → checkout → confirmation : " + ref);
 const downloadPromise = page.waitForEvent("download"); await page.locator('[data-bk-action="voucher"]').click(); const download=await downloadPromise;assert.equal(download.suggestedFilename(),ref+".pdf"); checks.push("Voucher PDF téléchargé");
 await page.goto(base + "/client/index.html?page=reservations",{waitUntil:"networkidle"});
 await page.locator('.bk-results [data-bk-id="'+id+'"]').click(); await page.locator(".bk-dialog .bk-detail").waitFor();
 await page.locator('[data-bk-action="cancel"]').click(); await page.locator('.bk-dialog form button[type="submit"]').click();
 await page.waitForFunction(() => [...document.querySelectorAll(".bk-detail .bk-badge")].some(el => el.textContent === "Annulée"));
 checks.push("Annulation client et actualisation du détail");
 assert.deepEqual(errors,[], "Console client"); await context.close();
 for(const [email,area] of [["omar.tazi@atlasvoyage.ma","admin"],["nadia.elfassi@atlasvoyage.ma","agent"],["karim.idrissi@atlasvoyage.ma","supplier"],["vols@atlasvoyage.ma","supplier"],["voitures@atlasvoyage.ma","supplier"],["transferts@atlasvoyage.ma","supplier"],["excursions@atlasvoyage.ma","supplier"]]){
  const s=await session(email,area);await s.page.goto(base+"/"+area+"/index.html?page=bookings",{waitUntil:"networkidle"});
  await s.page.locator(".bk-results").waitFor();
  await s.page.waitForFunction(()=>!document.querySelector('.bk-results .bk-loading'));
  if(await s.page.locator(".bk-results [data-bk-id]").count()){
   await s.page.locator(".bk-results [data-bk-id]").first().click();await s.page.locator(".bk-dialog .bk-detail").waitFor();
   if(area==="supplier"){assert.match(await s.page.locator(".bk-detail").textContent(),/uniquement vos prestations/);assert.equal(await s.page.locator('[data-bk-action="voucher"]').count(),0);}
  }else{assert.ok(await s.page.locator('.bk-results .bk-empty').count(),"État vide de réservation explicite");}
  assert.deepEqual(s.errors,[],email);checks.push(area+" : liste et détail "+email);await s.context.close();
 }
 console.log(JSON.stringify({result:"OK",checks},null,2));
} finally { await browser.close(); }

