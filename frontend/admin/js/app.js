const state = {
  page: "dashboard",
  collapsed: false,
};

const pages = {
  dashboard: "Tableau de bord",
  users: "Utilisateurs",
  promos: "Codes promo",
  offers: "Supervision des offres",
  bookings: "Réservations",
  payments: "Paiements",
  tickets: "Tickets de support",
  audit: "Journal d’audit",
  settings: "Paramètres globaux",
  notifications: "Notifications",
  profile: "Mon profil",
};

const navGroups = [
  { label: "Pilotage", items: [["dashboard", "layout-dashboard", "Tableau de bord"]] },
  { label: "Gestion", items: [["users", "users", "Utilisateurs"], ["promos", "tags", "Codes promo"], ["offers", "briefcase-business", "Offres"]] },
  { label: "Activité", items: [["bookings", "calendar-days", "Réservations"], ["payments", "credit-card", "Paiements"], ["tickets", "messages-square", "Tickets"], ["audit", "history", "Journal d’audit"]] },
  { label: "Système", items: [["settings", "settings", "Paramètres"]] },
];

let adminOffers = [];
const offerTypes = {
  HOTEL: ["Hôtel & Riad", "hotel"], FLIGHT: ["Vol", "plane"], CAR: ["Location de voiture", "car"],
  TAXI_TRANSFER: ["Taxi / Transfert", "car-taxi-front"], EXCURSION: ["Excursion", "compass"]
};
const bookings = [];

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
  if(["Annulée","Désactivée par l’admin","Expiré"].includes(status)) return "red";
  if(["En attente","Bientôt expiré","Ouvert"].includes(status)) return "amber";
  if(["Confirmée","En cours"].includes(status)) return "blue";
  if(status==="Remboursé") return "purple";
  return "gray";
}

function renderNav() {
  document.querySelector("#main-nav").innerHTML = navGroups.map(group => `<div class="nav-group"><p class="nav-label">${group.label}</p>${group.items.map(([id,ico,label,count]) => `<button class="nav-item nav-link ${state.page===id?"active":""}" data-page="${id}" title="${label}">${icon(ico)}<span>${label}</span>${count?`<b class="nav-count">${count}</b>`:""}</button>`).join("")}</div>`).join("");
}


function dashboardPage() { return '<div id="stats-module"></div>';
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
let adminCities = [];

async function syncCitiesApi() {
  try {
    const list = await api.get("/api/cities");
    if (Array.isArray(list)) {
      adminCities = list.map((c) => ({
        id: c.id,
        name: c.name,
        country: c.country || "Maroc",
        code: c.countryCode || "MA",
        latitude: c.latitude != null ? Number(c.latitude).toFixed(4) : "—",
        longitude: c.longitude != null ? Number(c.longitude).toFixed(4) : "—",
        airport: c.hasAirport ? "Oui" : "Non",
        offers: c.offerCount != null ? Number(c.offerCount) : 0,
        active: true,
      }));
    }
  } catch (err) {
    console.warn("Backend API /api/cities non disponible :", err);
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
            <button type="button" class="action-btn action-delete" data-action-city="delete" data-id="${c.id}" title="Supprimer" aria-label="Supprimer">${icon("trash-2")}</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  const allCountries = ["Tous les pays", ...Array.from(new Set(adminCities.map(c => c.country).filter(Boolean)))];
  return `<div class="page-actions"><p>Gérez le référentiel géographique utilisé par les offres.</p>${button("Ajouter une ville", "plus", "primary", 'data-modal="city"')}</div>${filters("Rechercher une ville...", [allCountries, ["Aéroport : Tous", "Oui", "Non"]])}${table(["Ville", "Pays", "Code", "Latitude", "Longitude", "Aéroport", "Offres liées", "Active", "Actions"], rows, `${adminCities.length} villes`)}`;
}

let adminPromos = [];

const promoStatusLabel = (p) => (!p.active ? "Désactivé" : p.expired ? "Expiré" : "Actif");
const promoTypeLabel = (p) => (p.discountType === "PERCENTAGE" ? "Pourcentage" : "Montant fixe");
const promoValueLabel = (p) => (p.discountType === "PERCENTAGE" ? `−${Number(p.value)} %` : `−${Number(p.value).toLocaleString("fr-FR")} MAD`);
const promoExpiryLabel = (p) => (p.expiryDate ? new Date(`${p.expiryDate}T00:00:00`).toLocaleDateString("fr-FR") : "Sans limite");

async function promosPage() {
  try {
    adminPromos = await api.get("/api/promo-codes");
  } catch (err) {
    adminPromos = [];
    return `${apiErrorBanner(err.message)}<div class="empty-state"><span class="round-icon">${icon("tags")}</span><h2>Codes promo indisponibles</h2><p>Impossible de charger la liste depuis l’API.</p></div>`;
  }
  const rows = adminPromos.map((p) => {
    const status = promoStatusLabel(p);
    const search = `${p.code} ${promoTypeLabel(p)} ${status}`.toLowerCase();
    return `<tr data-search="${escapeHtml(search)}" data-promo-status="${status}" data-promo-type="${promoTypeLabel(p)}"><td><span class="code">${escapeHtml(p.code)}</span> <button class="row-action inline-flex" data-copy="${escapeHtml(p.code)}" aria-label="Copier le code">${icon("copy")}</button></td><td>${promoTypeLabel(p)}</td><td><strong>${promoValueLabel(p)}</strong></td><td>${promoExpiryLabel(p)}</td><td>${badge(status, statusTone(status))}</td><td><button type="button" class="toggle ${p.active ? "active" : ""}" data-toggle-promo="${p.id}" aria-label="Activer ou désactiver le code"><span></span></button></td><td class="table-actions-cell"><div class="row-actions-group"><button type="button" class="action-btn action-edit" data-promo-edit="${p.id}" title="Modifier" aria-label="Modifier">${icon("pencil")}</button><button type="button" class="action-btn action-delete" data-promo-delete="${p.id}" title="Supprimer" aria-label="Supprimer">${icon("trash-2")}</button></div></td></tr>`;
  }).join("");
  const empty = adminPromos.length ? "" : `<div class="empty-state"><span class="round-icon">${icon("tags")}</span><h2>Aucun code promo</h2><p>Créez votre premier code pour lancer une campagne.</p></div>`;
  return `<div class="page-actions"><p>Créez et gérez les codes promo appliqués au panier des clients.</p>${button("Nouveau code", "plus", "primary", 'data-modal="create-promo"')}</div>${filters("Rechercher par code...", [["Tous les statuts", "Actif", "Expiré", "Désactivé"], ["Tous les types", "Pourcentage", "Montant fixe"]])}${adminPromos.length ? table(["Code", "Type", "Valeur", "Expiration", "Statut", "Actif", ""], rows, "") : empty}`;
}
function offerMoney(value) { return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(Number(value || 0)); }
function offerDate(value) { return value ? new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
function offerMeta(type) { return offerTypes[type] || [type || "Offre", "briefcase-business"]; }
function offerImage(path) {
  if (!path) return "../images/favicon.png";
  try { const url = new URL(path, location.href); if (["localhost", "127.0.0.1"].includes(url.hostname) && url.pathname.startsWith("/images/")) return `../images/${url.pathname.slice(8)}`; } catch (_) { /* chemin relatif */ }
  return path;
}
async function offersPage() {
  try { adminOffers = await api.get("/api/offers"); }
  catch (err) { adminOffers = []; return `${apiErrorBanner(err.message)}<div class="empty-state"><span class="round-icon">${icon("briefcase-business")}</span><h2>Offres indisponibles</h2><p>Vérifiez le backend et votre session administrateur.</p>${button("Réessayer", "refresh-cw", "primary", 'data-action="refresh-offers"')}</div>`; }
  const active = adminOffers.filter(o => o.active).length, inactive = adminOffers.length - active;
  const withoutAvailability = adminOffers.filter(o => !o.availabilities?.some(p => new Date(p.endAt) > new Date())).length;
  const suppliers = [...new Set(adminOffers.map(o => o.supplierName).filter(Boolean))].sort((a,b) => a.localeCompare(b, "fr"));
  const rows = adminOffers.map(o => {
    const [label, ico] = offerMeta(o.type), hasFuture = o.availabilities?.some(p => new Date(p.endAt) > new Date()), status = !o.active ? "Désactivée" : hasFuture ? "Disponible" : "Sans disponibilité";
    const search = `${o.title} ${label} ${o.supplierName} ${o.cityName} ${status}`.toLowerCase();
    return `<tr data-search="${escapeHtml(search)}" data-offer-type="${escapeHtml(label)}" data-offer-supplier="${escapeHtml(o.supplierName)}" data-offer-status="${status}"><td><div class="offer-cell"><img src="${escapeHtml(offerImage(o.images?.[0]))}" alt=""><div><strong>${escapeHtml(o.title)}</strong><span>#${o.id} · ${escapeHtml(o.cityName || "Ville non renseignée")}</span></div></div></td><td>${badge(label,"blue")}</td><td>${escapeHtml(o.supplierName || "—")}</td><td>${escapeHtml(o.cityName || "—")}</td><td><strong>${offerMoney(o.basePrice)}</strong></td><td>${o.availabilities?.length || 0} période${o.availabilities?.length === 1 ? "" : "s"}</td><td>${badge(status, !o.active ? "red" : hasFuture ? "green" : "amber")}</td><td class="table-actions-cell"><div class="row-actions-group"><button class="action-btn action-view" data-offer-view="${o.id}" title="Voir le détail">${icon("eye")}</button><button class="action-btn ${o.active ? "action-delete" : "action-edit"}" data-offer-moderate="${o.id}" title="${o.active ? "Désactiver" : "Réactiver"}">${icon(o.active ? "circle-pause" : "circle-play")}</button></div></td></tr>`;
  }).join("");
  const kpis = `<div class="offer-kpis"><div class="offer-kpi"><span>${icon("briefcase-business")}</span><div><small>Total</small><strong>${adminOffers.length}</strong></div></div><div class="offer-kpi success"><span>${icon("circle-check")}</span><div><small>Actives</small><strong>${active}</strong></div></div><div class="offer-kpi danger"><span>${icon("circle-pause")}</span><div><small>Désactivées</small><strong>${inactive}</strong></div></div><div class="offer-kpi warning"><span>${icon("calendar-x")}</span><div><small>Sans disponibilité</small><strong>${withoutAvailability}</strong></div></div></div>`;
  const filterHtml = filters("Titre, ville ou fournisseur...", [["Tous les types", ...Object.values(offerTypes).map(x=>x[0])], ["Tous les fournisseurs", ...suppliers], ["Tous les statuts", "Disponibles", "Désactivées", "Sans disponibilité"]]);
  const content = adminOffers.length ? table(["Offre","Type","Fournisseur","Ville","Prix de base","Disponibilités","Statut","Actions"], rows, "") : `<div class="empty-state card"><span class="round-icon">${icon("package-open")}</span><h2>Aucune offre</h2><p>Les offres créées par les fournisseurs apparaîtront ici.</p></div>`;
  return `<div class="page-actions"><p>Consultez et modérez toutes les offres publiées par les fournisseurs.</p>${button("Actualiser", "refresh-cw", "secondary", 'data-action="refresh-offers"')}</div>${kpis}${filterHtml}${content}`;
}
function bookingsPage() { return '<div id="booking-module"></div>';
}
function ticketsPage() { return '<div id="tickets-module"></div>'; }
function auditPage() { return '<div id="audit-module"></div>'; }
function settingsPage() { return '<div id="settings-module"></div>'; }
function notificationsPage() { return '<div id="notification-module"></div>'; }
function profilePage() { return '<div id="profile-module"></div>'; }

const renderers={dashboard:dashboardPage,users:usersPage,promos:promosPage,offers:offersPage,bookings:bookingsPage,payments:()=>'<div id="payment-module"></div>',tickets:ticketsPage,audit:auditPage,settings:settingsPage,notifications:notificationsPage,profile:profilePage};

async function renderPage(page) {
  StatsUI.dispose(); AccountUI.dispose();
  if (!pages[page]) page = "dashboard";
  state.page = page;
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  const titleEl = document.querySelector("#page-title");
  if (titleEl) titleEl.textContent = pages[page];
  const breadcrumbEl = document.querySelector("#breadcrumb-page");
  if (breadcrumbEl) breadcrumbEl.textContent = pages[page];
  const pageHeader = document.querySelector("#page-header");
  if (pageHeader) pageHeader.innerHTML = page === "dashboard" ? "" : `<h1 class="page-title">${pages[page]}</h1>`;
  const container = document.querySelector("#page-content") || document.querySelector("#page-body");
  if (container) container.innerHTML = `<div class="card" style="padding:18px;color:var(--muted)">Chargement…</div>`;
  const renderer = renderers[page] || dashboardPage;
  const html = await renderer();
  if (container) container.innerHTML = html;
  if (page === "bookings") BookingsUI.list(document.getElementById("booking-module"), "ADMIN");
  if (page === "dashboard") StatsUI.mount(document.getElementById("stats-module"), "ADMIN");
  if (page === "payments") PaymentsUI.list(document.getElementById("payment-module"), "ADMIN");
  if (page === "notifications") NotificationsUI.page(document.getElementById("notification-module"));
  if (page === "tickets") TicketsUI.admin(document.getElementById("tickets-module"));
  if (page === "profile") AccountUI.mount(document.getElementById("profile-module"),"ADMIN");
  if (page === "audit") initAudit(document.getElementById("audit-module"));
  if (page === "settings") initSettings(document.getElementById("settings-module"));
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
  document.querySelectorAll("[data-promo-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const promo = adminPromos.find((x) => String(x.id) === btn.dataset.promoEdit);
      if (promo) openModal("edit-promo", promo);
    });
  });

  document.querySelectorAll("[data-toggle-promo]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const promo = adminPromos.find((x) => String(x.id) === btn.dataset.togglePromo);
      if (!promo) return;
      try {
        await api.put(`/api/promo-codes/${promo.id}`, promoPayload(promo, { active: !promo.active }));
        showToast(promo.active ? "Code désactivé" : "Code activé", `Le code ${escapeHtml(promo.code)} est maintenant ${promo.active ? "désactivé" : "actif"}.`);
      } catch (e) {
        showToast("Modification impossible", escapeHtml(e.message));
      }
      renderPage("promos");
    });
  });

  document.querySelectorAll("[data-promo-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const promo = adminPromos.find((x) => String(x.id) === btn.dataset.promoDelete);
      if (!promo) return;
      confirmModal({
        title: "Supprimer le code promo",
        message: `Le code ${escapeHtml(promo.code)} sera supprimé et retiré des paniers qui l’utilisent. Pour le suspendre seulement, désactivez-le.`,
        label: "Supprimer", icon: "trash-2", danger: true,
        onConfirm: async () => {
          try {
            await api.delete(`/api/promo-codes/${promo.id}`);
            showToast("Code supprimé", `Le code ${escapeHtml(promo.code)} a été supprimé.`);
          } catch (e) {
            showToast("Suppression impossible", escapeHtml(e.message));
          }
          renderPage("promos");
        },
      });
    });
  });

  document.querySelectorAll(".toggle:not([data-toggle-city]):not([data-toggle-promo])").forEach(el=>el.addEventListener("click",()=>el.classList.toggle("active")));

  const searchInput = document.querySelector(".table-search");
  const filterSelects = document.querySelectorAll(".filters select");
  const filterReset = document.querySelector(".filters .reset");

  let currentPage = 1;
  const pageSizeSelect = document.querySelector(".page-size-select");
  let pageSize = pageSizeSelect ? (parseInt(pageSizeSelect.value, 10) || 10) : 10;

  function updateTableDisplay() {
    const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const isUsersPage = state.page === "users";
    const isPromosPage = state.page === "promos";
    const isOffersPage = state.page === "offers";
    const role = isUsersPage && filterSelects[0] ? filterSelects[0].value : "Tous les rôles";
    const status = isUsersPage && filterSelects[1] ? filterSelects[1].value : "Tous les statuts";
    const country = !isUsersPage && !isPromosPage && !isOffersPage && filterSelects[0] ? filterSelects[0].value : "Tous les pays";
    const airport = !isUsersPage && !isPromosPage && !isOffersPage && filterSelects[1] ? filterSelects[1].value : "Aéroport : Tous";
    const promoStatus = isPromosPage && filterSelects[0] ? filterSelects[0].value : "Tous les statuts";
    const promoType = isPromosPage && filterSelects[1] ? filterSelects[1].value : "Tous les types";
    const offerType = isOffersPage && filterSelects[0] ? filterSelects[0].value : "Tous les types";
    const offerSupplier = isOffersPage && filterSelects[1] ? filterSelects[1].value : "Tous les fournisseurs";
    const offerStatus = isOffersPage && filterSelects[2] ? filterSelects[2].value : "Tous les statuts";

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

      const matchPromo = (promoStatus === "Tous les statuts" || row.dataset.promoStatus === promoStatus)
        && (promoType === "Tous les types" || row.dataset.promoType === promoType);
      const rowOfferStatus = row.dataset.offerStatus || "";
      const matchOfferStatus = offerStatus === "Tous les statuts"
        || (offerStatus === "Disponibles" && rowOfferStatus === "Disponible")
        || (offerStatus === "Désactivées" && rowOfferStatus === "Désactivée")
        || (offerStatus === "Sans disponibilité" && rowOfferStatus === "Sans disponibilité");
      const matchOffer = (offerType === "Tous les types" || row.dataset.offerType === offerType)
        && (offerSupplier === "Tous les fournisseurs" || row.dataset.offerSupplier === offerSupplier)
        && matchOfferStatus;

      if (matchQ && matchRole && matchStatus && matchCountry && matchAirport && matchPromo && matchOffer) {
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
  document.querySelectorAll('[data-action="refresh-offers"]').forEach(b=>b.addEventListener("click",()=>renderPage("offers")));
  document.querySelectorAll("[data-offer-view]").forEach(b=>b.addEventListener("click",()=>openOfferDetail(adminOffers.find(o=>String(o.id)===b.dataset.offerView))));
  document.querySelectorAll("[data-offer-moderate]").forEach(b=>b.addEventListener("click",()=>openOfferModeration(adminOffers.find(o=>String(o.id)===b.dataset.offerModerate))));
  document.querySelectorAll('[data-action="export"]').forEach(b=>b.addEventListener("click",()=>showToast("Export prêt","Le fichier CSV a été généré.")));
  document.querySelectorAll('[data-action="save-setting"]').forEach(b=>b.addEventListener("click",()=>showToast("Paramètre enregistré","La modification s’applique immédiatement.")));
}

async function searchCityApi(query) {
  if (typeof window !== "undefined" && window.GeocodingClient) {
    try {
      return await window.GeocodingClient.search(query);
    } catch (e) {
      console.warn("GeocodingClient error, fallback:", e);
    }
  }
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
  const passwordHint = user ? "Laissez vide pour conserver le mot de passe actuel." : "12 caractères minimum, majuscule, minuscule, chiffre et symbole ; 72 octets maximum, sans l’e-mail.";
  const categories = Object.entries(offerTypes).map(([value,[label]])=>`<option value="${value}" ${user?.supplierCategory===value?"selected":""}>${label}</option>`).join("");
  return `<div class="form-grid"><label class="field full">Nom complet<input id="user-fullname" placeholder="Prénom Nom" maxlength="120" value="${user ? escapeHtml(user.fullName) : ""}"></label><label class="field full">Email<input id="user-email" type="email" placeholder="nom@exemple.ma" maxlength="180" value="${user ? escapeHtml(user.email) : ""}"></label><label class="field">Rôle<select id="user-role">${options}</select></label><label class="field">Mot de passe<input id="user-password" type="password" autocomplete="new-password" maxlength="100" placeholder="${user ? "Inchangé" : "Mot de passe"}"><small>${passwordHint}</small></label><label class="field full" id="supplier-category-wrap" style="display:${user?.role==="SUPPLIER"?"flex":"none"}">Spécialité du fournisseur<select id="user-supplier-category"><option value="">Sélectionner une activité</option>${categories}</select><small>Ce compte pourra créer uniquement ce type d’offre.</small></label></div>`;
}

/** Corps de requête de l'API à partir d'un code existant, avec les champs à remplacer. */
function promoPayload(promo, overrides = {}) {
  return { code: promo.code, discountType: promo.discountType, value: promo.value, expiryDate: promo.expiryDate, active: promo.active, ...overrides };
}

function offerSpecificDetails(o) {
  const values = o.type === "HOTEL" ? [["Étoiles", `${o.stars || "—"}/5`], ["Chambre", o.roomType], ["Adresse", o.address]]
    : o.type === "FLIGHT" ? [["Compagnie", o.airline], ["Vol", o.flightNumber], ["Trajet", `${o.departureAirport || "—"} → ${o.arrivalAirport || "—"}`], ["Type", o.roundTrip ? "Aller-retour" : "Aller simple"], ["Classe", ({ECONOMY:"Économique",PREMIUM_ECONOMY:"Économique premium",BUSINESS:"Affaires",FIRST:"Première classe"})[o.cabinClass] || o.cabinClass], ["Départ aller", offerDate(o.departureDateTime)], ...(o.roundTrip ? [["Départ retour", offerDate(o.returnDepartureDateTime)]] : [])]
    : o.type === "CAR" ? [["Véhicule", `${o.brand || ""} ${o.model || ""}`], ["Transmission", o.transmission], ["Places", o.seats], ["Prise en charge", o.pickupLocation], ["Restitutions autorisées", (o.dropoffLocations || []).join(" · ")], ["Âge conducteur", `${o.minimumDriverAge || 21}–${o.maximumDriverAge || 75} ans`]]
    : o.type === "TAXI_TRANSFER" ? [["Départ", o.pickupLocation], ["Arrivée", o.dropoffLocation], ["Véhicule", o.vehicleType]]
    : [["Durée", o.durationHours ? `${o.durationHours} h` : "—"], ["Guide", o.includesGuide ? "Inclus" : "Non inclus"], ["Transport", o.includesTransport ? "Inclus" : "Non inclus"], ["Itinéraire", o.itinerary]];
  return values.filter(([,v])=>v !== null && v !== undefined && v !== "").map(([k,v])=>`<div><small>${k}</small><strong>${escapeHtml(v)}</strong></div>`).join("");
}

function openOfferDetail(o) {
  if (!o) return;
  const [label] = offerMeta(o.type);
  const periods = (o.availabilities || []).map(p=>`<li><strong>${offerDate(p.startAt)}</strong> → <strong>${offerDate(p.endAt)}</strong> · capacité ${p.capacity}</li>`).join("") || "<li>Aucune période configurée</li>";
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop"><div class="modal large"><header class="modal-header"><span class="modal-symbol">${icon("briefcase-business")}</span><div><h2>${escapeHtml(o.title)}</h2><p>Offre #${o.id} · ${escapeHtml(label)}</p></div><button data-close-modal>${icon("x")}</button></header><div class="modal-body"><div class="offer-detail-hero"><img src="${escapeHtml(offerImage(o.images?.[0]))}" alt=""><div><div>${badge(o.active ? "Active" : "Désactivée", o.active ? "green" : "red")}</div><h3>${offerMoney(o.basePrice)}</h3><p>${escapeHtml(o.description || "Aucune description fournie.")}</p></div></div><div class="offer-detail-grid"><div><small>Fournisseur</small><strong>${escapeHtml(o.supplierName || "—")}</strong></div><div><small>Ville</small><strong>${escapeHtml(o.cityName || "—")}</strong></div><div><small>Périodes</small><strong>${o.availabilities?.length || 0}</strong></div><div><small>Paiement à l’arrivée</small><strong>${o.allowsPayOnArrival ? "Autorisé" : "Non autorisé"}</strong></div>${offerSpecificDetails(o)}</div><div class="offer-moderation-note"><strong>Calendrier des disponibilités</strong><ul>${periods}</ul></div>${o.moderatedAt ? `<div class="offer-moderation-note"><strong>Dernière modération</strong><span>${escapeHtml(o.moderatedByName || "Administrateur")} · ${offerDate(o.moderatedAt)}</span><p>${escapeHtml(o.moderationReason || "Aucun motif renseigné")}</p></div>` : ""}</div><footer class="modal-actions">${button("Fermer", "", "ghost", "data-close-modal")}${button(o.active ? "Désactiver" : "Réactiver", o.active ? "circle-pause" : "circle-play", o.active ? "danger" : "primary", `data-detail-moderate="${o.id}"`)}</footer></div></div>`;
  lucide.createIcons();
  document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",closeModal));
  document.querySelector("#user-role")?.addEventListener("change", event => { const wrap=document.querySelector("#supplier-category-wrap"); if(wrap) wrap.style.display=event.target.value==="SUPPLIER"?"flex":"none"; });
  document.querySelector("[data-detail-moderate]")?.addEventListener("click",()=>{ closeModal(); openOfferModeration(o); });
}

function openOfferModeration(o) {
  if (!o) return;
  const activate = !o.active;
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop"><div class="modal"><header class="modal-header"><span class="modal-symbol ${activate ? "" : "danger"}">${icon(activate ? "circle-play" : "triangle-alert")}</span><div><h2>${activate ? "Réactiver" : "Désactiver"} l’offre</h2><p>${escapeHtml(o.title)} · ${escapeHtml(o.supplierName || "Fournisseur")}</p></div><button data-close-modal>${icon("x")}</button></header><div class="modal-body">${activate ? "" : `<div class="modal-warning">${icon("triangle-alert")}L’offre disparaîtra immédiatement du catalogue public et ne pourra plus être ajoutée au panier.</div>`}<label class="field">Motif ${activate ? "de réactivation" : "obligatoire"}<textarea id="offer-moderation-reason" maxlength="1000" placeholder="Expliquez clairement la décision..."></textarea><small>Cette information est conservée dans l’historique de l’offre.</small></label><div class="reason-pills"><button type="button">Contenu inexact</button><button type="button">Prix non conforme</button><button type="button">Signalement client</button><button type="button">Informations corrigées</button></div></div><footer class="modal-actions">${button("Annuler", "", "ghost", "data-close-modal")}${button(activate ? "Réactiver" : "Désactiver", "", activate ? "primary" : "danger", "data-confirm-offer-moderation")}</footer></div></div>`;
  lucide.createIcons();
  document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",closeModal));
  document.querySelectorAll(".reason-pills button").forEach(b=>b.addEventListener("click",()=>{ document.querySelector("#offer-moderation-reason").value=b.textContent; }));
  document.querySelector("[data-confirm-offer-moderation]").addEventListener("click", async (event)=>{
    const reason = document.querySelector("#offer-moderation-reason").value.trim();
    if (!activate && !reason) { showToast("Motif requis", "Indiquez pourquoi cette offre doit être désactivée."); return; }
    event.currentTarget.disabled = true;
    try { await api.post(`/api/offers/${o.id}/moderation`, { active: activate, reason: reason || null }); }
    catch (err) { event.currentTarget.disabled = false; showToast("Modération impossible", err.message); return; }
    closeModal(); showToast(activate ? "Offre réactivée" : "Offre désactivée", `« ${o.title} » a été mise à jour.`); renderPage("offers");
  });
}

function promoFormBody(promo = null) {
  const types = [["PERCENTAGE", "Pourcentage (%)"], ["FIXED", "Montant fixe (MAD)"]];
  const typeOptions = types.map(([value, label]) => `<option value="${value}" ${promo?.discountType === value ? "selected" : ""}>${label}</option>`).join("");
  return `<div class="form-grid"><label class="field full">Code promotionnel<input id="promo-code" placeholder="EX. AUTOMNE25" maxlength="30" autocomplete="off" style="text-transform:uppercase" value="${promo ? escapeHtml(promo.code) : ""}"><small>3 à 30 caractères : lettres, chiffres, tirets ou underscores.</small></label><label class="field">Type de réduction<select id="promo-type">${typeOptions}</select></label><label class="field">Valeur<input id="promo-value" type="number" min="0.01" step="0.01" placeholder="10" value="${promo ? Number(promo.value) : ""}"><small>Pourcentage (max 100) ou montant en MAD.</small></label><label class="field">Date d’expiration<input id="promo-expiry" type="date" value="${promo?.expiryDate || ""}"><small>Laissez vide pour un code sans limite. Valable jusqu’à ce jour inclus.</small></label><label class="field">Statut<select id="promo-active"><option value="true" ${!promo || promo.active ? "selected" : ""}>Actif</option><option value="false" ${promo && !promo.active ? "selected" : ""}>Désactivé</option></select></label></div>`;
}

function openModal(type, extra = null) {
  const cityObj = extra && typeof extra === "object" ? extra : (extra != null ? adminCities.find(c => String(c.id) === String(extra)) : null);
  const userObj = type.includes("user") && extra && typeof extra === "object" ? extra : null;
  const promoObj = type === "edit-promo" && extra && typeof extra === "object" ? extra : null;

  const configs={
    "create-user":{title:"Créer un compte",subtitle:"Ajoutez un membre à la plateforme.",icon:"user-plus",large:true,body:userFormBody(),confirm:"Créer le compte"},
    "edit-user":{title:`Modifier ${userObj ? escapeHtml(userObj.fullName) : "l’utilisateur"}`,subtitle:"Mettez à jour les informations et le rôle du compte.",icon:"pencil",large:true,body:userFormBody(userObj),confirm:"Enregistrer"},    city:{title:"Ajouter une ville",subtitle:"Tapez une ville : le pays, le code pays et les coordonnées se remplissent automatiquement via l’API.",icon:"map-pin",large:true,body:`<div class="form-grid"><label class="field full" style="position:relative;"><div style="display:flex;justify-content:space-between;align-items:center;"><span>Nom de la ville</span><span style="font-size:8px;color:var(--primary-700);font-weight:600;">✨ Recherche & Remplissage auto via API</span></div><div class="city-input-wrap"><input id="modal-city-name" placeholder="Ex. Marrakech, Agadir, Tanger, Paris, Madrid..." autocomplete="off" required><span id="modal-city-api-spinner" class="city-spinner hidden">${icon("loader-2")}</span></div><div id="modal-city-suggestions" class="city-suggestions hidden"></div></label><label class="field"><span>Pays (rempli automatiquement)</span><input id="modal-city-country" placeholder="Rempli via l'API" value="Maroc"></label><label class="field"><span>Code pays ISO-2 (rempli automatiquement)</span><input id="modal-city-code" placeholder="Ex. MA" value="MA" maxlength="4" style="text-transform:uppercase;"></label><label class="field"><span>Aéroport</span><select id="modal-city-airport"><option selected>Oui</option><option>Non</option></select></label><label class="field"><span>Latitude</span><input id="modal-city-lat" type="number" step="any" placeholder="31.6342"></label><label class="field"><span>Longitude</span><input id="modal-city-lng" type="number" step="any" placeholder="-7.9999"></label><div class="map-placeholder full" id="modal-city-geo-preview">${icon("map-pin")}<strong id="modal-city-geo-status">Coordonnées géographiques automatiques</strong><span id="modal-city-geo-desc">Tapez un nom de ville pour auto-compléter le pays, le code et la géolocalisation</span></div></div>`,confirm:"Ajouter la ville",message:"La ville a été ajoutée."},
    "edit-city":{title:`Modifier ${cityObj ? escapeHtml(cityObj.name) : "la ville"}`,subtitle:"Recherchez la ville : le pays et le code ISO-2 se mettent à jour automatiquement via l'API.",icon:"pencil",large:true,body:`<div class="form-grid"><label class="field full" style="position:relative;"><div style="display:flex;justify-content:space-between;align-items:center;"><span>Nom de la ville</span><span style="font-size:8px;color:var(--primary-700);font-weight:600;">✨ Synchronisation via API</span></div><div class="city-input-wrap"><input id="edit-city-name" value="${cityObj ? escapeHtml(cityObj.name) : ""}" autocomplete="off" required><span id="edit-city-api-spinner" class="city-spinner hidden">${icon("loader-2")}</span></div><div id="edit-city-suggestions" class="city-suggestions hidden"></div></label><label class="field"><span>Pays (rempli automatiquement)</span><input id="edit-city-country" value="${cityObj ? escapeHtml(cityObj.country) : "Maroc"}"></label><label class="field"><span>Code pays ISO-2 (rempli automatiquement)</span><input id="edit-city-code" value="${cityObj ? escapeHtml(cityObj.code) : "MA"}" maxlength="4" style="text-transform:uppercase;"></label><label class="field"><span>Aéroport</span><select id="edit-city-airport"><option ${cityObj?.airport==='Oui'?'selected':''}>Oui</option><option ${cityObj?.airport==='Non'?'selected':''}>Non</option></select></label><label class="field"><span>Latitude</span><input id="edit-city-lat" type="number" step="any" value="${cityObj && cityObj.latitude!=='—'?cityObj.latitude:''}"></label><label class="field"><span>Longitude</span><input id="edit-city-lng" type="number" step="any" value="${cityObj && cityObj.longitude!=='—'?cityObj.longitude:''}"></label><div class="map-placeholder full" id="edit-city-geo-preview">${icon("map-pin")}<strong id="edit-city-geo-status">${cityObj?.latitude && cityObj.latitude!=='—'?`Coordonnées : ${cityObj.latitude}, ${cityObj.longitude}`:"Coordonnées géographiques automatiques"}</strong><span id="edit-city-geo-desc">${cityObj ? `${escapeHtml(cityObj.name)} · ${escapeHtml(cityObj.country)} (${escapeHtml(cityObj.code)})` : "Modifiez la ville pour recharger les informations via l'API"}</span></div></div>`,confirm:"Enregistrer",message:"La ville a été mise à jour."},
    "city-detail":{title:`Détail : ${cityObj ? escapeHtml(cityObj.name) : ""}`,subtitle:"Informations complètes du référentiel.",icon:"eye",large:true,body:`<div class="form-grid"><div class="field"><span>Nom de la ville</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.name) : "—"}</strong></div><div class="field"><span>Pays & Code</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.country) : "Maroc"} (${cityObj ? escapeHtml(cityObj.code) : "MA"})</strong></div><div class="field"><span>Latitude</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.latitude) : "—"}</strong></div><div class="field"><span>Longitude</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.longitude) : "—"}</strong></div><div class="field"><span>Aéroport desservi</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? escapeHtml(cityObj.airport) : "—"}</strong></div><div class="field"><span>Offres associées</span><strong style="font-size:12px;color:var(--text);margin-top:4px;">${cityObj ? cityObj.offers : 0} offres disponibles</strong></div><div class="map-placeholder full">${icon("map")}<strong>Coordonnées GPS</strong><span>${cityObj ? cityObj.latitude : ""}, ${cityObj ? cityObj.longitude : ""}</span></div></div>`,confirm:"Annuler",message:"Consultation terminée."},
    "city-actions":{title:`Actions — ${cityObj ? escapeHtml(cityObj.name) : "Ville"}`,subtitle:"Choisissez une action à effectuer.",icon:"settings",body:`<div class="grid gap-2">${button("Voir le détail","eye","secondary",`data-action-city="detail" data-id="${cityObj?.id}"`)}${button("Modifier","pencil","secondary",`data-action-city="edit" data-id="${cityObj?.id}"`)}${button("Supprimer","trash-2","danger",`data-action-city="delete" data-id="${cityObj?.id}"`)}</div>`,confirm:"Fermer",message:"Action effectuée."},
    "create-promo":{title:"Créer un code promo",subtitle:"Le code s’applique au montant total du panier du client.",icon:"tags",large:true,body:promoFormBody(),confirm:"Créer le code"},
    "edit-promo":{title:`Modifier ${promoObj ? escapeHtml(promoObj.code) : "le code"}`,subtitle:"Mettez à jour la réduction, l’expiration ou le statut.",icon:"pencil",large:true,body:promoFormBody(promoObj),confirm:"Enregistrer"},
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
            showToast("Ville supprimée", `La ville « ${foundCity?.name} » a été supprimée.`);
            await syncCitiesApi();
            renderPage("cities");
          } catch (e) {
            showToast("Suppression impossible", e.message || "Impossible de supprimer cette ville : elle est utilisée par des offres.");
          }
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
      const supplierCategory = document.querySelector("#user-supplier-category")?.value || null;
      if (!fullName || !email) {
        showToast("Champs requis", "Le nom complet et l’email sont obligatoires.");
        return;
      }
      if ((type === "create-user" && !password) || (password && AccountUI.rules(password,email).some(rule=>!rule[0]))) {
        showToast("Mot de passe invalide", "Utilisez au moins 12 caractères, une minuscule, une majuscule, un chiffre et un symbole, sans l’e-mail (72 octets maximum).");
        return;
      }
      if (role === "SUPPLIER" && !supplierCategory) { showToast("Spécialité requise", "Choisissez l’activité autorisée pour ce fournisseur."); return; }
      const payload = { fullName, email, role, supplierCategory: role === "SUPPLIER" ? supplierCategory : null, ...(password ? { password } : {}) };
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

    if (type === "create-promo" || type === "edit-promo") {
      const code = document.querySelector("#promo-code").value.trim().toUpperCase();
      const value = document.querySelector("#promo-value").value;
      if (!code || !value) {
        showToast("Champs requis", "Le code et la valeur sont obligatoires.");
        return;
      }
      const payload = {
        code,
        discountType: document.querySelector("#promo-type").value,
        value: Number(value),
        expiryDate: document.querySelector("#promo-expiry").value || null,
        active: document.querySelector("#promo-active").value === "true",
      };
      try {
        if (type === "create-promo") {
          await api.post("/api/promo-codes", payload);
        } else {
          await api.put(`/api/promo-codes/${promoObj.id}`, payload);
        }
      } catch (e) {
        showToast("Enregistrement impossible", escapeHtml(e.message));
        return;
      }
      closeModal();
      showToast(type === "create-promo" ? "Code créé" : "Code modifié", `Le code ${escapeHtml(code)} a été enregistré.`);
      renderPage("promos");
      return;
    }

    if (type === "city") {
      const nameVal = document.querySelector("#modal-city-name")?.value.trim();
      if (!nameVal) {
        showToast("Champ requis", "Veuillez saisir le nom de la ville.");
        return;
      }
      const countryVal = document.querySelector("#modal-city-country")?.value?.trim() || "Maroc";
      const codeVal = (document.querySelector("#modal-city-code")?.value?.trim() || "MA").toUpperCase();
      const airportVal = (document.querySelector("#modal-city-airport")?.value || "Non") === "Oui";
      const latRaw = document.querySelector("#modal-city-lat")?.value;
      const lngRaw = document.querySelector("#modal-city-lng")?.value;
      const latNum = latRaw ? parseFloat(latRaw) : null;
      const lngNum = lngRaw ? parseFloat(lngRaw) : null;

      try {
        await api.post("/api/cities", {
          name: nameVal,
          latitude: latNum,
          longitude: lngNum,
          country: countryVal,
          countryCode: codeVal,
          hasAirport: airportVal,
        });
        closeModal();
        showToast("Ville ajoutée", `La ville « ${nameVal} » a été enregistrée avec succès.`);
        await syncCitiesApi();
        renderPage("cities");
      } catch (e) {
        showToast("Erreur", e.message || "Impossible d'enregistrer la ville.");
      }
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
function closePopovers(){NotificationsUI.close();document.querySelector("#account-popover").classList.add("hidden");}

// -------------------------------------------------------------
// PARTIE 2 : JOURNAL D'AUDIT (FRONTEND)
// -------------------------------------------------------------
let auditState = {
  page: 0,
  size: 20,
  action: "",
  resourceType: "",
  search: "",
  startDate: "",
  endDate: "",
  loading: false,
  error: null,
  data: null
};

async function initAudit(container) {
  if (!container) return;

  function renderAuditLayout() {
    container.innerHTML = `
      <div class="page-actions" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <p style="margin:0;color:var(--muted);font-size:13px">Consultez et exportez la traçabilité complète des actions sensibles exécutées sur la plateforme.</p>
        <div style="display:flex;gap:8px">
          ${button("Exporter en CSV", "download", "secondary", 'id="btn-audit-export"')}
          ${button("Actualiser", "refresh-cw", "ghost", 'id="btn-audit-refresh"')}
        </div>
      </div>

      <div class="card" style="padding:14px;margin-bottom:16px;background:#fff;border:1px solid var(--border);border-radius:10px">
        <form id="audit-filter-form" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)) auto auto;gap:10px;align-items:end">
          <div>
            <label style="display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">Recherche libre</label>
            <input id="audit-filter-search" class="field" style="width:100%;height:36px;border:1px solid var(--border);border-radius:6px;padding:0 10px;font-size:12px" placeholder="Email, description, cible..." value="${escapeHtml(auditState.search)}">
          </div>
          <div>
            <label style="display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">Action</label>
            <select id="audit-filter-action" style="width:100%;height:36px;border:1px solid var(--border);border-radius:6px;padding:0 8px;font-size:12px">
              <option value="">Toutes les actions</option>
              <option value="LOGIN_SUCCESS" ${auditState.action === "LOGIN_SUCCESS" ? "selected" : ""}>Connexion réussie</option>
              <option value="LOGIN_FAILURE" ${auditState.action === "LOGIN_FAILURE" ? "selected" : ""}>Échec de connexion</option>
              <option value="USER_CREATED" ${auditState.action === "USER_CREATED" ? "selected" : ""}>Création utilisateur</option>
              <option value="USER_UPDATED" ${auditState.action === "USER_UPDATED" ? "selected" : ""}>Mise à jour utilisateur</option>
              <option value="USER_ARCHIVED" ${auditState.action === "USER_ARCHIVED" ? "selected" : ""}>Archivage utilisateur</option>
              <option value="USER_RESTORED" ${auditState.action === "USER_RESTORED" ? "selected" : ""}>Restauration utilisateur</option>
              <option value="USER_DELETED" ${auditState.action === "USER_DELETED" ? "selected" : ""}>Suppression utilisateur</option>
              <option value="OFFER_ACTIVATED" ${auditState.action === "OFFER_ACTIVATED" ? "selected" : ""}>Activation offre</option>
              <option value="OFFER_DEACTIVATED" ${auditState.action === "OFFER_DEACTIVATED" ? "selected" : ""}>Désactivation offre</option>
              <option value="OFFER_DELETED" ${auditState.action === "OFFER_DELETED" ? "selected" : ""}>Suppression offre</option>
              <option value="PROMO_CREATED" ${auditState.action === "PROMO_CREATED" ? "selected" : ""}>Création code promo</option>
              <option value="PROMO_UPDATED" ${auditState.action === "PROMO_UPDATED" ? "selected" : ""}>Mise à jour code promo</option>
              <option value="PROMO_DELETED" ${auditState.action === "PROMO_DELETED" ? "selected" : ""}>Suppression code promo</option>
              <option value="SETTINGS_UPDATED" ${auditState.action === "SETTINGS_UPDATED" ? "selected" : ""}>Paramètres modifiés</option>
              <option value="SETTING_UPDATED" ${auditState.action === "SETTING_UPDATED" ? "selected" : ""}>Paramètre unitaire</option>
              <option value="AUDIT_EXPORTED" ${auditState.action === "AUDIT_EXPORTED" ? "selected" : ""}>Export d'audit</option>
              <option value="PAYMENT_CAPTURE_REQUESTED" ${auditState.action === "PAYMENT_CAPTURE_REQUESTED" ? "selected" : ""}>Paiement capturé</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">Type de ressource</label>
            <select id="audit-filter-resource" style="width:100%;height:36px;border:1px solid var(--border);border-radius:6px;padding:0 8px;font-size:12px">
              <option value="">Tous les types</option>
              <option value="USER" ${auditState.resourceType === "USER" ? "selected" : ""}>Utilisateurs (USER)</option>
              <option value="OFFER" ${auditState.resourceType === "OFFER" ? "selected" : ""}>Offres (OFFER)</option>
              <option value="PROMO" ${auditState.resourceType === "PROMO" ? "selected" : ""}>Codes promo (PROMO)</option>
              <option value="SETTING" ${auditState.resourceType === "SETTING" ? "selected" : ""}>Paramètres (SETTING)</option>
              <option value="PAYMENT" ${auditState.resourceType === "PAYMENT" ? "selected" : ""}>Paiements (PAYMENT)</option>
              <option value="TICKET" ${auditState.resourceType === "TICKET" ? "selected" : ""}>Tickets (TICKET)</option>
              <option value="AUTH" ${auditState.resourceType === "AUTH" ? "selected" : ""}>Authentification (AUTH)</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">Du</label>
            <input type="date" id="audit-filter-start" style="width:100%;height:36px;border:1px solid var(--border);border-radius:6px;padding:0 8px;font-size:12px" value="${auditState.startDate}">
          </div>
          <div>
            <label style="display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">Au</label>
            <input type="date" id="audit-filter-end" style="width:100%;height:36px;border:1px solid var(--border);border-radius:6px;padding:0 8px;font-size:12px" value="${auditState.endDate}">
          </div>
          <div>
            ${button("Filtrer", "filter", "primary", 'type="submit"')}
          </div>
          <div>
            ${button("Réinitialiser", "rotate-ccw", "ghost", 'type="button" id="btn-audit-reset"')}
          </div>
        </form>
      </div>

      <div id="audit-table-area"></div>
    `;

    container.querySelector("#btn-audit-export")?.addEventListener("click", exportAuditCsv);
    container.querySelector("#btn-audit-refresh")?.addEventListener("click", () => fetchAuditLogs());

    const filterForm = container.querySelector("#audit-filter-form");
    filterForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      auditState.search = container.querySelector("#audit-filter-search").value.trim();
      auditState.action = container.querySelector("#audit-filter-action").value;
      auditState.resourceType = container.querySelector("#audit-filter-resource").value;
      auditState.startDate = container.querySelector("#audit-filter-start").value;
      auditState.endDate = container.querySelector("#audit-filter-end").value;
      auditState.page = 0;
      fetchAuditLogs();
    });

    container.querySelector("#btn-audit-reset")?.addEventListener("click", () => {
      auditState.search = "";
      auditState.action = "";
      auditState.resourceType = "";
      auditState.startDate = "";
      auditState.endDate = "";
      auditState.page = 0;
      renderAuditLayout();
      fetchAuditLogs();
    });

    lucide.createIcons();
  }

  async function fetchAuditLogs() {
    const area = container.querySelector("#audit-table-area");
    if (!area) return;
    area.innerHTML = `<div class="card" style="padding:28px;text-align:center;color:var(--muted)">Chargement du journal d'audit…</div>`;

    const params = new URLSearchParams({
      page: String(auditState.page),
      size: String(auditState.size)
    });
    if (auditState.search) params.set("search", auditState.search);
    if (auditState.action) params.set("action", auditState.action);
    if (auditState.resourceType) params.set("resourceType", auditState.resourceType);
    if (auditState.startDate) params.set("startDate", auditState.startDate);
    if (auditState.endDate) params.set("endDate", auditState.endDate);

    try {
      const data = await api.get(`/api/audit?${params.toString()}`);
      auditState.data = data;
      renderAuditTable(data);
    } catch (err) {
      area.innerHTML = `
        <div class="card" style="padding:28px;text-align:center;border-color:#fca5a5;background:#fff5f5">
          <p style="color:#b91c1c;font-weight:600;margin-bottom:8px">Impossible de charger le journal d'audit.</p>
          <p style="color:#7f1d1d;font-size:12px;margin-bottom:14px">${escapeHtml(err.message)}</p>
          ${button("Réessayer", "refresh-cw", "primary", 'id="btn-audit-retry"')}
        </div>
      `;
      area.querySelector("#btn-audit-retry")?.addEventListener("click", () => fetchAuditLogs());
      lucide.createIcons();
    }
  }

  function actionTone(action) {
    if (!action) return "gray";
    if (action.includes("DELETE") || action.includes("FAILURE") || action.includes("ARCHIVE") || action.includes("DEACTIVATE")) return "red";
    if (action.includes("SUCCESS") || action.includes("CREATE") || action.includes("RESTORE") || action.includes("ACTIVATE")) return "green";
    if (action.includes("UPDATE") || action.includes("CHANGE")) return "amber";
    return "blue";
  }

  function renderAuditTable(data) {
    const area = container.querySelector("#audit-table-area");
    if (!area) return;

    const items = data.content || [];
    const total = data.totalElements || 0;
    const totalPages = data.totalPages || 0;

    if (items.length === 0) {
      area.innerHTML = `
        <div class="empty-state card" style="padding:48px 18px;text-align:center">
          <span class="round-icon">${icon("history")}</span>
          <h2>Aucun événement d'audit</h2>
          <p style="color:var(--muted);font-size:12px;max-width:400px;margin:8px auto 0">Aucune entrée ne correspond aux critères de recherche actuels.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    const rows = items.map((row) => {
      const dateStr = row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" }) : "—";
      const targetStr = row.resourceType ? `${row.resourceType}${row.resourceId != null ? ` #${row.resourceId}` : ""}` : "—";
      const descStr = row.description ? escapeHtml(row.description) : "—";
      const roleStr = row.actorRole || "SYSTEM";

      return `<tr>
        <td style="white-space:nowrap;font-size:11px">${dateStr}</td>
        <td><strong style="font-size:11px">${escapeHtml(row.actorEmail || "Système")}</strong></td>
        <td>${badge(roleStr, roleTone(roleStr))}</td>
        <td>${badge(row.action, actionTone(row.action))}</td>
        <td><span class="booking-ref" style="font-size:11px">${escapeHtml(targetStr)}</span></td>
        <td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px" title="${descStr}">${descStr}</td>
        <td style="text-align:right">
          <button type="button" class="btn btn-ghost btn-sm" data-audit-detail="${row.id}" title="Voir le détail complet" style="padding:4px 8px">
            ${icon("eye")}
          </button>
        </td>
      </tr>`;
    }).join("");

    area.innerHTML = `
      <div class="table-card">
        <div class="table-wrap"><table>
          <thead><tr>${["Date & Heure", "Acteur", "Rôle", "Action", "Cible", "Description", ""].map((heading, index, headings) => `<th class="${index === headings.length - 1 ? "th-center" : ""}">${heading}</th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        ${AtlasTablePagination.render({ page: auditState.page, totalPages, totalElements: total, size: auditState.size })}
      </div>
    `;

    AtlasTablePagination.bind(area, {
      onPage: pageNumber => {
        auditState.page = pageNumber;
        fetchAuditLogs();
      },
      onSize: size => {
        auditState.size = size;
        auditState.page = 0;
        fetchAuditLogs();
      }
    });

    area.querySelectorAll("[data-audit-detail]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.auditDetail);
        const log = (data.content || []).find((x) => x.id === id);
        if (log) showAuditDetailModal(log);
      });
    });

    lucide.createIcons();
  }

  async function exportAuditCsv() {
    const params = new URLSearchParams();
    if (auditState.action) params.set("action", auditState.action);
    if (auditState.resourceType) params.set("resourceType", auditState.resourceType);
    if (auditState.search) params.set("search", auditState.search);
    if (auditState.startDate) params.set("startDate", auditState.startDate);
    if (auditState.endDate) params.set("endDate", auditState.endDate);

    try {
      showToast("Exportation en cours", "Génération du fichier CSV...");
      const res = await fetch(`${api.baseUrl()}/api/audit/export?${params.toString()}`, {
        headers: {
          Accept: "text/csv",
          Authorization: `Bearer ${Auth.getToken()}`
        }
      });
      if (!res.ok) throw new Error(`Échec du téléchargement (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Export réussi", "Le fichier CSV a été téléchargé.");
    } catch (err) {
      showToast("Erreur export", err.message || "Impossible d'exporter le fichier CSV.");
    }
  }

  function showAuditDetailModal(log) {
    function formatJson(str) {
      if (!str) return "—";
      try {
        const obj = typeof str === "string" ? JSON.parse(str) : str;
        return escapeHtml(JSON.stringify(obj, null, 2));
      } catch {
        return escapeHtml(str);
      }
    }

    const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "medium" }) : "—";

    const modalBody = `
      <div style="display:flex;flex-direction:column;gap:14px;max-height:65vh;overflow-y:auto;padding-right:6px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;font-size:12px">
          <div><strong style="color:var(--muted)">Identifiant d'événement :</strong> #${log.id}</div>
          <div><strong style="color:var(--muted)">Date :</strong> ${dateStr}</div>
          <div><strong style="color:var(--muted)">Acteur :</strong> ${escapeHtml(log.actorEmail || "Système")} (ID: ${log.actorId ?? "—"})</div>
          <div><strong style="color:var(--muted)">Rôle acteur :</strong> ${badge(log.actorRole || "SYSTEM", roleTone(log.actorRole || "SYSTEM"))}</div>
          <div><strong style="color:var(--muted)">Action exécutée :</strong> ${badge(log.action, actionTone(log.action))}</div>
          <div><strong style="color:var(--muted)">Cible :</strong> ${escapeHtml(log.resourceType || "—")}${log.resourceId != null ? ` #${log.resourceId}` : ""}</div>
          <div><strong style="color:var(--muted)">Adresse IP :</strong> <code>${escapeHtml(log.ipAddress || "127.0.0.1")}</code></div>
          <div style="grid-column:1 / -1"><strong style="color:var(--muted)">Navigateur / Agent :</strong> <span style="font-size:11px;word-break:break-all">${escapeHtml(log.userAgent || "—")}</span></div>
        </div>

        <div>
          <strong style="display:block;font-size:12px;margin-bottom:4px">Description :</strong>
          <p style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-size:13px;margin:0;color:#1e293b">${escapeHtml(log.description || "Aucune description fournie.")}</p>
        </div>

        <div style="display:grid;grid-template-columns:${log.beforeJson && log.afterJson ? "1fr 1fr" : "1fr"};gap:12px">
          ${log.beforeJson ? `
            <div>
              <strong style="display:block;font-size:12px;color:#b91c1c;margin-bottom:4px">État avant modification :</strong>
              <pre style="background:#fef2f2;border:1px solid #fecdd3;border-radius:6px;padding:10px;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;max-height:220px;overflow-y:auto;margin:0"><code>${formatJson(log.beforeJson)}</code></pre>
            </div>
          ` : ""}
          ${log.afterJson ? `
            <div>
              <strong style="display:block;font-size:12px;color:#15803d;margin-bottom:4px">État après modification :</strong>
              <pre style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;max-height:220px;overflow-y:auto;margin:0"><code>${formatJson(log.afterJson)}</code></pre>
            </div>
          ` : ""}
        </div>
      </div>
    `;

    document.querySelector("#modal-root").innerHTML = `
      <div class="modal-backdrop">
        <div class="modal large" style="max-width:760px">
          <header class="modal-header">
            <span class="modal-symbol">${icon("history")}</span>
            <div>
              <h2>Détail de l'événement d'audit #${log.id}</h2>
              <p>${escapeHtml(log.action)} sur ${escapeHtml(log.resourceType || "ressource")}</p>
            </div>
            <button data-close-modal>${icon("x")}</button>
          </header>
          <div class="modal-body">${modalBody}</div>
          <footer class="modal-actions">
            ${button("Fermer", "", "secondary", "data-close-modal")}
          </footer>
        </div>
      </div>
    `;
    lucide.createIcons();
    document.querySelectorAll("[data-close-modal]").forEach((b) => b.addEventListener("click", closeModal));
  }

  renderAuditLayout();
  await fetchAuditLogs();
}

// -------------------------------------------------------------
// PARTIE 3 : PARAMÈTRES GLOBAUX (FRONTEND)
// -------------------------------------------------------------
let settingsOriginalMap = {};
let settingsCurrentMap = {};
let settingsMetaList = [];

async function initSettings(container) {
  if (!container) return;

  container.innerHTML = `<div class="card" style="padding:28px;text-align:center;color:var(--muted)">Chargement des paramètres globaux…</div>`;

  try {
    settingsMetaList = (await api.get("/api/settings")).map((s) => ({ ...s, key: s.settingKey, value: s.settingValue }));
    settingsOriginalMap = {};
    settingsCurrentMap = {};
    settingsMetaList.forEach((s) => {
      settingsOriginalMap[s.key] = s.value;
      settingsCurrentMap[s.key] = s.value;
    });
    renderSettingsLayout();
  } catch (err) {
    container.innerHTML = `
      <div class="card" style="padding:28px;text-align:center;border-color:#fca5a5;background:#fff5f5">
        <p style="color:#b91c1c;font-weight:600;margin-bottom:8px">Impossible de charger les paramètres de la plateforme.</p>
        <p style="color:#7f1d1d;font-size:12px;margin-bottom:14px">${escapeHtml(err.message)}</p>
        ${button("Réessayer", "refresh-cw", "primary", 'id="btn-settings-retry"')}
      </div>
    `;
    container.querySelector("#btn-settings-retry")?.addEventListener("click", () => initSettings(container));
    lucide.createIcons();
  }

  function getDirtyKeys() {
    return Object.keys(settingsCurrentMap).filter((k) => settingsCurrentMap[k] !== settingsOriginalMap[k]);
  }

  function updateActionButtons() {
    const dirty = getDirtyKeys();
    const btnSave = container.querySelector("#btn-save-all-settings");
    const btnCancel = container.querySelector("#btn-cancel-settings");
    const countBadge = container.querySelector("#dirty-settings-count");

    if (btnSave) btnSave.disabled = dirty.length === 0;
    if (btnCancel) btnCancel.disabled = dirty.length === 0;
    if (countBadge) {
      countBadge.textContent = dirty.length > 0 ? `${dirty.length} modification${dirty.length > 1 ? "s" : ""}` : "";
      countBadge.style.display = dirty.length > 0 ? "inline-block" : "none";
    }
  }

  function renderSettingsLayout() {
    const dirty = getDirtyKeys();

    const sections = [
      {
        title: "Réservations",
        description: "Délai d'annulation accordé aux clients.",
        iconName: "calendar",
        keys: [
          { key: "booking.cancellation.hours", label: "Délai d'annulation client", icon: "clock-3", unit: "heures" }
        ]
      },
      {
        title: "Paiements",
        description: "Modes de règlement acceptés et devise par défaut.",
        iconName: "wallet-cards",
        keys: [
          { key: "payment.cash.enabled", label: "Paiement à l'arrivée (Espèces)", icon: "banknote", type: "toggle" },
          { key: "currency.default", label: "Devise par défaut de la plateforme", icon: "coins", unit: "" }
        ]
      },
      {
        title: "Offres & Catalogue",
        description: "Contraintes éditoriales appliquées aux fournisseurs.",
        iconName: "package",
        keys: [
          { key: "offers.images.max", label: "Nombre maximum d'images par offre", icon: "image", unit: "photos" }
        ]
      },
      {
        title: "Affichage & Maintenance",
        description: "Mode maintenance et message affiché aux visiteurs.",
        iconName: "shield-alert",
        keys: [
          { key: "maintenance.enabled", label: "Mode maintenance global", icon: "alert-triangle", type: "maintenance-toggle" },
          { key: "maintenance.message", label: "Message de maintenance", icon: "message-square", type: "textarea" }
        ]
      }
    ];

    let html = `
      <div class="page-actions" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <p style="margin:0;color:var(--muted);font-size:13px">Pilotez les règles métier de la plateforme. Toute modification s'applique immédiatement.</p>
        <div style="display:flex;align-items:center;gap:10px">
          <span id="dirty-settings-count" style="display:none;background:#fef3c7;color:#92400e;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600"></span>
          ${button("Annuler", "rotate-ccw", "ghost", 'id="btn-cancel-settings" disabled')}
          ${button("Enregistrer tout", "save", "primary", 'id="btn-save-all-settings" disabled')}
        </div>
      </div>

      <div class="settings-layout">
        <div style="display:flex;flex-direction:column;gap:20px">
    `;

    sections.forEach((sec) => {
      html += `
        <div class="settings-list">
          <div style="padding:14px 19px;background:#f8fafc;border-bottom:1px solid var(--border);font-size:13px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
            ${icon(sec.iconName)}
            <span>${sec.title}</span>
            <small style="margin-left:auto;color:var(--muted);font-weight:400;font-size:11px">${sec.description}</small>
          </div>
      `;

      sec.keys.forEach((def) => {
        const meta = settingsMetaList.find((m) => m.key === def.key) || {
          key: def.key,
          value: settingsCurrentMap[def.key] ?? "",
          description: def.label,
          valueType: "STRING",
          updatedBy: "Admin",
          updatedAt: new Date().toISOString()
        };

        const val = settingsCurrentMap[def.key] ?? meta.value;
        const updatedDate = meta.updatedAt ? new Date(meta.updatedAt).toLocaleDateString("fr-FR") : "—";
        const updatedBy = meta.updatedBy || "Système";

        if (def.type === "toggle" || def.type === "maintenance-toggle") {
          const isActive = String(val).toLowerCase() === "true";
          html += `
            <div class="setting-row">
              <span class="round-icon">${icon(def.icon || "toggle-left")}</span>
              <div class="setting-copy">
                <strong>${escapeHtml(def.label)}</strong>
                <span>${escapeHtml(meta.description || "")}</span>
                <small>Dernière modification par ${escapeHtml(updatedBy)}, le ${updatedDate}</small>
              </div>
              <div style="display:flex;align-items:center;justify-content:center">
                <button type="button" class="toggle ${isActive ? "active" : ""}" data-setting-toggle="${def.key}" aria-label="Basculer">
                  <span></span>
                </button>
              </div>
              <div>
                ${button("Sauvegarder", "", "secondary", `data-setting-save="${def.key}"`)}
              </div>
            </div>
          `;
        } else if (def.type === "textarea") {
          html += `
            <div class="setting-row" style="grid-template-columns:40px 1fr 220px 100px">
              <span class="round-icon">${icon(def.icon || "align-left")}</span>
              <div class="setting-copy">
                <strong>${escapeHtml(def.label)}</strong>
                <span>${escapeHtml(meta.description || "")}</span>
                <small>Dernière modification par ${escapeHtml(updatedBy)}, le ${updatedDate}</small>
              </div>
              <div>
                <textarea data-setting-input="${def.key}" style="width:100%;height:60px;border:1px solid var(--border);border-radius:6px;padding:6px 8px;font-size:11px;resize:none">${escapeHtml(val)}</textarea>
              </div>
              <div>
                ${button("Sauvegarder", "", "secondary", `data-setting-save="${def.key}"`)}
              </div>
            </div>
          `;
        } else if (meta.valueType === "INTEGER") {
          const min = meta.minValue ?? 0;
          const max = meta.maxValue ?? 9999;
          html += `
            <div class="setting-row">
              <span class="round-icon">${icon(def.icon || "hash")}</span>
              <div class="setting-copy">
                <strong>${escapeHtml(def.label)}</strong>
                <span>${escapeHtml(meta.description || "")} (min ${min}, max ${max})</span>
                <small>Dernière modification par ${escapeHtml(updatedBy)}, le ${updatedDate}</small>
              </div>
              <div class="number-field">
                <input type="number" min="${min}" max="${max}" value="${escapeHtml(val)}" data-setting-input="${def.key}">
                <span>${def.unit || ""}</span>
              </div>
              <div>
                ${button("Sauvegarder", "", "secondary", `data-setting-save="${def.key}"`)}
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="setting-row">
              <span class="round-icon">${icon(def.icon || "type")}</span>
              <div class="setting-copy">
                <strong>${escapeHtml(def.label)}</strong>
                <span>${escapeHtml(meta.description || "")}</span>
                <small>Dernière modification par ${escapeHtml(updatedBy)}, le ${updatedDate}</small>
              </div>
              <div>
                <input type="text" class="field" style="width:100%;height:38px;border:1px solid var(--border);border-radius:8px;padding:0 10px;font-size:12px;font-weight:700" value="${escapeHtml(val)}" data-setting-input="${def.key}">
              </div>
              <div>
                ${button("Sauvegarder", "", "secondary", `data-setting-save="${def.key}"`)}
              </div>
            </div>
          `;
        }
      });

      html += `</div>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;

    container.querySelectorAll("[data-setting-input]").forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.settingInput;
        settingsCurrentMap[key] = input.value;
        updateActionButtons();
      });
    });

    container.querySelectorAll("[data-setting-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.settingToggle;
        const currentVal = String(settingsCurrentMap[key]).toLowerCase() === "true";
        const nextVal = !currentVal;

        if (key === "maintenance.enabled" && nextVal) {
          if (!confirm("Attention : Activer le mode maintenance bloquera l'accès à tous les utilisateurs (clients et fournisseurs). Seuls les administrateurs pourront continuer à naviguer. Confirmer l'activation ?")) {
            return;
          }
        }

        settingsCurrentMap[key] = String(nextVal);
        btn.classList.toggle("active", nextVal);
        updateActionButtons();
      });
    });

    container.querySelectorAll("[data-setting-save]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const key = btn.dataset.settingSave;
        const value = settingsCurrentMap[key];

        if (key === "maintenance.enabled" && String(value).toLowerCase() === "true" && settingsOriginalMap[key] !== "true") {
          if (!confirm("Confirmez-vous le passage immédiat de la plateforme en mode maintenance ?")) {
            return;
          }
        }

        try {
          btn.disabled = true;
          await api.put(`/api/settings/${encodeURIComponent(key)}`, { value: String(value) });
          showToast("Paramètre enregistré", `« ${key} » a été mis à jour.`);
          settingsOriginalMap[key] = value;
          updateActionButtons();
          initSettings(container);
        } catch (err) {
          btn.disabled = false;
          showToast("Erreur d'enregistrement", err.message || "Impossible de sauvegarder ce paramètre.");
        }
      });
    });

    container.querySelector("#btn-save-all-settings")?.addEventListener("click", async () => {
      const dirty = getDirtyKeys();
      if (dirty.length === 0) return;

      if (dirty.includes("maintenance.enabled") && settingsCurrentMap["maintenance.enabled"] === "true" && settingsOriginalMap["maintenance.enabled"] !== "true") {
        if (!confirm("Attention : Vous êtes sur le point d'activer le mode maintenance pour toute la plateforme. Continuer ?")) {
          return;
        }
      }

      const payload = { settings: Object.fromEntries(dirty.map((k) => [k, String(settingsCurrentMap[k])])) };

      try {
        container.querySelector("#btn-save-all-settings").disabled = true;
        await api.put("/api/settings", payload);
        showToast("Paramètres sauvegardés", `${dirty.length} paramètre(s) mis à jour avec succès.`);
        initSettings(container);
      } catch (err) {
        container.querySelector("#btn-save-all-settings").disabled = false;
        showToast("Erreur d'enregistrement", err.message || "Impossible de sauvegarder les paramètres.");
      }
    });

    container.querySelector("#btn-cancel-settings")?.addEventListener("click", () => {
      initSettings(container);
    });

    updateActionButtons();
    lucide.createIcons();
  }
}

document.querySelector("#sidebar-toggle").addEventListener("click",()=>{
  state.collapsed=!state.collapsed;
  document.querySelector("#sidebar").classList.toggle("collapsed",state.collapsed);
  document.querySelector("#brand-area").classList.toggle("collapsed",state.collapsed);
  document.querySelector("#main-content").classList.toggle("expanded",state.collapsed);
});
document.querySelector("#account-toggle").addEventListener("click",e=>{e.stopPropagation();NotificationsUI.close();document.querySelector("#account-popover").classList.toggle("hidden");});
document.querySelector("#logout").addEventListener("click",()=>Auth.logout());
document.addEventListener("click",e=>{if(!e.target.closest(".popover-wrap"))closePopovers();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){document.querySelector("#account-popover").classList.add("hidden");closeModal();}});

const currentUser = Auth.getUser();
if (currentUser) {
  document.querySelector("#account-toggle .avatar").textContent = initialsFromName(currentUser.fullName);
  document.querySelector("#account-toggle strong").textContent = currentUser.fullName;
}
if (window.I18n) {
  I18n.init({ namespaces: ['common', 'nav', 'admin', 'status', 'errors'] }).then(() => {
    const c = document.getElementById("admin-i18n-container");
    if (c) {
      c.innerHTML = (window.AtlasCurrency ? AtlasCurrency.renderCurrencySwitcher() : "");
      if (window.AtlasCurrency) AtlasCurrency.bindCurrencySwitcher(c);
    }
  });
  window.addEventListener("i18n:change", () => {
    const c = document.getElementById("admin-i18n-container");
    if (c) {
      c.innerHTML = (window.AtlasCurrency ? AtlasCurrency.renderCurrencySwitcher() : "");
      if (window.AtlasCurrency) AtlasCurrency.bindCurrencySwitcher(c);
    }
    renderNav();
    const curr = new URLSearchParams(window.location.search).get("page") || "dashboard";
    renderPage(curr in pages ? curr : "dashboard");
  });
}

renderNav();
const requestedPage = new URLSearchParams(window.location.search).get("page") || "dashboard";
renderPage(requestedPage in pages ? requestedPage : "dashboard");

NotificationsUI.attach("#notification-toggle","#notification-popover");
