/* Profils et sécurité communs aux quatre espaces ; données insérées par textContent. */
const AccountUI=(()=>{
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const button=(label,cls="account-button")=>{const n=el("button",cls,label);n.type="button";return n;};
 let mounted=null,optionsPromise=null,observer=null;
 const options=()=>optionsPromise||(optionsPromise=api.get("/api/auth/profile-options").catch(e=>{optionsPromise=null;throw e;}));
 function dispose(){if(!mounted)return;mounted.destroyed=true;mounted.uploaders.forEach(u=>u.destroy());mounted=null;}
 function rules(value,email){
  const lower=value.toLocaleLowerCase(),local=(email||"").trim().toLocaleLowerCase().split("@")[0];
  // [respectée, libellé, règle « rare »] : les règles rares ne sont affichées que lorsqu'elles sont violées. Même minimum que le serveur (PasswordPolicy.MIN_LENGTH).
  return [[Array.from(value).length>=12,"12 caractères minimum"],[/\p{Ll}/u.test(value),"Une minuscule"],[/\p{Lu}/u.test(value),"Une majuscule"],[/\p{Nd}/u.test(value),"Un chiffre"],[/[^\p{L}\p{N}\s\p{Cc}]/u.test(value),"Un caractère spécial"],[new TextEncoder().encode(value).length<=72,"Mot de passe trop long (72 octets maximum)",true],[!local||!lower.includes(local),"Ne doit pas contenir votre e-mail",true],[!['password123','12345678','azerty','qwerty','password','1234567890','azerty12345','qwerty12345'].includes(lower)&&!/[\u0000-\u001f\u007f]/.test(value),"Mot de passe trop courant ou caractère interdit",true]];
 }
 function strength(input,email){
  const root=el("div","account-password-help"),meter=el("progress","account-strength"),list=el("ul","account-rules"),alerts=el("ul","account-rule-alerts");
  meter.max=rules("","").filter(r=>!r[2]).length;meter.value=0;meter.setAttribute("aria-label","Force du mot de passe");
  alerts.setAttribute("aria-live","polite");list.id="pw-rules-"+Math.random().toString(36).slice(2,8);input.setAttribute("aria-describedby",list.id);
  root.append(meter,list,alerts);
  // Masqué tant que le champ est vide et sans focus ; un champ rempli garde l'aide visible.
  const sync=()=>{root.hidden=!input.value&&document.activeElement!==input;};
  const update=()=>{
   const values=rules(input.value,typeof email==="function"?email():email),shown=values.filter(v=>!v[2]);
   meter.value=shown.filter(v=>v[0]).length;
   list.replaceChildren(...shown.map(([valid,label])=>{const li=el("li",valid?"valid":"");li.append(el("span","account-sr",valid?"Respectée : ":"À respecter : "),label);return li;}));
   alerts.replaceChildren(...values.filter(v=>v[2]&&!v[0]).map(v=>el("li","",v[1])));
   sync();
  };
  input.addEventListener("input",update);input.addEventListener("focus",sync);input.addEventListener("blur",sync);update();return root;
 }
 function field(label,name,value="",type="text"){
  const wrap=el("label","account-field"),control=el(type==="textarea"?"textarea":"input");if(type!=="textarea")control.type=type;control.name=name;control.value=value??"";wrap.append(el("span","",label),control);return{wrap,input:control};
 }
 function passwordField(label,name){
  const f=field(label,name,"","password"),line=el("div","account-password-line"),toggle=button("Afficher","up-action");
  toggle.setAttribute("aria-label","Afficher ou masquer "+label.toLowerCase());toggle.onclick=()=>{f.input.type=f.input.type==="password"?"text":"password";toggle.textContent=f.input.type==="password"?"Afficher":"Masquer";};line.append(f.input,toggle);f.wrap.append(line);f.input.autocomplete=name==="currentPassword"?"current-password":"new-password";f.input.required=true;return f;
 }
 function status(root,text,error=false){root.textContent=text;root.className="account-message "+(error?"error":"success");}
 function security(root,user){
  const card=el("section","account-card"),form=el("form"),message=el("p","account-message"),current=passwordField("Mot de passe actuel","currentPassword"),next=passwordField("Nouveau mot de passe","newPassword"),confirm=passwordField("Confirmer le nouveau mot de passe","confirmNewPassword"),submit=button("Changer le mot de passe");submit.type="submit";message.setAttribute("role","status");
  card.append(el("h2","","Sécurité du compte"),el("p","",user.passwordChangedAt?"Dernière modification : "+new Date(user.passwordChangedAt+"Z").toLocaleString("fr-FR"):"Aucun changement de mot de passe enregistré."));
  form.append(current.wrap,next.wrap,strength(next.input,user.email),confirm.wrap,submit,message);form.onsubmit=async event=>{
   event.preventDefault();message.textContent="";if(next.input.value!==confirm.input.value){status(message,"Les mots de passe ne correspondent pas.",true);return;}if(rules(next.input.value,user.email).some(v=>!v[0])){status(message,"Respectez toutes les règles du mot de passe.",true);return;}
   submit.disabled=true;try{const response=await Auth.changePassword({currentPassword:current.input.value,newPassword:next.input.value,confirmNewPassword:confirm.input.value});Object.assign(user,response.user);card.querySelector("p").textContent="Dernière modification : "+new Date(user.passwordChangedAt+"Z").toLocaleString("fr-FR");form.reset();next.input.dispatchEvent(new Event("input"));status(message,"Mot de passe modifié. Vos autres sessions sont déconnectées.");}catch(e){status(message,e.message,true);}finally{submit.disabled=false;}
  };card.append(form);root.append(card);
 }
 function personal(root,user,settings,owner){
  const card=el("section","account-card"),form=el("form"),grid=el("div","account-grid"),message=el("p","account-message"),name=field("Nom complet","fullName",user.fullName),phone=field("Téléphone international","phone",user.phone,"tel"),email=field("Adresse e-mail (non modifiable)","email",user.email,"email");
  name.input.required=true;name.input.minLength=2;name.input.maxLength=100;email.input.disabled=true;email.input.title="L’adresse e-mail est liée à l’identité du compte et ne peut pas être modifiée ici.";
  const country=el("label","account-field"),select=el("select");select.name="country";select.setAttribute("aria-label","Pays");country.append(el("span","","Pays"),select);const blank=el("option","","Non renseigné");blank.value="";select.append(blank);
  settings.countries.forEach(c=>{const item=el("option","",c.name);item.value=c.code;select.append(item);});select.value=user.country||"";grid.append(name.wrap,phone.wrap,country,email.wrap);
  const avatar=el("div"),submit=button("Enregistrer mon profil");submit.type="submit";let avatarUrl=user.avatarUrl||null;
  const uploader=Uploader.createUploader({container:avatar,purpose:"AVATAR",max:1,initial:avatarUrl?[avatarUrl]:[],onChange:(urls,meta)=>{avatarUrl=urls[0]||null;submit.disabled=meta.busy;}});owner.uploaders.push(uploader);
  form.append(grid,el("h3","","Photo de profil"),avatar,submit,message);form.onsubmit=async event=>{event.preventDefault();if(uploader.isBusy())return;submit.disabled=true;try{Object.assign(user,await Auth.updateProfile({fullName:name.input.value,phone:phone.input.value,country:select.value,avatarUrl}));status(message,"Profil enregistré.");}catch(e){status(message,e.message,true);}finally{submit.disabled=false;}};
  card.append(el("h2","","Mes informations"),form);root.append(card);
 }
 function preferences(root, user) {
  const card = el("section", "account-card"), form = el("form"), grid = el("div", "account-grid"), message = el("p", "account-message");
  const langWrap = el("label", "account-field"), langSelect = el("select");
  langSelect.name = "preferredLanguage";
  langSelect.setAttribute("aria-label", "Langue de l'interface");
  langWrap.append(el("span", "", "Langue de l'interface"), langSelect);
  [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "ar", label: "العربية" }
  ].forEach(l => {
    const opt = el("option", "", l.label);
    opt.value = l.code;
    langSelect.append(opt);
  });
  langSelect.value = user.preferredLanguage || (window.I18n ? window.I18n.lang : "fr");

  const curWrap = el("label", "account-field"), curSelect = el("select");
  curSelect.name = "preferredCurrency";
  curSelect.setAttribute("aria-label", "Devise d'affichage");
  curWrap.append(el("span", "", "Devise d'affichage (indicative)"), curSelect);
  [
    { code: "MAD", label: "MAD — Dirham marocain (Paiements)" },
    { code: "EUR", label: "EUR — Euro (€)" },
    { code: "USD", label: "USD — Dollar ($)" },
    { code: "GBP", label: "GBP — Livre sterling (£)" }
  ].forEach(c => {
    const opt = el("option", "", c.label);
    opt.value = c.code;
    curSelect.append(opt);
  });
  curSelect.value = user.preferredCurrency || (window.AtlasCurrency ? window.AtlasCurrency.getCurrency() : "MAD");

  grid.append(langWrap, curWrap);

  const hint = el("p", "account-hint", "Atlas Voyage traite tous les paiements réels en Dirhams marocains (MAD). Le choix d'une autre devise convertit les montants à titre indicatif selon le taux du jour.");
  hint.style.fontSize = "0.85rem";
  hint.style.color = "var(--av-color-text-subtle, #64748b)";
  hint.style.margin = "12px 0";

  const submit = button("Enregistrer mes préférences");
  submit.type = "submit";
  form.append(grid, hint, submit, message);

  form.onsubmit = async event => {
    event.preventDefault();
    submit.disabled = true;
    try {
      const newLang = langSelect.value;
      const newCur = curSelect.value;
      const res = await api.put("/api/users/me/preferences", { preferredLanguage: newLang, preferredCurrency: newCur });
      user.preferredLanguage = res.preferredLanguage || newLang;
      user.preferredCurrency = res.preferredCurrency || newCur;
      if (window.I18n && window.I18n.lang !== newLang) {
        await window.I18n.setLanguage(newLang);
      }
      if (window.AtlasCurrency && window.AtlasCurrency.getCurrency() !== newCur) {
        window.AtlasCurrency.setCurrency(newCur);
      }
      status(message, "Préférences enregistrées avec succès.");
    } catch (e) {
      status(message, e.message, true);
    } finally {
      submit.disabled = false;
    }
  };

  card.append(el("h2", "", "Langue et devise"), form);
  root.append(card);
 }
 function citySelector(initial){
  const f=field("Ville (sélectionnez une suggestion)","cityName",initial?.name),datalist=el("datalist"),hint=el("small","","Recherche mondiale via Open-Meteo"),id="account-cities-"+crypto.randomUUID();
  datalist.id=id;f.input.setAttribute("list",id);f.input.autocomplete="off";f.input.required=true;f.wrap.append(datalist,hint);
  let selected=initial||null,suggestions=[],timer,controller;
  f.input.oninput=()=>{selected=null;clearTimeout(timer);controller?.abort();if(f.input.value.trim().length<2)return;
   timer=setTimeout(async()=>{controller=new AbortController();try{const response=await fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(f.input.value.trim())+"&count=8&language=fr&format=json",{signal:controller.signal});if(!response.ok)throw new Error("Service de villes indisponible");const data=await response.json();suggestions=data.results||[];datalist.replaceChildren(...suggestions.map(c=>{const option=el("option");option.value=c.name+" — "+[c.admin1,c.country].filter(Boolean).join(", ");return option;}));hint.textContent=suggestions.length?"Sélectionnez une suggestion dans la liste.":"Aucune ville trouvée.";}catch(e){if(e.name!=="AbortError")hint.textContent="Recherche indisponible. Réessayez dans quelques instants.";}},300);
  };
  f.input.onchange=()=>{const match=suggestions.find(c=>f.input.value===c.name+" — "+[c.admin1,c.country].filter(Boolean).join(", "));if(match){selected={name:match.name,latitude:match.latitude,longitude:match.longitude};hint.textContent="Ville sélectionnée : "+match.name;}};
  return{wrap:f.wrap,value:()=>selected,destroy(){clearTimeout(timer);controller?.abort();}};
 }
 function company(root,profile,owner){
  const card=el("section","account-card"),form=el("form"),grid=el("div","account-grid"),message=el("p","account-message");
  const fields={};for(const [key,label,type]of [["companyName","Raison sociale","text"],["contactPhone","Téléphone de contact","tel"],["address","Adresse","text"],["description","Description","textarea"],["legalForm","Forme juridique","text"],["registrationNumber","Registre de commerce (RC)","text"],["ice","ICE — 15 chiffres","text"],["taxId","Identifiant fiscal (IF)","text"],["legalNotes","Informations légales complémentaires","textarea"]]){const f=field(label,key,profile[key],type);fields[key]=f.input;grid.append(f.wrap);if(key==="companyName")f.input.required=true;if(key==="ice")f.input.pattern="[0-9]{15}";if(type==="textarea")f.input.maxLength=2000;}
  const city=citySelector(profile.city);owner.uploaders.push(city);grid.insertBefore(city.wrap,grid.children[2]);const logo=el("div"),submit=button("Enregistrer le profil fournisseur");submit.type="submit";let logoUrl=profile.logoUrl||null;
  const uploader=Uploader.createUploader({container:logo,purpose:"SUPPLIER_LOGO",max:1,initial:logoUrl?[logoUrl]:[],onChange:(urls,meta)=>{logoUrl=urls[0]||null;submit.disabled=meta.busy;}});owner.uploaders.push(uploader);
  form.append(grid,el("h3","","Logo de l’entreprise"),logo,submit,message);form.onsubmit=async event=>{event.preventDefault();if(uploader.isBusy())return;const place=city.value();if(!place){status(message,"Sélectionnez une ville dans les suggestions.",true);return;}submit.disabled=true;
   try{const payload=Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.value]));Object.assign(payload,{logoUrl,...(place.id?{cityId:place.id}:{cityName:place.name,cityLatitude:place.latitude,cityLongitude:place.longitude})});Object.assign(profile,await api.put("/api/suppliers/me/profile",payload));status(message,"Profil fournisseur enregistré.");}catch(e){status(message,e.message,true);}finally{submit.disabled=false;}
  };card.append(el("h2","","Entreprise et informations légales"),form);root.append(card);
 }
 async function mount(root,role){
  dispose();const owner=mounted={root,uploaders:[],destroyed:false};root.classList.add("account-module");root.replaceChildren(el("p","account-loading","Chargement de votre profil…"));
  try{const [user,settings,supplier]=await Promise.all([Auth.me(),options(),role==="SUPPLIER"?api.get("/api/suppliers/me/profile"):null]);if(owner.destroyed||!root.isConnected)return;root.replaceChildren();
   const tabs=el("div","account-tabs"),content=el("div");root.append(el("h1","","Mon profil"),tabs,content);
   const choices=role==="SUPPLIER"?[["Entreprise",()=>company(content,supplier,owner)],["Mon compte",()=>personal(content,user,settings,owner)],["Sécurité",()=>security(content,user)],["Préférences",()=>preferences(content,user)]]:[["Informations",()=>personal(content,user,settings,owner)],["Sécurité",()=>security(content,user)],["Préférences",()=>preferences(content,user)]];
   choices.forEach(([name,render],index)=>{const b=button(name,"account-button secondary");b.setAttribute("role","tab");b.setAttribute("aria-selected",String(index===0));b.onclick=()=>{owner.uploaders.forEach(u=>u.destroy());owner.uploaders=[];content.replaceChildren();tabs.querySelectorAll("button").forEach(v=>v.setAttribute("aria-selected",String(v===b)));render();};tabs.append(b);});tabs.setAttribute("role","tablist");choices[0][1]();
  }catch(e){if(owner.destroyed)return;root.replaceChildren(el("p","account-message error",e.message));const retry=button("Réessayer");retry.onclick=()=>mount(root,role);root.append(retry);}
 }
 function headerUser(){
  if(typeof Auth==="undefined")return;const user=Auth.getUser();if(!user)return;const initials=user.fullName?.split(/\s+/).map(s=>s[0]).slice(0,2).join("").toUpperCase()||"AV";
  document.querySelectorAll("#user-name,#account-name,#supplier-name,.account-trigger strong,.account b,.side-user b").forEach(node=>{if(node.textContent!==user.fullName)node.textContent=user.fullName;});
  document.querySelectorAll(".account-trigger .avatar,#account-toggle>span:first-child,#account-initials,#user-initials,.account .avatar,.side-user .avatar,#account-initials").forEach(node=>{
   const key=(user.avatarUrl||"")+"|"+initials;if(node.dataset.accountIdentity===key)return;node.dataset.accountIdentity=key;node.replaceChildren();
   if(user.avatarUrl){const img=el("img","account-avatar");img.src=user.avatarUrl;img.alt="Avatar";img.onerror=()=>node.replaceChildren(document.createTextNode(initials));node.append(img);}else node.textContent=initials;
  });
 }
 function banner(){
  if(typeof Auth==="undefined")return;const user=Auth.getUser(),existing=document.getElementById("account-verification-banner");
  if(!user||user.emailVerified!==false){existing?.remove();return;}if(existing)return;
  const target=document.querySelector(".account-module,#page-content,.client-main,#app main")||document.getElementById("app");if(!target)return;
  const node=el("aside","account-banner"),send=button("Renvoyer le lien",""),text=el("span","","E-mail non vérifié — vérifiez votre boîte de réception.");node.id="account-verification-banner";node.append(text,send);send.onclick=async()=>{send.disabled=true;try{text.textContent=(await Auth.resendVerification()).message;}catch(e){text.textContent=e.message;}finally{send.disabled=false;}};target.prepend(node);
 }
 function start(){if(!Auth.isLoggedIn())return;Auth.me().catch(()=>{});headerUser();banner();observer=new MutationObserver(()=>{headerUser();banner();});observer.observe(document.body,{childList:true,subtree:true});}
 window.addEventListener("atlas:profile-updated",()=>{headerUser();banner();});window.addEventListener("atlas:logout",()=>{dispose();observer?.disconnect();});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else queueMicrotask(start);
 return{mount,dispose,strength,rules,options};
})();
