const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  package: '<path d="m16.5 9.4-9-5.2"/><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  wallet: '<path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V7"/><path d="M16 15h.01"/>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8M8 13h5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
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
  ["bookings", "Réservations", "calendar", ""],
  ["payments", "Paiements à l'arrivée", "wallet", ""],
  ["tickets", "Tickets de support", "message", ""],
  ["profile", "Mon profil", "user", ""],
];

const bookingRows = [];

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

function dashboardPage() { return '<div id="stats-module"></div>';
}

function bookingsPage() { return '<div id="booking-module"></div>';
}

function bookingPage() { return '<div id="booking-module"></div>';
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
  if (!bundleState.agent) bundleState.agent = Auth.getUser();
  return bundleState.agent;
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
    <div class="stock-title"><span>Capacité disponible</span><strong>${b.stock} réservation${b.stock > 1 ? "s" : ""} possible${b.stock > 1 ? "s" : ""}</strong></div>
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
  return offers.map((o) => `<div class="component-row"><i></i><span class="offer-icon">${icon(OFFER_TYPE_ICONS[o.type] || "package")}</span><div><strong>${esc(o.title)}</strong><small>${esc(o.cityName || "—")} · Capacité : ${o.stock}${o.active ? "" : " · inactive"}</small></div><span>${OFFER_TYPE_LABELS[o.type] || ""}</span><b>${money(o.basePrice)}</b><button class="remove-button" data-bundle-remove="${o.id}" aria-label="Retirer">×</button></div>`).join("");
}

function bundleRecapHtml() {
  const d = bundleState.draft;
  const t = bundleTotals();
  const image = d.offers.find((o) => o.image)?.image || photos.riad;
  return `<section class="card recap-card"><h2>Récapitulatif en temps réel</h2><img src="${esc(image)}" alt="" /><strong>${esc(d.title || "Titre du bundle")}</strong>
    <div class="summary-row"><span>Somme des offres</span><strong>${money(t.sum)}</strong></div>
    <div class="summary-row discount"><span>Remise (${t.discount} %)</span><strong>−${money(t.saved)}</strong></div>
    <div class="final-price"><span>Prix final</span><strong>${money(t.final)}</strong><small>${d.offers.length} offre${d.offers.length > 1 ? "s" : ""} combinée${d.offers.length > 1 ? "s" : ""}</small></div>
    <div class="dynamic-stock">${icon("calendar-check")}<div><span>Capacité commune</span><strong>${t.stock} réservation${t.stock > 1 ? "s" : ""} possible${t.stock > 1 ? "s" : ""}</strong><small>${t.limiting ? `Limitée par ${esc(t.limiting.title)}` : "Ajoutez des offres"}</small></div></div>
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
    ? offers.map((o) => `<label class="component-row" style="grid-template-columns:20px 36px 1fr auto auto;cursor:${o.stock > 0 ? "pointer" : "not-allowed"};opacity:${o.stock > 0 ? 1 : .5}"><input type="checkbox" data-pick-offer="${o.id}" ${bundleState.pick.has(o.id) ? "checked" : ""} ${o.stock > 0 ? "" : "disabled"} /><span class="offer-icon">${icon(OFFER_TYPE_ICONS[o.type] || "package")}</span><div><strong>${esc(o.title)}</strong><small>${OFFER_TYPE_LABELS[o.type]} · ${esc(o.cityName)} · ${esc(o.supplierName)} · Capacité : ${o.stock}</small></div><span></span><b>${money(o.basePrice)}</b></label>`).join("")
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

function paymentsPage() { return '<div id="payment-module"></div>';
}

function ticketsPage() {
  return '<div id="tickets-module"></div>';
}

function notificationsPage() { return '<div id="notification-module"></div>'; }

function profilePage() { return '<div id="profile-module"></div>'; }

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
  StatsUI.dispose(); AccountUI.dispose();
  if (!pageRenderers[page]) page = "dashboard";
  currentPage = page;
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  const renderer = pageRenderers[page] || dashboardPage;
  document.querySelector("#page-content").innerHTML = renderer();
  renderNav();
  hydrateIcons(document.querySelector("#page-content"));
  if (page === "bookings") BookingsUI.list(document.getElementById("booking-module"), "AGENT");
  if (page === "dashboard") StatsUI.mount(document.getElementById("stats-module"), "AGENT");
  if (page === "booking") BookingsUI.detail(document.getElementById("booking-module"), params.get("id"), "AGENT");
  if (page === "payments") PaymentsUI.list(document.getElementById("payment-module"), "AGENT", true);
  if (page === "notifications") NotificationsUI.page(document.getElementById("notification-module"));
  if (page === "tickets") TicketsUI.agent(document.getElementById("tickets-module"));
  if (page === "profile") AccountUI.mount(document.getElementById("profile-module"),"AGENT");
  pageHooks[page]?.();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message, error = false) {
  const root = document.querySelector("#toast-root");
  root.innerHTML = `<div class="toast ${error ? "toast-error" : ""}"><span>${icon(error ? "alert" : "check")}</span><div><strong>${error ? "Action impossible" : "Action réussie"}</strong><p>${esc(message)}</p></div><button data-action="close-toast">×</button></div>`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { root.innerHTML = ""; }, error ? 5000 : 3200);
}





document.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    if (pageButton.dataset.page === "bundle-editor") startNewBundle();
    renderPage(pageButton.dataset.page);
    NotificationsUI.close();
    closeAccountMenu();
    return;
  }
  const toastButton = event.target.closest("[data-toast]");
  if (toastButton) showToast(toastButton.dataset.toast);
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  if (actionButton.dataset.action === "close-modal" && (event.target === actionButton || actionButton.tagName === "BUTTON")) document.querySelector("#modal-root").innerHTML = "";

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


function closeAccountMenu() {
  document.querySelector("#account-menu").classList.add("hidden");
  document.querySelector("#account-toggle").setAttribute("aria-expanded", "false");
}
document.querySelector("#account-toggle").addEventListener("click", (event) => {
  event.stopPropagation();
  const open = document.querySelector("#account-menu").classList.toggle("hidden") === false;
  document.querySelector("#account-toggle").setAttribute("aria-expanded", String(open));
  if (open) NotificationsUI.close();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest("#account-menu")) closeAccountMenu();
});
document.querySelector("#notification-button").addEventListener("click", closeAccountMenu);
document.querySelector("#logout-button").addEventListener("click", () => Auth.logout());

const currentUser = Auth.getUser();
if (currentUser) {
  const initials = currentUser.fullName.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  document.querySelector("#account-initials").textContent = initials;
  document.querySelector("#account-name").textContent = currentUser.fullName;
}

renderNav();
hydrateIcons();

if (window.I18n) {
  I18n.init({ namespaces: ['common', 'nav', 'agent', 'status', 'errors'] }).then(() => {
    const c = document.getElementById("agent-i18n-container");
    if (c) {
      c.innerHTML = (window.AtlasCurrency ? AtlasCurrency.renderCurrencySwitcher() : "");
      I18n.bindLanguageSwitcher(c);
      if (window.AtlasCurrency) AtlasCurrency.bindCurrencySwitcher(c);
    }
  });
  window.addEventListener("i18n:change", () => {
    const c = document.getElementById("agent-i18n-container");
    if (c) {
      c.innerHTML = (window.AtlasCurrency ? AtlasCurrency.renderCurrencySwitcher() : "");
      I18n.bindLanguageSwitcher(c);
      if (window.AtlasCurrency) AtlasCurrency.bindCurrencySwitcher(c);
    }
    renderNav();
    hydrateIcons();
    const curr = new URLSearchParams(window.location.search).get("page") || "dashboard";
    renderPage(curr in pageRenderers ? curr : "dashboard");
  });
}

const requestedPage = new URLSearchParams(window.location.search).get("page") || "dashboard";
renderPage(requestedPage in pageRenderers ? requestedPage : "dashboard");

NotificationsUI.attach("#notification-button","#notification-dropdown");
