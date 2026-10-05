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
    <button class="nav-item ${currentPage === id || (currentPage === "booking" && id === "bookings") ? "active" : ""}" data-page="${id}">
      ${icon(iconName)}<span>${label}</span>${count ? `<em>${count}</em>` : ""}
    </button>`).join("");
}

function dashboardPage() {
  const kpis = [
    ["clock", "12", "Réservations", "En attente de validation", "+3 aujourd'hui", ""],
    ["wallet", "5", "Paiements", "À encaisser à l'arrivée", "8 750,00 MAD", "amber"],
    ["message", "3", "Tickets ouverts", "Dont 1 non assigné", "Action requise", "violet"],
    ["package", "8 / 3", "Bundles", "Publiés / brouillons", "1 dépublié", "green"],
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
    + `<div class="alert-banner"><span>${icon("alert")}</span><div><strong>2 bundles ont été dépubliés automatiquement</strong><p>Une ou plusieurs offres composantes ne sont plus disponibles.</p></div><button class="text-link" data-page="bundles">Consulter les bundles ${icon("arrow")}</button></div>
    <div class="kpi-grid">${kpis.map((item) => `<section class="card kpi-card"><div class="kpi-top"><span class="kpi-icon ${item[5]}">${icon(item[0])}</span><span class="kpi-trend">${item[4]}</span></div><div class="kpi-number">${item[1]}</div><strong>${item[2]}</strong><p>${item[3]}</p></section>`).join("")}</div>
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

function bundlesPage() {
  const bundles = [
    ["Échappée bleue du Nord","Chefchaouen · Tanger","Publié","2 450,00 MAD","2 082,50 MAD",photos.blue,64,8],
    ["Marrakech, riad & désert","Marrakech · Agafay","Publié","4 800,00 MAD","4 080,00 MAD",photos.riad,42,5],
    ["Escapade impériale à Fès","Fès · Meknès","Brouillon","3 250,00 MAD","2 925,00 MAD",photos.arch,85,12],
  ].map((item) => `<section class="card bundle-card"><div class="bundle-image"><img src="${item[5]}" alt="${item[0]}" />${badge(item[2], item[2] === "Publié" ? "green" : "gray")}<button class="bundle-menu">${icon("more")}</button></div><div class="bundle-body"><span class="location">${item[1]}</span><h2>${item[0]}</h2><div class="component-count"><span>${icon("package")}</span>3 composantes · 4 jours / 3 nuits</div><div class="price-flow"><small>Prix des offres</small><del>${item[3]}</del><em>−15 %</em><strong>${item[4]}</strong></div><div class="stock-title"><span>Stock dynamique</span><strong>${item[7]} bundles disponibles</strong></div><div class="stock-track"><i style="width:${item[6]}%"></i></div><div class="stock-note">Limité par : Riad Atlas – Chambre double</div><div class="bundle-actions">${button("Modifier", "outline", 'data-page="bundle-editor"')}${button("Aperçu", "ghost")}</div></div></section>`).join("");
  return pageHead("Catalogue", "Bundles", "Composez des expériences uniques à partir des offres disponibles.", button(`${icon("plus")} Nouveau bundle`, "primary", 'data-page="bundle-editor"'))
    + `<div class="alert-banner danger"><span>${icon("alert")}</span><div><strong>« Week-end impérial » a été dépublié automatiquement</strong><p>L'offre « Riad Atlas » a été désactivée par le fournisseur.</p></div><button class="text-link">Voir le détail ${icon("arrow")}</button></div>
      <section class="card bundle-toolbar"><label class="quick-search">${icon("search")}<input placeholder="Rechercher un bundle…" /></label><div class="chips">${["Tous","Publié · 8","Brouillon · 3","Archivé · 2"].map((text, i) => `<button class="chip ${i === 0 ? "active" : ""}">${text}</button>`).join("")}</div>${button(`${icon("filter")} Plus de filtres`, "outline")}</section>
      <div class="bundle-grid">${bundles}</div>${pagination()}`;
}

function bundleEditorPage() {
  const components = [
    ["bed", "Riad Atlas – Chambre double", "Atlas Hospitality", "2 nuits", "1 700,00 MAD"],
    ["car", "Excursion Marrakech → Essaouira", "Maroc Horizons", "2 pers.", "1 250,00 MAD"],
  ].map((item) => `<div class="component-row"><i>⠿</i><span class="offer-icon">${icon(item[0])}</span><div><strong>${item[1]}</strong><small>${item[2]} · Stock : 8</small></div><span>${item[3]}</span><b>${item[4]}</b><button class="remove-button">×</button></div>`).join("");
  return `<button class="back-link" data-page="bundles">← Retour aux bundles</button>`
    + pageHead("Nouveau bundle", "Créer une expérience", "Assemblez les offres, définissez la remise et publiez.", `${button("Enregistrer le brouillon", "outline", 'data-toast="Brouillon enregistré"')}${button("Publier", "primary", 'data-modal="Publier"')}`)
    + `<div class="editor-grid"><div>
      <section class="card form-card"><span class="step">01</span><h2>Informations générales</h2><p>Présentez l'expérience aux voyageurs.</p><label class="full-field"><span>Titre du bundle</span><input value="Escapade entre médina et océan" /></label><label class="full-field"><span>Description</span><textarea>Une escapade authentique entre les ruelles de Marrakech et la douceur d'Essaouira.</textarea></label><div class="dropzone">${icon("plus")}<strong>Glissez vos images ici</strong><span>JPG, PNG ou WebP · 5 Mo maximum</span></div></section>
      <section class="card form-card"><span class="step">02</span><h2>Composantes</h2><p>2 offres ajoutées · Réorganisez par glisser-déposer.</p>${components}${button(`${icon("plus")} Ajouter une offre`, "outline", 'data-toast="Sélecteur d’offres ouvert"')}</section>
      <section class="card form-card"><span class="step">03</span><h2>Réduction globale</h2><p>Définissez un avantage clair pour ce package.</p><div class="chips"><button class="chip active">Pourcentage</button><button class="chip">Montant fixe</button></div><label class="full-field"><span>Valeur</span><input value="15 %" /></label><div class="alert-banner" style="margin:0;min-height:45px"><span>${icon("alert")}</span><div><strong>Un bundle est toujours payé immédiatement.</strong></div></div></section>
    </div><aside><section class="card recap-card">${badge("Brouillon", "gray")}<h2>Récapitulatif en temps réel</h2><img src="${photos.riad}" alt="Riad marocain" /><strong>Escapade entre médina et océan</strong><div class="summary-row"><span>Somme des offres</span><strong>2 950,00 MAD</strong></div><div class="summary-row discount"><span>Remise (15 %)</span><strong>−442,50 MAD</strong></div><div class="final-price"><span>Prix final</span><strong>2 507,50 MAD</strong><small>pour 2 personnes</small></div><div class="dynamic-stock">${icon("package")}<div><span>Stock dynamique</span><strong>8 bundles disponibles</strong><small>Limité par Riad Atlas</small></div></div>${button("Publier le bundle", "primary", 'data-modal="Publier"')}</section></aside></div>`;
}

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
    ["alert","Bundle dépublié automatiquement","« Week-end impérial » n'est plus disponible au catalogue.","Il y a 2 h","red"],
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
  document.querySelector("#breadcrumb-label").textContent = page === "booking" ? "Détail de la réservation" : page === "bundle-editor" ? "Nouveau bundle" : navItems.find((item) => item[0] === page)?.[1] || "Tableau de bord";
  renderNav();
  hydrateIcons(document.querySelector("#page-content"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const root = document.querySelector("#toast-root");
  root.innerHTML = `<div class="toast"><span>${icon("check")}</span><div><strong>Action réussie</strong><p>${message}</p></div><button data-action="close-toast">×</button></div>`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { root.innerHTML = ""; }, 3200);
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
    <button class="dropdown-item" data-page="bundles"><span>${icon("alert")}</span><span><strong>Bundle dépublié</strong><p>Week-end impérial n'est plus publié</p><small>Il y a 2 h</small></span></button>
    <button class="dropdown-footer" data-page="notifications">Voir toutes les notifications ${icon("arrow")}</button>`;
}

document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
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

function goPublicSite() {
  window.location.href = "../accueil.html";
}
document.querySelector("#public-site-link")?.addEventListener("click", goPublicSite);
document.querySelector("#public-site-top")?.addEventListener("click", goPublicSite);

renderNotificationDropdown();
renderNav();
hydrateIcons();
