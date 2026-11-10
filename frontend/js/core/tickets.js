/**
 * Atlas Voyage — Module Support / Tickets
 * Fichier : frontend/js/core/tickets.js
 * JavaScript Vanilla sécurisé (protection XSS via échappement systématique).
 * Relié à l'API REST Spring Boot (/api/tickets).
 */
const TicketsUI = (() => {
  "use strict";

  // Les classes utilitaires de css/tickets.css ne s'appliquent que sous .tk-ui.
  const markUi = (container) => { container?.classList.add("tk-ui"); return container; };

  const CATEGORIES = {
    BOOKING: "Réservation",
    PAYMENT: "Paiement",
    OFFER: "Offre / Prestation",
    ACCOUNT: "Compte & Sécurité",
    TECHNICAL: "Problème technique",
    OTHER: "Autre demande"
  };

  const STATUS_LABELS = {
    OPEN: "Ouvert",
    IN_PROGRESS: "En cours",
    RESOLVED: "Résolu",
    CLOSED: "Fermé"
  };

  const PRIORITY_LABELS = {
    LOW: "Basse",
    MEDIUM: "Normale",
    HIGH: "Haute",
    URGENT: "Urgente"
  };

  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function relativeTime(iso) {
    if (!iso) return "";
    const parsed = Date.parse(iso.endsWith("Z") || /[+-][0-9]{2}:[0-9]{2}$/.test(iso) ? iso : iso + "Z");
    if (isNaN(parsed)) return iso;
    const diffMin = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return new Date(parsed).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function statusBadge(status) {
    const s = status ? status.toUpperCase() : "OPEN";
    const label = STATUS_LABELS[s] || s;
    return `<span class="ticket-badge ticket-status-${esc(s.toLowerCase())}">${esc(label)}</span>`;
  }

  function priorityBadge(priority) {
    const p = priority ? priority.toUpperCase() : "MEDIUM";
    const label = PRIORITY_LABELS[p] || p;
    return `<span class="ticket-badge ticket-priority-${esc(p.toLowerCase())}">${esc(label)}</span>`;
  }

  function showToast(message, isError = false) {
    const existing = document.querySelector(".ticket-toast-banner");
    if (existing) existing.remove();
    const banner = document.createElement("div");
    banner.className = `ticket-toast-banner static-toast show ${isError ? "error" : "success"}`;
    banner.style.position = "fixed";
    banner.style.bottom = "24px";
    banner.style.right = "24px";
    banner.style.zIndex = "9999";
    banner.style.padding = "12px 20px";
    banner.style.borderRadius = "8px";
    banner.style.background = isError ? "#ef4444" : "#10b981";
    banner.style.color = "#ffffff";
    banner.style.fontWeight = "600";
    banner.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    banner.textContent = message;
    document.body.appendChild(banner);
    setTimeout(() => { banner.remove(); }, 3500);
  }

  // =========================================================================
  // VUE CLIENT & FOURNISSEUR
  // =========================================================================
  function renderClient(container, role = "CLIENT") {
    let state = {
      tickets: [],
      total: 0,
      page: 0,
      size: 10,
      status: "",
      category: "",
      search: "",
      loading: false,
      error: null,
      selectedTicketId: null,
      activeTicketDetail: null
    };

    function init() {
      container.innerHTML = `
        <div class="page-title flex items-center justify-between mb-4">
          <div>
            <span class="eyebrow text-xs font-bold text-sky-600 uppercase tracking-wider">ASSISTANCE & SERVICE CLIENT</span>
            <h1 class="text-2xl font-bold text-slate-800">Mes tickets de support</h1>
            <p class="text-sm text-slate-500">Échangez directement avec notre équipe locale pour toute question.</p>
          </div>
          <button type="button" class="btn btn-primary px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition" id="btn-create-ticket">
            + Nouveau ticket
          </button>
        </div>
        <div id="ticket-client-view-root"></div>
      `;

      container.querySelector("#btn-create-ticket").onclick = () => openCreateTicketModal(loadData);
      loadData();
    }

    async function loadData() {
      state.loading = true;
      state.error = null;
      renderMain();

      const params = new URLSearchParams();
      params.set("page", state.page);
      params.set("size", state.size);
      if (state.status) params.set("status", state.status);
      if (state.category) params.set("category", state.category);
      if (state.search.trim()) params.set("search", state.search.trim());

      try {
        const resp = await api.get(`/api/tickets?${params.toString()}`);
        state.tickets = resp.content || [];
        state.total = resp.totalElements || 0;
      } catch (err) {
        state.error = err.message || "Impossible de charger vos tickets.";
      } finally {
        state.loading = false;
        renderMain();
      }
    }

    function renderMain() {
      const root = container.querySelector("#ticket-client-view-root");
      if (!root) return;

      if (state.selectedTicketId && state.activeTicketDetail) {
        renderDetailView(root);
        return;
      }

      root.innerHTML = `
        <div class="ticket-toolbar">
          <div class="ticket-filters-group">
            <input type="text" class="ticket-input-search" id="client-search" placeholder="Rechercher par référence ou sujet..." value="${esc(state.search)}" />
            <select class="ticket-select" id="client-filter-status">
              <option value="">Tous les statuts</option>
              <option value="OPEN" ${state.status === "OPEN" ? "selected" : ""}>Ouvert</option>
              <option value="IN_PROGRESS" ${state.status === "IN_PROGRESS" ? "selected" : ""}>En cours</option>
              <option value="RESOLVED" ${state.status === "RESOLVED" ? "selected" : ""}>Résolu</option>
              <option value="CLOSED" ${state.status === "CLOSED" ? "selected" : ""}>Fermé</option>
            </select>
            <select class="ticket-select" id="client-filter-category">
              <option value="">Toutes les catégories</option>
              ${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${esc(k)}" ${state.category === k ? "selected" : ""}>${esc(v)}</option>`).join("")}
            </select>
          </div>
          <button type="button" class="btn btn-outline text-sm px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50" id="client-filter-reset">Réinitialiser</button>
        </div>

        <div id="client-tickets-content"></div>
      `;

      // Events filtres
      const searchInput = root.querySelector("#client-search");
      let debounceTimer = null;
      searchInput.oninput = (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.search = e.target.value;
          state.page = 0;
          loadData();
        }, 300);
      };

      root.querySelector("#client-filter-status").onchange = (e) => {
        state.status = e.target.value;
        state.page = 0;
        loadData();
      };

      root.querySelector("#client-filter-category").onchange = (e) => {
        state.category = e.target.value;
        state.page = 0;
        loadData();
      };

      root.querySelector("#client-filter-reset").onclick = () => {
        state.status = "";
        state.category = "";
        state.search = "";
        state.page = 0;
        loadData();
      };

      renderListContent(root.querySelector("#client-tickets-content"));
    }

    function renderListContent(listContainer) {
      if (!listContainer) return;

      if (state.loading) {
        listContainer.innerHTML = `
          <div class="ticket-table-wrapper p-6">
            <div class="ticket-skeleton-line" style="width: 70%"></div>
            <div class="ticket-skeleton-line" style="width: 90%"></div>
            <div class="ticket-skeleton-line" style="width: 60%"></div>
            <div class="ticket-skeleton-line" style="width: 80%"></div>
          </div>
        `;
        return;
      }

      if (state.error) {
        listContainer.innerHTML = `
          <div class="ticket-error-state">
            <p><strong>Erreur :</strong> ${esc(state.error)}</p>
            <button type="button" class="btn btn-primary mt-3 px-4 py-2 bg-red-600 text-white rounded-lg" id="btn-retry-client">Réessayer</button>
          </div>
        `;
        listContainer.querySelector("#btn-retry-client").onclick = loadData;
        return;
      }

      if (state.tickets.length === 0) {
        listContainer.innerHTML = `
          <div class="ticket-table-wrapper">
            <div class="ticket-empty-state">
              <span class="ticket-empty-icon">✉</span>
              <h4>Aucun ticket de support</h4>
              <p>Vous n'avez pas de ticket correspondant à vos critères actuels.</p>
              <button type="button" class="btn btn-primary px-4 py-2 bg-sky-600 text-white rounded-lg" id="btn-empty-new-ticket">Ouvrir une nouvelle demande</button>
            </div>
          </div>
        `;
        listContainer.querySelector("#btn-empty-new-ticket").onclick = () => openCreateTicketModal(loadData);
        return;
      }

      const rows = state.tickets.map(t => `
        <tr class="cursor-pointer hover:bg-slate-50 transition" data-ticket-id="${t.id}">
          <td><span class="ticket-ref-code">${esc(t.reference)}</span></td>
          <td>
            <div class="font-semibold text-slate-800">${esc(t.subject)}</div>
            <small class="text-xs text-slate-500">${esc(t.lastMessagePreview || "")}</small>
          </td>
          <td><span class="text-xs font-medium text-slate-600">${esc(CATEGORIES[t.category] || t.category)}</span></td>
          <td>${statusBadge(t.status)}</td>
          <td>${priorityBadge(t.priority)}</td>
          <td>
            <span class="text-xs text-slate-500">${relativeTime(t.lastMessageAt || t.updatedAt || t.createdAt)}</span>
          </td>
          <td class="text-right">
            <button type="button" class="text-sky-600 hover:text-sky-800 font-semibold text-xs py-1 px-2 rounded">
              Voir (${t.messageCount || 1}) →
            </button>
          </td>
        </tr>
      `).join("");

      const totalPages = Math.ceil(state.total / state.size) || 1;

      listContainer.innerHTML = `
        <div class="ticket-table-wrapper">
          <table class="ticket-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Sujet & Aperçu</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Dernière activité</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="flex items-center justify-between p-4 border-t border-slate-200 text-xs text-slate-600">
            <span>Affichage de ${state.tickets.length} sur ${state.total} ticket(s)</span>
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-outline px-2 py-1 border rounded disabled:opacity-50" id="btn-page-prev" ${state.page === 0 ? "disabled" : ""}>Précédent</button>
              <span>Page ${state.page + 1} / ${totalPages}</span>
              <button type="button" class="btn btn-outline px-2 py-1 border rounded disabled:opacity-50" id="btn-page-next" ${state.page >= totalPages - 1 ? "disabled" : ""}>Suivant</button>
            </div>
          </div>
        </div>
      `;

      // Clic ligne pour ouvrir le détail
      listContainer.querySelectorAll("tr[data-ticket-id]").forEach(tr => {
        tr.onclick = () => openTicketDetail(tr.dataset.ticketId);
      });

      const prevBtn = listContainer.querySelector("#btn-page-prev");
      if (prevBtn) prevBtn.onclick = () => { if (state.page > 0) { state.page--; loadData(); } };
      const nextBtn = listContainer.querySelector("#btn-page-next");
      if (nextBtn) nextBtn.onclick = () => { if (state.page < totalPages - 1) { state.page++; loadData(); } };
    }

    async function openTicketDetail(ticketId) {
      try {
        state.selectedTicketId = ticketId;
        state.loading = true;
        renderMain();
        state.activeTicketDetail = await api.get(`/api/tickets/${ticketId}`);
      } catch (err) {
        showToast(err.message || "Erreur lors du chargement du ticket", true);
        state.selectedTicketId = null;
        state.activeTicketDetail = null;
      } finally {
        state.loading = false;
        renderMain();
      }
    }

    function renderDetailView(root) {
      const t = state.activeTicketDetail;
      if (!t) return;

      const isClosed = t.status === "CLOSED";
      const isResolved = t.status === "RESOLVED";

      const messagesHtml = (t.messages || []).map(m => {
        const isSelf = m.author && m.author.id === Auth.getUser()?.id;
        return `
          <div class="message-bubble-wrapper ${isSelf ? "requester" : "staff"}">
            <div class="message-meta">
              <span class="author-name">${esc(m.author ? m.author.fullName : "Support")}</span>
              <span>•</span>
              <time>${relativeTime(m.createdAt)}</time>
            </div>
            <div class="message-bubble">${esc(m.content)}</div>
          </div>
        `;
      }).join("");

      root.innerHTML = `
        <div class="mb-4">
          <button type="button" class="text-sky-600 hover:text-sky-800 text-sm font-semibold flex items-center gap-1 mb-3" id="btn-back-to-list">
            ← Retour à la liste des tickets
          </button>
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="ticket-ref-code text-base">${esc(t.reference)}</span>
                  ${statusBadge(t.status)}
                  ${priorityBadge(t.priority)}
                </div>
                <h2 class="text-xl font-bold text-slate-800">${esc(t.subject)}</h2>
                <div class="text-xs text-slate-500 mt-1">
                  Catégorie : <strong>${esc(CATEGORIES[t.category] || t.category)}</strong>
                  ${t.booking ? ` | Réservation liée : <strong class="text-sky-600">${esc(t.booking.reference)}</strong>` : ""}
                  | Créé ${relativeTime(t.createdAt)}
                </div>
              </div>
              <div class="flex items-center gap-2">
                ${!isClosed ? `<button type="button" class="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold" id="btn-close-ticket">Fermer le ticket</button>` : ""}
                ${isResolved ? `<button type="button" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold" id="btn-reopen-ticket">Rouvrir le ticket</button>` : ""}
              </div>
            </div>

            <div class="ticket-conversation">
              ${messagesHtml}
            </div>

            ${isClosed ? `
              <div class="ticket-closed-banner">
                <span>🔒</span>
                <div>Ce ticket est <strong>fermé</strong>. Les réponses ne sont plus acceptées.</div>
              </div>
            ` : `
              <form class="ticket-reply-area" id="client-reply-form">
                <label class="block text-xs font-bold text-slate-700 mb-2">Votre réponse au support :</label>
                <textarea class="ticket-reply-textarea" id="client-reply-text" placeholder="Écrivez votre message ici..." required minlength="1" maxlength="5000"></textarea>
                <div class="ticket-reply-controls">
                  <span class="text-xs text-slate-400" id="reply-char-count">0 / 5000</span>
                  <button type="submit" class="btn btn-primary px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition" id="btn-send-reply">
                    Envoyer ma réponse
                  </button>
                </div>
              </form>
            `}
          </div>
        </div>
      `;

      root.querySelector("#btn-back-to-list").onclick = () => {
        state.selectedTicketId = null;
        state.activeTicketDetail = null;
        renderMain();
      };

      const closeBtn = root.querySelector("#btn-close-ticket");
      if (closeBtn) {
        closeBtn.onclick = async () => {
          if (!confirm("Êtes-vous sûr de vouloir fermer ce ticket ?")) return;
          try {
            await api.patch(`/api/tickets/${t.id}/status`, { status: "CLOSED" });
            showToast("Le ticket a été fermé avec succès.");
            openTicketDetail(t.id);
          } catch (err) {
            showToast(err.message || "Erreur lors de la fermeture", true);
          }
        };
      }

      const reopenBtn = root.querySelector("#btn-reopen-ticket");
      if (reopenBtn) {
        reopenBtn.onclick = async () => {
          try {
            await api.patch(`/api/tickets/${t.id}/status`, { status: "OPEN" });
            showToast("Le ticket a été rouvert.");
            openTicketDetail(t.id);
          } catch (err) {
            showToast(err.message || "Erreur lors de la réouverture", true);
          }
        };
      }

      const replyForm = root.querySelector("#client-reply-form");
      if (replyForm) {
        const textarea = root.querySelector("#client-reply-text");
        const countSpan = root.querySelector("#reply-char-count");
        textarea.oninput = () => { countSpan.textContent = `${textarea.value.length} / 5000`; };

        replyForm.onsubmit = async (e) => {
          e.preventDefault();
          const content = textarea.value.trim();
          if (!content) return;

          const submitBtn = root.querySelector("#btn-send-reply");
          submitBtn.disabled = true;
          submitBtn.textContent = "Envoi...";

          try {
            await api.post(`/api/tickets/${t.id}/messages`, { content, internalNote: false });
            showToast("Votre réponse a été envoyée.");
            openTicketDetail(t.id);
          } catch (err) {
            showToast(err.message || "Erreur lors de l'envoi", true);
            submitBtn.disabled = false;
            submitBtn.textContent = "Envoyer ma réponse";
          }
        };
      }
    }

    init();
  }

  // =========================================================================
  // MODALE DE CRÉATION DE TICKET
  // =========================================================================
  async function openCreateTicketModal(onCreated) {
    const overlay = document.createElement("div");
    overlay.className = "ticket-modal-overlay tk-ui";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    let bookings = [];
    try {
      const resp = await api.get("/api/bookings?size=50");
      bookings = resp.content || [];
    } catch {
      // Si non supporté ou pas de réservation, liste vide
    }

    overlay.innerHTML = `
      <div class="ticket-modal-card">
        <div class="ticket-modal-header">
          <h3>Ouvrir un nouveau ticket</h3>
          <button type="button" class="ticket-modal-close" id="btn-close-modal">✕</button>
        </div>
        <form id="create-ticket-form">
          <div class="ticket-modal-body">
            <div class="ticket-form-group">
              <label class="ticket-form-label" for="tk-subject">Sujet de votre demande <small>(5 à 150 caractères)</small> *</label>
              <input type="text" class="ticket-form-input" id="tk-subject" required minlength="5" maxlength="150" placeholder="Ex: Précision sur l'horaire de transfert" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="ticket-form-group">
                <label class="ticket-form-label" for="tk-category">Catégorie *</label>
                <select class="ticket-form-select" id="tk-category" required>
                  ${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("")}
                </select>
              </div>

              <div class="ticket-form-group">
                <label class="ticket-form-label" for="tk-priority">Priorité souhaitée</label>
                <select class="ticket-form-select" id="tk-priority">
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM" selected>Normale</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            ${bookings.length > 0 ? `
              <div class="ticket-form-group">
                <label class="ticket-form-label" for="tk-booking">Réservation liée <small>(optionnel)</small></label>
                <select class="ticket-form-select" id="tk-booking">
                  <option value="">Aucune réservation liée</option>
                  ${bookings.map(b => `<option value="${b.id}">${esc(b.reference)} — ${esc(b.status)} (${b.total} MAD)</option>`).join("")}
                </select>
              </div>
            ` : ""}

            <div class="ticket-form-group">
              <label class="ticket-form-label" for="tk-message">Votre message initial *</label>
              <textarea class="ticket-form-textarea" id="tk-message" rows="4" required minlength="1" maxlength="5000" placeholder="Expliquez votre situation avec le plus de précisions possible..."></textarea>
            </div>
          </div>
          <div class="ticket-modal-actions">
            <button type="button" class="btn btn-outline px-4 py-2 border rounded-lg text-sm" id="btn-cancel-modal">Annuler</button>
            <button type="submit" class="btn btn-primary px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition" id="btn-submit-ticket">Créer le ticket</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    overlay.querySelector("#btn-close-modal").onclick = closeModal;
    overlay.querySelector("#btn-cancel-modal").onclick = closeModal;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

    const keyListener = (e) => { if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", keyListener); } };
    document.addEventListener("keydown", keyListener);

    const form = overlay.querySelector("#create-ticket-form");
    form.onsubmit = async (e) => {
      e.preventDefault();
      const subject = overlay.querySelector("#tk-subject").value.trim();
      const category = overlay.querySelector("#tk-category").value;
      const priority = overlay.querySelector("#tk-priority").value;
      const bookingSelect = overlay.querySelector("#tk-booking");
      const bookingId = bookingSelect && bookingSelect.value ? Number(bookingSelect.value) : null;
      const message = overlay.querySelector("#tk-message").value.trim();

      if (!subject || subject.length < 5) {
        alert("Le sujet doit comporter au moins 5 caractères.");
        return;
      }
      if (!message) {
        alert("Le message ne peut être vide.");
        return;
      }

      const submitBtn = overlay.querySelector("#btn-submit-ticket");
      submitBtn.disabled = true;
      submitBtn.textContent = "Création en cours...";

      try {
        await api.post("/api/tickets", { subject, category, priority, bookingId, message });
        showToast("Votre ticket a été créé avec succès.");
        closeModal();
        if (typeof onCreated === "function") onCreated();
      } catch (err) {
        showToast(err.message || "Erreur lors de la création du ticket", true);
        submitBtn.disabled = false;
        submitBtn.textContent = "Créer le ticket";
      }
    };
  }

  // =========================================================================
  // VUE AGENT (FILE DE TICKETS + CONVERSATION + ACTIONS RAPIDES)
  // =========================================================================
  function renderAgent(container) {
    let state = {
      tickets: [],
      stats: null,
      tab: "me", // "me", "unassigned", "all"
      status: "",
      priority: "",
      category: "",
      search: "",
      page: 0,
      size: 15,
      selectedTicket: null,
      loading: false
    };

    async function init() {
      container.innerHTML = `
        <div class="mb-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <span class="eyebrow text-xs font-bold text-sky-600 uppercase tracking-wider">SUPPORT CLIENT</span>
              <h1 class="text-2xl font-bold text-slate-800">File de traitement des tickets</h1>
            </div>
            <button type="button" class="btn btn-outline text-xs px-3 py-1.5 border rounded-lg hover:bg-slate-50" id="agent-btn-refresh">
              ↻ Actualiser
            </button>
          </div>
          <div id="agent-stats-root" class="ticket-stats-grid"></div>
          <div id="agent-tickets-root"></div>
        </div>
      `;

      container.querySelector("#agent-btn-refresh").onclick = () => { loadStats(); loadTickets(); };
      await loadStats();
      await loadTickets();
    }

    async function loadStats() {
      try {
        state.stats = await api.get("/api/tickets/stats");
        renderStats();
      } catch (err) {
        console.warn("Erreur chargement stats tickets :", err);
      }
    }

    function renderStats() {
      const statsRoot = container.querySelector("#agent-stats-root");
      if (!statsRoot || !state.stats) return;
      const s = state.stats;
      statsRoot.innerHTML = `
        <div class="ticket-stat-card border-l-4 border-l-blue-500">
          <small>Ouverts</small>
          <strong>${s.open}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-amber-500">
          <small>En cours</small>
          <strong>${s.inProgress}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-emerald-500">
          <small>Résolus</small>
          <strong>${s.resolved}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-red-500">
          <small>Urgents</small>
          <strong>${s.urgentPriority}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-slate-400">
          <small>Total tickets</small>
          <strong>${s.total}</strong>
        </div>
      `;
    }

    async function loadTickets() {
      state.loading = true;
      renderLayout();

      const params = new URLSearchParams();
      params.set("page", state.page);
      params.set("size", state.size);
      if (state.tab === "me") params.set("assigneeId", "me");
      else if (state.tab === "unassigned") params.set("assigneeId", "unassigned");
      if (state.status) params.set("status", state.status);
      if (state.priority) params.set("priority", state.priority);
      if (state.category) params.set("category", state.category);
      if (state.search.trim()) params.set("search", state.search.trim());

      try {
        const resp = await api.get(`/api/tickets?${params.toString()}`);
        state.tickets = resp.content || [];
        if (state.tickets.length > 0 && !state.selectedTicket) {
          selectTicket(state.tickets[0].id);
        } else if (state.tickets.length === 0) {
          state.selectedTicket = null;
        }
      } catch (err) {
        showToast(err.message || "Erreur chargement file de tickets", true);
      } finally {
        state.loading = false;
        renderLayout();
      }
    }

    async function selectTicket(id) {
      try {
        state.selectedTicket = await api.get(`/api/tickets/${id}`);
        renderLayout();
      } catch (err) {
        showToast(err.message || "Erreur chargement détail ticket", true);
      }
    }

    function renderLayout() {
      const root = container.querySelector("#agent-tickets-root");
      if (!root) return;

      const ticketsListHtml = state.tickets.map(t => {
        const isSelected = state.selectedTicket && state.selectedTicket.id === t.id;
        return `
          <button type="button" class="ticket-item ${isSelected ? "selected" : ""}" data-agent-ticket-id="${t.id}">
            <div>
              <span class="ticket-ref-code">${esc(t.reference)}</span>
              <time>${relativeTime(t.lastMessageAt || t.updatedAt)}</time>
            </div>
            <strong>${esc(t.subject)}</strong>
            <p>${esc(t.requester ? t.requester.fullName : "Client")} • ${esc(CATEGORIES[t.category] || t.category)}</p>
            <div class="flex items-center gap-1 mt-1">
              ${statusBadge(t.status)}
              ${priorityBadge(t.priority)}
            </div>
          </button>
        `;
      }).join("");

      root.innerHTML = `
        <div class="ticket-layout">
          <!-- Colonne Gauche : File de tickets -->
          <section class="card ticket-list flex flex-col">
            <div class="ticket-tabs">
              <button type="button" class="${state.tab === "me" ? "active" : ""}" data-tab="me">Mes tickets</button>
              <button type="button" class="${state.tab === "unassigned" ? "active" : ""}" data-tab="unassigned">Non assignés</button>
              <button type="button" class="${state.tab === "all" ? "active" : ""}" data-tab="all">Tous</button>
            </div>
            <label class="ticket-search">
              <input type="text" id="agent-search-input" placeholder="Rechercher un ticket..." value="${esc(state.search)}" />
            </label>
            <div class="flex-1 overflow-y-auto">
              ${state.loading ? `<div class="p-4 text-xs text-slate-500">Chargement des tickets...</div>` : ""}
              ${!state.loading && state.tickets.length === 0 ? `<div class="p-6 text-center text-xs text-slate-500">Aucun ticket dans cette file.</div>` : ""}
              ${ticketsListHtml}
            </div>
          </section>

          <!-- Colonne Centrale : Conversation -->
          <section class="card conversation">
            ${renderAgentConversation()}
          </section>

          <!-- Colonne Droite : Métadonnées et Actions -->
          <aside>
            ${renderAgentSidebar()}
          </aside>
        </div>
      `;

      // Tabs
      root.querySelectorAll(".ticket-tabs button").forEach(btn => {
        btn.onclick = () => {
          state.tab = btn.dataset.tab;
          state.page = 0;
          state.selectedTicket = null;
          loadTickets();
        };
      });

      // Search
      const searchInput = root.querySelector("#agent-search-input");
      let searchTimer = null;
      searchInput.oninput = (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          state.search = e.target.value;
          state.page = 0;
          loadTickets();
        }, 300);
      };

      // Ticket selection
      root.querySelectorAll("button[data-agent-ticket-id]").forEach(btn => {
        btn.onclick = () => selectTicket(btn.dataset.agentTicketId);
      });

      wireAgentActions(root);
    }

    function renderAgentConversation() {
      const t = state.selectedTicket;
      if (!t) {
        return `<div class="p-12 text-center text-slate-400">Sélectionnez un ticket dans la file de gauche pour afficher l'échange.</div>`;
      }

      const isClosed = t.status === "CLOSED";
      const messagesHtml = (t.messages || []).map(m => {
        const isInternal = m.internalNote;
        const isSelf = m.author && m.author.id === Auth.getUser()?.id;
        return `
          <div class="message-bubble-wrapper ${isInternal ? "internal" : isSelf ? "staff" : "requester"}">
            <div class="message-meta">
              <span class="author-name">${esc(m.author ? m.author.fullName : "Utilisateur")}</span>
              <span>(${esc(m.author ? m.author.role : "")})</span>
              <span>•</span>
              <time>${relativeTime(m.createdAt)}</time>
            </div>
            ${isInternal ? `<span class="internal-note-badge">🔒 Note interne — visible équipe uniquement</span>` : ""}
            <div class="message-bubble">${esc(m.content)}</div>
          </div>
        `;
      }).join("");

      return `
        <div class="conversation-head flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <span class="text-xs text-slate-500">${esc(t.reference)} • ${esc(CATEGORIES[t.category] || t.category)}</span>
            <h2 class="text-base font-bold text-slate-800">${esc(t.subject)}</h2>
            <p class="text-xs text-slate-500">${esc(t.requester ? t.requester.fullName : "Demandeur")} ${t.booking ? `• ${esc(t.booking.reference)}` : ""}</p>
          </div>
          <div class="flex items-center gap-2">
            ${statusBadge(t.status)}
            ${priorityBadge(t.priority)}
          </div>
        </div>

        <div class="ticket-conversation flex-1 p-4 overflow-y-auto">
          ${messagesHtml}
        </div>

        ${isClosed ? `
          <div class="ticket-closed-banner m-4">
            <span>🔒</span>
            <div>Ticket <strong>fermé</strong> : les réponses sont désactivées.</div>
          </div>
        ` : `
          <form class="ticket-reply-area m-4 mt-2" id="agent-reply-form">
            <textarea class="ticket-reply-textarea" id="agent-reply-text" placeholder="Écrivez votre message ou note interne..." required minlength="1" maxlength="5000"></textarea>
            <div class="ticket-reply-controls">
              <label class="ticket-toggle-internal">
                <input type="checkbox" id="agent-toggle-internal" />
                <span>Note interne (invisible pour le client)</span>
              </label>
              <button type="submit" class="btn btn-primary px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition" id="agent-send-reply">
                Envoyer
              </button>
            </div>
          </form>
        `}
      `;
    }

    function renderAgentSidebar() {
      const t = state.selectedTicket;
      if (!t) return `<section class="card ticket-info text-slate-400 text-xs">Aucun ticket sélectionné</section>`;

      const currentUserId = Auth.getUser()?.id;
      const isAssignedToMe = t.assignee && t.assignee.id === currentUserId;

      return `
        <section class="card ticket-info">
          <h2>Gestion du ticket</h2>
          <label>
            <span>Statut</span>
            <select id="agent-change-status" class="ticket-select w-full" ${t.status === "CLOSED" ? "disabled" : ""}>
              <option value="OPEN" ${t.status === "OPEN" ? "selected" : ""}>Ouvert</option>
              <option value="IN_PROGRESS" ${t.status === "IN_PROGRESS" ? "selected" : ""}>En cours</option>
              <option value="RESOLVED" ${t.status === "RESOLVED" ? "selected" : ""}>Résolu</option>
              <option value="CLOSED" ${t.status === "CLOSED" ? "selected" : ""}>Fermé</option>
            </select>
          </label>

          <label>
            <span>Priorité</span>
            <select id="agent-change-priority" class="ticket-select w-full">
              <option value="LOW" ${t.priority === "LOW" ? "selected" : ""}>Basse</option>
              <option value="MEDIUM" ${t.priority === "MEDIUM" ? "selected" : ""}>Normale</option>
              <option value="HIGH" ${t.priority === "HIGH" ? "selected" : ""}>Haute</option>
              <option value="URGENT" ${t.priority === "URGENT" ? "selected" : ""}>Urgente</option>
            </select>
          </label>

          <hr />

          <small>Agent assigné</small>
          <div class="flex items-center justify-between mt-1">
            <strong>${esc(t.assignee ? t.assignee.fullName : "Non assigné")}</strong>
            ${!isAssignedToMe ? `<button type="button" class="btn btn-outline text-xs px-2 py-1 border rounded bg-sky-50 text-sky-700" id="btn-self-assign">Me l'assigner</button>` : ""}
          </div>

          <hr />

          <small>Demandeur</small>
          <strong>${esc(t.requester ? t.requester.fullName : "")}</strong>
          <p class="text-xs text-slate-500">Rôle : ${esc(t.requester ? t.requester.role : "")}</p>

          ${t.booking ? `
            <hr />
            <small>Réservation liée</small>
            <strong class="text-sky-600 block mt-1">${esc(t.booking.reference)}</strong>
          ` : ""}

          <hr />
          <div class="text-[11px] text-slate-400 space-y-1">
            <div>Créé le : ${new Date(t.createdAt).toLocaleDateString("fr-FR")}</div>
            ${t.resolvedAt ? `<div>Résolu le : ${new Date(t.resolvedAt).toLocaleDateString("fr-FR")}</div>` : ""}
            ${t.closedAt ? `<div>Fermé le : ${new Date(t.closedAt).toLocaleDateString("fr-FR")}</div>` : ""}
          </div>
        </section>
      `;
    }

    function wireAgentActions(root) {
      const t = state.selectedTicket;
      if (!t) return;

      // Réponse / Note interne
      const replyForm = root.querySelector("#agent-reply-form");
      if (replyForm) {
        replyForm.onsubmit = async (e) => {
          e.preventDefault();
          const content = root.querySelector("#agent-reply-text").value.trim();
          const internalNote = root.querySelector("#agent-toggle-internal").checked;
          if (!content) return;

          const submitBtn = root.querySelector("#agent-send-reply");
          submitBtn.disabled = true;

          try {
            await api.post(`/api/tickets/${t.id}/messages`, { content, internalNote });
            showToast(internalNote ? "Note interne enregistrée." : "Réponse envoyée au demandeur.");
            await selectTicket(t.id);
            await loadStats();
          } catch (err) {
            showToast(err.message || "Erreur lors de l'envoi", true);
            submitBtn.disabled = false;
          }
        };
      }

      // Changement de statut
      const statusSelect = root.querySelector("#agent-change-status");
      if (statusSelect) {
        statusSelect.onchange = async () => {
          const newStatus = statusSelect.value;
          try {
            await api.patch(`/api/tickets/${t.id}/status`, { status: newStatus });
            showToast(`Statut mis à jour : ${STATUS_LABELS[newStatus] || newStatus}`);
            await selectTicket(t.id);
            await loadStats();
          } catch (err) {
            showToast(err.message || "Transition de statut interdite", true);
            statusSelect.value = t.status;
          }
        };
      }

      // Changement de priorité
      const prioritySelect = root.querySelector("#agent-change-priority");
      if (prioritySelect) {
        prioritySelect.onchange = async () => {
          const newPriority = prioritySelect.value;
          try {
            await api.patch(`/api/tickets/${t.id}/priority`, { priority: newPriority });
            showToast(`Priorité mise à jour : ${PRIORITY_LABELS[newPriority] || newPriority}`);
            await selectTicket(t.id);
            await loadStats();
          } catch (err) {
            showToast(err.message || "Erreur modification priorité", true);
            prioritySelect.value = t.priority;
          }
        };
      }

      // Auto-assignation
      const selfAssignBtn = root.querySelector("#btn-self-assign");
      if (selfAssignBtn) {
        selfAssignBtn.onclick = async () => {
          const currentUserId = Auth.getUser()?.id;
          try {
            await api.patch(`/api/tickets/${t.id}/assignee`, { assigneeId: currentUserId });
            showToast("Le ticket vous a été assigné.");
            await selectTicket(t.id);
            await loadTickets();
          } catch (err) {
            showToast(err.message || "Erreur lors de l'assignation", true);
          }
        };
      }
    }

    init();
  }

  // =========================================================================
  // VUE ADMINISTRATEUR (SUPERVISION GLOBALE, ASSIGNATION TOUS AGENTS, SUPPRESSION)
  // =========================================================================
  function renderAdmin(container) {
    let state = {
      tickets: [],
      stats: null,
      users: [],
      status: "",
      priority: "",
      category: "",
      assigneeId: "",
      search: "",
      page: 0,
      size: 20,
      total: 0,
      loading: false,
      selectedTicketId: null,
      activeTicketDetail: null
    };

    async function init() {
      container.innerHTML = `
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <span class="eyebrow text-xs font-bold text-sky-600 uppercase tracking-wider">GESTION DU SUPPORT</span>
              <p class="text-sm text-slate-500">Supervisez l'ensemble des demandes clients, assignez des agents et gérez les priorités.</p>
            </div>
            <button type="button" class="btn btn-outline text-xs px-3 py-1.5 border rounded-lg hover:bg-slate-50" id="admin-tickets-refresh">
              ↻ Actualiser
            </button>
          </div>
          <div id="admin-stats-kpis" class="ticket-stats-grid"></div>
          <div id="admin-tickets-root"></div>
        </div>
      `;

      container.querySelector("#admin-tickets-refresh").onclick = () => { loadStats(); loadUsers(); loadData(); };
      await Promise.all([loadStats(), loadUsers()]);
      await loadData();
    }

    async function loadStats() {
      try {
        state.stats = await api.get("/api/tickets/stats");
        renderStats();
      } catch (err) {
        console.warn("Erreur chargement stats tickets admin :", err);
      }
    }

    function renderStats() {
      const root = container.querySelector("#admin-stats-kpis");
      if (!root || !state.stats) return;
      const s = state.stats;
      root.innerHTML = `
        <div class="ticket-stat-card border-l-4 border-l-blue-500">
          <small>Ouverts</small>
          <strong>${s.open}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-amber-500">
          <small>En cours</small>
          <strong>${s.inProgress}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-emerald-500">
          <small>Résolus</small>
          <strong>${s.resolved}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-slate-400">
          <small>Fermés</small>
          <strong>${s.closed}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-red-500">
          <small>Urgents</small>
          <strong>${s.urgentPriority}</strong>
        </div>
        <div class="ticket-stat-card border-l-4 border-l-indigo-600">
          <small>Total tickets</small>
          <strong>${s.total}</strong>
        </div>
      `;
    }

    async function loadUsers() {
      try {
        const all = await api.get("/api/users");
        state.users = (all || []).filter(u => u.role === "AGENT" || u.role === "ADMIN");
      } catch (err) {
        console.warn("Impossible de charger les agents :", err);
      }
    }

    async function loadData() {
      state.loading = true;
      renderAdminMain();

      const params = new URLSearchParams();
      params.set("page", state.page);
      params.set("size", state.size);
      if (state.status) params.set("status", state.status);
      if (state.priority) params.set("priority", state.priority);
      if (state.category) params.set("category", state.category);
      if (state.assigneeId) params.set("assigneeId", state.assigneeId);
      if (state.search.trim()) params.set("search", state.search.trim());

      try {
        const resp = await api.get(`/api/tickets?${params.toString()}`);
        state.tickets = resp.content || [];
        state.total = resp.totalElements || 0;
      } catch (err) {
        showToast(err.message || "Erreur chargement tickets admin", true);
      } finally {
        state.loading = false;
        renderAdminMain();
      }
    }

    function renderAdminMain() {
      const root = container.querySelector("#admin-tickets-root");
      if (!root) return;

      if (state.selectedTicketId && state.activeTicketDetail) {
        renderAdminDetail(root);
        return;
      }

      root.innerHTML = `
        <div class="ticket-toolbar">
          <div class="ticket-filters-group">
            <input type="text" class="ticket-input-search" id="admin-search" placeholder="Référence, sujet..." value="${esc(state.search)}" />
            <select class="ticket-select" id="admin-filter-status">
              <option value="">Tous statuts</option>
              <option value="OPEN" ${state.status === "OPEN" ? "selected" : ""}>Ouvert</option>
              <option value="IN_PROGRESS" ${state.status === "IN_PROGRESS" ? "selected" : ""}>En cours</option>
              <option value="RESOLVED" ${state.status === "RESOLVED" ? "selected" : ""}>Résolu</option>
              <option value="CLOSED" ${state.status === "CLOSED" ? "selected" : ""}>Fermé</option>
            </select>
            <select class="ticket-select" id="admin-filter-priority">
              <option value="">Toutes priorités</option>
              <option value="LOW" ${state.priority === "LOW" ? "selected" : ""}>Basse</option>
              <option value="MEDIUM" ${state.priority === "MEDIUM" ? "selected" : ""}>Normale</option>
              <option value="HIGH" ${state.priority === "HIGH" ? "selected" : ""}>Haute</option>
              <option value="URGENT" ${state.priority === "URGENT" ? "selected" : ""}>Urgente</option>
            </select>
            <select class="ticket-select" id="admin-filter-category">
              <option value="">Toutes catégories</option>
              ${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${esc(k)}" ${state.category === k ? "selected" : ""}>${esc(v)}</option>`).join("")}
            </select>
            <select class="ticket-select" id="admin-filter-assignee">
              <option value="">Tous assignés</option>
              <option value="unassigned" ${state.assigneeId === "unassigned" ? "selected" : ""}>Non assignés</option>
              ${state.users.map(u => `<option value="${u.id}" ${state.assigneeId === String(u.id) ? "selected" : ""}>${esc(u.fullName)} (${esc(u.role)})</option>`).join("")}
            </select>
          </div>
          <button type="button" class="btn btn-outline text-xs px-3 py-1.5 border rounded-lg hover:bg-slate-50" id="admin-reset-filters">Réinitialiser</button>
        </div>

        <div id="admin-table-container"></div>
      `;

      // Events
      const search = root.querySelector("#admin-search");
      let searchTimer = null;
      search.oninput = (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          state.search = e.target.value;
          state.page = 0;
          loadData();
        }, 300);
      };

      root.querySelector("#admin-filter-status").onchange = (e) => { state.status = e.target.value; state.page = 0; loadData(); };
      root.querySelector("#admin-filter-priority").onchange = (e) => { state.priority = e.target.value; state.page = 0; loadData(); };
      root.querySelector("#admin-filter-category").onchange = (e) => { state.category = e.target.value; state.page = 0; loadData(); };
      root.querySelector("#admin-filter-assignee").onchange = (e) => { state.assigneeId = e.target.value; state.page = 0; loadData(); };
      root.querySelector("#admin-reset-filters").onclick = () => {
        state.status = "";
        state.priority = "";
        state.category = "";
        state.assigneeId = "";
        state.search = "";
        state.page = 0;
        loadData();
      };

      renderAdminTable(root.querySelector("#admin-table-container"));
    }

    function renderAdminTable(tableContainer) {
      if (!tableContainer) return;

      if (state.loading) {
        tableContainer.innerHTML = `<div class="ticket-table-wrapper p-6"><div class="ticket-skeleton-line"></div><div class="ticket-skeleton-line"></div></div>`;
        return;
      }

      if (state.tickets.length === 0) {
        tableContainer.innerHTML = `<div class="ticket-table-wrapper"><div class="ticket-empty-state"><h4>Aucun ticket trouvé</h4><p>Aucun ticket ne correspond à vos filtres.</p></div></div>`;
        return;
      }

      const rows = state.tickets.map(t => `
        <tr>
          <td><span class="ticket-ref-code">${esc(t.reference)}</span></td>
          <td>
            <div class="font-bold text-slate-800">${esc(t.subject)}</div>
            <small class="text-xs text-slate-500">${esc(t.lastMessagePreview || "")}</small>
          </td>
          <td><span class="text-xs text-slate-600">${esc(CATEGORIES[t.category] || t.category)}</span></td>
          <td>
            <div>${esc(t.requester ? t.requester.fullName : "")}</div>
            <small class="text-xs text-slate-400">${esc(t.requester ? t.requester.role : "")}</small>
          </td>
          <td>${statusBadge(t.status)}</td>
          <td>${priorityBadge(t.priority)}</td>
          <td>${esc(t.assignee ? t.assignee.fullName : "Non assigné")}</td>
          <td class="text-xs text-slate-500">${relativeTime(t.updatedAt || t.createdAt)}</td>
          <td class="text-right whitespace-nowrap">
            <button type="button" class="btn btn-primary text-xs px-2.5 py-1 bg-sky-600 text-white rounded hover:bg-sky-700" data-admin-view-ticket="${t.id}">
              Ouvrir
            </button>
            <button type="button" class="btn btn-outline text-xs px-2.5 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 ml-1" data-admin-delete-ticket="${t.id}">
              Supprimer
            </button>
          </td>
        </tr>
      `).join("");

      const totalPages = Math.ceil(state.total / state.size) || 1;

      tableContainer.innerHTML = `
        <div class="ticket-table-wrapper">
          <table class="ticket-table">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Sujet</th>
                <th>Catégorie</th>
                <th>Demandeur</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Assigné</th>
                <th>Mis à jour</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          ${AtlasTablePagination.render({ page: state.page, totalPages, totalElements: state.total, size: state.size })}
        </div>
      `;

      tableContainer.querySelectorAll("button[data-admin-view-ticket]").forEach(btn => {
        btn.onclick = () => openAdminDetail(btn.dataset.adminViewTicket);
      });

      tableContainer.querySelectorAll("button[data-admin-delete-ticket]").forEach(btn => {
        btn.onclick = () => confirmDeleteTicket(btn.dataset.adminDeleteTicket);
      });

      AtlasTablePagination.bind(tableContainer, {
        onPage: pageNumber => { state.page = pageNumber; loadData(); },
        onSize: size => { state.size = size; state.page = 0; loadData(); }
      });
    }

    async function openAdminDetail(id) {
      try {
        state.selectedTicketId = id;
        state.loading = true;
        renderAdminMain();
        state.activeTicketDetail = await api.get(`/api/tickets/${id}`);
      } catch (err) {
        showToast(err.message || "Erreur chargement ticket", true);
        state.selectedTicketId = null;
        state.activeTicketDetail = null;
      } finally {
        state.loading = false;
        renderAdminMain();
      }
    }

    function renderAdminDetail(root) {
      const t = state.activeTicketDetail;
      if (!t) return;

      const isClosed = t.status === "CLOSED";
      const messagesHtml = (t.messages || []).map(m => {
        const isInternal = m.internalNote;
        const isSelf = m.author && m.author.id === Auth.getUser()?.id;
        return `
          <div class="message-bubble-wrapper ${isInternal ? "internal" : isSelf ? "staff" : "requester"}">
            <div class="message-meta">
              <span class="author-name">${esc(m.author ? m.author.fullName : "Utilisateur")}</span>
              <span>(${esc(m.author ? m.author.role : "")})</span>
              <span>•</span>
              <time>${relativeTime(m.createdAt)}</time>
            </div>
            ${isInternal ? `<span class="internal-note-badge">🔒 Note interne</span>` : ""}
            <div class="message-bubble">${esc(m.content)}</div>
          </div>
        `;
      }).join("");

      root.innerHTML = `
        <div class="mb-4">
          <button type="button" class="text-sky-600 hover:text-sky-800 text-sm font-semibold flex items-center gap-1 mb-3" id="admin-btn-back">
            ← Retour à la liste globale
          </button>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- 2 colonnes conversation -->
            <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <span class="ticket-ref-code">${esc(t.reference)}</span>
                  <h2 class="text-lg font-bold text-slate-800 mt-1">${esc(t.subject)}</h2>
                </div>
                <div class="flex items-center gap-2">
                  ${statusBadge(t.status)}
                  ${priorityBadge(t.priority)}
                </div>
              </div>

              <div class="ticket-conversation mb-4">
                ${messagesHtml}
              </div>

              ${isClosed ? `
                <div class="ticket-closed-banner">🔒 Ce ticket est fermé.</div>
              ` : `
                <form class="ticket-reply-area" id="admin-reply-form">
                  <textarea class="ticket-reply-textarea" id="admin-reply-text" placeholder="Réponse au client ou note interne..." required minlength="1" maxlength="5000"></textarea>
                  <div class="ticket-reply-controls">
                    <label class="ticket-toggle-internal">
                      <input type="checkbox" id="admin-toggle-internal" />
                      <span>Note interne</span>
                    </label>
                    <button type="submit" class="btn btn-primary px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition" id="admin-send-reply">
                      Envoyer
                    </button>
                  </div>
                </form>
              `}
            </div>

            <!-- 1 colonne gestion latérale -->
            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 class="font-bold text-slate-800 border-b pb-2">Contrôle & Assignation</h3>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Assigner à :</label>
                <select class="ticket-select w-full" id="admin-select-assignee">
                  <option value="">Non assigné</option>
                  ${state.users.map(u => `<option value="${u.id}" ${t.assignee && t.assignee.id === u.id ? "selected" : ""}>${esc(u.fullName)} (${esc(u.role)})</option>`).join("")}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Statut :</label>
                <select class="ticket-select w-full" id="admin-select-status" ${isClosed ? "disabled" : ""}>
                  <option value="OPEN" ${t.status === "OPEN" ? "selected" : ""}>Ouvert</option>
                  <option value="IN_PROGRESS" ${t.status === "IN_PROGRESS" ? "selected" : ""}>En cours</option>
                  <option value="RESOLVED" ${t.status === "RESOLVED" ? "selected" : ""}>Résolu</option>
                  <option value="CLOSED" ${t.status === "CLOSED" ? "selected" : ""}>Fermé</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Priorité :</label>
                <select class="ticket-select w-full" id="admin-select-priority">
                  <option value="LOW" ${t.priority === "LOW" ? "selected" : ""}>Basse</option>
                  <option value="MEDIUM" ${t.priority === "MEDIUM" ? "selected" : ""}>Normale</option>
                  <option value="HIGH" ${t.priority === "HIGH" ? "selected" : ""}>Haute</option>
                  <option value="URGENT" ${t.priority === "URGENT" ? "selected" : ""}>Urgente</option>
                </select>
              </div>

              <hr />

              <div class="text-xs text-slate-600 space-y-1">
                <div>Demandeur : <strong>${esc(t.requester ? t.requester.fullName : "")}</strong> (${esc(t.requester ? t.requester.role : "")})</div>
                ${t.booking ? `<div>Réservation : <strong class="text-sky-600">${esc(t.booking.reference)}</strong></div>` : ""}
                <div>Création : ${new Date(t.createdAt).toLocaleDateString("fr-FR")}</div>
              </div>

              <hr />

              <button type="button" class="btn btn-outline w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-xs font-semibold" id="admin-btn-delete">
                Supprimer ce ticket
              </button>
            </div>
          </div>
        </div>
      `;

      root.querySelector("#admin-btn-back").onclick = () => {
        state.selectedTicketId = null;
        state.activeTicketDetail = null;
        renderAdminMain();
      };

      // Assignation
      root.querySelector("#admin-select-assignee").onchange = async (e) => {
        const targetId = e.target.value ? Number(e.target.value) : null;
        try {
          await api.patch(`/api/tickets/${t.id}/assignee`, { assigneeId: targetId });
          showToast("Assignation mise à jour.");
          openAdminDetail(t.id);
          loadStats();
        } catch (err) {
          showToast(err.message || "Erreur lors de l'assignation", true);
        }
      };

      // Statut
      root.querySelector("#admin-select-status").onchange = async (e) => {
        const newStatus = e.target.value;
        try {
          await api.patch(`/api/tickets/${t.id}/status`, { status: newStatus });
          showToast(`Statut mis à jour : ${STATUS_LABELS[newStatus] || newStatus}`);
          openAdminDetail(t.id);
          loadStats();
        } catch (err) {
          showToast(err.message || "Transition interdite", true);
          e.target.value = t.status;
        }
      };

      // Priorité
      root.querySelector("#admin-select-priority").onchange = async (e) => {
        const newPriority = e.target.value;
        try {
          await api.patch(`/api/tickets/${t.id}/priority`, { priority: newPriority });
          showToast(`Priorité mise à jour : ${PRIORITY_LABELS[newPriority] || newPriority}`);
          openAdminDetail(t.id);
          loadStats();
        } catch (err) {
          showToast(err.message || "Erreur modification priorité", true);
          e.target.value = t.priority;
        }
      };

      // Suppression
      root.querySelector("#admin-btn-delete").onclick = () => confirmDeleteTicket(t.id, () => {
        state.selectedTicketId = null;
        state.activeTicketDetail = null;
        loadData();
      });

      // Réponse
      const replyForm = root.querySelector("#admin-reply-form");
      if (replyForm) {
        replyForm.onsubmit = async (e) => {
          e.preventDefault();
          const content = root.querySelector("#admin-reply-text").value.trim();
          const internalNote = root.querySelector("#admin-toggle-internal").checked;
          if (!content) return;

          const submitBtn = root.querySelector("#admin-send-reply");
          submitBtn.disabled = true;

          try {
            await api.post(`/api/tickets/${t.id}/messages`, { content, internalNote });
            showToast(internalNote ? "Note interne enregistrée." : "Réponse envoyée au client.");
            openAdminDetail(t.id);
            loadStats();
          } catch (err) {
            showToast(err.message || "Erreur lors de l'envoi", true);
            submitBtn.disabled = false;
          }
        };
      }
    }

    async function confirmDeleteTicket(ticketId, onSuccess) {
      if (!confirm("Attention : cette action supprimera définitivement le ticket et tous ses messages. Confirmer la suppression ?")) {
        return;
      }
      try {
        await api.delete(`/api/tickets/${ticketId}`);
        showToast("Ticket supprimé avec succès.");
        if (typeof onSuccess === "function") {
          onSuccess();
        } else {
          loadData();
          loadStats();
        }
      } catch (err) {
        showToast(err.message || "Erreur lors de la suppression", true);
      }
    }

    init();
  }

  // =========================================================================
  // API PUBLIQUE DU MODULE TICKETS
  // =========================================================================
  return {
    client: (container) => renderClient(markUi(container), "CLIENT"),
    supplier: (container) => renderClient(markUi(container), "SUPPLIER"),
    agent: (container) => renderAgent(markUi(container)),
    admin: (container) => renderAdmin(markUi(container)),
    createModal: openCreateTicketModal
  };
})();

