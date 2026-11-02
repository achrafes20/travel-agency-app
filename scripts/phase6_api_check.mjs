import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
assert.equal(process.env.PROFILE_ISOLATED_TEST,"1","Ce contrôle modifie des fixtures ; utiliser une base isolée.");
const base=process.env.API_BASE||"http://localhost:8088",password=process.env.DEMO_PASSWORD,logPath=process.env.ACCOUNT_MAIL_LOG||"backend/target-phase6-empty-final.log";
assert.ok(password,"Exporter DEMO_PASSWORD.");
async function call(route,{method="GET",token,body,form}={}){
 const response=await fetch(base+route,{method,headers:{...(token?{Authorization:"Bearer "+token}:{}),...(!form&&body?{"Content-Type":"application/json"}:{})},...(form?{body:form}:body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json();}catch{}return{status:response.status,data,headers:response.headers};
}
async function login(email,passwordValue=password){const r=await call("/api/auth/login",{method:"POST",body:{email,password:passwordValue}});assert.equal(r.status,200,email);return r.data;}
const admin=await login("omar.tazi@atlasvoyage.ma"),supplier=await login("karim.idrissi@atlasvoyage.ma"),other=await login("vols@atlasvoyage.ma"),agent=await login("nadia.elfassi@atlasvoyage.ma"),sarah=await login("sarah.benali@example.com");
for(const s of [admin,supplier,other,agent,sarah])assert.equal(s.user.emailVerified,true);
const checks=["Comptes démo et mot de passe historique préservés"];
const email="phase6-"+randomUUID()+"@test.ma",registered=await call("/api/auth/register",{method:"POST",body:{fullName:"Profil réel",email,password:"Atlas!Voyage2026Secure"}});assert.equal(registered.status,201);let client=registered.data;assert.equal(client.user.emailVerified,false);
async function mailToken(subject){
 const escaped=email.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 for(let i=0;i<80;i++){
  const log=await readFile(logPath,"utf8");const pattern=new RegExp("DEV ACCOUNT MAIL to="+escaped+" subject="+subject+"[\\s\\S]*?token=([A-Za-z0-9_-]{43})","g");const matches=[...log.matchAll(pattern)];if(matches.length)return matches.at(-1)[1];await new Promise(r=>setTimeout(r,50));
 }throw new Error("Lien de test absent du journal de développement");
}
const verify=await mailToken("Vérifiez votre adresse e-mail");assert.equal((await call("/api/auth/verify-email",{method:"POST",body:{token:verify}})).status,200);assert.equal((await call("/api/auth/verify-email",{method:"POST",body:{token:verify}})).status,400);
const fixture=await readFile("backend/src/test/resources/images/atlas-fixture.webp");
async function upload(session,purpose){const form=new FormData();form.append("file",new Blob([fixture],{type:"application/octet-stream"}),"../../photo.jpg.php");const r=await call("/api/files/images?purpose="+purpose,{method:"POST",token:session.token,form});assert.equal(r.status,201,JSON.stringify(r.data));return r.data;}
const avatar=await upload(client,"AVATAR");const updated=await call("/api/auth/profile",{method:"PUT",token:client.token,body:{fullName:"Nom <img src=x onerror=alert(1)>",phone:"+212 6 12 34 56 78",country:"MA",avatarUrl:avatar.url}});assert.equal(updated.status,200);assert.equal(updated.data.phone,"+212612345678");assert.equal(updated.data.avatarUrl,avatar.url);assert.ok(!("tokenVersion"in updated.data)&&!("password"in updated.data));
assert.equal((await call("/api/auth/profile",{method:"PUT",token:client.token,body:{fullName:"Nom",email:"other@test.ma"}})).data.code,"EMAIL_NOT_EDITABLE");
assert.equal((await call("/api/auth/profile",{method:"PUT",token:sarah.token,body:{fullName:"Autre",avatarUrl:avatar.url}})).status,400);
const publicImage=await fetch(avatar.url);assert.equal(publicImage.status,200);assert.equal(publicImage.headers.get("x-content-type-options"),"nosniff");assert.match(publicImage.headers.get("cache-control"),/immutable/);
assert.equal((await call("/api/files/"+avatar.id,{method:"DELETE",token:client.token})).status,409);
const company=(await call("/api/suppliers/me/profile",{token:supplier.token})).data,logo=await upload(supplier,"SUPPLIER_LOGO");assert.ok(company.companyName);
const companyUpdate=await call("/api/suppliers/me/profile",{method:"PUT",token:supplier.token,body:{companyName:company.companyName,cityId:company.city.id,ice:"123456789012345",legalForm:"SARL",logoUrl:logo.url,address:"Adresse de contrôle",contactPhone:"+212612345678"}});assert.equal(companyUpdate.status,200);
assert.equal((await call("/api/suppliers/"+supplier.user.id+"/profile",{token:other.token})).status,403);assert.equal((await call("/api/suppliers/"+supplier.user.id+"/profile",{token:admin.token})).status,200);
const images=[];for(let i=0;i<5;i++)images.push(await upload(supplier,"OFFER_IMAGE"));
const offerBody={type:"HOTEL",title:"Offre upload réel "+randomUUID(),cityId:company.city.id,basePrice:200,stars:4,roomType:"Double",active:true,images:images.map(v=>v.url),availabilities:[{startAt:"2026-11-20T00:00:00",endAt:"2027-10-31T23:59:59",capacity:10}]};
const offer=await call("/api/offers",{method:"POST",token:supplier.token,body:offerBody});assert.equal(offer.status,201);assert.deepEqual(offer.data.images,images.map(v=>v.url));assert.equal((await call("/api/offers/"+offer.data.id)).data.images[0],images[0].url);
assert.equal((await call("/api/files/"+images[0].id,{method:"DELETE",token:supplier.token})).status,409);
assert.equal((await call("/api/offers/"+offer.data.id,{method:"PUT",token:supplier.token,body:{...offerBody,images:offerBody.images.slice(1)}})).status,200);
assert.equal((await call("/api/files/"+images[0].id,{method:"DELETE",token:supplier.token})).status,204);
const bad=new FormData();bad.append("file",new Blob(["<svg><script>bad</script></svg>"],{type:"image/jpeg"}),"x.jpg");assert.equal((await call("/api/files/images?purpose=AVATAR",{method:"POST",token:client.token,form:bad})).status,400);
checks.push("Profil persistant, avatar propriétaire et image publique réencodée","Profil fournisseur légal et logo persistants, accès ADMIN contrôlé","Cinq vraies images dans une offre, ordre conservé, détachement/suppression, faux JPEG rejeté");
const old=client.token,changed=await call("/api/auth/change-password",{method:"POST",token:old,body:{currentPassword:"Atlas!Voyage2026Secure",newPassword:"Securite!Voyage2027",confirmNewPassword:"Securite!Voyage2027"}});assert.equal(changed.status,200);client=changed.data;
assert.equal((await call("/api/auth/me",{token:old})).status,401);assert.equal((await call("/api/auth/me",{token:client.token})).status,200);
const known=await call("/api/auth/forgot-password",{method:"POST",body:{email}}),unknown=await call("/api/auth/forgot-password",{method:"POST",body:{email:"missing-"+randomUUID()+"@test.ma"}});assert.equal(known.status,200);assert.deepEqual(known.data,unknown.data);
const reset=await mailToken("Réinitialiser votre mot de passe"),body={token:reset,newPassword:"Nouveau!Voyage2028",confirmNewPassword:"Nouveau!Voyage2028"};assert.equal((await call("/api/auth/reset-password",{method:"POST",body})).status,200);assert.equal((await call("/api/auth/reset-password",{method:"POST",body})).data.code,"INVALID_OR_EXPIRED_TOKEN");assert.equal((await call("/api/auth/me",{token:client.token})).status,401);client=await login(email,"Nouveau!Voyage2028");assert.equal(client.user.fullName,updated.data.fullName);assert.equal(client.user.avatarUrl,avatar.url);
checks.push("E-mail de vérification et lien de reset réellement lus dans les logs dev","Changement/réinitialisation : anciennes sessions révoquées, liens à usage unique, reconnexion et profil conservé");
// Plusieurs écritures ADMIN doivent incrémenter chaque révocation, sans écrasement concurrent.
const concurrentEmail="admin-security-"+randomUUID()+"@test.ma",initial=await call("/api/auth/register",{method:"POST",body:{fullName:"Sécurité concurrente",email:concurrentEmail,password:"Voyage!Initial42"}});assert.equal(initial.status,201);
const passwords=Array.from({length:8},()=>"Voyage!1aA"+randomUUID());
const writes=await Promise.all(passwords.map(password=>call("/api/users/"+initial.data.user.id,{method:"PUT",token:admin.token,body:{fullName:"Sécurité concurrente",email:concurrentEmail,role:"CLIENT",password}})));assert.ok(writes.every(r=>r.status===200));
let finalSession;for(const password of passwords){const r=await call("/api/auth/login",{method:"POST",body:{email:concurrentEmail,password}});if(r.status===200){finalSession=r.data;break;}}assert.ok(finalSession);assert.equal(JSON.parse(Buffer.from(finalSession.token.split(".")[1],"base64url")).tv,8);assert.equal((await call("/api/auth/me",{token:initial.data.token})).status,401);
checks.push("Huit changements ADMIN concurrents : huit révocations conservées et ancien JWT refusé");
console.log(JSON.stringify({result:"OK",checks},null,2));
