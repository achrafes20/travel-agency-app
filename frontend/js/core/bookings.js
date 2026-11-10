/* Écrans de réservation communs aux quatre espaces. Aucune réservation locale ou simulée. */
const AtlasTablePagination = (() => {
  function pageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index);
    const pages = new Set([0, total - 1, current - 1, current, current + 1]);
    return [...pages].filter(page => page >= 0 && page < total).sort((a, b) => a - b);
  }

  function render({ page = 0, totalPages = 1, totalElements = 0, size = 10 }) {
    const pages = pageNumbers(page, Math.max(totalPages, 1));
    let previous = -1;
    const numbered = pages.map(value => {
      const dots = previous >= 0 && value - previous > 1 ? '<span class="atlas-pagination-dots">…</span>' : '';
      previous = value;
      return `${dots}<button type="button" class="atlas-page-number ${value === page ? "active" : ""}" data-atlas-page="${value}" ${value === page ? 'aria-current="page"' : ''}>${value + 1}</button>`;
    }).join("");
    const start = totalElements === 0 ? 0 : page * size + 1;
    const end = Math.min(totalElements, (page + 1) * size);
    const sizes = [5, 10, 20, 50].includes(size) ? [5, 10, 20, 50] : [5, 10, 20, 50, size].sort((a, b) => a - b);
    return `<nav class="atlas-table-pagination" aria-label="Pagination du tableau">
      <span class="atlas-pagination-info">Affichage ${start}–${end} sur ${totalElements} élément${totalElements > 1 ? "s" : ""}</span>
      <div class="atlas-pagination-controls"><label>Lignes par page <select data-atlas-page-size>${sizes.map(value => `<option value="${value}" ${value === size ? "selected" : ""}>${value}</option>`).join("")}</select></label>
      <div class="atlas-page-buttons"><button type="button" data-atlas-page="${page - 1}" ${page <= 0 ? "disabled" : ""} aria-label="Page précédente">‹</button>${numbered}<button type="button" data-atlas-page="${page + 1}" ${page >= totalPages - 1 ? "disabled" : ""} aria-label="Page suivante">›</button></div></div>
    </nav>`;
  }

  function bind(container, { onPage, onSize }) {
    container.querySelectorAll("[data-atlas-page]").forEach(button => {
      button.onclick = () => { if (!button.disabled) onPage(Number(button.dataset.atlasPage)); };
    });
    const size = container.querySelector("[data-atlas-page-size]");
    if (size) size.onchange = () => onSize(Number(size.value));
  }
  return { render, bind };
})();

const BookingsUI = (() => {
  const labels = { PENDING: "En attente", CONFIRMED: "Confirmée", COMPLETED: "Terminée", CANCELLED: "Annulée", EXPIRED: "Expirée", PROCESSING: "En cours", PARTIALLY_REFUNDED: "Partiellement remboursé", PAID: "Payé", FAILED: "Échec", REFUNDED: "Remboursé" };
  const lean = role => role === "CLIENT" || role === "SUPPLIER" || role === "AGENT" || role === "ADMIN";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const money = value => new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(Number(value || 0));
  const date = value => value ? new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const clockDate = value => value ? date(value.endsWith("Z") ? value : value + "Z") : "—";
  const badge = status => `<span class="bk-badge bk-${esc(status)}">${esc(labels[status] || status)}</span>`;
  const loading = root => { root.innerHTML = '<div class="bk-loading" role="status" aria-live="polite"><div></div><div></div><p>Chargement des réservations…</p></div>'; };
  function error(root, err, retry) {
    root.innerHTML = `<section class="bk-empty" role="alert"><h3>Chargement impossible</h3><p>${esc(err.message)}</p><button class="bk-button">Réessayer</button></section>`;
    root.querySelector("button").onclick = retry;
  }
  const url = (page, id) => `${location.pathname.includes("/client/") ? "./index.html" : "./client/index.html"}?page=${page}${id ? "&id=" + encodeURIComponent(id) : ""}`;
  function notify(message) {
    const el = document.createElement("div"); el.className = "bk-toast"; el.role = "status"; el.textContent = message;
    document.body.append(el); setTimeout(() => el.remove(), 4000);
  }
  async function download(id, reference) {
    const response = await fetch(api.baseUrl() + "/api/bookings/" + encodeURIComponent(id) + "/voucher", { headers: { Authorization: "Bearer " + Auth.getToken(), Accept: "application/pdf" } });
    if (response.status === 401) Auth.logout();
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || "Téléchargement impossible"); }
    const objectUrl = URL.createObjectURL(await response.blob());
    const a = document.createElement("a"); a.href = objectUrl; a.download = reference + ".pdf"; a.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
  function actions(booking, role) {
    return `${booking.voucherAvailable ? '<button class="bk-button" data-bk-action="voucher">Télécharger le voucher PDF</button>' : ""}
      ${["ADMIN", "AGENT"].includes(role) && booking.status === "PENDING" && booking.paymentStatus === "PAID" ? '<button class="bk-button" data-bk-action="confirm">Confirmer</button>' : ""}
      ${booking.canCancel ? '<button class="bk-button bk-danger" data-bk-action="cancel">Annuler la réservation</button>' : ""}
      ${role === "SUPPLIER" ? '<button class="bk-button bk-secondary" data-bk-action="print">Imprimer ma fiche</button>' : ""}`;
  }
  function detailHtml(b, role) {
    return `<article class="bk-detail"><header><div><small>RÉSERVATION</small><h2>${esc(b.reference)}</h2><p>${esc(b.clientName)}${b.clientEmail && !lean(role) ? " · " + esc(b.clientEmail) : ""}</p></div>${badge(b.status)}</header>
      <ol class="bk-timeline"><li>Créée<small>${clockDate(b.createdAt)}</small></li>${b.confirmedAt ? `<li>Confirmée<small>${clockDate(b.confirmedAt)}</small></li>` : ""}${["CANCELLED", "EXPIRED", "COMPLETED"].includes(b.status) ? `<li>${esc(labels[b.status])}<small>${b.cancelledAt ? clockDate(b.cancelledAt) : b.status === "EXPIRED" ? clockDate(b.expiresAt) : date(b.serviceEndAt)}</small></li>` : ""}</ol>
      <div class="bk-items">${b.items.map(i => `<section class="bk-item ${i.parentItemId ? "bk-child" : ""}"><div><h3>${esc(i.title)}</h3><p>${date(i.serviceStartAt)} → ${date(i.serviceEndAt)}</p><small>Quantité : ${i.quantity}${i.parentItemId ? " · Prestation incluse dans le bundle" : ""}</small></div><strong>${money(i.lineTotal)}</strong></section>`).join("")}</div>
      <div class="bk-totals"><p><span>Sous-total TTC</span><strong>${money(b.subtotal)}</strong></p><p><span>Remise ${esc(b.promoCode || "")}</span><strong>− ${money(b.discount)}</strong></p><p class="bk-total"><span>Total TTC</span><strong>${money(b.total)}</strong></p></div>
      <p class="bk-payline"><span>Méthode : ${b.paymentMethod === "PAY_ON_ARRIVAL" ? "Paiement à l’arrivée" : "Paiement en ligne"}</span><span>Paiement : ${badge(b.paymentStatus)}</span></p>
      ${b.status === "PENDING" && b.expiresAt ? `<p class="bk-info">À confirmer avant le ${clockDate(b.expiresAt)}. La capacité sera libérée après ce délai.${role === "CLIENT" ? " Finalisez votre paiement sandbox avant cette échéance." : ""}</p>` : ""}
      ${b.cancellationReason ? `<p>Motif d’annulation : ${esc(b.cancellationReason)}</p>` : ""}
      ${lean(role) ? "" : '<p class="bk-note">L’annulation client dépend du délai applicable avant le premier service ; les actions disponibles sont vérifiées par le serveur. Prix TTC en MAD.</p>'}
      <div class="bk-actions">${actions(b, role)}</div><p class="bk-feedback" role="status"></p></article>`;
  }
  function cancelDialog(booking, role, onSuccess) {
    const required = ["ADMIN", "AGENT"].includes(role), dialog = document.createElement("dialog");
    dialog.className = "bk-dialog";
    dialog.innerHTML = `<form><h2>Annuler ${esc(booking.reference)} ?</h2><p>Les capacités réservées seront libérées.</p><label>Motif ${required ? "(obligatoire)" : "(facultatif)"}<textarea name="reason" maxlength="1000" ${required ? "required" : ""}></textarea></label><p role="alert" class="bk-feedback"></p><div class="bk-actions"><button type="button" class="bk-button bk-secondary">Conserver la réservation</button><button type="submit" class="bk-button bk-danger">Confirmer l’annulation</button></div></form>`;
    document.body.append(dialog); dialog.addEventListener("close", () => dialog.remove()); dialog.showModal();
    dialog.querySelector('button[type="button"]').onclick = () => dialog.close();
    dialog.querySelector("form").onsubmit = async event => {
      event.preventDefault(); const submit = dialog.querySelector('button[type="submit"]'); submit.disabled = true;
      try { await api.post("/api/bookings/" + booking.id + "/cancel", { reason: dialog.querySelector("textarea").value.trim() || null }); dialog.close(); notify("Réservation annulée et capacité libérée"); onSuccess(); }
      catch (err) { dialog.querySelector(".bk-feedback").textContent = err.message; submit.disabled = false; }
    };
  }
  function bindDetail(root, b, role, reload) {
    root.querySelectorAll("[data-bk-action]").forEach(button => button.onclick = async () => {
      const action = button.dataset.bkAction, feedback = root.querySelector(".bk-feedback");
      if (action === "cancel") { cancelDialog(b, role, reload); return; }
      button.disabled = true;
      try {
        if (action === "voucher") await download(b.id, b.reference);
        if (action === "confirm") { await api.post("/api/bookings/" + b.id + "/confirm", {}); notify("Réservation confirmée"); reload(); }
        if (action === "print") {
          const frame = document.createElement("iframe"); frame.hidden = true; document.body.append(frame);
          frame.contentDocument.write('<html lang="fr"><head><title>Fiche fournisseur</title></head><body>' + root.querySelector(".bk-detail").outerHTML + "</body></html>");
          frame.contentDocument.close(); frame.contentWindow.focus(); frame.contentWindow.print(); setTimeout(() => frame.remove(), 1000);
        }
      } catch (err) { feedback.textContent = err.message; }
      finally { button.disabled = false; }
    });
  }
  async function detail(root, id, role = Auth.getUser()?.role, options = {}) {
    const load = () => detail(root, id, role, options); loading(root);
    if (!/^\d+$/.test(String(id || ""))) { error(root, new Error("Identifiant de réservation absent. Ouvrez une réservation depuis la liste."), () => location.href = url("reservations")); return; }
    try {
      const b = await api.get("/api/bookings/" + id); if (!root.isConnected) return;
      root.innerHTML = `${options.confirmation ? '<h1>Votre réservation est enregistrée</h1><p>Retrouvez ci-dessous sa référence et son état réel.</p>' : ""}${detailHtml(b, role)}${role !== "SUPPLIER" ? '<section class="pm-booking-summary"></section>' : ""}`;
      if (role !== "SUPPLIER") PaymentsUI.summary(root.querySelector(".pm-booking-summary"), b.id, role);
      bindDetail(root, b, role, () => { load(); options.onChange?.(); });
    } catch (err) { if (root.isConnected) error(root, err, load); }
  }
  function drawer(id, role, refresh) {
    const dialog = document.createElement("dialog"); dialog.className = "bk-dialog bk-wide";
    dialog.innerHTML = '<button class="bk-close" aria-label="Fermer">×</button><div class="bk-drawer-content"></div>';
    document.body.append(dialog); dialog.addEventListener("close", () => dialog.remove()); dialog.querySelector("button").onclick = () => dialog.close(); dialog.showModal();
    detail(dialog.querySelector("div"), id, role, { onChange: refresh });
  }
  function list(root, role = Auth.getUser()?.role) {
    const staff = ["ADMIN", "AGENT"].includes(role), scope = staff ? "/admin" : role === "SUPPLIER" ? "/supplier" : "";
    let currentPage = 0, pageSize = 10, revision = 0;
    root.classList.add("bk-module");
    root.innerHTML = `<header class="bk-heading"><div>${lean(role) ? "" : "<small>VOS VOYAGES ATLAS VOYAGE</small>"}${staff ? "" : `<h1>${role === "SUPPLIER" ? "Réservations reçues" : "Mes réservations"}</h1>`}</div></header>
      <div class="bk-tabs" role="group" aria-label="Filtrer par statut">${[["", "Toutes"], ["PENDING", "En attente"], ["CONFIRMED", "Confirmées"], ["COMPLETED", "Terminées"], ["CANCELLED", "Annulées"], ["EXPIRED", "Expirées"]].map(([s, label]) => `<button type="button" data-bk-status="${s}" class="${s ? "" : "active"}">${label}</button>`).join("")}</div>
      <form class="bk-filters"><input type="hidden" name="status"><label>Référence ou client<input name="search" placeholder="Rechercher…"></label>
      <label>Du<input type="date" name="from"></label><label>Au<input type="date" name="to"></label>
      ${staff ? '<label>Paiement<select name="paymentStatus"><option value="">Tous</option><option value="PENDING">En attente</option><option value="PAID">Payé</option><option value="FAILED">Échec</option><option value="PROCESSING">En cours</option><option value="CANCELLED">Paiement annulé</option><option value="PARTIALLY_REFUNDED">Partiellement remboursé</option><option value="REFUNDED">Remboursé</option></select></label>' + (role === "AGENT" || role === "ADMIN" ? "" : '<label>Client (nom ou email)<input name="client"></label>') + '<label>Fournisseur<select name="supplierId"><option value="">Tous</option></select></label>' : ""}
      ${lean(role) ? "" : '<label>Tri<select name="sort"><option value="createdAt,desc">Plus récentes</option><option value="createdAt,asc">Plus anciennes</option><option value="serviceStartAt,asc">Date du service</option><option value="reference,asc">Référence</option></select></label>'}<button class="bk-button">Rechercher</button><button type="reset" class="bk-button bk-secondary">Réinitialiser</button></form>
      <div class="bk-results" aria-live="polite"></div>`;
    const form = root.querySelector("form"), results = root.querySelector(".bk-results");
    async function load() {
      const requestRevision = ++revision, params = new URLSearchParams(new FormData(form));
      [...params].forEach(([key, val]) => { if (!val) params.delete(key); }); params.set("page", currentPage); params.set("size", pageSize); loading(results);
      try {
        const page = await api.get("/api/bookings" + scope + "?" + params);
        if (!root.isConnected || requestRevision !== revision) return;
        if (!page.content.length) { results.innerHTML = '<div class="bk-empty"><span aria-hidden="true">✈</span><h3>Aucune réservation</h3><p>Aucune réservation ne correspond à ces critères.</p></div>'; return; }
        results.innerHTML = `<div class="bk-table-wrap"><table><thead><tr><th>Référence</th><th>Client</th><th>Service</th><th>Total TTC</th><th>Paiement</th><th>Statut</th><th>Détail</th></tr></thead><tbody>${page.content.map(b => `<tr><td><strong>${esc(b.reference)}</strong><small>${clockDate(b.createdAt)}</small></td><td>${esc(b.clientName)}</td><td>${date(b.serviceStartAt)}</td><td>${money(b.total)}</td><td>${b.paymentMethod === "PAY_ON_ARRIVAL" && b.paymentStatus === "PENDING" ? '<span class="bk-badge bk-PENDING">À l’arrivée</span>' : badge(b.paymentStatus)}</td><td>${badge(b.status)}</td><td><button class="bk-button bk-secondary" data-bk-id="${b.id}">Voir</button>${b.canPay && role === "CLIENT" ? `<a class="bk-button" href="${url("payment", b.id)}">Payer maintenant</a>` : ""}</td></tr>`).join("")}</tbody></table></div>
          ${AtlasTablePagination.render(page)}`;
        results.querySelectorAll("[data-bk-id]").forEach(button => button.onclick = () => drawer(button.dataset.bkId, role, load));
        AtlasTablePagination.bind(results, {
          onPage: pageNumber => { currentPage = pageNumber; load(); },
          onSize: size => { pageSize = size; currentPage = 0; load(); }
        });
      } catch (err) { if (root.isConnected && requestRevision === revision) error(results, err, load); }
    }
    form.onsubmit = event => { event.preventDefault(); currentPage = 0; load(); };
    form.onreset = () => setTimeout(() => { currentPage = 0; form.elements.status.value = ""; root.querySelectorAll("[data-bk-status]").forEach(b => b.classList.toggle("active", !b.dataset.bkStatus)); load(); }, 0);
    root.querySelectorAll("[data-bk-status]").forEach(button => button.onclick = () => {
      form.elements.status.value = button.dataset.bkStatus; currentPage = 0;
      root.querySelectorAll("[data-bk-status]").forEach(b => b.classList.toggle("active", b === button)); load();
    });
    if (staff) api.get("/api/offers").then(data => {
      const select = form.elements.supplierId;
      const suppliers = new Map((Array.isArray(data) ? data : data.content).map(o => [o.supplierId, o.supplierName]));
      suppliers.forEach((name, id) => { if (!id) return; const option = document.createElement("option"); option.value = id; option.textContent = name || "Fournisseur " + id; select.append(option); });
    }).catch(() => { const input = document.createElement("input"); input.name = "supplierId"; input.type = "number"; input.min = "1"; input.placeholder = "Identifiant fournisseur"; form.elements.supplierId.replaceWith(input); });
    load();
  }
  async function checkout(root) {
    root.classList.add("bk-module"); loading(root);
    if (Auth.getUser()?.role !== "CLIENT") { root.innerHTML = '<div class="bk-empty"><h2>Connectez-vous pour réserver</h2><p>Votre compte client est nécessaire pour créer une réservation.</p><a class="bk-button" href="./connexion.html">Se connecter</a></div>'; return; }
    try {
      const cart = await api.get("/api/cart"); if (!root.isConnected) return;
      if (!cart.items.length) { root.innerHTML = '<div class="bk-empty"><h2>Votre panier est vide</h2><p>Choisissez une offre dans le catalogue pour préparer votre voyage.</p><a class="bk-button" href="' + (location.pathname.includes("/client/") ? "../" : "./") + 'accueil.html">Découvrir les offres</a></div>'; return; }
      root.innerHTML = `<h1>Finaliser ma réservation</h1><div class="bk-checkout"><form><h2>Mode de paiement</h2><label class="bk-method"><input type="radio" name="paymentMethod" value="ONLINE" checked> Paiement en ligne<small>La réservation restera en attente pendant 30 minutes. Aucun débit n’est effectué à cette étape.</small></label><label class="bk-method"><input type="radio" name="paymentMethod" value="PAY_ON_ARRIVAL" ${cart.payOnArrivalAllowed ? "" : "disabled"}> Paiement à l’arrivée<small>${cart.payOnArrivalAllowed ? "Réservation confirmée immédiatement, règlement sur place." : "Indisponible : au moins une offre de votre panier ne l’autorise pas."}</small></label>
      <label>Téléphone de contact<input name="contactPhone" type="tel" maxlength="40" autocomplete="tel"></label><label>Note pour l’équipe<textarea name="notes" maxlength="2000"></textarea></label>
      <p class="bk-feedback" role="alert"></p><button class="bk-button" type="submit" ${cart.hasUnavailableItems ? "disabled" : ""}>Créer ma réservation · ${money(cart.total)}</button>
      ${cart.hasUnavailableItems ? '<p role="alert">Une prestation est indisponible. Ajustez votre panier avant de réserver.</p>' : ""}<p>Prix TTC en MAD. Annulation selon le délai applicable avant le premier service.</p></form>
      <aside><h2>Récapitulatif</h2>${cart.items.map(i => `<div class="bk-item"><span>${esc(i.title)} × ${i.quantity}</span><strong>${money(i.lineTotal)}</strong></div>`).join("")}<div class="bk-totals"><p>Sous-total <strong>${money(cart.subtotal)}</strong></p><p>Remise ${esc(cart.promo?.code || "")}<strong>− ${money(cart.discount)}</strong></p><p class="bk-total">Total <strong>${money(cart.total)}</strong></p></div><a href="${url("panier")}">Retour au panier</a></aside></div>`;
      const form = root.querySelector("form"); let submitting = false;
      form.onsubmit = async event => {
        event.preventDefault(); if (submitting) return; submitting = true;
        const button = form.querySelector('[type="submit"]'); button.disabled = true;
        try {
          const data = Object.fromEntries(new FormData(form));
          const booking = await api.post("/api/bookings", data);
          location.href = url("payment", booking.id);
        } catch (err) {
          form.querySelector(".bk-feedback").textContent = err.message + (err.code === "CAPACITY_EXCEEDED" ? " Retournez au panier pour modifier votre sélection." : "");
          button.disabled = false; submitting = false;
        }
      };
    } catch (err) { error(root, err, () => checkout(root)); }
  }
  return { list, detail, checkout, download };
})();
