/* Notifications partagées : données du JWT, texte dynamique uniquement via textContent. */
const NotificationsUI = (() => {
 const categories={BOOKING:"Réservations",PAYMENT:"Paiements",OFFER:"Offres",SUPPORT:"Support",ACCOUNT:"Compte",SYSTEM:"Système"};
 const symbols={BOOKING:"▣",PAYMENT:"◇",OFFER:"◷",SUPPORT:"✉",ACCOUNT:"♙",SYSTEM:"ⓘ"};
 const scriptRoot=new URL("../../",document.currentScript.src);
 let bell=null,panel=null,timer=null,controller=null,count=null,busy=null,generation=0,stopped=true;
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const button=(text,cls="ntf-button")=>{const el=node("button",cls,text);el.type="button";return el;};
 const instant=value=>Date.parse(value.endsWith("Z")||/[+-][0-9]{2}:[0-9]{2}$/.test(value)?value:value+"Z");
 function relative(value){
  const minutes=Math.max(0,Math.floor((Date.now()-instant(value))/60000));
  if(minutes<1)return "À l’instant";if(minutes<60)return "Il y a "+minutes+" min";
  if(minutes<1440)return "Il y a "+Math.floor(minutes/60)+" h";
  return new Date(instant(value)).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
 }
 function safeUrl(link){
  if(typeof link!=="string"||!link||/[\\\s<>"']/.test(link)||link.startsWith("//"))return null;
  const known=/^(frontend\/)?((admin|supplier|agent|client)\/index|accueil|catalogue|offre|panier|connexion)\.html(?:[?#]|$)/;
  if(!link.startsWith("/")&&!known.test(link))return null;
  try{
   const path=link.startsWith("/frontend/")?link.slice(10):link.startsWith("frontend/")?link.slice(9):link;
   const url=new URL(path,scriptRoot);
   return url.origin===location.origin&&!decodeURIComponent(url.pathname).includes("\\")?url:null;
  }catch{return null;}
 }
 function toast(message){
  const el=node("div","ntf-toast",message);el.setAttribute("role","status");document.body.append(el);setTimeout(()=>el.remove(),3500);
 }
 function stop(){
  stopped=true;generation++;clearTimeout(timer);timer=null;controller?.abort();controller=null;busy=null;
  if(panel)panel.hidden=true;if(bell)bell.setAttribute("aria-expanded","false");
 }
 function paintCount(value){
  if(!bell)return;const badge=bell.querySelector(".ntf-count");badge.textContent=value>99?"99+":String(value);badge.hidden=value===0;
  bell.setAttribute("aria-label","Notifications : "+value+" non lue"+(value>1?"s":""));
  document.querySelectorAll("[data-notification-count]").forEach(el=>{el.textContent=value>99?"99+":String(value);el.hidden=value===0;});
 }
 async function refreshCount(){
  if(stopped||!Auth.isLoggedIn())return;
  if(busy)return busy;
  const current=generation;
  busy=(async()=>{
   try{
    const result=await api.get("/api/notifications/unread-count");if(stopped||generation!==current)return;
    const increased=count!==null&&result.count>count;count=result.count;paintCount(count);
    if(increased){toast("Nouvelle notification");if(panel&&!panel.hidden)await preview();}
   }catch(err){if(err.status===401)stop();else if(bell)bell.title="Compteur indisponible : ouvrir les notifications pour réessayer.";}
   finally{if(generation===current)busy=null;}
  })();
  return busy;
 }
 function schedule(delay){clearTimeout(timer);if(!stopped)timer=setTimeout(poll,delay);}
 async function poll(){
  if(stopped)return;if(!Auth.isLoggedIn()){stop();return;}
  await refreshCount();
  schedule(document.visibilityState==="hidden"?60000:30000);
 }
 function close(focus=false){if(panel)panel.hidden=true;bell?.setAttribute("aria-expanded","false");if(focus)bell?.focus();}
 async function openNotification(value){
  try{
   if(!value.read)await api.post("/api/notifications/"+value.id+"/read",{});
   await refreshCount();const target=safeUrl(value.link);
   if(target)location.assign(target.href);else{close();toast("Notification marquée comme lue.");}
  }catch(err){toast(err.status?err.message:"Connexion interrompue. Réessayez.");}
 }
 function row(value,compact=false,reload){
  const item=node(compact?"div":"article","ntf-row"+(value.read?"":" ntf-unread"));
  const icon=node("span","ntf-icon",symbols[value.category]||"ⓘ");icon.setAttribute("aria-hidden","true");item.append(icon);
  const open=button("","ntf-open");if(compact)open.setAttribute("role","menuitem");
  open.append(node("strong","",value.title),node("p","",compact?value.message.slice(0,140):value.message));
  const time=node("time","",relative(value.createdAt));time.dateTime=value.createdAt;open.append(time);
  open.onclick=()=>openNotification(value);item.append(open);
  if(!value.read){const dot=node("span","ntf-dot");dot.setAttribute("aria-label","Non lue");item.append(dot);}
  if(!compact){
   const actions=node("div","ntf-row-actions");
   if(!value.read){const read=button("Marquer comme lue","ntf-link");read.onclick=async()=>{read.disabled=true;try{await api.post("/api/notifications/"+value.id+"/read",{});await refreshCount();await reload();}catch(err){toast(err.message);read.disabled=false;}};actions.append(read);}
   const del=button("Supprimer","ntf-link ntf-danger");del.onclick=async()=>{del.disabled=true;try{await api.delete("/api/notifications/"+value.id);await refreshCount();await reload();}catch(err){toast(err.message);del.disabled=false;}};actions.append(del);item.append(actions);
  }
  return item;
 }
 function loading(root){root.replaceChildren(node("div","ntf-skeleton","Chargement des notifications…"));root.setAttribute("aria-busy","true");}
 function error(root,err,retry){
  root.removeAttribute("aria-busy");root.replaceChildren(node("h3","","Notifications indisponibles"),node("p","",err.status?err.message:"Le serveur est injoignable."));
  const again=button("Réessayer");again.onclick=retry;root.append(again);
 }
 function empty(root){root.append(node("span","ntf-empty-icon","✉"),node("h3","","Vous êtes à jour"),node("p","","Aucune notification pour ces critères."));}
 async function readAll(reload){
  await api.post("/api/notifications/read-all",{});await refreshCount();if(reload)await reload();toast("Toutes les notifications sont lues.");
 }
 async function preview(){
  const target=panel;if(!target)return;loading(target);
  try{
   const page=await api.get("/api/notifications?size=10");if(target!==panel||!target.isConnected)return;
   target.replaceChildren();target.removeAttribute("aria-busy");
   const header=node("div","ntf-panel-header");header.append(node("strong","","Notifications"));
   const all=button("Tout marquer comme lu","ntf-link");all.setAttribute("role","menuitem");all.onclick=async()=>{all.disabled=true;try{await readAll(preview);}catch(err){toast(err.message);all.disabled=false;}};header.append(all);target.append(header);
   const list=node("div","ntf-preview-list");page.content.forEach(value=>list.append(row(value,true)));if(!page.content.length)empty(list);target.append(list);
   const see=node("a","ntf-see-all","Voir toutes les notifications");see.href="./index.html?page=notifications";see.setAttribute("role","menuitem");target.append(see);
  }catch(err){if(target===panel)error(target,err,preview);}
 }
 function attach(buttonSelector,panelSelector){
  const next=typeof buttonSelector==="string"?document.querySelector(buttonSelector):buttonSelector;
  const nextPanel=typeof panelSelector==="string"?document.querySelector(panelSelector):panelSelector;
  if(!next||!nextPanel)return;
  if(next===bell&&!stopped)return;
  stop();bell=next;panel=nextPanel;stopped=false;count=null;controller=new AbortController();
  const signal=controller.signal;panel.classList.remove("hidden");panel.classList.add("ntf-panel");panel.hidden=true;panel.setAttribute("role","menu");
  if(!bell.id)bell.id="ntf-bell";if(!panel.id)panel.id="ntf-panel";panel.setAttribute("aria-labelledby",bell.id);
  bell.setAttribute("aria-haspopup","menu");bell.setAttribute("aria-controls",panel.id);bell.setAttribute("aria-expanded","false");
  bell.querySelectorAll("em,.red-count,.ntf-count,[data-notification-count]").forEach(el=>el.remove());
  const badge=node("span","ntf-count");badge.hidden=true;bell.append(badge);
  bell.addEventListener("click",async event=>{
   event.stopPropagation();if(!panel.hidden){close();return;}panel.hidden=false;bell.setAttribute("aria-expanded","true");
   await preview();panel.querySelector("button,a")?.focus();
  },{signal});
  document.addEventListener("click",event=>{if(!panel.contains(event.target)&&!bell.contains(event.target))close();},{signal});
  document.addEventListener("keydown",event=>{
   if(panel.hidden)return;
   if(event.key==="Escape"){event.preventDefault();close(true);}
   if(["ArrowDown","ArrowUp","Home","End"].includes(event.key)){
    const focusable=[...panel.querySelectorAll("button:not(:disabled),a")];if(!focusable.length)return;
    event.preventDefault();const index=focusable.indexOf(document.activeElement);
    const nextIndex=event.key==="Home"?0:event.key==="End"?focusable.length-1:(index+(event.key==="ArrowDown"?1:-1)+focusable.length)%focusable.length;
    focusable[nextIndex].focus();
   }
  },{signal});
  document.addEventListener("visibilitychange",()=>schedule(document.visibilityState==="hidden"?60000:0),{signal});
  poll();
 }
 async function preferences(root){
  const host=node("section","ntf-preferences");host.id="preferences";root.append(host);loading(host);
  try{
   const current=await api.get("/api/notifications/preferences");if(!host.isConnected)return;
   host.replaceChildren(node("h2","","Mes préférences"),node("p","","Les e-mails de compte et de sécurité restent obligatoires. L’envoi dépend aussi de l’activation du service e-mail."));
   host.removeAttribute("aria-busy");const form=node("form","ntf-preference-form");
   for(const [key,label] of Object.entries({emailEnabled:"Recevoir les e-mails",inAppEnabled:"Notifications dans mon espace",bookingEmail:"E-mails de réservation",paymentEmail:"E-mails de paiement",offerEmail:"E-mails concernant les offres",supportEmail:"E-mails du support"})){
    const row=node("label","ntf-switch"),input=node("input");input.type="checkbox";input.name=key;input.checked=current[key];row.append(input,node("span","",label));form.append(row);
   }
   const save=button("Enregistrer mes préférences");save.type="submit";form.append(save);form.onsubmit=async e=>{
    e.preventDefault();save.disabled=true;
    try{const body={};Object.keys(current).forEach(key=>body[key]=Boolean(form.elements[key]?.checked));await api.put("/api/notifications/preferences",body);toast("Préférences enregistrées.");}
    catch(err){toast(err.status?err.message:"Connexion interrompue. Réessayez.");}finally{save.disabled=false;}
   };host.append(form);
   if(location.hash==="#preferences")host.scrollIntoView({behavior:"smooth"});
  }catch(err){error(host,err,()=>{host.remove();preferences(root);});}
 }
 function page(root){
  root.classList.add("ntf-module");root.replaceChildren();
  const top=node("header","ntf-page-header");top.append(node("div","", "Notifications"));
  const all=button("Tout marquer comme lu");top.append(all);root.append(top);
  const filter=node("form","ntf-filters"),read=node("select"),category=node("select");
  read.setAttribute("aria-label","État de lecture");category.setAttribute("aria-label","Catégorie");
  for(const [value,label]of [["","Toutes"],["false","Non lues"],["true","Lues"]]){const opt=node("option","",label);opt.value=value;read.append(opt);}
  const any=node("option","","Toutes les catégories");any.value="";category.append(any);
  Object.entries(categories).forEach(([key,label])=>{const opt=node("option","",label);opt.value=key;category.append(opt);});
  filter.append(read,category);root.append(filter);const result=node("section","ntf-results");root.append(result);let currentPage=0,request=0;
  async function reload(){
   const sequence=++request;loading(result);
   const params=new URLSearchParams({page:String(currentPage),size:"20"});if(read.value)params.set("read",read.value);if(category.value)params.set("category",category.value);
   try{
    const data=await api.get("/api/notifications?"+params);if(!result.isConnected||sequence!==request)return;
    result.replaceChildren();result.removeAttribute("aria-busy");
    if(!data.content.length&&currentPage>0){currentPage--;await reload();return;}
    data.content.forEach(value=>result.append(row(value,false,reload)));if(!data.content.length)empty(result);
    const nav=node("nav","ntf-pagination"),prev=button("Précédent"),next=button("Suivant");
    prev.disabled=data.first;next.disabled=data.last;prev.onclick=()=>{currentPage--;reload();};next.onclick=()=>{currentPage++;reload();};
    nav.append(prev,node("span","","Page "+(data.page+1)+" / "+Math.max(1,data.totalPages)+" · "+data.totalElements+" notification(s)"),next);result.append(nav);
   }catch(err){if(sequence===request)error(result,err,reload);}
  }
  all.onclick=async()=>{all.disabled=true;try{await readAll(reload);}catch(err){toast(err.message);}finally{all.disabled=false;}};
  [read,category].forEach(select=>select.onchange=()=>{currentPage=0;reload();});
  filter.onsubmit=e=>e.preventDefault();reload();preferences(root);
 }
 window.addEventListener("atlas:logout",stop);window.addEventListener("pagehide",stop);
 window.addEventListener("storage",()=>{if(!Auth.isLoggedIn())stop();});
 return {attach,page,stop,refreshCount,safeUrl,close};
})();
