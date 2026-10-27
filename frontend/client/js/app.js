const me = (() => {
  const user = Auth.getUser() || { fullName: "Client" };
  const words = user.fullName.split(/\s+/).filter(Boolean);
  return {
    fullName: user.fullName,
    firstName: words[0] || "",
    initials: words.map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
  };
})();

const state = {
  sidebarCollapsed: false,
  page: "dashboard",
  offerId: null,
  payment: "card",
  filter: "Toutes",
};

const photos = {
  riad: "https://images.unsplash.com/photo-1719084198651-5ac167cb3e6e?auto=format&fit=crop&w=1200&q=85",
  medersa: "https://images.unsplash.com/photo-1570133435536-7ececf000ef6?auto=format&fit=crop&w=900&q=85",
  pool: "https://images.unsplash.com/photo-1570133435573-fcb96d98f69b?auto=format&fit=crop&w=900&q=85",
  patio: "https://images.unsplash.com/photo-1624805098931-098c0d918b34?auto=format&fit=crop&w=900&q=85",
};

const bookings = [
  { ref: "BK-2026-000123", title: "Riad Atlas – Chambre double", place: "Chefchaouen", date: "18–20 avr. 2026", total: "1 780,00 MAD", status: "Confirmée", type: "success", image: photos.riad },
  { ref: "BK-2026-000126", title: "Excursion Chefchaouen → Akchour", place: "Chefchaouen", date: "19 avr. 2026", total: "500,00 MAD", status: "En attente", type: "warning", image: photos.medersa },
  { ref: "BK-2026-000129", title: "Dacia Logan – Agadir", place: "Agadir", date: "06–09 juin 2026", total: "960,00 MAD", status: "Confirmée", type: "success", image: photos.patio },
  { ref: "BK-2026-000130", title: "Vol Casablanca → Marrakech", place: "Casablanca", date: "12 mars 2026", total: "1 250,00 MAD", status: "Terminée", type: "neutral", image: photos.pool },
];

const iconPaths = {
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/>',
  plane: '<path d="m2 16 20-8-7 7 2 6-3 1-4-5-4 2Z"/><path d="m10 17-3 4"/>',
  bed: '<path d="M2 20v-9h20v9M4 11V5h7a3 3 0 0 1 3 3v3"/><path d="M2 17h20"/>',
  car: '<path d="m5 16 1-5 2-3h8l2 3 1 5"/><path d="M3 16h18v4h-3v-2H6v2H3Z"/>',
  taxi: '<path d="M7 7h10l3 5v7H4v-7Z"/><path d="M9 7V4h6v3M4 14h16"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4Z"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  cart: '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.5 11h11l2-7H7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  ticket: '<path d="M3 6h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z"/><path d="M13 8v2M13 14v2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  shield: '<path d="M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6Z"/><path d="m8 12 3 3 5-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 3.5 2.5c-1 .4-1 1-1 2M12 17h.01"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19v2h16v-2"/>',
};

function icon(name, size = 20) {
  return `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.help}</svg>`;
}

function logo() {
  return `<button class="logo-static" data-page="accueil" aria-label="Atlas Voyage — Accueil"><img src="../images/logo.png" alt="Atlas Voyage" class="app-logo"></button>`;
}

function button(label, options = {}) {
  const { variant = "primary", iconName = "", page = "", action = "", disabled = false } = options;
  return `<button class="btn btn-${variant}" ${page ? `data-page="${page}"` : ""} ${action ? `data-action="${action}"` : ""} ${disabled ? "disabled" : ""}>${iconName ? icon(iconName, 18) : ""}<span>${label}</span></button>`;
}

function status(label, type = "success") {
  return `<span class="status ${type}"><i></i>${label}</span>`;
}

function header() {
  const categories = [["plane","Vols","FLIGHT"],["bed","Hôtels & Riads","HOTEL"],["car","Location de voiture","CAR"],["taxi","Taxi / Transferts","TAXI_TRANSFER"],["compass","Excursions","EXCURSION"]];
  return `<header>
    <div class="topbar"><div class="header-inner">
      ${logo()}
      <div class="header-actions">
        <span class="currency">MAD</span>
        <button class="icon-label" data-page="panier">${icon("cart")}<span>Panier</span>${cartBadge("i")}</button>
        <button class="round-action" data-action="notifications" aria-label="Notifications">${icon("bell")}<i class="red-count">3</i></button>
        <div class="relative">
          <button class="account" data-action="account"><span class="avatar">${me.initials}</span><span><small>Bonjour,</small><b>${me.firstName}</b></span><span>⌄</span></button>
          <div id="account-menu" class="dropdown account-menu nav-user-menu">
            <button data-page="dashboard">${icon("home",18)} Mon dashboard</button>
            <button data-page="reservations">${icon("calendar",18)} Mes réservations</button>
            <button data-page="tickets">${icon("ticket",18)} Mes tickets</button>
            <button data-page="profil">${icon("user",18)} Mon profil</button>
            <hr><button class="logout" data-action="logout">Déconnexion</button>
          </div>
        </div>
      </div>
    </div></div>
    <nav class="catnav"><div class="header-inner">${categories.map(([name,label,type]) => `<button data-action="category" data-type="${type}">${icon(name,18)}${label}</button>`).join("")}</div></nav>
  </header>`;
}

function sidebar(active) {
  const items = [["home","Vue d'ensemble","dashboard"],["calendar","Mes réservations","reservations"],["cart","Mon panier","panier"],["ticket","Mes tickets","tickets"],["bell","Notifications","dashboard"],["user","Mon profil","profil"]];
  return `<aside class="sidebar">
    <div class="side-top"><button type="button" class="side-toggle" data-action="sidebar-toggle" aria-label="${state.sidebarCollapsed ? "Déplier le menu" : "Replier le menu"}">${icon("menu", 20)}</button></div>
    <div class="side-user"><span class="avatar big">${me.initials}</span><div><b>${me.fullName}</b><small>Compte client</small></div></div>
    <div class="side-label">MON ESPACE</div>
    ${items.map(([name,label,page]) => `<button class="${active === page ? "active" : ""}" data-page="${page}" title="${label}">${icon(name,19)}<i class="side-text">${label}</i>${page === "panier" ? cartBadge("span") : ""}</button>`).join("")}
  </aside>`;
}

function shell(content, active = state.page) {
  return `${header()}<div class="client-layout static-page${state.sidebarCollapsed ? " collapsed" : ""}">${sidebar(active)}<main class="client-main">${content}</main></div>`;
}

function dashboard() {
  const rows = bookings.slice(0, 2).map((item, index) => `
    <div class="booking-row">
      <img src="${item.image}" alt="${item.title}">
      <div class="date-box"><b>${index ? "19" : "18"}</b><span>AVR</span></div>
      <div class="booking-main"><span>${item.ref}</span><b>${item.title}</b><small>${item.place} · ${item.date}</small></div>
      <div class="booking-end">${status(item.status,item.type)}<button data-page="reservation">Détails ${icon("arrow",14)}</button></div>
    </div>`).join("");
  return shell(`
    <div class="welcome"><div><span class="eyebrow">VOTRE ESPACE PERSONNEL</span><h1>Bonjour ${me.firstName}, prêt à repartir ?</h1><p>Retrouvez vos prochains voyages et gérez toutes vos réservations.</p></div>${button("Explorer les offres",{iconName:"search",page:"catalogue"})}</div>
    <div class="kpis">
      <div class="kpi"><span class="kpi-icon amber">${icon("calendar")}</span><div><small>À VENIR</small><strong>3</strong><p>réservations</p></div><span class="trend">+1 ce mois</span></div>
      <div class="kpi"><span class="kpi-icon blue">${icon("cart")}</span><div><small>TOTAL DÉPENSÉ</small><strong>8 640</strong><p>MAD cette année</p></div><div class="spark"><i></i><i></i><i></i><i></i><i></i></div></div>
      <div class="kpi status-kpi"><span class="kpi-icon green">${icon("check")}</span><div><small>RÉSERVATIONS</small><strong>8</strong><p>au total</p></div><div class="donut"><span>75%</span></div></div>
      <div class="kpi cart-kpi"><span class="kpi-icon violet">${icon("gift")}</span><div><small>MON PANIER</small><strong class="js-cart-num">${cartCount()}</strong><p>article${cartCount() > 1 ? "s" : ""} en attente</p></div><button data-page="panier">Voir ${icon("arrow",14)}</button></div>
    </div>
    <div class="dash-grid">
      <section class="card upcoming"><div class="section-head"><div><span class="eyebrow">PROCHAINS DÉPARTS</span><h2>Vos prochaines réservations</h2></div><button data-page="reservations">Tout voir ${icon("arrow",16)}</button></div><div class="booking-list">${rows}</div></section>
      <section class="card recent-notices"><div class="section-head"><div><span class="eyebrow">RESTEZ INFORMÉ</span><h2>Notifications récentes</h2></div></div>
        <div class="notification-list">
          <div><span class="notice-icon green">${icon("check",17)}</span><p><b>Réservation confirmée</b><small>Votre séjour au Riad Atlas est confirmé.</small><em>Il y a 12 min</em></p><i></i></div>
          <div><span class="notice-icon amber">${icon("calendar",17)}</span><p><b>Départ dans 2 jours</b><small>Votre voucher est prêt à être téléchargé.</small><em>Il y a 2 h</em></p><i></i></div>
          <div><span class="notice-icon blue">${icon("ticket",17)}</span><p><b>Réponse du support</b><small>Samira a répondu à votre demande.</small><em>Hier</em></p></div>
        </div><button class="all-notices" data-action="notifications">Toutes les notifications</button>
      </section>
    </div>
    <section class="card latest"><div class="section-head"><div><span class="eyebrow">HISTORIQUE</span><h2>Dernières réservations</h2></div><div class="quick"><button data-page="catalogue">${icon("search")}Rechercher</button><button data-page="tickets">${icon("ticket")}Mes tickets</button><button data-page="profil">${icon("user")}Mon profil</button></div></div>
      <table><thead><tr><th>RÉFÉRENCE</th><th>OFFRE</th><th>DATE</th><th>MONTANT</th><th>STATUT</th><th></th></tr></thead><tbody>
      ${bookings.slice(0,3).map(item => `<tr><td><b>${item.ref}</b></td><td>${item.title}</td><td>${item.date}</td><td><b>${item.total}</b></td><td>${status(item.status,item.type)}</td><td><button data-page="reservation">Voir</button></td></tr>`).join("")}
      </tbody></table>
    </section>`);
}

/* ---------- Catalogue : offres réelles (API /api/offers/search) ---------- */

const OFFER_TYPES = [
  ["HOTEL", "Hôtels & Riads", "HÔTEL", "/ nuit"],
  ["EXCURSION", "Excursions", "EXCURSION", "/ personne"],
  ["CAR", "Location de voiture", "VOITURE", "/ jour"],
  ["FLIGHT", "Vols", "VOL", "/ passager"],
  ["TAXI_TRANSFER", "Taxi / Transferts", "TAXI", "/ trajet"],
];
const OFFER_TYPE = Object.fromEntries(OFFER_TYPES.map(([key, label, tag, unit]) => [key, { label, tag, unit }]));
const PAGE_SIZE = 9;
const SORTS = [["recent", "Plus récentes"], ["price_asc", "Prix croissant"], ["price_desc", "Prix décroissant"]];

const catalog = {
  cities: [],
  cityId: "",
  types: [],
  maxPrice: null,
  payOnArrival: false,
  sort: "recent",
  page: 0,
  data: null,
  error: "",
  requestId: 0,
};

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (value) => `${Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const NO_IMAGE = "../images/zellige-vector.jpg"; // repli neutre : jamais une photo qui prétend montrer autre chose
const offerImage = (offer) => (offer.images && offer.images[0]) || NO_IMAGE;
const imageTag = (src, alt, extra = "") => `<img src="${esc(src)}" alt="${esc(alt)}" ${extra} onerror="this.onerror=null;this.src='${NO_IMAGE}'">`;
const priceCap = () => Math.max(100, Math.ceil((catalog.data?.maxPrice || 0) / 100) * 100);

function catalogue() {
  return `${header()}<main class="catalogue static-page">
    <div class="catalogue-head"><span class="eyebrow">OFFRES SÉLECTIONNÉES</span><h1>Explorez le Maroc à votre rythme</h1><p>Des séjours, activités et services proposés par nos partenaires locaux.</p>
      <div class="compact-search simple"><span>${icon("map")}<small>DESTINATION</small><select id="cat-city" data-filter="city" aria-label="Destination"></select></span>${button("Rechercher", { iconName: "search", action: "search" })}</div>
    </div>
    <div class="catalogue-body">
      <aside class="filters" id="cat-filters"></aside>
      <section class="results" id="cat-results"><div class="empty-state"><h2>Chargement des offres…</h2></div></section>
    </div>
  </main>${footer()}`;
}

function paintCityOptions() {
  const select = document.getElementById("cat-city");
  if (!select) return;
  select.innerHTML = `<option value="">Tout le Maroc</option>${catalog.cities.map((c) => `<option value="${c.id}" ${String(c.id) === String(catalog.cityId) ? "selected" : ""}>${esc(c.name)}</option>`).join("")}`;
}

function paintCatalogueFilters() {
  const aside = document.getElementById("cat-filters");
  if (!aside) return;
  const counts = catalog.data?.typeCounts || {};
  const cap = priceCap();
  const value = Math.min(catalog.maxPrice ?? cap, cap);
  aside.innerHTML = `<div><h3>Filtrer les offres</h3><button data-action="reset-filters">Réinitialiser</button></div>
    <label>TYPE D'OFFRE</label>
    ${OFFER_TYPES.map(([key, label]) => `<label class="checkline"><input type="checkbox" data-filter="type" value="${key}" ${catalog.types.includes(key) ? "checked" : ""}><span>${label}</span><small>${counts[key] ?? 0}</small></label>`).join("")}
    <hr><label>PRIX MAXIMUM</label>
    <div class="price-range"><span>0 MAD</span><b id="cat-price-label">${value.toLocaleString("fr-FR")} MAD</b></div>
    <input type="range" id="cat-price" data-filter="price" min="0" max="${cap}" step="50" value="${value}">
    <hr><label>OPTIONS</label>
    <label class="checkline"><input type="checkbox" data-filter="pay" ${catalog.payOnArrival ? "checked" : ""}><span>Paiement à l'arrivée</span></label>`;
}

function activeChips() {
  const chips = [];
  if (catalog.cityId) chips.push(["city", esc(catalog.cities.find((c) => String(c.id) === String(catalog.cityId))?.name || "Ville")]);
  catalog.types.forEach((t) => chips.push([`type:${t}`, OFFER_TYPE[t].label]));
  if (catalog.maxPrice !== null) chips.push(["price", `Jusqu'à ${catalog.maxPrice.toLocaleString("fr-FR")} MAD`]);
  if (catalog.payOnArrival) chips.push(["pay", "Paiement à l'arrivée"]);
  return chips.map(([key, label]) => `<button data-action="chip-remove" data-key="${key}">${label} ×</button>`).join("");
}

function paginationHtml(data) {
  if (data.totalPages <= 1) return "";
  const last = data.totalPages - 1;
  const pages = [...new Set([0, data.page - 1, data.page, data.page + 1, last])].filter((p) => p >= 0 && p <= last).sort((a, b) => a - b);
  const items = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push("<span>…</span>");
    items.push(`<button data-action="cat-page" data-index="${p}" class="${p === data.page ? "active" : ""}" aria-label="Page ${p + 1}">${p + 1}</button>`);
  });
  return `<div class="pagination"><button data-action="cat-page" data-index="${data.page - 1}" ${data.page === 0 ? "disabled" : ""} aria-label="Page précédente">‹</button>${items.join("")}<button data-action="cat-page" data-index="${data.page + 1}" ${data.page === last ? "disabled" : ""} aria-label="Page suivante">›</button></div>`;
}

function offerCard(offer) {
  const type = OFFER_TYPE[offer.type];
  const low = offer.stock <= 3 ? `<em class="low-stock">Plus que ${offer.stock}</em>` : "";
  return `<article class="offer-card" data-offer="${offer.id}"><div class="offer-image-static">${imageTag(offerImage(offer), offer.title)}<span>${type.tag}</span></div>
    <div class="offer-content"><small>${icon("map", 14)}${esc(offer.cityName)}</small><h3>${esc(offer.title)}</h3><div class="rating">${low}${offer.allowsPayOnArrival ? '<span class="pay-tag">Paiement à l\'arrivée</span>' : ""}</div><hr>
      <div><span>À partir de <b>${money(offer.basePrice)}</b><small>${type.unit}</small></span><button data-action="open-offer" data-id="${offer.id}" aria-label="Voir ${esc(offer.title)}">${icon("arrow")}</button></div></div></article>`;
}

function paintCatalogueResults() {
  const box = document.getElementById("cat-results");
  if (!box) return;
  if (catalog.error) {
    box.innerHTML = `<div class="empty-state"><h2>Impossible de charger les offres</h2><p>${esc(catalog.error)}</p>${button("Réessayer", { action: "search" })}</div>`;
    return;
  }
  const data = catalog.data;
  if (!data) return;
  const total = data.totalElements;
  box.innerHTML = `<div class="results-head"><div><b>${total} offre${total > 1 ? "s" : ""} trouvée${total > 1 ? "s" : ""}</b><div class="chips">${activeChips()}</div></div>
      <select data-filter="sort" aria-label="Trier">${SORTS.map(([key, label]) => `<option value="${key}" ${catalog.sort === key ? "selected" : ""}>${label}</option>`).join("")}</select></div>
    ${total === 0
      ? `<div class="empty-state"><h2>Aucune offre ne correspond</h2><p>Essayez une autre destination ou élargissez vos filtres.</p>${button("Réinitialiser les filtres", { variant: "outline", action: "reset-filters" })}</div>`
      : `<div class="offer-grid">${data.content.map(offerCard).join("")}</div>${paginationHtml(data)}`}`;
}

async function loadCatalogue() {
  const request = ++catalog.requestId;
  const query = new URLSearchParams({ page: catalog.page, size: PAGE_SIZE, sort: catalog.sort });
  if (catalog.cityId) query.set("cityId", catalog.cityId);
  if (catalog.types.length) query.set("types", catalog.types.join(","));
  if (catalog.maxPrice !== null) query.set("maxPrice", catalog.maxPrice);
  if (catalog.payOnArrival) query.set("payOnArrival", "true");
  try {
    const data = await api.get(`/api/offers/search?${query}`);
    if (request !== catalog.requestId) return;
    catalog.data = data;
    catalog.error = "";
  } catch (err) {
    if (request !== catalog.requestId) return;
    catalog.error = err.message === "Failed to fetch" ? "Le serveur est injoignable. Vérifiez que le backend est démarré." : err.message;
  }
  paintCatalogueFilters();
  paintCatalogueResults();
}

async function initCatalogue() {
  paintCityOptions();
  paintCatalogueFilters();
  if (!catalog.cities.length) {
    try {
      catalog.cities = await api.get("/api/cities");
      paintCityOptions();
    } catch {
      /* la liste des villes est facultative : le catalogue reste utilisable */
    }
  }
  await loadCatalogue();
}

function setCatalogueFilter(key, value) {
  catalog.page = 0;
  if (key === "city") catalog.cityId = value;
  if (key === "sort") catalog.sort = value;
  if (key === "pay") catalog.payOnArrival = value;
  if (key === "price") catalog.maxPrice = Number(value) >= priceCap() ? null : Number(value);
  if (key === "type") {
    catalog.types = catalog.types.includes(value) ? catalog.types.filter((t) => t !== value) : [...catalog.types, value];
  }
  loadCatalogue();
}

function resetCatalogueFilters() {
  Object.assign(catalog, { cityId: "", types: [], maxPrice: null, payOnArrival: false, sort: "recent", page: 0 });
  paintCityOptions();
  loadCatalogue();
}

/* ---------- Détail d'une offre ---------- */

const detailState = { offer: null, error: "", quantity: 1 };

function offerDetail() {
  return `${header()}<main class="static-page offer-page"><div id="offer-detail"><div class="empty-state"><h2>Chargement de l'offre…</h2></div></div></main>${footer()}`;
}

const dateTime = (iso) => (iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—");
const yesNo = (value) => (value ? "Oui" : "Non");

function offerFacts(o) {
  const rows = {
    HOTEL: [["Classement", "★".repeat(o.stars || 0) || "—"], ["Type de chambre", o.roomType], ["Adresse", o.address]],
    FLIGHT: [["Compagnie", o.airline], ["N° de vol", o.flightNumber], ["Trajet", `${o.departureAirport || "—"} → ${o.arrivalAirport || "—"}`], ["Départ", dateTime(o.departureDateTime)], ["Arrivée", dateTime(o.arrivalDateTime)]],
    CAR: [["Marque", [o.brand, o.model].filter(Boolean).join(" ")], ["Boîte de vitesses", o.transmission], ["Places", o.seats]],
    TAXI_TRANSFER: [["Prise en charge", o.pickupLocation], ["Dépose", o.dropoffLocation], ["Véhicule", o.vehicleType]],
    EXCURSION: [["Durée", o.durationHours ? `${o.durationHours} h` : "—"], ["Guide inclus", yesNo(o.includesGuide)], ["Transport inclus", yesNo(o.includesTransport)], ["Itinéraire", o.itinerary]],
  }[o.type] || [];
  return rows.filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join("");
}

function paintOfferDetail() {
  const box = document.getElementById("offer-detail");
  if (!box) return;
  if (detailState.error) {
    box.innerHTML = `<div class="empty-state"><h2>Offre introuvable</h2><p>${esc(detailState.error)}</p>${button("Retour au catalogue", { variant: "outline", page: "catalogue" })}</div>`;
    return;
  }
  const o = detailState.offer;
  if (!o) return;
  const images = o.images?.length ? o.images : [NO_IMAGE];
  const type = OFFER_TYPE[o.type];
  const available = o.active && o.stock > 0;
  box.innerHTML = `<button class="back" data-page="catalogue">‹ Retour au catalogue</button>
    <div class="offer-layout">
      <section class="offer-gallery"><div class="offer-main-image">${imageTag(images[0], o.title, 'id="gallery-main"')}<span>${type.tag}</span></div>
        ${images.length > 1 ? `<div class="offer-thumbs">${images.map((src, i) => `<button data-action="gallery" data-src="${esc(src)}" class="${i === 0 ? "active" : ""}" aria-label="Photo ${i + 1}">${imageTag(src, "")}</button>`).join("")}</div>` : ""}
        ${o.description ? `<h2>Description</h2><p class="offer-description">${esc(o.description)}</p>` : ""}
        <h2>Détails</h2><dl class="offer-facts">${offerFacts(o)}</dl>
      </section>
      <aside class="offer-buy card"><small>${icon("map", 14)}${esc(o.cityName)}</small><h1>${esc(o.title)}</h1>
        <div class="offer-price">À partir de <b>${money(o.basePrice)}</b><small>${type.unit}</small></div>
        <ul class="offer-badges">${available ? (o.stock <= 3 ? `<li class="warn">Plus que ${o.stock} disponible${o.stock > 1 ? "s" : ""}</li>` : '<li class="ok">Disponible</li>') : '<li class="ko">Indisponible</li>'}${o.allowsPayOnArrival ? "<li>Paiement à l'arrivée possible</li>" : "<li>Paiement en ligne</li>"}</ul>
        <p class="offer-supplier">Proposé par <b>${esc(o.supplierName)}</b></p>
        ${available ? `<div class="quantity"><button data-action="detail-qty" data-delta="-1" aria-label="Diminuer la quantité">${icon("minus", 15)}</button><b id="detail-qty">${detailState.quantity}</b><button data-action="detail-qty" data-delta="1" aria-label="Augmenter la quantité">${icon("plus", 15)}</button><span>${type.unit.replace("/ ", "")}${detailState.quantity > 1 ? "s" : ""}</span></div>` : ""}
        ${button("Ajouter au panier", { iconName: "cart", action: "add-to-cart", disabled: !available })}
        <p class="offer-note" id="offer-note">${available ? "Le stock est vérifié à l'ajout puis au paiement." : "Cette offre ne peut pas être ajoutée au panier."}</p></aside>
    </div>`;
}

async function loadOfferDetail() {
  detailState.offer = null;
  detailState.error = "";
  detailState.quantity = 1;
  try {
    detailState.offer = await api.get(`/api/offers/${state.offerId}`);
  } catch (err) {
    detailState.error = err.message === "Failed to fetch" ? "Le serveur est injoignable." : err.message;
  }
  paintOfferDetail();
}

function openOffer(id) {
  state.offerId = id;
  render("offre");
}

/* ---------- Panier (API /api/cart) ---------- */

const cartState = { data: null, error: "", busy: false };

const netError = (err) => (err.message === "Failed to fetch" ? "Le serveur est injoignable. Vérifiez que le backend est démarré." : err.message);
const cartCount = () => cartState.data?.itemCount ?? 0;
const cartBadge = (tag) => `<${tag} class="js-cart-count" style="${cartCount() ? "" : "display:none"}">${cartCount()}</${tag}>`;

function paintCartBadges() {
  const count = cartCount();
  document.querySelectorAll(".js-cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count ? "" : "none";
  });
  document.querySelectorAll(".js-cart-num").forEach((el) => { el.textContent = count; });
}

/** Exécute un appel qui renvoie le panier à jour ; renvoie true en cas de succès. */
async function cartCall(request, successMessage) {
  if (cartState.busy) return false;
  cartState.busy = true;
  let ok = false;
  try {
    cartState.data = await request();
    cartState.error = "";
    ok = true;
    if (successMessage) toast(successMessage, "success");
    if (cartState.data.promoWarning) toast(cartState.data.promoWarning, "error");
  } catch (err) {
    toast(netError(err), "error");
  } finally {
    cartState.busy = false;
  }
  paintCartBadges();
  if (state.page === "panier") paintCart();
  return ok;
}

async function loadCart() {
  try {
    cartState.data = await api.get("/api/cart");
    cartState.error = "";
    if (cartState.data.promoWarning) toast(cartState.data.promoWarning, "error");
  } catch (err) {
    cartState.error = netError(err);
  }
  paintCartBadges();
  if (state.page === "panier") paintCart();
}

function cartLine(line) {
  const type = line.kind === "BUNDLE" ? { tag: "BUNDLE" } : OFFER_TYPE[line.type];
  const canIncrease = line.available && line.quantity < line.stock;
  return `<div class="cart-line card" data-line="${line.id}">${imageTag(line.image || NO_IMAGE, line.title)}
    <div class="line-main"><div><span class="type-pill">${type.tag}</span>${line.available ? status("Disponible") : status(line.unavailableReason, "warning")}</div>
      <h3>${esc(line.title)}</h3>
      <p>${icon("map", 15)} ${esc(line.cityName || "—")}${line.allowsPayOnArrival ? ' · <span class="pay-tag">Paiement à l\'arrivée</span>' : ""}</p>
      <div class="quantity"><button data-action="cart-qty" data-id="${line.id}" data-qty="${line.quantity - 1}" ${line.quantity <= 1 ? "disabled" : ""} aria-label="Diminuer la quantité">${icon("minus", 15)}</button><b>${line.quantity}</b><button data-action="cart-qty" data-id="${line.id}" data-qty="${line.quantity + 1}" ${canIncrease ? "" : "disabled"} aria-label="Augmenter la quantité">${icon("plus", 15)}</button></div>
      <div class="line-actions"><button class="text-danger" data-action="cart-remove" data-id="${line.id}" data-title="${esc(line.title)}">Supprimer</button></div></div>
    <div class="line-price"><small>${money(line.unitPrice)} / unité</small><b>${money(line.lineTotal)}</b></div></div>`;
}

function cartSummary(c) {
  const promo = c.promo;
  return `<aside class="summary card"><h2>Récapitulatif</h2>
    <div class="sum-row"><span>Sous-total</span><b>${money(c.subtotal)}</b></div>
    <div class="promo"><label for="promo-input">CODE PROMO</label>
      <div><input id="promo-input" placeholder="Votre code" value="${esc(promo ? promo.code : "")}" ${promo ? "disabled" : ""} maxlength="30">${promo ? '<button data-action="promo-remove">Retirer</button>' : '<button data-action="promo-apply">Appliquer</button>'}</div>
      ${promo ? `<p>${icon("check", 14)} Code ${esc(promo.code)} appliqué</p>` : ""}</div>
    ${promo ? `<div class="sum-row green"><span>Remise (${promo.discountType === "PERCENTAGE" ? `–${Number(promo.value)} %` : "montant fixe"})</span><b>–${money(c.discount)}</b></div>` : ""}
    <hr><div class="total"><span>Total à payer<small>Taxes incluses</small></span><b>${money(c.total)}</b></div>
    ${button("Passer au paiement", { disabled: true })}
    <p class="offer-note">${c.hasUnavailableItems ? "Retirez ou ajustez les articles indisponibles avant de payer." : "Le paiement sera disponible prochainement."}</p>
    <p class="secure">${icon("shield", 17)} ${c.payOnArrivalAllowed ? "Paiement à l'arrivée possible pour ce panier" : "Paiement en ligne obligatoire pour ce panier"}</p></aside>`;
}

function paintCart() {
  const box = document.getElementById("cart-content");
  if (!box) return;
  const c = cartState.data;
  if (!c) {
    box.innerHTML = cartState.error
      ? `<div class="empty-state"><h2>Impossible de charger le panier</h2><p>${esc(cartState.error)}</p>${button("Réessayer", { action: "reload-cart" })}</div>`
      : '<div class="empty-state"><h2>Chargement du panier…</h2></div>';
    return;
  }
  const title = `<div class="page-title"><div><span class="eyebrow">VOTRE SÉLECTION</span><h1>Mon panier <small>${c.itemCount} article${c.itemCount > 1 ? "s" : ""}</small></h1><p>Vérifiez les détails avant de poursuivre votre réservation.</p></div>${c.itemCount ? `<button class="text-danger" data-action="clear-cart">${icon("trash")}Vider le panier</button>` : ""}</div>`;
  if (!c.items.length) {
    box.innerHTML = `${title}<div class="empty-state card"><h2>Votre panier est vide</h2><p>Parcourez le catalogue pour trouver votre prochaine escapade.</p>${button("Découvrir les offres", { iconName: "search", page: "catalogue" })}</div>`;
    return;
  }
  box.innerHTML = `${title}<div class="cart-layout"><section>
      ${c.hasUnavailableItems ? '<div class="reassurance" style="background:#FFF4E5;color:#9A5B00;margin-bottom:14px">Certains articles ne sont plus disponibles dans la quantité choisie.</div>' : ""}
      ${c.items.map(cartLine).join("")}
      <div class="reassurance"><span>${icon("check")}Annulation gratuite jusqu'à 48 h avant</span><span>${icon("shield")}Réservation protégée</span></div>
    </section>${cartSummary(c)}</div>`;
}

function cart() {
  return shell('<div id="cart-content"></div>', "panier");
}

function checkout() {
  const cardActive = state.payment === "card";
  return shell(`
    <div class="checkout-title"><button data-page="panier">‹ Retour au panier</button><h1>Finaliser ma réservation</h1><div class="stepper"><div class="done"><span>${icon("check",15)}</span><b>Récapitulatif</b></div><i></i><div class="active"><span>2</span><b>Paiement</b></div><i></i><div><span>3</span><b>Confirmation</b></div></div></div>
    <div class="checkout-layout"><section class="payment card"><span class="eyebrow">ÉTAPE 2 SUR 3</span><h2>Comment souhaitez-vous payer ?</h2><p>Choisissez votre mode de paiement. Vos données sont sécurisées.</p>
      <div class="method-grid"><button class="${cardActive ? "active" : ""}" data-action="pay-card"><i></i><span class="method-icon">▣</span><b>Payer maintenant</b><small>Par carte bancaire</small><em>Recommandé</em></button><button class="${!cardActive ? "active" : ""}" data-action="pay-later"><i></i><span class="method-icon">⌂</span><b>Payer à l'arrivée</b><small>Directement sur place</small></button></div>
      ${cardActive ? `<div class="card-form"><div class="test-info">${icon("shield")}<span><b>Paiement simulé</b><small>Carte test : 4242 4242 4242 4242 · date future · CVV 123</small></span></div><label>TITULAIRE DE LA CARTE<input value="SARAH BENALI"></label><label>NUMÉRO DE CARTE<div class="input-icon"><input id="card-number" value="4242 4242 4242 4242" maxlength="19"><span>VISA</span></div><small id="card-error" class="field-error"></small></label><div class="form-row"><label>EXPIRATION<input value="12/28" maxlength="5"></label><label>CVV<input value="123" maxlength="3"></label></div></div>` : `<div class="later-info">${icon("check")}<div><b>Aucun paiement aujourd'hui</b><p>Vous réglerez le montant directement auprès de nos partenaires à votre arrivée.</p></div></div>`}
      ${button(cardActive ? "Payer 2 052,00 MAD" : "Confirmer la réservation",{action:"confirm-payment"})}<small class="terms">En confirmant, vous acceptez nos conditions générales de vente.</small>
    </section>
    <aside class="summary card"><h2>Votre réservation</h2><div class="mini-line"><img src="${photos.riad}" alt=""><span><b>Riad Atlas</b><small>18–20 avr. · 2 nuits</small></span><b>1 780,00</b></div><div class="mini-line"><img src="${photos.medersa}" alt=""><span><b>Excursion Akchour</b><small>19 avr. · 2 personnes</small></span><b>500,00</b></div><hr><div class="sum-row"><span>Sous-total</span><b>2 280,00 MAD</b></div><div class="sum-row green"><span>BIENVENUE10</span><b>–228,00 MAD</b></div><hr><div class="total"><span>Total</span><b>2 052,00 <small>MAD</small></b></div><div class="summary-note">${icon("check")}Annulation gratuite jusqu'au 16/04/2026</div></aside>
    </div>`, "panier");
}

function confirmation() {
  return shell(`<div class="confirmation card"><div class="success-check">${icon("check",36)}</div><span class="eyebrow">RÉSERVATION CONFIRMÉE</span><h1>Votre voyage commence ici !</h1><p>Merci Sarah. Votre réservation a bien été enregistrée et un email de confirmation vous a été envoyé.</p><div class="reference"><span>RÉFÉRENCE DE RÉSERVATION<b>BK-2026-000123</b></span><button data-action="copy-ref">Copier</button>${status("Confirmée")}</div><div class="confirm-grid"><div><img src="${photos.riad}" alt=""><span><b>Riad Atlas – Chambre double</b><small>Chefchaouen · 18–20 avril 2026</small></span></div><div><img src="${photos.medersa}" alt=""><span><b>Excursion Chefchaouen → Akchour</b><small>19 avril 2026 · 2 personnes</small></span></div></div><div class="paid"><span>Montant payé</span><b>2 052,00 MAD</b><small>Carte se terminant par •••• 4242</small></div><div class="next"><b>Et maintenant ?</b><span><i>1</i>Consultez l'email</span><span><i>2</i>Téléchargez le voucher</span><span><i>3</i>Profitez du Maroc</span></div><div class="confirm-actions">${button("Voir ma réservation",{page:"reservation"})}${button("Imprimer le voucher",{variant:"outline",iconName:"download",action:"print"})}<button data-page="catalogue">Continuer mes recherches</button></div></div>`, "reservations");
}

function reservations() {
  return shell(`<div class="page-title"><div><span class="eyebrow">VOS VOYAGES</span><h1>Mes réservations</h1><p>Consultez et gérez l'ensemble de vos réservations.</p></div>${button("Nouvelle recherche",{iconName:"search",page:"catalogue"})}</div><div class="tabs">${["Toutes","En attente","Confirmées","Terminées","Annulées"].map((label,index) => `<button class="${index === 0 ? "active" : ""}" data-action="booking-filter">${label} (${[8,1,3,3,1][index]})</button>`).join("")}</div><section class="card booking-table"><table><thead><tr><th>RÉFÉRENCE</th><th>RÉSERVATION</th><th>DATES</th><th>PAIEMENT</th><th>TOTAL</th><th>STATUT</th><th></th></tr></thead><tbody>${bookings.map(item => `<tr><td><b>${item.ref}</b><small>Créée le 04/02/2026</small></td><td><b>${item.title}</b><small>${item.place}</small></td><td>${item.date}</td><td><span class="paid-pill">Payé</span></td><td><b>${item.total}</b></td><td>${status(item.status,item.type)}</td><td><button data-page="reservation">Voir ${icon("arrow",14)}</button></td></tr>`).join("")}</tbody></table></section>`, "reservations");
}

function reservation() {
  return shell(`<button class="back" data-page="reservations">‹ Retour à mes réservations</button><div class="reservation-head"><div><span>RÉSERVATION</span><h1>BK-2026-000123</h1><p>Créée le 04/02/2026 à 14:32</p></div>${status("Confirmée")}</div><div class="timeline card">${["Créée","Paiement reçu","Confirmée","Terminée"].map((label,index) => `<div class="${index < 3 ? "done" : ""}"><span>${index < 3 ? icon("check",14) : "4"}</span><b>${label}</b><small>${index === 0 ? "04/02/2026" : index === 1 ? "04/02/2026" : index === 2 ? "05/02/2026" : "Après le séjour"}</small>${index < 3 ? "<i></i>" : ""}</div>`).join("")}</div><div class="detail-layout"><section><div class="card detail-card"><h2>Détails de la réservation</h2>${bookings.slice(0,2).map((item,index) => `<div class="detail-line"><img src="${item.image}" alt="${item.title}"><div><span>${index ? "EXCURSION" : "HÔTEL"}</span><h3>${item.title}</h3><p>${icon("calendar",15)}${item.date}</p><small>${index ? "2 personnes · Guide francophone" : "2 nuits · 1 chambre · 2 adultes"}</small></div><b>${item.total}</b></div>`).join("")}</div><div class="card logistics"><h2>Informations utiles</h2><div><span>${icon("map")}</span><p><b>Point de rendez-vous</b><small>Place Outa El Hammam, Chefchaouen</small></p></div><div><span>${icon("help")}</span><p><b>Besoin d'aide ?</b><small>Notre équipe locale est disponible 7j/7.</small></p><button data-page="tickets">Contacter le support</button></div></div></section><aside class="card invoice"><h2>Récapitulatif</h2><div><span>Sous-total</span><b>2 280,00 MAD</b></div><div class="green"><span>BIENVENUE10 (–10 %)</span><b>–228,00 MAD</b></div><hr><div class="invoice-total"><span>Total payé</span><b>2 052,00 MAD</b></div><div class="payment-info">${icon("check")}<span><b>Paiement reçu</b><small>Visa •••• 4242 · 04/02/2026</small></span></div>${button("Télécharger le voucher",{variant:"outline",iconName:"download",action:"print"})}<button class="cancel-link" data-action="cancel-booking">Annuler la réservation</button><small>Annulation gratuite jusqu'au 16/04/2026.</small></aside></div>`, "reservations");
}

function tickets() {
  const data = [["Modification de l'heure de transfert","RÉSERVATION","En cours","Aujourd'hui à 10:42"],["Question sur le remboursement","PAIEMENT","Résolu","12/02/2026 à 16:20"],["Bagages inclus pour le vol AT 412","AUTRE","Fermé","02/02/2026 à 09:15"]];
  return shell(`<div class="page-title"><div><span class="eyebrow">NOUS SOMMES LÀ</span><h1>Mes tickets</h1><p>Échangez directement avec notre équipe locale.</p></div>${button("Nouveau ticket",{iconName:"plus",action:"new-ticket"})}</div><section class="card tickets"><div class="ticket-head"><h2>Demandes récentes</h2><select><option>Tous les statuts</option></select></div>${data.map((item,index) => `<button data-action="open-ticket"><span class="ticket-icon">${icon("ticket")}</span><span><small>${item[1]}</small><b>${item[0]}</b><em>Ticket #TK-2026-00${42-index}</em></span>${status(item[2],index === 0 ? "warning" : "neutral")}<span>Dernière activité<b>${item[3]}</b></span>${icon("arrow")}</button>`).join("")}</section>`, "tickets");
}

function profile() {
  return shell(`<div class="page-title"><div><span class="eyebrow">VOTRE COMPTE</span><h1>Mon profil</h1><p>Gérez vos informations personnelles et votre sécurité.</p></div></div><div class="profile-layout"><section class="card profile-card"><div class="tabs"><button class="active">Informations</button><button>Sécurité</button></div><div class="profile-avatar"><span class="avatar big">SB</span><div><b>Photo de profil</b><small>JPG ou PNG, 2 Mo maximum</small><button data-action="photo">Modifier la photo</button></div></div><div class="form-grid"><label>PRÉNOM<input value="Sarah"></label><label>NOM<input value="Benali"></label><label>ADRESSE EMAIL<div class="input-icon"><input value="sarah.benali@example.com" disabled><span>⌑</span></div><small>L'adresse email ne peut pas être modifiée.</small></label><label>TÉLÉPHONE<input value="+212 6 12 34 56 78"></label><label>PAYS<select><option>Maroc</option></select></label></div>${button("Enregistrer les modifications",{action:"save-profile"})}</section><aside class="card profile-side"><span class="kpi-icon amber">${icon("shield")}</span><h3>Votre compte est sécurisé</h3><p>Dernière connexion le 18/02/2026 à 09:42 depuis Casablanca.</p><hr><b>Besoin de modifier votre email ?</b><p>Contactez notre support avec une pièce justificative.</p><button data-page="tickets">Contacter le support ${icon("arrow",14)}</button></aside></div>`, "profil");
}

function home() {
  return `${header()}<main class="static-page"><section class="hero" style="background-image:linear-gradient(90deg,rgba(8,27,69,.89),rgba(11,42,107,.42)),url('${photos.riad}')"><div class="hero-inner"><span class="eyebrow">L'ÉVASION COMMENCE ICI</span><h1>Le Maroc vous attend.<br>Vivez-le pleinement.</h1><p>Des expériences choisies avec soin, du vol jusqu'au dernier souvenir.</p><div class="searchbar"><button>${icon("map")}<span><small>Ville</small><b>Où allez-vous ?</b></span></button><button>${icon("calendar")}<span><small>Date de départ</small><b>18/04/2026</b></span></button><button>${icon("calendar")}<span><small>Date de retour</small><b>20/04/2026</b></span></button><button>${icon("user")}<span><small>Voyageurs</small><b>2 adultes</b></span></button>${button("Rechercher",{iconName:"search",page:"catalogue"})}</div><div class="hero-trust"><span>${icon("shield")}Paiement sécurisé</span><span>${icon("check")}Annulation gratuite</span><span>${icon("help")}Support local 7j/7</span></div></div></section><section class="home-section"><span class="eyebrow">EXPLOREZ LE ROYAUME</span><h2>Une façon unique de voyager au Maroc</h2><div class="feature-grid">${[["bed","Hôtels & Riads"],["plane","Vols"],["car","Voitures"],["taxi","Transferts"],["compass","Excursions"]].map(([name,label]) => `<button data-page="catalogue"><span>${icon(name)}</span><b>${label}</b><small>Des expériences authentiques sélectionnées avec soin.</small><em>Découvrir ${icon("arrow",14)}</em></button>`).join("")}</div></section><section class="home-section soft"><div class="section-title"><div><span class="eyebrow">NOS INCONTOURNABLES</span><h2>Villes populaires</h2></div><button data-page="catalogue">Explorer toutes les offres ${icon("arrow",17)}</button></div><div class="city-grid">${[[photos.medersa,"Marrakech","490,00"],[photos.pool,"Chefchaouen","250,00"],[photos.patio,"Fès","390,00"]].map(([image,title,price]) => `<button style="background-image:linear-gradient(0deg,rgba(8,27,69,.82),transparent 65%),url('${image}')" data-page="catalogue"><span><b>${title}</b><small>À partir de ${price} MAD</small></span><i>${icon("arrow")}</i></button>`).join("")}</div></section></main>${footer()}`;
}

function footer() {
  return `<footer><div>${logo()}<p>Le Maroc, à votre manière.</p></div><div><b>EXPLORER</b><button data-page="catalogue">Découvrir les offres</button><button data-page="panier">Mon panier</button><button data-page="reservations">Mes réservations</button></div><div><b>ATLAS VOYAGE</b><button>À propos</button><button>Centre d'aide</button><button>Conditions générales</button></div><hr><small>© 2026 Atlas Voyage · Créé avec hospitalité au Maroc</small></footer>`;
}

const views = { dashboard, catalogue, offre: offerDetail, panier: cart, checkout, confirmation, reservations, reservation, tickets, profil: profile };

/** L’accueil public reste sur accueil.html (hors SPA client). */
const externalPages = { accueil: "../accueil.html" };

function navigatePage(page) {
  if (externalPages[page]) {
    window.location.href = externalPages[page];
    return;
  }
  render(page);
}

function render(page = state.page) {
  if (!views[page]) page = "dashboard";
  state.page = page;
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  if (page === "offre" && state.offerId) params.set("id", state.offerId); else params.delete("id");
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  document.getElementById("app").innerHTML = (views[page] || dashboard)();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (page === "catalogue") initCatalogue();
  if (page === "offre") loadOfferDetail();
  if (page === "panier") paintCart();
  loadCart();
}

function toast(message, type = "") {
  const element = document.getElementById("toast");
  element.textContent = message;
  element.className = `static-toast show ${type}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.className = "static-toast", 2600);
}

function modal(title, message, confirmLabel, callback) {
  const wrapper = document.createElement("div");
  wrapper.className = "html-modal";
  wrapper.innerHTML = `<div><h2>${title}</h2><p>${message}</p><div class="modal-actions">${button("Annuler",{variant:"outline",action:"close-modal"})}${button(confirmLabel,{action:"modal-confirm"})}</div></div>`;
  document.body.appendChild(wrapper);
  wrapper.querySelector('[data-action="close-modal"]').onclick = () => wrapper.remove();
  wrapper.querySelector('[data-action="modal-confirm"]').onclick = () => { wrapper.remove(); callback(); };
}

document.addEventListener("click", (event) => {
  const card = event.target.closest("[data-offer]");
  if (card && !event.target.closest("button")) {
    openOffer(card.dataset.offer);
    return;
  }
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.page) {
    navigatePage(target.dataset.page);
    return;
  }
  const action = target.dataset.action;
  if (!action) return;
  if (action === "sidebar-toggle") {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    document.querySelector(".client-layout")?.classList.toggle("collapsed", state.sidebarCollapsed);
    target.setAttribute("aria-label", state.sidebarCollapsed ? "Déplier le menu" : "Replier le menu");
  }
  if (action === "account") document.getElementById("account-menu")?.classList.toggle("open");
  if (action === "notifications") toast("3 notifications récentes, dont 2 non lues.");
  if (action === "detail-qty") {
    const max = detailState.offer?.stock ?? 1;
    detailState.quantity = Math.min(Math.max(1, detailState.quantity + Number(target.dataset.delta)), max);
    document.getElementById("detail-qty").textContent = detailState.quantity;
  }
  if (action === "add-to-cart") {
    const offer = detailState.offer;
    cartCall(() => api.post("/api/cart/items", { offerId: offer.id, quantity: detailState.quantity }), `« ${offer.title} » ajouté au panier.`).then((ok) => {
      const note = document.getElementById("offer-note");
      if (ok && note) note.innerHTML = `${icon("check", 12)} Dans votre panier · <button class="link-btn" data-page="panier">Voir le panier</button>`;
    });
  }
  if (action === "reload-cart") loadCart();
  if (action === "cart-qty") cartCall(() => api.put(`/api/cart/items/${target.dataset.id}`, { quantity: Number(target.dataset.qty) }));
  if (action === "promo-apply") {
    const code = document.getElementById("promo-input")?.value.trim();
    if (!code) toast("Saisissez un code promo.", "error");
    else cartCall(() => api.post("/api/cart/promo", { code }), "Code promo appliqué.");
  }
  if (action === "promo-remove") cartCall(() => api.delete("/api/cart/promo"), "Code promo retiré.");
  if (action === "pay-card") { state.payment = "card"; render("checkout"); }
  if (action === "pay-later") { state.payment = "later"; render("checkout"); }
  if (action === "confirm-payment") {
    target.disabled = true;
    target.querySelector("span").textContent = "Traitement en cours…";
    setTimeout(() => render("confirmation"), 700);
  }
  if (action === "copy-ref") {
    navigator.clipboard?.writeText("BK-2026-000123");
    toast("Référence copiée.", "success");
  }
  if (action === "print") window.print();
  if (action === "save-profile") toast("Vos informations ont été enregistrées.", "success");
  if (action === "favorite") { target.textContent = target.textContent === "♥" ? "♡" : "♥"; toast("Liste de favoris mise à jour."); }
  if (action === "reset-filters") resetCatalogueFilters();
  if (action === "search") { catalog.page = 0; loadCatalogue(); }
  if (action === "open-offer") openOffer(target.dataset.id);
  if (action === "cat-page") {
    catalog.page = Number(target.dataset.index);
    loadCatalogue().then(() => document.querySelector(".catalogue-body")?.scrollIntoView({ behavior: "smooth" }));
  }
  if (action === "category") {
    catalog.types = [target.dataset.type];
    catalog.page = 0;
    render("catalogue");
  }
  if (action === "chip-remove") {
    const key = target.dataset.key;
    if (key === "city") { catalog.cityId = ""; paintCityOptions(); setCatalogueFilter("city", ""); }
    else if (key === "price") setCatalogueFilter("price", priceCap());
    else if (key === "pay") setCatalogueFilter("pay", false);
    else setCatalogueFilter("type", key.split(":")[1]);
  }
  if (action === "gallery") {
    const main = document.getElementById("gallery-main");
    if (main) main.src = target.dataset.src;
    document.querySelectorAll(".offer-thumbs button").forEach((b) => b.classList.toggle("active", b === target));
  }
  if (action === "cart-remove") modal("Retirer cet article ?", `« ${esc(target.dataset.title)} » sera supprimé de votre panier.`, "Retirer", () => cartCall(() => api.delete(`/api/cart/items/${target.dataset.id}`), "Article retiré du panier."));
  if (action === "clear-cart") modal("Vider le panier ?", "Tous les articles seront retirés de votre panier.", "Vider le panier", () => cartCall(() => api.delete("/api/cart"), "Votre panier est maintenant vide."));
  if (action === "cancel-booking") modal("Annuler la réservation ?", "Vous serez remboursé à 100 %, soit 2 052,00 MAD.", "Confirmer l'annulation", () => toast("Réservation annulée. Le remboursement est en cours.", "success"));
  if (action === "new-ticket") toast("Le formulaire de création de ticket est prêt.");
  if (action === "open-ticket") toast("Conversation avec le support ouverte.");
  if (action === "photo") toast("Sélectionnez une photo JPG ou PNG de moins de 2 Mo.");
  if (action === "logout") Auth.logout();
});

document.addEventListener("change", (event) => {
  const filter = event.target.dataset?.filter;
  if (!filter) return;
  if (filter === "type") setCatalogueFilter("type", event.target.value);
  else if (filter === "pay") setCatalogueFilter("pay", event.target.checked);
  else setCatalogueFilter(filter, event.target.value);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.id === "promo-input" && !event.target.disabled) {
    document.querySelector('[data-action="promo-apply"]')?.click();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "cat-price") {
    document.getElementById("cat-price-label").textContent = `${Number(event.target.value).toLocaleString("fr-FR")} MAD`;
  }
  if (event.target.id === "card-number") {
    let value = event.target.value.replace(/\D/g, "").slice(0, 16);
    event.target.value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    const error = document.getElementById("card-error");
    if (error) error.textContent = value.length > 0 && value.length < 16 ? "Le numéro doit contenir 16 chiffres." : "";
  }
});

state.offerId = new URLSearchParams(window.location.search).get("id");
const initialPage = new URLSearchParams(window.location.search).get("page") || "dashboard";
navigatePage(initialPage in views || initialPage in externalPages ? initialPage : "dashboard");
