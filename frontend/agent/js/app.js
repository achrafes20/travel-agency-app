const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  package: '<path d="m16.5 9.4-9-5.2"/><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  wallet: '<path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V7"/><path d="M16 15h.01"/>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8M8 13h5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
  plane: '<path d="M22 2 9 15"/><path d="m22 2-7 20-4-9-9-4Z"/>',
  bed: '<path d="M2 4v16M22 20V10a2 2 0 0 0-2-2H9v12M2 14h20"/><path d="M5 8h4v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z"/>',
  car: '<path d="m5 17-2 2M19 17l2 2M5 17h14l1-6-2-4H6l-2 4Z"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3 2 21h20Z"/><path d="M12 9v5M12 18h.01"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};

const icon = (name) => `<span data-icon="${name}"><svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || ""}</svg></span>`;
const badge = (text, tone = "amber") => `<span class="badge badge-${tone}">${text}</span>`;
const button = (text, type = "primary", attrs = "") => `<button class="button button-${type}" ${attrs}>${text}</button>`;
const pageHead = (eyebrow, title, subtitle, actions = "") => `
  <div class="page-head">
    <div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div>
    <div class="page-actions">${actions}</div>
  </div>`;
const pagination = () => `<div class="pagination"><span>Affichage de 1 à 5 sur 24</span><div><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>…</button><button>5</button><button>›</button></div></div>`;

const photos = {
  riad: "https://images.unsplash.com/photo-1570133435536-7ececf000ef6?auto=format&fit=crop&w=900&q=85",
  blue: "https://images.unsplash.com/photo-1531230689007-0b32d7a7c33e?auto=format&fit=crop&w=900&q=85",
  arch: "https://images.unsplash.com/photo-1548018560-cd92fb00373f?auto=format&fit=crop&w=900&q=85",
};

const navItems = [
  ["dashboard", "Tableau de bord", "grid", ""],
  ["bundles", "Bundles", "package", ""],
  ["bookings", "Réservations", "calendar", "7"],
  ["payments", "Paiements à l'arrivée", "wallet", "5"],
  ["tickets", "Tickets de support", "message", "3"],
  ["notifications", "Notifications", "bell", ""],
  ["profile", "Mon profil", "user", ""],
];

const bookingRows = [
  ["BK-2026-000123", "Youssef El Amrani", "youssef.amrani@gmail.com", "Riad Atlas + Excursion", "18/06/2026", "4 850,00 MAD"],
  ["BK-2026-000119", "Lina Chraïbi", "lina.chraibi@gmail.com", "Vol Casablanca → Paris", "18/06/2026", "3 240,00 MAD"],
  ["BK-2026-000116", "Omar Alaoui", "omar.alaoui@gmail.com", "Week-end Nord", "19/06/2026", "2 082,50 MAD"],
  ["BK-2026-000108", "Sara El Fassi", "sara.elfassi@gmail.com", "Voiture Renault Clio", "20/06/2026", "1 600,00 MAD"],
  ["BK-2026-000101", "Mehdi Berrada", "mehdi.berrada@gmail.com", "Riad Bleu Essaouira", "21/06/2026", "2 950,00 MAD"],
];

let currentPage = "dashboard";

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]:not(:has(svg))").forEach((element) => {
    element.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[element.dataset.icon] || ""}</svg>`;
  });
}

function renderNav() {
  document.querySelector("#main-nav").innerHTML = navItems.map(([id, label, iconName, count]) => `
    <button class="nav-item ${currentPage === id || (currentPage === "booking" && id === "bookings") ? "active" : ""}" data-page="${id}" title="${label}">
      ${icon(iconName)}<span>${label}</span>${count ? `<em>${count}</em>` : ""}
    </button>`).join("");
}

function dashboardPage() {
  const kpis = [
    ["clock", "12", "Réservations", "En attente de validation", "+3 aujourd'hui", ""],
    ["wallet", "5", "Paiements", "À encaisser à l'arrivée", "8 750,00 MAD", "amber"],
    ["message", "3", "Tickets ouverts", "Dont 1 non assigné", "Action requise", "violet"],
    ["calendar", "6", "Aujourd'hui", "Réservations du jour", "+20 % vs hier", "sky"],
  ];
  const rows = bookingRows.slice(0, 4).map((row) => `<tr>
    <td><button class="reference" data-page="booking">${row[0]}</button></td>
    <td><strong>${row[1]}</strong><small>${row[3]}</small></td><td>${row[4]}</td><td><strong>${row[5]}</strong></td>
    <td>${badge("En attente")}</td><td><button class="round-button" data-page="booking">${icon("arrow")}</button></td>
  </tr>`).join("");
  const payments = [
    ["Demain", "09:00", "Nadia El Idrissi", "1 850,00 MAD"],
    ["18/06", "14:30", "Karim Benjelloun", "3 200,00 MAD"],
    ["20/06", "10:00", "Sofia Tazi", "980,00 MAD"],
  ].map((item) => `<div class="payment-line"><span class="date-tile"><small>${item[0]}</small><strong>${item[1]}</strong></span><div><strong>${item[2]}</strong><small>Riad Atlas – Chambre double</small></div><strong>${item[3]}</strong>${button("Encaisser", "primary button-small", `data-toast="Paiement de ${item[2]} encaissé"`)}</div>`).join("");
  const tickets = [
    ["YE", "Remboursement non reçu", "Youssef El Amrani · Paiement", "Urgent", "red", "12 min"],
    ["IF", "Modifier ma date d'arrivée", "Imane Fikri · Réservation", "Ouvert", "blue", "38 min"],
    ["AC", "Question transfert aéroport", "Adam Chami · Autre", "Ouvert", "blue", "1 h"],
  ].map((item) => `<button class="ticket-line" data-page="tickets"><span class="avatar">${item[0]}</span><span><strong>${item[1]}</strong><small>${item[2]}</small></span>${badge(item[3], item[4])}<time>${item[5]}</time>${icon("arrow")}</button>`).join("");
  return pageHead("Espace agent", "Bonjour Nadia, voici votre journée.", "Mardi 16 juin 2026 · Marrakech, 10:42", `${button("Voir les réservations", "outline", 'data-page="bookings"')}${button(`${icon("plus")} Nouveau bundle`, "primary", 'data-page="bundle-editor"')}`)
    + `<div class="kpi-grid">${kpis.map((item) => `<section class="card kpi-card"><div class="kpi-top"><span class="kpi-icon ${item[5]}">${icon(item[0])}</span><span class="kpi-trend">${item[4]}</span></div><div class="kpi-number">${item[1]}</div><strong>${item[2]}</strong><p>${item[3]}</p></section>`).join("")}</div>
    <div class="dashboard-grid">
      <section class="card table-card"><div class="card-head"><div><h2>Réservations à valider</h2><p>Les demandes les plus récentes</p></div><button class="text-link" data-page="bookings">Tout voir ${icon("arrow")}</button></div><table><thead><tr><th>Référence</th><th>Client & contenu</th><th>Début</th><th>Total</th><th>Statut</th><th></th></tr></thead><tbody>${rows}</tbody></table></section>
      <section class="card chart-card"><div class="card-head"><div><h2>Activité</h2><p>7 derniers jours</p></div>${badge("+14,2 %", "green")}</div><div class="chart-summary">42 <small>réservations</small></div><div class="bar-chart">${[45,62,38,72,55,86,68].map((height, index) => `<div class="bar-column ${index === 5 ? "active" : ""}"><i style="height:${height}%"></i><small>${["Mer","Jeu","Ven","Sam","Dim","Lun","Mar"][index]}</small></div>`).join("")}</div></section>
      <section class="card payments-card"><div class="card-head"><div><h2>Paiements à encaisser</h2><p>Triés par date de début</p></div><button class="text-link" data-page="payments">Tout voir ${icon("arrow")}</button></div>${payments}</section>
      <section class="card tickets-card"><div class="card-head"><div><h2>Derniers tickets</h2><p>3 conversations nécessitent une réponse</p></div><button class="text-link" data-page="tickets">Ouvrir la file ${icon("arrow")}</button></div>${tickets}</section>
    </div>`;
}

function bookingsPage() {
  const rows = bookingRows.map((row, index) => `<tr class="${index < 3 ? "pending-row" : ""}">
    <td><button class="reference" data-page="booking">${row[0]}</button><small>Créée il y a ${index + 1} h</small></td>
    <td><strong>${row[1]}</strong><small>${row[2]}</small></td><td><strong>${row[3]}</strong><small>${index === 1 ? "Vol" : "Bundle · 2 voyageurs"}</small></td>
    <td><strong>${row[4]}</strong><small>→ ${index + 20}/06/2026</small></td><td><strong>${row[5]}</strong></td>
    <td>${badge(index === 3 ? "À l'arrivée" : "Payé", index === 3 ? "amber" : "green")}</td><td>${badge("En attente")}</td>
    <td><div class="row-actions"><button data-page="booking" title="Voir">${icon("eye")}</button><button class="success" data-modal="Valider" title="Valider">${icon("check")}</button><button title="Plus">${icon("more")}</button></div></td>
  </tr>`).join("");
  return pageHead("Gestion", "Réservations", "Suivez, validez et gérez toutes les réservations clients.", button(`${icon("filter")} Exporter la liste`, "outline"))
    + `<section class="card filters">
      <label class="simple-field wide"><span>Rechercher</span><div>${icon("search")}<input placeholder="Référence, client, email…" /></div></label>
      <label class="simple-field"><span>Période</span><div>${icon("calendar")}<input value="01/06/2026 — 30/06/2026" readonly /></div></label>
      <label class="simple-field"><span>Type d'offre</span><div>${icon("package")}<select><option>Tous les types</option><option>Hôtel</option><option>Vol</option><option>Bundle</option></select></div></label>
      ${button("Réinitialiser", "ghost")}
      <div class="chips"><span>Statut</span>${["Toutes","En attente","Confirmée","Terminée","Annulée"].map((text, i) => `<button class="chip ${i === 1 ? "active" : ""}">${text}${i === 1 ? " · 7" : ""}</button>`).join("")}</div>
    </section>
    <section class="card table-card"><div class="list-title"><div><h2>Réservations</h2><p>24 résultats trouvés</p></div></div>
      <table><thead><tr><th>Référence</th><th>Client</th><th>Contenu</th><th>Dates</th><th>Total</th><th>Paiement</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>${pagination()}
    </section>`;
}

function bookingPage() {
  const items = [
    ["bed", "Riad Atlas – Chambre double", "Atlas Hospitality", "2 nuits", "1 700,00 MAD"],
    ["car", "Excursion Chefchaouen → Tanger", "Rif Experience", "2 personnes", "2 650,00 MAD"],
    ["plane", "Taxi aéroport Tanger", "Atlas Transferts", "1 trajet", "500,00 MAD"],
  ].map((item) => `<div class="booking-item"><span>${icon(item[0])}</span><div><strong>${item[1]}</strong><small>${item[2]}</small></div><p>${item[3]}</p><b>${item[4]}</b></div>`).join("");
  const timeline = [
    ["check", "Demande créée", "Youssef El Amrani", "15/06/2026 · 14:32"],
    ["check", "Paiement autorisé", "Système Atlas Pay", "15/06/2026 · 14:33"],
    ["clock", "En attente de validation", "Routage automatique", "15/06/2026 · 14:34"],
  ].map((item, i) => `<div class="timeline-item ${i === 2 ? "current" : ""}"><span>${icon(item[0])}</span><strong>${item[1]}</strong><p>${item[2]}</p><time>${item[3]}</time></div>`).join("");
  return `<button class="back-link" data-page="bookings">← Retour aux réservations</button>`
    + pageHead("Réservation", "BK-2026-000123", "Créée le 15/06/2026 à 14:32", badge("En attente de validation"))
    + `<div class="detail-grid"><div class="stack">
      <section class="card padded-card"><div class="client-title"><div><h2>Youssef El Amrani</h2><p>Client depuis septembre 2023 · 6 réservations</p></div><span class="avatar">YE</span></div><div class="contact-grid"><div><small>Email</small><strong>youssef.amrani@gmail.com</strong></div><div><small>Téléphone</small><strong>+212 6 12 34 56 78</strong></div><div><small>Pays</small><strong>Maroc</strong></div></div></section>
      <section class="card"><div class="card-head"><div><h2>Détails du voyage</h2><p>Bundle : Échappée bleue du Nord</p></div>${badge("2 voyageurs", "blue")}</div><div class="bundle-header"><img src="${photos.blue}" alt="Chefchaouen" /><div><em>Bundle</em><strong>Échappée bleue du Nord</strong><small>18/06/2026 → 21/06/2026</small></div><strong>4 850,00 MAD</strong></div>${items}</section>
      <section class="card"><div class="card-head"><h2>Historique</h2></div><div class="timeline">${timeline}</div></section>
    </div><aside class="stack">
      <section class="card action-card"><span class="eyebrow">Action requise</span><h2>Valider cette réservation</h2><p>Vérifiez les disponibilités avant de confirmer auprès du client.</p>${button(`${icon("check")} Valider la réservation`, "success", 'data-modal="Valider"')}${button("Rejeter la demande", "outline", 'data-modal="Rejeter"')}</section>
      <section class="card padded-card"><h2>Paiement</h2><div style="display:flex;justify-content:space-between;margin:12px 0">${badge("Payé", "green")}<strong style="font-size:9px">Visa •••• 4242</strong></div><div class="summary-row"><span>Montant autorisé</span><strong>4 850,00 MAD</strong></div><div class="summary-row"><span>Transaction</span><strong>TXN-8F3C91</strong></div><div class="summary-row"><span>Sous-total</span><strong>5 500,00 MAD</strong></div><div class="summary-row discount"><span>Remise bundle</span><strong>−650,00 MAD</strong></div><div class="total-row"><span>Total payé</span><strong>4 850,00 MAD</strong></div>${button("Rembourser", "ghost", 'data-modal="Rembourser"')}</section>
    </aside></div>`;
}

/* ---------- Bundles (branchés sur l'API /api/bundles) ---------- */

const OFFER_TYPE_LABELS = { FLIGHT: "Vol", HOTEL: "Hôtel", CAR: "Voiture", TAXI_TRANSFER: "Taxi", EXCURSION: "Excursion" };
const OFFER_TYPE_ICONS = { FLIGHT: "plane", HOTEL: "bed", CAR: "car", TAXI_TRANSFER: "car", EXCURSION: "package" };
const MIN_BUNDLE_OFFERS = 2;

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (value) => `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

const bundleState = { agent: null, bundles: [], editingId: null, draft: null, catalog: [], pick: new Set(), saving: false };

const newBundleDraft = () => ({ title: "", description: "", discountPercentage: "0", offers: [] });
function startNewBundle() {
  bundleState.editingId = null;
  bundleState.draft = newBundleDraft();
}
function startEditBundle(id) {
  const bundle = bundleState.bundles.find((b) => b.id === id);
  if (!bundle) return;
  bundleState.editingId = id;
  bundleState.draft = {
    title: bundle.title,
    description: bundle.description || "",
    discountPercentage: String(bundle.discountPercentage ?? 0),
    offers: bundle.offers.map((o) => ({ ...o })),
  };
  renderPage("bundle-editor");
}

async function ensureAgent() {
  if (bundleState.agent) return bundleState.agent;
  const users = await api.get("/api/users");
  const agent = users.find((u) => u.role === "AGENT" && !u.archived);
  if (!agent) throw new Error("Aucun compte agent actif n’a été trouvé.");
  bundleState.agent = agent;
  return agent;
}

const bundleImage = (bundle) => bundle.offers.find((o) => o.image)?.image || photos.blue;

function bundlesPage() {
  return pageHead("Catalogue", "Bundles", "Composez des expériences uniques à partir des offres disponibles.", button(`${icon("plus")} Nouveau bundle`, "primary", 'data-page="bundle-editor"'))
    + `<section class="card bundle-toolbar"><label class="quick-search">${icon("search")}<input id="bundle-search" placeholder="Rechercher un bundle…" /></label></section>
      <div id="bundle-results"><section class="card padded-card">Chargement des bundles…</section></div>`;
}

async function loadBundlesPage() {
  try {
    await ensureAgent();
    bundleState.bundles = await api.get("/api/bundles");
    renderBundleList();
  } catch (err) {
    const root = document.querySelector("#bundle-results");
    if (!root) return;
    root.innerHTML = `<section class="card padded-card"><div class="alert-banner danger" style="margin:0"><span>${icon("alert")}</span><div><strong>Impossible de charger les bundles</strong><p>${esc(err.message)}</p></div><button class="button button-outline" data-bundle-retry>Réessayer</button></div></section>`;
    hydrateIcons(root);
  }
}

function renderBundleList() {
  const root = document.querySelector("#bundle-results");
  if (!root) return;
  const all = bundleState.bundles;
  const query = (document.querySelector("#bundle-search")?.value || "").trim().toLowerCase();
  const list = all
    .filter((b) => b.title.toLowerCase().includes(query))
    .sort((a, b) => b.id - a.id);
  if (!all.length) {
    root.innerHTML = `<section class="card padded-card" style="text-align:center;padding:48px"><h2>Aucun bundle pour le moment</h2><p style="color:var(--muted);font-size:10px;margin:8px 0 16px">Assemblez plusieurs offres de fournisseurs pour créer votre premier bundle.</p>${button(`${icon("plus")} Nouveau bundle`, "primary", 'data-page="bundle-editor"')}</section>`;
  } else if (!list.length) {
    root.innerHTML = `<section class="card padded-card" style="text-align:center;padding:48px"><h2>Aucun bundle ne correspond</h2><p style="color:var(--muted);font-size:10px;margin-top:8px">Modifiez la recherche.</p></section>`;
  } else {
    root.innerHTML = `<div class="bundle-grid">${list.map(bundleCard).join("")}</div>`;
  }
  hydrateIcons(root);
}

function bundleCard(b) {
  const discount = b.discountPercentage || 0;
  return `<section class="card bundle-card"><div class="bundle-image"><img src="${esc(bundleImage(b))}" alt="${esc(b.title)}" /></div>
    <div class="bundle-body"><span class="location">${esc(b.cities.join(" · ") || "—")}</span><h2>${esc(b.title)}</h2>
    <div class="component-count"><span>${icon("package")}</span>${b.offers.length} composantes</div>
    <div class="price-flow"><small>Prix des offres</small>${discount > 0 ? `<del>${money(b.sumPrice)}</del><em>−${discount} %</em>` : "<span></span><span></span>"}<strong>${money(b.finalPrice)}</strong></div>
    <div class="stock-title"><span>Stock dynamique</span><strong>${b.stock} bundle${b.stock > 1 ? "s" : ""} disponible${b.stock > 1 ? "s" : ""}</strong></div>
    <div class="stock-track"><i style="width:${Math.min(100, Math.max(4, b.stock * 10))}%"></i></div>
    <div class="stock-note">Limité par : ${esc(b.limitingOfferTitle || "—")}</div>
    <div class="bundle-actions">${button("Modifier", "outline", `data-bundle-edit="${b.id}"`)}${button("Supprimer", "ghost", `data-bundle-delete="${b.id}" style="color:var(--red)"`)}</div></div></section>`;
}

/* ---- Éditeur ---- */

function bundleTotals() {
  const d = bundleState.draft;
  const sum = d.offers.reduce((total, o) => total + (o.basePrice || 0), 0);
  const discount = Math.min(100, Math.max(0, Number(d.discountPercentage) || 0));
  const limiting = d.offers.reduce((min, o) => (min === null || o.stock < min.stock ? o : min), null);
  return { sum, discount, saved: sum * discount / 100, final: sum * (1 - discount / 100), stock: limiting ? limiting.stock : 0, limiting };
}

function bundleSaveButtons() {
  return button("Enregistrer", "primary", "data-bundle-save");
}

function bundleComponentsHtml() {
  const offers = bundleState.draft.offers;
  if (!offers.length) return `<p style="color:var(--muted);font-size:9px;margin-bottom:12px">Aucune offre ajoutée pour le moment.</p>`;
  return offers.map((o) => `<div class="component-row"><i></i><span class="offer-icon">${icon(OFFER_TYPE_ICONS[o.type] || "package")}</span><div><strong>${esc(o.title)}</strong><small>${esc(o.cityName || "—")} · Stock : ${o.stock}${o.active ? "" : " · inactive"}</small></div><span>${OFFER_TYPE_LABELS[o.type] || ""}</span><b>${money(o.basePrice)}</b><button class="remove-button" data-bundle-remove="${o.id}" aria-label="Retirer">×</button></div>`).join("");
}

function bundleRecapHtml() {
  const d = bundleState.draft;
  const t = bundleTotals();
  const image = d.offers.find((o) => o.image)?.image || photos.riad;
  return `<section class="card recap-card"><h2>Récapitulatif en temps réel</h2><img src="${esc(image)}" alt="" /><strong>${esc(d.title || "Titre du bundle")}</strong>
    <div class="summary-row"><span>Somme des offres</span><strong>${money(t.sum)}</strong></div>
    <div class="summary-row discount"><span>Remise (${t.discount} %)</span><strong>−${money(t.saved)}</strong></div>
    <div class="final-price"><span>Prix final</span><strong>${money(t.final)}</strong><small>${d.offers.length} offre${d.offers.length > 1 ? "s" : ""} combinée${d.offers.length > 1 ? "s" : ""}</small></div>
    <div class="dynamic-stock">${icon("package")}<div><span>Stock dynamique</span><strong>${t.stock} bundle${t.stock > 1 ? "s" : ""} disponible${t.stock > 1 ? "s" : ""}</strong><small>${t.limiting ? `Limité par ${esc(t.limiting.title)}` : "Ajoutez des offres"}</small></div></div>
    <div style="display:flex;flex-direction:column;gap:8px">${bundleSaveButtons()}</div></section>`;
}

function bundleEditorPage() {
  if (!bundleState.draft) startNewBundle();
  const d = bundleState.draft;
  const editing = bundleState.editingId !== null;
  return `<button class="back-link" data-page="bundles">← Retour aux bundles</button>`
    + pageHead(editing ? "Modifier le bundle" : "Nouveau bundle", editing ? "Modifier l’expérience" : "Créer une expérience", "Assemblez les offres et définissez la remise.", bundleSaveButtons())
    + `<div class="editor-grid"><div>
      <section class="card form-card"><span class="step">01</span><h2>Informations générales</h2><p>Présentez l'expérience aux voyageurs. L’image du bundle est celle de sa première offre.</p>
        <label class="full-field"><span>Titre du bundle</span><input data-b="title" value="${esc(d.title)}" placeholder="Escapade entre médina et océan" /></label>
        <label class="full-field"><span>Description</span><textarea data-b="description" placeholder="Décrivez l’expérience proposée…">${esc(d.description)}</textarea></label></section>
      <section class="card form-card"><span class="step">02</span><h2>Composantes</h2><p>Un bundle contient au moins ${MIN_BUNDLE_OFFERS} offres de fournisseurs.</p><div id="bundle-components">${bundleComponentsHtml()}</div>${button(`${icon("plus")} Ajouter une offre`, "outline", "data-bundle-pick")}</section>
      <section class="card form-card"><span class="step">03</span><h2>Réduction globale</h2><p>Définissez un avantage clair pour ce package (en pourcentage de la somme des offres).</p>
        <label class="full-field"><span>Remise (%)</span><input type="number" min="0" max="100" step="any" data-b="discountPercentage" value="${esc(d.discountPercentage)}" /></label>
        <div class="alert-banner" style="margin:0;min-height:45px"><span>${icon("alert")}</span><div><strong>Un bundle est toujours payé immédiatement.</strong></div></div></section>
    </div><aside id="bundle-recap">${bundleRecapHtml()}</aside></div>`;
}

function refreshBundleEditor(components = true) {
  const list = document.querySelector("#bundle-components");
  const recap = document.querySelector("#bundle-recap");
  if (components && list) { list.innerHTML = bundleComponentsHtml(); hydrateIcons(list); }
  if (recap) { recap.innerHTML = bundleRecapHtml(); hydrateIcons(recap); }
}

function validateBundleDraft() {
  const d = bundleState.draft;
  if (!d.title.trim()) return "Le titre du bundle est obligatoire.";
  if (d.offers.length < MIN_BUNDLE_OFFERS) return `Ajoutez au moins ${MIN_BUNDLE_OFFERS} offres au bundle.`;
  const discount = Number(d.discountPercentage);
  if (d.discountPercentage !== "" && (Number.isNaN(discount) || discount < 0 || discount > 100)) return "La remise doit être comprise entre 0 et 100 %.";
  return null;
}

async function saveBundle() {
  if (bundleState.saving) return;
  const problem = validateBundleDraft();
  if (problem) { showToast(problem, true); return; }
  const d = bundleState.draft;
  bundleState.saving = true;
  try {
    const agent = await ensureAgent();
    const payload = { title: d.title.trim(), description: d.description.trim() || null, discountPercentage: Number(d.discountPercentage) || 0, offerIds: d.offers.map((o) => o.id), createdById: agent.id };
    if (bundleState.editingId !== null) await api.put(`/api/bundles/${bundleState.editingId}`, payload); else await api.post("/api/bundles", payload);
    showToast(bundleState.editingId !== null ? "Bundle modifié" : "Bundle créé");
    bundleState.draft = null;
    bundleState.editingId = null;
    renderPage("bundles");
  } catch (err) {
    showToast(err.message, true);
  } finally {
    bundleState.saving = false;
  }
}

/* ---- Fenêtres modales ---- */

function openDialog(html, width = 470) {
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" style="width:${width}px;max-width:94vw"><button class="modal-close" data-action="close-modal">×</button>${html}</section></div>`;
  hydrateIcons(document.querySelector("#modal-root"));
}
const closeDialog = () => { document.querySelector("#modal-root").innerHTML = ""; };

async function openOfferPicker() {
  openDialog(`<h2>Ajouter des offres</h2><p>Chargement du catalogue…</p>`, 640);
  try {
    bundleState.catalog = (await api.get("/api/offers")).filter((o) => o.active);
  } catch (err) {
    closeDialog();
    showToast(err.message, true);
    return;
  }
  bundleState.pick = new Set(bundleState.draft.offers.map((o) => o.id));
  openDialog(`<h2>Ajouter des offres</h2><p>Sélectionnez les offres actives à intégrer au bundle.</p>
    <label class="quick-search" style="width:100%;margin-bottom:10px">${icon("search")}<input id="pick-search" placeholder="Rechercher une offre…" /></label>
    <div id="pick-list" style="max-height:340px;overflow:auto"></div>
    <div class="modal-actions"><span id="pick-count" style="margin-right:auto;font-size:9px;color:var(--muted);align-self:center"></span>${button("Annuler", "ghost", 'data-action="close-modal"')}${button("Ajouter la sélection", "primary", "data-bundle-pick-confirm")}</div>`, 640);
  renderPickList();
}

function renderPickList() {
  const list = document.querySelector("#pick-list");
  if (!list) return;
  const query = (document.querySelector("#pick-search")?.value || "").trim().toLowerCase();
  const offers = bundleState.catalog.filter((o) => o.title.toLowerCase().includes(query) || (o.cityName || "").toLowerCase().includes(query));
  list.innerHTML = offers.length
    ? offers.map((o) => `<label class="component-row" style="grid-template-columns:20px 36px 1fr auto auto;cursor:${o.stock > 0 ? "pointer" : "not-allowed"};opacity:${o.stock > 0 ? 1 : .5}"><input type="checkbox" data-pick-offer="${o.id}" ${bundleState.pick.has(o.id) ? "checked" : ""} ${o.stock > 0 ? "" : "disabled"} /><span class="offer-icon">${icon(OFFER_TYPE_ICONS[o.type] || "package")}</span><div><strong>${esc(o.title)}</strong><small>${OFFER_TYPE_LABELS[o.type]} · ${esc(o.cityName)} · ${esc(o.supplierName)} · Stock : ${o.stock}</small></div><span></span><b>${money(o.basePrice)}</b></label>`).join("")
    : `<p style="color:var(--muted);font-size:9px;padding:14px 0">Aucune offre active ne correspond.</p>`;
  hydrateIcons(list);
  const count = document.querySelector("#pick-count");
  if (count) count.textContent = `${bundleState.pick.size} offre${bundleState.pick.size > 1 ? "s" : ""} sélectionnée${bundleState.pick.size > 1 ? "s" : ""}`;
}

function confirmOfferPicker() {
  const d = bundleState.draft;
  const kept = d.offers.filter((o) => bundleState.pick.has(o.id));
  const known = new Set(kept.map((o) => o.id));
  const added = bundleState.catalog
    .filter((o) => bundleState.pick.has(o.id) && !known.has(o.id))
    .map((o) => ({ id: o.id, type: o.type, title: o.title, cityName: o.cityName, basePrice: o.basePrice, stock: o.stock, active: o.active, image: o.images[0] || null }));
  d.offers = [...kept, ...added];
  closeDialog();
  refreshBundleEditor();
}

function confirmDeleteBundle(bundle) {
  openDialog(`<span class="modal-icon red">${icon("alert")}</span><h2>Supprimer ce bundle ?</h2><p>« ${esc(bundle.title)} » sera supprimé définitivement. Les offres qui le composent ne sont pas affectées.</p>
    <div class="modal-actions">${button("Annuler", "ghost", 'data-action="close-modal"')}${button("Supprimer", "danger", `data-bundle-confirm-delete="${bundle.id}"`)}</div>`);
}

async function runBundleAction(action, successMessage) {
  try {
    await action();
    closeDialog();
    bundleState.bundles = await api.get("/api/bundles");
    renderBundleList();
    showToast(successMessage);
  } catch (err) {
    showToast(err.message, true);
  }
}

document.addEventListener("input", (event) => {
  const field = event.target.closest("[data-b]");
  if (field && bundleState.draft) {
    bundleState.draft[field.dataset.b] = field.value;
    refreshBundleEditor(false);
    return;
  }
  if (event.target.id === "bundle-search") renderBundleList();
  if (event.target.id === "pick-search") renderPickList();
});

document.addEventListener("change", (event) => {
  const box = event.target.closest("[data-pick-offer]");
  if (!box) return;
  const id = Number(box.dataset.pickOffer);
  if (box.checked) bundleState.pick.add(id); else bundleState.pick.delete(id);
  const count = document.querySelector("#pick-count");
  if (count) count.textContent = `${bundleState.pick.size} offre${bundleState.pick.size > 1 ? "s" : ""} sélectionnée${bundleState.pick.size > 1 ? "s" : ""}`;
});

document.addEventListener("click", (event) => {
  const t = event.target;
  const find = (id) => bundleState.bundles.find((b) => b.id === Number(id));
  if (t.closest("[data-bundle-retry]")) { loadBundlesPage(); return; }
  const edit = t.closest("[data-bundle-edit]");
  if (edit) { startEditBundle(Number(edit.dataset.bundleEdit)); return; }
  const del = t.closest("[data-bundle-delete]");
  if (del) { confirmDeleteBundle(find(del.dataset.bundleDelete)); return; }
  const confirmDelete = t.closest("[data-bundle-confirm-delete]");
  if (confirmDelete) {
    const bundle = find(confirmDelete.dataset.bundleConfirmDelete);
    api.delete(`/api/bundles/${bundle.id}`)
      .then(() => runBundleAction(async () => {}, "Bundle supprimé"))
      .catch((err) => {
        openDialog(`<span class="modal-icon red">${icon("alert")}</span><h2>Suppression impossible</h2><p>${esc(err.message)}</p><div class="modal-actions">${button("Fermer", "ghost", 'data-action="close-modal"')}</div>`);
      });
    return;
  }
  const remove = t.closest("[data-bundle-remove]");
  if (remove) {
    bundleState.draft.offers = bundleState.draft.offers.filter((o) => o.id !== Number(remove.dataset.bundleRemove));
    refreshBundleEditor();
    return;
  }
  if (t.closest("[data-bundle-pick]")) { openOfferPicker(); return; }
  if (t.closest("[data-bundle-pick-confirm]")) { confirmOfferPicker(); return; }
  if (t.closest("[data-bundle-save]")) saveBundle();
});

function paymentsPage() {
  const items = [
    ["17 JUIN","09:00","NE","Nadia El Idrissi","BK-2026-000098","+212 6 84 22 10 40","1 850,00 MAD","Demain"],
    ["18 JUIN","14:30","KB","Karim Benjelloun","BK-2026-000104","+212 6 73 11 92 08","3 200,00 MAD","À venir"],
    ["20 JUIN","10:00","ST","Sofia Tazi","BK-2026-000111","+212 6 14 54 76 38","980,00 MAD","À venir"],
    ["22 JUIN","16:00","RB","Rania Bennis","BK-2026-000118","+212 6 94 36 60 12","2 720,00 MAD","À venir"],
  ].map((item, i) => `<div class="pay-row"><span class="pay-date"><strong>${item[0]}</strong><small>${item[1]}</small></span><span class="avatar" style="background:var(--pale);color:var(--navy)">${item[2]}</span><div><strong>${item[3]}</strong><small>${item[5]}</small></div><div><button class="reference">${item[4]}</button><small>Riad Atlas – Chambre double</small></div><strong>${item[6]}</strong>${badge(item[7], i === 0 ? "amber" : "blue")}${button("Marquer encaissé", "primary button-small", `data-toast="Paiement de ${item[3]} marqué encaissé"`)}</div>`).join("");
  return pageHead("Encaissements", "Paiements à l'arrivée", "Suivez les montants à encaisser directement auprès des voyageurs.", button("Exporter", "outline"))
    + `<div class="tabbar"><button class="active">À venir · 5</button><button>En retard · 2</button><button>Encaissés</button></div><section class="card table-card"><div class="list-title"><div><h2>Prochains encaissements</h2><p>Triés par date de début</p></div></div>${items}</section>`;
}

function ticketsPage() {
  const tickets = [
    ["#TK-0482","Remboursement non reçu","Youssef El Amrani","Paiement","Il y a 12 min","Urgent","red"],
    ["#TK-0481","Modifier ma date d'arrivée","Imane Fikri","Réservation","Il y a 38 min","Ouvert","blue"],
    ["#TK-0479","Question transfert aéroport","Adam Chami","Autre","Il y a 1 h","Ouvert","blue"],
    ["#TK-0472","Facture de mon séjour","Meryem Saïdi","Paiement","Hier","Résolu","green"],
  ].map((item, i) => `<button class="ticket-item ${i === 0 ? "selected" : ""}"><div><span>${item[0]}</span><time>${item[4]}</time></div><strong>${item[1]}</strong><p>${item[2]} · ${item[3]}</p>${badge(item[5], item[6])}</button>`).join("");
  return pageHead("Assistance", "Tickets de support", "Répondez rapidement aux demandes des voyageurs.", button(`${icon("filter")} Filtres`, "outline"))
    + `<div class="ticket-layout"><section class="card ticket-list"><div class="ticket-tabs"><button class="active">Mes tickets · 3</button><button>Non assignés · 1</button><button>Tous</button></div><label class="ticket-search">${icon("search")}<input placeholder="Rechercher un ticket…" /></label>${tickets}</section>
      <section class="card conversation"><div class="conversation-head"><div><span>#TK-0482 · Paiement</span><h2>Remboursement non reçu</h2><p>Youssef El Amrani · BK-2026-000123</p></div>${badge("En cours", "blue")}</div><div class="messages"><div class="day-separator">Aujourd'hui</div><div class="message"><span class="avatar">YE</span><div class="message-bubble"><strong>Youssef El Amrani</strong><p>Bonjour, j'ai annulé ma réservation il y a une semaine mais je n'ai toujours pas reçu le remboursement sur ma carte. Pouvez-vous vérifier ?</p><time>09:14</time></div></div><div class="message agent"><div class="message-bubble"><strong>Nadia · Vous</strong><p>Bonjour Youssef, je vérifie immédiatement le statut de votre remboursement auprès de notre prestataire de paiement.</p><time>09:26 · Lu</time></div><span class="avatar">NE</span></div><div class="message"><span class="avatar">YE</span><div class="message-bubble"><strong>Youssef El Amrani</strong><p>Merci beaucoup. La référence de la réservation est BK-2026-000123.</p><time>10:30</time></div></div></div><div class="reply-box"><textarea id="ticket-reply" placeholder="Écrivez votre réponse…"></textarea><div class="reply-actions"><span>Joindre un fichier</span>${button("Envoyer", "primary", 'data-action="send-reply"')}</div></div></section>
      <aside><section class="card ticket-info"><h2>Informations</h2><label><span>Statut</span><select><option>En cours</option><option>Résolu</option></select></label><label><span>Assigné à</span><select><option>Nadia El Fassi</option></select></label><hr /><small>Client</small><strong>Youssef El Amrani</strong><p>youssef.amrani@gmail.com</p><hr /><small>Réservation liée</small><button class="reference" data-page="booking">BK-2026-000123</button><p>4 850,00 MAD · Payé</p></section></aside></div>`;
}

function notificationsPage() {
  const items = [
    ["calendar","Nouvelle réservation en attente","Youssef El Amrani a réservé « Échappée bleue du Nord ».","Il y a 5 min",""],
    ["message","Nouveau ticket de support","Remboursement non reçu · Ticket #TK-0482","Il y a 18 min","amber"],
    ["wallet","Rappel de paiement non encaissé","Le paiement de Nadia El Idrissi est attendu demain.","Il y a 4 h","violet"],
    ["check","Réservation confirmée","La réservation BK-2026-000119 a bien été confirmée.","Hier","green"],
  ].map((item, i) => `<button class="notification-row"><span class="notification-icon ${item[4]}">${icon(item[0])}</span><div><strong>${item[1]}</strong><p>${item[2]}</p><time>${item[3]}</time></div>${i < 4 ? "<i></i>" : ""}<span class="text-link">Voir ${icon("arrow")}</span></button>`).join("");
  return pageHead("Centre d'activité", "Notifications", "Retrouvez toutes les informations qui nécessitent votre attention.", button("Tout marquer comme lu", "ghost"))
    + `<div class="tabbar"><button class="active">Toutes</button><button>Non lues · 4</button></div><section class="card notification-card">${items}</section>`;
}

function profilePage() {
  return pageHead("Mon compte", "Profil", "Gérez vos informations personnelles et la sécurité de votre compte.")
    + `<div class="profile-grid"><section class="card profile-summary"><span class="profile-avatar">NE</span><h2>Nadia El Fassi</h2><p>Agent · Agence Marrakech Guéliz</p>${badge("Compte actif", "green")}<div class="profile-meta"><small>Membre depuis</small><strong>12 janvier 2024</strong><small>Dernière connexion</small><strong>Aujourd'hui à 08:42</strong></div></section>
      <div><section class="card profile-form"><h2>Informations personnelles</h2><p>Ces informations sont visibles par votre équipe.</p><div class="form-grid"><label class="full-field"><span>Prénom</span><input value="Nadia" /></label><label class="full-field"><span>Nom</span><input value="El Fassi" /></label><label class="full-field"><span>Téléphone</span><input value="+212 6 42 18 29 30" /></label><label class="full-field"><span>Email professionnel</span><input value="nadia.elfassi@atlasvoyage.ma" disabled /><small>L'adresse email n'est pas modifiable.</small></label></div>${button("Enregistrer les modifications", "primary", 'data-toast="Profil mis à jour"')}</section>
      <section class="card profile-form"><h2>Changer le mot de passe</h2><p>Utilisez au moins 8 caractères, une majuscule et un chiffre.</p><div class="form-grid"><label class="full-field span-two"><span>Mot de passe actuel</span><input type="password" placeholder="••••••••••••" /></label><label class="full-field"><span>Nouveau mot de passe</span><input type="password" placeholder="8 caractères minimum" /></label><label class="full-field"><span>Confirmer</span><input type="password" placeholder="Répétez le mot de passe" /></label></div>${button("Mettre à jour le mot de passe", "outline", 'data-toast="Mot de passe mis à jour"')}</section></div></div>`;
}

const pageHooks = { bundles: loadBundlesPage };

const pageRenderers = {
  dashboard: dashboardPage,
  bookings: bookingsPage,
  booking: bookingPage,
  bundles: bundlesPage,
  "bundle-editor": bundleEditorPage,
  payments: paymentsPage,
  tickets: ticketsPage,
  notifications: notificationsPage,
  profile: profilePage,
};

function renderPage(page) {
  if (!pageRenderers[page]) page = "dashboard";
  currentPage = page;
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  const renderer = pageRenderers[page] || dashboardPage;
  document.querySelector("#page-content").innerHTML = renderer();
  document.querySelector("#breadcrumb-label").textContent = page === "booking" ? "Détail de la réservation" : page === "bundle-editor" ? (bundleState.editingId !== null ? "Modifier le bundle" : "Nouveau bundle") : navItems.find((item) => item[0] === page)?.[1] || "Tableau de bord";
  renderNav();
  hydrateIcons(document.querySelector("#page-content"));
  pageHooks[page]?.();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message, error = false) {
  const root = document.querySelector("#toast-root");
  root.innerHTML = `<div class="toast ${error ? "toast-error" : ""}"><span>${icon(error ? "alert" : "check")}</span><div><strong>${error ? "Action impossible" : "Action réussie"}</strong><p>${esc(message)}</p></div><button data-action="close-toast">×</button></div>`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { root.innerHTML = ""; }, error ? 5000 : 3200);
}

function showModal(kind) {
  const reject = kind === "Rejeter";
  const refund = kind === "Rembourser";
  const publish = kind === "Publier";
  const title = publish ? "Publier ce bundle ?" : `${kind} la réservation ?`;
  const description = reject
    ? "Le client sera notifié immédiatement. Un remboursement automatique de 100 % sera déclenché."
    : refund
      ? "Indiquez le montant à rembourser sur le moyen de paiement d'origine."
      : publish
        ? "Le bundle sera immédiatement visible dans le catalogue avec un stock dynamique de 8 unités."
        : "La réservation BK-2026-000123 sera confirmée et le client recevra son récapitulatif.";
  const field = reject
    ? `<label class="full-field"><span>Motif obligatoire</span><textarea id="modal-reason" placeholder="Expliquez le motif du rejet…"></textarea></label>`
    : refund
      ? `<label class="full-field"><span>Montant à rembourser</span><input value="4 850,00 MAD" /></label>`
      : "";
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true"><button class="modal-close" data-action="close-modal">×</button><span class="modal-icon ${reject ? "red" : refund ? "violet" : ""}">${icon(reject ? "alert" : refund ? "wallet" : "check")}</span><h2>${title}</h2><p>${description}</p>${field}<div class="modal-summary"><span>${publish ? "Bundle" : "Réservation"}</span><strong>${publish ? "Escapade entre médina et océan" : "BK-2026-000123"}</strong><span>${publish ? "Stock disponible" : "Client"}</span><strong>${publish ? "8 bundles" : "Youssef El Amrani"}</strong><span>${publish ? "Prix final" : "Montant"}</span><strong>${publish ? "2 507,50 MAD" : "4 850,00 MAD"}</strong></div><div class="modal-actions">${button("Annuler", "ghost", 'data-action="close-modal"')}${button(publish ? "Publier le bundle" : `${kind} la réservation`, reject ? "danger" : refund ? "outline" : "success", `data-action="confirm-modal" data-kind="${kind}"`)}</div></section></div>`;
}

function renderNotificationDropdown() {
  document.querySelector("#notification-dropdown").innerHTML = `<div class="dropdown-title"><strong>Notifications</strong><button>Tout marquer comme lu</button></div>
    <button class="dropdown-item" data-page="booking"><span>${icon("calendar")}</span><span><strong>Nouvelle réservation</strong><p>BK-2026-000123 est en attente</p><small>Il y a 5 min</small></span><i class="unread-dot"></i></button>
    <button class="dropdown-item" data-page="tickets"><span>${icon("message")}</span><span><strong>Nouveau ticket</strong><p>Demande de Youssef El Amrani</p><small>Il y a 18 min</small></span><i class="unread-dot"></i></button>
    <button class="dropdown-footer" data-page="notifications">Voir toutes les notifications ${icon("arrow")}</button>`;
}

document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    if (pageButton.dataset.page === "bundle-editor") startNewBundle();
    renderPage(pageButton.dataset.page);
    document.querySelector("#notification-dropdown").classList.add("hidden");
    return;
  }
  const toastButton = event.target.closest("[data-toast]");
  if (toastButton) showToast(toastButton.dataset.toast);
  const modalButton = event.target.closest("[data-modal]");
  if (modalButton) showModal(modalButton.dataset.modal);
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  if (actionButton.dataset.action === "close-modal" && (event.target === actionButton || actionButton.tagName === "BUTTON")) document.querySelector("#modal-root").innerHTML = "";
  if (actionButton.dataset.action === "confirm-modal") {
    const kind = actionButton.dataset.kind;
    const reason = document.querySelector("#modal-reason");
    if (reason && !reason.value.trim()) {
      reason.style.borderColor = "#dc2626";
      reason.focus();
      return;
    }
    document.querySelector("#modal-root").innerHTML = "";
    showToast(kind === "Publier" ? "Bundle publié avec succès" : `Réservation ${kind.toLowerCase()} avec succès`);
  }
  if (actionButton.dataset.action === "close-toast") document.querySelector("#toast-root").innerHTML = "";
  if (actionButton.dataset.action === "send-reply") {
    const reply = document.querySelector("#ticket-reply");
    if (reply.value.trim()) {
      showToast("Réponse envoyée à Youssef");
      reply.value = "";
    } else {
      reply.focus();
    }
  }
});

document.querySelector("#sidebar-toggle").addEventListener("click", () => {
  const collapsed = document.querySelector("#sidebar").classList.toggle("collapsed");
  document.querySelector("#workspace").classList.toggle("expanded", collapsed);
  document.querySelector("#sidebar-toggle").setAttribute("aria-label", collapsed ? "Déplier le menu" : "Replier le menu");
});

document.querySelector("#notification-button").addEventListener("click", () => {
  document.querySelector("#notification-dropdown").classList.toggle("hidden");
});

document.querySelector("#toggle-password").addEventListener("click", () => {
  const password = document.querySelector("#login-password");
  password.type = password.type === "password" ? "text" : "password";
});

function enterAgentApp() {
  document.querySelector("#login-view").classList.add("hidden");
  document.querySelector("#agent-app").classList.remove("hidden");
  const requested = new URLSearchParams(window.location.search).get("page") || "dashboard";
  renderPage(requested in pageRenderers ? requested : "dashboard");
}

document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  enterAgentApp();
});

renderNotificationDropdown();
renderNav();
hydrateIcons();
