/* Paiements sandbox : aucun PAN/CVC ne sort du navigateur. */
const PaymentsUI = (() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const labels = { PENDING: "En attente", PROCESSING: "En cours", PAID: "Payé", FAILED: "Échec", CANCELLED: "Annulé", PARTIALLY_REFUNDED: "Partiellement remboursé", REFUNDED: "Remboursé" };
  const money = value => new Intl.NumberFormat("fr-MA", {style:"currency",currency:"MAD"}).format(Number(value || 0));
  const utc = value => value ? Date.parse(value.endsWith("Z") || /[+-][0-9]{2}:[0-9]{2}$/.test(value) ? value : value + "Z") : NaN;
  const date = value => value ? new Date(utc(value)).toLocaleString("fr-FR", {dateStyle:"medium",timeStyle:"short"}) : "—";
  const badge = value => `<span class="bk-badge bk-${esc(value)}">${esc(labels[value] || value)}</span>`;
  const banner = '<aside class="pm-sandbox"><strong>MODE SANDBOX — aucun débit réel</strong><span>Simulation de paiement Atlas Voyage. N’utilisez jamais une vraie carte.</span></aside>';
  const clientUrl = (page, id) => `${location.pathname.includes("/client/") ? "./index.html" : "./client/index.html"}?page=${page}&id=${encodeURIComponent(id)}`;
  const post = (path, body, key) => api.post(path, body, {headers:{"Idempotency-Key":key}});
  const load = root => root.innerHTML = '<div class="bk-loading" role="status"><div></div><div></div><p>Chargement des paiements…</p></div>';
  function error(root, err, retry) {
    root.innerHTML = `<div class="bk-empty" role="alert"><h2>Paiements indisponibles</h2><p>${esc(err.status ? err.message : "Le serveur est injoignable. Vérifiez votre connexion et réessayez.")}</p><button class="bk-button">Réessayer</button></div>`;
    root.querySelector("button").onclick = retry;
  }
  const pendingKey = id => "atlas-sandbox-attempt-" + id;
  function saved(id) { try { return JSON.parse(sessionStorage.getItem(pendingKey(id))); } catch { return null; } }
  function save(id, value) { try { value ? sessionStorage.setItem(pendingKey(id), JSON.stringify(value)) : sessionStorage.removeItem(pendingKey(id)); } catch { /* mémoire de l'écran conservée */ } }
  function toast(message) {
    const node = document.createElement("div"); node.className = "bk-toast"; node.textContent = message; node.role = "status"; document.body.append(node); setTimeout(() => node.remove(),4000);
  }
  const reason = value => { try { return JSON.parse(value || "{}").reason || ""; } catch { return ""; } };
  function receipt(p) {
    return `<section class="pm-receipt"><header><div><small>PAIEMENT #${p.id}</small><h3>${esc(p.bookingReference)}</h3></div>${badge(p.status)}</header><p>${p.method === "CARD" ? "Carte" : "Espèces à l’arrivée"}${p.cardLast4 ? " · " + esc(p.cardBrand) + " •••• " + esc(p.cardLast4) : ""}</p>
      <div class="bk-totals"><p>Montant <strong>${money(p.amount)}</strong></p><p>Montant payé <strong>${money(["PAID","PARTIALLY_REFUNDED","REFUNDED"].includes(p.status) ? p.amount : 0)}</strong></p><p>Déjà remboursé <strong>${money(p.refundedAmount)}</strong></p></div>
      ${p.demonstration ? '<p class="bk-note">Données de démonstration</p>' : ""}${p.failureMessage ? `<p class="bk-feedback">${esc(p.failureMessage)}</p>` : ""}<p class="bk-note">Créé le ${date(p.createdAt)}${p.paidAt ? " · Reçu le " + date(p.paidAt) : ""}${p.collectedByName ? " · Encaissement : " + esc(p.collectedByName) : ""}</p></section>`;
  }
  async function summary(root, bookingId, role) {
    try {
      const values = await api.get("/api/payments?bookingId=" + encodeURIComponent(bookingId)); if (!root.isConnected) return;
      if (!values.length) { root.textContent = "Aucun paiement enregistré."; return; }
      const current = values[values.length - 1];
      root.innerHTML = banner + '<h3>Paiement de la réservation</h3>' + receipt(current) + '<div class="pm-history"></div>';
      const history = root.querySelector(".pm-history");
      const detail = document.createElement("button"); detail.className = "bk-button bk-secondary"; detail.textContent = "Historique et opérations"; detail.onclick = () => drawer(current.id,role,() => summary(root,bookingId,role)); history.append(detail);
      if (role === "CLIENT" && current.bookingStatus === "PENDING" && utc(current.expiresAt) > Date.now()) {
        const pay = document.createElement("a"); pay.className = "bk-button"; pay.textContent = "Payer maintenant"; pay.href = clientUrl("payment",bookingId); history.append(pay);
      }
    } catch (err) { if (root.isConnected) error(root,err,() => summary(root,bookingId,role)); }
  }
  async function page(root, bookingId) {
    root.classList.add("bk-module"); load(root);
    if (!/^[0-9]+$/.test(String(bookingId || ""))) { error(root,new Error("Choisissez une réservation à régler."),() => location.href = clientUrl("reservations","")); return; }
    try {
      const [booking, attempts] = await Promise.all([api.get("/api/bookings/" + bookingId),api.get("/api/payments?bookingId=" + bookingId)]);
      if (!root.isConnected) return;
      const last = attempts[attempts.length - 1], settled = last && ["PAID","PARTIALLY_REFUNDED","REFUNDED"].includes(last.status);
      const expired = booking.status === "EXPIRED" || booking.expiresAt && utc(booking.expiresAt) <= Date.now();
      const publicRoot = location.pathname.includes("/client/") ? "../" : "./";
      root.innerHTML = banner + `<h1>Régler votre réservation</h1><div class="pm-checkout"><section class="pm-panel"><h2>${esc(booking.reference)}</h2>
        ${booking.items.filter(i => !i.parentItemId).map(i => `<div class="bk-item"><div><strong>${esc(i.title)}</strong><p>${esc(i.serviceStartAt?.replace("T"," "))} → ${esc(i.serviceEndAt?.replace("T"," "))}</p></div><strong>${money(i.lineTotal)}</strong></div>`).join("")}
        <div class="bk-totals"><p>Sous-total TTC <strong>${money(booking.subtotal)}</strong></p><p>Remise <strong>− ${money(booking.discount)}</strong></p><p class="bk-total">Total TTC <strong>${money(booking.total)}</strong></p></div><p class="pm-countdown" role="timer"></p>
        <div class="pm-recent">${last ? receipt(last) : ""}</div></section><section class="pm-panel pm-payment-form"></section></div>`;
      const container = root.querySelector(".pm-payment-form");
      if (expired || ["CANCELLED","COMPLETED"].includes(booking.status) && !settled) {
        container.innerHTML = `<h2>${expired ? "Réservation expirée" : "Réservation indisponible"}</h2><p>Aucun paiement ne peut être lancé pour cette réservation.</p><a class="bk-button" href="${publicRoot}accueil.html">Retour au catalogue</a>`; return;
      }
      if (settled) { container.innerHTML = '<h2>Paiement enregistré</h2><p>Consultez votre réservation et son justificatif.</p><a class="bk-button" href="' + clientUrl("confirmation",bookingId) + '">Voir la confirmation</a>'; return; }
      let pending = saved(bookingId), busy = false;
      const cashBooking = booking.paymentMethod === "PAY_ON_ARRIVAL";
      container.innerHTML = `<form autocomplete="off"><h2>Mode de paiement</h2>
        <label class="pm-method"><input type="radio" name="method" value="CARD" ${cashBooking ? "disabled" : "checked"}> Carte sandbox</label>
        ${booking.payOnArrivalAllowed || cashBooking ? `<label class="pm-method"><input type="radio" name="method" value="CASH_ON_ARRIVAL" ${cashBooking ? "checked" : ""}> Paiement à l’arrivée</label>` : ""}
        <div class="pm-card-fields"><label>Titulaire<input data-card-name maxlength="80" autocomplete="cc-name"></label><label>Numéro de test<input data-card-number inputmode="numeric" maxlength="23" autocomplete="cc-number" placeholder="4242 4242 4242 4242"></label><div class="pm-fields"><label>Expiration<input data-card-exp maxlength="5" autocomplete="cc-exp" placeholder="12/30"></label><label>CVC de test<input data-card-cvc type="password" inputmode="numeric" maxlength="4" autocomplete="cc-csc" placeholder="123"></label></div></div>
        <details class="pm-test-cards" open><summary>Cartes de test sandbox</summary><p>4242 4242 4242 4242 — succès</p><p>4000 0000 0000 0002 — carte refusée</p><p>4000 0000 0000 9995 — fonds insuffisants</p><p>4000 0000 0000 0341 — erreur transitoire</p><small>Date future et CVC fictif. Numéro et CVC restent dans le navigateur.</small></details>
        <p class="bk-feedback" role="alert"></p><button class="bk-button" type="submit">Confirmer le paiement sandbox</button><button class="bk-button bk-secondary pm-new-attempt" type="button" hidden>Nouvelle tentative</button></form>
        <div class="bk-actions"><a class="bk-button bk-secondary" href="${clientUrl("reservations",bookingId)}&status=cancelled">Retour à mes réservations</a>${booking.canCancel ? '<button type="button" class="bk-button bk-danger pm-cancel">Annuler la réservation</button>' : ""}</div>`;
      const form = container.querySelector("form"), submit = form.querySelector('[type="submit"]'), feedback = form.querySelector(".bk-feedback"), fresh = form.querySelector(".pm-new-attempt");
      const cardFields = form.querySelector(".pm-card-fields");
      const updateMethod = () => { cardFields.hidden = form.elements.method.value !== "CARD"; };
      form.querySelectorAll('[name="method"]').forEach(input => input.onchange = updateMethod); updateMethod();
      function newAttempt() { pending = null; save(bookingId,null); fresh.hidden = true; submit.disabled = false; submit.textContent = "Confirmer le paiement sandbox"; feedback.textContent = ""; }
      fresh.onclick = newAttempt;
      if (pending) { submit.textContent = "Réessayer la même demande"; fresh.hidden = false; }
      form.onsubmit = async event => {
        event.preventDefault(); if (busy) return;
        if (!pending) {
          const method = form.elements.method.value, body = {bookingId:Number(bookingId),method};
          if (method === "CARD") {
            const number = form.querySelector("[data-card-number]").value.replace(/[ -]/g,""), cvc = form.querySelector("[data-card-cvc]").value;
            const expiration = form.querySelector("[data-card-exp]").value, match = expiration.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
            const now = new Date(), future = match && (2000 + Number(match[2]) > now.getFullYear() || 2000 + Number(match[2]) === now.getFullYear() && Number(match[1]) >= now.getMonth()+1);
            if (!form.querySelector("[data-card-name]").value.trim() || !/^[0-9]{13,19}$/.test(number) || !/^[0-9]{3,4}$/.test(cvc) || !future) { feedback.textContent = "Renseignez une carte de test, un titulaire, une date future et un CVC fictif."; return; }
            const tokens = {"4242424242424242":"success","4000000000000002":"declined","4000000000009995":"insufficient_funds","4000000000000341":"error"};
            body.cardToken = "tok_sandbox_" + (tokens[number] || "declined"); body.cardLast4 = number.slice(-4); body.cardBrand = "VISA";
            ["number","cvc","exp","name"].forEach(field => form.querySelector("[data-card-"+field+"]").value = "");
          }
          pending = {key:crypto.randomUUID(),body}; save(bookingId,pending);
        }
        busy = true; submit.disabled = true; feedback.textContent = "";
        try {
          const response = await post("/api/payments",pending.body,pending.key);
          if (response.status === "FAILED") {
            save(bookingId,null); feedback.textContent = response.failureMessage || "La tentative a échoué."; fresh.hidden = false; submit.disabled = true;
            const params = new URLSearchParams(location.search); params.set("status","failed"); history.replaceState({},"",location.pathname+"?"+params); root.querySelector(".pm-recent").innerHTML = receipt(response);
          } else if (response.status === "PROCESSING") { feedback.textContent = "Traitement en cours. Réessayez la même demande."; submit.disabled = false; }
          else { save(bookingId,null); location.href = clientUrl("confirmation",bookingId) + "&status=success"; }
        } catch (err) {
          feedback.textContent = err.status ? err.message : "Connexion interrompue. Réessayez la même demande : aucun paiement ne sera doublé."; submit.disabled = false; submit.textContent = "Réessayer la même demande"; fresh.hidden = false;
        } finally { busy = false; }
      };
      container.querySelector(".pm-cancel")?.addEventListener("click",async event => {
        event.currentTarget.disabled = true;
        try { await api.post("/api/bookings/"+bookingId+"/cancel",{}); save(bookingId,null); location.href = clientUrl("confirmation",bookingId)+"&status=cancelled"; }
        catch (err) { feedback.textContent = err.message; event.currentTarget.disabled = false; }
      });
      const ticker = () => {
        if (!root.isConnected) { clearInterval(timer); return; }
        const remaining = utc(booking.expiresAt) - Date.now();
        root.querySelector(".pm-countdown").textContent = booking.expiresAt ? remaining > 0 ? "Temps restant : " + Math.floor(remaining/60000) + " min " + Math.floor(remaining%60000/1000) + " s" : "Délai de paiement expiré" : "Paiement à l’arrivée : aucune carte débitée.";
        if (booking.expiresAt && remaining <= 0) { submit.disabled = true; feedback.textContent = "La réservation est expirée. Revenez au catalogue pour réserver à nouveau."; }
      };
      const timer = setInterval(ticker,1000); ticker();
    } catch (err) { if (root.isConnected) error(root,err,() => page(root,bookingId)); }
  }
  function operationDialog(payment, type, reload) {
    const refund = type === "refund", dialog = document.createElement("dialog"); dialog.className = "bk-dialog";
    dialog.innerHTML = `<form class="bk-module"><h2>${refund ? "Rembourser" : "Encaisser"} ${esc(payment.bookingReference)}</h2><p>${refund ? "Reste remboursable" : "Solde dû"} : ${money(refund ? payment.refundableAmount : payment.amount)}</p><label>Montant MAD<input name="amount" type="number" min="0.01" step="0.01" max="${Number(refund ? payment.refundableAmount : payment.amount)}" value="${Number(refund ? payment.refundableAmount : payment.amount).toFixed(2)}" ${refund ? "" : "readonly"} required></label><label>${refund ? "Motif obligatoire" : "Note facultative"}<textarea name="reason" maxlength="1000" ${refund ? "required" : ""}></textarea></label><p role="alert" class="bk-feedback"></p><div class="bk-actions"><button type="button" class="bk-button bk-secondary">Fermer</button><button class="bk-button" type="submit">Confirmer ${refund ? "le remboursement" : "l’encaissement"}</button></div></form>`;
    document.body.append(dialog); dialog.addEventListener("close",() => dialog.remove()); dialog.showModal(); dialog.querySelector('[type="button"]').onclick = () => dialog.close();
    let pending = null, busy = false;
    dialog.querySelector("form").onsubmit = async event => {
      event.preventDefault(); if (busy) return;
      const form = event.currentTarget, submit = form.querySelector('[type="submit"]');
      if (!pending) {
        const amount = Number(form.elements.amount.value), reason = form.elements.reason.value.trim();
        pending = {key:crypto.randomUUID(),body:refund ? {amount,reason} : {amount,note:reason || null}};
      }
      busy = true; submit.disabled = true;
      try { await post("/api/payments/"+payment.id+(refund ? "/refund" : "/collect-cash"),pending.body,pending.key); dialog.close(); toast(refund ? "Remboursement sandbox enregistré" : "Encaissement enregistré"); reload(); }
      catch (err) {
        form.querySelector(".bk-feedback").textContent = err.message; submit.textContent = "Réessayer la même demande";
        if (err.status && !form.querySelector(".pm-new-request")) {
          const again = document.createElement("button"); again.type = "button"; again.className = "bk-button bk-secondary pm-new-request"; again.textContent = "Nouvelle demande";
          again.onclick = () => { pending = null; submit.textContent = "Confirmer"; again.remove(); }; form.append(again);
        }
      }
      finally { busy = false; submit.disabled = false; }
    };
  }
  async function drawer(id, role, reload = () => {}) {
    const dialog = document.createElement("dialog"); dialog.className = "bk-dialog bk-wide";
    dialog.innerHTML = '<button type="button" class="bk-close">×</button><div class="pm-drawer"></div>'; document.body.append(dialog); dialog.addEventListener("close",() => dialog.remove()); dialog.querySelector("button").onclick = () => dialog.close(); dialog.showModal();
    const root = dialog.querySelector("div"); load(root);
    async function refresh() {
      try {
        const [p,events] = await Promise.all([api.get("/api/payments/"+id),api.get("/api/payments/"+id+"/events")]); if (!root.isConnected) return;
        root.innerHTML = banner + receipt(p) + `<div class="bk-actions">${role === "ADMIN" && ["PAID","PARTIALLY_REFUNDED"].includes(p.status) && Number(p.refundableAmount) > 0 ? '<button class="bk-button pm-refund">Rembourser</button>' : ""}${["AGENT","ADMIN"].includes(role) && p.method === "CASH_ON_ARRIVAL" && p.status === "PENDING" && p.bookingStatus === "CONFIRMED" ? '<button class="bk-button pm-collect">Encaisser</button>' : ""}</div><h3>Historique immuable</h3><ol class="pm-events">${events.map(e => `<li><strong>${esc(e.eventType)}</strong> ${esc(e.fromStatus || "Création")} → ${esc(e.toStatus)}<small>${date(e.createdAt)} · ${esc(e.actorName || e.actorRole || "Système")}</small>${reason(e.details) ? `<p>${esc(reason(e.details))}</p>` : ""}</li>`).join("")}</ol>`;
        const changed = () => { refresh(); reload(); };
        root.querySelector(".pm-refund")?.addEventListener("click",() => operationDialog(p,"refund",changed));
        root.querySelector(".pm-collect")?.addEventListener("click",() => operationDialog(p,"cash",changed));
      } catch (err) { error(root,err,refresh); }
    }
    refresh();
  }
  function list(root, role = Auth.getUser()?.role, cash = false) {
    root.classList.add("bk-module"); let currentPage = 0, pageSize = 10, scope = cash ? "cash-pending" : role === "CLIENT" ? "mine" : "admin", generation = 0;
    root.innerHTML = banner + `${cash ? '<div class="bk-tabs"><button data-scope="cash-pending" class="active">À encaisser</button><button data-scope="cash-history">Historique d’encaissement</button></div>' : ""}
      <form class="bk-filters"><label>Référence ou client<input name="search" placeholder="Rechercher…"></label><label>Statut<select name="status"><option value="">Tous</option>${Object.entries(labels).map(([key,label]) => `<option value="${key}">${label}</option>`).join("")}</select></label><label>Méthode<select name="method"><option value="">Toutes</option><option value="CARD">Carte</option><option value="CASH_ON_ARRIVAL">À l’arrivée</option></select></label><label>Du<input name="from" type="date"></label><label>Au<input name="to" type="date"></label><button class="bk-button">Rechercher</button><button class="bk-button bk-secondary" type="reset">Réinitialiser</button></form><div class="pm-results" aria-live="polite"></div>`;
    const form = root.querySelector("form"), box = root.querySelector(".pm-results");
    async function refresh() {
      const version = ++generation, params = new URLSearchParams(new FormData(form)); [...params].forEach(([k,v]) => { if (!v) params.delete(k); }); params.set("page",currentPage); params.set("size",pageSize); load(box);
      try {
        const p = await api.get("/api/payments/"+scope+"?"+params); if (!root.isConnected || generation !== version) return;
        if (!p.content.length) { box.innerHTML = '<div class="bk-empty"><span aria-hidden="true">◈</span><h2>Aucun paiement</h2><p>Aucun paiement ne correspond aux critères sélectionnés.</p></div>'; return; }
        box.innerHTML = `<div class="bk-table-wrap"><table><thead><tr><th>Réservation</th><th>Client</th><th>Montant TTC</th><th>Méthode</th><th>Statut</th><th>Encaissement</th><th></th></tr></thead><tbody>${p.content.map(value => `<tr><td><strong>${esc(value.bookingReference)}</strong><small>${date(value.createdAt)}</small></td><td>${esc(value.clientName)}</td><td>${money(value.amount)}</td><td>${value.method === "CARD" ? "Carte" : "À l’arrivée"}</td><td>${badge(value.status)}</td><td>${value.collectedByName ? esc(value.collectedByName) + "<small>" + date(value.paidAt) + "</small>" : "—"}</td><td><button class="bk-button bk-secondary" data-payment="${value.id}">Détail${cash && scope === "cash-pending" ? " / Encaisser" : ""}</button></td></tr>`).join("")}</tbody></table></div>${AtlasTablePagination.render(p)}`;
        box.querySelectorAll("[data-payment]").forEach(button => button.onclick = () => drawer(button.dataset.payment,role,refresh));
        AtlasTablePagination.bind(box, {
          onPage: pageNumber => { currentPage = pageNumber; refresh(); },
          onSize: size => { pageSize = size; currentPage = 0; refresh(); }
        });
      } catch (err) { if (generation === version && root.isConnected) error(box,err,refresh); }
    }
    form.onsubmit = event => { event.preventDefault(); currentPage = 0; refresh(); }; form.onreset = () => setTimeout(() => { currentPage = 0; refresh(); },0);
    root.querySelectorAll("[data-scope]").forEach(button => button.onclick = () => { scope = button.dataset.scope; currentPage = 0; root.querySelectorAll("[data-scope]").forEach(b => b.classList.toggle("active",b === button)); refresh(); });
    refresh();
  }
  return {page,list,summary,drawer};
})();
