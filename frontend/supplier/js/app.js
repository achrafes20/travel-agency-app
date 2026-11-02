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
  "airline", "flightNumber", "departureAirport", "arrivalAirport", "departureDateTime", "arrivalDateTime", "roundTrip", "returnDepartureDateTime", "returnArrivalDateTime", "cabinClass",
  "stars", "roomType", "address",
  "brand", "model", "transmission", "seats", "allowsDifferentDropoff", "minimumDriverAge", "maximumDriverAge",
  "pickupLocation", "dropoffLocation", "dropoffLocations", "vehicleType",
  "durationHours", "includesGuide", "includesTransport", "itinerary",
];
const REQUEST_FIELDS = ["type", "title", "description", "basePrice", "availabilities", "allowsPayOnArrival", "active", "images", "cityId", "cityName", "cityLatitude", "cityLongitude", "cityCountry", "cityCountryCode", "cityHasAirport", "supplierId", ...SPECIFIC_FIELDS];
const NUMERIC_FIELDS = ["basePrice", "stars", "seats", "minimumDriverAge", "maximumDriverAge", "durationHours", "cityId", "cityLatitude", "cityLongitude"];
const MAX_IMAGES = 5;
let offerUploader=null;

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = value => `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const dateTime = value => value ? new Intl.DateTimeFormat("fr-MA", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const offerImage = o => o.images?.[0] || OFFER_TYPES[o.type]?.image || images.hotel;
const offerStatus = o => (o.active ? "Active" : "Inactive");

const bookings = [];

const state = {
  page: "dashboard",
  offerStep: 1,
  offers: [],
  supplier: null,
  editingId: null,
  offerDraft: null,
  offerView: "table",
  profileTab: "company",
};

// Le brouillon doit être créé après l'initialisation de `state`, car newDraft()
// utilise la spécialité du fournisseur lorsqu'elle est déjà disponible.
state.offerDraft = newDraft();

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
 pageContent.innerHTML = '<div id="stats-module"></div>';
 StatsUI.mount(document.getElementById("stats-module"),"SUPPLIER");
}


function renderOffers() {
  const availableTypes = allowedOfferTypes();
  pageContent.innerHTML = `
    ${pageHeader("Catalogue", "Mes offres", "Gérez vos prestations, leur visibilité et leurs disponibilités.", button("Nouvelle offre", "plus", "primary", 'data-page="new-offer"'))}
    <div class="card toolbar mb-4">
      <label class="search-field">${icon("search")}<input id="offer-search" placeholder="Rechercher une offre…" /></label>
      <select id="offer-type-filter" class="control"><option value="">${availableTypes.length === 1 ? availableTypes[0][1].label : "Tous les types"}</option>${availableTypes.length > 1 ? availableTypes.map(([key, t]) => `<option value="${key}">${t.label}</option>`).join("") : ""}</select>
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
    root.innerHTML = `<div class="card overflow-hidden"><div class="table-wrap"><table class="data-table"><thead><tr><th>Offre</th><th>Type</th><th>Prix de base</th><th>Disponibilités</th><th>Actif</th><th class="th-center">Actions</th></tr></thead><tbody>${filtered.map(offerRow).join("")}</tbody></table></div>${count}</div>`;
  }
  lucide.createIcons();
}

const offerActions = o => `<div class="row-actions-group"><button type="button" class="action-btn action-edit" data-edit-offer="${o.id}" title="Modifier" aria-label="Modifier">${icon("pencil")}</button><button type="button" class="action-btn action-view" data-page="inventory" title="Voir les disponibilités" aria-label="Voir les disponibilités">${icon("calendar-range")}</button><button type="button" class="action-btn action-delete" data-delete-offer="${o.id}" title="Supprimer" aria-label="Supprimer">${icon("trash-2")}</button></div>`;

function offerRow(o) {
  const t = OFFER_TYPES[o.type];
  return `<tr>
    <td><div class="offer-cell"><img src="${esc(offerImage(o))}" alt=""><div><strong>${esc(o.title)}</strong><span>${esc(o.cityName)}</span></div></div></td>
    <td><span class="flex items-center gap-1.5 font-semibold text-atlas-royal">${icon(t.icon)} ${t.label}</span></td>
    <td><strong>${money(o.basePrice)}</strong><small class="block text-[7px] text-atlas-muted">/ unité</small></td>
    <td>${o.availabilities?.length || 0} période${o.availabilities?.length === 1 ? "" : "s"}</td>
    <td><button class="switch ${o.active ? "on" : ""}" data-toggle-offer="${o.id}" aria-label="Changer le statut"></button></td>
    <td class="table-actions-cell">${offerActions(o)}</td>
  </tr>`;
}
function offerCard(o) {
  const t = OFFER_TYPES[o.type];
  return `<article class="card overflow-hidden"><div class="relative h-44"><img src="${esc(offerImage(o))}" alt="" class="h-full w-full object-cover"><span class="absolute right-3 top-3">${badge(offerStatus(o), badgeTone(offerStatus(o)))}</span></div><div class="p-5"><span class="eyebrow">${t.label.toUpperCase()} · ${esc(o.cityName).toUpperCase()}</span><h2 class="mt-2 text-sm font-bold">${esc(o.title)}</h2><p class="mt-2 text-[9px] leading-5 text-atlas-muted">${esc(o.description || "Aucune description.")}</p><div class="mt-4 flex items-end justify-between border-t border-atlas-border pt-4"><span class="text-[8px] text-atlas-muted">À partir de</span><strong class="text-sm text-atlas-royal">${money(o.basePrice)}</strong></div><div class="mt-3 flex justify-end">${offerActions(o)}</div></div></article>`;
}

async function ensureSupplier() {
  if (!state.supplier) state.supplier = await api.get("/api/auth/me");
  return state.supplier;
}

function renderSupplierBootstrapError(error) {
  pageContent.innerHTML = `<div class="card py-16 text-center">
    <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">${icon("circle-x")}</span>
    <h1 class="mt-4 text-base font-bold">Impossible de charger l’espace fournisseur</h1>
    <p class="mx-auto mt-2 max-w-xl text-[10px] leading-5 text-atlas-muted">${esc(error.message || "Une erreur inattendue est survenue.")}</p>
    <div class="mt-5 flex justify-center gap-2">
      ${button("Réessayer", "refresh-cw", "primary", 'id="retry-supplier-bootstrap"')}
      ${button("Se reconnecter", "log-in", "secondary", 'id="supplier-relogin"')}
    </div>
  </div>`;
  if (window.lucide) lucide.createIcons();
}

function allowedOfferTypes() {
  const category = state.supplier?.supplierCategory;
  return category && OFFER_TYPES[category] ? [[category, OFFER_TYPES[category]]] : Object.entries(OFFER_TYPES);
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
  type = state.supplier?.supplierCategory || type;
  return { type, title: "", description: "", cityId: "", cityName: "", cityLatitude: "", cityLongitude: "", cityCountry: "Maroc", cityCountryCode: "MA", cityHasAirport: false, basePrice: "", availabilities: [{ startAt: "", endAt: "", capacity: 1 }], allowsPayOnArrival: false, active: true, images: Array(MAX_IMAGES).fill(""), stars: 3, roundTrip: false, cabinClass: "ECONOMY", departureSelected: false, pickupSelected: false, dropoffSelected: false, dropoffLocations: [""], dropoffSelections: [false], allowsDifferentDropoff: false, minimumDriverAge: 21, maximumDriverAge: 75, includesGuide: false, includesTransport: false };
}
function draftFromOffer(o) {
  const draft = newDraft(o.type);
  REQUEST_FIELDS.filter(k => k !== "images").forEach(k => { if (o[k] != null) draft[k] = o[k]; });
  draft.cityId = String(o.cityId);
  draft.cityName = o.cityName || "";
  draft.images = [...o.images, ...Array(MAX_IMAGES).fill("")].slice(0, MAX_IMAGES);
  draft.departureSelected = o.type === "FLIGHT" && Boolean(o.departureAirport);
  draft.pickupSelected = Boolean(o.pickupLocation);
  draft.dropoffSelected = Boolean(o.dropoffLocation);
  draft.dropoffLocations = o.dropoffLocations?.length ? [...o.dropoffLocations] : (o.dropoffLocation ? [o.dropoffLocation] : [""]);
  draft.dropoffSelections = draft.dropoffLocations.map(Boolean);
  draft.availabilities = (o.availabilities?.length ? o.availabilities : [{ startAt: "", endAt: "", capacity: 1 }]).map(a => ({ startAt: a.startAt?.slice(0,16) || "", endAt: a.endAt?.slice(0,16) || "", capacity: a.capacity ?? 1 }));
  return draft;
}
function startNewOffer() {
  state.editingId = null;
  state.offerStep = 1;
  state.offerDraft = newDraft();
  state.offerDraft.activeTransTab = "fr";
  state.offerDraft.translations = {
    en: { title: "", description: "" },
    ar: { title: "", description: "" }
  };
}
async function startEditOffer(id) {
  const offer = state.offers.find(o => o.id === id);
  if (!offer) return;
  state.editingId = id;
  state.offerStep = 1;
  state.offerDraft = draftFromOffer(offer);
  state.offerDraft.activeTransTab = "fr";
  state.offerDraft.translations = {
    en: { title: "", description: "" },
    ar: { title: "", description: "" }
  };
  try {
    const transList = await api.get('/api/offers/' + id + '/translations');
    if (Array.isArray(transList)) {
      transList.forEach(t => {
        if (state.offerDraft.translations[t.locale]) {
          state.offerDraft.translations[t.locale] = {
            title: t.title || "",
            description: t.description || ""
          };
        }
      });
    }
  } catch (e) {}
  navigate("new-offer");
}

function buildPayload() {
  const d = state.offerDraft;
  const payload = {};
  Object.entries(d).forEach(([k, v]) => {
    if (k === "images" || k.endsWith("Selected") || k === "dropoffSelections" || k === "translations" || k === "activeTransTab") return;
    payload[k] = typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v;
  });
  NUMERIC_FIELDS.forEach(k => { if (payload[k] != null) payload[k] = Number(payload[k]); });
  payload.images = d.images.map(s => s.trim()).filter(Boolean);
  payload.availabilities = d.availabilities.map(a => ({ startAt: a.startAt, endAt: a.endAt, capacity: Number(a.capacity) }));
  payload.stock = 0;
  payload.roundTrip = d.roundTrip === true || d.roundTrip === "true";
  payload.supplierId = state.supplier.id;
  return payload;
}

function validateStep(step) {
  const d = state.offerDraft;
  const blank = k => !String(d[k] ?? "").trim();
  if (step === 1) {
    if (blank("title")) return "Le titre de l’offre est obligatoire.";
    if (d.type !== "FLIGHT" && (blank("cityName") || (!d.cityId && (d.cityLatitude === "" || d.cityLongitude === "")))) {
      return "Recherchez puis sélectionnez une ville dans les suggestions.";
    }
  }
  if (step === 2) {
    const rules = {
      FLIGHT: [["airline", "La compagnie aérienne est obligatoire."], ["departureAirport", "Le départ est obligatoire."], ["arrivalAirport", "La destination est obligatoire."], ["departureDateTime", "La date et l’heure de départ sont obligatoires."], ["arrivalDateTime", "La date et l’heure d’arrivée sont obligatoires."], ["cabinClass", "La classe de voyage est obligatoire."]],
      HOTEL: [["roomType", "Le type de chambre est obligatoire."]],
      CAR: [["brand", "La marque est obligatoire."], ["pickupLocation", "Le lieu de prise en charge est obligatoire."]],
      TAXI_TRANSFER: [["pickupLocation", "Le lieu de prise en charge est obligatoire."], ["dropoffLocation", "Le lieu de dépose est obligatoire."]],
      EXCURSION: [["durationHours", "La durée de l’excursion est obligatoire."]],
    };
    for (const [key, message] of rules[d.type]) if (blank(key)) return message;
    if (d.type === "FLIGHT" && !d.departureSelected) return "Sélectionnez le départ dans les suggestions proposées par l’API.";
    if (d.type === "FLIGHT" && (blank("cityName") || d.cityLatitude === "" || d.cityLongitude === "")) return "Sélectionnez la destination dans les suggestions proposées par l’API.";
    if (d.type === "FLIGHT" && d.departureDateTime && d.arrivalDateTime && d.arrivalDateTime <= d.departureDateTime) return "L’arrivée doit être postérieure au départ.";
    if (d.type === "FLIGHT" && (d.roundTrip === true || d.roundTrip === "true")) {
      if (!d.returnDepartureDateTime || !d.returnArrivalDateTime) return "Renseignez les dates et heures du vol retour.";
      if (d.returnDepartureDateTime <= d.arrivalDateTime || d.returnArrivalDateTime <= d.returnDepartureDateTime) return "Le retour doit commencer après l’arrivée de l’aller.";
    }
    if (d.type === "EXCURSION" && Number(d.durationHours) < 1) return "La durée doit être d’au moins 1 heure.";
    if (d.type === "CAR" && !blank("seats") && Number(d.seats) < 1) return "Le nombre de places doit être supérieur à 0.";
    if ((d.type === "CAR" || d.type === "TAXI_TRANSFER") && !d.pickupSelected) return "Sélectionnez le lieu de prise en charge dans les suggestions de l’API.";
    if (d.type === "TAXI_TRANSFER" && !d.dropoffSelected) return "Sélectionnez le lieu de dépose dans les suggestions de l’API.";
    if (d.type === "CAR" && (Number(d.minimumDriverAge) < 18 || Number(d.maximumDriverAge) > 99 || Number(d.maximumDriverAge) < Number(d.minimumDriverAge))) return "Indiquez une plage d’âge conducteur valide entre 18 et 99 ans.";
    if (d.type === "CAR" && d.allowsDifferentDropoff && (!d.dropoffLocations.length || d.dropoffLocations.some((v,i) => !v || !d.dropoffSelections[i]))) return "Sélectionnez chaque lieu de restitution dans les suggestions de l’API.";
  }
  if (step === 4) {
    if (blank("basePrice") || Number(d.basePrice) < 0) return "Indiquez un prix de base valide.";
    if (!d.availabilities.length) return "Ajoutez au moins une période de disponibilité.";
    for (const p of d.availabilities) {
      if (!p.startAt || !p.endAt || p.endAt <= p.startAt) return "Chaque période doit avoir une date de fin postérieure au début.";
      if (!Number.isInteger(Number(p.capacity)) || Number(p.capacity) < 0) return "Indiquez une capacité valide pour chaque période.";
    }
    if (d.type === "FLIGHT") {
      const covered = date => d.availabilities.some(p => date >= p.startAt && date <= p.endAt);
      if (!covered(d.departureDateTime)) return "Une période de disponibilité doit couvrir le départ du vol aller.";
      if ((d.roundTrip === true || d.roundTrip === "true") && !covered(d.returnDepartureDateTime)) return "Une période de disponibilité doit couvrir le départ du vol retour.";
    }
  }
  return null;
}

async function submitOffer() {
  if(offerUploader?.isBusy()){toast("Images en cours","Attendez la fin du téléversement.","error");return;}
  const submit = $("#offer-next");
  submit.disabled = true;
  try {
    await ensureSupplier();
    const payload = buildPayload();
    const editing = Boolean(state.editingId);
    let saved;
    if (editing) saved = await api.put(`/api/offers/${state.editingId}`, payload);
    else saved = await api.post("/api/offers", payload);

    const offerId = state.editingId || saved?.id;
    if (offerId && state.offerDraft.translations) {
      for (const loc of ["en", "ar"]) {
        const tr = state.offerDraft.translations[loc];
        if (tr && (tr.title?.trim() || tr.description?.trim())) {
          await api.put(`/api/offers/${offerId}/translations/${loc}`, {
            title: tr.title?.trim() || "",
            description: tr.description?.trim() || ""
          }).catch(e => console.warn(`Erreur traduction ${loc}:`, e));
        }
      }
    }

    toast(editing ? "Offre mise à jour" : "Offre publiée avec succès", editing ? "Les modifications sont enregistrées." : "Elle est enregistrée dans votre catalogue.");
    startNewOffer();
    setTimeout(() => navigate("offers"), 900);
  } catch (err) {
    submit.disabled = false;
    toast("Enregistrement impossible", err.message, "error");
  }
}

/* ---------- Formulaire en 4 étapes ---------- */

let citySearchTimer;
const flightSearchTimers = {};
const offerPlaceSearchTimers = {};
const carDropoffSearchTimers = {};
async function searchCities(query) {
  if (typeof window !== "undefined" && window.GeocodingClient) {
    try {
      return await window.GeocodingClient.search(query);
    } catch (e) {
      console.warn("GeocodingClient error, fallback:", e);
    }
  }
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=7&language=fr&format=json`);
  if (!response.ok) throw new Error("Le service de recherche des villes est indisponible.");
  const payload = await response.json();
  return payload.results || [];
}

function paintCitySuggestions(results, error = "") {
  const box = $("#offer-city-suggestions");
  if (!box) return;
  if (error) {
    box.innerHTML = `<p class="p-3 text-[8px] text-red-600">${esc(error)}</p>`;
  } else if (!results.length) {
    box.innerHTML = '<p class="p-3 text-[8px] text-atlas-muted">Aucune ville trouvée.</p>';
  } else {
    box.innerHTML = results.map((city, index) => `<button type="button" class="block w-full border-b border-atlas-border px-3 py-2 text-left hover:bg-blue-50" data-city-choice="${index}"><strong class="block text-[9px]">${esc(city.name)}</strong><small class="text-[7px] text-atlas-muted">${esc([city.admin1, city.country].filter(Boolean).join(", "))}</small></button>`).join("");
  }
  box.classList.remove("hidden");
  box._results = results;
}

function scheduleCitySearch(value) {
  clearTimeout(citySearchTimer);
  state.offerDraft.cityId = "";
  state.offerDraft.cityLatitude = "";
  state.offerDraft.cityLongitude = "";
  const box = $("#offer-city-suggestions");
  if (!value || value.trim().length < 2) {
    box?.classList.add("hidden");
    return;
  }
  citySearchTimer = setTimeout(async () => {
    try {
      paintCitySuggestions(await searchCities(value.trim()));
    } catch (error) {
      paintCitySuggestions([], error.message);
    }
  }, 350);
}

function scheduleFlightPlaceSearch(mode, value) {
  clearTimeout(flightSearchTimers[mode]);
  const box = $(`#flight-${mode}-suggestions`);
  if (mode === "departure") state.offerDraft.departureSelected = false;
  if (mode === "destination") {
    state.offerDraft.cityId = ""; state.offerDraft.cityName = "";
    state.offerDraft.cityLatitude = ""; state.offerDraft.cityLongitude = "";
  }
  if (!value || value.trim().length < 2) { box?.classList.add("hidden"); return; }
  flightSearchTimers[mode] = setTimeout(async () => {
    try {
      const results = await searchCities(value.trim());
      box._results = results;
      box.innerHTML = results.length ? results.map((city,index)=>`<button type="button" class="block w-full border-b border-atlas-border px-3 py-2 text-left hover:bg-blue-50" data-flight-city-choice="${mode}" data-index="${index}"><strong class="block text-[9px]">${esc(city.name)}</strong><small class="text-[7px] text-atlas-muted">${esc([city.admin1,city.country,city.country_code].filter(Boolean).join(" · "))}</small></button>`).join("") : '<p class="p-3 text-[8px] text-atlas-muted">Aucune ville trouvée.</p>';
      box.classList.remove("hidden");
    } catch (error) {
      box.innerHTML=`<p class="p-3 text-[8px] text-red-600">${esc(error.message)}</p>`; box.classList.remove("hidden");
    }
  }, 350);
}

function scheduleOfferPlaceSearch(mode, value) {
  clearTimeout(offerPlaceSearchTimers[mode]);
  const box = $(`#offer-${mode}-suggestions`);
  state.offerDraft[`${mode}Selected`] = false;
  if (!value || value.trim().length < 2) { box?.classList.add("hidden"); return; }
  offerPlaceSearchTimers[mode] = setTimeout(async () => {
    try {
      const results = await searchCities(value.trim());
      box._results = results;
      box.innerHTML = results.length
        ? results.map((city,index)=>`<button type="button" class="block w-full border-b border-atlas-border px-3 py-2 text-left hover:bg-blue-50" data-offer-place-choice="${mode}" data-index="${index}"><strong class="block text-[9px]">${esc(city.name)}</strong><small class="text-[7px] text-atlas-muted">${esc([city.admin1,city.country,city.country_code].filter(Boolean).join(" · "))}</small></button>`).join("")
        : '<p class="p-3 text-[8px] text-atlas-muted">Aucune ville trouvée.</p>';
      box.classList.remove("hidden");
    } catch (error) {
      box.innerHTML = `<p class="p-3 text-[8px] text-red-600">${esc(error.message)}</p>`;
      box.classList.remove("hidden");
    }
  }, 350);
}

function scheduleCarDropoffSearch(index, value) {
  clearTimeout(carDropoffSearchTimers[index]);
  const box = $(`#car-dropoff-suggestions-${index}`);
  state.offerDraft.dropoffSelections[index] = false;
  if (!value || value.trim().length < 2) { box?.classList.add("hidden"); return; }
  carDropoffSearchTimers[index] = setTimeout(async () => {
    try {
      const results = await searchCities(value.trim());
      box._results = results;
      box.innerHTML = results.length ? results.map((city, resultIndex) => `<button type="button" class="block w-full border-b border-atlas-border px-3 py-2 text-left hover:bg-blue-50" data-car-dropoff-choice="${index}" data-result-index="${resultIndex}"><strong class="block text-[9px]">${esc(city.name)}</strong><small class="text-[7px] text-atlas-muted">${esc([city.admin1, city.country].filter(Boolean).join(", "))}</small></button>`).join("") : '<p class="p-3 text-[8px] text-atlas-muted">Aucune ville trouvée.</p>';
      box.classList.remove("hidden");
    } catch (error) {
      box.innerHTML = `<p class="p-3 text-[8px] text-red-600">${esc(error.message)}</p>`;
      box.classList.remove("hidden");
    }
  }, 350);
}

function offerPreview() {
  const d = state.offerDraft;
  const t = OFFER_TYPES[d.type];
  const img = d.images.find(s => s.trim()) || t.image;
  const city = d.cityName || "Ville";
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
  offerUploader?.destroy();offerUploader=null;
  const editing = Boolean(state.editingId);
  const steps = ["Type & informations", "Détails spécifiques", "Images", "Tarif & disponibilités"];
  pageContent.innerHTML = `
    ${pageHeader("Mes offres", editing ? "Modifier l’offre" : "Créer une nouvelle offre", "Complétez les informations ci-dessous : elles sont enregistrées en base de données.")}
    <div class="card offer-progress mb-4">${steps.map((s,i) => `<div class="step ${state.offerStep === i+1 ? "active" : ""} ${state.offerStep > i+1 ? "done" : ""}"><span class="step-number">${state.offerStep > i+1 ? icon("check") : i+1}</span><span class="step-text"><strong>${s}</strong><small>Étape ${i+1}</small></span>${i<3?'<i class="step-line"></i>':""}</div>`).join("")}</div>
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
  if(state.offerStep===3){offerUploader=Uploader.createUploader({container:$("#offer-images-uploader"),purpose:"OFFER_IMAGE",max:MAX_IMAGES,initial:state.offerDraft.images.filter(Boolean),onChange:(urls,meta)=>{
    state.offerDraft.images=[...urls,...Array(MAX_IMAGES).fill("")].slice(0,MAX_IMAGES);const next=$("#offer-next");if(next)next.disabled=meta.busy;const preview=$("#offer-preview");if(preview)preview.innerHTML=offerPreview();
  }});}
}

function offerStepContent() {
  const d = state.offerDraft;
  if (state.offerStep === 1) {
    return `
      ${formHeader("01", "Type et informations générales", "Choisissez la catégorie qui correspond à votre prestation.")}
      <div class="mt-5 grid ${allowedOfferTypes().length === 1 ? "max-w-[220px] grid-cols-1" : "grid-cols-5"} gap-2">
        ${allowedOfferTypes().map(([key, t]) => `<button type="button" class="type-card ${d.type === key ? "selected" : ""}" data-type="${key}" ${(state.editingId || state.supplier?.supplierCategory) ? "disabled" : ""}><span class="type-icon">${icon(t.icon)}</span><strong>${t.cardLabel}</strong></button>`).join("")}
      </div>
      ${state.editingId ? '<p class="mt-2 text-[8px] text-atlas-muted">Le type d’une offre ne peut pas être modifié après sa création.</p>' : ""}

      <div class="mt-6 grid grid-cols-2 gap-4">
        ${bound("Titre de l’offre", "title", { placeholder: "Suite Bleue avec vue sur la médina", classes: "col-span-2" })}
        ${d.type === "FLIGHT" ? `<div class="col-span-2 flex gap-2 rounded-lg bg-blue-50 p-3 text-[8px] leading-4 text-blue-800">${icon("info")}<p>Pour un vol, le départ et la destination sont renseignés à l’étape suivante. La destination déterminera automatiquement la ville de l’offre.</p></div>` : `<div class="field relative"><label>Ville</label><input id="offer-city-search" data-f="cityName" value="${esc(d.cityName)}" placeholder="Rechercher une ville dans le monde…" autocomplete="off"><small class="mt-1 block text-[7px] text-atlas-muted">Recherche et coordonnées automatiques via Open-Meteo</small><div id="offer-city-suggestions" class="absolute left-0 right-0 top-full z-50 mt-1 hidden max-h-52 overflow-auto rounded-lg border border-atlas-border bg-white shadow-lg"></div></div>`}
        ${bound("Description", "description", { kind: "textarea", placeholder: "Décrivez l’expérience, les points forts et ce qui rend votre offre unique…", classes: "col-span-2" })}
      </div>
    `;
  }
  if (state.offerStep === 2) return `
    ${formHeader("02", `Détails — ${OFFER_TYPES[d.type].cardLabel}`, "Ces informations aideront les voyageurs à faire leur choix.")}
    <div class="mt-6 grid grid-cols-2 gap-4">${specificFields(d.type)}</div>`;
  if (state.offerStep === 3) return `
    ${formHeader("03", "Images", `Téléversez jusqu’à ${MAX_IMAGES} photos. Réordonnez-les : la première est l’image principale.`)}
    <div id="offer-images-uploader" class="mt-6"></div>`;
  return `
    ${formHeader("04", "Tarif et disponibilités", "Définissez les périodes pendant lesquelles cette prestation peut être réservée.")}
    <div class="mt-6 grid grid-cols-2 gap-4">${bound("Prix de base (MAD)", "basePrice", { kind: "number", placeholder: "890", classes: "col-span-2" })}</div>
    <div class="mt-5"><div class="mb-3 flex items-center justify-between"><div><strong class="text-[10px]">Calendrier de disponibilité</strong><p class="mt-1 text-[8px] text-atlas-muted">La capacité correspond aux chambres, places ou véhicules disponibles sur cette période.</p></div><button type="button" class="btn btn-secondary" id="add-availability">${icon("plus")} Ajouter une période</button></div><div id="availability-list" class="space-y-3">${availabilityFields()}</div></div>
    <div class="mt-5 divide-y divide-atlas-border border-y border-atlas-border">
      ${switchRow("Autoriser le paiement à l’arrivée", "Le voyageur pourra régler directement sur place.", d.allowsPayOnArrival, "allowsPayOnArrival")}
      ${switchRow("Offre active", "L’offre sera visible dans le catalogue.", d.active, "active")}
    </div>`;
}

function availabilityFields() {
  return state.offerDraft.availabilities.map((p,i)=>`<div class="grid grid-cols-[1fr_1fr_110px_36px] items-end gap-3 rounded-lg border border-atlas-border p-3"><div class="field"><label>Disponible du</label><input type="datetime-local" data-availability-index="${i}" data-availability-key="startAt" value="${esc(p.startAt)}"></div><div class="field"><label>Jusqu’au</label><input type="datetime-local" data-availability-index="${i}" data-availability-key="endAt" value="${esc(p.endAt)}"></div><div class="field"><label>Capacité</label><input type="number" min="0" step="1" data-availability-index="${i}" data-availability-key="capacity" value="${esc(p.capacity)}"></div><button type="button" class="icon-button" data-remove-availability="${i}" title="Supprimer">${icon("trash-2")}</button></div>`).join("");
}

function imageThumbs() {
  return state.offerDraft.images.filter(s => s.trim()).map(url => `<img src="${esc(url)}" class="h-20 w-28 rounded-lg object-cover" alt="" onerror="this.style.display='none'">`).join("");
}

function specificFields(type) {
  const d = state.offerDraft;
  switch (type) {
    case "FLIGHT": return [
      bound("Type de trajet", "roundTrip", { kind: "select", options: [["false", "Aller simple"], ["true", "Aller-retour"]] }),
      bound("Classe de voyage", "cabinClass", { kind: "select", options: [["ECONOMY", "Économique"], ["PREMIUM_ECONOMY", "Économique premium"], ["BUSINESS", "Affaires"], ["FIRST", "Première classe"]] }),
      bound("Compagnie aérienne", "airline", { placeholder: "Royal Air Maroc" }),
      bound("Numéro de vol", "flightNumber", { placeholder: "AT-204" }),
      flightPlaceField("Départ — ville ou aéroport", "departureAirport", "departure", "Casablanca"),
      flightPlaceField("Destination — ville ou aéroport", "arrivalAirport", "destination", "Marrakech"),
      bound("Aller — départ", "departureDateTime", { kind: "datetime-local" }),
      bound("Aller — arrivée", "arrivalDateTime", { kind: "datetime-local" }),
      ...((d.roundTrip === true || d.roundTrip === "true") ? [bound("Retour — départ", "returnDepartureDateTime", { kind: "datetime-local" }), bound("Retour — arrivée", "returnArrivalDateTime", { kind: "datetime-local" })] : []),
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
      offerPlaceField("Lieu de prise en charge", "pickupLocation", "pickup", "Aéroport, ville ou gare", "col-span-2"),
      `<div class="col-span-2 divide-y divide-atlas-border border-y border-atlas-border">${switchRow("Restitution dans un autre endroit", "Autoriser le client à choisir un lieu de restitution différent.", d.allowsDifferentDropoff, "allowsDifferentDropoff")}</div>`,
      ...(d.allowsDifferentDropoff ? [carDropoffFields()] : []),
      bound("Âge minimum du conducteur", "minimumDriverAge", { kind: "number", placeholder: "21" }),
      bound("Âge maximum du conducteur", "maximumDriverAge", { kind: "number", placeholder: "75" }),
    ].join("");
    case "TAXI_TRANSFER": return [
      offerPlaceField("Lieu de prise en charge", "pickupLocation", "pickup", "Aéroport, gare ou ville"),
      offerPlaceField("Lieu de dépose", "dropoffLocation", "dropoff", "Ville ou destination"),
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

function flightPlaceField(label, key, mode, placeholder) {
  return `<div class="field relative"><label>${label}</label><input data-flight-place="${mode}" data-f="${key}" value="${esc(state.offerDraft[key] || "")}" placeholder="${placeholder}" autocomplete="off"><small class="mt-1 block text-[7px] text-atlas-muted">Recherche mondiale et coordonnées automatiques via Open-Meteo</small><div id="flight-${mode}-suggestions" class="absolute left-0 right-0 top-full z-50 mt-1 hidden max-h-52 overflow-auto rounded-lg border border-atlas-border bg-white shadow-lg"></div></div>`;
}

function offerPlaceField(label, key, mode, placeholder, classes = "") {
  return `<div class="field relative ${classes}"><label>${label}</label><input data-offer-place="${mode}" data-f="${key}" value="${esc(state.offerDraft[key] || "")}" placeholder="${placeholder}" autocomplete="off"><small class="mt-1 block text-[7px] text-atlas-muted">Recherche mondiale via Open-Meteo — sélectionnez une suggestion</small><div id="offer-${mode}-suggestions" class="absolute left-0 right-0 top-full z-50 mt-1 hidden max-h-52 overflow-auto rounded-lg border border-atlas-border bg-white shadow-lg"></div></div>`;
}

function carDropoffFields() {
  const fields = state.offerDraft.dropoffLocations.map((value, index) => `<div class="field relative"><label>Lieu autorisé ${index + 1}</label><input data-car-dropoff-index="${index}" value="${esc(value)}" placeholder="Ville, aéroport ou gare" autocomplete="off"><small class="mt-1 block text-[7px] text-atlas-muted">Sélection obligatoire via Open-Meteo</small><div id="car-dropoff-suggestions-${index}" class="absolute left-0 right-0 top-full z-50 mt-1 hidden max-h-52 overflow-auto rounded-lg border border-atlas-border bg-white shadow-lg"></div></div><button type="button" class="icon-button self-center" data-remove-car-dropoff="${index}" title="Supprimer">${icon("trash-2")}</button>`).join("");
  return `<div class="col-span-2"><div class="grid grid-cols-[1fr_36px] items-end gap-3" id="car-dropoff-list">${fields}</div><button type="button" class="btn btn-secondary mt-3" data-add-car-dropoff>${icon("plus")}<span>Ajouter un lieu de restitution</span></button></div>`;
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

function offerAvailabilityState(offer, now = new Date()) {
  const future = (offer.availabilities || []).filter(p => new Date(p.endAt) > now).sort((a,b) => new Date(a.startAt) - new Date(b.startAt));
  const current = future.find(p => new Date(p.startAt) <= now);
  if (!offer.active) return { key: "inactive", tone: "out", label: "Offre inactive", future, current };
  if (current) return { key: "current", tone: "ok", label: "Disponible maintenant", future, current };
  if (future.length) return { key: "upcoming", tone: "low", label: "Disponibilité à venir", future, current: null };
  return { key: "none", tone: "out", label: "Aucune disponibilité", future, current: null };
}

function filteredInventory() {
  const query = $("#inventory-search")?.value.trim().toLowerCase() || "";
  const type = $("#inventory-type")?.value || "";
  const city = $("#inventory-city")?.value || "";
  const status = $("#inventory-status")?.value || "";
  const horizon = Number($("#inventory-period")?.value || 0);
  const sort = $("#inventory-sort")?.value || "title";
  const now = new Date(), limit = horizon ? new Date(now.getTime() + horizon * 86400000) : null;
  const list = state.offers.filter(o => {
    const availability = offerAvailabilityState(o, now);
    const searchable = `${o.title} ${o.cityName} ${OFFER_TYPES[o.type]?.label || ""}`.toLowerCase();
    const inHorizon = !limit || (o.availabilities || []).some(p => new Date(p.endAt) >= now && new Date(p.startAt) <= limit);
    const selectedOffer = new URLSearchParams(location.search).get("offerId");
    return (!selectedOffer || String(o.id) === selectedOffer) && (!query || searchable.includes(query)) && (!type || o.type === type) && (!city || o.cityName === city)
      && (!status || availability.key === status) && inHorizon;
  });
  return list.sort((a,b) => {
    if (sort === "date") return new Date(a.nextAvailabilityStart || "9999-12-31") - new Date(b.nextAvailabilityStart || "9999-12-31");
    if (sort === "capacity") return Number(b.availableCapacity || 0) - Number(a.availableCapacity || 0);
    if (sort === "city") return String(a.cityName).localeCompare(String(b.cityName), "fr");
    return a.title.localeCompare(b.title, "fr");
  });
}

function inventoryRows(list) {
  if (!list.length) return `<tr><td colspan="3" class="py-10 text-center text-[10px] text-atlas-muted">Aucune offre à afficher.</td></tr>`;
  return list.map(o => {
    const state = offerAvailabilityState(o), current = state.current, future = state.future;
    return `<tr>
      <td><div class="offer-cell"><img src="${esc(offerImage(o))}" alt=""><div><strong>${esc(o.title)}</strong><span>${OFFER_TYPES[o.type].label} · ${esc(o.cityName)}</span></div></div></td>
      <td><div class="stock-level level-${state.tone}"><span class="level-pill">${state.label}</span><small class="text-[7px] text-atlas-muted">${o.availabilities?.length || 0} période${o.availabilities?.length === 1 ? "" : "s"}</small></div></td>
      <td><strong>${current ? `${dateTime(current.startAt)} — ${dateTime(current.endAt)}` : future[0] ? `${dateTime(future[0].startAt)} — ${dateTime(future[0].endAt)}` : "Aucune période future"}</strong><small class="mt-1 block text-[7px] text-atlas-muted">${current || future[0] ? `Capacité : ${(current || future[0]).capacity}` : "Modifiez l’offre pour ajouter une disponibilité"}</small></td>
    </tr>`;
  }).join("");
}

function renderInventory() {
  const cities = [...new Set(state.offers.map(o => o.cityName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr"));
  pageContent.innerHTML = `
    ${pageHeader("Gestion", "Calendrier des disponibilités", "Suivez les périodes réservables de toutes vos offres.")}
    <div class="card inventory-filters mb-4"><label class="search-field">${icon("search")}<input id="inventory-search" placeholder="Titre, ville ou type…"></label><select id="inventory-type" class="control"><option value="">Tous les types</option>${Object.entries(OFFER_TYPES).map(([key,t])=>`<option value="${key}">${t.label}</option>`).join("")}</select><select id="inventory-city" class="control"><option value="">Toutes les villes</option>${cities.map(c=>`<option>${esc(c)}</option>`).join("")}</select><select id="inventory-status" class="control"><option value="">Tous les statuts</option><option value="current">Disponible maintenant</option><option value="upcoming">À venir</option><option value="none">Sans disponibilité</option><option value="inactive">Offres inactives</option></select><select id="inventory-period" class="control"><option value="0">Toutes les périodes</option><option value="7">Dans les 7 jours</option><option value="30">Dans les 30 jours</option><option value="90">Dans les 90 jours</option></select><select id="inventory-sort" class="control"><option value="title">Tri : titre</option><option value="date">Tri : prochaine date</option><option value="capacity">Tri : capacité</option><option value="city">Tri : ville</option></select><button type="button" class="btn btn-ghost" id="inventory-reset">${icon("rotate-ccw")} Réinitialiser</button></div>
    <div class="inventory-summary"><span id="inventory-count">0 offre</span><small>Les filtres s’appliquent aux périodes futures et en cours.</small></div>
    <div class="card overflow-hidden"><table class="data-table"><thead><tr><th>Offre</th><th>Statut</th><th>Période actuelle ou prochaine</th></tr></thead><tbody id="inventory-body"><tr><td colspan="3" class="py-10 text-center text-[10px] text-atlas-muted">Chargement…</td></tr></tbody></table></div>`;
  const refresh = () => { const list=filteredInventory(); $("#inventory-body").innerHTML=inventoryRows(list); $("#inventory-count").textContent=`${list.length} offre${list.length>1?"s":""} affichée${list.length>1?"s":""}`; lucide.createIcons(); };
  $("#inventory-search").addEventListener("input", refresh);
  ["inventory-type","inventory-city","inventory-status","inventory-period","inventory-sort"].forEach(id => $("#"+id).addEventListener("change", refresh));
  $("#inventory-reset").addEventListener("click",()=>{ const url=new URL(location.href);url.searchParams.delete("offerId");history.replaceState({},"",url); $("#inventory-search").value=""; ["inventory-type","inventory-city","inventory-status","inventory-period","inventory-sort"].forEach(id=>$("#"+id).selectedIndex=0); refresh(); });
  state.refreshInventory = refresh;
  loadOffers().then(()=>{
    const select=$("#inventory-city"), current=select.value;
    const loadedCities=[...new Set(state.offers.map(o=>o.cityName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr"));
    select.innerHTML=`<option value="">Toutes les villes</option>${loadedCities.map(c=>`<option ${c===current?"selected":""}>${esc(c)}</option>`).join("")}`;
    refresh();
  }).catch(err => { $("#inventory-body").innerHTML = `<tr><td colspan="3" class="py-10 text-center text-[10px] text-red-600">${esc(err.message)}</td></tr>`; });
}

function renderBookings() {
  pageContent.innerHTML = '<div id="booking-module"></div>';
  BookingsUI.list(document.getElementById("booking-module"), "SUPPLIER");
}

function renderNotifications() {
 pageContent.innerHTML = '<div id="notification-module"></div>';
 NotificationsUI.page(document.getElementById("notification-module"));
}

function renderProfile() { pageContent.innerHTML='<div id="profile-module"></div>'; AccountUI.mount(document.getElementById("profile-module"),"SUPPLIER"); }

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

function renderTickets() {
  pageContent.innerHTML = '<div id="tickets-module"></div>';
  TicketsUI.supplier(document.getElementById("tickets-module"));
}

const supplierPages = {
  dashboard: renderDashboard,
  offers: renderOffers,
  "new-offer": renderOfferForm,
  inventory: renderInventory,
  bookings: renderBookings,
  tickets: renderTickets,
  notifications: renderNotifications,
  profile: renderProfile,
};

function navigate(page) {
  offerUploader?.destroy();offerUploader=null;
  StatsUI.dispose(); AccountUI.dispose();
  if (!supplierPages[page]) page = "dashboard";
  state.page = page;
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === page));
  NotificationsUI.close();
  $("#account-dropdown").classList.add("hidden");
  (supplierPages[page] || renderDashboard)();
  if (window.lucide) lucide.createIcons();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  if (event.target.closest("#retry-supplier-bootstrap")) { window.location.reload(); return; }
  if (event.target.closest("#supplier-relogin")) { Auth.logout(); return; }
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) { if (pageButton.dataset.page === "new-offer") startNewOffer(); navigate(pageButton.dataset.page); return; }
  const viewButton = event.target.closest(".offer-view");
  if (viewButton) { state.offerView = viewButton.dataset.view; renderOffers(); lucide.createIcons(); return; }
  const booking = event.target.closest(".booking-row");
  if (booking) { openBookingDrawer(booking.dataset.booking); return; }
  const type = event.target.closest(".type-card");
  if (type) { if (!state.editingId) { const previous=state.offerDraft.type; state.offerDraft.type = type.dataset.type; if (previous !== "FLIGHT" && state.offerDraft.type === "FLIGHT") { state.offerDraft.cityId=""; state.offerDraft.cityName=""; state.offerDraft.cityLatitude=""; state.offerDraft.cityLongitude=""; } renderOfferForm(); lucide.createIcons(); } return; }
  const profileTab = event.target.closest(".profile-tab");
  if (profileTab) { state.profileTab = profileTab.dataset.tab; renderProfile(); lucide.createIcons(); return; }
  const switchButton = event.target.closest(".switch");
  if (switchButton && !switchButton.disabled) switchButton.classList.toggle("on");
  if (event.target.closest("[data-close-modal]")) closeModal();
  if (event.target.closest("#clear-offer-filters")) { $("#offer-search").value = ""; $("#offer-type-filter").value = ""; $("#offer-status-filter").value = ""; $("#offer-sort").value = "recent"; renderOfferResults(); }

});

/* ---------- Offres : saisie du formulaire et actions branchées sur l’API ---------- */

function onDraftInput(event) {
  const carDropoffInput = event.target.closest("[data-car-dropoff-index]");
  if (carDropoffInput) {
    const index = Number(carDropoffInput.dataset.carDropoffIndex);
    state.offerDraft.dropoffLocations[index] = carDropoffInput.value;
    if (event.type === "input") scheduleCarDropoffSearch(index, carDropoffInput.value);
    return;
  }
  if (event.target.dataset?.trans) {
    const [locale, field] = event.target.dataset.trans.split(":");
    if (!state.offerDraft.translations) state.offerDraft.translations = { en: {}, ar: {} };
    if (!state.offerDraft.translations[locale]) state.offerDraft.translations[locale] = {};
    state.offerDraft.translations[locale][field] = event.target.value;
    return;
  }
  const availabilityInput = event.target.closest("[data-availability-index]");
  if (availabilityInput) {
    const period = state.offerDraft.availabilities[Number(availabilityInput.dataset.availabilityIndex)];
    period[availabilityInput.dataset.availabilityKey] = availabilityInput.value;
    return;
  }
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
    if (key === "cityName" && event.type === "input") scheduleCitySearch(el.value);
    if (el.dataset.flightPlace && event.type === "input") scheduleFlightPlaceSearch(el.dataset.flightPlace, el.value);
    if (el.dataset.offerPlace && event.type === "input") scheduleOfferPlaceSearch(el.dataset.offerPlace, el.value);
    if (key === "roundTrip" && event.type === "change") { $("#offer-step-content").innerHTML = offerStepContent(); lucide.createIcons(); }
  }
  updateOfferPreview();
}
document.addEventListener("input", onDraftInput);
document.addEventListener("change", onDraftInput);



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
  const langBtn = target.closest('[data-action="offer-lang"]');
  if (langBtn) {
    state.offerDraft.activeTransTab = langBtn.dataset.lang;
    $("#offer-step-content").innerHTML = offerStepContent();
    if (window.lucide) lucide.createIcons();
    return;
  }
  const addCarDropoff = target.closest("[data-add-car-dropoff]");
  if (addCarDropoff) {
    if (state.offerDraft.dropoffLocations.length >= 20) { toast("Limite atteinte", "Vous pouvez ajouter jusqu’à 20 lieux.", "error"); return; }
    state.offerDraft.dropoffLocations.push(""); state.offerDraft.dropoffSelections.push(false);
    $("#offer-step-content").innerHTML = offerStepContent(); if (window.lucide) lucide.createIcons(); return;
  }
  const removeCarDropoff = target.closest("[data-remove-car-dropoff]");
  if (removeCarDropoff) {
    const index = Number(removeCarDropoff.dataset.removeCarDropoff);
    state.offerDraft.dropoffLocations.splice(index, 1); state.offerDraft.dropoffSelections.splice(index, 1);
    if (!state.offerDraft.dropoffLocations.length) { state.offerDraft.dropoffLocations.push(""); state.offerDraft.dropoffSelections.push(false); }
    $("#offer-step-content").innerHTML = offerStepContent(); if (window.lucide) lucide.createIcons(); return;
  }
  const carDropoffChoice = target.closest("[data-car-dropoff-choice]");
  if (carDropoffChoice) {
    const index = Number(carDropoffChoice.dataset.carDropoffChoice), box = $(`#car-dropoff-suggestions-${index}`);
    const city = box?._results?.[Number(carDropoffChoice.dataset.resultIndex)];
    if (city) {
      const label = [city.name, city.admin1, city.country_code ? `(${city.country_code})` : ""].filter(Boolean).join(", ");
      state.offerDraft.dropoffLocations[index] = label; state.offerDraft.dropoffSelections[index] = true;
      const input = $(`[data-car-dropoff-index="${index}"]`); if (input) input.value = label;
      box.classList.add("hidden");
    }
    return;
  }
  const find = id => state.offers.find(o => o.id === Number(id));

  if (target.closest("#add-availability")) {
    state.offerDraft.availabilities.push({ startAt: "", endAt: "", capacity: 1 });
    $("#availability-list").innerHTML = availabilityFields(); lucide.createIcons(); return;
  }
  const removeAvailability = target.closest("[data-remove-availability]");
  if (removeAvailability) {
    state.offerDraft.availabilities.splice(Number(removeAvailability.dataset.removeAvailability), 1);
    $("#availability-list").innerHTML = availabilityFields(); lucide.createIcons(); return;
  }

  const cityChoice = target.closest("[data-city-choice]");
  if (cityChoice) {
    const box = $("#offer-city-suggestions");
    const city = box?._results?.[Number(cityChoice.dataset.cityChoice)];
    if (city) {
      state.offerDraft.cityId = "";
      state.offerDraft.cityName = city.name;
      state.offerDraft.cityLatitude = city.latitude;
      state.offerDraft.cityLongitude = city.longitude;
      const input = $("#offer-city-search");
      if (input) input.value = city.name;
      box.classList.add("hidden");
      updateOfferPreview();
    }
    return;
  }

  const flightCityChoice = target.closest("[data-flight-city-choice]");
  if (flightCityChoice) {
    const mode=flightCityChoice.dataset.flightCityChoice, box=$(`#flight-${mode}-suggestions`);
    const city=box?._results?.[Number(flightCityChoice.dataset.index)];
    if (city) {
      const label=[city.name, city.country_code ? `(${city.country_code})` : ""].filter(Boolean).join(" ");
      const key=mode === "destination" ? "arrivalAirport" : "departureAirport";
      state.offerDraft[key]=label;
      if (mode === "departure") state.offerDraft.departureSelected=true;
      const input=$(`[data-flight-place="${mode}"]`); if(input) input.value=label;
      if (mode === "destination") {
        state.offerDraft.cityId=""; state.offerDraft.cityName=city.name;
        state.offerDraft.cityLatitude=city.latitude; state.offerDraft.cityLongitude=city.longitude;
      }
      box.classList.add("hidden"); updateOfferPreview();
    }
    return;
  }

  const offerPlaceChoice = target.closest("[data-offer-place-choice]");
  if (offerPlaceChoice) {
    const mode = offerPlaceChoice.dataset.offerPlaceChoice;
    const box = $(`#offer-${mode}-suggestions`);
    const city = box?._results?.[Number(offerPlaceChoice.dataset.index)];
    if (city) {
      const key = mode === "pickup" ? "pickupLocation" : "dropoffLocation";
      const label = [city.name, city.admin1, city.country_code ? `(${city.country_code})` : ""].filter(Boolean).join(", ");
      state.offerDraft[key] = label;
      state.offerDraft[`${mode}Selected`] = true;
      const input = $(`[data-offer-place="${mode}"]`);
      if (input) input.value = label;
      box.classList.add("hidden");
      updateOfferPreview();
    }
    return;
  }

  const formSwitch = target.closest(".switch[data-f]");
  if (formSwitch) {
    state.offerDraft[formSwitch.dataset.f] = formSwitch.classList.contains("on");
    if (formSwitch.dataset.f === "allowsDifferentDropoff") {
      if (!state.offerDraft.allowsDifferentDropoff) { state.offerDraft.dropoffLocations = [""]; state.offerDraft.dropoffSelections = [false]; }
      $("#offer-step-content").innerHTML = offerStepContent();
      if (window.lucide) lucide.createIcons();
    }
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



  if (target.closest("#retry-offers")) { navigate(state.page); return; }
  if (target.closest("#empty-new-offer")) { startNewOffer(); navigate("new-offer"); return; }

  if (target.closest("#offer-previous")) {
    if (state.offerStep === 1) { startNewOffer(); navigate("offers"); }
    else { state.offerStep--; renderOfferForm(); lucide.createIcons(); }
    return;
  }
  if (target.closest("#offer-next")) {
    if(offerUploader?.isBusy())return;
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

$("#account-toggle")?.addEventListener("click", event => { event.stopPropagation(); $("#account-dropdown")?.classList.toggle("hidden"); if (typeof NotificationsUI !== "undefined") NotificationsUI.close(); });
($("#logout-button") || $("#logout"))?.addEventListener("click", () => Auth.logout());
showSupplierIdentity();
document.addEventListener("click", event => {
  if (!event.target.closest("#notification-dropdown") && !event.target.closest("#notification-toggle")) NotificationsUI.close();
  if (!event.target.closest("#account-dropdown") && !event.target.closest("#account-toggle")) $("#account-dropdown").classList.add("hidden");
});

$("#sidebar-toggle").addEventListener("click", () => {
  const collapsed = $("#sidebar").classList.toggle("collapsed");
  $("#main-shell").classList.toggle("expanded", collapsed);
  $("#sidebar-toggle").setAttribute("aria-label", collapsed ? "Déplier le menu" : "Replier le menu");
});
$$("#sidebar-nav .nav-item").forEach(item => { item.title = item.querySelector("span")?.textContent || ""; });

const requestedPage = new URLSearchParams(window.location.search).get("page") || "dashboard";
if (window.I18n) {
  I18n.init({ namespaces: ['common', 'nav', 'supplier', 'status', 'errors'] }).then(() => {
    const c = document.getElementById("supplier-i18n-container");
    if (c) {
      c.innerHTML = (window.AtlasCurrency ? AtlasCurrency.renderCurrencySwitcher() : "");
      I18n.bindLanguageSwitcher(c);
      if (window.AtlasCurrency) AtlasCurrency.bindCurrencySwitcher(c);
    }
  });
  window.addEventListener("i18n:change", () => {
    const c = document.getElementById("supplier-i18n-container");
    if (c) {
      c.innerHTML = (window.AtlasCurrency ? AtlasCurrency.renderCurrencySwitcher() : "");
      I18n.bindLanguageSwitcher(c);
      if (window.AtlasCurrency) AtlasCurrency.bindCurrencySwitcher(c);
    }
  });
}

(async function bootstrapSupplier() {
  try {
    state.supplier = await api.get("/api/auth/me");
    if (state.supplier.role !== "SUPPLIER") throw new Error("Ce compte n’est pas un compte fournisseur.");
    if (!state.supplier.supplierCategory) throw new Error("Aucune spécialité n’est affectée à ce fournisseur. Affectez-lui une catégorie depuis l’administration.");
    showSupplierIdentity();
    if (state.supplier.supplierCategory && state.offerDraft) state.offerDraft.type = state.supplier.supplierCategory;
    navigate(requestedPage in supplierPages ? requestedPage : "dashboard");
  } catch (error) {
    renderSupplierBootstrapError(error);
  }
})();

NotificationsUI.attach("#notification-toggle","#notification-dropdown");
