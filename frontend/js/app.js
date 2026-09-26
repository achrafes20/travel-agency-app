const root = "./";
const data = [
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
const CUR = { MAD: 1, EUR: 0.092, USD: 0.1 };
const curCode = () => localStorage.getItem("atlas-cur") || "MAD";
const langCode = () => localStorage.getItem("atlas-lang") || "fr";
const money = (n) => {
  const c = curCode();
  return (
    new Intl.NumberFormat("fr-MA", {
      maximumFractionDigits: c === "MAD" ? 0 : 2,
    }).format(Math.round(n * CUR[c] * 100) / 100) +
    " " +
    c
  );
};
const icon = (name) => {
  const paths = {
    plane: '<path d="M22 2 9.5 14.5M22 2l-7 20-4-9-9-4 20-7Z"/>',
    bed: '<path d="M3 18V5M3 13h18v5M21 18V9a3 3 0 0 0-3-3H7a4 4 0 0 0-4 4v3M3 18v2m18-2v2"/>',
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
const nav = [
  ["Vols", "plane"],
  ["Hôtels & Riads", "bed"],
  ["Location de voiture", "car"],
  ["Taxi/Transferts", "taxi"],
  ["Excursions", "compass"],
];
function header(active = "") {
  return `<header><div class="topbar"><div class="container"><a class="brand" href="${root}index.html"><img src="${root}images/logo.png" alt="Atlas Voyage" class="brand-logo"></a><div class="top-actions"><div class="locale" id="locale"><button type="button" class="locale-btn" aria-haspopup="true" aria-expanded="false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg><span id="locale-label">${{ fr: "FR", ar: "AR", en: "EN" }[langCode()]} · ${curCode()}</span><svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg></button><div class="locale-menu" role="menu"><div class="locale-title">Langue</div>${[
    ["fr", "🇫🇷", "Français"],
    ["ar", "🇲🇦", 'العربية <small class="rtl-tag">RTL</small>'],
    ["en", "🇬🇧", "English"],
  ]
    .map(
      ([c, f, l]) =>
        `<button type="button" data-lang="${c}" class="${langCode() === c ? "on" : ""}">${f} ${l}</button>`,
    )
    .join(
      "",
    )}<div class="locale-title">Devise</div><div class="cur-row">${Object.keys(
    CUR,
  )
    .map(
      (c) =>
        `<button type="button" data-cur="${c}" class="${curCode() === c ? "on" : ""}">${c}</button>`,
    )
    .join(
      "",
    )}</div></div></div><a class="cart-link" href="${root}panier.html">${icon("cart")} Panier <span class="cart-count" id="cart-count">0</span></a><a class="agent-link" href="${root}agent.html">Espace agent</a></div></div></div><nav class="main-nav"><div class="container">${nav.map(([text, i]) => `<a class="${active === text ? "active" : ""}" href="${root}catalogue.html?type=${encodeURIComponent(text)}">${icon(i)}${text}</a>`).join("")}</div></nav></header>`;
}
function footer() {
  return `<footer><div class="container"><div class="footer-row"><div><a class="brand" href="${root}index.html"><img src="${root}images/logo.png" alt="Atlas Voyage" class="brand-logo"></a><p>Le Maroc, à votre manière. Des voyages soigneusement imaginés et un accueil qui vient du cœur.</p></div><div class="foot-links"><a href="${root}catalogue.html">Découvrir les offres</a><a href="${root}panier.html">Mon panier</a><a href="${root}agent.html">Espace agent</a></div></div><div class="copyright">© 2026 Atlas Voyage · Créé avec hospitalité au Maroc</div></div></footer>`;
}
function searchBar() {
  const p = new URLSearchParams(location.search);
  let dates = JSON.parse(sessionStorage.getItem("atlas-search") || "{}");
  const dateValue = (v) => v || "";
  return `<form class="search-bar" action="${root}catalogue.html"><div class="search-field destination">${icon("pin")}<div><label for="destination">Destination</label><select id="destination" name="destination"><option value="">Toutes les destinations</option>${["Chefchaouen", "Marrakech", "Fès", "Essaouira", "Tanger"].map((c) => `<option ${p.get("destination") === c || dates.destination === c ? "selected" : ""}>${c}</option>`).join("")}</select></div></div><div class="search-field">${icon("calendar")}<div><label for="depart">Date de départ</label><input id="depart" name="depart" type="date" value="${dateValue(p.get("depart") || dates.depart)}"></div></div><div class="search-field">${icon("calendar")}<div><label for="retour">Date de retour</label><input id="retour" name="retour" type="date" value="${dateValue(p.get("retour") || dates.retour)}"></div></div><div class="search-field">${icon("users")}<div><label for="voyageurs">Voyageurs</label><select id="voyageurs" name="voyageurs">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${Number(p.get("voyageurs") || dates.voyageurs || 2) === n ? "selected" : ""}>${n} voyageur${n > 1 ? "s" : ""}</option>`).join("")}</select></div></div><button class="btn btn-yellow" type="submit">${icon("search")} Rechercher</button></form>`;
}
function card(d) {
  return `<a class="dest-card" href="${root}offre.html?id=${d.id}"><img src="${d.img}" alt="${d.city}" loading="lazy"><div class="dest-card-body"><h3>${d.city}</h3><p>${d.district} · Une invitation au voyage</p><div class="price">À partir de <strong>${money(d.price)}</strong></div></div></a>`;
}
function home() {
  document.getElementById("app").innerHTML =
    header("Hôtels & Riads") +
    `<main><section class="hero"><div class="container"><div class="eyebrow">L’ÉVASION COMMENCE ICI</div><h1>Le Maroc vous attend.<br>Vivez-le pleinement.</h1><p>Des ruelles bleues aux dunes dorées, trouvez le voyage qui vous ressemble avec Atlas Voyage.</p></div></section><div class="container search-wrap">${searchBar()}</div><div class="container"><div class="social-proof"><span class="sp-stars" style="color:#feba02">★★★★★</span> <strong>4.6/5</strong> <span style="color:#666">· 12 000 avis voyageurs</span><span class="sp-sep"></span><span class="sp-seen">Vu dans</span><span class="sp-logo">Le Matin</span><span class="sp-logo">TelQuel</span><span class="sp-logo">Hespress</span><span class="sp-logo">Qualité Tourisme</span></div><div class="quick-row">${nav.map(([t, i]) => `<a class="quick" href="${root}catalogue.html?type=${encodeURIComponent(t)}"><span class="quick-ico">${icon(i)}</span><span>${t}</span></a>`).join("")}</div></div><section class="section"><div class="container"><div class="section-head"><div><h2>Destinations populaires</h2><p>Le meilleur du Maroc, à portée de clic.</p></div><a class="text-link" href="${root}catalogue.html">Explorer toutes les offres →</a></div><div class="dest-grid">${data.slice(0, 4).map(card).join("")}</div></div></section><div class="zellige-divider" aria-hidden="true"></div><section class="trust-band"><div class="container trust-grid"><div class="trust">${icon("wallet")}<div><strong>Paiement à l’arrivée disponible</strong><span>Réservez l’esprit tranquille</span></div></div><div class="trust">${icon("shield")}<div><strong>Annulation gratuite</strong><span>Sur une sélection d’offres</span></div></div><div class="trust">${icon("headset")}<div><strong>Support client local</strong><span>Une équipe qui connaît le Maroc</span></div></div></div></section><section class="feature-banner"><div class="container"><div><h2>Votre prochain souvenir commence ici.</h2><p>Riads, excursions et découvertes : à vous de choisir.</p></div><a class="btn btn-ghost" href="${root}catalogue.html">Découvrir les offres ${icon("arrow")}</a></div></section></main>` +
    footer();
    bindSearch();

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
function bindSearch() {
  const f = document.querySelector(".search-bar");
  if (!f) return;
  f.addEventListener("submit", (e) => {
    let depart = f.querySelector("#depart").value,
      retour = f.querySelector("#retour").value;
    if (depart && retour && retour < depart) {
      e.preventDefault();
      toast("La date de retour doit suivre la date de départ.");
      return;
    }
    sessionStorage.setItem(
      "atlas-search",
      JSON.stringify(Object.fromEntries(new FormData(f))),
    );
  });
}
function resultCard(d) {
  return `<article class="result-card"><img src="${d.img}" alt="${d.city}" loading="lazy"><div class="result-main"><h3>${d.title}</h3><p>${icon("pin")} ${d.city} · ${d.district} &nbsp;·&nbsp; ${"★".repeat(d.stars)}</p><span class="badge">✓ Paiement à l’arrivée</span><p class="description">${d.desc}</p></div><div class="result-side"><div class="rating">Excellent <b>${d.rating}</b></div><div><small>À partir de / séjour</small><div class="result-price">${money(d.price)}</div></div><a class="btn btn-blue" href="${root}offre.html?id=${d.id}">Voir détails</a></div></article>`;
}
function catalogue() {
  const p = new URLSearchParams(location.search);
  let dest = p.get("destination") || "",
    type = p.get("type") || "",
    page = 1;
  document.getElementById("app").innerHTML =
    header(type) +
    `<main><div class="container"><div class="page-intro"><div class="breadcrumb"><a href="${root}index.html">Accueil</a> / Résultats de recherche</div><h1>Explorez nos offres${dest ? " à " + dest : ""}</h1><p>Votre prochaine aventure au Maroc commence ici.</p></div><div class="results-layout"><aside class="filter-panel"><h3>Filtrer les résultats</h3><div class="filter-block"><h4>Prix maximum</h4><input id="price-filter" type="range" min="300" max="2000" step="50" value="2000"><div class="range-values"><span>300 MAD</span><span id="price-value">2 000 MAD</span></div></div><div class="filter-block"><h4>Type d’offre</h4>${nav.map(([n]) => `<label><input type="checkbox" name="type" value="${n}" ${type === n ? "checked" : ""}>${n}</label>`).join("")}</div><div class="filter-block"><h4>Étoiles</h4><label><input type="checkbox" name="stars" value="5"> 5 étoiles</label><label><input type="checkbox" name="stars" value="4"> 4 étoiles</label></div><div class="filter-block"><h4>Ville / quartier</h4><select id="city-filter"><option value="">Toutes les villes</option>${["Chefchaouen", "Marrakech", "Fès", "Essaouira", "Tanger"].map((c) => `<option ${dest === c ? "selected" : ""}>${c}</option>`).join("")}</select></div><button class="btn btn-light" id="clear-filters" style="width:100%">Effacer les filtres</button></aside><div><div class="result-top"><h2 id="result-count"></h2><select id="sort"><option value="relevant">Trier : Pertinence</option><option value="price">Prix croissant</option></select></div><div class="result-list" id="result-list"></div><div class="pagination" id="pagination"></div></div></div></div></main>` +
    footer();
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
    if (document.getElementById("sort").value === "price")
      list.sort((a, b) => a.price - b.price);
    else
      list.sort(
        (a, b) =>
          parseFloat(b.rating.replace(",", ".")) -
          parseFloat(a.rating.replace(",", ".")),
      );
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
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("atlas-cart") || "[]");
  } catch {
    return [];
  }
}
function saveCart(v) {
  localStorage.setItem("atlas-cart", JSON.stringify(v));
  refreshCart();
}
function refreshCart() {
  document
    .querySelectorAll("#cart-count")
    .forEach((el) => (el.textContent = getCart().length));
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
function addItem(d, dates) {
  let items = getCart();
  items.push({ id: d.id, dates, entry: Date.now() });
  saveCart(items);
  toast("Offre ajoutée au panier");
}
function detail() {
  let id = new URLSearchParams(location.search).get("id"),
    d = data.find((x) => x.id === id) || data[0];
  document.title = d.title + " | Atlas Voyage";
  document.getElementById("app").innerHTML =
    header(d.type) +
    `<main><div class="container"><div class="page-intro"><div class="breadcrumb"><a href="${root}index.html">Accueil</a> / <a href="${root}catalogue.html">Offres</a> / ${d.city}</div><h1>${d.title}</h1><p>${icon("pin")} ${d.city}, ${d.district} · ${"★".repeat(d.stars)} · Excellent ${d.rating}/10</p></div><div class="detail-grid"><div><div class="gallery"><img src="${d.img}" alt="${d.title}"><img src="images/fes.jpg" alt="Architecture marocaine"><img src="images/chefchaouen.jpg" alt="Paysage marocain"></div><div class="detail-copy"><h2>Votre séjour, notre attention</h2><p>${d.desc} Chez Atlas Voyage, chaque étape est pensée pour vous faire découvrir l’hospitalité marocaine dans toute sa générosité. Profitez de moments authentiques, des médinas animées aux paysages qui invitent à ralentir.</p><div class="amenities"><span>✓ Accueil chaleureux</span><span>✓ Assistance locale</span><span>✓ Paiement à l’arrivée</span><span>✓ Confirmation immédiate</span></div><h2>Localisation</h2><p>${d.district}, ${d.city}, Maroc. Un point de départ idéal pour explorer les trésors de la région.</p><h2>Avis des voyageurs</h2><div class="review"><strong>« Une expérience inoubliable » &nbsp; ${d.rating}/10</strong><p>Un accueil formidable et une organisation impeccable. Nous avons adoré découvrir le Maroc à notre rythme.</p><small>— Voyageur Atlas Voyage</small></div></div></div><aside class="panel booking-box"><span class="badge">✓ Paiement à l’arrivée disponible</span><p style="margin:21px 0 4px;color:var(--muted)">À partir de / séjour</p><div class="result-price">${money(d.price)}</div><label for="start-date">Date de départ</label><input id="start-date" type="date"><label for="end-date">Date de retour</label><input id="end-date" type="date"><button class="btn btn-outline" id="add-cart">${icon("cart")} Ajouter au panier</button><button class="btn btn-yellow" id="book-now">Réserver maintenant ${icon("arrow")}</button><span class="price-note">Aucun paiement requis pour réserver</span></aside></div></div></main>` +
    footer();
  function add(go) {
    let start = document.getElementById("start-date").value,
      end = document.getElementById("end-date").value;
    if (start && end && end < start) {
      toast("La date de retour doit suivre la date de départ.");
      return;
    }
    addItem(d, { start, end });
    if (go) location.href = root + "panier.html";
  }
  document.getElementById("add-cart").onclick = () => add(false);
  document.getElementById("book-now").onclick = () => add(true);
}
function checkout() {
  document.getElementById("app").innerHTML =
    header() +
    `<main><div class="container"><div class="page-intro"><div class="breadcrumb"><a href="${root}index.html">Accueil</a> / Mon panier</div><h1>Votre panier</h1><p>Un dernier regard avant de prendre la route.</p></div><div id="checkout-content"></div></div></main>` +
    footer();
  function render() {
    let items = getCart();
    if (!items.length) {
      document.getElementById("checkout-content").innerHTML =
        `<div class="panel confirmation" style="margin-bottom:70px"><h2>Votre panier est vide</h2><p>Le Maroc a tant à vous offrir. Trouvez votre prochaine expérience !</p><a class="btn btn-yellow" href="${root}catalogue.html">Explorer les offres</a></div>`;
      return;
    }
    let sum = items.reduce(
      (a, item) => a + (data.find((x) => x.id === item.id)?.price || 0),
      0,
    );
    document.getElementById("checkout-content").innerHTML =
      `<div class="checkout-grid"><div><section class="panel"><h2>Votre sélection (${items.length})</h2>${items
        .map((item, i) => {
          let d = data.find((x) => x.id === item.id);
          return d
            ? `<div class="cart-item"><img src="${d.img}" alt="${d.city}"><div><h3>${d.title}</h3><p>${d.city} · ${d.type}${item.dates?.start ? " · " + new Date(item.dates.start + "T12:00:00").toLocaleDateString("fr-MA") : ""}</p><strong>${money(d.price)}</strong></div><button aria-label="Retirer ${d.title}" data-remove="${i}">✕</button></div>`
            : "";
        })
        .join(
          "",
        )}</section><section class="panel" style="margin-top:18px"><h2>Mode de paiement</h2><label class="pay-choice"><input type="radio" name="payment" value="now" checked> Payer maintenant (simulé)</label><label class="pay-choice"><input type="radio" name="payment" value="arrival"> Paiement à l’arrivée</label></section><section class="panel checkout-form" style="margin-top:18px"><h2>Vos coordonnées</h2><label for="customer-name">Nom complet</label><input id="customer-name" placeholder="Votre nom complet" required><label for="customer-email">Adresse e-mail</label><input id="customer-email" type="email" placeholder="nom@exemple.com" required><label for="customer-phone">Téléphone (+212)</label><input id="customer-phone" type="tel" placeholder="+212 6 00 00 00 00" required></section></div><aside class="panel" style="align-self:start"><h2>Résumé du prix</h2><label style="display:block;font-weight:700;margin:22px 0 8px" for="promo">Code promo</label><div class="promo-row"><input id="promo" placeholder="Votre code promo"><button class="btn btn-outline" id="apply-promo">Appliquer</button></div><p id="promo-message" style="font-size:12px;color:var(--muted);min-height:16px"></p><div class="summary-row"><span>Sous-total</span><strong>${money(sum)}</strong></div><div class="summary-row"><span>Réduction</span><strong id="discount">0 MAD</strong></div><div class="summary-row total"><span>Total</span><strong id="total">${money(sum)}</strong></div><button class="btn btn-yellow" id="confirm" style="width:100%;margin-top:12px">Confirmer la réservation</button><p class="price-note" style="text-align:center">Paiement simulé · Aucun prélèvement effectué</p></aside></div>`;
    let discount = 0;
    document.querySelectorAll("[data-remove]").forEach(
      (b) =>
        (b.onclick = () => {
          let next = getCart();
          next.splice(+b.dataset.remove, 1);
          saveCart(next);
          render();
        }),
    );
    document.getElementById("apply-promo").onclick = () => {
      let code = document.getElementById("promo").value.trim().toUpperCase();
      discount = code === "ATLAS10" ? Math.round(sum * 0.1) : 0;
      document.getElementById("promo-message").textContent = discount
        ? "Code ATLAS10 appliqué : -10 %"
        : "Code promo non reconnu.";
      document.getElementById("discount").textContent = money(discount);
      document.getElementById("total").textContent = money(sum - discount);
    };
    document.getElementById("confirm").onclick = () => {
      let name = document.getElementById("customer-name"),
        email = document.getElementById("customer-email"),
        phone = document.getElementById("customer-phone");
      if (
        !name.value.trim() ||
        !email.checkValidity() ||
        !email.value ||
        !phone.value.trim()
      ) {
        toast("Veuillez renseigner vos coordonnées valides.");
        return;
      }
      let payment = document.querySelector("[name=payment]:checked").value;
      let ref = "AV-" + Math.floor(100000 + Math.random() * 900000),
        booking = {
          ref,
          client: name.value.trim(),
          email: email.value,
          phone: phone.value,
          total: sum - discount,
          payment,
          items,
          status: "Confirmed",
          created: new Date().toISOString(),
        };
      let bookings = JSON.parse(localStorage.getItem("atlas-bookings") || "[]");
      bookings.unshift(booking);
      localStorage.setItem("atlas-bookings", JSON.stringify(bookings));
      saveCart([]);
      document.getElementById("checkout-content").innerHTML =
        `<div class="panel confirmation" style="margin-bottom:70px"><div style="font-size:40px;color:var(--green)">✓</div><h2>Votre réservation est confirmée !</h2><p>Merci ${booking.client}. Votre référence est <strong>${ref}</strong>.</p><p>${payment === "arrival" ? "Vous réglerez votre séjour à l’arrivée." : "Votre paiement simulé a été enregistré."} Un récapitulatif est prêt pour ${booking.email}.</p><a class="btn btn-blue" href="${root}index.html">Retour à l’accueil</a></div>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
  render();
}
function admin() {
  document.getElementById("app").innerHTML =
    `<div class="admin-shell"><aside class="admin-sidebar"><a class="brand" href="${root}index.html"><img src="${root}images/logo.png" alt="Atlas Voyage" class="brand-logo"></a><nav>${[
      ["Dashboard", "chart"],
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
      )}</nav><a class="back-link" href="${root}index.html">← Retour au site</a></aside><main class="admin-content"><div class="admin-header"><div><h1 id="admin-title">Tableau de bord</h1><p>Bienvenue dans votre espace Atlas Voyage.</p></div><div class="admin-avatar">AV</div></div><div id="admin-view"></div></main></div>`;
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
          `<div class="admin-table-wrap"><table><thead><tr><th>Offre</th><th>Destination</th><th>Type</th><th>Prix</th></tr></thead><tbody>${data
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
      fetch("http://localhost:8080/api/users")
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
function applyLocale() {
  const l = langCode();
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
}
applyLocale();
const page = document.body.dataset.page;
if (page === "home") home();
if (page === "catalogue") catalogue();
if (page === "detail") detail();
if (page === "checkout") checkout();
if (page === "admin") admin();
refreshCart();

document.addEventListener("click", (e) => {
  const box = document.getElementById("locale");
  if (!box) return;
  const btn = e.target.closest(".locale-btn");
  if (btn) {
    const o = box.classList.toggle("open");
    btn.setAttribute("aria-expanded", o);
    return;
  }
  const l = e.target.closest("[data-lang]"),
    c = e.target.closest("[data-cur]");
  if (l) {
    localStorage.setItem("atlas-lang", l.dataset.lang);
    location.reload();
    return;
  }
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






