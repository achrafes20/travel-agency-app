const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const images = {
  hotel: "https://images.unsplash.com/photo-1548018560-4cb48a8837c1?auto=format&fit=crop&w=700&q=82",
  riad: "https://images.unsplash.com/photo-1570133435573-fcb96d98f69b?auto=format&fit=crop&w=700&q=82",
  nature: "https://images.unsplash.com/photo-1489493585363-d69421e0edd3?auto=format&fit=crop&w=700&q=82",
  taxi: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=700&q=82",
  medina: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=700&q=82",
};

const OFFER_TYPES = {
  FLIGHT: { label: "Vol", cardLabel: "Vol", icon: "plane", image: images.nature },
  HOTEL: { label: "Hôtel", cardLabel: "Hôtel & Riad", icon: "hotel", image: images.hotel },
  CAR: { label: "Voiture", cardLabel: "Voiture", icon: "car", image: images.taxi },
  TAXI_TRANSFER: { label: "Taxi", cardLabel: "Taxi & Transfert", icon: "car-taxi-front", image: images.taxi },
  EXCURSION: { label: "Excursion", cardLabel: "Excursion", icon: "users-round", image: images.medina },
};

const SPECIFIC_FIELDS = [
  "airline", "flightNumber", "departureAirport", "arrivalAirport", "departureDateTime", "arrivalDateTime",
  "stars", "roomType", "address",
  "brand", "model", "transmission", "seats",
  "pickupLocation", "dropoffLocation", "vehicleType",
  "durationHours", "includesGuide", "includesTransport", "itinerary",
];
const REQUEST_FIELDS = ["type", "title", "description", "basePrice", "stock", "allowsPayOnArrival", "active", "images", "cityId", "supplierId", ...SPECIFIC_FIELDS];
const NUMERIC_FIELDS = ["basePrice", "stock", "stars", "seats", "durationHours", "cityId"];
const MAX_IMAGES = 5;

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = value => `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const offerImage = o => o.images?.[0] || OFFER_TYPES[o.type]?.image || images.hotel;
const offerStatus = o => (o.active ? "Active" : "Inactive");

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
  offers: [],
  cities: [],
  supplier: null,
  editingId: null,
  offerDraft: newDraft(),
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
      <select id="offer-type-filter" class="control"><option value="">Tous les types</option>${Object.entries(OFFER_TYPES).map(([key, t]) => `<option value="${key}">${t.label}</option>`).join("")}</select>
      <select id="offer-status-filter" class="control"><option value="">Tous les statuts</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
      <select id="offer-sort" class="control"><option value="recent">Plus récentes</option><option value="price">Prix croissant</option></select>
      <div class="flex rounded-lg bg-gray-100 p-1">
        <button class="offer-view grid h-8 w-8 place-items-center rounded-md ${state.offerView === "table" ? "bg-white text-atlas-royal shadow" : "text-gray-500"}" data-view="table">${icon("list")}</button>
        <button class="offer-view grid h-8 w-8 place-items-center rounded-md ${state.offerView === "grid" ? "bg-white text-atlas-royal shadow" : "text-gray-500"}" data-view="grid">${icon("layout-grid")}</button>
      </div>
    </div>
    <div id="offers-results"><div class="card py-16 text-center text-[10px] text-atlas-muted">Chargement des offres…</div></div>`;
  ["offer-search", "offer-type-filter", "offer-status-filter", "offer-sort"].forEach(id => {
    $(`#${id}`).addEventListener("input", renderOfferResults);
    $(`#${id}`).addEventListener("change", renderOfferResults);
  });
  loadOffers().then(renderOfferResults).catch(err => renderLoadError("#offers-results", err));
}

function renderLoadError(selector, err) {
  const root = $(selector);
  if (!root) return;
  root.innerHTML = `<div class="card py-16 text-center"><span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">${icon("circle-x")}</span><h2 class="mt-4 text-sm font-bold">Impossible de charger les offres</h2><p class="mt-2 text-[10px] text-atlas-muted">${esc(err.message)}</p><div class="mt-5">${button("Réessayer", "refresh-cw", "primary", 'id="retry-offers"')}</div></div>`;
  lucide.createIcons();
}

function filteredOffers() {
  const query = ($("#offer-search")?.value || "").trim().toLowerCase();
  const type = $("#offer-type-filter")?.value || "";
  const status = $("#offer-status-filter")?.value || "";
  const sort = $("#offer-sort")?.value || "recent";
  const list = state.offers.filter(o => o.title.toLowerCase().includes(query) && (!type || o.type === type) && (!status || offerStatus(o) === status));
  return list.sort((a, b) => sort === "price" ? a.basePrice - b.basePrice : b.id - a.id);
}

function renderOfferResults() {
  const root = $("#offers-results");
  if (!root) return;
  if (!state.offers.length) {
    root.innerHTML = emptyState("briefcase-business", "Vous n’avez pas encore d’offre", "Créez votre première offre pour la rendre visible dans le catalogue.", "Nouvelle offre", "empty-new-offer");
    lucide.createIcons();
    return;
  }
  const filtered = filteredOffers();
  if (!filtered.length) {
    root.innerHTML = emptyState("search-x", "Aucune offre ne correspond", "Essayez de modifier les filtres ou votre recherche.", "Effacer les filtres", "clear-offer-filters");
    lucide.createIcons();
    return;
  }
  const count = `<div class="pagination"><span>${filtered.length} offre${filtered.length > 1 ? "s" : ""} sur ${state.offers.length}</span></div>`;
  if (state.offerView === "grid") {
    root.innerHTML = `<div class="grid grid-cols-3 gap-4">${filtered.map(offerCard).join("")}</div>`;
  } else {
    root.innerHTML = `<div class="card overflow-hidden"><div class="table-wrap"><table class="data-table"><thead><tr><th>Offre</th><th>Type</th><th>Prix de base</th><th>Stock</th><th>Actif</th><th class="th-center">Actions</th></tr></thead><tbody>${filtered.map(offerRow).join("")}</tbody></table></div>${count}</div>`;
  }
  lucide.createIcons();
}

const offerActions = o => `<div class="row-actions-group"><button type="button" class="action-btn action-edit" data-edit-offer="${o.id}" title="Modifier" aria-label="Modifier">${icon("pencil")}</button><button type="button" class="action-btn action-view" data-page="inventory" title="Gérer le stock" aria-label="Gérer le stock">${icon("boxes")}</button><button type="button" class="action-btn action-delete" data-delete-offer="${o.id}" title="Supprimer" aria-label="Supprimer">${icon("trash-2")}</button></div>`;

function offerRow(o) {
  const t = OFFER_TYPES[o.type];
  return `<tr>
    <td><div class="offer-cell"><img src="${esc(offerImage(o))}" alt=""><div><strong>${esc(o.title)}</strong><span>${esc(o.cityName)}</span></div></div></td>
    <td><span class="flex items-center gap-1.5 font-semibold text-atlas-royal">${icon(t.icon)} ${t.label}</span></td>
    <td><strong>${money(o.basePrice)}</strong><small class="block text-[7px] text-atlas-muted">/ unité</small></td>
    <td>${o.stock}</td>
    <td><button class="switch ${o.active ? "on" : ""}" data-toggle-offer="${o.id}" aria-label="Changer le statut"></button></td>
    <td class="table-actions-cell">${offerActions(o)}</td>
  </tr>`;
}
function offerCard(o) {
  const t = OFFER_TYPES[o.type];
  return `<article class="card overflow-hidden"><div class="relative h-44"><img src="${esc(offerImage(o))}" alt="" class="h-full w-full object-cover"><span class="absolute right-3 top-3">${badge(offerStatus(o), badgeTone(offerStatus(o)))}</span></div><div class="p-5"><span class="eyebrow">${t.label.toUpperCase()} · ${esc(o.cityName).toUpperCase()}</span><h2 class="mt-2 text-sm font-bold">${esc(o.title)}</h2><p class="mt-2 text-[9px] leading-5 text-atlas-muted">${esc(o.description || "Aucune description.")}</p><div class="mt-4 flex items-end justify-between border-t border-atlas-border pt-4"><span class="text-[8px] text-atlas-muted">À partir de</span><strong class="text-sm text-atlas-royal">${money(o.basePrice)}</strong></div><div class="mt-3 flex justify-end">${offerActions(o)}</div></div></article>`;
}

async function ensureSupplier() {
  if (!state.supplier) state.supplier = Auth.getUser();
  return state.supplier;
}

function showSupplierIdentity() {
  const supplier = Auth.getUser();
  if (!supplier) return;
  $("#supplier-name").textContent = supplier.fullName;
  $("#supplier-initials").textContent = supplier.fullName.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

async function loadOffers() {
  const supplier = await ensureSupplier();
  state.offers = await api.get(`/api/offers?supplierId=${supplier.id}`);
  return state.offers;
}

const toRequest = o => Object.fromEntries(REQUEST_FIELDS.map(k => [k, o[k]]));
const saveOffer = (offer, changes) => api.put(`/api/offers/${offer.id}`, { ...toRequest(offer), ...changes });

/* ---------- Brouillon du formulaire (création / modification) ---------- */

function newDraft(type = "HOTEL") {
  return { type, title: "", description: "", cityId: "", basePrice: "", stock: "", allowsPayOnArrival: false, active: true, images: Array(MAX_IMAGES).fill(""), stars: 3, includesGuide: false, includesTransport: false };
}
function draftFromOffer(o) {
  const draft = newDraft(o.type);
  REQUEST_FIELDS.filter(k => k !== "images").forEach(k => { if (o[k] != null) draft[k] = o[k]; });
  draft.cityId = String(o.cityId);
  draft.images = [...o.images, ...Array(MAX_IMAGES).fill("")].slice(0, MAX_IMAGES);
  return draft;
}
function startNewOffer() {
  state.editingId = null;
  state.offerStep = 1;
  state.offerDraft = newDraft();
}
function startEditOffer(id) {
  const offer = state.offers.find(o => o.id === id);
  if (!offer) return;
  state.editingId = id;
  state.offerStep = 1;
  state.offerDraft = draftFromOffer(offer);
  navigate("new-offer");
}

function buildPayload() {
  const d = state.offerDraft;
  const payload = {};
  Object.entries(d).forEach(([k, v]) => {
    if (k === "images") return;
    payload[k] = typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v;
  });
  NUMERIC_FIELDS.forEach(k => { if (payload[k] != null) payload[k] = Number(payload[k]); });
  payload.images = d.images.map(s => s.trim()).filter(Boolean);
  payload.supplierId = state.supplier.id;
  return payload;
}

function validateStep(step) {
  const d = state.offerDraft;
  const blank = k => !String(d[k] ?? "").trim();
  if (step === 1) {
    if (blank("title")) return "Le titre de l’offre est obligatoire.";
    if (!d.cityId) return "Choisissez une ville.";
  }
  if (step === 2) {
    const rules = {
      FLIGHT: [["airline", "La compagnie aérienne est obligatoire."], ["departureAirport", "L’aéroport de départ est obligatoire."], ["arrivalAirport", "L’aéroport d’arrivée est obligatoire."]],
      HOTEL: [["roomType", "Le type de chambre est obligatoire."]],
      CAR: [["brand", "La marque est obligatoire."]],
      TAXI_TRANSFER: [["pickupLocation", "Le lieu de prise en charge est obligatoire."], ["dropoffLocation", "Le lieu de dépose est obligatoire."]],
      EXCURSION: [["durationHours", "La durée de l’excursion est obligatoire."]],
    };
    for (const [key, message] of rules[d.type]) if (blank(key)) return message;
    if (d.type === "FLIGHT" && d.departureDateTime && d.arrivalDateTime && d.arrivalDateTime <= d.departureDateTime) return "L’arrivée doit être postérieure au départ.";
    if (d.type === "EXCURSION" && Number(d.durationHours) < 1) return "La durée doit être d’au moins 1 heure.";
    if (d.type === "CAR" && !blank("seats") && Number(d.seats) < 1) return "Le nombre de places doit être supérieur à 0.";
  }
  if (step === 4) {
    if (blank("basePrice") || Number(d.basePrice) < 0) return "Indiquez un prix de base valide.";
    if (blank("stock") || !Number.isInteger(Number(d.stock)) || Number(d.stock) < 0) return "Indiquez un stock valide (nombre entier).";
  }
  return null;
}

async function submitOffer() {
  const submit = $("#offer-next");
  submit.disabled = true;
  try {
    await ensureSupplier();
    const payload = buildPayload();
    const editing = Boolean(state.editingId);
    if (editing) await api.put(`/api/offers/${state.editingId}`, payload);
    else await api.post("/api/offers", payload);
    toast(editing ? "Offre mise à jour" : "Offre publiée avec succès", editing ? "Les modifications sont enregistrées." : "Elle est enregistrée dans votre catalogue.");
    startNewOffer();
    setTimeout(() => navigate("offers"), 900);
  } catch (err) {
    submit.disabled = false;
    toast("Enregistrement impossible", err.message, "error");
  }
}

/* ---------- Formulaire en 4 étapes ---------- */

async function loadOfferCities() {
  const select = $("#offer-city-select");
  if (!select) return;
  try {
    state.cities = await api.get("/api/cities");
    if (!state.cities.length) {
      select.innerHTML = `<option value="">Aucune ville — ajoutez-en via l’admin</option>`;
      return;
    }
    if (!state.offerDraft.cityId) state.offerDraft.cityId = String(state.cities[0].id);
    select.innerHTML = state.cities.map(c => `<option value="${c.id}" ${String(c.id) === String(state.offerDraft.cityId) ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    updateOfferPreview();
  } catch (err) {
    select.innerHTML = `<option value="">Villes indisponibles</option>`;
    toast("Villes indisponibles", err.message, "error");
  }
}

function offerPreview() {
  const d = state.offerDraft;
  const t = OFFER_TYPES[d.type];
  const img = d.images.find(s => s.trim()) || t.image;
  const city = state.cities.find(c => String(c.id) === String(d.cityId))?.name || "Ville";
  const price = String(d.basePrice).trim() === "" ? "—" : money(d.basePrice);
  return `<img src="${esc(img)}" alt="" class="h-40 w-full object-cover">
    <div class="p-4">
      ${d.active ? badge("Active", "success") : badge("Inactive", "neutral")}
      <span class="eyebrow mt-3 block">${esc(t.label.toUpperCase())} · ${esc(city.toUpperCase())}</span>
      <h2 class="mt-2 text-sm font-bold">${esc(d.title || "Titre de l’offre")}</h2>
      <p class="mt-2 text-[9px] leading-5 text-atlas-muted">${esc(d.description || "La description de votre offre apparaîtra ici.")}</p>
      <div class="mt-4 border-t border-atlas-border pt-3"><small class="block text-[8px] text-atlas-muted">À partir de</small><strong class="text-sm text-atlas-royal">${price}</strong></div>
    </div>`;
}
function updateOfferPreview() {
  const box = $("#offer-preview");
  if (box) box.innerHTML = offerPreview();
}

function renderOfferForm() {
  const editing = Boolean(state.editingId);
  const steps = ["Type & informations", "Détails spécifiques", "Images", "Tarif, stock & options"];
  pageContent.innerHTML = `
    ${pageHeader("Mes offres", editing ? "Modifier l’offre" : "Créer une nouvelle offre", "Complétez les informations ci-dessous : elles sont enregistrées en base de données.")}
    <div class="card stepper mb-4">${steps.map((s,i) => `<div class="step ${state.offerStep === i+1 ? "active" : ""} ${state.offerStep > i+1 ? "done" : ""}"><span class="step-number">${state.offerStep > i+1 ? icon("check") : i+1}</span><span class="step-text"><strong>${s}</strong><small>Étape ${i+1}</small></span>${i<3?'<i class="step-line"></i>':""}</div>`).join("")}</div>
    <div class="grid grid-cols-[minmax(0,1fr)_290px] items-start gap-4">
      <section class="card p-6">
        <div id="offer-step-content">${offerStepContent()}</div>
        <div class="mt-6 flex justify-end gap-2 border-t border-atlas-border pt-5">
          ${button(state.offerStep === 1 ? "Annuler" : "Retour", "", "ghost", 'id="offer-previous"')}
          ${button(state.offerStep === 4 ? (editing ? "Enregistrer les modifications" : "Enregistrer et publier") : "Continuer", state.offerStep === 4 ? "check" : "arrow-right", "primary", 'id="offer-next"')}
        </div>
      </section>
      <aside class="sticky top-20">
        <span class="eyebrow mb-2 block">APERÇU EN DIRECT</span>
        <div class="card overflow-hidden" id="offer-preview">${offerPreview()}</div>
        <div class="mt-3 flex gap-2 rounded-lg bg-blue-100 p-3 text-[8px] leading-4 text-blue-800">${icon("info")}<p>Un changement de prix n’affectera jamais les réservations existantes.</p></div>
      </aside>
    </div>`;
  ensureSupplier().catch(err => toast("Fournisseur introuvable", err.message, "error"));
  if (state.offerStep === 1) loadOfferCities();
}

function offerStepContent() {
  const d = state.offerDraft;
  if (state.offerStep === 1) return `
    ${formHeader("01", "Type et informations générales", "Choisissez la catégorie qui correspond à votre prestation.")}
    <div class="mt-5 grid grid-cols-5 gap-2">
      ${Object.entries(OFFER_TYPES).map(([key, t]) => `<button type="button" class="type-card ${d.type === key ? "selected" : ""} ${state.editingId && d.type !== key ? "opacity-40" : ""}" data-type="${key}"><span class="type-icon">${icon(t.icon)}</span><strong>${t.cardLabel}</strong></button>`).join("")}
    </div>
    ${state.editingId ? '<p class="mt-2 text-[8px] text-atlas-muted">Le type d’une offre ne peut pas être modifié après sa création.</p>' : ""}
    <div class="mt-6 grid grid-cols-2 gap-4">
      ${bound("Titre de l’offre", "title", { placeholder: "Suite Bleue avec vue sur la médina", classes: "col-span-2" })}
      <div class="field"><label>Ville</label><select id="offer-city-select" data-f="cityId"><option>Chargement des villes…</option></select></div>
      ${bound("Description", "description", { kind: "textarea", placeholder: "Décrivez l’expérience, les points forts et ce qui rend votre offre unique…", classes: "col-span-2" })}
    </div>`;
  if (state.offerStep === 2) return `
    ${formHeader("02", `Détails — ${OFFER_TYPES[d.type].cardLabel}`, "Ces informations aideront les voyageurs à faire leur choix.")}
    <div class="mt-6 grid grid-cols-2 gap-4">${specificFields(d.type)}</div>`;
  if (state.offerStep === 3) return `
    ${formHeader("03", "Images", `Ajoutez jusqu’à ${MAX_IMAGES} images en collant leur adresse (URL). La première sert de visuel principal.`)}
    <div class="mt-6 space-y-3">
      ${d.images.map((url, i) => `<div class="field"><label>Image ${i + 1}</label><input type="url" data-f="image-${i}" value="${esc(url)}" placeholder="https://…/photo.jpg"></div>`).join("")}
    </div>
    <div id="image-thumbs" class="my-4 flex flex-wrap gap-3">${imageThumbs()}</div>`;
  return `
    ${formHeader("04", "Tarif, stock et options", "Finalisez les conditions de réservation avant publication.")}
    <div class="mt-6 grid grid-cols-2 gap-4">${bound("Prix de base (MAD)", "basePrice", { kind: "number", placeholder: "890" })}${bound("Stock total", "stock", { kind: "number", placeholder: "8" })}</div>
    <div class="mt-5 divide-y divide-atlas-border border-y border-atlas-border">
      ${switchRow("Autoriser le paiement à l’arrivée", "Le voyageur pourra régler directement sur place.", d.allowsPayOnArrival, "allowsPayOnArrival")}
      ${switchRow("Offre active", "L’offre sera visible dans le catalogue.", d.active, "active")}
    </div>`;
}

function imageThumbs() {
  return state.offerDraft.images.filter(s => s.trim()).map(url => `<img src="${esc(url)}" class="h-20 w-28 rounded-lg object-cover" alt="" onerror="this.style.display='none'">`).join("");
}

function specificFields(type) {
  const d = state.offerDraft;
  switch (type) {
    case "FLIGHT": return [
      bound("Compagnie aérienne", "airline", { placeholder: "Royal Air Maroc" }),
      bound("Numéro de vol", "flightNumber", { placeholder: "AT-204" }),
      bound("Aéroport de départ", "departureAirport", { placeholder: "Tanger (TNG)" }),
      bound("Aéroport d’arrivée", "arrivalAirport", { placeholder: "Marrakech (RAK)" }),
      bound("Date et heure de départ", "departureDateTime", { kind: "datetime-local" }),
      bound("Date et heure d’arrivée", "arrivalDateTime", { kind: "datetime-local" }),
    ].join("");
    case "HOTEL": return [
      bound("Classement", "stars", { kind: "select", options: [[5, "5 étoiles"], [4, "4 étoiles"], [3, "3 étoiles"], [2, "2 étoiles"], [1, "1 étoile"]] }),
      bound("Type de chambre", "roomType", { placeholder: "Suite double supérieure" }),
      bound("Adresse", "address", { placeholder: "12, rue Al Andalous", classes: "col-span-2" }),
    ].join("");
    case "CAR": return [
      bound("Marque", "brand", { placeholder: "Dacia" }),
      bound("Modèle", "model", { placeholder: "Duster" }),
      bound("Boîte de vitesses", "transmission", { kind: "select", options: [["", "Non précisée"], ["Manuelle", "Manuelle"], ["Automatique", "Automatique"]] }),
      bound("Nombre de places", "seats", { kind: "number", placeholder: "5" }),
    ].join("");
    case "TAXI_TRANSFER": return [
      bound("Lieu de prise en charge", "pickupLocation", { placeholder: "Aéroport de Tanger" }),
      bound("Lieu de dépose", "dropoffLocation", { placeholder: "Médina de Chefchaouen" }),
      bound("Type de véhicule", "vehicleType", { placeholder: "Berline, minibus…", classes: "col-span-2" }),
    ].join("");
    default: return [
      bound("Durée (heures)", "durationHours", { kind: "number", placeholder: "6" }),
      `<div class="field"></div>`,
      `<div class="col-span-2 divide-y divide-atlas-border border-y border-atlas-border">${switchRow("Guide inclus", "Un guide accompagne les voyageurs.", d.includesGuide, "includesGuide")}${switchRow("Transport inclus", "Le transport est compris dans le prix.", d.includesTransport, "includesTransport")}</div>`,
      bound("Itinéraire", "itinerary", { kind: "textarea", placeholder: "Étapes et points de passage de l’excursion…", classes: "col-span-2" }),
    ].join("");
  }
}

function bound(label, key, { kind = "text", classes = "", placeholder = "", options = [] } = {}) {
  const value = state.offerDraft[key] ?? "";
  const attrs = `data-f="${key}"`;
  let control;
  if (kind === "textarea") control = `<textarea ${attrs} placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;
  else if (kind === "select") control = `<select ${attrs}>${options.map(([v, l]) => `<option value="${v}" ${String(v) === String(value) ? "selected" : ""}>${l}</option>`).join("")}</select>`;
  else control = `<input type="${kind}" ${kind === "number" ? 'min="0" step="any"' : ""} ${attrs} value="${esc(value)}" placeholder="${esc(placeholder)}">`;
  return `<div class="field ${classes}"><label>${label}</label>${control}</div>`;
}

function formHeader(number, title, text) { return `<div class="form-section-header"><span>${number}</span><div><h2>${title}</h2><p>${text}</p></div></div>`; }
function field(label, placeholder = "", type = "text", classes = "", options = []) {
  const control = type === "textarea" ? `<textarea placeholder="${placeholder}"></textarea>` : type === "select" ? `<select>${options.map(o=>`<option>${o}</option>`).join("")}</select>` : `<input type="${type}" placeholder="${placeholder}">`;
  return `<div class="field ${classes}"><label>${label}</label>${control}</div>`;
}
function switchRow(title, text, on, key = "") { return `<div class="flex items-center justify-between py-4"><div><strong class="block text-[9px]">${title}</strong><span class="mt-1 block text-[8px] text-atlas-muted">${text}</span></div><button type="button" class="switch ${on?"on":""}" ${key ? `data-f="${key}"` : ""}></button></div>`; }

function stockLevel(stock) {
  if (stock === 0) return { key: "out", label: "Épuisé" };
  if (stock <= 3) return { key: "low", label: "Stock bas" };
  return { key: "ok", label: "Disponible" };
}

function inventoryRows(query = "") {
  const list = state.offers.filter(o => o.title.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => a.title.localeCompare(b.title, "fr"));
  if (!list.length) return `<tr><td colspan="3" class="py-10 text-center text-[10px] text-atlas-muted">Aucune offre à afficher.</td></tr>`;
  return list.map(o => {
    const level = stockLevel(o.stock);
    return `<tr>
      <td><div class="offer-cell"><img src="${esc(offerImage(o))}" alt=""><div><strong>${esc(o.title)}</strong><span>${OFFER_TYPES[o.type].label} · ${esc(o.cityName)}</span></div></div></td>
      <td><div class="stock-level level-${level.key}"><span class="level-pill">${level.label}</span><div class="level-track"><i style="width:${Math.min(100, Math.max(6, o.stock * 10))}%"></i></div></div></td>
      <td class="stock-cell"><div class="stepper"><button type="button" class="stepper-btn" data-stock-step="-1" data-id="${o.id}" aria-label="Diminuer le stock">−</button><input type="number" min="0" step="1" class="stepper-input" data-stock-input="${o.id}" value="${o.stock}" aria-label="Stock de ${esc(o.title)}"><button type="button" class="stepper-btn" data-stock-step="1" data-id="${o.id}" aria-label="Augmenter le stock">+</button></div></td>
    </tr>`;
  }).join("");
}

function renderInventory() {
  pageContent.innerHTML = `
    ${pageHeader("Gestion", "Inventaire & stock", "Suivez les disponibilités de toutes vos offres.")}
    <div class="card toolbar mb-4"><label class="search-field">${icon("search")}<input id="inventory-search" placeholder="Rechercher une offre…"></label></div>
    <div class="card overflow-hidden"><table class="data-table"><thead><tr><th>Offre</th><th>Niveau</th><th class="th-right">Stock</th></tr></thead><tbody id="inventory-body"><tr><td colspan="3" class="py-10 text-center text-[10px] text-atlas-muted">Chargement…</td></tr></tbody></table></div>`;
  const refresh = () => { $("#inventory-body").innerHTML = inventoryRows($("#inventory-search").value); lucide.createIcons(); };
  $("#inventory-search").addEventListener("input", refresh);
  state.refreshInventory = refresh;
  loadOffers().then(refresh).catch(err => { $("#inventory-body").innerHTML = `<tr><td colspan="3" class="py-10 text-center text-[10px] text-red-600">${esc(err.message)}</td></tr>`; });
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

function pagination() { return `<div class="pagination"><span>Affichage de 1 à 5 sur 41 éléments</span><div><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>…</button><button>9</button><button>›</button></div></div>`; }
function emptyState(iconName,title,text,action,id) { return `<div class="card py-20 text-center"><span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-atlas-royal">${icon(iconName)}</span><h2 class="mt-5 text-lg font-bold">${title}</h2><p class="mt-2 text-[10px] text-atlas-muted">${text}</p><div class="mt-5">${button(action,"","primary",`id="${id}"`)}</div></div>`; }function openBookingDrawer(reference) {
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
let toastTimer;
function toast(title, text, tone = "success") {
  const error = tone === "error";
  $("#toast-root").innerHTML = `<div class="toast"><span class="icon-box ${error ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}">${icon(error ? "circle-x" : "check")}</span><div><strong class="block text-[10px]">${esc(title)}</strong><p class="mt-1 text-[8px] text-atlas-muted">${esc(text)}</p></div></div>`;
  lucide.createIcons();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast-root").innerHTML = "", error ? 4500 : 2800);
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
  if (pageButton) { if (pageButton.dataset.page === "new-offer") startNewOffer(); navigate(pageButton.dataset.page); return; }
  const viewButton = event.target.closest(".offer-view");
  if (viewButton) { state.offerView = viewButton.dataset.view; renderOffers(); lucide.createIcons(); return; }
  const booking = event.target.closest(".booking-row");
  if (booking) { openBookingDrawer(booking.dataset.booking); return; }
  const type = event.target.closest(".type-card");
  if (type) { if (!state.editingId) { state.offerDraft.type = type.dataset.type; renderOfferForm(); lucide.createIcons(); } return; }
  const profileTab = event.target.closest(".profile-tab");
  if (profileTab) { state.profileTab = profileTab.dataset.tab; renderProfile(); lucide.createIcons(); return; }
  const switchButton = event.target.closest(".switch");
  if (switchButton && !switchButton.disabled) switchButton.classList.toggle("on");
  if (event.target.closest("[data-close-modal]")) closeModal();
  if (event.target.closest("#clear-offer-filters")) { $("#offer-search").value = ""; $("#offer-type-filter").value = ""; $("#offer-status-filter").value = ""; $("#offer-sort").value = "recent"; renderOfferResults(); }
  if (event.target.closest("#save-profile")) toast("Modifications enregistrées", "Votre profil a bien été mis à jour.");
  if (event.target.closest("#read-all")) { $$(".unread-entry").forEach(x=>x.classList.remove("unread-entry")); toast("Notifications mises à jour","Toutes les notifications sont marquées comme lues."); }
});

/* ---------- Offres : saisie du formulaire et actions branchées sur l’API ---------- */

function onDraftInput(event) {
  const el = event.target.closest("[data-f]");
  if (!el || el.classList.contains("switch")) return;
  const key = el.dataset.f;
  if (key.startsWith("image-")) {
    if (event.type === "input") return;
    state.offerDraft.images[Number(key.slice(6))] = el.value;
    const thumbs = $("#image-thumbs");
    if (thumbs) thumbs.innerHTML = imageThumbs();
  } else {
    state.offerDraft[key] = el.value;
  }
  updateOfferPreview();
}
document.addEventListener("input", onDraftInput);
document.addEventListener("change", onDraftInput);

const stockTimers = new Map();
function scheduleStockSave(id, delay = 450) {
  clearTimeout(stockTimers.get(id));
  stockTimers.set(id, setTimeout(() => saveInventoryStock(id), delay));
}
async function saveInventoryStock(id) {
  stockTimers.delete(id);
  const input = $(`[data-stock-input="${id}"]`);
  const offer = state.offers.find(o => o.id === Number(id));
  if (!input || !offer) return;
  const stock = Number(input.value);
  if (input.value.trim() === "" || !Number.isInteger(stock) || stock < 0) {
    input.value = offer.stock;
    toast("Stock invalide", "Indiquez un nombre entier positif ou nul.", "error");
    return;
  }
  if (stock === offer.stock) return;
  try {
    await saveOffer(offer, { stock });
    await refreshOffers();
    toast("Stock mis à jour", `« ${offer.title} » : ${stock} unité${stock > 1 ? "s" : ""} en stock.`);
  } catch (err) {
    input.value = offer.stock;
    toast("Mise à jour du stock impossible", err.message, "error");
  }
}
document.addEventListener("change", event => {
  const input = event.target.closest("[data-stock-input]");
  if (input) { clearTimeout(stockTimers.get(input.dataset.stockInput)); saveInventoryStock(input.dataset.stockInput); }
});
document.addEventListener("keydown", event => {
  const input = event.target.closest?.("[data-stock-input]");
  if (input && event.key === "Enter") input.blur();
});

async function refreshOffers() {
  await loadOffers();
  if (state.page === "offers") renderOfferResults();
  if (state.page === "inventory" && state.refreshInventory) state.refreshInventory();
}

async function guarded(action, errorTitle) {
  try {
    await action();
  } catch (err) {
    toast(errorTitle, err.message, "error");
    if (state.page === "offers") renderOfferResults();
  }
}

document.addEventListener("click", async event => {
  const target = event.target;
  const find = id => state.offers.find(o => o.id === Number(id));

  const formSwitch = target.closest(".switch[data-f]");
  if (formSwitch) {
    state.offerDraft[formSwitch.dataset.f] = formSwitch.classList.contains("on");
    updateOfferPreview();
    return;
  }

  const toggle = target.closest("[data-toggle-offer]");
  if (toggle) {
    const offer = find(toggle.dataset.toggleOffer);
    await guarded(async () => {
      await saveOffer(offer, { active: !offer.active });
      await refreshOffers();
      toast(offer.active ? "Offre désactivée" : "Offre activée", `« ${offer.title} » est maintenant ${offer.active ? "inactive" : "active"}.`);
    }, "Changement de statut impossible");
    return;
  }

  const edit = target.closest("[data-edit-offer]");
  if (edit) { closeModal(); startEditOffer(Number(edit.dataset.editOffer)); return; }

  const del = target.closest("[data-delete-offer]");
  if (del) {
    const offer = find(del.dataset.deleteOffer);
    showModal("Supprimer l’offre ?", `<p class="text-[10px] leading-5 text-atlas-muted">« ${esc(offer.title)} » sera supprimée définitivement. Cette action est irréversible.</p><div class="mt-5 flex justify-end gap-2">${button("Annuler", "", "ghost", "data-close-modal")}${button("Supprimer", "trash-2", "danger", `id="confirm-delete-offer" data-id="${offer.id}"`)}</div>`);
    return;
  }

  const confirmDelete = target.closest("#confirm-delete-offer");
  if (confirmDelete) {
    const offer = find(confirmDelete.dataset.id);
    try {
      await api.delete(`/api/offers/${offer.id}`);
      closeModal();
      await refreshOffers();
      toast("Offre supprimée", `« ${offer.title} » a été supprimée.`);
    } catch (err) {
      closeModal();
      showModal("Suppression impossible", `<div class="flex gap-3 rounded-lg bg-red-50 p-4 text-red-700">${icon("circle-x")}<p class="text-[9px] leading-4">${esc(err.message)}</p></div><div class="mt-5 flex justify-end gap-2">${button("Fermer", "", "ghost", "data-close-modal")}${button("Désactiver à la place", "", "danger", `data-deactivate-offer="${offer.id}"`)}</div>`);
    }
    return;
  }

  const deactivate = target.closest("[data-deactivate-offer]");
  if (deactivate) {
    const offer = find(deactivate.dataset.deactivateOffer);
    await guarded(async () => {
      await saveOffer(offer, { active: false });
      closeModal();
      await refreshOffers();
      toast("Offre désactivée", `« ${offer.title} » n’est plus visible dans le catalogue.`);
    }, "Désactivation impossible");
    return;
  }

  const stockStep = target.closest("[data-stock-step]");
  if (stockStep) {
    const input = $(`[data-stock-input="${stockStep.dataset.id}"]`);
    input.value = Math.max(0, (Number(input.value) || 0) + Number(stockStep.dataset.stockStep));
    scheduleStockSave(stockStep.dataset.id);
    return;
  }

  if (target.closest("#retry-offers")) { navigate(state.page); return; }
  if (target.closest("#empty-new-offer")) { startNewOffer(); navigate("new-offer"); return; }

  if (target.closest("#offer-previous")) {
    if (state.offerStep === 1) { startNewOffer(); navigate("offers"); }
    else { state.offerStep--; renderOfferForm(); lucide.createIcons(); }
    return;
  }
  if (target.closest("#offer-next")) {
    const problem = validateStep(state.offerStep);
    if (problem) { toast("Vérifiez le formulaire", problem, "error"); return; }
    if (state.offerStep < 4) { state.offerStep++; renderOfferForm(); lucide.createIcons(); return; }
    for (const step of [1, 2]) {
      const earlier = validateStep(step);
      if (earlier) { state.offerStep = step; renderOfferForm(); lucide.createIcons(); toast("Vérifiez le formulaire", earlier, "error"); return; }
    }
    await submitOffer();
  }
});

$("#notification-toggle").addEventListener("click", event => { event.stopPropagation(); $("#notification-dropdown").classList.toggle("hidden"); $("#account-dropdown").classList.add("hidden"); });
$("#account-toggle").addEventListener("click", event => { event.stopPropagation(); $("#account-dropdown").classList.toggle("hidden"); $("#notification-dropdown").classList.add("hidden"); });
$("#logout-button").addEventListener("click", () => Auth.logout());
showSupplierIdentity();
document.addEventListener("click", event => {
  if (!event.target.closest("#notification-dropdown") && !event.target.closest("#notification-toggle")) $("#notification-dropdown").classList.add("hidden");
  if (!event.target.closest("#account-dropdown") && !event.target.closest("#account-toggle")) $("#account-dropdown").classList.add("hidden");
});

$("#sidebar-toggle").addEventListener("click", () => {
  const collapsed = $("#sidebar").classList.toggle("collapsed");
  $("#main-shell").classList.toggle("expanded", collapsed);
  $("#sidebar-toggle").setAttribute("aria-label", collapsed ? "Déplier le menu" : "Replier le menu");
});
$$("#sidebar-nav .nav-item").forEach(item => { item.title = item.querySelector("span")?.textContent || ""; });

const requestedPage = new URLSearchParams(window.location.search).get("page") || "dashboard";
navigate(requestedPage in supplierPages ? requestedPage : "dashboard");
