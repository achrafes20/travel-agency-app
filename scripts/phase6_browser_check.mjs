import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile,mkdir} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import os from "node:os";import path from "node:path";
assert.equal(process.env.PROFILE_ISOLATED_TEST,"1","Utiliser une base isolée : ce contrôle crée des images et des comptes.");
const base=process.env.FRONTEND_BASE||"http://127.0.0.1:5500/frontend",apiBase=process.env.API_BASE||"http://localhost:8088",password=process.env.DEMO_PASSWORD,logPath=process.env.ACCOUNT_MAIL_LOG||"backend/target-phase6-empty-final.log";
assert.ok(password,"Exporter DEMO_PASSWORD.");
const require=createRequire(path.join(os.tmpdir(),"atlas-phase1-browser-tools","package.json")),{chromium}=require("playwright-core");
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});const checks=[],sessions=[];
async function session(email,area){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(api=>{window.APP_CONFIG={apiBase:api};},apiBase);const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/connexion.html",{waitUntil:"networkidle"});await page.locator("#login-email").fill(email);await page.locator("#login-password").fill(password);await page.locator('#login-form button[type="submit"]').click();await page.waitForURL("**/"+area+"/index.html**");
 const s={context,page,errors,area};sessions.push(s);return s;
}
const profileUrl=area=>base+"/"+area+"/index.html?page="+(area==="client"?"profil":"profile");
async function logToken(email,subject){const escaped=email.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");for(let i=0;i<60;i++){const contents=await readFile(logPath,"utf8"),matches=[...contents.matchAll(new RegExp("DEV ACCOUNT MAIL to="+escaped+" subject="+subject+"[\\s\\S]*?token=([A-Za-z0-9_-]{43})","g"))];if(matches.length)return matches.at(-1)[1];await new Promise(r=>setTimeout(r,50));}throw new Error("E-mail de développement absent");}
try{
 for(const [email,area]of [["omar.tazi@atlasvoyage.ma","admin"],["nadia.elfassi@atlasvoyage.ma","agent"],["sarah.benali@example.com","client"],["karim.idrissi@atlasvoyage.ma","supplier"]]){
  const s=await session(email,area),p=s.page;await p.goto(profileUrl(area),{waitUntil:"networkidle"});await p.getByRole("tab",{name:area==="supplier"?"Entreprise":"Informations",exact:true}).waitFor();if(area==="supplier")await p.getByRole("tab",{name:"Mon compte",exact:true}).click();
  const original=await p.evaluate(()=>Auth.getUser());await p.getByLabel("Nom complet",{exact:true}).fill(original.fullName+" — navigateur");await p.getByLabel("Téléphone international",{exact:true}).fill("+212 6 11 22 33 44");await p.getByLabel("Pays",{exact:true}).selectOption("MA");
  await p.getByRole("button",{name:"Enregistrer mon profil",exact:true}).click();await p.getByText("Profil enregistré.",{exact:true}).waitFor();await p.reload({waitUntil:"networkidle"});if(area==="supplier")await p.getByRole("tab",{name:"Mon compte",exact:true}).click();await p.getByLabel("Nom complet",{exact:true}).waitFor();assert.equal(await p.getByLabel("Nom complet",{exact:true}).inputValue(),original.fullName+" — navigateur");
  await p.evaluate(async u=>Auth.updateProfile({fullName:u.fullName,phone:u.phone,country:u.country,avatarUrl:u.avatarUrl}),original);
  checks.push(area+" : profil persisté après rechargement, pays/téléphone réels, nom restauré");
 }
 const supplier=sessions.find(s=>s.area==="supplier"),p=supplier.page;
 await p.goto(profileUrl("supplier"),{waitUntil:"networkidle"});await p.getByLabel("ICE — 15 chiffres",{exact:true}).fill("123456789012345");await p.getByLabel("Registre de commerce (RC)",{exact:true}).fill("RC-NAV-2026");
 while(await p.locator('.up-root .up-actions button').filter({hasText:"Supprimer"}).count())await p.locator('.up-root .up-actions button').filter({hasText:"Supprimer"}).first().click();
 await p.locator('.up-root input[type="file"]').setInputFiles({name:"logo.webp",mimeType:"image/webp",buffer:await readFile("backend/src/test/resources/images/atlas-fixture.webp")});
 await p.waitForFunction(()=>document.querySelector('.up-item small')?.textContent==="Téléversée");
 await p.getByRole("button",{name:"Enregistrer le profil fournisseur",exact:true}).click();await p.getByText("Profil fournisseur enregistré.",{exact:true}).waitFor();await p.reload({waitUntil:"networkidle"});await p.getByLabel("Registre de commerce (RC)",{exact:true}).waitFor();assert.equal(await p.getByLabel("Registre de commerce (RC)",{exact:true}).inputValue(),"RC-NAV-2026");
 // Modifier une offre existante couvre l'étape 3 sans fabriquer de critères de vol/hôtel.
 await p.goto(base+"/supplier/index.html?page=offers",{waitUntil:"networkidle"});await p.locator('[data-edit-offer]').first().waitFor();await p.locator('[data-edit-offer]').first().click();
 for(let i=0;i<2;i++){await p.locator("#offer-next").click();await p.waitForFunction(()=>Boolean(document.querySelector("#offer-step-content")));}
 await p.locator("#offer-images-uploader .up-root").waitFor();
 const images=await p.evaluate(()=>{const canvas=document.createElement("canvas");canvas.width=600;canvas.height=400;const g=canvas.getContext("2d");g.fillStyle="#0b3c8f";g.fillRect(0,0,600,400);g.fillStyle="#ffb800";g.fillRect(50,50,200,200);return[canvas.toDataURL("image/png").split(',')[1],canvas.toDataURL("image/jpeg",.9).split(',')[1]];});
 // Les anciennes URL restent conservables. Supprimer les aperçus existants du brouillon.
 while(await p.locator('#offer-images-uploader .up-actions button').filter({hasText:"Supprimer"}).count())await p.locator('#offer-images-uploader .up-actions button').filter({hasText:"Supprimer"}).first().click();
 const files=Array.from({length:5},(_,i)=>({name:"photo-"+i+(i%2?".jpg":".png"),mimeType:i%2?"image/jpeg":"image/png",buffer:Buffer.from(images[i%2],"base64")}));
 await p.locator('#offer-images-uploader input[type="file"]').setInputFiles(files);
 await p.waitForFunction(()=>document.querySelectorAll('#offer-images-uploader .up-item').length===5&&!document.querySelector('#offer-next').disabled&&!document.querySelector('#offer-images-uploader progress'));
 const before=await p.evaluate(()=>state.offerDraft.images.filter(Boolean));await p.getByRole("button",{name:"Monter l’image 2",exact:true}).click();const after=await p.evaluate(()=>state.offerDraft.images.filter(Boolean));assert.equal(after[0],before[1]);
 assert.equal(await p.getByRole("button",{name:"Parcourir les images",exact:true}).isEnabled(),false);
 await p.locator("#offer-next").click();await p.locator("#offer-next").click();await p.waitForURL("**/supplier/index.html?page=offers*");await p.locator('[data-edit-offer]').first().waitFor();
 const saved=await p.evaluate(async first=>{const offers=await api.get("/api/offers");return offers.find(o=>o.images.includes(first));},after[0]);assert.ok(saved);assert.equal(saved.images.length,5);assert.equal(saved.images[0],after[0]);
 const publicPage=await supplier.context.newPage();await publicPage.goto(base+"/offre.html?id="+saved.id,{waitUntil:"networkidle"});assert.ok(await publicPage.locator('img[src="'+saved.images[0]+'"]').count());
 checks.push("Fournisseur : informations légales persistantes, cinq uploads PNG/JPEG réels, limite et ordre, offre publique illustrée");
 const freshEmail="phase6-browser-"+randomUUID()+"@test.ma",freshPassword="Atlas!Voyage2026Secure",context=await browser.newContext();await context.addInitScript(api=>{window.APP_CONFIG={apiBase:api};},apiBase);const fresh=await context.newPage(),errors=[];fresh.on("pageerror",e=>errors.push(e.message));
 await fresh.goto(base+"/connexion.html",{waitUntil:"networkidle"});await fresh.locator("#tab-register").click();await fresh.locator("#register-name").fill("Client navigateur");await fresh.locator("#register-email").fill(freshEmail);await fresh.locator("#register-password").fill(freshPassword);assert.equal(await fresh.locator(".account-rules .valid").count(),8);await fresh.locator('#register-form button[type="submit"]').click();await fresh.waitForURL("**/client/index.html**");await fresh.locator("#account-verification-banner").waitFor();
 const verification=await logToken(freshEmail,"Vérifiez votre adresse e-mail");await fresh.goto(base+"/verification-email.html?token="+verification,{waitUntil:"networkidle"});await fresh.getByText("Votre adresse e-mail est vérifiée.",{exact:true}).waitFor();assert.equal(new URL(fresh.url()).searchParams.has("token"),false);
 await fresh.goto(profileUrl("client"),{waitUntil:"networkidle"});await fresh.getByLabel("Nom complet",{exact:true}).waitFor();let failedOnce=false;
 let uploadAttempt=0,releaseUpload;const pausedUpload=new Promise(resolve=>releaseUpload=resolve);
 await context.route("**/api/files/images?purpose=AVATAR",async route=>{uploadAttempt++;if(uploadAttempt===1){await pausedUpload;return route.abort().catch(()=>{});}if(!failedOnce){failedOnce=true;return route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({message:"Erreur de contrôle"})});}return route.continue();});
 await fresh.locator('.up-root input[type="file"]').setInputFiles({name:"avatar.png",mimeType:"image/png",buffer:Buffer.from(images[0],"base64")});
 await fresh.locator('.up-item progress').waitFor();assert.ok((await fresh.locator('.up-item img').getAttribute('src')).startsWith('blob:'),"Aperçu immédiat avant la réponse serveur");
 await fresh.getByRole("button",{name:"Annuler",exact:true}).click();releaseUpload();await fresh.getByRole("button",{name:"Réessayer",exact:true}).click();
 await fresh.getByText("Erreur de contrôle",{exact:true}).waitFor();await fresh.getByRole("button",{name:"Réessayer",exact:true}).click();await fresh.waitForFunction(()=>document.querySelector('.up-item small')?.textContent==="Téléversée");
 await fresh.getByRole("button",{name:"Enregistrer mon profil",exact:true}).click();await fresh.getByText("Profil enregistré.",{exact:true}).waitFor();assert.ok(await fresh.locator('.account img.account-avatar').count());
 await fresh.getByRole("tab",{name:"Sécurité",exact:true}).click();await fresh.locator('[name="currentPassword"]').fill(freshPassword);await fresh.locator('[name="newPassword"]').fill("Securite!Voyage2027");await fresh.locator('[name="confirmNewPassword"]').fill("Securite!Voyage2027");await fresh.getByRole("button",{name:"Changer le mot de passe",exact:true}).click();await fresh.getByText("Mot de passe modifié. Vos autres sessions sont déconnectées.",{exact:true}).waitFor();
 await fresh.evaluate(()=>Auth.logout());await fresh.waitForURL("**/connexion.html**");await fresh.getByRole("link",{name:"Mot de passe oublié ?",exact:true}).click();await fresh.getByLabel("Votre adresse e-mail",{exact:true}).fill(freshEmail);await fresh.getByRole("button",{name:"Recevoir le lien",exact:true}).click();await fresh.getByText("Si ce compte est disponible, un lien de réinitialisation vous sera envoyé.",{exact:true}).waitFor();
 const reset=await logToken(freshEmail,"Réinitialiser votre mot de passe");await fresh.goto(base+"/reinitialiser-mot-de-passe.html?token="+reset,{waitUntil:"networkidle"});assert.equal(new URL(fresh.url()).searchParams.has("token"),false);await fresh.locator('[name="newPassword"]').fill("Nouveau!Voyage2028");await fresh.locator('[name="confirmNewPassword"]').fill("Nouveau!Voyage2028");await fresh.getByRole("button",{name:"Réinitialiser le mot de passe",exact:true}).click();await fresh.getByText("Votre mot de passe a été réinitialisé. Connectez-vous avec le nouveau mot de passe.",{exact:true}).waitFor();
 await fresh.getByRole("link",{name:"Retour à la connexion",exact:true}).click();await fresh.locator("#login-email").fill(freshEmail);await fresh.locator("#login-password").fill("Nouveau!Voyage2028");await fresh.locator('#login-form button[type="submit"]').click();await fresh.waitForURL("**/client/index.html**");
 checks.push("Inscription : force du mot de passe, bandeau, vérification réelle et token retiré de l’URL","Changement du mot de passe, oubli/reset via e-mail dev et reconnexion réelle");
 await mkdir("backend/target/phase6-browser",{recursive:true});await fresh.goto(profileUrl("client"),{waitUntil:"networkidle"});await fresh.getByLabel("Nom complet",{exact:true}).waitFor();await fresh.screenshot({path:"backend/target/phase6-browser/client-profile.png",fullPage:true});
 for(const s of sessions)assert.deepEqual(s.errors,[],s.area+" console");assert.deepEqual(errors,[],"Nouveau client console");console.log(JSON.stringify({result:"OK",checks},null,2));
}finally{await browser.close();}
