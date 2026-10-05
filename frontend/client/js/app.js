const state = {
  page: "dashboard",
  promo: false,
  quantity: 2,
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
  return `<button class="logo-static" data-page="accueil"><span class="logo-mark"><span>◇</span></span><span><strong>ATLAS</strong><small>VOYAGE</small></span></button>`;
}

function button(label, options = {}) {
  const { variant = "primary", iconName = "", page = "", action = "", disabled = false } = options;
  return `<button class="btn btn-${variant}" ${page ? `data-page="${page}"` : ""} ${action ? `data-action="${action}"` : ""} ${disabled ? "disabled" : ""}>${iconName ? icon(iconName, 18) : ""}<span>${label}</span></button>`;
}

function status(label, type = "success") {
  return `<span class="status ${type}"><i></i>${label}</span>`;
}

function header() {
  const categories = [["plane","Vols"],["bed","Hôtels & Riads"],["car","Location de voiture"],["taxi","Taxi / Transferts"],["compass","Excursions"],["gift","Bundles"],["map","Carte"]];
  return `<header>
    <div class="topbar"><div class="header-inner">
      ${logo()}
      <div class="header-actions">
        <span class="currency">MAD</span>
        <button class="icon-label" data-page="panier">${icon("cart")}<span>Panier</span><i>2</i></button>
        <button class="round-action" data-action="notifications" aria-label="Notifications">${icon("bell")}<i class="red-count">3</i></button>
        <div class="relative">
          <button class="account" data-action="account"><span class="avatar">SB</span><span><small>Bonjour,</small><b>Sarah</b></span><span>⌄</span></button>
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
    <nav class="catnav"><div class="header-inner">${categories.map(([name,label]) => `<button data-page="catalogue">${icon(name,18)}${label}</button>`).join("")}</div></nav>
  </header>`;
}

function sidebar(active) {
  const items = [["home","Vue d'ensemble","dashboard"],["calendar","Mes réservations","reservations"],["cart","Mon panier","panier"],["ticket","Mes tickets","tickets"],["bell","Notifications","dashboard"],["user","Mon profil","profil"]];
  return `<aside class="sidebar">
    <div class="side-user"><span class="avatar big">SB</span><div><b>Sarah Benali</b><small>Membre depuis 2024</small></div></div>
    <div class="side-label">MON ESPACE</div>
    ${items.map(([name,label,page]) => `<button class="${active === page ? "active" : ""}" data-page="${page}">${icon(name,19)}${label}${page === "panier" ? "<span>2</span>" : ""}</button>`).join("")}
    <div class="side-help"><span>${icon("help")}</span><b>Besoin d'aide ?</b><p>Notre équipe locale vous répond 7j/7.</p><button data-page="tickets">Contacter le support</button></div>
  </aside>`;
}

function shell(content, active = state.page) {
  return `${header()}<div class="client-layout static-page">${sidebar(active)}<main class="client-main">${content}</main></div>`;
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
    <div class="welcome"><div><span class="eyebrow">VOTRE ESPACE PERSONNEL</span><h1>Bonjour Sarah, prêt à repartir ?</h1><p>Retrouvez vos prochains voyages et gérez toutes vos réservations.</p></div>${button("Explorer les offres",{iconName:"search",page:"catalogue"})}</div>
    <div class="kpis">
      <div class="kpi"><span class="kpi-icon amber">${icon("calendar")}</span><div><small>À VENIR</small><strong>3</strong><p>réservations</p></div><span class="trend">+1 ce mois</span></div>
      <div class="kpi"><span class="kpi-icon blue">${icon("cart")}</span><div><small>TOTAL DÉPENSÉ</small><strong>8 640</strong><p>MAD cette année</p></div><div class="spark"><i></i><i></i><i></i><i></i><i></i></div></div>
      <div class="kpi status-kpi"><span class="kpi-icon green">${icon("check")}</span><div><small>RÉSERVATIONS</small><strong>8</strong><p>au total</p></div><div class="donut"><span>75%</span></div></div>
      <div class="kpi cart-kpi"><span class="kpi-icon violet">${icon("gift")}</span><div><small>MON PANIER</small><strong>2</strong><p>articles en attente</p></div><button data-page="panier">Voir ${icon("arrow",14)}</button></div>
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

function catalogue() {
  const offers = [
    [photos.riad,"HÔTEL","Riad Atlas – Chambre double","Chefchaouen","4,9","890,00 MAD","/ nuit"],
    [photos.medersa,"EXCURSION","Chefchaouen → Akchour","Chefchaouen","4,8","250,00 MAD","/ personne"],
    [photos.patio,"VOITURE","Dacia Logan – Agadir","Agadir","4,7","320,00 MAD","/ jour"],
    [photos.pool,"BUNDLE –15 %","Week-end Nord","Tanger & Chefchaouen","4,9","1 890,00 MAD","/ séjour"],
  ];
  return `${header()}<main class="catalogue static-page">
    <div class="catalogue-head"><span class="eyebrow">OFFRES SÉLECTIONNÉES</span><h1>Explorez le Maroc à votre rythme</h1><p>Des séjours, activités et services sélectionnés par notre équipe locale.</p>
      <div class="compact-search"><span>${icon("map")}<small>DESTINATION</small><b>Tout le Maroc</b></span><span>${icon("calendar")}<small>DATES</small><b>18/04/2026 – 20/04/2026</b></span><span>${icon("user")}<small>VOYAGEURS</small><b>2 adultes</b></span>${button("Rechercher",{iconName:"search",action:"search"})}</div>
    </div>
    <div class="catalogue-body">
      <aside class="filters"><div><h3>Filtrer les offres</h3><button data-action="reset-filters">Réinitialiser</button></div><label>TYPE D'OFFRE</label>
        ${["Hôtels & Riads","Excursions","Location de voiture","Vols","Taxi / Transferts"].map((label,index) => `<label class="checkline"><input type="checkbox" ${index < 2 ? "checked" : ""}><span>${label}</span><small>${[24,18,12,8,6][index]}</small></label>`).join("")}
        <hr><label>PRIX PAR PERSONNE</label><div class="price-range"><span>0 MAD</span><span>3 500 MAD</span></div><input type="range" min="0" max="3500" value="2300"><hr><label>OPTIONS</label><label class="checkline"><input type="checkbox"><span>Paiement à l'arrivée</span></label><label class="checkline"><input type="checkbox"><span>Annulation gratuite</span></label>
      </aside>
      <section class="results"><div class="results-head"><div><b>42 offres trouvées</b><div class="chips"><span>Hôtels & Riads ×</span><span>Excursions ×</span></div></div><select><option>Recommandés</option><option>Prix croissant</option><option>Plus récents</option></select></div>
        <div class="offer-grid">${offers.map(([image,type,title,place,rating,price,unit]) => `<article class="offer-card"><div class="offer-image-static"><img src="${image}" alt="${title}"><span>${type}</span><button data-action="favorite">♡</button></div><div class="offer-content"><small>${icon("map",14)}${place}</small><h3>${title}</h3><div class="rating"><b>★ ${rating}</b><span>(128 avis)</span></div><hr><div><span>À partir de <b>${price}</b><small>${unit}</small></span><button data-page="panier">${icon("arrow")}</button></div></div></article>`).join("")}</div>
        <div class="pagination"><button>‹</button><button class="active">1</button><button>2</button><button>3</button><span>…</span><button>8</button><button>›</button></div>
      </section>
    </div>
  </main>${footer()}`;
}

function cart() {
  const excursionTotal = `${(250 * state.quantity).toLocaleString("fr-FR")},00 MAD`;
  const total = state.promo ? "2 052,00" : "2 280,00";
  return shell(`
    <div class="page-title"><div><span class="eyebrow">VOTRE SÉLECTION</span><h1>Mon panier <small>2 articles</small></h1><p>Vérifiez les détails avant de poursuivre votre réservation.</p></div><button class="text-danger" data-action="clear-cart">${icon("trash")}Vider le panier</button></div>
    <div class="cart-layout"><section>
      <div class="cart-line card"><img src="${photos.riad}" alt="Riad Atlas"><div class="line-main"><div><span class="type-pill">HÔTEL</span>${status("Disponible")}</div><h3>Riad Atlas – Chambre double</h3><p>${icon("map",15)} Chefchaouen · ${icon("calendar",15)} 18/04/2026 → 20/04/2026</p><small>2 nuits · 1 chambre · 2 adultes</small><div class="line-actions"><button data-action="edit">Modifier</button><button class="text-danger" data-action="remove">Supprimer</button></div></div><div class="line-price"><small>890,00 MAD / nuit</small><b>1 780,00 MAD</b></div></div>
      <div class="cart-line card"><img src="${photos.medersa}" alt="Excursion Akchour"><div class="line-main"><div><span class="type-pill">EXCURSION</span>${status("Disponible")}</div><h3>Excursion Chefchaouen → Akchour</h3><p>${icon("map",15)} Départ Chefchaouen · ${icon("calendar",15)} 19/04/2026 à 08:30</p><div class="quantity"><button data-action="decrement">${icon("minus",15)}</button><b>${state.quantity}</b><button data-action="increment">${icon("plus",15)}</button><span>personnes</span></div><div class="line-actions"><button data-action="edit">Modifier</button><button class="text-danger" data-action="remove">Supprimer</button></div></div><div class="line-price"><small>250,00 MAD / personne</small><b>${excursionTotal}</b></div></div>
      <div class="reassurance"><span>${icon("check")}Annulation gratuite jusqu'à 48 h avant</span><span>${icon("shield")}Réservation protégée</span></div>
    </section>
    <aside class="summary card"><h2>Récapitulatif</h2><div class="sum-row"><span>Sous-total</span><b>2 280,00 MAD</b></div><div class="promo"><label>CODE PROMO</label><div><input id="promo-input" placeholder="Votre code" value="${state.promo ? "BIENVENUE10" : ""}"><button data-action="promo">Appliquer</button></div>${state.promo ? `<p>${icon("check",14)} Code BIENVENUE10 appliqué</p>` : ""}</div>${state.promo ? '<div class="sum-row green"><span>Remise (–10 %)</span><b>–228,00 MAD</b></div>' : ""}<hr><div class="total"><span>Total à payer<small>Taxes incluses</small></span><b>${total} <small>MAD</small></b></div>${button("Passer au paiement",{page:"checkout"})}<p class="secure">${icon("shield",17)} Paiement 100 % sécurisé</p></aside>
    </div>`, "panier");
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

const views = { dashboard, catalogue, panier: cart, checkout, confirmation, reservations, reservation, tickets, profil: profile };

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
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  document.getElementById("app").innerHTML = (views[page] || dashboard)();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.page) {
    navigatePage(target.dataset.page);
    return;
  }
  const action = target.dataset.action;
  if (!action) return;
  if (action === "account") document.getElementById("account-menu")?.classList.toggle("open");
  if (action === "notifications") toast("3 notifications récentes, dont 2 non lues.");
  if (action === "increment") { state.quantity += 1; render("panier"); }
  if (action === "decrement") { state.quantity = Math.max(1, state.quantity - 1); render("panier"); }
  if (action === "promo") {
    const value = document.getElementById("promo-input")?.value.trim().toUpperCase();
    if (value === "BIENVENUE10") { state.promo = true; render("panier"); toast("Code BIENVENUE10 appliqué.", "success"); }
    else toast("Ce code promo est inconnu ou expiré.", "error");
  }
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
  if (action === "reset-filters") { render("catalogue"); toast("Filtres réinitialisés."); }
  if (action === "search") toast("42 offres correspondent à votre recherche.");
  if (action === "edit") toast("Vous pouvez modifier les dates et la quantité.");
  if (action === "remove") modal("Retirer cet article ?", "L'article sera supprimé de votre panier.", "Retirer", () => toast("Article retiré du panier.", "success"));
  if (action === "clear-cart") modal("Vider le panier ?", "Tous les articles seront retirés de votre panier.", "Vider le panier", () => toast("Votre panier est maintenant vide.", "success"));
  if (action === "cancel-booking") modal("Annuler la réservation ?", "Vous serez remboursé à 100 %, soit 2 052,00 MAD.", "Confirmer l'annulation", () => toast("Réservation annulée. Le remboursement est en cours.", "success"));
  if (action === "new-ticket") toast("Le formulaire de création de ticket est prêt.");
  if (action === "open-ticket") toast("Conversation avec le support ouverte.");
  if (action === "photo") toast("Sélectionnez une photo JPG ou PNG de moins de 2 Mo.");
  if (action === "logout") toast("Déconnexion simulée.");
});

document.addEventListener("input", (event) => {
  if (event.target.id === "card-number") {
    let value = event.target.value.replace(/\D/g, "").slice(0, 16);
    event.target.value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    const error = document.getElementById("card-error");
    if (error) error.textContent = value.length > 0 && value.length < 16 ? "Le numéro doit contenir 16 chiffres." : "";
  }
});

const initialPage = new URLSearchParams(window.location.search).get("page") || "dashboard";
navigatePage(initialPage in views || initialPage in externalPages ? initialPage : "dashboard");
