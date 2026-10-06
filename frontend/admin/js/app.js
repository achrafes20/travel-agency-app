const state = {
  page: "dashboard",
  collapsed: false,
  notifications: [],
};

const pages = {
  dashboard: "Tableau de bord",
  users: "Utilisateurs",
  cities: "Villes",
  promos: "Codes promo",
  offers: "Supervision des offres",
  bookings: "Réservations",
  tickets: "Tickets de support",
  audit: "Journal d’audit",
  settings: "Paramètres globaux",
  notifications: "Notifications",
  profile: "Mon profil",
};

const navGroups = [
  { label: "Pilotage", items: [["dashboard", "layout-dashboard", "Tableau de bord"]] },
  { label: "Gestion", items: [["users", "users", "Utilisateurs"], ["cities", "map", "Villes"], ["promos", "tags", "Codes promo"], ["offers", "briefcase-business", "Offres"]] },
  { label: "Activité", items: [["bookings", "calendar-days", "Réservations"], ["tickets", "messages-square", "Tickets", 8], ["audit", "history", "Journal d’audit"]] },
  { label: "Système", items: [["settings", "settings", "Paramètres"]] },
];

const CITY_LIST_URL = "../pages/admin/villes.html";
const CITY_FORM_URL = "../pages/admin/ville-form.html";
const CITY_DETAIL_URL = "../pages/admin/ville-detail.html";

const promos = [
  ["BIENVENUE10","Pourcentage","−10 %","500,00 MAD","01/09 → 12/10/2026","84 / 100","Bientôt expiré"],
  ["AUTOMNE25","Pourcentage","−25 %","1 500,00 MAD","20/09 → 18/10/2026","47 / 60","Actif"],
  ["RIAD200","Montant fixe","−200 MAD","2 000,00 MAD","01/10 → 31/10/2026","19 / 50","Actif"],
  ["ATLASVIP","Pourcentage","−15 %","3 000,00 MAD","01/01 → 31/12/2026","100 / 100","Épuisé"],
  ["ETE2026","Montant fixe","−150 MAD","1 000,00 MAD","01/06 → 31/08/2026","72 / 100","Expiré"],
];
const offers = [
  ["hotel","Riad Atlas Prestige","Hôtel & Riad","Riad Atlas Group","Marrakech","1 450,00 MAD","8","Active"],
  ["plane","Vol CMN → CDG","Vol","Atlas Sky","Casablanca","2 890,00 MAD","24","Active"],
  ["compass","Circuit désert Merzouga","Excursion","Sahara Évasion","Marrakech","850,00 MAD","12","Active"],
  ["car","Dacia Duster — Auto","Voiture","Atlas Cars","Agadir","520,00 MAD","5","Inactive"],
  ["car-taxi-front","Transfert Aéroport Menara","Taxi / Transfert","Marrakech Transfer","Marrakech","280,00 MAD","9","Active"],
  ["hotel","Dar Zitoune","Hôtel & Riad","Riads du Maroc","Fès","1 180,00 MAD","3","Désactivée par l’admin"],
];
const bookings = [
  ["BK-2026-000312","Yasmine Benali","05/10/2026","12 → 15 oct.","2","4 380,00 MAD","Carte simulée","Payé","Confirmée"],
  ["BK-2026-000311","Amine Berrada","05/10/2026","18 → 20 oct.","1","2 900,00 MAD","À l’arrivée","En attente","En attente"],
  ["BK-2026-000310","Sofia El Amrani","04/10/2026","08 → 12 oct.","3","7 240,00 MAD","Carte simulée","Payé","Confirmée"],
  ["BK-2026-000309","Mehdi Tazi","04/10/2026","21 → 23 oct.","1","1 700,00 MAD","Carte simulée","Remboursé","Annulée"],
  ["BK-2026-000308","Julie Martin","03/10/2026","05 → 09 oct.","2","8 920,00 MAD","Carte simulée","Payé","Terminée"],
];

function icon(name, cls = "") { return `<i data-lucide="${name}" class="${cls}"></i>`; }
function badge(label, tone = "blue") { return `<span class="badge badge-${tone}">${label}</span>`; }
function button(label, iconName = "", variant = "primary", attrs = "") { return `<button class="btn btn-${variant}" ${attrs}>${iconName ? icon(iconName) : ""}${label}</button>`; }
function linkButton(label, iconName, href, variant = "primary") { return `<a class="btn btn-${variant}" href="${href}">${iconName ? icon(iconName) : ""}${label}</a>`; }
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function initialsFromName(name) {
  return String(name || "?").split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}
function roleLabel(role) {
  return ({ CLIENT: "Client", SUPPLIER: "Fournisseur", AGENT: "Agent", ADMIN: "Administrateur" })[role] || role;
}
function formatCoord(value) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toFixed(4);
}
function apiErrorBanner(message) {
  return `<div class="info-banner">${icon("triangle-alert")}<div><strong>Connexion API</strong><span>${escapeHtml(message)} — démarrez le backend (port 8080).</span></div></div>`;
}
function sectionTitle(title, subtitle, action = "") { return `<div class="section-title"><div><h2>${title}</h2><p>${subtitle}</p></div>${action ? `<button class="nav-link" data-page="${action[1]}">${action[0]} →</button>` : ""}</div>`; }
function filters(placeholder, options = []) {
  return `<div class="filters"><div class="search-field">${icon("search")}<input class="table-search" placeholder="${placeholder}" /></div>${options.map(o=>`<select>${o.map(x=>`<option>${x}</option>`).join("")}</select>`).join("")}<button class="btn btn-ghost reset">${icon("rotate-ccw")}Réinitialiser</button></div>`;
}
function table(headers, rows, count) {
  return `<div class="table-card"><div class="table-wrap"><table><thead><tr>${headers.map((x, i) => `<th class="${i === headers.length - 1 ? "th-center" : ""}">${x}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
  <div class="pagination"><span class="pagination-info">${count}</span><div class="pagination-controls"><span>Lignes par page</span><select class="page-size-select" aria-label="Lignes par page"><option value="5">5</option><option value="10" selected>10</option><option value="25">25</option><option value="50">50</option></select><div class="page-buttons"></div></div></div></div>`;
}
function roleTone(role) { return role==="Admin"?"purple":role==="Agent"?"amber":role==="Fournisseur"?"blue":"gray"; }
function statusTone(status) {
  if(["Actif","Active","Payé","Terminée","Résolu"].includes(status)) return "green";
  if(["Annulée","Désactivée par l’admin"].includes(status)) return "red";
  if(["En attente","Bientôt expiré","Ouvert"].includes(status)) return "amber";
  if(["Confirmée","En cours"].includes(status)) return "blue";
  if(status==="Remboursé") return "purple";
  return "gray";
}

function renderNav() {
  document.querySelector("#main-nav").innerHTML = navGroups.map(group => `<div class="nav-group"><p class="nav-label">${group.label}</p>${group.items.map(([id,ico,label,count]) => `<button class="nav-item nav-link ${state.page===id?"active":""}" data-page="${id}" title="${label}">${icon(ico)}<span>${label}</span>${count?`<b class="nav-count">${count}</b>`:""}</button>`).join("")}</div>`).join("");
}

function renderNotificationsPreview() {
  if (!state.notifications.length) {
    document.querySelector("#notification-preview").innerHTML = `<p style="padding:16px;color:var(--muted)">Aucune notification.</p>`;
    return;
  }
  document.querySelector("#notification-preview").innerHTML = state.notifications.slice(0,3).map(n=>`<div class="notice"><span class="notice-icon">${icon(n.icon)}</span><div><strong>${n.title}</strong><p>${n.text}</p><small>${n.time}</small></div>${n.unread?'<i class="notice-dot"></i>':""}</div>`).join("");
}

function dashboardPage() {
  const kpis = [["users","Utilisateurs totaux","1 248","+7,2 %","vs période précédente"],["user-plus","Nouvelles inscriptions","86","+12,4 %","sur les 30 derniers jours"],["clipboard-list","Réservations","312","+8,6 %","sur les 30 derniers jours"],["circle-dollar-sign","Chiffre d’affaires","486 320","MAD · +15,3 %","vs période précédente"]];
  const bars=[42,68,55,82,61,94,76,105,88,119,96,128];
  return `<div class="toolbar"><div class="toolbar-copy"><strong>Bonjour Nadia,</strong><span>Voici ce qui se passe sur Atlas Voyage aujourd’hui.</span></div><div class="toolbar-actions"><select><option>30 derniers jours</option><option>7 derniers jours</option><option>90 derniers jours</option></select>${button("Actualiser","refresh-cw","secondary",'data-action="refresh"')}</div></div>
  <div class="kpi-grid">${kpis.map(k=>`<article class="card kpi-card"><div class="kpi-top"><span class="round-icon">${icon(k[0])}</span><span class="trend">${icon("arrow-up")} ${k[3]}</span></div><span class="kpi-label">${k[1]}</span><div class="kpi-value">${k[2]} <small>${k[1]==="Chiffre d’affaires"?"MAD":""}</small></div><span class="kpi-note">${k[4]}</span></article>`).join("")}</div>
  <div class="analytics-grid"><article class="card chart-card">${sectionTitle("Aperçu des réservations","Évolution par statut sur les 30 derniers jours",["Voir les réservations","bookings"])}<div class="bar-chart"><div class="chart-y"><span>120</span><span>80</span><span>40</span><span>0</span></div><div class="bars">${bars.map((v,i)=>`<div class="bar-group"><div class="bar-pair"><i class="bar-primary" style="height:${v}px"></i><i class="bar-accent" style="height:${Math.max(9,v*.2)}px"></i></div><span>${i%2===0?"S"+(i/2+1):""}</span></div>`).join("")}</div><div class="chart-legend"><span><i style="background:#0b3c8f"></i>Confirmées</span><span><i style="background:#ffb400"></i>En attente</span><span><i style="background:#1e9e5a"></i>Terminées</span><span><i style="background:#d93b3b"></i>Annulées</span></div></div></article>
  <article class="card chart-card">${sectionTitle("Utilisateurs par rôle","Répartition actuelle")}<div class="donut-wrap"><div class="donut"><div><strong>1 248</strong><span>utilisateurs</span></div></div><div class="donut-legend">${[["#0b3c8f","Clients","1 084"],["#ffb400","Fournisseurs","112"],["#1e9e5a","Agents","44"],["#d93b3b","Admins","8"]].map(x=>`<span><i style="background:${x[0]}"></i>${x[1]}<strong>${x[2]}</strong></span>`).join("")}</div></div></article></div>
  <div class="bottom-grid"><article class="card">${sectionTitle("Top destinations","Par chiffre d’affaires",["Voir les villes","cities"])}<div class="destination-list">${[["Marrakech","128 450 MAD",86],["Casablanca","94 280 MAD",68],["Chefchaouen","72 840 MAD",54],["Agadir","56 120 MAD",42],["Fès","41 690 MAD",31]].map((x,i)=>`<div class="destination-row"><b class="rank">${i+1}</b><div><strong>${x[0]}</strong><span class="progress"><i style="width:${x[2]}%"></i></span></div><span>${x[1]}</span></div>`).join("")}</div></article>
  <article class="card">${sectionTitle("Offres les plus réservées","30 derniers jours",["Voir les offres","offers"])}<div class="mini-list">${[["https://images.unsplash.com/photo-1570133435536-7ececf000ef6?auto=format&fit=crop&w=100&q=80","Riad Atlas Prestige","Hôtel & Riad","62"],["https://images.unsplash.com/photo-1548018560-4cb48a8837c1?auto=format&fit=crop&w=100&q=80","Week-end Bleu","Bundle","51"],["https://images.unsplash.com/photo-1531230689007-0b32d7a7c33e?auto=format&fit=crop&w=100&q=80","Circuit désert Merzouga","Excursion","44"]].map(x=>`<div class="mini-row"><img src="${x[0]}" alt=""><div><strong>${x[1]}</strong><span>${x[2]}</span></div><b>${x[3]} résa.</b></div>`).join("")}</div></article>
  <article class="card">${sectionTitle("Codes promo","À surveiller",["Gérer","promos"])}<div class="mini-list">${[["BIENVENUE10","84 / 100","12/10/2026"],["AUTOMNE25","47 / 60","18/10/2026"],["RIAD200","19 / 50","31/10/2026"]].map(x=>`<div class="mini-row"><span class="promo-symbol">%</span><div><strong>${x[0]}</strong><span>Expire le ${x[2]}</span></div><b>${x[1]}</b></div>`).join("")}</div></article></div>
  <div class="alert-strip"><span class="notice-icon">${icon("triangle-alert")}</span><div><strong>3 éléments requièrent votre attention</strong><span>8 tickets non assignés · 3 codes promo expirent bientôt · 2 offres signalées</span></div><button class="nav-link" data-page="tickets">Consulter les alertes →</button></div>`;
}

let adminUsers = [];

async function usersPage() {
  try {
    adminUsers = await api.get("/api/users");
  } catch (err) {
    adminUsers = [];
    return `${apiErrorBanner(err.message)}<div class="empty-state"><span class="round-icon">${icon("users")}</span><h2>Utilisateurs indisponibles</h2><p>Impossible de charger la liste depuis l’API.</p></div>`;
  }
  const rows = adminUsers
    .map((u) => {
      const label = roleLabel(u.role);
      const search = `${u.fullName} ${u.email} ${label}`.toLowerCase();
      return `<tr data-search="${escapeHtml(search)}" data-role="${escapeHtml(label)}" data-status="${u.archived ? "archived" : "active"}"><td><div class="identity"><span class="avatar small">${escapeHtml(initialsFromName(u.fullName))}</span><div><strong>${escapeHtml(u.fullName)}</strong><span>${escapeHtml(u.email)}</span></div></div></td><td>${badge(label, roleTone(label))}</td><td>${u.archived ? badge("Archivé", "gray") : badge("Actif", "green")}</td><td class="table-actions-cell"><div class="row-actions-group">${u.archived
        ? `<button type="button" class="action-btn action-view" data-user-restore="${u.id}" title="Restaurer" aria-label="Restaurer">${icon("archive-restore")}</button><button type="button" class="action-btn action-delete" data-user-delete="${u.id}" title="Supprimer définitivement" aria-label="Supprimer définitivement">${icon("trash-2")}</button>`
        : `<button type="button" class="action-btn action-edit" data-user-edit="${u.id}" title="Modifier" aria-label="Modifier">${icon("pencil")}</button><button type="button" class="action-btn action-delete" data-user-archive="${u.id}" title="Archiver" aria-label="Archiver">${icon("archive")}</button>`}</div></td></tr>`;
    })
    .join("");
  return `<div class="page-actions"><p>Gérez les accès et les rôles des utilisateurs de la plateforme.</p>${button("Créer un compte","plus","primary",'data-modal="create-user"')}</div>${filters("Nom ou email...",[["Tous les rôles","Client","Fournisseur","Agent","Administrateur"],["Utilisateurs actifs","Utilisateurs archivés","Tous les statuts"]])}${table(["Utilisateur","Rôle","Statut",""], rows, "")}`;
}
let adminCities = [
  { id: 1, name: "Marrakech", country: "Maroc", code: "MA", latitude: "31.6295", longitude: "-7.9811", airport: "Oui", offers: 284, active: true },
  { id: 2, name: "Casablanca", country: "Maroc", code: "MA", latitude: "33.5731", longitude: "-7.5898", airport: "Oui", offers: 213, active: true },
  { id: 3, name: "Chefchaouen", country: "Maroc", code: "MA", latitude: "35.1688", longitude: "-5.2636", airport: "Non", offers: 96, active: true },
  { id: 4, name: "Tanger", country: "Maroc", code: "MA", latitude: "35.7595", longitude: "-5.8340", airport: "Oui", offers: 88, active: true },
  { id: 5, name: "Fès", country: "Maroc", code: "MA", latitude: "34.0181", longitude: "-5.0078", airport: "Oui", offers: 72, active: true },
  { id: 6, name: "Paris", country: "France", code: "FR", latitude: "48.8566", longitude: "2.3522", airport: "Oui", offers: 18, active: true },
];
let citiesApiSynced = false;

async function syncCitiesApi() {
  if (citiesApiSynced) return;
  try {
    const list = await api.get("/api/cities");
    if (Array.isArray(list) && list.length > 0) {
      const airportList = ["marrakech", "casablanca", "tanger", "fès", "fes", "paris", "agadir", "rabat", "ouarzazate", "nador", "oujda", "dakhla"];
      const countryMap = { "paris": "France", "madrid": "Espagne" };
      const codeMap = { "France": "FR", "Espagne": "ES", "Maroc": "MA" };
      const offersMap = { "marrakech": 284, "casablanca": 213, "chefchaouen": 96, "tanger": 88, "fès": 72, "fes": 72, "paris": 18, "essaouira": 64 };

      const apiCities = list.map((c) => {
        const lower = (c.name || "").toLowerCase();
        const country = countryMap[lower] || "Maroc";
        const code = codeMap[country] || "MA";
        const airport = airportList.includes(lower) ? "Oui" : "Non";
        const offers = offersMap[lower] || (Math.floor(Math.random() * 40) + 20);
        return {
          id: c.id,
          name: c.name,
          country,
          code,
          latitude: c.latitude != null ? Number(c.latitude).toFixed(4) : "—",
          longitude: c.longitude != null ? Number(c.longitude).toFixed(4) : "—",
          airport,
          offers,
          active: true,
        };
      });

      const apiNames = new Set(apiCities.map((c) => c.name.toLowerCase()));
      const extras = adminCities.filter((d) => !apiNames.has(d.name.toLowerCase()));
      adminCities = [...apiCities, ...extras];
      citiesApiSynced = true;
    }
  } catch (err) {
    console.warn("Backend API /api/cities non disponible, utilisation des données locales :", err);
  }
}

async function citiesPage() {
  await syncCitiesApi();
  const rows = adminCities
    .map((c) => {
      const search = `${c.name} ${c.country} ${c.code} ${c.latitude} ${c.longitude}`.toLowerCase();
      const airportDisplay = c.airport === "Oui" ? `${icon("plane")} Oui` : "—";
      return `<tr data-search="${escapeHtml(search)}" data-country="${escapeHtml(c.country)}" data-airport="${c.airport}" data-city-id="${c.id}">
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.country)}</td>
        <td><span class="code">${escapeHtml(c.code)}</span></td>
        <td>${escapeHtml(c.latitude)}</td>
        <td>${escapeHtml(c.longitude)}</td>
        <td>${airportDisplay}</td>
        <td>${c.offers}</td>
        <td><button type="button" class="toggle ${c.active ? "active" : ""}" data-toggle-city="${c.id}" aria-label="Statut actif"><span></span></button></td>
        <td class="table-actions-cell">
          <div class="row-actions-group">
            <button type="button" class="action-btn action-view" data-action-city="detail" data-id="${c.id}" title="Voir le détail" aria-label="Voir le détail">${icon("eye")}</button>
            <button type="button" class="action-btn action-edit" data-action-city="edit" data-id="${c.id}" title="Modifier" aria-label="Modifier">${icon("pencil")}</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  const allCountries = ["Tous les pays", ...Array.from(new Set(adminCities.map(c => c.country).filter(Boolean)))];
  return `<div class="page-actions"><p>Gérez le référentiel géographique utilisé par les offres.</p>${button("Ajouter une ville", "plus", "primary", 'data-modal="city"')}</div>${filters("Rechercher une ville...", [allCountries, ["Aéroport : Tous", "Oui", "Non"]])}${table(["Ville", "Pays", "Code", "Latitude", "Longitude", "Aéroport", "Offres liées", "Active", "Actions"], rows, `${adminCities.length} villes`)}`;
}

function promosPage() {
  const rows=promos.map(p=>`<tr data-search="${p.join(" ").toLowerCase()}"><td><span class="code">${p[0]}</span> <button class="row-action inline-flex" data-copy="${p[0]}">${icon("copy")}</button></td><td>${p[1]}</td><td><strong>${p[2]}</strong></td><td>${p[3]}</td><td>${p[4]}</td><td>${p[5]}</td><td>${badge(p[6],statusTone(p[6]))}</td><td><button class="toggle ${["Actif","Bientôt expiré"].includes(p[6])?"active":""}"><span></span></button></td><td><button class="row-action" data-modal="promo-actions">${icon("ellipsis")}</button></td></tr>`).join("");
  return `<div class="page-actions"><p>Créez et suivez les campagnes promotionnelles Atlas Voyage.</p>${button("Nouveau code","plus","primary",'data-modal="promo"')}</div>${filters("Rechercher par code...",[["Tous les statuts","Actif","Expiré","Épuisé"],["Tous les types","Pourcentage","Montant fixe"]])}${table(["Code","Type","Valeur","Minimum","Validité","Utilisations","Statut","Actif",""],rows,"18 codes promo")}`;
}
function offersPage() {
  const rows=offers.map(o=>`<tr data-search="${o.join(" ").toLowerCase()}"><td><div class="identity"><span class="round-icon">${icon(o[0])}</span><strong>${o[1]}</strong></div></td><td>${badge(o[2],"blue")}</td><td>${o[3]}</td><td>${o[4]}</td><td><strong>${o[5]}</strong></td><td>${o[6]}</td><td>${badge(o[7],statusTone(o[7]))}</td><td><button class="row-action" data-modal="offer">${icon("ellipsis")}</button></td></tr>`).join("");
  return `<div class="page-actions"><p>Supervisez les offres publiées par tous les fournisseurs.</p><div>${button("Vue liste","list","secondary")} ${button("Vue grille","grid-2x2","ghost")}</div></div>${filters("Titre de l’offre...",[["Tous les types","Hôtel & Riad","Vol","Voiture","Excursion"],["Tous les fournisseurs"],["Tous les statuts"]])}${table(["Offre","Type","Fournisseur","Ville","Prix de base","Stock","Statut",""],rows,"684 offres")}`;
}
function bookingsPage() {
  const rows=bookings.map(b=>`<tr data-search="${b.join(" ").toLowerCase()}"><td><span class="booking-ref">${b[0]}</span></td><td><strong>${b[1]}</strong></td><td>${b[2]}</td><td>${b[3]}</td><td>${b[4]}</td><td><strong>${b[5]}</strong></td><td>${b[6]}</td><td>${badge(b[7],statusTone(b[7]))}</td><td>${badge(b[8],statusTone(b[8]))}</td><td><button class="row-action" data-action="view-booking">${icon("eye")}</button></td></tr>`).join("");
  return `<div class="info-banner">${icon("eye")}<div><strong>Consultation en lecture seule</strong><span>Les actions de validation, d’annulation et de remboursement sont réservées aux agents.</span></div>${button("Exporter en CSV","download","secondary",'data-action="export"')}</div>${filters("Référence ou client...",[["Tous les statuts"],["Tous les paiements"]])}${table(["Référence","Client","Créée le","Séjour","Lignes","Total","Paiement","Statut paiement","Réservation",""],rows,"312 réservations")}`;
}
function ticketsPage() {
  const data=[["Problème avec mon remboursement","Annulation","Mehdi Tazi","BK-2026-000309","Ouvert","Non assigné","Il y a 12 min"],["Modification des dates du séjour","Réservation","Sofia El Amrani","BK-2026-000310","En cours","Salma Idrissi","Il y a 38 min"],["Paiement débité deux fois","Paiement","Nora Amrani","BK-2026-000298","En cours","Youssef Alaoui","Il y a 2 h"],["Question sur le transfert","Autre","Julie Martin","BK-2026-000308","Résolu","Salma Idrissi","Hier, 16:22"]];
  const rows=data.map(r=>`<tr data-search="${r.join(" ").toLowerCase()}"><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td><span class="booking-ref">${r[3]}</span></td><td>${badge(r[4],statusTone(r[4]))}</td><td>${r[5]}</td><td>${r[6]}</td><td><button class="row-action">${icon("eye")}</button></td></tr>`).join("");
  return `<div class="info-banner">${icon("eye")}<div><strong>Consultation en lecture seule</strong><span>Le traitement et les réponses sont réservés aux agents.</span></div></div>${filters("Sujet, client ou réservation...",[["Tous les statuts"],["Toutes les catégories"],["Tous les agents"]])}${table(["Sujet","Catégorie","Client","Réservation liée","Statut","Agent assigné","Dernière réponse",""],rows,"48 tickets")}`;
}
function auditPage() {
  const data=[["05/10/2026 · 10:24","Nadia Lahlou","Admin","Désactivation d’offre","Dar Zitoune","active: true → false"],["05/10/2026 · 09:56","Salma Idrissi","Agent","Remboursement","BK-2026-000309","0,00 → 1 700,00 MAD"],["04/10/2026 · 17:12","Nadia Lahlou","Admin","Changement de rôle","Hicham Amrani","CLIENT → SUPPLIER"],["04/10/2026 · 15:40","Youssef Alaoui","Agent","Annulation","BK-2026-000301","CONFIRMED → CANCELLED"],["03/10/2026 · 11:08","Nadia Lahlou","Admin","Paramètre modifié","Délai d’annulation","72 h → 48 h"]];
  const rows=data.map(r=>`<tr data-search="${r.join(" ").toLowerCase()}"><td>${r[0]}</td><td><strong>${r[1]}</strong></td><td>${badge(r[2],roleTone(r[2]))}</td><td>${r[3]}</td><td><span class="booking-ref">${r[4]}</span></td><td><code>${r[5]}</code></td><td><button class="row-action">${icon("chevron-right")}</button></td></tr>`).join("");
  return `<div class="page-actions"><p>Consultez la traçabilité des actions sensibles de la plateforme.</p>${button("Exporter en CSV","download","secondary",'data-action="export"')}</div>${filters("Rechercher un acteur ou une cible...",[["Toutes les actions"]])}${table(["Date et heure","Acteur","Rôle","Action","Cible","Détails",""],rows,"2 418 événements")}`;
}
function settingsPage() {
  const settings=[["clock-3","Délai d’annulation client","Délai minimum avant le début de la réservation.","48","heures"],["package-open","Seuil de stock bas","Déclenche une notification au fournisseur.","3","unités"],["shopping-cart","Nombre maximum de lignes au panier","Limite d’articles distincts dans un panier client.","20","lignes"]];
  return `<div class="settings-layout"><aside class="settings-intro"><h2>Règles de la plateforme</h2><p>Ces paramètres pilotent les règles métier globales. Toute modification s’applique immédiatement.</p><div class="warning-note">${icon("triangle-alert")}<span>Vérifiez l’impact d’un changement avant de l’enregistrer.</span></div></aside><div class="settings-list">${settings.map(s=>`<div class="setting-row"><span class="round-icon">${icon(s[0])}</span><div class="setting-copy"><strong>${s[1]}</strong><span>${s[2]}</span><small>Dernière modification par Nadia Lahlou, le 03/10/2026</small></div><div class="number-field"><input value="${s[3]}"><span>${s[4]}</span></div>${button("Enregistrer","","secondary",'data-action="save-setting"')}</div>`).join("")}<div class="setting-row"><span class="round-icon">${icon("wallet-cards")}</span><div class="setting-copy"><strong>Paiement à l’arrivée</strong><span>Autoriser globalement ce mode de paiement.</span><small>Dernière modification le 02/10/2026</small></div><button class="toggle active"><span></span></button>${button("Enregistrer","","secondary",'data-action="save-setting"')}</div></div></div>`;
}
function notificationsPage() {
  if (!state.notifications.length) {
    return `<div class="empty-state"><span class="round-icon">${icon("bell")}</span><h2>Aucune notification</h2><p>Vous n’avez aucune notification pour le moment.</p></div>`;
  }
  return `<div class="page-actions"><div class="tabs"><button class="active">Toutes · ${state.notifications.length}</button><button>Non lues · ${state.notifications.filter(n=>n.unread).length}</button></div>${button("Tout marquer comme lu","","secondary",'data-action="read-all"')}</div><div class="card">${state.notifications.map(n=>`<div class="full-notice ${n.unread?"unread":""}"><span class="notice-icon">${icon(n.icon)}</span><div><strong>${n.title}</strong><p>${n.text}</p><small>${n.time}</small></div>${n.unread?'<button data-action="read-one">Marquer comme lu</button>':""}</div>`).join("")}</div>`;
}
function profilePage() {
  return `<div class="profile-grid"><section class="card profile-card"><div class="profile-hero"><span class="avatar">NL</span><div><h2>Nadia Lahlou</h2><span>Administratrice · Compte actif</span></div></div><div class="form-grid"><label class="field">Prénom<input value="Nadia"></label><label class="field">Nom<input value="Lahlou"></label><label class="field full">Adresse email<input disabled value="nadia.lahlou@atlasvoyage.ma"><small>L’adresse email ne peut pas être modifiée.</small></label><label class="field">Téléphone<input value="+212 6 12 34 56 78"></label><label class="field">Pays<select><option>Maroc</option></select></label></div><div class="form-actions">${button("Enregistrer les modifications","","primary",'data-action="save-profile"')}</div></section><section class="card password-card"><h2>Changer le mot de passe</h2><p>Utilisez au moins 8 caractères, une majuscule et un chiffre.</p><label class="field">Mot de passe actuel<input type="password" value="password"></label><label class="field">Nouveau mot de passe<input type="password" placeholder="Votre nouveau mot de passe"></label><label class="field">Confirmer le mot de passe<input type="password" placeholder="Confirmez le mot de passe"></label>${button("Mettre à jour","","secondary",'data-action="save-password"')}</section></div>`;
}

const renderers={dashboard:dashboardPage,users:usersPage,cities:citiesPage,promos:promosPage,offers:offersPage,bookings:bookingsPage,tickets:ticketsPage,audit:auditPage,settings:settingsPage,notifications:notificationsPage,profile:profilePage};

async function renderPage(page) {
  if (!pages[page]) page = "dashboard";
  state.page = page;
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  document.querySelector("#page-title").textContent = pages[page];
  document.querySelector("#breadcrumb-page").textContent = pages[page];
  document.querySelector("#page-content").innerHTML = `<div class="card" style="padding:18px;color:var(--muted)">Chargement…</div>`;
  const renderer = renderers[page] || dashboardPage;
  const html = await renderer();
  document.querySelector("#page-content").innerHTML = html;
  renderNav();
  closePopovers();
  bindDynamicEvents();
  lucide.createIcons();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindDynamicEvents() {
  document.querySelectorAll(".nav-link").forEach((el) => {
    if (!el.dataset.page) return;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      renderPage(el.dataset.page);
    });
  });

  document.querySelectorAll("[data-action-city]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const act = btn.dataset.actionCity;
      const cid = btn.dataset.id;
      const foundCity = adminCities.find((x) => String(x.id) === String(cid));
      if (!foundCity) return;
      if (act === "detail") {
        openModal("city-detail", foundCity);
      } else if (act === "edit") {
        openModal("edit-city", foundCity);
      } else if (act === "delete") {
        if (confirm(`Confirmez-vous la suppression de la ville « ${foundCity.name} » ?`)) {
          try {
            await api.delete(`/api/cities/${cid}`);
          } catch (e) {
            console.warn("API DELETE city:", e);
          }
          adminCities = adminCities.filter((x) => String(x.id) !== String(cid));
          showToast("Ville supprimée", `La ville « ${foundCity.name} » a été supprimée.`);
          renderPage("cities");
        }
      }
    });
  });

  document.querySelectorAll("[data-toggle-city]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.classList.toggle("active");
      const id = btn.dataset.toggleCity;
      const c = adminCities.find((x) => String(x.id) === String(id));
      if (c) c.active = btn.classList.contains("active");
      showToast("Statut mis à jour", `La ville est maintenant ${btn.classList.contains("active") ? "active" : "désactivée"}.`);
    });
  });

  document.querySelectorAll("[data-user-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const user = adminUsers.find((x) => String(x.id) === btn.dataset.userEdit);
      if (user) openModal("edit-user", user);
    });
  });

  const bindUserAction = (attr, ask, run, successTitle, successText, errorTitle) => {
    document.querySelectorAll(`[${attr}]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        const user = adminUsers.find((x) => String(x.id) === btn.getAttribute(attr));
        if (!user) return;
        const execute = async () => {
          try {
            await run(user);
            showToast(successTitle, successText(escapeHtml(user.fullName)));
          } catch (e) {
            showToast(errorTitle, escapeHtml(e.message));
          }
          renderPage("users");
        };
        if (ask) {
          confirmModal({ ...ask, message: ask.message(escapeHtml(user.fullName)), onConfirm: execute });
        } else {
          execute();
        }
      });
    });
  };
  bindUserAction("data-user-archive",
    { title: "Archiver l’utilisateur", message: (n) => `Le compte de « ${n} » sera masqué de la liste. Vous pourrez le restaurer à tout moment.`, label: "Archiver", icon: "archive" },
    (u) => api.post(`/api/users/${u.id}/archive`), "Utilisateur archivé", (n) => `Le compte de « ${n} » a été archivé.`, "Archivage impossible");
  bindUserAction("data-user-restore", null,
    (u) => api.post(`/api/users/${u.id}/restore`), "Utilisateur restauré", (n) => `Le compte de « ${n} » est de nouveau actif.`, "Restauration impossible");
  bindUserAction("data-user-delete",
    { title: "Supprimer définitivement", message: (n) => `Le compte de « ${n} » sera supprimé définitivement. Cette action est irréversible.`, label: "Supprimer", icon: "trash-2", danger: true },
    (u) => api.delete(`/api/users/${u.id}`), "Utilisateur supprimé", (n) => `Le compte de « ${n} » a été supprimé définitivement.`, "Suppression impossible");

  document.querySelectorAll("[data-modal]").forEach(el=>el.addEventListener("click",()=>openModal(el.dataset.modal)));
  document.querySelectorAll(".toggle:not([data-toggle-city])").forEach(el=>el.addEventListener("click",()=>el.classList.toggle("active")));

  const searchInput = document.querySelector(".table-search");
  const filterSelects = document.querySelectorAll(".filters select");
  const filterReset = document.querySelector(".filters .reset");

  let currentPage = 1;
  const pageSizeSelect = document.querySelector(".page-size-select");
  let pageSize = pageSizeSelect ? (parseInt(pageSizeSelect.value, 10) || 10) : 10;

  function updateTableDisplay() {
    const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const isUsersPage = state.page === "users";
    const role = isUsersPage && filterSelects[0] ? filterSelects[0].value : "Tous les rôles";
    const status = isUsersPage && filterSelects[1] ? filterSelects[1].value : "Tous les statuts";
    const country = !isUsersPage && filterSelects[0] ? filterSelects[0].value : "Tous les pays";
    const airport = !isUsersPage && filterSelects[1] ? filterSelects[1].value : "Aéroport : Tous";

    const allRows = Array.from(document.querySelectorAll("tbody tr"));
    if (!allRows.length) return;

    // 1. Filtrer les lignes selon les critères
    const matchedRows = [];
    allRows.forEach((row) => {
      const rowSearch = (row.dataset.search || "").toLowerCase();
      const rowCountry = row.dataset.country || "";
      const rowAirport = row.dataset.airport || "";

      const matchQ = !q || rowSearch.includes(q);
      const matchRole = role === "Tous les rôles" || (row.dataset.role || "") === role;
      const rowStatus = row.dataset.status || "";
      const matchStatus = status === "Tous les statuts" || (status === "Utilisateurs actifs" ? rowStatus === "active" : rowStatus === "archived");
      const matchCountry = country === "Tous les pays" || rowCountry === country;
      const matchAirport =
        airport === "Aéroport : Tous" ||
        (airport === "Oui" && rowAirport === "Oui") ||
        (airport === "Non" && (rowAirport === "Non" || rowAirport === "—"));

      if (matchQ && matchRole && matchStatus && matchCountry && matchAirport) {
        matchedRows.push(row);
      } else {
        row.classList.add("hidden");
      }
    });

    // 2. Calcul des pages
    const total = matchedRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // 3. Afficher uniquement les éléments de la page active
    matchedRows.forEach((row, idx) => {
      const onCurrentPage = idx >= (currentPage - 1) * pageSize && idx < currentPage * pageSize;
      row.classList.toggle("hidden", !onCurrentPage);
    });

    // 4. Mettre à jour l'info textuelle
    const infoSpan = document.querySelector(".pagination-info");
    if (infoSpan && state.page !== "users") {
      if (total === 0) {
        infoSpan.textContent = "0 résultat trouvé";
      } else {
        const start = (currentPage - 1) * pageSize + 1;
        const end = Math.min(total, currentPage * pageSize);
        infoSpan.textContent = `Affichage ${start}–${end} sur ${total} élément${total > 1 ? "s" : ""}`;
      }
    }

    // 5. Générer les boutons de pagination
    const buttonsContainer = document.querySelector(".page-buttons");
    if (buttonsContainer) {
      let btnsHtml = "";

      btnsHtml += `<button type="button" class="page-nav prev-page" ${currentPage === 1 ? "disabled" : ""} aria-label="Page précédente">‹</button>`;

      if (totalPages <= 7) {
        for (let p = 1; p <= totalPages; p++) {
          btnsHtml += `<button type="button" class="page-num ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
        }
      } else {
        btnsHtml += `<button type="button" class="page-num ${1 === currentPage ? "active" : ""}" data-page="1">1</button>`;
        if (currentPage > 3) btnsHtml += `<span class="pagination-dots">…</span>`;
        const startP = Math.max(2, currentPage - 1);
        const endP = Math.min(totalPages - 1, currentPage + 1);
        for (let p = startP; p <= endP; p++) {
          btnsHtml += `<button type="button" class="page-num ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
        }
        if (currentPage < totalPages - 2) btnsHtml += `<span class="pagination-dots">…</span>`;
        btnsHtml += `<button type="button" class="page-num ${totalPages === currentPage ? "active" : ""}" data-page="${totalPages}">${totalPages}</button>`;
      }

      btnsHtml += `<button type="button" class="page-nav next-page" ${currentPage === totalPages ? "disabled" : ""} aria-label="Page suivante">›</button>`;

      buttonsContainer.innerHTML = btnsHtml;

      buttonsContainer.querySelectorAll(".page-num").forEach((btn) => {
        btn.addEventListener("click", () => {
          currentPage = parseInt(btn.dataset.page, 10);
          updateTableDisplay();
        });
      });
      buttonsContainer.querySelector(".prev-page")?.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          updateTableDisplay();
        }
      });
      buttonsContainer.querySelector(".next-page")?.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          updateTableDisplay();
        }
      });
    }
  }

  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", (e) => {
      pageSize = parseInt(e.target.value, 10) || 10;
      currentPage = 1;
      updateTableDisplay();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentPage = 1;
      updateTableDisplay();
    });
  }
  filterSelects.forEach((sel) => {
    sel.addEventListener("change", () => {
      currentPage = 1;
      updateTableDisplay();
    });
  });
  if (filterReset) {
    filterReset.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      filterSelects.forEach((sel) => (sel.selectedIndex = 0));
      currentPage = 1;
      updateTableDisplay();
    });
  }

  updateTableDisplay();

  document.querySelectorAll("[data-copy]").forEach(btn=>btn.addEventListener("click",async()=>{ await navigator.clipboard?.writeText(btn.dataset.copy); showToast("Code copié",`${btn.dataset.copy} est dans le presse-papiers.`); }));
  document.querySelectorAll('[data-action="refresh"]').forEach(b=>b.addEventListener("click",()=>showToast("Données actualisées","Les indicateurs sont à jour.")));
  document.querySelectorAll('[data-action="export"]').forEach(b=>b.addEventListener("click",()=>showToast("Export prêt","Le fichier CSV a été généré.")));
  document.querySelectorAll('[data-action="save-setting"]').forEach(b=>b.addEventListener("click",()=>showToast("Paramètre enregistré","La modification s’applique immédiatement.")));
  document.querySelectorAll('[data-action="save-profile"]').forEach(b=>b.addEventListener("click",()=>showToast("Profil mis à jour","Vos informations ont été enregistrées.")));
  document.querySelectorAll('[data-action="save-password"]').forEach(b=>b.addEventListener("click",()=>showToast("Mot de passe modifié","Votre nouveau mot de passe est actif.")));
  document.querySelectorAll('[data-action="read-all"]').forEach(b=>b.addEventListener("click",markAllRead));
}

async function searchCityApi(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();

  // 1. Open-Meteo Geocoding API (Fast, Free, CORS, French localized, ISO-2 codes)
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=fr&format=json`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((r) => ({
          name: r.name,
          country: r.country || "Maroc",
          country_code: (r.country_code || "MA").toUpperCase(),
          admin1: r.admin1 || "",
          latitude: r.latitude != null ? Number(r.latitude.toFixed(4)) : null,
          longitude: r.longitude != null ? Number(r.longitude.toFixed(4)) : null,
        }));
      }
    }
  } catch (err) {
    console.warn("Open-Meteo Geocoding API fallback:", err);
  }

  // 2. Nominatim OpenStreetMap fallback
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => {
          const addr = item.address || {};
          const cityName = addr.city || addr.town || addr.village || item.name || q;
          const country = addr.country || "Maroc";
          const code = (addr.country_code || "ma").toUpperCase();
          return {
            name: cityName,
            country: country,
            country_code: code,
            admin1: addr.state || addr.region || "",
            latitude: item.lat ? Number(parseFloat(item.lat).toFixed(4)) : null,
            longitude: item.lon ? Number(parseFloat(item.lon).toFixed(4)) : null,
          };
        });
      }
    }
  } catch (err) {
    console.warn("Nominatim API fallback:", err);
  }

  return [];
}

async function checkCityAirportApi(cityName) {
  if (!cityName) return "Non";
  const name = cityName.toLowerCase().trim();

  // 1. Base des villes connues avec aéroport commercial (Maroc + destinations clés)
  const knownAirports = new Set([
    "casablanca", "marrakech", "agadir", "tanger", "fès", "fes", "rabat",
    "ouarzazate", "essaouira", "nador", "oujda", "dakhla", "laâyoune", "laayoune",
    "tétouan", "tetouan", "al hoceïma", "al hoceima", "errachidia", "beni mellal",
    "guelmim", "zagora", "tan-tan", "tantan", "paris", "madrid", "barcelone",
    "londres", "dubai", "dubaï", "rome", "lisbonne", "bruxelles", "amsterdam",
    "istanbul", "tunis", "alger", "le caire", "new york", "montréal", "montreal"
  ]);

  if (knownAirports.has(name)) {
    return "Oui";
  }

  // 2. Interrogation de l'API OpenStreetMap pour détecter une infrastructure aéroportuaire
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=aeroport+${encodeURIComponent(cityName)}&format=json&limit=1`, {
      headers: { "Accept-Language": "fr" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        if (item.class === "aeroway" || item.type === "aerodrome") {
          return "Oui";
        }
      }
    }
  } catch (e) {
    console.warn("Airport detection API error:", e);
  }

  return "Non";
}

function bindCityAutocomplete(prefix = "modal") {
  const nameInput = document.querySelector(`#${prefix}-city-name`);
  if (!nameInput) return;

  const countryInput = document.querySelector(`#${prefix}-city-country`);
  const codeInput = document.querySelector(`#${prefix}-city-code`);
  const airportInput = document.querySelector(`#${prefix}-city-airport`);
  const latInput = document.querySelector(`#${prefix}-city-lat`);
  const lngInput = document.querySelector(`#${prefix}-city-lng`);
  const spinner = document.querySelector(`#${prefix}-city-api-spinner`);
  const suggestionsBox = document.querySelector(`#${prefix}-city-suggestions`);
  const geoStatus = document.querySelector(`#${prefix}-city-geo-status`);
  const geoDesc = document.querySelector(`#${prefix}-city-geo-desc`);

  let debounceTimer = null;
  let activeIndex = -1;
  let currentResults = [];

  async function applyCitySelection(item) {
    nameInput.value = item.name;
    if (countryInput) countryInput.value = item.country;
    if (codeInput) codeInput.value = item.country_code;
    if (latInput && item.latitude != null) latInput.value = item.latitude;
    if (lngInput && item.longitude != null) lngInput.value = item.longitude;

    // Détection automatique de la présence d'un aéroport via API
    const hasAirport = await checkCityAirportApi(item.name);
    if (airportInput) airportInput.value = hasAirport;

    if (geoStatus) {
      geoStatus.innerHTML = `<span style="color:#107e3e;font-weight:700;">✓ Détecté via API : ${escapeHtml(item.name)}, ${escapeHtml(item.country)}</span>`;
    }
    if (geoDesc) {
      geoDesc.textContent = `Aéroport : ${hasAirport === "Oui" ? "Oui ✈" : "Non"} · Code : ${item.country_code} · GPS : ${item.latitude ?? '—'}, ${item.longitude ?? '—'}${item.admin1 ? ' · Région : ' + item.admin1 : ''}`;
    }

    if (suggestionsBox) {
      suggestionsBox.innerHTML = "";
      suggestionsBox.classList.add("hidden");
    }

    showToast("API Géographique", `Pays « ${item.country} », code « ${item.country_code} » et aéroport (« ${hasAirport} ») détectés automatiquement.`);
  }

  async function triggerSearch(q) {
    if (!suggestionsBox) return;
    if (!q || q.length < 2) {
      suggestionsBox.innerHTML = "";
      suggestionsBox.classList.add("hidden");
      if (spinner) spinner.classList.add("hidden");
      return;
    }
    if (spinner) spinner.classList.remove("hidden");
    const results = await searchCityApi(q);
    if (spinner) spinner.classList.add("hidden");
    currentResults = results;
    activeIndex = -1;

    if (!results.length) {
      suggestionsBox.innerHTML = `<div style="padding:10px 14px;font-size:10px;color:var(--muted);text-align:center;">Aucun résultat API pour « ${escapeHtml(q)} »</div>`;
      suggestionsBox.classList.remove("hidden");
      return;
    }

    suggestionsBox.innerHTML = results.map((item, idx) => {
      return `
        <div class="city-item" data-idx="${idx}">
          <div class="city-item-main">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${item.admin1 ? escapeHtml(item.admin1) + ', ' : ''}${escapeHtml(item.country)}</span>
          </div>
          <span class="city-item-badge">${escapeHtml(item.country_code)}</span>
        </div>
      `;
    }).join("");
    suggestionsBox.classList.remove("hidden");

    suggestionsBox.querySelectorAll(".city-item").forEach(itemEl => {
      itemEl.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const idx = parseInt(itemEl.dataset.idx, 10);
        if (currentResults[idx]) {
          applyCitySelection(currentResults[idx]);
        }
      });
    });
  }

  nameInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      triggerSearch(nameInput.value.trim());
    }, 280);
  });

  nameInput.addEventListener("keydown", (e) => {
    if (!suggestionsBox) return;
    const items = suggestionsBox.querySelectorAll(".city-item");
    if (!items.length || suggestionsBox.classList.contains("hidden")) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && currentResults[activeIndex]) {
        e.preventDefault();
        applyCitySelection(currentResults[activeIndex]);
      }
    } else if (e.key === "Escape") {
      suggestionsBox.classList.add("hidden");
    }
  });

  function updateActiveItem(items) {
    items.forEach((el, idx) => {
      el.classList.toggle("active", idx === activeIndex);
      if (idx === activeIndex) el.scrollIntoView({ block: "nearest" });
    });
  }

  nameInput.addEventListener("blur", async () => {
    setTimeout(async () => {
      if (suggestionsBox) suggestionsBox.classList.add("hidden");
      const q = nameInput.value.trim();
      if (q.length >= 2 && (!countryInput?.value || (countryInput.value === "Maroc" && !latInput?.value))) {
        if (spinner) spinner.classList.remove("hidden");
        const results = await searchCityApi(q);
        if (spinner) spinner.classList.add("hidden");
        if (results.length > 0) {
          applyCitySelection(results[0]);
        }
      }
    }, 200);
  });
}

function confirmModal({ title, message, label, icon: iconName = "triangle-alert", danger = false, onConfirm }) {
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop"><div class="modal"><header class="modal-header"><span class="modal-symbol ${danger ? "danger" : ""}">${icon(iconName)}</span><div><h2>${title}</h2><p>${message}</p></div><button data-close-modal>${icon("x")}</button></header><footer class="modal-actions">${button("Annuler", "", "ghost", "data-close-modal")}${button(label, "", danger ? "danger" : "primary", "data-confirm-modal")}</footer></div></div>`;
  lucide.createIcons();
  document.querySelectorAll("[data-close-modal]").forEach((b) => b.addEventListener("click", closeModal));
  document.querySelector(".modal-backdrop").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeModal(); });
  document.querySelector("[data-confirm-modal]").addEventListener("click", () => { closeModal(); onConfirm(); });
}

function userFormBody(user = null) {
  const roles = [["CLIENT", "Client"], ["SUPPLIER", "Fournisseur"], ["AGENT", "Agent"], ["ADMIN", "Administrateur"]];
  const options = roles.map(([value, label]) => `<option value="${value}" ${user?.role === value ? "selected" : ""}>${label}</option>`).join("");
  const passwordHint = user ? "Laissez vide pour conserver le mot de passe actuel." : "8 caractères minimum.";
  return `<div class="form-grid"><label class="field full">Nom complet<input id="user-fullname" placeholder="Prénom Nom" maxlength="120" value="${user ? escapeHtml(user.fullName) : ""}"></label><label class="field full">Email<input id="user-email" type="email" placeholder="nom@exemple.ma" maxlength="180" value="${user ? escapeHtml(user.email) : ""}"></label><label class="field">Rôle<select id="user-role">${options}</select></label><label class="field">Mot de passe<input id="user-password" type="password" autocomplete="new-password" maxlength="100" placeholder="${user ? "Inchangé" : "Mot de passe"}"><small>${passwordHint}</small></label></div>`;
}

function openModal(type, extra = null) {
  const cityObj = extra && typeof extra === "object" ? extra : (extra != null ? adminCities.find(c => String(c.id) === String(extra)) : null);
  const userObj = type.includes("user") && extra && typeof extra === "object" ? extra : null;

  const configs={
    "create-user":{title:"Créer un compte",subtitle:"Ajoutez un membre à la plateforme.",icon:"user-plus",large:true,body:userFormBody(),confirm:"Créer le compte"},
    "edit-user":{title:`Modifier ${userObj ? escapeHtml(userObj.fullName) : "l’utilisateur"}`,subtitle:"Mettez à jour les informations et le rôle du compte.",icon:"pencil",large:true,body:userFormBody(userObj),confirm:"Enregistrer"},    city:{title:"Ajouter une ville",subtitle:"Tapez une ville : le pays, le code pays et les coordonnées se remplissent automatiquement via l’API.",icon:"map-pin",large:true,body:`<div class="form-grid"><label class="field full" style="position:relative;"><div style="display:flex;justify-content:space-between;align-items:center;"><span>Nom de la ville</span><span style="font-size:8px;color:var(--primary-700);font-weight:600;">✨ Recherche & Remplissage auto via API</span></div><div class="city-input-wrap"><input id="modal-city-name" placeholder="Ex. Marrakech, Agadir, Tanger, Paris, Madrid..." autocomplete="off" required><span id="modal-city-api-spinner" class="city-spinner hidden">${icon("loader-2")}</span></div><div id="modal-city-suggestions" class="city-suggestions hidden"></div></label><label class="field"><span>Pays (rempli automatiquement)</span><input id="modal-city-country" placeholder="Rempli via l'API" value="Maroc"></label><label class="field"><span>Code pays ISO-2 (rempli automatiquement)</span><input id="modal-city-code" placeholder="Ex. MA" value="MA" maxlength="4" style="text-transform:uppercase;"></label><label class="field"><span>Aéroport</span><select id="modal-city-airport"><option selected>Oui</option><option>Non</option></select></label><label class="field"><span>Latitude</span><input id="modal-city-lat" type="number" step="any" placeholder="31.6342"></label><label class="field"><span>Longitude</span><input id="modal-city-lng" type="number" step="any" placeholder="-7.9999"></label><div class="map-placeholder full" id="modal-city-geo-preview">${icon("map-pin")}<strong id="modal-city-geo-status">Coordonnées géographiques automatiques</strong><span id="modal-city-geo-desc">Tapez un nom de ville pour auto-compléter le pays, le code et la géolocalisation</span></div></div>`,confirm:"Ajouter la ville",message:"La ville a été ajoutée."},
    "edit-city":{title:`Modifier ${cityObj ? escapeHtml(cityObj.name) : "la ville"}`,subtitle:"Recherchez la ville : le pays et le code ISO-2 se mettent à jour automatiquement via l'API.",icon:"pencil",large:true,body:`<div class="form-grid"><label class="field full" style="position:relative;"><div style="display:flex;justify-content:space-between;align-items:center;"><span>Nom de la ville</span><span style="font-size:8px;color:var(--primary-700);font-weight:600;">✨ Synchronisation via API</span></div><div class="city-input-wrap"><input id="edit-city-name" value="${cityObj ? escapeHtml(cityObj.name) : ""}" autocomplete="off" required><span id="edit-city-api-spinner" class="city-spinner hidden">${icon("loader-2")}</span></div><div id="edit-city-suggestions" class="city-suggestions hidden"></div></label><label class="field"><span>Pays (rempli automatiquement)</span><input id="edit-city-country" value="${cityObj ? escapeHtml(cityObj.country) : "Maroc"}"></label><label class="field"><span>Code pays ISO-2 (rempli automatiquement)</span><input id="edit-city-code" value="${cityObj ? escapeHtml(cityObj.code) : "MA"}" maxlength="4" style="text-transform:uppercase;"></label><label class="field"><span>Aéroport</span><select id="edit-city-airport"><option ${cityObj?.airport==='Oui'?'selected':''}>Oui</option><option ${cityObj?.airport==='Non'?'selected':''}>Non</option></select></label><label class="field"><span>Latitude</span><input id="edit-city-lat" type="number" step="any" value="${cityObj && cityObj.latitude!=='—'?cityObj.latitude:''}"></label><label class="field"><span>Longitude</span><input id="edit-city-lng" type="number" step="any" value="${cityObj && cityObj.longitude!=='—'?cityObj.longitude:''}"></label><div class="map-placeholder full" id="edit-city-geo-preview">${icon("map-pin")}<strong id="edit-city-geo-status">${cityObj?.latitude && cityObj.latitude!=='—'?`Coordonnées : ${cityObj.latitude}, ${cityObj.longitude}`:"Coordonnées géographiques automatiques"}</strong><span id="edit-city-geo-desc">${cityObj ? `${escapeHtml(cityObj.name)} · ${escapeHtml(cityObj.country)} (${escapeHtml(cityObj.code)})` : "Modifiez la ville pour recharger les informations via l'API"}</span></div></div>`,confirm:"Enregistrer",message:"La ville a été mise à jour."},
    "city-detail":{title:`Détail : ${cityObj ? escapeHtml(cityObj.name) : ""}`,subtitle:"Informations complètes du référentiel.",icon:"eye",large:true,body:`<div class="form-grid"><div class="field"><span>Nom de la ville</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.name) : "—"}</strong></div><div class="field"><span>Pays & Code</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.country) : "Maroc"} (${cityObj ? escapeHtml(cityObj.code) : "MA"})</strong></div><div class="field"><span>Latitude</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.latitude) : "—"}</strong></div><div class="field"><span>Longitude</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.longitude) : "—"}</strong></div><div class="field"><span>Aéroport desservi</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.airport) : "—"}</strong></div><div class="field"><span>Offres associées</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? cityObj.offers : 0} offres disponibles</strong></div><div class="map-placeholder full">${icon("map")}<strong>Coordonnées GPS</strong><span>${cityObj ? cityObj.latitude : ""}, ${cityObj ? cityObj.longitude : ""}</span></div></div>`,confirm:"Annuler",message:"Consultation terminée."},
    "city-actions":{title:`Actions — ${cityObj ? escapeHtml(cityObj.name) : "Ville"}`,subtitle:"Choisissez une action à effectuer.",icon:"settings",body:`<div class="grid gap-2">${button("Voir le détail","eye","secondary",`data-action-city="detail" data-id="${cityObj?.id}"`)}${button("Modifier","pencil","secondary",`data-action-city="edit" data-id="${cityObj?.id}"`)}${button("Supprimer","trash-2","danger",`data-action-city="delete" data-id="${cityObj?.id}"`)}</div>`,confirm:"Fermer",message:"Action effectuée."},
    promo:{title:"Créer un code promo",subtitle:"Configurez une nouvelle campagne.",icon:"tags",large:true,body:`<div class="form-grid"><label class="field full">Code promotionnel<input placeholder="EX. AUTOMNE25"></label><label class="field">Type<select><option>Pourcentage</option><option>Montant fixe</option></select></label><label class="field">Valeur<input placeholder="10 %"></label><label class="field">Montant minimum<input placeholder="500,00 MAD"></label><label class="field">Date d’expiration<input type="date"></label></div>`,confirm:"Créer le code",message:"Le code promo a été créé."},
    offer:{title:"Désactiver l’offre",subtitle:"Cette action a un impact immédiat.",icon:"triangle-alert",danger:true,body:`<div class="modal-warning">${icon("triangle-alert")}Le fournisseur sera notifié. Les bundles contenant cette offre seront dépubliés automatiquement.</div><label class="field">Motif obligatoire<textarea placeholder="Décrivez précisément le motif..."></textarea></label><div class="reason-pills"><button>Contenu inexact</button><button>Prix abusif</button><button>Signalement client</button><button>Autre</button></div>`,confirm:"Désactiver",message:"L’offre a été désactivée et le fournisseur notifié."},
  };
  const c=configs[type]||actionConfig;
  const isDetail = type === "city-detail";
  const actionsHtml = isDetail
    ? button("Annuler", "", "ghost", "data-close-modal")
    : `${button("Annuler", "", "ghost", "data-close-modal")}${button(c.confirm, "", c.danger ? "danger" : "primary", 'data-confirm-modal')}`;
  document.querySelector("#modal-root").innerHTML=`<div class="modal-backdrop"><div class="modal ${c.large?"large":""}"><header class="modal-header"><span class="modal-symbol ${c.danger?"danger":""}">${icon(c.icon)}</span><div><h2>${c.title}</h2><p>${c.subtitle}</p></div><button data-close-modal>${icon("x")}</button></header><div class="modal-body">${c.body}</div><footer class="modal-actions">${actionsHtml}</footer></div></div>`;
  lucide.createIcons();
  
  if (type === "city") {
    bindCityAutocomplete("modal");
  } else if (type === "edit-city") {
    bindCityAutocomplete("edit");
  }
  
  document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",closeModal));
  
  document.querySelectorAll("[data-action-city]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const act = btn.dataset.actionCity;
      const cid = btn.dataset.id;
      const foundCity = adminCities.find(x => String(x.id) === String(cid));
      closeModal();
      if (act === "detail") {
        openModal("city-detail", foundCity);
      } else if (act === "edit") {
        openModal("edit-city", foundCity);
      } else if (act === "delete") {
        if (confirm(`Confirmez-vous la suppression de la ville « ${foundCity?.name} » ?`)) {
          try {
            await api.delete(`/api/cities/${cid}`);
          } catch (e) {
            console.warn("API DELETE city:", e);
          }
          adminCities = adminCities.filter(x => String(x.id) !== String(cid));
          showToast("Ville supprimée", `La ville « ${foundCity?.name} » a été supprimée.`);
          renderPage("cities");
        }
      }
    });
  });

  document.querySelector("[data-confirm-modal]").addEventListener("click", async () => {
    if (type === "create-user" || type === "edit-user") {
      const fullName = document.querySelector("#user-fullname").value.trim();
      const email = document.querySelector("#user-email").value.trim();
      const role = document.querySelector("#user-role").value;
      const password = document.querySelector("#user-password").value;
      if (!fullName || !email) {
        showToast("Champs requis", "Le nom complet et l’email sont obligatoires.");
        return;
      }
      if ((type === "create-user" && !password) || (password && password.length < 8)) {
        showToast("Mot de passe invalide", "Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
      const payload = { fullName, email, role, ...(password ? { password } : {}) };
      try {
        if (type === "create-user") {
          await api.post("/api/users", payload);
        } else {
          await api.put(`/api/users/${userObj.id}`, payload);
        }
      } catch (e) {
        showToast("Enregistrement impossible", escapeHtml(e.message));
        return;
      }
      closeModal();
      showToast(type === "create-user" ? "Compte créé" : "Compte modifié", `Le compte de « ${escapeHtml(fullName)} » a été enregistré.`);
      renderPage("users");
      return;
    }

    if (type === "city") {
      const nameVal = document.querySelector("#modal-city-name")?.value.trim();
      if (!nameVal) {
        showToast("Champ requis", "Veuillez saisir le nom de la ville.");
        return;
      }
      const countryVal = document.querySelector("#modal-city-country")?.value || "Maroc";
      const codeVal = (document.querySelector("#modal-city-code")?.value || "MA").toUpperCase();
      const airportVal = document.querySelector("#modal-city-airport")?.value || "Oui";
      const latRaw = document.querySelector("#modal-city-lat")?.value;
      const lngRaw = document.querySelector("#modal-city-lng")?.value;
      const latNum = latRaw ? parseFloat(latRaw) : null;
      const lngNum = lngRaw ? parseFloat(lngRaw) : null;

      let newId = Date.now();
      try {
        const created = await api.post("/api/cities", {
          name: nameVal,
          latitude: latNum,
          longitude: lngNum,
        });
        if (created?.id) newId = created.id;
      } catch (e) {
        console.warn("API POST city:", e);
      }

      adminCities.unshift({
        id: newId,
        name: nameVal,
        country: countryVal,
        code: codeVal,
        latitude: latNum != null ? latNum.toFixed(4) : "—",
        longitude: lngNum != null ? lngNum.toFixed(4) : "—",
        airport: airportVal,
        offers: 12,
        active: true,
      });
      closeModal();
      showToast("Ville ajoutée", `La ville « ${nameVal} » a été enregistrée avec succès.`);
      renderPage("cities");
      return;
    }

    if (type === "edit-city" && cityObj) {
      const nameVal = document.querySelector("#edit-city-name")?.value.trim();
      if (!nameVal) {
        showToast("Champ requis", "Le nom de la ville ne peut être vide.");
        return;
      }
      const countryVal = document.querySelector("#edit-city-country")?.value || "Maroc";
      const codeVal = (document.querySelector("#edit-city-code")?.value || "MA").toUpperCase();
      const airportVal = document.querySelector("#edit-city-airport")?.value || "Oui";
      const latRaw = document.querySelector("#edit-city-lat")?.value;
      const lngRaw = document.querySelector("#edit-city-lng")?.value;
      const latNum = latRaw ? parseFloat(latRaw) : null;
      const lngNum = lngRaw ? parseFloat(lngRaw) : null;

      try {
        await api.put(`/api/cities/${cityObj.id}`, {
          name: nameVal,
          latitude: latNum,
          longitude: lngNum,
        });
      } catch (e) {
        console.warn("API PUT city:", e);
      }

      const idx = adminCities.findIndex(c => String(c.id) === String(cityObj.id));
      if (idx !== -1) {
        adminCities[idx] = {
          ...adminCities[idx],
          name: nameVal,
          country: countryVal,
          code: codeVal,
          airport: airportVal,
          latitude: latNum != null ? latNum.toFixed(4) : "—",
          longitude: lngNum != null ? lngNum.toFixed(4) : "—",
        };
      }
      closeModal();
      showToast("Ville modifiée", `La ville « ${nameVal} » a été mise à jour.`);
      renderPage("cities");
      return;
    }

    closeModal();
    showToast("Modification enregistrée", c.message);
  });

  document.querySelector(".modal-backdrop").addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal();});
  lucide.createIcons();
}
function closeModal(){document.querySelector("#modal-root").innerHTML="";}
function showToast(title,message){
  const id=`toast-${Date.now()}`;
  document.querySelector("#toast-container").insertAdjacentHTML("beforeend",`<div id="${id}" class="toast"><span class="toast-icon">${icon("check")}</span><div><strong>${title}</strong><span>${message}</span></div><button onclick="this.parentElement.remove()">${icon("x")}</button></div>`);
  lucide.createIcons();
  setTimeout(()=>document.querySelector(`#${id}`)?.remove(),3000);
}
function closePopovers(){document.querySelector("#notification-popover").classList.add("hidden");document.querySelector("#account-popover").classList.add("hidden");}
function markAllRead(){state.notifications.forEach(n=>n.unread=false);renderNotificationsPreview();if(state.page==="notifications")renderPage("notifications");showToast("Notifications lues","Toutes les notifications ont été marquées comme lues.");lucide.createIcons();}

document.querySelector("#sidebar-toggle").addEventListener("click",()=>{
  state.collapsed=!state.collapsed;
  document.querySelector("#sidebar").classList.toggle("collapsed",state.collapsed);
  document.querySelector("#brand-area").classList.toggle("collapsed",state.collapsed);
  document.querySelector("#main-content").classList.toggle("expanded",state.collapsed);
});
document.querySelector("#notification-toggle").addEventListener("click",e=>{e.stopPropagation();document.querySelector("#account-popover").classList.add("hidden");document.querySelector("#notification-popover").classList.toggle("hidden");});
document.querySelector("#account-toggle").addEventListener("click",e=>{e.stopPropagation();document.querySelector("#notification-popover").classList.add("hidden");document.querySelector("#account-popover").classList.toggle("hidden");});
document.querySelector("#logout").addEventListener("click",()=>{closePopovers();document.querySelector("#admin-app").classList.add("hidden");document.querySelector("#login-screen").classList.remove("hidden");lucide.createIcons();});
document.querySelector("#login-form").addEventListener("submit",e=>{e.preventDefault();document.querySelector("#login-screen").classList.add("hidden");document.querySelector("#admin-app").classList.remove("hidden");showToast("Connexion réussie","Bienvenue dans votre espace administrateur.");});
document.querySelector("#toggle-password").addEventListener("click",()=>{const input=document.querySelector("#password");input.type=input.type==="password"?"text":"password";});
document.addEventListener("click",e=>{if(!e.target.closest(".popover-wrap"))closePopovers();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closePopovers();closeModal();}});

document.querySelector("#public-site-btn")?.addEventListener("click", () => {
  window.location.href = "../accueil.html";
});

renderNav();
renderNotificationsPreview();
const requestedPage = new URLSearchParams(window.location.search).get("page") || "dashboard";
renderPage(requestedPage in pages ? requestedPage : "dashboard");
