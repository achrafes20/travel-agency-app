const root = "./";
const apiBase = () => window.APP_CONFIG?.apiBase ?? "http://localhost:8080";
document.documentElement.lang = "fr";
const demoData = [
  {
    id: "chefchaouen",
    city: "Chefchaouen",
    title: "Dar Azure Boutique Riad",
    type: "Hôtels & Riads",
    district: "Médina",
    stars: 4,
    rating: "9,4",
    price: 890,
    img: "images/chefchaouen.jpg",
    desc: "Un havre de paix au cœur des ruelles bleues, avec terrasse panoramique et petit-déjeuner marocain.",
  },
  {
    id: "marrakech",
    city: "Marrakech",
    title: "Riad Jardin des Épices",
    type: "Hôtels & Riads",
    district: "Médina",
    stars: 5,
    rating: "9,2",
    price: 1290,
    img: "images/marrakech.jpg",
    desc: "Un séjour raffiné à deux pas des souks, entre patio ombragé, hammam et saveurs locales.",
  },
  {
    id: "fes",
    city: "Fès",
    title: "Palais de la Médina",
    type: "Hôtels & Riads",
    district: "Fès el Bali",
    stars: 5,
    rating: "9,6",
    price: 1100,
    img: "images/fes.jpg",
    desc: "L’art de vivre fassi dans un riad authentique au décor de zellige et aux cours paisibles.",
  },
  {
    id: "essaouira",
    city: "Essaouira",
    title: "Les Terrasses de l’Atlantique",
    type: "Hôtels & Riads",
    district: "Médina",
    stars: 4,
    rating: "8,9",
    price: 760,
    img: "images/essaouira.jpg",
    desc: "L’air de l’océan et le charme de la médina, à quelques pas des remparts et du port.",
  },
  {
    id: "tanger",
    city: "Tanger",
    title: "Escapade à Tanger",
    type: "Excursions",
    district: "Centre-ville",
    stars: 4,
    rating: "9,1",
    price: 540,
    img: "images/essaouira.jpg",
    desc: "Découvrez la ville du détroit, sa kasbah, ses cafés emblématiques et ses horizons marins.",
  },
  {
    id: "desert",
    city: "Marrakech",
    title: "Échappée dans le désert",
    type: "Excursions",
    district: "Agafay",
    stars: 5,
    rating: "9,7",
    price: 1450,
    img: "images/marrakech.jpg",
    desc: "Une aventure mémorable aux portes de Marrakech, entre paysages minéraux et dîner sous les étoiles.",
  },
  {
    id: "vol",
    city: "Marrakech",
    title: "Vol vers Marrakech",
    type: "Vols",
    district: "Aéroport Marrakech-Menara",
    stars: 4,
    rating: "8,8",
    price: 1650,
    img: "images/marrakech.jpg",
    desc: "Rejoignez la ville ocre en toute simplicité et commencez votre voyage marocain.",
  },
  {
    id: "transfert",
    city: "Fès",
    title: "Transfert privé à Fès",
    type: "Taxi/Transferts",
    district: "Aéroport Fès-Saïss",
    stars: 4,
    rating: "9,0",
    price: 320,
    img: "images/fes.jpg",
    desc: "Votre chauffeur vous accueille à l’aéroport pour rejoindre votre riad sereinement.",
  },
  {
    id: "voiture",
    city: "Chefchaouen",
    title: "Voiture pour explorer le Rif",
    type: "Location de voiture",
    district: "Centre-ville",
    stars: 4,
    rating: "8,7",
    price: 450,
    img: "images/chefchaouen.jpg",
    desc: "Prenez la route à votre rythme pour découvrir les montagnes et villages du nord.",
  },
];
let data = [];
let offersLoadError = "";

const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const OFFER_LABELS = AtlasCatalog.OFFER_LABELS;

function fallbackOfferImage(offer) {
  const byType = {
    FLIGHT: "images/offers/vol-paris-casablanca.jpg",
    CAR: "images/offers/renault-clio.jpg",
    TAXI_TRANSFER: "images/offers/taxi-casablanca.jpg",
    EXCURSION: "images/offers/kasbah-ouarzazate.jpg",
  };
  const byCity = {
    Marrakech: "images/marrakech.jpg",
    Chefchaouen: "images/chefchaouen.jpg",
    "Fès": "images/fes.jpg",
    Essaouira: "images/essaouira.jpg",
  };
  return byType[offer.type] || byCity[offer.cityName] || demoData[0].img;
}

function publicOfferImage(path, offer) {
  if (!path) return fallbackOfferImage(offer);
  try {
    const url = new URL(path, window.location.href);
    const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (isLocal && url.pathname.startsWith("/images/")) {
      return `${root}images/${url.pathname.slice("/images/".length)}`;
    }
  } catch {
    // Une URL relative valide peut être utilisée telle quelle.
  }
  return path;
}

function normalizeOffer(offer) {
  return {
    id: offer.id,
    city: offer.cityName || "Maroc",
    title: offer.title || "Offre Atlas Voyage",
    type: OFFER_LABELS[offer.type] || offer.type,
    district:
      offer.address ||
      offer.pickupLocation ||
      offer.departureAirport ||
      (offer.durationHours ? `${offer.durationHours} h` : ""),
    stars: Math.max(0, Math.min(5, Number(offer.stars) || 0)),
    rating: "9,0",
    price: Number(offer.basePrice) || 0,
    img: publicOfferImage(offer.images?.find(Boolean), offer),
    desc: offer.description || "Découvrez cette expérience sélectionnée par Atlas Voyage.",
    availabilities: offer.availabilities || [],
    availableNow: Boolean(offer.availableNow),
    nextAvailabilityStart: offer.nextAvailabilityStart || "",
    nextAvailabilityEnd: offer.nextAvailabilityEnd || "",
    availableCapacity: Number(offer.availableCapacity) || 0,
    allowsPayOnArrival: Boolean(offer.allowsPayOnArrival),
    supplierName: offer.supplierName || "Atlas Voyage",
    departureAirport: offer.departureAirport || "",
    arrivalAirport: offer.arrivalAirport || "",
    departureDateTime: offer.departureDateTime || "",
    arrivalDateTime: offer.arrivalDateTime || "",
    roundTrip: Boolean(offer.roundTrip),
    returnDepartureDateTime: offer.returnDepartureDateTime || "",
    returnArrivalDateTime: offer.returnArrivalDateTime || "",
    cabinClass: offer.cabinClass || "ECONOMY",
    brand: offer.brand || "",
    model: offer.model || "",
    transmission: offer.transmission || "",
    seats: Number(offer.seats) || 0,
    pickupLocation: offer.pickupLocation || "",
    dropoffLocation: offer.dropoffLocation || "",
    dropoffLocations: offer.dropoffLocations || (offer.dropoffLocation ? [offer.dropoffLocation] : []),
    allowsDifferentDropoff: Boolean(offer.allowsDifferentDropoff),
    minimumDriverAge: Number(offer.minimumDriverAge) || 21,
    maximumDriverAge: Number(offer.maximumDriverAge) || 75,
    vehicleType: offer.vehicleType || "",
    durationHours: Number(offer.durationHours) || 0,
    includesGuide: Boolean(offer.includesGuide),
    includesTransport: Boolean(offer.includesTransport),
    itinerary: offer.itinerary || "",
  };
}

function availableFor(offer, start, end) {
  if (!start) return offer.availabilities.some(p => new Date(p.endAt) > new Date());
  if (offer.type === "Vol") {
    const coversDay = day => offer.availabilities.some(p => p.startAt.slice(0,10) <= day && p.endAt.slice(0,10) >= day && p.capacity > 0);
    return coversDay(start) && (!end || end === start || coversDay(end));
  }
  const from = new Date(start.includes("T") ? start : `${start}T00:00:00`);
  const effectiveEnd = end || start;
  const until = new Date(effectiveEnd.includes("T") ? effectiveEnd : `${effectiveEnd}T23:59:59`);
  return offer.availabilities.some(p => from >= new Date(p.startAt) && until <= new Date(p.endAt) && p.capacity > 0);
}

async function loadPublicOffers() {
  try {
    const lang = typeof I18n !== "undefined" ? I18n.lang : "fr";
    const response = await fetch(`${apiBase()}/api/offers/search?page=0&size=100&sort=recent&lang=${encodeURIComponent(lang)}`, {
      headers: { Accept: "application/json", "Accept-Language": lang },
    });
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    const payload = await response.json();
    data = (payload.content || []).map(normalizeOffer);
  } catch (error) {
    data = [];
    offersLoadError = "Impossible de charger les offres. Vérifiez que le backend est démarré sur le port 8080.";
    console.error("Chargement du catalogue impossible", error);
  }
}

async function searchPlaces(query) {
  if (typeof window !== "undefined" && window.GeocodingClient) {
    try {
      return await window.GeocodingClient.search(query);
    } catch (e) {
      console.warn("GeocodingClient error, fallback:", e);
    }
  }
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=7&language=fr&format=json`,
  );
  if (!response.ok) throw new Error("Le service de recherche des villes est indisponible.");
  return (await response.json()).results || [];
}

function bindPlaceApiInputs(scope) {
  const names = ["hotelDestination", "from", "to", "pickup", "dropoff", "taxiFrom", "taxiTo", "excursionDestination"];
  scope.querySelectorAll(names.map((name) => `[name="${name}"]`).join(",")).forEach((input, index) => {
    const listId = `place-api-${input.name}-${index}`;
    let list = document.getElementById(listId);
    if (!list) {
      list = document.createElement("datalist");
      list.id = listId;
      input.after(list);
    }
    input.setAttribute("list", listId);
    input.setAttribute("autocomplete", "off");
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      const query = input.value.trim();
      if (query.length < 2) return;
      timer = setTimeout(async () => {
        try {
          const places = await searchPlaces(query);
          list.innerHTML = places.map((place) =>
            `<option value="${esc(place.name)}">${esc([place.admin1, place.country].filter(Boolean).join(", "))}</option>`,
          ).join("");
        } catch {
          list.innerHTML = "";
        }
      }, 300);
    });
  });
}
const curCode = () => (typeof AtlasCurrency !== "undefined" ? AtlasCurrency.currency : (localStorage.getItem("atlas-cur") || "MAD"));
const money = (n) => {
  if (typeof AtlasCurrency !== "undefined") {
    return AtlasCurrency.formatPrice(n, curCode());
  }
  return (Number(n) || 0) + " MAD";
};
const icon = (name) => {
  const paths = {
    plane: '<path d="M22 2 9.5 14.5M22 2l-7 20-4-9-9-4 20-7Z"/>',
    bed: '<path d="M3 18V5M3 13h18v5M21 18V9a3 3 0 0 0-3-3H7a4 4 0 0 0-4 4v3M3 18v2m18-2v2"/>',
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    car: '<path d="m5 17-1 2H2v-5l2-6h16l2 6v5h-2l-1-2H5ZM4 14h18M7 17h.01M17 17h.01M6 8l1-3h10l1 3"/>',
    taxi: '<path d="M3 17h18M5 17l1-7h12l1 7M8 10V7h8v3M7 17v2m10-2v2M3 12h2m14 0h2"/>',
    compass:
      '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4 4-2Z"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    users:
      '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-13a4 4 0 0 1 0 8m6 5v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    shield:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    headset:
      '<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 14h4v6H5a2 2 0 0 1-2-2v-4Zm18 0h-4v6h2a2 2 0 0 0 2-2v-4Z"/>',
    cart: '<path d="M2 3h2l3 13h12l3-9H5M9 21h.01M18 21h.01"/>',
    arrow: '<path d="m5 12 14 0m-6-6 6 6-6 6"/>',
    star: '<path d="m12 2 3 6 7 .9-5 5 .9 7.1-5.9-3.2L6 21l1-7.1-5-5L9 8l3-6Z"/>',
    wallet:
      '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M17 13h4M3 9h18"/>',
    chart: '<path d="M3 20h18M6 17V9m6 8V4m6 13v-6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  };
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.compass}</svg>`;
};
const nav = AtlasCatalog.NAV;
const navUrl = (text) => `${root}catalogue.html?type=${encodeURIComponent(text)}`;
// Lien vers le catalogue complet (sans filtre de type) ; actif sur la page catalogue quand aucun type n'est choisi.
const allOffersLink = (active) => `<a class="${!active && document.body.dataset.page === "catalogue" ? "active" : ""}" href="${root}catalogue.html">${icon("grid")}Toutes les offres</a>`;

const ROLE_LABELS = { CLIENT: "Mon espace", SUPPLIER: "Espace fournisseur", AGENT: "Espace agent", ADMIN: "Administration" };
const loggedUser = () => (typeof Auth !== "undefined" && Auth.isLoggedIn() ? Auth.getUser() : null);
const cartUrl = () => `${root}client/index.html?page=panier`;

function accountLinks() {
  const user = loggedUser();
  const loginText = typeof I18n !== "undefined" ? I18n.t("nav.user.login") : "Se connecter";
  const logoutText = typeof I18n !== "undefined" ? I18n.t("nav.user.logout") : "Déconnexion";
  const mySpaceText = typeof I18n !== "undefined" ? I18n.t("nav.user.mySpace") : "Mon espace";
  if (!user) return `<a class="client-link" href="${root}connexion.html">${loginText}</a>`;
  const roleLabel = (ROLE_LABELS[user.role] && typeof I18n !== "undefined" && user.role === "CLIENT") ? mySpaceText : (ROLE_LABELS[user.role] || mySpaceText);
  return `<a class="client-link" href="${Auth.homeUrl(user.role)}">${roleLabel}</a><a href="#" id="logout-link">${logoutText}</a>`;
}
function footerAccountLink() {
  const user = loggedUser();
  const loginText = typeof I18n !== "undefined" ? I18n.t("nav.user.login") : "Se connecter";
  const mySpaceText = typeof I18n !== "undefined" ? I18n.t("nav.user.mySpace") : "Mon espace";
  return user ? `<a href="${Auth.homeUrl(user.role)}">${(ROLE_LABELS[user.role] && typeof I18n !== "undefined" && user.role === "CLIENT") ? mySpaceText : (ROLE_LABELS[user.role] || mySpaceText)}</a>` : `<a href="${root}connexion.html">${loginText}</a>`;
}

function header(active = "") {
  const i18nControls = `<div class="av-i18n-controls">${typeof AtlasCurrency !== "undefined" ? AtlasCurrency.renderCurrencySwitcher() : ""}</div>`;
  const cartLabel = typeof I18n !== "undefined" ? I18n.t("nav.user.cart") : "Panier";
  // Le panier est réservé aux comptes CLIENT (l'API /api/cart l'impose) : invisible pour les invités et les autres rôles.
  const cartLink = loggedUser()?.role === "CLIENT"
    ? `<a class="cart-link" href="${cartUrl()}">${icon("cart")} ${cartLabel} <span class="cart-count" id="cart-count">0</span></a>`
    : "";
  return `<header><div class="topbar"><div class="container"><a class="brand" href="${root}accueil.html"><img src="${root}images/logo.png" alt="Atlas Voyage" class="brand-logo"></a><div class="top-actions">${i18nControls}${cartLink}${accountLinks()}</div></div></div><nav class="main-nav"><div class="container">${allOffersLink(active)}${nav.map(([text, i]) => `<a class="${active === text ? "active" : ""}" href="${navUrl(text)}">${icon(i)}${text}</a>`).join("")}</div></nav></header>`;
}
function footer() {
  return `<footer><div class="container"><div class="footer-row"><div><a class="brand" href="${root}accueil.html"><img src="${root}images/logo.png" alt="Atlas Voyage" class="brand-logo"></a></div><div class="foot-links">${footerAccountLink()}</div></div></div></footer>`;
}
function searchBar() {
  const p = new URLSearchParams(location.search);
  let dates = JSON.parse(sessionStorage.getItem("atlas-search") || "{}");
  const dateValue = (v) => v || "";
  const city = p.get("ville") || dates.ville || "";
  const t = (k, def) => (typeof I18n !== "undefined" ? I18n.t(k) : def);
  return `<form class="search-bar" action="${root}catalogue.html" method="GET"><input type="hidden" name="search" value="1"><div class="search-field ville city-api-field">${icon("pin")}<div><label for="ville">${t("home.search.city", "Ville")}</label><input id="ville" name="ville" value="${esc(city)}" placeholder="${t("home.search.cityPlaceholder", "Rechercher une ville...")}" autocomplete="off"><input id="ville-lat" name="villeLat" type="hidden" value="${esc(dates.villeLat || "")}"><input id="ville-lon" name="villeLon" type="hidden" value="${esc(dates.villeLon || "")}"><div id="city-api-suggestions" class="city-api-suggestions" hidden></div></div></div><div class="search-field">${icon("calendar")}<div><label for="depart">${t("home.search.departure", "Date de départ")}</label><input id="depart" name="depart" type="date" value="${esc(dateValue(p.get("depart") || dates.depart))}"></div></div><div class="search-field">${icon("calendar")}<div><label for="retour">${t("home.search.return", "Date de retour")}</label><input id="retour" name="retour" type="date" value="${esc(dateValue(p.get("retour") || dates.retour))}"></div></div><div class="search-field">${icon("users")}<div><label for="voyageurs">${t("home.search.travelers", "Voyageurs")}</label><select id="voyageurs" name="voyageurs">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${Number(p.get("voyageurs") || dates.voyageurs || 2) === n ? "selected" : ""}>${typeof I18n !== "undefined" ? I18n.plural("common.plurals.travelers", n) : `${n} voyageur${n > 1 ? "s" : ""}`}</option>`).join("")}</select></div></div><button class="btn btn-yellow" type="submit">${icon("search")} ${t("home.search.button", "Rechercher")}</button></form>`;
}
function favHeart(offerId) {
  if (typeof Favorites === "undefined" || !Favorites.canFavorite()) return "";
  const isFav = Favorites.isFavorite(offerId);
  return `<button type="button" class="fav-heart-btn ${isFav ? "active" : ""}" data-fav-offer="${offerId}" aria-label="${isFav ? "Retirer des favoris" : "Ajouter aux favoris"}" onclick="event.preventDefault();event.stopPropagation();Favorites.toggle(${offerId})"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="${isFav ? "#e11d48" : "none"}" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></button>`;
}

function detailFavButton(offerId) {
  if (typeof Favorites === "undefined" || !Favorites.canFavorite()) return "";
  const isFav = Favorites.isFavorite(offerId);
  return `<button type="button" id="detail-fav-btn" class="detail-fav-btn ${isFav ? "active" : ""}" data-fav-offer="${offerId}" onclick="Favorites.toggle(${offerId})"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="${isFav ? "#e11d48" : "none"}" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg><span>${isFav ? "Dans vos favoris" : "Ajouter aux favoris"}</span></button>`;
}

function card(d) {
  const ratingHtml = d.averageRating && d.averageRating > 0
    ? `<div class="av-stars-card" style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--av-color-accent);font-weight:600;margin-top:4px;">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="#B45309" stroke="#B45309" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
         <span>${d.averageRating.toFixed(1)}</span>
         <span style="color:var(--av-color-text-subtle);font-weight:400;">(${d.reviewCount || 0})</span>
       </div>`
    : '';

  return `<a class="dest-card" href="${root}offre.html?id=${encodeURIComponent(d.id)}">${favHeart(d.id)}<img src="${esc(d.img)}" alt="${esc(d.title)}" loading="lazy"><div class="dest-card-body"><h3>${esc(d.title)}</h3><p>${esc(d.city)}${d.district ? ` · ${esc(d.district)}` : ""}</p>${ratingHtml}<div class="price">À partir de <strong>${money(d.price)}</strong></div></div></a>`;
}

function homeOffersByCategory() {
  const categories = [
    ["Hôtels & Riads", "bed", "Séjours soigneusement sélectionnés"],
    ["Vols", "plane", "Rejoignez votre prochaine destination"],
    ["Location de voiture", "car", "Voyagez librement à votre rythme"],
    ["Taxi/Transferts", "taxi", "Des trajets simples et confortables"],
  ];
  return `<div class="container"><div class="section-head home-offers-title"><div><h2>Offres disponibles</h2><p>Explorez nos offres par service.</p></div></div><div class="offer-category-list">${categories.map(([type, iconName, subtitle]) => {
    const offers = data.filter((offer) => offer.type === type).slice(0, 4);
    return `<section class="offer-category"><div class="offer-category-head"><div><span class="offer-category-icon">${icon(iconName)}</span><span><h3>${type}</h3><p>${subtitle}</p></span></div><a class="text-link" href="${navUrl(type)}">Voir toutes les offres →</a></div><div class="dest-grid">${offers.length ? offers.map(card).join("") : `<div class="empty-state"><h3>Aucune offre disponible</h3><p>De nouvelles offres seront bientôt publiées dans cette catégorie.</p></div>`}</div></section>`;
  }).join("")}</div></div>`;
}

function home() {
  document.getElementById("app").innerHTML =
    header("") +
    `<main id="main-content"><section class="hero"><div class="container"><div class="eyebrow">L’ÉVASION COMMENCE ICI</div><h1>Le Maroc vous attend.<br>Vivez-le pleinement.</h1><p>Des ruelles bleues aux dunes dorées, trouvez le voyage qui vous ressemble avec Atlas Voyage.</p></div></section><div class="container search-wrap">${searchBar()}</div><div class="container"><div class="quick-row">${nav.map(([t, i]) => `<a class="quick" href="${navUrl(t)}"><span class="quick-ico">${icon(i)}</span><span>${t}</span></a>`).join("")}</div></div><section class="section"><div class="container"><div class="section-head"><div><h2>Offres disponibles</h2><p>Des offres réelles, actives et disponibles.</p></div><a class="text-link" href="${root}catalogue.html">Explorer toutes les offres →</a></div><div class="dest-grid">${data.length ? data.slice(0, 4).map(card).join("") : `<div class="empty-state"><h3>Aucune offre disponible</h3><p>${esc(offersLoadError || "De nouvelles offres seront bientôt publiées.")}</p></div>`}</div></div></section></main>` +
    footer();
    const homeMain = document.querySelector("main");
    const searchWrap = homeMain.querySelector(".search-wrap");
    const dynamicContent = document.createElement("div");
    dynamicContent.id = "home-dynamic-content";
    while (searchWrap.nextSibling) dynamicContent.appendChild(searchWrap.nextSibling);
    searchWrap.remove();
    homeMain.appendChild(dynamicContent);
    const offersSection = dynamicContent.querySelector(".section");
    if (offersSection) offersSection.innerHTML = homeOffersByCategory();

    // Carrousel pour la section Hero avec animation fluide (Crossfade)
  const hero = document.querySelector(".hero");
  if (hero) {
    const bgImages = [
      "images/chefchaouen.jpg",
      "images/marrakech.jpg",
      "images/fes.jpg",
      "images/essaouira.jpg"
    ];
    
    // Prchargement
    bgImages.forEach(img => { (new Image()).src = root + img; });

    // Cration de 2 calques superposs pour le fondu enchan
    const layer1 = document.createElement("div");
    const layer2 = document.createElement("div");
    layer1.className = "hero-bg";
    layer2.className = "hero-bg";
    
    layer1.style.backgroundImage = "url('" + root + bgImages[0] + "')";
    layer1.style.opacity = "1";
    
    layer2.style.backgroundImage = "url('" + root + bgImages[1] + "')";
    layer2.style.opacity = "0";

    // On retire le fond statique et on injecte les calques
    hero.style.background = "none";
    hero.prepend(layer2);
    hero.prepend(layer1);

    let currentBg = 0;
    let activeLayer = 1;

    setInterval(() => {
      currentBg = (currentBg + 1) % bgImages.length;
      
      if (activeLayer === 1) {
        layer2.style.backgroundImage = "url('" + root + bgImages[currentBg] + "')";
        layer2.style.opacity = "1";
        layer1.style.opacity = "0";
        activeLayer = 2;
      } else {
        layer1.style.backgroundImage = "url('" + root + bgImages[currentBg] + "')";
        layer1.style.opacity = "1";
        layer2.style.opacity = "0";
        activeLayer = 1;
      }
    }, 4500);
  }
}

function renderHomeHotelResults(params) {
  const target = document.getElementById("home-dynamic-content");
  if (!target) return;
  const destination = (params.get("ville") || "").trim();
  const normalizedDestination = destination.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hotels = data.filter((offer) => {
    if (offer.type !== "Hôtels & Riads") return false;
    if (!normalizedDestination) return true;
    const searchable = `${offer.city} ${offer.title} ${offer.district}`
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return searchable.includes(normalizedDestination);
  });
  const travelers = Number(params.get("voyageurs") || 2);
  target.innerHTML = `<section class="section home-hotel-results"><div class="container"><div class="section-head"><div><span class="eyebrow">HÔTELS & RIADS</span><h2>${hotels.length} hébergement${hotels.length !== 1 ? "s" : ""} trouvé${hotels.length !== 1 ? "s" : ""}${destination ? ` à ${esc(destination)}` : ""}</h2><p>${esc(params.get("depart") || "Dates flexibles")} · ${travelers} voyageur${travelers > 1 ? "s" : ""}</p></div><button id="reset-hotel-search" class="btn btn-light" type="button">Réinitialiser</button></div><div class="home-result-list">${hotels.length ? hotels.map(resultCard).join("") : `<div class="empty-state"><h3>Aucun hôtel ou riad trouvé</h3><p>Essayez une autre ville ou modifiez vos critères de recherche.</p></div>`}</div></div></section>`;
  document.getElementById("reset-hotel-search").onclick = () => {
    location.href = `${root}accueil.html`;
  };
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindSearch() {
  const f = document.querySelector(".search-bar");
  if (!f) return;
  const cityInput = f.querySelector("#ville");
  const latitude = f.querySelector("#ville-lat");
  const longitude = f.querySelector("#ville-lon");
  const suggestions = f.querySelector("#city-api-suggestions");
  let cityTimer;
  let cityResults = [];

  cityInput.addEventListener("input", () => {
    clearTimeout(cityTimer);
    latitude.value = "";
    longitude.value = "";
    const query = cityInput.value.trim();
    if (query.length < 2) {
      suggestions.hidden = true;
      return;
    }
    cityTimer = setTimeout(async () => {
      suggestions.hidden = false;
      suggestions.innerHTML = '<div class="city-api-message">Recherche…</div>';
      try {
        cityResults = await searchPlaces(query);
        suggestions.innerHTML = cityResults.length
          ? cityResults.map((city, index) => `<button type="button" data-city-index="${index}"><strong>${esc(city.name)}</strong><span>${esc([city.admin1, city.country].filter(Boolean).join(", "))}</span></button>`).join("")
          : '<div class="city-api-message">Aucune ville trouvée.</div>';
      } catch (error) {
        suggestions.innerHTML = `<div class="city-api-message error">${esc(error.message)}</div>`;
      }
    }, 350);
  });

  suggestions.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-city-index]");
    if (!choice) return;
    const city = cityResults[Number(choice.dataset.cityIndex)];
    if (!city) return;
    cityInput.value = city.name;
    latitude.value = city.latitude;
    longitude.value = city.longitude;
    suggestions.hidden = true;
  });

  f.addEventListener("submit", (e) => {
    let depart = f.querySelector("#depart").value,
      retour = f.querySelector("#retour").value;
    if (cityInput.value.trim() && (!latitude.value || !longitude.value)) {
      e.preventDefault();
      toast("Sélectionnez une ville dans les suggestions de l’API.");
      return;
    }
    if (depart && retour && retour < depart) {
      e.preventDefault();
      toast("La date de retour doit suivre la date de départ.");
      return;
    }
    sessionStorage.setItem(
      "atlas-search",
      JSON.stringify(Object.fromEntries(new FormData(f))),
    );
    if (page === "home") {
      e.preventDefault();
      const params = new URLSearchParams(new FormData(f));
      history.replaceState({}, "", `${root}accueil.html?${params.toString()}`);
      renderHomeHotelResults(params);
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".city-api-field")) suggestions.hidden = true;
  });
}
function resultCard(d) {
  const criteria = new URLSearchParams(location.search);
  criteria.delete("id");
  return `<article class="result-card">${favHeart(d.id)}<img src="${esc(d.img)}" alt="${esc(d.title)}" loading="lazy"><div class="result-main"><h3>${esc(d.title)}</h3><p>${icon("pin")} ${esc(d.city)}${d.district ? ` · ${esc(d.district)}` : ""} ${d.stars ? `&nbsp;·&nbsp; ${"★".repeat(d.stars)}` : ""}</p>${d.allowsPayOnArrival ? '<span class="badge">✓ Paiement à l’arrivée</span>' : ""}<p class="description">${esc(d.desc)}</p></div><div class="result-side"><div><small>À partir de</small><div class="result-price">${money(d.price)}</div></div><a class="btn btn-blue" href="${root}offre.html?id=${encodeURIComponent(d.id)}&${criteria.toString()}">Voir détails</a></div></article>`;
}

function flightSearchPanel(params) {
  const today = new Date().toISOString().slice(0, 10);
  return `<section class="flight-search-hero"><div class="flight-search-copy"><span class="eyebrow">VOLS ATLAS VOYAGE</span><h1>Où voulez-vous partir ?</h1><p>Comparez les vols disponibles et trouvez le trajet qui vous convient.</p><form id="flight-search-form" action="${root}catalogue.html" method="GET"><input type="hidden" name="type" value="Vols"><input type="hidden" name="flightSearch" value="1"><div class="flight-trip-type"><label><input type="radio" name="trip" value="round" ${params.get("trip") !== "oneway" ? "checked" : ""}> Aller-retour</label><label><input type="radio" name="trip" value="oneway" ${params.get("trip") === "oneway" ? "checked" : ""}> Aller simple</label></div><div class="flight-search-row"><label class="flight-place"><span>Départ</span><input id="flight-from" name="from" value="${esc(params.get("from") || "")}" placeholder="Ville ou aéroport (ex. CMN)" required autocomplete="off"></label><button type="button" id="swap-flight-places" class="flight-swap" aria-label="Inverser le départ et la destination">⇄</button><label class="flight-place"><span>Destination</span><input id="flight-to" name="to" value="${esc(params.get("to") || "")}" placeholder="Où allez-vous ?" required autocomplete="off"></label><label><span>Aller</span><input id="flight-depart" name="flightDepart" type="date" min="${today}" value="${esc(params.get("flightDepart") || "")}" required></label><label id="flight-return-wrap"><span>Retour</span><input id="flight-return" name="flightReturn" type="date" min="${today}" value="${esc(params.get("flightReturn") || "")}"></label><label><span>Voyageurs & classe</span><select name="passengers"><option value="1" ${params.get("passengers") === "1" ? "selected" : ""}>1 adulte, Économique</option><option value="2" ${!params.get("passengers") || params.get("passengers") === "2" ? "selected" : ""}>2 adultes, Économique</option><option value="3" ${params.get("passengers") === "3" ? "selected" : ""}>3 adultes, Économique</option><option value="business" ${params.get("passengers") === "business" ? "selected" : ""}>1 adulte, Affaires</option></select></label><button class="btn btn-yellow" type="submit">${icon("search")} Rechercher</button></div></form></div><div class="flight-visual" aria-hidden="true"><div class="flight-photo flight-photo-main"></div><div class="flight-photo flight-photo-top"></div><div class="flight-photo flight-photo-bottom"></div></div></section>`;
}

function bindFlightSearch() {
  const form = document.getElementById("flight-search-form");
  if (!form) return;
  bindPlaceApiInputs(form);
  const from = document.getElementById("flight-from");
  const to = document.getElementById("flight-to");
  const depart = document.getElementById("flight-depart");
  const back = document.getElementById("flight-return");
  const backWrap = document.getElementById("flight-return-wrap");
  document.getElementById("swap-flight-places").onclick = () => {
    [from.value, to.value] = [to.value, from.value];
  };
  const updateTrip = () => {
    const oneWay = form.elements.trip.value === "oneway";
    backWrap.hidden = oneWay;
    back.required = !oneWay;
    if (oneWay) back.value = "";
  };
  form.querySelectorAll('[name="trip"]').forEach((radio) => radio.addEventListener("change", updateTrip));
  depart.addEventListener("change", () => {
    back.min = depart.value || new Date().toISOString().slice(0, 10);
    if (back.value && back.value < depart.value) back.value = "";
  });
  form.addEventListener("submit", (event) => {
    if (back.required && (!back.value || back.value < depart.value)) {
      event.preventDefault();
      toast("La date de retour doit suivre la date de départ.");
    }
  });
  updateTrip();
}

function carSearchPanel(params) {
  const today = new Date().toISOString().slice(0, 10);
  return `<section class="car-search-hero"><div class="car-search-inner"><span class="eyebrow">LOCATION DE VOITURE</span><h1>Une voiture pour chaque voyage</h1><p>Trouvez le véhicule adapté à votre trajet, au meilleur prix parmi nos partenaires.</p><form id="car-search-form" action="${root}catalogue.html" method="GET"><input type="hidden" name="type" value="Location de voiture"><input type="hidden" name="carSearch" value="1"><div class="car-search-row"><label class="car-place"><span>Lieu de prise en charge</span><input id="car-pickup" name="pickup" value="${esc(params.get("pickup") || "")}" placeholder="Aéroport, ville ou gare" required autocomplete="off"></label><label><span>Date de prise en charge</span><input id="car-pickup-date" name="pickupDate" type="date" min="${today}" value="${esc(params.get("pickupDate") || "")}" required></label><label><span>Heure</span><input name="pickupTime" type="time" value="${esc(params.get("pickupTime") || "10:00")}" required></label><label><span>Date de restitution</span><input id="car-return-date" name="returnDate" type="date" min="${today}" value="${esc(params.get("returnDate") || "")}" required></label><label><span>Heure</span><input name="returnTime" type="time" value="${esc(params.get("returnTime") || "10:00")}" required></label><button class="btn btn-yellow" type="submit">${icon("search")} Rechercher</button></div><div class="car-search-options"><label><input id="different-dropoff" name="differentDropoff" type="checkbox" value="1" ${params.has("differentDropoff") ? "checked" : ""}> Restituer la voiture à un autre endroit</label><label><input name="driverAge" type="checkbox" value="30-65" ${params.get("driverAge") !== "" ? "checked" : ""}> Le conducteur a entre 30 et 65 ans</label></div><label id="dropoff-wrap" class="car-dropoff" ${params.has("differentDropoff") ? "" : "hidden"}><span>Lieu de restitution</span><input name="dropoff" value="${esc(params.get("dropoff") || "")}" placeholder="Ville, aéroport ou gare"></label></form></div></section>`;
}

function bindCarSearch() {
  const form = document.getElementById("car-search-form");
  if (!form) return;
  bindPlaceApiInputs(form);
  const pickupDate = document.getElementById("car-pickup-date");
  const returnDate = document.getElementById("car-return-date");
  const different = document.getElementById("different-dropoff");
  const dropoffWrap = document.getElementById("dropoff-wrap");
  different.addEventListener("change", () => {
    dropoffWrap.hidden = !different.checked;
    dropoffWrap.querySelector("input").required = different.checked;
  });
  pickupDate.addEventListener("change", () => {
    returnDate.min = pickupDate.value || new Date().toISOString().slice(0, 10);
    if (returnDate.value && returnDate.value < pickupDate.value) returnDate.value = "";
  });
  form.addEventListener("submit", (event) => {
    if (!returnDate.value || returnDate.value < pickupDate.value) {
      event.preventDefault();
      toast("La restitution doit avoir lieu après la prise en charge.");
    }
  });
  dropoffWrap.querySelector("input").required = different.checked;
}

function taxiSearchPanel(params) {
  const now = new Date();
  const localMin = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return `<section class="taxi-search-hero"><div class="taxi-search-inner"><span class="eyebrow">TAXI & TRANSFERT AÉROPORT</span><h1>Réservez votre transfert aéroport</h1><p>Voyagez simplement entre l’aéroport, la gare et votre hébergement.</p><form id="taxi-search-form" action="${root}catalogue.html" method="GET"><input type="hidden" name="type" value="Taxi/Transferts"><input type="hidden" name="taxiSearch" value="1"><div class="taxi-trip-type"><label><input type="radio" name="taxiTrip" value="oneway" ${params.get("taxiTrip") !== "round" ? "checked" : ""}> Aller simple</label><label><input type="radio" name="taxiTrip" value="round" ${params.get("taxiTrip") === "round" ? "checked" : ""}> Aller-retour</label></div><div class="taxi-search-row"><label><span>Lieu de prise en charge</span><input id="taxi-from" name="taxiFrom" value="${esc(params.get("taxiFrom") || "")}" placeholder="Aéroport, gare ou adresse" required></label><button type="button" id="swap-taxi-places" class="taxi-swap" aria-label="Inverser les lieux">⇄</button><label><span>Destination</span><input id="taxi-to" name="taxiTo" value="${esc(params.get("taxiTo") || "")}" placeholder="Indiquez la destination" required></label><label><span>Date et heure de prise en charge</span><input id="taxi-departure" name="taxiDeparture" type="datetime-local" min="${localMin}" value="${esc(params.get("taxiDeparture") || "")}" required></label><label id="taxi-return-wrap"><span>Date et heure du retour</span><input id="taxi-return" name="taxiReturn" type="datetime-local" min="${localMin}" value="${esc(params.get("taxiReturn") || "")}"></label><label><span>Passagers</span><select name="taxiPassengers">${[1, 2, 3, 4, 5, 6, 7, 8].map((number) => `<option value="${number}" ${Number(params.get("taxiPassengers") || 2) === number ? "selected" : ""}>${number} passager${number > 1 ? "s" : ""}</option>`).join("")}</select></label><button class="btn btn-yellow" type="submit">${icon("search")} Rechercher</button></div></form><div class="taxi-benefits"><div>${icon("plane")}<span><strong>Suivi des vols</strong><small>Votre chauffeur adapte l’heure de prise en charge en cas de retard.</small></span></div><div>${icon("wallet")}<span><strong>Tarif clair</strong><small>Prix confirmé dès la réservation, sans frais cachés.</small></span></div><div>${icon("headset")}<span><strong>Chauffeurs approuvés</strong><small>Service professionnel et assistance locale 7j/7.</small></span></div></div></div></section>`;
}

function bindTaxiSearch() {
  const form = document.getElementById("taxi-search-form");
  if (!form) return;
  bindPlaceApiInputs(form);
  const from = document.getElementById("taxi-from");
  const to = document.getElementById("taxi-to");
  const departure = document.getElementById("taxi-departure");
  const back = document.getElementById("taxi-return");
  const backWrap = document.getElementById("taxi-return-wrap");
  document.getElementById("swap-taxi-places").onclick = () => {
    [from.value, to.value] = [to.value, from.value];
  };
  const updateTrip = () => {
    const round = form.elements.taxiTrip.value === "round";
    backWrap.hidden = !round;
    back.required = round;
    if (!round) back.value = "";
  };
  form.querySelectorAll('[name="taxiTrip"]').forEach((radio) => radio.addEventListener("change", updateTrip));
  departure.addEventListener("change", () => {
    back.min = departure.value;
    if (back.value && back.value <= departure.value) back.value = "";
  });
  form.addEventListener("submit", (event) => {
    if (back.required && (!back.value || back.value <= departure.value)) {
      event.preventDefault();
      toast("Le retour doit avoir lieu après la prise en charge.");
    }
  });
  updateTrip();
}

function hotelSearchPanel(params) {
  const today = new Date().toISOString().slice(0, 10);
  const hotelCities = [...new Set(data.filter((offer) => offer.type === "Hôtels & Riads").map((offer) => offer.city).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr"));
  return `<section class="hotel-search-hero"><div class="hotel-search-inner"><span class="eyebrow">HÔTELS & RIADS</span><h1>Trouvez votre prochain séjour</h1><p>Recherchez des hôtels, des riads authentiques et des hébergements sélectionnés.</p><form id="hotel-search-form" action="${root}catalogue.html" method="GET"><input type="hidden" name="type" value="Hôtels & Riads"><input type="hidden" name="hotelSearch" value="1"><div class="hotel-search-row"><label class="hotel-destination"><span>Destination</span><input name="hotelDestination" value="${esc(params.get("hotelDestination") || "")}" list="hotel-cities" placeholder="Où allez-vous ?" autocomplete="off" required><datalist id="hotel-cities">${hotelCities.map((city) => `<option value="${esc(city)}"></option>`).join("")}</datalist></label><label><span>Date d’arrivée</span><input id="hotel-arrival" name="hotelArrival" type="date" min="${today}" value="${esc(params.get("hotelArrival") || "")}" required></label><label><span>Date de départ</span><input id="hotel-departure" name="hotelDeparture" type="date" min="${today}" value="${esc(params.get("hotelDeparture") || "")}" required></label><label><span>Voyageurs & chambres</span><select name="hotelGuests"><option value="1" ${params.get("hotelGuests") === "1" ? "selected" : ""}>1 adulte · 1 chambre</option><option value="2" ${!params.get("hotelGuests") || params.get("hotelGuests") === "2" ? "selected" : ""}>2 adultes · 1 chambre</option><option value="3" ${params.get("hotelGuests") === "3" ? "selected" : ""}>2 adultes · 1 enfant · 1 chambre</option><option value="4" ${params.get("hotelGuests") === "4" ? "selected" : ""}>4 adultes · 2 chambres</option></select></label><button class="btn btn-yellow" type="submit">${icon("search")} Rechercher</button></div><label class="hotel-work-trip"><input name="workTrip" type="checkbox" value="1" ${params.has("workTrip") ? "checked" : ""}> Je voyage pour le travail</label></form></div></section>`;
}

function bindHotelSearch() {
  const form = document.getElementById("hotel-search-form");
  if (!form) return;
  bindPlaceApiInputs(form);
  const arrival = document.getElementById("hotel-arrival");
  const departure = document.getElementById("hotel-departure");
  arrival.addEventListener("change", () => {
    departure.min = arrival.value || new Date().toISOString().slice(0, 10);
    if (departure.value && departure.value <= arrival.value) departure.value = "";
  });
  form.addEventListener("submit", (event) => {
    if (!departure.value || departure.value <= arrival.value) {
      event.preventDefault();
      toast("La date de départ doit être postérieure à la date d’arrivée.");
    }
  });
}

function excursionSearchPanel(params) {
  const today = new Date().toISOString().slice(0, 10);
  const excursionCities = [...new Set(data.filter((offer) => offer.type === "Excursions").map((offer) => offer.city).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr"));
  return `<section class="excursion-search-hero"><div class="excursion-search-inner"><span class="eyebrow">ACTIVITÉS & EXPÉRIENCES</span><h1>Découvrez le Maroc autrement</h1><p>Réservez des excursions, visites guidées et expériences sélectionnées pour votre voyage.</p><form id="excursion-search-form" action="${root}catalogue.html" method="GET"><input type="hidden" name="type" value="Excursions"><input type="hidden" name="excursionSearch" value="1"><div class="excursion-search-row"><label class="excursion-destination"><span>Destination</span><input name="excursionDestination" value="${esc(params.get("excursionDestination") || "")}" list="excursion-cities" placeholder="Où allez-vous ?" autocomplete="off"><datalist id="excursion-cities">${excursionCities.map((city) => `<option value="${esc(city)}"></option>`).join("")}</datalist></label><label><span>Date de l’activité</span><input name="excursionDate" type="date" min="${today}" value="${esc(params.get("excursionDate") || "")}" required></label><label><span>Participants</span><select name="excursionGuests">${[1, 2, 3, 4, 5, 6, 7, 8].map((number) => `<option value="${number}" ${Number(params.get("excursionGuests") || 2) === number ? "selected" : ""}>${number} personne${number > 1 ? "s" : ""}</option>`).join("")}</select></label><button class="btn btn-yellow" type="submit">${icon("search")} Rechercher</button></div><div class="excursion-options"><label><input name="withGuide" type="checkbox" value="1" ${params.has("withGuide") ? "checked" : ""}> Avec guide</label><label><input name="withTransport" type="checkbox" value="1" ${params.has("withTransport") ? "checked" : ""}> Transport inclus</label></div></form><div class="excursion-highlights"><div>${icon("compass")}<span><strong>Expériences locales</strong><small>Des activités choisies pour découvrir chaque destination.</small></span></div><div>${icon("shield")}<span><strong>Réservation sécurisée</strong><small>Des prestataires vérifiés et des places confirmées.</small></span></div><div>${icon("headset")}<span><strong>Assistance 7j/7</strong><small>Une équipe disponible avant et pendant votre activité.</small></span></div></div></div></section>`;
}

function catalogue() {
  const p = new URLSearchParams(location.search);
  let dest = p.get("ville") || "",
    type = p.get("type") || "",
    page = 1;
  const isFlightSearch = type === "Vols";
  const flightSearchSubmitted = p.has("flightSearch");
  const isCarSearch = type === "Location de voiture";
  const carSearchSubmitted = p.has("carSearch");
  const isTaxiSearch = type === "Taxi/Transferts";
  const taxiSearchSubmitted = p.has("taxiSearch");
  const isExcursionSearch = type === "Excursions";
  const excursionSearchSubmitted = p.has("excursionSearch");
  const isHotelSearch = type === "Hôtels & Riads";
  const hotelSearchSubmitted = p.has("hotelSearch");
  const showResults = (!isHotelSearch || hotelSearchSubmitted) && (!isFlightSearch || flightSearchSubmitted) &&
    (!isCarSearch || carSearchSubmitted) && (!isTaxiSearch || taxiSearchSubmitted) &&
    (!isExcursionSearch || excursionSearchSubmitted);
  const hasSearch = p.has("search") || p.has("hotelSearch") || p.has("flightSearch") || p.has("carSearch") || p.has("taxiSearch") || p.has("excursionSearch") || !!dest || p.has("depart") || p.has("retour");
  const titleText = hasSearch
    ? `Résultats de recherche${dest ? " à " + dest : ""}`
    : `Explorez nos offres${dest ? " à " + dest : ""}`;
  const availableCities = [...new Set(data.map((offer) => offer.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  document.getElementById("app").innerHTML =
    header(type) +
    `<main id="main-content"><div class="container"><div class="page-intro"><div class="breadcrumb"><a href="${root}accueil.html">Accueil</a> / Résultats de recherche</div><h1>${esc(titleText)}</h1><p>Votre prochaine aventure au Maroc commence ici.</p></div><div class="results-layout"><aside class="filter-panel"><h3>Filtrer les résultats</h3><div class="filter-block"><h4>Prix maximum</h4><input id="price-filter" type="range" min="300" max="2000" step="50" value="2000" aria-label="Prix maximum"><div class="range-values"><span>300 MAD</span><span id="price-value">2 000 MAD</span></div></div><div class="filter-block"><h4>Type d’offre</h4>${nav.map(([n]) => `<label><input type="checkbox" name="type" value="${n}" ${type === n ? "checked" : ""}>${n}</label>`).join("")}</div><div class="filter-block"><h4>Étoiles</h4><label><input type="checkbox" name="stars" value="5"> 5 étoiles</label><label><input type="checkbox" name="stars" value="4"> 4 étoiles</label></div><div class="filter-block"><h4>Ville / quartier</h4><select id="city-filter" aria-label="Ville ou quartier"><option value="">Toutes les villes</option>${availableCities.map((c) => `<option value="${esc(c)}" ${dest === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div><button class="btn btn-light" id="clear-filters" style="width:100%">Effacer les filtres</button></aside><div><div class="result-top"><h2 id="result-count" role="status" aria-live="polite"></h2><select id="sort" aria-label="Trier les résultats"><option value="relevant">Trier : Pertinence</option><option value="price">Prix croissant</option><option value="price_desc">Prix décroissant</option><option value="rating_desc">Mieux notés</option></select></div><div class="result-list" id="result-list"></div><div class="pagination" id="pagination" aria-label="Pagination"></div></div></div></div></main>` +
    footer();
  if (isHotelSearch) {
    const main = document.querySelector("main");
    main.insertAdjacentHTML("afterbegin", hotelSearchPanel(p));
    bindHotelSearch();
    if (!showResults) {
      main.querySelector(":scope > .container").hidden = true;
      return;
    }
  }
  if (isFlightSearch) {
    const main = document.querySelector("main");
    main.insertAdjacentHTML("afterbegin", flightSearchPanel(p));
    bindFlightSearch();
    if (!showResults) {
      main.querySelector(":scope > .container").hidden = true;
      return;
    }
  }
  if (isCarSearch) {
    const main = document.querySelector("main");
    main.insertAdjacentHTML("afterbegin", carSearchPanel(p));
    bindCarSearch();
    if (!showResults) {
      main.querySelector(":scope > .container").hidden = true;
      return;
    }
  }
  if (isTaxiSearch) {
    const main = document.querySelector("main");
    main.insertAdjacentHTML("afterbegin", taxiSearchPanel(p));
    bindTaxiSearch();
    if (!showResults) {
      main.querySelector(":scope > .container").hidden = true;
      return;
    }
  }
  if (isExcursionSearch) {
    const main = document.querySelector("main");
    main.insertAdjacentHTML("afterbegin", excursionSearchPanel(p));
    bindPlaceApiInputs(main.querySelector("#excursion-search-form"));
    if (!showResults) {
      main.querySelector(":scope > .container").hidden = true;
      return;
    }
  }
  const filters = document.querySelector(".filter-panel");
  function render() {
    let types = [...filters.querySelectorAll("[name=type]:checked")].map(
        (x) => x.value,
      ),
      stars = [...filters.querySelectorAll("[name=stars]:checked")].map(
        (x) => +x.value,
      ),
      city = document.getElementById("city-filter").value,
      max = +document.getElementById("price-filter").value;
    document.getElementById("price-value").textContent = money(max);
    let list = data.filter(
      (d) =>
        d.price <= max &&
        (!city || d.city === city) &&
        (!types.length || types.includes(d.type)) &&
        (!stars.length || stars.includes(d.stars)),
    );
    const carStart = p.get("pickupDate") ? `${p.get("pickupDate")}T${p.get("pickupTime") || "10:00"}` : "";
    const carEnd = p.get("returnDate") ? `${p.get("returnDate")}T${p.get("returnTime") || "10:00"}` : "";
    const requestedStart = p.get("hotelArrival") || p.get("flightDepart") || carStart || p.get("taxiDeparture")?.slice(0,10) || p.get("excursionDate") || "";
    const requestedEnd = p.get("hotelDeparture") || p.get("flightReturn") || carEnd || p.get("taxiReturn")?.slice(0,10) || requestedStart;
    list = list.filter(d => availableFor(d, requestedStart, requestedEnd));
    if (isFlightSearch) {
      const from = (p.get("from") || "").toLowerCase();
      const to = (p.get("to") || "").toLowerCase();
      const departDate = p.get("flightDepart") || "";
      const returnDate = p.get("flightReturn") || "";
      const wantsRoundTrip = p.get("trip") !== "oneway";
      const passengerChoice = p.get("passengers") || "2";
      const passengers = Number.parseInt(passengerChoice, 10) || 1;
      const wantedClass = passengerChoice.includes("business") ? "BUSINESS" : "ECONOMY";
      list = list.filter((d) => {
        const titleParts = d.title.split(/[-→]/);
        const routeStart = `${d.departureAirport} ${titleParts[0] || ""}`.toLowerCase();
        const routeEnd = `${d.arrivalAirport} ${d.city} ${titleParts.at(-1) || ""}`.toLowerCase();
        return (!from || routeStart.includes(from)) &&
          (!to || routeEnd.includes(to)) &&
          (!departDate || d.departureDateTime.startsWith(departDate)) &&
          (!wantsRoundTrip || (d.roundTrip && (!returnDate || d.returnDepartureDateTime.startsWith(returnDate)))) &&
          (wantsRoundTrip || !d.roundTrip) && d.cabinClass === wantedClass && d.availableCapacity >= passengers;
      });
    }
    if (isHotelSearch) {
      const destination = (p.get("hotelDestination") || "").trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      list = list.filter((d) => {
        const searchable = `${d.city} ${d.title} ${d.district}`
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return !destination || searchable.includes(destination);
      });
    }
    if (isCarSearch) {
      const pickup = (p.get("pickup") || "").trim().toLowerCase();
      const dropoff = (p.get("dropoff") || "").trim().toLowerCase();
      const needsDifferentDropoff = p.has("differentDropoff");
      const driverInStandardRange = p.get("driverAge") === "30-65";
      list = list.filter((d) => {
        const pickupText = `${d.pickupLocation} ${d.city} ${d.title} ${d.brand} ${d.model}`.toLowerCase();
        const dropoffText = `${d.dropoffLocations.join(" ")} ${d.dropoffLocation} ${d.city} ${d.title}`.toLowerCase();
        return (!pickup || pickupText.includes(pickup)) &&
          (!needsDifferentDropoff || (d.allowsDifferentDropoff && (!dropoff || dropoffText.includes(dropoff)))) &&
          (!driverInStandardRange || (d.minimumDriverAge <= 30 && d.maximumDriverAge >= 65));
      });
    }
    if (isTaxiSearch) {
      const from = (p.get("taxiFrom") || "").trim().toLowerCase();
      const to = (p.get("taxiTo") || "").trim().toLowerCase();
      list = list.filter((d) => {
        const pickup = `${d.pickupLocation} ${d.city} ${d.title}`.toLowerCase();
        const dropoff = `${d.dropoffLocation} ${d.city} ${d.title}`.toLowerCase();
        return (!from || pickup.includes(from)) && (!to || dropoff.includes(to));
      });
    }
    if (isExcursionSearch) {
      const destination = (p.get("excursionDestination") || "").trim().toLowerCase();
      const withGuide = p.has("withGuide");
      const withTransport = p.has("withTransport");
      list = list.filter((d) =>
        (!destination || `${d.city} ${d.title} ${d.itinerary}`.toLowerCase().includes(destination)) &&
        (!withGuide || d.includesGuide) &&
        (!withTransport || d.includesTransport),
      );
    }
    const sortVal = document.getElementById("sort").value;
    if (sortVal === "price") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortVal === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortVal === "rating_desc") {
      list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else {
      list.sort(
        (a, b) =>
          parseFloat(String(b.rating || "0").replace(",", ".")) -
          parseFloat(String(a.rating || "0").replace(",", ".")),
      );
    }
    const pages = Math.max(1, Math.ceil(list.length / 4));
    page = Math.min(page, pages);
    document.getElementById("result-count").textContent =
      list.length +
      " offre" +
      (list.length !== 1 ? "s" : "") +
      " trouvée" +
      (list.length !== 1 ? "s" : "");
    document.getElementById("result-list").innerHTML = list.length
      ? list
          .slice((page - 1) * 4, page * 4)
          .map(resultCard)
          .join("")
      : '<div class="empty-state"><h3>Aucune offre trouvée</h3><p>Essayez d’élargir vos critères de recherche.</p></div>';
    document.getElementById("pagination").innerHTML =
      pages > 1
        ? Array.from(
            { length: pages },
            (_, i) =>
              `<button class="${page === i + 1 ? "active" : ""}" data-page="${i + 1}">${i + 1}</button>`,
          ).join("")
        : "";
    document.querySelectorAll("[data-page]").forEach(
      (b) =>
        (b.onclick = () => {
          page = +b.dataset.page;
          render();
          window.scrollTo({ top: 230, behavior: "smooth" });
        }),
    );
  }
  filters.addEventListener("input", () => {
    page = 1;
    render();
  });
  filters.addEventListener("change", () => {
    page = 1;
    render();
  });
  document.getElementById("sort").onchange = render;
  document.getElementById("clear-filters").onclick = () => {
    filters
      .querySelectorAll("input[type=checkbox]")
      .forEach((i) => (i.checked = false));
    document.getElementById("city-filter").value = "";
    document.getElementById("price-filter").value = "2000";
    page = 1;
    render();
  };
  render();
}
async function refreshCart() {
  let count = 0;
  const user = loggedUser();
  if (user?.role === "CLIENT") {
    try {
      const response = await fetch(`${apiBase()}/api/cart`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${Auth.getToken()}` },
      });
      if (response.ok) count = Number((await response.json()).itemCount) || 0;
    } catch {
      // Le compteur reste à 0 si l'API est momentanément indisponible.
    }
  }
  document.querySelectorAll("#cart-count").forEach((el) => (el.textContent = count));
}
function toast(msg) {
  document.querySelector(".toast")?.remove();
  let div = document.createElement("div");
  div.className = "toast";
  div.setAttribute("role", "status");
  div.textContent = msg;
  document.body.append(div);
  setTimeout(() => div.remove(), 3500);
}
async function addItem(d, dates) {
  const user = loggedUser();
  if (user?.role === "CLIENT") {
    const response = await fetch(`${apiBase()}/api/cart/items`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify({ offerId: d.id, quantity: 1, travelCriteria: JSON.stringify(dates || {}) }),
    });
    if (!response.ok) {
      let message = "Impossible d’ajouter cette offre au panier.";
      try {
        const payload = await response.json();
        message = payload.message || message;
        if (Array.isArray(payload.details) && payload.details.length) {
          message += " : " + payload.details.map(d => [d.field, d.message].filter(Boolean).join(" : ")).join("; ");
        }
      } catch {
        // La réponse d'erreur n'est pas au format JSON.
      }
      throw new Error(message);
    }
    await refreshCart();
    toast("Offre ajoutée à votre panier client");
    return;
  }
  throw new Error("Connectez-vous avec un compte client pour réserver.");
}
function detail() {
  const detailParams = new URLSearchParams(location.search);
  let id = detailParams.get("id"),
    d = data.find((x) => String(x.id) === String(id));
  if (!d) {
    document.getElementById("app").innerHTML =
      header() +
      `<main><div class="container"><div class="empty-state"><h2>Offre introuvable</h2><p>${esc(offersLoadError || "Cette offre n’existe plus ou n’est plus disponible.")}</p><a class="btn btn-blue" href="${root}accueil.html">Retour à l’accueil</a></div></div></main>` +
      footer();
    return;
  }
  document.title = d.title + " | Atlas Voyage";
  document.getElementById("app").innerHTML =
    header(d.type) +
    `<main id="main-content"><div class="container"><div class="page-intro"><div class="breadcrumb"><a href="${root}accueil.html">Accueil</a> / <a href="${root}catalogue.html">Offres</a> / ${esc(d.city)}</div><h1>${esc(d.title)}</h1><p>${icon("pin")} ${esc(d.city)}${d.district ? `, ${esc(d.district)}` : ""}${d.stars ? ` · ${"★".repeat(d.stars)}` : ""}</p>${detailFavButton(d.id)}</div><div class="detail-grid"><div><div class="gallery" id="offer-gallery"><img src="${esc(d.img)}" alt="${esc(d.title)}" class="gallery-thumb"><img src="images/fes.jpg" alt="Architecture marocaine" class="gallery-thumb"><img src="images/chefchaouen.jpg" alt="Paysage marocain" class="gallery-thumb"></div><div class="detail-copy"><h2>Votre séjour, notre attention</h2><p>${esc(d.desc)}</p><div class="amenities"><span>✓ Disponibilités vérifiées selon vos dates</span><span>✓ Assistance locale</span>${d.allowsPayOnArrival ? "<span>✓ Paiement à l’arrivée</span>" : ""}<span>✓ Fournisseur : ${esc(d.supplierName)}</span></div><h2>Localisation</h2><p>${d.district ? `${esc(d.district)}, ` : ""}${esc(d.city)}, Maroc.</p><div id="offer-map-container" class="av-map-container" style="margin-top:16px;"><div id="offer-map" class="av-map"></div></div></div></div><aside class="panel booking-box">${d.allowsPayOnArrival ? '<span class="badge">✓ Paiement à l’arrivée disponible</span>' : ""}<p style="margin:21px 0 4px;color:var(--muted)">À partir de</p><div class="result-price">${money(d.price)}</div><p class="price-note">${d.nextAvailabilityStart ? `Prochaine disponibilité : ${new Date(d.nextAvailabilityStart).toLocaleDateString("fr-MA")} au ${new Date(d.nextAvailabilityEnd).toLocaleDateString("fr-MA")}` : "Aucune période disponible"}</p><label for="start-date">Date de début</label><input id="start-date" type="date"><label for="end-date">Date de fin</label><input id="end-date" type="date"><label for="booking-travelers">Voyageurs / participants</label><input id="booking-travelers" type="number" min="1" max="100" value="1">${d.type === "Location de voiture" ? `<label for="booking-driver-age">Âge du conducteur</label><input id="booking-driver-age" type="number" min="${d.minimumDriverAge}" max="${d.maximumDriverAge}" value="35"><label>Prise en charge<input id="booking-pickup" value="${esc(d.pickupLocation)}" readonly></label><label>Restitution<select id="booking-dropoff"><option value="">Même lieu</option>${d.allowsDifferentDropoff ? d.dropoffLocations.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("") : ""}</select></label>` : ""}<button class="btn btn-outline" id="add-cart">${icon("cart")} Ajouter au panier</button><button class="btn btn-yellow" id="book-now">Réserver maintenant ${icon("arrow")}</button></aside></div><div id="offer-reviews-section" style="margin-top:48px;"></div></div></main>` +
    footer();
  const suggestedStart = detailParams.get("start") || detailParams.get("hotelArrival") || detailParams.get("flightDepart") ||
    detailParams.get("pickupDate") || detailParams.get("taxiDeparture")?.slice(0, 10) ||
    detailParams.get("excursionDate") || "";
  const suggestedEnd = detailParams.get("end") || detailParams.get("hotelDeparture") || detailParams.get("flightReturn") ||
    detailParams.get("returnDate") || detailParams.get("taxiReturn")?.slice(0, 10) || "";
  document.getElementById("start-date").value = suggestedStart || d.departureDateTime?.slice(0,10) || "";
  document.getElementById("booking-travelers").value = Number(detailParams.get("travelers") || detailParams.get("passengers") || detailParams.get("hotelAdults") || detailParams.get("taxiPassengers") || detailParams.get("excursionGuests")) || 1;
  document.getElementById("end-date").value = suggestedEnd || d.returnDepartureDateTime?.slice(0,10) || "";
  // Un invité est envoyé se connecter puis ramené sur cette offre, avec les dates et le nombre de voyageurs saisis.
  function redirectToLogin() {
    const params = new URLSearchParams(location.search);
    [["start", "start-date"], ["end", "end-date"], ["travelers", "booking-travelers"]].forEach(([param, inputId]) => {
      const value = document.getElementById(inputId).value;
      if (value) params.set(param, value);
    });
    const target = `${location.pathname.split("/").pop()}?${params}`;
    location.href = `${root}connexion.html?redirect=${encodeURIComponent(target)}`;
  }
  async function add(go) {
    const user = loggedUser();
    if (!user) {
      redirectToLogin();
      return;
    }
    if (user.role !== "CLIENT") {
      toast("Seuls les comptes clients peuvent réserver. Connectez-vous avec un compte client.");
      return;
    }
    let start = document.getElementById("start-date").value,
      end = document.getElementById("end-date").value;
    if (start && end && end < start) {
      toast("La date de retour doit suivre la date de départ.");
      return;
    }
    try {
      const criteria = Object.fromEntries(detailParams);
      delete criteria.id;
      if (!start || (["Hôtels & Riads", "Location de voiture"].includes(d.type) && !end)) { toast("Choisissez les dates du service avant de réserver."); return; }
      let startDate = start, endDate = end;
      if (d.type === "Location de voiture") {
        startDate += "T" + (criteria.pickupTime || "10:00");
        if (endDate) endDate += "T" + (criteria.returnTime || "10:00");
        criteria.driverAge = document.getElementById("booking-driver-age").value;
        criteria.pickup = document.getElementById("booking-pickup").value;
        criteria.dropoff = document.getElementById("booking-dropoff").value || criteria.pickup;
      }
      if (d.type === "Taxi/Transferts") {
        startDate += "T" + (criteria.taxiDeparture?.slice(11,16) || "12:00");
        if (endDate) endDate += "T" + (criteria.taxiReturn?.slice(11,16) || "12:00");
      }
      if (d.type === "Vols") { criteria.trip = d.roundTrip ? "round" : "oneway"; criteria.cabinClass = d.cabinClass; }
      const travelers = Number(document.getElementById("booking-travelers").value);
      if (!Number.isInteger(travelers) || travelers < 1) { toast("Indiquez un nombre de voyageurs positif."); return; }
      await addItem(d, { ...criteria, travelers, startDate, endDate, start, end });
      if (go) location.href = cartUrl();
    } catch (error) {
      toast(error.message);
    }
  }
  document.getElementById("add-cart").onclick = () => add(false);
  document.getElementById("book-now").onclick = () => add(true);

  // 1. Galerie Lightbox Accessible
  const galleryImages = [
    { src: d.img, alt: d.title, caption: d.title },
    { src: "images/fes.jpg", alt: "Architecture marocaine", caption: "Patio traditionnel et zellige raffiné" },
    { src: "images/chefchaouen.jpg", alt: "Paysage marocain", caption: "Vue panoramique sur les ruelles bleues" }
  ];
  const LightboxClass = window.AtlasLightbox || (typeof AtlasLightbox !== "undefined" ? AtlasLightbox : null);
  if (LightboxClass) {
    const lb = new LightboxClass();
    document.querySelectorAll(".gallery-thumb").forEach((img, idx) => {
      img.style.cursor = "zoom-in";
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", `Agrandir la photo ${idx + 1} : ${galleryImages[idx]?.caption || d.title}`);
      const open = () => lb.open(galleryImages, idx, img);
      img.addEventListener("click", open);
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  // 2. Carte Géographique Leaflet
  const cityCoords = {
    "Marrakech": [31.6295, -7.9811],
    "Fès": [34.0331, -5.0003],
    "Chefchaouen": [35.1688, -5.2636],
    "Essaouira": [31.5085, -9.7595],
    "Tanger": [35.7595, -5.8340],
    "Casablanca": [33.5731, -7.5898],
    "Rabat": [34.0209, -6.8416],
    "Agadir": [30.4278, -9.5981],
    "Ouarzazate": [30.9335, -6.9370]
  };
  const coords = cityCoords[d.city] || [31.6295, -7.9811];
  if (window.initOfferMap) {
    window.initOfferMap("offer-map", {
      lat: coords[0],
      lng: coords[1],
      title: d.title,
      address: `${d.district ? d.district + ", " : ""}${d.city}, Maroc`
    });
  }

  // 3. Module d'Avis & Notations
  const ReviewsClass = window.AtlasReviews || (typeof AtlasReviews !== "undefined" ? AtlasReviews : null);
  if (ReviewsClass) {
    const rev = new ReviewsClass("offer-reviews-section", d.id, loggedUser());
    rev.init();
  }
}
function checkout() {
  document.getElementById("app").innerHTML =
    header() +
    `<main id="main-content" class="container section">
      <nav class="av-stepper" aria-label="Étapes de votre réservation" style="margin: 24px 0 32px 0;">
        <div class="av-stepper-progress"><div class="av-stepper-progress-bar" style="width: 35%;"></div></div>
        <div class="av-step is-completed"><div class="av-step-number">✓</div><div class="av-step-label">1. Panier</div></div>
        <div class="av-step is-active"><div class="av-step-number">2</div><div class="av-step-label">2. Coordonnées</div></div>
        <div class="av-step"><div class="av-step-number">3</div><div class="av-step-label">3. Paiement</div></div>
        <div class="av-step"><div class="av-step-number">4</div><div class="av-step-label">4. Confirmation</div></div>
      </nav>
      <div id="booking-module"></div>
    </main>` +
    footer();
  BookingsUI.checkout(document.getElementById("booking-module"));
}
function admin() {
  document.getElementById("app").innerHTML =
    `<div class="admin-shell"><aside class="admin-sidebar"><a class="brand" href="${root}accueil.html"><img src="${root}images/logo.png" alt="Atlas Voyage" class="brand-logo"></a><nav>${[
      ["Dashboard", "chart"],
      ["Villes", "pin"],
      ["Offres", "compass"],
      ["Réservations", "calendar"],
      ["Bundles", "cart"],
      ["Utilisateurs", "users"],
    ]
      .map(
        ([n, i], j) =>
          `<a href="#${n}" data-tab="${n}" class="${j === 0 ? "active" : ""}">${icon(i)} ${n}</a>`,
      )
      .join(
        "",
      )}</nav><a class="back-link" href="${root}accueil.html">← Retour au site</a></aside><main class="admin-content"><div class="admin-header"><div><h1 id="admin-title">Tableau de bord</h1><p>Bienvenue dans votre espace Atlas Voyage.</p></div><div class="admin-avatar">AV</div></div><div id="admin-view"></div></main></div>`;
  let bookings = JSON.parse(localStorage.getItem("atlas-bookings") || "[]");
  let demo = [
    {
      ref: "AV-104278",
      client: "Sarah Benali",
      total: 2580,
      status: "Confirmed",
      items: [{ id: "marrakech" }],
      created: "2026-09-26",
    },
    {
      ref: "AV-104279",
      client: "Youssef Amrani",
      total: 890,
      status: "Pending",
      items: [{ id: "chefchaouen" }],
      created: "2026-09-26",
    },
    {
      ref: "AV-104280",
      client: "Emma Laurent",
      total: 1860,
      status: "Confirmed",
      items: [{ id: "fes" }],
      created: "2026-09-25",
    },
  ];
  function table(rows) {
    return `<div class="admin-table-wrap"><div class="table-head"><h2>Réservations récentes</h2><span style="color:var(--muted)">${rows.length} réservations</span></div><table><thead><tr><th>ID</th><th>Client</th><th>Offre</th><th>Montant</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows.map((b) => `<tr><td><strong>${b.ref}</strong></td><td>${b.client}</td><td>${data.find((x) => x.id === b.items[0]?.id)?.title || "Séjour"}</td><td>${money(b.total)}</td><td><span class="status ${b.status === "Confirmed" ? "confirmed" : "pending"}">${b.status === "Confirmed" ? "Confirmée" : "En attente"}</span></td><td><button class="btn btn-light" data-view="${b.ref}" style="padding:6px 11px">Voir</button></td></tr>`).join("")}</tbody></table></div>`;
  }
  function render(tab) {
    let all = [...bookings, ...demo];
    document
      .querySelectorAll("[data-tab]")
      .forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    document.getElementById("admin-title").textContent =
      tab === "Dashboard" ? "Tableau de bord" : tab;
    if (tab === "Dashboard") {
      let today = bookings.filter((b) =>
        b.created?.startsWith(new Date().toISOString().slice(0, 10)),
      );
      document.getElementById("admin-view").innerHTML =
        `<div class="stats-grid"><div class="stat">${icon("wallet")}<small>Revenus du jour</small><strong>${money(today.reduce((n, b) => n + b.total, 0) + 3470)}</strong></div><div class="stat">${icon("calendar")}<small>Réservations</small><strong>${all.length}</strong></div><div class="stat">${icon("chart")}<small>Taux de conversion</small><strong>4,8 %</strong></div></div>${table(all)}`;
    } else if (tab === "Réservations") {
      document.getElementById("admin-view").innerHTML = table(all);
    } else if (tab === "Offres") {
      document.getElementById("admin-view").innerHTML =
        `<div class="admin-tabs"><button class="active" data-offer-tab="all">Toutes les offres</button><button data-offer-tab="stay">Hébergements</button><button data-offer-tab="other">Expériences</button></div><div id="admin-offers"></div>`;
      function renderOffers(filter) {
        document
          .querySelectorAll("[data-offer-tab]")
          .forEach((b) =>
            b.classList.toggle("active", b.dataset.offerTab === filter),
          );
        document.getElementById("admin-offers").innerHTML =
          `<div class="admin-table-wrap"><table><thead><tr><th>Offre</th><th>Ville</th><th>Type</th><th>Prix</th></tr></thead><tbody>${data
            .filter(
              (d) =>
                filter === "all" ||
                (filter === "stay") === (d.type === "Hôtels & Riads"),
            )
            .map(
              (d) =>
                `<tr><td><strong>${d.title}</strong></td><td>${d.city}</td><td>${d.type}</td><td>${money(d.price)}</td></tr>`,
            )
            .join("")}</tbody></table></div>`;
      }
      document
        .querySelectorAll("[data-offer-tab]")
        .forEach((b) => (b.onclick = () => renderOffers(b.dataset.offerTab)));
      renderOffers("all");
    } else if (tab === "Bundles") {
      document.getElementById("admin-view").innerHTML =
        `<div class="admin-table-wrap"><div class="table-head"><h2>Idées de voyages combinés</h2></div><table><thead><tr><th>Bundle</th><th>Comprend</th><th>Prix indicatif</th></tr></thead><tbody><tr><td>Séjour ville ocre</td><td>Vol + riad + excursion</td><td>${money(4390)}</td></tr><tr><td>Escapade bleue</td><td>Riad + transfert</td><td>${money(1210)}</td></tr></tbody></table></div>`;
    } else if (tab === "Utilisateurs") {
      document.getElementById("admin-view").innerHTML =
        `<div class="admin-table-wrap"><div class="table-head"><h2>Utilisateurs (base de données)</h2><span id="users-count" style="color:var(--muted)">Chargement…</span></div><table><thead><tr><th>Nom</th><th>Email</th><th>Rôle</th></tr></thead><tbody id="users-tbody"><tr><td colspan="3">Chargement des utilisateurs…</td></tr></tbody></table></div>`;
      const roleLabel = (r) =>
        ({ CLIENT: "Client", SUPPLIER: "Fournisseur", AGENT: "Agent", ADMIN: "Administrateur" })[r] || r;
      fetch(`${apiBase()}/api/users`)
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then((users) => {
          document.getElementById("users-count").textContent =
            `${users.length} utilisateurs`;
          document.getElementById("users-tbody").innerHTML = users
            .map(
              (u) =>
                `<tr><td><strong>${u.fullName}</strong></td><td>${u.email}</td><td><span class="badge">${roleLabel(u.role)}</span></td></tr>`,
            )
            .join("");
        })
        .catch((err) => {
          document.getElementById("users-count").textContent = "Erreur";
          document.getElementById("users-tbody").innerHTML =
            `<tr><td colspan="3">Impossible de charger les utilisateurs depuis l'API (${err.message}). Vérifiez que le backend est démarré sur le port 8080.</td></tr>`;
        });
    } else {
      document.getElementById("admin-view").innerHTML =
        `<div class="admin-table-wrap"><div class="table-head"><h2>Voyageurs récents</h2></div><table><thead><tr><th>Client</th><th>Référence</th><th>Montant</th></tr></thead><tbody>${all.map((b) => `<tr><td>${b.client}</td><td>${b.ref}</td><td>${money(b.total)}</td></tr>`).join("")}</tbody></table></div>`;
    }
    document.querySelectorAll("[data-view]").forEach(
      (b) =>
        (b.onclick = () => {
          let row = all.find((x) => x.ref === b.dataset.view);
          if (row)
            toast(
              `${row.ref} · ${row.client} · ${money(row.total)} · ${row.status === "Confirmed" ? "Confirmée" : "En attente"}`,
            );
        }),
    );
  }
  document.querySelectorAll("[data-tab]").forEach(
    (a) =>
      (a.onclick = (e) => {
        e.preventDefault();
        render(a.dataset.tab);
      }),
  );
  render("Dashboard");
}
const page = document.body.dataset.page;
async function renderActiveView() {
  if (["home", "catalogue", "detail", "checkout"].includes(page)) {
    await loadPublicOffers();
  }
  if (page === "home") home();
  if (page === "catalogue") catalogue();
  if (page === "detail") detail();
  if (page === "checkout") checkout();
  await refreshCart();
  if (typeof I18n !== "undefined") I18n.bindLanguageSwitcher();
  if (typeof AtlasCurrency !== "undefined") AtlasCurrency.bindCurrencySwitcher();
}

async function startApplication() {
  if (typeof I18n !== "undefined") {
    await I18n.init({ namespaces: ["common", "nav", "home", "catalog", "offer", "cart", "checkout", "auth", "errors", "status"] });
  }
  if (typeof AtlasCurrency !== "undefined") {
    AtlasCurrency.init();
  }
  await renderActiveView();
}
startApplication();

window.addEventListener("i18n:change", () => {
  renderActiveView();
});
window.addEventListener("currency:change", () => {
  renderActiveView();
});

document.addEventListener("click", (e) => {
  const box = document.getElementById("locale");
  if (!box) return;
  const btn = e.target.closest(".locale-btn");
  if (btn) {
    const o = box.classList.toggle("open");
    btn.setAttribute("aria-expanded", o);
    return;
  }
  const c = e.target.closest("[data-cur]");
  if (c) {
    localStorage.setItem("atlas-cur", c.dataset.cur);
    location.reload();
    return;
  }
  if (!e.target.closest(".locale")) box.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape")
    document.getElementById("locale")?.classList.remove("open");
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#logout-link")) {
    event.preventDefault();
    Auth.logout();
  }
});

// Phase 8: Synchronisation dynamique des favoris dans le catalogue et les pages publiques
window.addEventListener("atlas:favorites-changed", (event) => {
  const { offerId, isFavorite } = event.detail || {};
  if (offerId == null) return;
  document.querySelectorAll(`[data-fav-offer="${offerId}"]`).forEach((btn) => {
    btn.classList.toggle("active", !!isFavorite);
    const svg = btn.querySelector("svg");
    if (svg) {
      svg.setAttribute("fill", isFavorite ? "#e11d48" : "none");
    }
    const label = btn.querySelector("span");
    if (label) {
      label.textContent = isFavorite ? "Dans vos favoris" : "Ajouter aux favoris";
    }
    btn.setAttribute("aria-label", isFavorite ? "Retirer des favoris" : "Ajouter aux favoris");
  });
});

window.addEventListener("atlas:favorites-loaded", (event) => {
  const ids = event.detail?.ids || [];
  const set = new Set(ids);
  document.querySelectorAll("[data-fav-offer]").forEach((btn) => {
    const id = Number(btn.dataset.favOffer);
    const isFav = set.has(id);
    btn.classList.toggle("active", isFav);
    const svg = btn.querySelector("svg");
    if (svg) {
      svg.setAttribute("fill", isFav ? "#e11d48" : "none");
    }
    const label = btn.querySelector("span");
    if (label) {
      label.textContent = isFav ? "Dans vos favoris" : "Ajouter aux favoris";
    }
    btn.setAttribute("aria-label", isFav ? "Retirer des favoris" : "Ajouter aux favoris");
  });
});

if (typeof Favorites !== "undefined" && Favorites.canFavorite()) {
  Favorites.load();
}
