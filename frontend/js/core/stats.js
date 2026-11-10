/* Dashboards réels : DOM sûr, requêtes annulables et cycle de vie explicite des graphiques. */
const StatsUI = (() => {
 const rootUrl=new URL("../../",document.currentScript.src);
 const money=value=>new Intl.NumberFormat("fr-MA",{style:"currency",currency:"MAD"}).format(Number(value||0));
 const number=value=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Number(value||0));
 const labels={PENDING:"En attente",CONFIRMED:"Confirmée",COMPLETED:"Terminée",CANCELLED:"Annulée",EXPIRED:"Expirée",CLIENT:"Clients",SUPPLIER:"Fournisseurs",AGENT:"Agents",ADMIN:"Administrateurs",HOTEL:"Hôtel & Riad",FLIGHT:"Vol",CAR:"Voiture",TAXI_TRANSFER:"Taxi / transfert",EXCURSION:"Excursion"};
 const colors=["#0b4fa8","#ffbd00","#20a17b","#d95467","#91a1b8"];
 const instances=new WeakMap();let state=null,chartPromise=null;
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const button=(label,cls="st-button")=>{const e=el("button",cls,label);e.type="button";return e;};
 const time=value=>value?new Date(value).toLocaleString("fr-FR",{dateStyle:"medium",timeStyle:"short"}):"—";
 function link(role,page,label,id){
  const a=el("a","st-link",label),url=new URL(role.toLowerCase()+"/index.html",rootUrl);url.searchParams.set("page",page);if(id!==undefined)url.searchParams.set("id",id);a.href=url.href;return a;
 }
 function dispose(){
  document.body.classList.remove("stats-page");
  if(!state)return;state.controller?.abort();for(const chart of state.charts)chart.destroy();state.charts.clear();state=null;
 }
 function chartReady(){
  if(window.Chart)return Promise.resolve();
  if(chartPromise)return chartPromise;
  chartPromise=new Promise(resolve=>{
   const script=document.querySelector("#atlas-chartjs");let done=false;
   const finish=()=>{if(!done){done=true;resolve();}};
   script?.addEventListener("load",finish,{once:true});script?.addEventListener("error",finish,{once:true});setTimeout(finish,5000);
  });return chartPromise;
 }
 async function renderChart(canvas,config){
  const owner=state;await chartReady();
  if(!owner||!canvas.isConnected||state!==owner)return;
  const previous=instances.get(canvas);if(previous){previous.destroy();owner.charts.delete(previous);}
  if(!window.Chart){canvas.replaceWith(el("p","st-empty","Le graphique est indisponible. Rechargez la page pour réessayer ; les données restent accessibles dans les cartes."));return;}
  try{
   const chart=new Chart(canvas,{...config,options:{responsive:true,maintainAspectRatio:false,animation:false,...config.options}});
   instances.set(canvas,chart);owner.charts.add(chart);
  }catch{
   canvas.replaceWith(el("p","st-empty","Impossible d’afficher ce graphique. Réessayez en changeant de période."));
  }
 }
 function panel(title,subtitle){
  const card=el("section","st-card"),heading=el("div","st-card-heading");heading.append(el("h2","",title));
  if(subtitle)heading.append(el("p","st-muted",subtitle));card.append(heading);return card;
 }
 function empty(card,text){card.append(el("p","st-empty",text));}
 const lean=role=>role==="CLIENT"||role==="SUPPLIER";
 function kpi(parent,title,data,format=number){
  const card=el("article","st-kpi");card.append(el("span","st-kpi-label",title),el("strong","st-kpi-value",format(data.value)));
  if(data.previous===null||data.changePercent===null){
   if(data.previous===null)card.append(el("small","st-muted","Comparaison indisponible"));
   else if(!lean(state.role))card.append(el("small","st-muted","Période précédente : "+format(data.previous)+" · aucune base de variation"));
  }else{
   const direction=Number(data.changePercent),line=el("small",direction>0?"st-up":direction<0?"st-down":"st-muted");
   line.textContent=(direction>0?"↑ En hausse de ":direction<0?"↓ En baisse de ":"→ Stable : ")+new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2}).format(Math.abs(direction))+" %";
   card.append(line);if(!lean(state.role))card.append(el("small","st-muted","Période précédente : "+format(data.previous)));
  }
  parent.append(card);return card;
 }
 function metric(parent,title,value,format=number){
  const card=el("article","st-kpi");card.append(el("span","st-kpi-label",title),el("strong","st-kpi-value",format(value)));parent.append(card);return card;
 }
 function table(card,headings,rows,makeRow,emptyMessage){
  if(!rows.length){empty(card,emptyMessage);return;}
  const wrap=el("div","st-table-wrap"),table=el("table","st-table"),head=el("thead"),tr=el("tr");
  headings.forEach(h=>tr.append(el("th","",h)));head.append(tr);table.append(head);const body=el("tbody");
  rows.forEach(row=>{const line=el("tr");makeRow(row).forEach(value=>{const td=el("td");value instanceof Node?td.append(value):td.textContent=value??"—";line.append(td);});body.append(line);});
  table.append(body);wrap.append(table);card.append(wrap);
 }
 function chart(card,type,names,values,label){
  if(!values.some(value=>Number(value)>0)){empty(card,"Aucune activité sur cette période.");return;}
  const holder=el("div","st-chart"),canvas=el("canvas");canvas.setAttribute("role","img");canvas.setAttribute("aria-label",label);holder.append(canvas);card.append(holder);
  renderChart(canvas,{type,data:{labels:names,datasets:[{label,data:values,backgroundColor:type==="doughnut"?colors:"#1965c4",borderColor:"#0b4fa8",borderWidth:1,tension:.3,fill:type==="line"}]},
   options:{plugins:{legend:{display:type==="doughnut",position:"bottom"}},...(type==="doughnut"?{}:{scales:{y:{beginAtZero:true}}})}});
 }
 function bookingTable(card,rows,role){
  table(card,["Réservation","Client","Date de service","Statut","Montant TTC"],rows,b=>[
   link(role,role==="CLIENT"?"reservation":role==="AGENT"?"booking":"bookings",b.reference,role==="ADMIN"||role==="SUPPLIER"?undefined:b.id),
   b.clientName,time(b.serviceStartAt),labels[b.status]||b.status,money(b.total)],"Aucune réservation sur cette période.");
 }
 function activities(card,items){
  if(!items.length){empty(card,"Aucune activité récente à afficher.");return;}
  const list=el("ul","st-activity");
  items.forEach(value=>{const item=el("li");item.append(el("strong","",value.title),el("p","",value.message),el("small","st-muted",time(value.createdAt+"Z")));list.append(item);});card.append(list);
 }
 function admin(data,blocks){
  const cards=blocks[0],charts=blocks[1],lists=blocks[2];
  kpi(cards,"Utilisateurs",data.users.total);kpi(cards,"Nouvelles inscriptions",data.users.newUsers);
  kpi(cards,"Réservations de la période",data.bookings.total);kpi(cards,"Chiffre d’affaires TTC",data.revenue.total,money);
  kpi(cards,"CA en attente",data.revenue.pendingRevenue,money);kpi(cards,"Panier moyen confirmé",data.revenue.averageOrder,money);
  const users=panel("Utilisateurs par rôle",data.users.active+" actifs · "+data.users.archived+" archivés");
  chart(users,"doughnut",Object.keys(data.users.byRole).map(k=>labels[k]||k),Object.values(data.users.byRole),"Utilisateurs par rôle");charts.append(users);
  const statuses=panel("Réservations par statut");chart(statuses,"doughnut",Object.keys(data.bookings.byStatus).map(k=>labels[k]||k),Object.values(data.bookings.byStatus),"Réservations par statut");charts.append(statuses);
  const revenue=panel("Chiffre d’affaires", "Réservations confirmées ou terminées, classées par date de création");revenue.classList.add("st-wide");
  chart(revenue,"bar",data.revenue.series.map(p=>p.label),data.revenue.series.map(p=>p.revenue),"Chiffre d’affaires en MAD");charts.append(revenue);
  if(data.users.estimatedCreationDates){const note=panel("Historique des inscriptions");note.append(el("p","st-muted","La date de création de "+number(data.users.estimatedCreationDates)+" ancien(s) compte(s) est inconnue. Ils sont exclus des nouvelles inscriptions et de la comparaison de population."));lists.append(note);}
  const destinations=panel("Destinations les plus réservées");table(destinations,["Ville","Réservations","CA TTC"],data.topDestinations,d=>[d.name,number(d.bookings),money(d.revenue)],"Aucune destination réservée sur cette période.");lists.append(destinations);
  const offers=panel("Offres les plus réservées");table(offers,["Offre","Type","Ville","Réservations","CA TTC"],data.topOffers,o=>[o.title,labels[o.type]||o.type,o.city,number(o.bookings),money(o.revenue)],"Aucune offre confirmée sur cette période.");lists.append(offers);
  const promos=panel("Codes promo à surveiller");const reasons={EXPIRING:"Expiration sous 7 jours",HEAVY_USAGE:"Usage fréquent",INACTIVE_USED:"Code inactif déjà utilisé"};
  table(promos,["Code","Motif","Usages de la période","Expiration"],data.promoCodes,p=>[p.code,reasons[p.reason]||p.reason,number(p.uses),p.expiryDate||"Sans limite"],"Aucun code promo à surveiller.");promos.append(link("ADMIN","promos","Gérer les codes promo"));lists.append(promos);
  const alerts=panel("Points d’attention");if(!data.alerts.length)empty(alerts,"Aucune alerte calculée.");
  data.alerts.forEach(a=>{const row=el("p","st-alert",number(a.count)+" · "+a.message);alerts.append(row);});lists.append(alerts);
 }
 function supplier(data,blocks){
  kpi(blocks[0],"Revenu de mes prestations",data.revenue,money);kpi(blocks[0],"Réservations de la période",data.bookings);
  metric(blocks[0],"Panier moyen",data.bookings.value>0?data.revenue.value/data.bookings.value:null,v=>v===null?"—":money(v));
  metric(blocks[0],"Offres actives",data.offers.active+" sur "+(data.offers.active+data.offers.inactive),String);
  const revenue=panel("Vos revenus sur six mois","Somme des prix de vos lignes confirmées ou terminées, avant la promotion globale du panier");
  chart(revenue,"bar",data.revenueSixMonths.map(p=>p.label),data.revenueSixMonths.map(p=>p.revenue),"Revenus fournisseur en MAD");blocks[1].append(revenue);
  const recent=panel("Dernières réservations reçues");bookingTable(recent,data.recentBookings,"SUPPLIER");blocks[1].append(recent);blocks[1].classList.add("st-split");
 }
 function agent(data,blocks){
  kpi(blocks[0],"Réservations en attente · période",data.pendingBookings);
  metric(blocks[0],"Paiements à encaisser",data.cashPendingCount);metric(blocks[0],"Montant à encaisser",data.cashPendingAmount,money);
  kpi(blocks[0],"Réservations créées aujourd’hui",data.bookingsToday);
  const tickets=panel("Tickets ouverts");
  if(!data.tickets.available){tickets.append(el("strong","st-unavailable","Bientôt disponible"),el("p","st-muted","Le module de support sera relié lorsqu’il sera disponible."));}
  else metric(tickets,"Tickets ouverts",data.tickets.count);blocks[1].append(tickets);
  const recent=panel("Réservations récentes");bookingTable(recent,data.recentBookings,"AGENT");blocks[2].append(recent);
  const payments=panel("Paiements à venir","Paiements à l’arrivée non encaissés, par date de service");
  table(payments,["Référence","Client","Date de service","Montant"],data.upcomingPayments,p=>[link("AGENT","payments",p.reference),p.clientName,time(p.serviceStartAt),money(p.amount)],"Aucun paiement à l’arrivée à encaisser.");
  payments.append(link("AGENT","payments","Ouvrir les encaissements"));blocks[2].append(payments);
 }
 function client(data,blocks){
  metric(blocks[0],"Mes réservations · total",data.totals.bookings);metric(blocks[0],"Montant net payé · total",data.totals.spent,money);
  kpi(blocks[0],"Réservations de la période",data.bookingsInPeriod);kpi(blocks[0],"Montant net payé · période",data.spentInPeriod,money);
  const recent=panel("Mes dernières réservations");recent.classList.add("st-wide");bookingTable(recent,data.recentBookings,"CLIENT");blocks[2].append(recent);
 }
 async function downloadCsv(path,signal){
  const response=await fetch(api.baseUrl()+path,{headers:{Authorization:"Bearer "+Auth.getToken()},signal});
  if(response.status===401)Auth.logout();
  if(!response.ok){const error=await response.json().catch(()=>({message:"Export indisponible."}));throw new Error(error.message);}
  const blob=await response.blob(),url=URL.createObjectURL(blob),anchor=document.createElement("a");
  anchor.href=url;anchor.download=response.headers.get("content-disposition")?.match(/filename="?([^";]+)/)?.[1]||"atlas-voyage.csv";document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function mount(root,role){
  dispose();const current={root,role,controller:null,charts:new Set(),request:0,period:new URLSearchParams(location.search).get("period")||"30d"};
  state=current;root.classList.add("st-dashboard");root.replaceChildren();
  document.body.classList.add("stats-page");
  const top=el("header","st-heading"),intro=el("div");intro.append(el("span","st-eyebrow","ATLAS VOYAGE"),el("h1","","Votre tableau de bord"),el("p","st-subtitle","Statistiques de votre activité en MAD."));top.append(intro);
  const controls=el("div","st-controls"),periods=el("div","st-periods");periods.setAttribute("role","group");periods.setAttribute("aria-label","Période statistique");
  const periodButtons=[];
  [["7d","7 jours"],["30d","30 jours"],["12m","12 mois"]].forEach(([value,label])=>{
   const select=button(label,"st-period");select.dataset.period=value;select.setAttribute("aria-pressed",String(current.period===value));
   select.onclick=()=>{current.period=value;const params=new URLSearchParams(location.search);params.set("period",value);history.replaceState({},"",location.pathname+"?"+params);reload();};periods.append(select);periodButtons.push(select);
  });
  const refresh=button("Actualiser","st-button st-secondary");refresh.onclick=()=>reload();controls.append(periods);if(!lean(role))controls.append(refresh);top.append(controls);root.append(top);
  const meta=el("p","st-meta");if(!lean(role))root.append(meta);
  const blocks=[el("div","st-kpis"),el("div","st-charts"),el("div","st-lists")];blocks.forEach(block=>root.append(block));
  if(role==="ADMIN"){
   const exports=panel("Exporter les données"),row=el("div","st-export-controls"),from=el("input"),to=el("input"),status=el("select");
   from.type=to.type="date";from.setAttribute("aria-label","Début de l’export");to.setAttribute("aria-label","Fin de l’export");
   const all=el("option","","Tous les statuts");all.value="";status.append(all);status.setAttribute("aria-label","Statut de l’export");
   Object.entries(labels).filter(([k])=>["PENDING","CONFIRMED","COMPLETED","CANCELLED","EXPIRED"].includes(k)).forEach(([k,v])=>{const o=el("option","",v);o.value=k;status.append(o);});
   row.append(from,to,status);const message=el("p","st-export-message");message.setAttribute("role","status");
   for(const [name,label]of [["bookings","Exporter réservations (CSV)"],["revenue","Exporter CA (CSV)"]]){
    const action=button(label);action.onclick=async()=>{
     action.disabled=true;action.textContent="Export en cours…";message.textContent="";
     try{const params=new URLSearchParams({period:current.period});if(name==="bookings"){if(from.value)params.set("from",from.value);if(to.value)params.set("to",to.value);if(status.value)params.set("status",status.value);}
      await downloadCsv("/api/stats/admin/export/"+name+".csv?"+params,current.controller?.signal);message.textContent="Export téléchargé.";
     }catch(err){if(err.name!=="AbortError")message.textContent=err.message;}finally{action.disabled=false;action.textContent=label;}
    };row.append(action);
   }
   exports.append(row,message);root.append(exports);
  }
  async function reload(){
   current.controller?.abort();current.controller=new AbortController();const sequence=++current.request;
   for(const instance of current.charts)instance.destroy();current.charts.clear();
   periodButtons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.period===current.period)));
   blocks.forEach(block=>{block.replaceChildren(el("div","st-skeleton","Chargement des statistiques…"));block.setAttribute("aria-busy","true");});
   try{
    const data=await api.request("/api/stats/"+role.toLowerCase()+"?period="+encodeURIComponent(current.period),{signal:current.controller.signal});
    if(state!==current||sequence!==current.request||!root.isConnected)return;
    blocks.forEach(block=>{block.replaceChildren();block.removeAttribute("aria-busy");});
    intro.querySelector("h1").textContent=data.fullName?"Bonjour "+data.fullName:"Vue d’ensemble de l’agence";
    meta.textContent="Du "+data.from+" au "+data.to+" · "+data.timezone+" · actualisé le "+time(data.generatedAt);
    ({ADMIN:admin,SUPPLIER:supplier,AGENT:agent,CLIENT:client})[role](data,blocks);
   }catch(err){
    if(err.name==="AbortError"||state!==current||sequence!==current.request)return;
    blocks.forEach(block=>{block.removeAttribute("aria-busy");block.replaceChildren(el("h2","","Statistiques indisponibles"),el("p","st-muted",err.status?err.message:"Le serveur est injoignable. Vérifiez votre connexion."));const retry=button("Réessayer");retry.onclick=reload;block.append(retry);});
   }
  }
  reload();
 }
 window.addEventListener("atlas:logout",dispose);window.addEventListener("pagehide",dispose);
 return {mount,dispose,renderChart,downloadCsv,money};
})();
