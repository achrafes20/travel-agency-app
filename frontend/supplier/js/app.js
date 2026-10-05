const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const images = {
  hotel: "https://images.unsplash.com/photo-1548018560-4cb48a8837c1?auto=format&fit=crop&w=700&q=82",
  riad: "https://images.unsplash.com/photo-1570133435573-fcb96d98f69b?auto=format&fit=crop&w=700&q=82",
  nature: "https://images.unsplash.com/photo-1489493585363-d69421e0edd3?auto=format&fit=crop&w=700&q=82",
  taxi: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=700&q=82",
  medina: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=700&q=82",
};

const offers = [
  { id: 1, title: "Riad Atlas — Chambre Safran", city: "Chefchaouen", type: "Hôtel", price: "890,00 MAD", total: 8, reserved: 3, available: 5, status: "Active", image: images.hotel },
  { id: 2, title: "Riad Atlas — Suite Bleue", city: "Chefchaouen", type: "Hôtel", price: "1 260,00 MAD", total: 5, reserved: 3, available: 2, status: "Active", image: images.riad },
  { id: 3, title: "Excursion cascades d’Akchour", city: "Chefchaouen", type: "Excursion", price: "450,00 MAD", total: 12, reserved: 9, available: 3, status: "Active", image: images.nature },
  { id: 4, title: "Transfert aéroport de Tanger", city: "Tanger", type: "Taxi", price: "450,00 MAD", total: 4, reserved: 1, available: 3, status: "Inactive", image: images.taxi },
  { id: 5, title: "Circuit médina & gastronomie", city: "Tétouan", type: "Excursion", price: "620,00 MAD", total: 10, reserved: 4, available: 6, status: "Admin", image: images.medina },
];

const bookings = [
  ["BK-2026-000128", "Riad Atlas — Chambre Safran", "Sofia Martin", "12–15 oct. 2026", "2 670,00 MAD", "Confirmée"],
  ["BK-2026-000127", "Excursion Akchour", "Yassine Amrani", "09 oct. 2026", "900,00 MAD", "En attente"],
  ["BK-2026-000126", "Riad Atlas — Suite Bleue", "Emma Laurent", "06–09 oct. 2026", "3 780,00 MAD", "Confirmée"],
  ["BK-2026-000124", "Transfert aéroport Tanger", "Omar El Idrissi", "04 oct. 2026", "450,00 MAD", "Terminée"],
  ["BK-2026-000123", "Riad Atlas — Chambre Cèdre", "Lina Haddad", "02–04 oct. 2026", "1 780,00 MAD", "Annulée"],
];

const state = {
  page: "dashboard",
  offerStep: 1,
  offerType: "hotel",
  offerView: "table",
  profileTab: "company",
  notificationFilter: "all",
};

const pageContent = $("#page-content");
const badgeTone = status => status === "Confirmée" || status === "Active" ? "success" : status === "En attente" ? "warning" : status === "Annulée" || status === "Admin" ? "danger" : status === "Terminée" ? "info" : "neutral";
const icon = name => `<i data-lucide="${name}"></i>`;
const button = (label, iconName = "", variant = "primary", attrs = "") => `<button class="btn btn-${variant}" ${attrs}>${iconName ? icon(iconName) : ""}<span>${label}</span></button>`;
const badge = (label, tone = "neutral") => `<span class="badge badge-${tone}">${label}</span>`;

function pageHeader(section, title, subtitle, action = "") {
  return `<div class="page-header">
    <div>
      <div class="breadcrumb">Espace fournisseur <span>/</span> ${section}</div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>
    ${action}
  </div>`;
}

function renderDashboard() {
  const reservationRows = bookings.map(b => `<tr>
    <td class="reference">${b[0]}</td><td><strong>${b[1]}</strong></td><td>${b[2]}</td>
    <td>${b[3]}</td><td><strong>${b[4]}</strong></td><td>${badge(b[5], badgeTone(b[5]))}</td>
  </tr>`).join("");

  pageContent.innerHTML = `
    ${pageHeader("Vue d’ensemble", "Bonjour, Riad Atlas", "Voici ce qui se passe dans votre établissement aujourd’hui.", button("Nouvelle offre", "plus", "primary", 'data-page="new-offer"'))}
    <section class="welcome-banner mb-4">
      <div>
        <span class="eyebrow">MARDI 6 OCTOBRE 2026</span>
        <h2 class="mt-2 text-xl font-bold">Votre activité progresse ce mois-ci</h2>
        <p class="mt-1 text-[11px] text-blue-200">+18 % de réservations par rapport au mois dernier. Continuez comme ça.</p>
      </div>
      <i data-lucide="trending-up" class="mr-14 h-12 w-12 text-atlas-amber"></i>
    </section>

    <section class="mb-4 grid grid-cols-4 gap-4">
      ${kpi("briefcase-business", "Offres actives", "12", "3 offres inactives", "blue")}
      ${kpi("calendar-days", "Réservations du mois", "28", "+18 % vs. septembre", "blue")}
      ${kpi("wallet-cards", "Chiffre d’affaires", "46 800,00 MAD", "+8,4 % ce mois", "blue")}
      ${kpi("triangle-alert", "Stock bas", "2", "Nécessitent votre attention", "amber")}
    </section>

    <section class="mb-4 grid grid-cols-[1.7fr_.8fr] gap-4">
      <div class="card p-5">
        <div class="card-heading">
          <div><h2>Réservations des 6 derniers mois</h2><p>Confirmées et terminées</p></div>
          <select class="control"><option>6 derniers mois</option><option>12 derniers mois</option></select>
        </div>
        <div class="chart mt-4">
          ${[38,51,45,67,61,84].map((h,i) => `<div class="chart-column"><i style="height:${h}%"></i><span>${["Mai","Juin","Juil.","Août","Sept.","Oct."][i]}</span></div>`).join("")}
        </div>
      </div>
      <div class="card p-5">
        <div class="card-heading"><div><h2>Offres à stock bas</h2><p>Seuil d’alerte : 3 unités</p></div>${badge("2 alertes", "warning")}</div>
        ${stockItem("hotel", "Suite Bleue", "Riad Atlas · Hôtel", "2", "restantes")}
        ${stockItem("users-round", "Excursion Akchour", "Chefchaouen · Excursion", "3", "places")}
        <div class="mt-4">${button("Ajuster le stock", "arrow-right", "secondary", 'data-page="inventory" class="w-full"')}</div>
      </div>
    </section>

    <section class="grid grid-cols-[2.2fr_.8fr] gap-4">
      <div class="card overflow-hidden">
        <div class="flex items-start justify-between p-5">
          <div class="card-heading"><div><h2>Dernières réservations</h2><p>Vos 5 réservations les plus récentes</p></div></div>
          <button class="flex items-center gap-1 text-[9px] font-bold text-atlas-royal" data-page="bookings">Tout voir ${icon("arrow-right")}</button>
        </div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Référence</th><th>Offre</th><th>Client</th><th>Dates</th><th>Montant</th><th>Statut</th></tr></thead><tbody>${reservationRows}</tbody></table></div>
      </div>
      <div class="card p-5">
        <div class="card-heading mb-2"><div><h2>Activité récente</h2><p>Vos dernières notifications</p></div></div>
        ${activity("calendar", "blue", "Nouvelle réservation", "Sofia Martin a réservé Suite Safran.", "Il y a 12 min")}
        ${activity("triangle-alert", "amber", "Stock bas", "Il ne reste que 2 Suite Bleue.", "Il y a 2 h")}
        ${activity("calendar-check", "green", "Réservation confirmée", "BK-2026-000126 est confirmée.", "Hier, 18:42")}
      </div>
    </section>`;
}

function kpi(iconName, label, value, detail, tone) {
  const classes = tone === "amber" ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-atlas-royal";
  return `<article class="card kpi-card"><div class="flex items-start justify-between"><span class="icon-box ${classes}">${icon(iconName)}</span>${icon("ellipsis")}</div><p class="mt-3 text-[10px] text-atlas-muted">${label}</p><strong class="kpi-value block">${value}</strong><small class="mt-2 block text-[9px] ${tone === "amber" ? "text-amber-600" : "text-green-600"}">${detail}</small></article>`;
}
function stockItem(iconName, title, subtitle, value, unit) {
  return `<div class="grid grid-cols-[38px_1fr_auto] items-center gap-3 border-b border-atlas-border py-3"><span class="icon-box bg-blue-50 text-atlas-royal">${icon(iconName)}</span><div><strong class="block text-[10px]">${title}</strong><small class="mt-1 block text-[8px] text-atlas-muted">${subtitle}</small></div><div class="text-right"><b class="block text-lg text-amber-600">${value}</b><small class="text-[8px] text-atlas-muted">${unit}</small></div></div>`;
}
function activity(iconName, tone, title, text, time) {
  const colors = { blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600", green: "bg-green-100 text-green-600", red: "bg-red-100 text-red-600", purple: "bg-violet-100 text-violet-600" };
  return `<div class="grid grid-cols-[36px_1fr_6px] gap-3 border-b border-atlas-border py-3"><span class="icon-box ${colors[tone]}">${icon(iconName)}</span><div><strong class="block text-[9px]">${title}</strong><p class="mt-1 text-[8px] text-atlas-muted">${text}</p><small class="mt-1 block text-[7px] text-gray-400">${time}</small></div><i class="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"></i></div>`;
}

function renderOffers() {
  pageContent.innerHTML = `
    ${pageHeader("Catalogue", "Mes offres", "Gérez vos prestations, leur visibilité et leurs disponibilités.", button("Nouvelle offre", "plus", "primary", 'data-page="new-offer"'))}
    <div class="card toolbar mb-4">
      <label class="search-field">${icon("search")}<input id="offer-search" placeholder="Rechercher une offre…" /></label>
      <select id="offer-type-filter" class="control"><option value="">Tous les types</option><option>Hôtel</option><option>Excursion</option><option>Taxi</option></select>
      <select id="offer-status-filter" class="control"><option value="">Tous les statuts</option><option>Active</option><option>Inactive</option><option value="Admin">Désactivée par l’admin</option></select>
      <select class="control"><option>Plus récentes</option><option>Prix croissant</option></select>
      <div class="flex rounded-lg bg-gray-100 p-1">
        <button class="offer-view grid h-8 w-8 place-items-center rounded-md ${state.offerView === "table" ? "bg-white text-atlas-royal shadow" : "text-gray-500"}" data-view="table">${icon("list")}</button>
        <button class="offer-view grid h-8 w-8 place-items-center rounded-md ${state.offerView === "grid" ? "bg-white text-atlas-royal shadow" : "text-gray-500"}" data-view="grid">${icon("layout-grid")}</button>
      </div>
    </div>
    <div id="offers-results"></div>`;
  renderOfferResults();
  $("#offer-search").addEventListener("input", renderOfferResults);
  $("#offer-type-filter").addEventListener("change", renderOfferResults);
  $("#offer-status-filter").addEventListener("change", renderOfferResults);
}

function renderOfferResults() {
  const root = $("#offers-results");
  if (!root) return;
  const query = ($("#offer-search")?.value || "").toLowerCase();
  const type = $("#offer-type-filter")?.value || "";
  const status = $("#offer-status-filter")?.value || "";
  const filtered = offers.filter(o => o.title.toLowerCase().includes(query) && (!type || o.type === type) && (!status || o.status === status));
  if (!filtered.length) {
    root.innerHTML = emptyState("search-x", "Aucune offre ne correspond", "Essayez de modifier les filtres ou votre recherche.", "Effacer les filtres", "clear-offer-filters");
    return;
  }
  if (state.offerView === "grid") {
    root.innerHTML = `<div class="grid grid-cols-3 gap-4">${filtered.map(offerCard).join("")}</div>`;
  } else {
    root.innerHTML = `<div class="card overflow-hidden"><div class="table-wrap"><table class="data-table"><thead><tr><th>Offre</th><th>Type</th><th>Prix de base</th><th>Stock T / R / D</th><th>Actif</th><th>Statut</th><th></th></tr></thead><tbody>${filtered.map(offerRow).join("")}</tbody></table></div>${pagination()}</div>`;
  }
  lucide.createIcons();
}

function offerRow(o) {
  const statusText = o.status === "Admin" ? "Désactivée par l’admin" : o.status;
  return `<tr>
    <td><div class="offer-cell"><img src="${o.image}" alt=""><div><strong>${o.title}</strong><span>${o.city}</span>${o.status === "Admin" ? '<small class="mt-1 block text-[7px] text-red-600">Motif : contenu à vérifier</small>' : ""}</div></div></td>
    <td><span class="flex items-center gap-1.5 font-semibold text-atlas-royal">${icon(o.type === "Hôtel" ? "hotel" : o.type === "Taxi" ? "car-taxi-front" : "users-round")} ${o.type}</span></td>
    <td><strong>${o.price}</strong><small class="block text-[7px] text-atlas-muted">/ unité</small></td>
    <td>${o.total} / ${o.reserved} / ${o.available}</td>
    <td><button class="switch ${o.status === "Active" ? "on" : ""} ${o.status === "Admin" ? "opacity-40" : ""}" ${o.status === "Admin" ? "disabled" : ""} aria-label="Changer le statut"></button></td>
    <td>${badge(statusText, badgeTone(o.status))}</td>
    <td><button class="icon-button offer-menu" data-offer="${o.id}" aria-label="Actions">${icon("ellipsis")}</button></td>
  </tr>`;
}
function offerCard(o) {
  return `<article class="card overflow-hidden"><div class="relative h-44"><img src="${o.image}" alt="" class="h-full w-full object-cover"><span class="absolute right-3 top-3">${badge(o.status, badgeTone(o.status))}</span></div><div class="p-5"><span class="eyebrow">${o.type.toUpperCase()} · ${o.city.toUpperCase()}</span><h2 class="mt-2 text-sm font-bold">${o.title}</h2><p class="mt-2 text-[9px] leading-5 text-atlas-muted">Une expérience marocaine authentique pensée avec soin pour vos voyageurs.</p><div class="mt-4 flex items-end justify-between border-t border-atlas-border pt-4"><span class="text-[8px] text-atlas-muted">À partir de</span><strong class="text-sm text-atlas-royal">${o.price}</strong></div></div></article>`;
}

async function loadOfferCities() {
  const select = $("#offer-city-select");
  if (!select || typeof api === "undefined") return;
  try {
    const cities = await api.get("/api/cities");
    select.innerHTML = cities.length
      ? cities.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")
      : `<option value="">Aucune ville — ajoutez-en via l’admin</option>`;
  } catch {
    select.innerHTML = `<option>Chefchaouen</option><option>Tanger</option><option>Marrakech</option>`;
  }
}

function renderOfferForm() {
  const steps = ["Type & informations", "Détails spécifiques", "Images & localisation", "Tarif, stock & options"];
  pageContent.innerHTML = `
    ${pageHeader("Mes offres", "Créer une nouvelle offre", "Complétez les informations ci-dessous. Votre offre sera publiée immédiatement.")}
    <div class="card stepper mb-4">${steps.map((s,i) => `<div class="step ${state.offerStep === i+1 ? "active" : ""} ${state.offerStep > i+1 ? "done" : ""}"><span class="step-number">${state.offerStep > i+1 ? icon("check") : i+1}</span><span class="step-text"><strong>${s}</strong><small>Étape ${i+1}</small></span>${i<3?'<i class="step-line"></i>':""}</div>`).join("")}</div>
    <div class="grid grid-cols-[minmax(0,1fr)_290px] items-start gap-4">
      <section class="card p-6">
        <div id="offer-step-content">${offerStepContent()}</div>
        <div class="mt-6 flex justify-end gap-2 border-t border-atlas-border pt-5">
          ${button(state.offerStep === 1 ? "Annuler" : "Retour", "", "ghost", 'id="offer-previous"')}
          ${button(state.offerStep === 4 ? "Enregistrer et publier" : "Continuer", state.offerStep === 4 ? "check" : "arrow-right", "primary", 'id="offer-next"')}
        </div>
      </section>
      <aside class="sticky top-20">
        <span class="eyebrow mb-2 block">APERÇU EN DIRECT</span>
        <div class="card overflow-hidden">
          <img src="${images.hotel}" alt="Riad marocain" class="h-40 w-full object-cover">
          <div class="p-4">
            ${badge("Disponible", "success")}
            <span class="eyebrow mt-3 block">RIAD · CHEFCHAOUEN</span>
            <h2 class="mt-2 text-sm font-bold">Suite Bleue avec vue sur la médina</h2>
            <p class="mt-2 text-[9px] leading-5 text-atlas-muted">Une parenthèse authentique au cœur de la ville bleue.</p>
            <div class="mt-3 flex gap-4 text-[8px] text-atlas-muted"><span>2 voyageurs</span><span>★ 4,9 (86)</span></div>
            <div class="mt-4 border-t border-atlas-border pt-3"><small class="block text-[8px] text-atlas-muted">À partir de</small><strong class="text-sm text-atlas-royal">890,00 MAD <em class="text-[8px] font-normal text-atlas-muted">/ nuit</em></strong></div>
          </div>
        </div>
        <div class="mt-3 flex gap-2 rounded-lg bg-blue-100 p-3 text-[8px] leading-4 text-blue-800">${icon("info")}<p>Un changement de prix n’affectera jamais les réservations existantes.</p></div>
      </aside>
    </div>`;
  if (state.offerStep === 1) loadOfferCities();
}

function offerStepContent() {
  if (state.offerStep === 1) return `
    ${formHeader("01", "Type et informations générales", "Choisissez la catégorie qui correspond à votre prestation.")}
    <div class="mt-5 grid grid-cols-5 gap-2">
      ${[["plane","Vol","flight"],["hotel","Hôtel & Riad","hotel"],["car","Voiture","car"],["car-taxi-front","Taxi & Transfert","taxi"],["users-round","Excursion","excursion"]].map(t => `<button class="type-card ${state.offerType === t[2] ? "selected" : ""}" data-type="${t[2]}"><span class="type-icon">${icon(t[0])}</span><strong>${t[1]}</strong></button>`).join("")}
    </div>
    <div class="mt-6 grid grid-cols-2 gap-4">
      ${field("Titre de l’offre", "Suite Bleue avec vue sur la médina", "", "col-span-2")}
      <div class="field"><label>Ville</label><select id="offer-city-select"><option>Chargement des villes…</option></select></div>
      ${field("Adresse", "12, rue Al Andalous")}
      ${field("Description", "Décrivez l’expérience, les points forts et ce qui rend votre offre unique…", "textarea", "col-span-2")}
    </div>`;
  if (state.offerStep === 2) return `
    ${formHeader("02", state.offerType === "hotel" ? "Détails de l’hébergement" : "Détails spécifiques", "Ces informations aideront les voyageurs à faire leur choix.")}
    <div class="mt-6 grid grid-cols-2 gap-4">
      ${state.offerType === "hotel" ? `
        ${field("Catégorie", "", "select", "", ["Riad","Hôtel","Maison d’hôtes"])}
        ${field("Classement", "", "select", "", ["5 étoiles","4 étoiles","3 étoiles"])}
        ${field("Type de chambre", "Suite double supérieure")}
        ${field("Capacité maximale", "2 adultes")}
        ${field("Heure d’arrivée", "14:00")}
        ${field("Heure de départ", "11:00")}
        <div class="field col-span-2"><label>Équipements</label><div class="flex flex-wrap gap-2">${["Wi-Fi","Petit-déjeuner","Piscine","Climatisation","Parking","Spa"].map((x,i)=>`<button class="rounded-full border px-3 py-2 text-[8px] ${i<4?"border-blue-200 bg-blue-50 text-atlas-royal":"border-atlas-border text-atlas-muted"}">${i<4?"✓ ":""}${x}</button>`).join("")}</div></div>` :
        `${field("Nom du prestataire", "Royal Air Maroc")}${field("Référence", "AT-204")}${field("Lieu de départ", "", "select", "", ["Chefchaouen","Tanger","Casablanca"])}${field("Destination", "", "select", "", ["Marrakech","Agadir","Fès"])}${field("Date et heure", "20/10/2026 · 08:30")}${field("Durée estimée", "3 heures")}`}
    </div>`;
  if (state.offerStep === 3) return `
    ${formHeader("03", "Images et localisation", "Ajoutez jusqu’à 5 photos et précisez la localisation exacte.")}
    <div class="upload-zone mt-6"><span class="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-atlas-royal">${icon("upload-cloud")}</span><h3 class="mt-3 text-xs font-bold">Glissez-déposez vos images ici</h3><p class="mt-1 text-[8px] text-atlas-muted">JPG, PNG ou WebP · 5 Mo maximum · Jusqu’à 5 images</p><div class="mt-3">${button("Parcourir les fichiers", "", "secondary")}</div></div>
    <div class="my-4 flex gap-3"><img src="${images.hotel}" class="h-20 w-28 rounded-lg object-cover"><img src="${images.riad}" class="h-20 w-28 rounded-lg object-cover"><button class="grid h-20 w-28 place-items-center rounded-lg border border-dashed border-gray-300 text-gray-500">${icon("plus")}</button></div>
    <div class="map-placeholder"><span class="absolute left-[55%] top-[38%] z-10 grid h-10 w-10 place-items-center rounded-full bg-atlas-royal text-white shadow-lg">${icon("map-pin")}</span><div class="absolute bottom-3 left-3 z-10 rounded-lg bg-white px-3 py-2 shadow"><strong class="block text-[9px]">Chefchaouen, Maroc</strong><small class="mt-1 block text-[8px] text-atlas-muted">35.1688, -5.2636</small></div></div>`;
  return `
    ${formHeader("04", "Tarif, stock et options", "Finalisez les conditions de réservation avant publication.")}
    <div class="mt-6 grid grid-cols-2 gap-4">${field("Prix de base (MAD)", "890,00")}${field("Stock total", "8")}</div>
    <div class="mt-5 divide-y divide-atlas-border border-y border-atlas-border">
      ${switchRow("Autoriser le paiement à l’arrivée", "Le voyageur pourra régler directement sur place.", true)}
      ${switchRow("Validation manuelle par l’agent requise", "La réservation aura le statut « En attente ».", false)}
      ${switchRow("Publier l’offre immédiatement", "L’offre sera visible dans le catalogue.", true)}
    </div>
    <div class="mt-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4"><div class="flex items-center gap-3 text-green-700">${icon("circle-check")}<div><strong class="block text-[10px]">Prête à être publiée</strong><p class="mt-1 text-[8px] text-atlas-muted">Vérifiez une dernière fois les informations dans l’aperçu.</p></div></div><span class="text-[8px] text-atlas-muted">Publication immédiate, sans modération préalable</span></div>`;
}

function formHeader(number, title, text) { return `<div class="form-section-header"><span>${number}</span><div><h2>${title}</h2><p>${text}</p></div></div>`; }
function field(label, placeholder = "", type = "text", classes = "", options = []) {
  const control = type === "textarea" ? `<textarea placeholder="${placeholder}"></textarea>` : type === "select" ? `<select>${options.map(o=>`<option>${o}</option>`).join("")}</select>` : `<input type="${type}" placeholder="${placeholder}">`;
  return `<div class="field ${classes}"><label>${label}</label>${control}</div>`;
}
function switchRow(title, text, on) { return `<div class="flex items-center justify-between py-4"><div><strong class="block text-[9px]">${title}</strong><span class="mt-1 block text-[8px] text-atlas-muted">${text}</span></div><button class="switch ${on?"on":""}"></button></div>`; }

function renderInventory() {
  pageContent.innerHTML = `
    ${pageHeader("Gestion", "Inventaire & stock", "Suivez les disponibilités de toutes vos offres en temps réel.", button("Exporter", "download", "secondary"))}
    <div class="mb-4 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-atlas-royal">${icon("info")}<div><strong class="text-[10px]">Deux modèles de disponibilité</strong><p class="mt-1 text-[8px] text-blue-800"><b>À date fixe</b> : stock décrémenté à chaque réservation. <b>À période</b> : disponibilité calculée selon le chevauchement des dates.</p></div></div>
    <div class="card toolbar mb-4"><label class="search-field">${icon("search")}<input placeholder="Rechercher une offre…"></label><select class="control"><option>Tous les types</option></select>${button("Filtres", "sliders-horizontal", "secondary")}</div>
    <div class="card overflow-hidden"><table class="data-table"><thead><tr><th>Offre</th><th>Modèle</th><th>Stock total</th><th>Réservé</th><th>Disponible</th><th>Niveau</th><th></th></tr></thead><tbody>
      ${offers.slice(0,4).map((o,i)=>`<tr><td><div class="offer-cell"><img src="${o.image}"><div><strong>${o.title}</strong><span>${o.type} · ${o.city}</span></div></div></td><td>${badge(i===2?"Date fixe":"Période","info")}</td><td><strong>${o.total}</strong></td><td>${o.reserved}</td><td><strong>${o.available}</strong></td><td><div class="w-28"><div class="h-1.5 overflow-hidden rounded-full bg-gray-100"><i class="block h-full rounded-full ${o.available===0?"bg-red-500":o.available<=3?"bg-amber-500":"bg-green-500"}" style="width:${Math.max(7,o.available/o.total*100)}%"></i></div><small class="mt-1 block text-[7px] text-atlas-muted">${o.available===0?"Complet":o.available<=3?"Stock bas":"Disponible"}</small></div></td><td>${button("Ajuster", "", "secondary", `data-stock="${o.id}"`)}</td></tr>`).join("")}
    </tbody></table></div>`;
}

function renderBookings() {
  pageContent.innerHTML = `
    ${pageHeader("Activité", "Réservations reçues", "Consultez les réservations concernant uniquement vos offres.", button("Exporter", "download", "secondary"))}
    <div class="card toolbar mb-4"><label class="search-field">${icon("search")}<input placeholder="Référence ou client…"></label><select class="control"><option>Tous les statuts</option></select><select class="control"><option>Toutes les offres</option></select><button class="control flex items-center gap-2">${icon("calendar")}01/10/2026 — 31/10/2026</button></div>
    <div class="card overflow-hidden"><table class="data-table"><thead><tr><th>Référence</th><th>Créée le</th><th>Offre & client</th><th>Séjour</th><th>Montant</th><th>Paiement</th><th>Statut</th><th></th></tr></thead><tbody>
      ${bookings.map((b,i)=>`<tr class="booking-row cursor-pointer" data-booking="${b[0]}"><td class="reference">${b[0]}</td><td>0${6-i}/10/2026</td><td><strong>${b[1]}</strong><small class="mt-1 block text-[7px] text-atlas-muted">${b[2]} · +212 6 12 34 56 ${70+i}</small></td><td>${b[3]}</td><td><strong>${b[4]}</strong></td><td>${badge(i===1?"À l’arrivée":"Payé",i===1?"warning":"success")}</td><td>${badge(b[5],badgeTone(b[5]))}</td><td><button class="icon-button">${icon("eye")}</button></td></tr>`).join("")}
    </tbody></table>${pagination()}</div>`;
}

function renderNotifications() {
  const notices = [
    ["calendar","Nouvelle réservation sur votre offre","Sofia Martin a réservé « Chambre Safran » du 12 au 15 octobre.","Il y a 12 min","blue",true],
    ["triangle-alert","Stock bas : Suite Bleue","Il ne reste que 2 unités disponibles. Pensez à ajuster votre inventaire.","Il y a 2 h","amber",true],
    ["calendar-x","Réservation annulée","La réservation BK-2026-000123 a été annulée. La disponibilité a été libérée.","Hier, 16:20","red",false],
    ["package-x","Bundle dépublié","Le bundle « Week-end Nord » a été dépublié suite à la désactivation d’une composante.","05 oct. 2026","purple",false],
  ];
  pageContent.innerHTML = `
    ${pageHeader("Votre compte", "Notifications", "Restez informé de l’activité de vos offres.", button("Tout marquer comme lu", "check-check", "secondary", 'id="read-all"'))}
    <div class="mb-3 flex gap-2"><button class="notification-tab rounded-lg bg-atlas-royal px-4 py-2 text-[9px] font-semibold text-white" data-filter="all">Toutes <span class="ml-1 opacity-70">12</span></button><button class="notification-tab rounded-lg px-4 py-2 text-[9px] font-semibold text-atlas-muted" data-filter="unread">Non lues <span class="ml-1">4</span></button></div>
    <div class="card overflow-hidden" id="notification-list">
      ${notices.map(n=>`<div class="notification-entry grid grid-cols-[42px_1fr_8px_32px] items-center gap-3 border-b border-atlas-border p-5 ${n[5]?"unread-entry":""}">${activityIcon(n[0],n[4])}<div><strong class="text-[10px]">${n[1]}</strong><p class="mt-1 text-[8px] text-atlas-muted">${n[2]}</p><small class="mt-1 block text-[7px] text-gray-400">${n[3]}</small></div>${n[5]?'<i class="h-1.5 w-1.5 rounded-full bg-blue-600"></i>':"<i></i>"}<button class="icon-button">${icon("ellipsis")}</button></div>`).join("")}
    </div>`;
}
function activityIcon(iconName,tone) { const c={blue:"bg-blue-100 text-blue-600",amber:"bg-amber-100 text-amber-600",red:"bg-red-100 text-red-600",purple:"bg-violet-100 text-violet-600"}; return `<span class="icon-box ${c[tone]}">${icon(iconName)}</span>`; }

function renderProfile() {
  pageContent.innerHTML = `
    ${pageHeader("Votre compte", "Profil fournisseur", "Gérez les informations de votre entreprise et la sécurité du compte.")}
    <div class="grid grid-cols-[230px_1fr] items-start gap-4">
      <aside class="space-y-1">
        <button class="profile-tab flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-[9px] ${state.profileTab==="company"?"bg-white font-bold text-atlas-royal shadow-sm":"text-atlas-muted"}" data-tab="company">${icon("building-2")}Informations de l’entreprise</button>
        <button class="profile-tab flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-[9px] ${state.profileTab==="security"?"bg-white font-bold text-atlas-royal shadow-sm":"text-atlas-muted"}" data-tab="security">${icon("lock")}Sécurité du compte</button>
      </aside>
      <section class="card p-6">
        ${state.profileTab==="company"?`
          <div class="mb-6 flex items-center gap-4 border-b border-atlas-border pb-6"><div class="grid h-20 w-20 place-items-center rounded-xl bg-atlas-navy"><span class="brand-mark"><i></i><i></i><i></i></span></div><div><h2 class="text-base font-bold">Riad Atlas SARL</h2><p class="mt-1 text-[8px] text-atlas-muted">Compte fournisseur actif depuis mars 2025</p><div class="mt-2">${button("Modifier le logo", "", "secondary")}</div></div></div>
          <div class="grid grid-cols-2 gap-4">${field("Raison sociale","Riad Atlas SARL")}${field("Email de contact","contact@riad-atlas.ma")}${field("Téléphone","+212 5 39 98 76 54")}${field("Ville","Chefchaouen","text")}${field("Adresse","12, rue Al Andalous, Médina","text","col-span-2")}${field("Description","Riad de charme au cœur de la médina de Chefchaouen…","textarea","col-span-2")}</div>`:
          `${formHeader("SÉCURITÉ","Changer le mot de passe","Utilisez au moins 8 caractères, une majuscule et un chiffre.")}<div class="mt-6 max-w-xl space-y-4">${field("Mot de passe actuel","••••••••","password")}${field("Nouveau mot de passe","••••••••","password")}${field("Confirmer le mot de passe","••••••••","password")}</div>`}
        <div class="mt-6 flex justify-end border-t border-atlas-border pt-5">${button("Enregistrer les modifications","check","primary",'id="save-profile"')}</div>
      </section>
    </div>`;
}

function renderLogin() {
  $("#app-shell").classList.add("hidden");
  const login = $("#login-screen");
  login.classList.remove("hidden");
  login.innerHTML = `<div class="login-layout">
    <section class="login-photo"><img src="${images.riad}" alt="Cour intérieure d’un riad marocain"><div class="absolute inset-x-14 bottom-16 z-10 text-white"><div class="mb-8 flex items-center gap-3"><span class="brand-mark"><i></i><i></i><i></i></span><strong class="text-xl tracking-[0.15em]">ATLAS VOYAGE</strong></div><span class="eyebrow">L’ART DE VOYAGER AU MAROC</span><h1 class="mt-4 max-w-xl text-4xl font-bold leading-tight">Le Maroc vous attend.<br>Vivez-le pleinement.</h1><p class="mt-5 max-w-lg text-sm leading-6 text-blue-100">Gérez vos offres et accueillez des voyageurs venus du monde entier.</p></div></section>
    <section class="grid place-items-center bg-atlas-page p-16"><div class="w-full max-w-md"><span class="text-[10px] font-bold tracking-[0.18em] text-amber-600">ESPACE PROFESSIONNEL</span><h2 class="mt-3 text-3xl font-bold">Espace fournisseur</h2><p class="mt-2 text-xs text-atlas-muted">Connectez-vous pour gérer vos offres et réservations.</p><form id="login-form" class="mt-8 space-y-4">${field("Adresse email","fournisseur@atlasvoyage.ma","email")}${field("Mot de passe","••••••••","password")}<div class="flex justify-end"><button type="button" class="text-[9px] font-semibold text-atlas-royal">Mot de passe oublié ?</button></div><button class="btn btn-primary w-full" type="submit">Se connecter</button></form><p class="mt-7 text-center text-[9px] text-atlas-muted">Accès réservé aux partenaires Atlas Voyage</p></div></section>
  </div>`;
  $("#login-form").addEventListener("submit", e => { e.preventDefault(); login.classList.add("hidden"); $("#app-shell").classList.remove("hidden"); navigate("dashboard"); });
  lucide.createIcons();
}

function pagination() { return `<div class="pagination"><span>Affichage de 1 à 5 sur 41 éléments</span><div><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>…</button><button>9</button><button>›</button></div></div>`; }
function emptyState(iconName,title,text,action,id) { return `<div class="card py-20 text-center"><span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-atlas-royal">${icon(iconName)}</span><h2 class="mt-5 text-lg font-bold">${title}</h2><p class="mt-2 text-[10px] text-atlas-muted">${text}</p><div class="mt-5">${button(action,"","primary",`id="${id}"`)}</div></div>`; }

function openOfferMenu(id) {
  const offer = offers.find(o => o.id === id);
  showModal("Actions sur l’offre", `<p class="mb-3 text-[9px] text-atlas-muted">${offer.title}</p><div class="space-y-1">
    <button class="dropdown-action" data-page="new-offer">${icon("pencil")}Modifier l’offre</button>
    <button class="dropdown-action" data-page="inventory">${icon("boxes")}Gérer le stock</button>
    <button class="dropdown-action">${icon("images")}Gérer les images</button>
    <button class="dropdown-action text-red-600" id="delete-offer">${icon("trash-2")}Supprimer l’offre</button>
  </div>`);
}
function openStockModal(id) {
  const offer = offers.find(o => o.id === id);
  showModal("Modifier le stock", `<p class="text-[9px] text-atlas-muted">${offer.title}</p><div class="my-6 flex justify-center gap-2"><button class="control w-10 text-lg">−</button><input class="control w-24 text-center font-bold" value="${offer.total}"><button class="control w-10 text-lg">+</button></div><div class="flex gap-2 rounded-lg bg-amber-50 p-3 text-[8px] text-amber-700">${icon("triangle-alert")}Le stock ne peut pas être inférieur au volume déjà réservé (${offer.reserved}).</div><div class="mt-5 flex justify-end gap-2">${button("Annuler","","ghost",'data-close-modal')}${button("Enregistrer","check","primary",'id="save-stock"')}</div>`);
}
function openBookingDrawer(reference) {
  $("#modal-root").innerHTML = `<div class="drawer-backdrop" data-close-modal><aside class="drawer" onclick="event.stopPropagation()">
    <div class="flex items-start justify-between"><div><span class="eyebrow">DÉTAIL DE LA RÉSERVATION</span><h2 class="mt-2 text-xl font-bold">${reference}</h2></div><button class="icon-button" data-close-modal>${icon("x")}</button></div>
    <div class="mt-3 flex gap-2 border-b border-atlas-border pb-5">${badge("Confirmée","success")}${badge("Paiement reçu","success")}</div>
    <h3 class="mb-3 mt-5 text-xs font-bold">Informations client</h3>
    <div class="flex gap-3 rounded-xl bg-gray-50 p-4"><span class="grid h-10 w-10 place-items-center rounded-lg bg-atlas-amber text-xs font-bold text-atlas-navy">SM</span><div><strong class="block text-[10px]">Sofia Martin</strong><span class="mt-1 block text-[8px] text-atlas-muted">+33 6 12 34 56 78</span><span class="mt-1 block text-[8px] text-atlas-muted">sofia.martin@email.fr</span></div></div>
    <h3 class="mb-3 mt-5 text-xs font-bold">Votre prestation</h3>
    <div class="flex gap-3 rounded-xl border border-atlas-border p-3"><img src="${images.hotel}" class="h-28 w-28 rounded-lg object-cover"><div>${badge("Bundle Week-end Nord","purple")}<strong class="mt-2 block text-[10px]">Riad Atlas — Chambre Safran</strong><p class="mt-2 text-[8px] text-atlas-muted">12/10/2026 → 15/10/2026 · 3 nuits</p><p class="mt-1 text-[8px] text-atlas-muted">1 chambre · 2 adultes</p><b class="mt-3 block text-xs text-atlas-royal">2 670,00 MAD</b></div></div>
    <h3 class="mb-3 mt-5 text-xs font-bold">Historique</h3>
    <div class="space-y-4 border-l border-gray-300 pl-4 text-[9px]"><div><strong>Réservation confirmée</strong><small class="mt-1 block text-[7px] text-atlas-muted">06/10/2026 à 10:42</small></div><div><strong>Paiement reçu</strong><small class="mt-1 block text-[7px] text-atlas-muted">06/10/2026 à 10:41</small></div><div><strong>Réservation créée</strong><small class="mt-1 block text-[7px] text-atlas-muted">06/10/2026 à 10:40</small></div></div>
    <div class="mt-5 flex gap-2 rounded-lg bg-blue-50 p-3 text-[8px] text-blue-800">${icon("lock")}La validation et l’annulation sont gérées par un agent Atlas Voyage.</div>
    <div class="mt-4">${button("Imprimer le voucher","printer","secondary",'class="w-full"')}</div>
  </aside></div>`;
  lucide.createIcons();
}
function showModal(title, content) {
  $("#modal-root").innerHTML = `<div class="modal-backdrop" data-close-modal><div class="modal-box" onclick="event.stopPropagation()"><div class="mb-4 flex items-center justify-between border-b border-atlas-border pb-3"><h2 class="text-base font-bold">${title}</h2><button class="icon-button" data-close-modal>${icon("x")}</button></div>${content}</div></div>`;
  lucide.createIcons();
}
function closeModal() { $("#modal-root").innerHTML = ""; }
function toast(title, text) {
  $("#toast-root").innerHTML = `<div class="toast"><span class="icon-box bg-green-100 text-green-600">${icon("check")}</span><div><strong class="block text-[10px]">${title}</strong><p class="mt-1 text-[8px] text-atlas-muted">${text}</p></div></div>`;
  lucide.createIcons();
  setTimeout(() => $("#toast-root").innerHTML = "", 2800);
}

const supplierPages = {
  dashboard: renderDashboard,
  offers: renderOffers,
  "new-offer": renderOfferForm,
  inventory: renderInventory,
  bookings: renderBookings,
  notifications: renderNotifications,
  profile: renderProfile,
};

function navigate(page) {
  if (!supplierPages[page]) page = "dashboard";
  state.page = page;
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === page));
  $("#notification-dropdown").classList.add("hidden");
  $("#account-dropdown").classList.add("hidden");
  (supplierPages[page] || renderDashboard)();
  lucide.createIcons();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) { navigate(pageButton.dataset.page); return; }
  const viewButton = event.target.closest(".offer-view");
  if (viewButton) { state.offerView = viewButton.dataset.view; renderOffers(); lucide.createIcons(); return; }
  const menu = event.target.closest(".offer-menu");
  if (menu) { openOfferMenu(Number(menu.dataset.offer)); return; }
  const stock = event.target.closest("[data-stock]");
  if (stock) { openStockModal(Number(stock.dataset.stock)); return; }
  const booking = event.target.closest(".booking-row");
  if (booking) { openBookingDrawer(booking.dataset.booking); return; }
  const type = event.target.closest(".type-card");
  if (type) { state.offerType = type.dataset.type; renderOfferForm(); lucide.createIcons(); return; }
  const profileTab = event.target.closest(".profile-tab");
  if (profileTab) { state.profileTab = profileTab.dataset.tab; renderProfile(); lucide.createIcons(); return; }
  const switchButton = event.target.closest(".switch");
  if (switchButton && !switchButton.disabled) switchButton.classList.toggle("on");
  if (event.target.closest("[data-close-modal]")) closeModal();
  if (event.target.closest("#clear-offer-filters")) { $("#offer-search").value = ""; $("#offer-type-filter").value = ""; $("#offer-status-filter").value = ""; renderOfferResults(); }
  if (event.target.closest("#offer-previous")) { if (state.offerStep === 1) navigate("offers"); else { state.offerStep--; renderOfferForm(); lucide.createIcons(); } }
  if (event.target.closest("#offer-next")) { if (state.offerStep < 4) { state.offerStep++; renderOfferForm(); lucide.createIcons(); } else { toast("Offre publiée avec succès", "Elle est désormais visible dans le catalogue."); setTimeout(()=>navigate("offers"),1200); } }
  if (event.target.closest("#save-profile")) toast("Modifications enregistrées", "Votre profil a bien été mis à jour.");
  if (event.target.closest("#save-stock")) { closeModal(); toast("Stock mis à jour", "La nouvelle disponibilité est enregistrée."); }
  if (event.target.closest("#delete-offer")) { closeModal(); showModal("Impossible de supprimer", `<div class="flex gap-3 rounded-lg bg-red-50 p-4 text-red-700">${icon("circle-x")}<div><strong class="text-[10px]">Réservations actives ou futures existantes</strong><p class="mt-1 text-[8px] leading-4">Cette offre ne peut pas être supprimée. Vous pouvez la désactiver à la place.</p></div></div><div class="mt-5 flex justify-end">${button("Désactiver à la place","","danger",'data-close-modal')}</div>`); }
  if (event.target.closest("#read-all")) { $$(".unread-entry").forEach(x=>x.classList.remove("unread-entry")); toast("Notifications mises à jour","Toutes les notifications sont marquées comme lues."); }
});

$("#notification-toggle").addEventListener("click", event => { event.stopPropagation(); $("#notification-dropdown").classList.toggle("hidden"); $("#account-dropdown").classList.add("hidden"); });
$("#account-toggle").addEventListener("click", event => { event.stopPropagation(); $("#account-dropdown").classList.toggle("hidden"); $("#notification-dropdown").classList.add("hidden"); });
$("#logout-button").addEventListener("click", renderLogin);
document.addEventListener("click", event => {
  if (!event.target.closest("#notification-dropdown") && !event.target.closest("#notification-toggle")) $("#notification-dropdown").classList.add("hidden");
  if (!event.target.closest("#account-dropdown") && !event.target.closest("#account-toggle")) $("#account-dropdown").classList.add("hidden");
});

function goPublicSite() {
  window.location.href = "../accueil.html";
}
$("#public-site-btn")?.addEventListener("click", goPublicSite);
$("#public-site-footer")?.addEventListener("click", goPublicSite);

const requestedPage = new URLSearchParams(window.location.search).get("page") || "dashboard";
navigate(requestedPage in supplierPages ? requestedPage : "dashboard");
