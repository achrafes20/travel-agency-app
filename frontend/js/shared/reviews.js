/**
 * Atlas Voyage - Composant d'Avis et Notations Accessible
 * Gère l'affichage des résumés, de la distribution des notes, de la liste paginée et du dépôt d'avis
 */
// `api` est la constante globale définie par le script classique js/core/api.js (chargé avant ce module).

export class AtlasReviews {
  constructor(containerId, offerId, currentUser = null) {
    this.container = document.getElementById(containerId);
    this.offerId = offerId;
    this.currentUser = currentUser;
    this.currentPage = 0;
    this.currentSort = 'recent';
    this.summary = null;
    this.reviews = [];
    this.totalPages = 1;
    this.userEligibleBookings = [];
  }

  async init() {
    if (!this.container) return;
    await this.loadSummary();
    if (this.currentUser && this.currentUser.role === 'CLIENT') {
      await this.checkEligibility();
    }
    await this.loadReviews();
  }

  async loadSummary() {
    try {
      this.summary = await api.get(`/api/offers/${this.offerId}/reviews/summary`);
    } catch (err) {
      console.warn('Impossible de charger le résumé des avis :', err);
      this.summary = { averageRating: 0, reviewCount: 0, distribution: {}, distributionPercentages: {} };
    }
  }

  async checkEligibility() {
    try {
      // Vérifie si le client a des réservations terminées contenant cette offre
      const bookings = await api.get('/api/bookings');
      if (Array.isArray(bookings)) {
        this.userEligibleBookings = bookings.filter(b =>
          b.status === 'COMPLETED' &&
          b.items && b.items.some(i => i.offerId === this.offerId || (i.offer && i.offer.id === this.offerId))
        );
      }
    } catch (err) {
      console.warn('Vérification éligibilité avis échouée :', err);
    }
  }

  async loadReviews(page = 0, sort = this.currentSort) {
    this.currentPage = page;
    this.currentSort = sort;
    try {
      const res = await api.get(`/api/offers/${this.offerId}/reviews?page=${page}&size=5&sort=${sort}`);
      this.reviews = res.content || [];
      this.totalPages = res.totalPages || 1;
    } catch (err) {
      console.warn('Erreur chargement des avis :', err);
      this.reviews = [];
    }
    this.render();
  }

  render() {
    if (!this.container) return;

    const avg = this.summary.averageRating ? this.summary.averageRating.toFixed(1) : '0.0';
    const total = this.summary.reviewCount || 0;
    const dist = this.summary.distribution || {};
    const pcts = this.summary.distributionPercentages || {};

    const canReview = this.userEligibleBookings.length > 0;

    this.container.innerHTML = `
      <div class="av-reviews-module">
        <header style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--av-space-4); margin-bottom: var(--av-space-6);">
          <div>
            <h2 class="av-heading-3" style="margin-bottom: var(--av-space-1);">Avis des voyageurs</h2>
            <p style="color: var(--av-color-text-subtle); font-size: var(--av-text-sm);">
              ${total} avis vérifiés de clients ayant séjourné ou voyagé
            </p>
          </div>
          ${canReview ? `
            <button type="button" class="av-btn av-btn--primary" id="av-btn-write-review">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Donner mon avis
            </button>
          ` : ''}
        </header>

        <!-- Résumé & Distribution -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--av-space-6); background-color: var(--av-color-surface-subtle); padding: var(--av-space-6); border-radius: var(--av-radius-xl); margin-bottom: var(--av-space-8); border: 1px solid var(--av-color-border-subtle);">
          <!-- Note globale -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border-right: 1px solid var(--av-color-border-subtle); padding-right: var(--av-space-6);">
            <div style="font-size: var(--av-text-5xl); font-weight: var(--av-font-weight-extrabold); color: var(--av-color-brand); line-height: 1;">
              ${avg}
            </div>
            <div class="av-stars" style="color: var(--av-color-accent); margin: var(--av-space-2) 0;" role="img" aria-label="Note ${avg} sur 5">
              ${this.renderStarsSvg(parseFloat(avg))}
            </div>
            <div style="font-size: var(--av-text-sm); color: var(--av-color-text-subtle); font-weight: var(--av-font-weight-medium);">
              Basé sur ${total} avis certifié${total > 1 ? 's' : ''}
            </div>
          </div>

          <!-- Barres de distribution -->
          <div style="display: flex; flex-direction: column; justify-content: center;">
            ${[5, 4, 3, 2, 1].map(star => {
              const count = dist[star] || 0;
              const pct = pcts[star] || 0;
              return `
                <div class="av-rating-bar">
                  <div class="av-rating-bar__label">${star} étoiles</div>
                  <div class="av-rating-bar__track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${count} avis à ${star} étoiles">
                    <div class="av-rating-bar__fill" style="width: ${pct}%;"></div>
                  </div>
                  <div class="av-rating-bar__value">${count}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Formulaire de dépôt d'avis (masqué par défaut) -->
        <div id="av-review-form-container" style="display: none; margin-bottom: var(--av-space-8); background-color: var(--av-color-surface); border: 2px solid var(--av-color-brand); padding: var(--av-space-6); border-radius: var(--av-radius-xl);">
          <h3 class="av-heading-4" style="margin-bottom: var(--av-space-4);">Votre expérience avec cette offre</h3>
          <form id="av-review-form">
            <div class="av-field" style="margin-bottom: var(--av-space-4);">
              <label class="av-field__label" for="av-review-booking">Réservation associée *</label>
              <select class="av-field__select" id="av-review-booking" required>
                ${this.userEligibleBookings.map(b => `
                  <option value="${b.id}">Réservation ${b.reference} (du ${new Date(b.createdAt).toLocaleDateString('fr-FR')})</option>
                `).join('')}
              </select>
            </div>

            <div class="av-field" style="margin-bottom: var(--av-space-4);">
              <label class="av-field__label">Votre note globale *</label>
              <div id="av-star-selector" style="display: flex; gap: var(--av-space-2); cursor: pointer;" role="radiogroup" aria-label="Choisir une note de 1 à 5">
                ${[1, 2, 3, 4, 5].map(s => `
                  <button type="button" class="av-btn av-btn--ghost av-btn--sm av-star-btn" data-star="${s}" aria-label="${s} étoile${s > 1 ? 's' : ''}" style="padding: var(--av-space-1);">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="av-review-rating" name="rating" value="5" required>
            </div>

            <div class="av-field" style="margin-bottom: var(--av-space-4);">
              <label class="av-field__label" for="av-review-title">Titre de votre avis *</label>
              <input type="text" class="av-field__input" id="av-review-title" placeholder="Ex. Séjour inoubliable au riad !" maxlength="120" required>
            </div>

            <div class="av-field" style="margin-bottom: var(--av-space-4);">
              <label class="av-field__label" for="av-review-comment">Votre commentaire détaillé *</label>
              <textarea class="av-field__textarea" id="av-review-comment" rows="4" placeholder="Partagez votre expérience : accueil, propreté, rapport qualité/prix..." maxlength="2000" required></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: var(--av-space-3);">
              <button type="button" class="av-btn av-btn--outline" id="av-btn-cancel-review">Annuler</button>
              <button type="submit" class="av-btn av-btn--primary" id="av-btn-submit-review">Publier mon avis</button>
            </div>
          </form>
        </div>

        <!-- Filtre / Tri des avis -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--av-color-border-subtle); padding-bottom: var(--av-space-3); margin-bottom: var(--av-space-4);">
          <div style="font-weight: var(--av-font-weight-semibold); color: var(--av-color-text);">
            Commentaires (${total})
          </div>
          <div style="display: flex; align-items: center; gap: var(--av-space-2);">
            <label for="av-reviews-sort" style="font-size: var(--av-text-sm); color: var(--av-color-text-subtle);">Trier par :</label>
            <select class="av-field__select" id="av-reviews-sort" style="width: auto; padding: var(--av-space-1) var(--av-space-3); font-size: var(--av-text-sm);">
              <option value="recent" ${this.currentSort === 'recent' ? 'selected' : ''}>Plus récents</option>
              <option value="rating_desc" ${this.currentSort === 'rating_desc' ? 'selected' : ''}>Meilleures notes</option>
              <option value="rating_asc" ${this.currentSort === 'rating_asc' ? 'selected' : ''}>Moins bonnes notes</option>
              <option value="oldest" ${this.currentSort === 'oldest' ? 'selected' : ''}>Plus anciens</option>
            </select>
          </div>
        </div>

        <!-- Liste des avis -->
        <div class="av-reviews-list">
          ${this.reviews.length === 0 ? `
            <div class="av-empty-state" style="padding: var(--av-space-8) 0;">
              <p>Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
            </div>
          ` : this.reviews.map(r => this.renderReviewItem(r)).join('')}
        </div>

        <!-- Pagination -->
        ${this.totalPages > 1 ? `
          <nav class="av-pagination" aria-label="Pagination des avis">
            <button type="button" class="av-pagination-btn" data-page="${this.currentPage - 1}" ${this.currentPage === 0 ? 'disabled' : ''} aria-label="Page précédente">
              &larr;
            </button>
            ${Array.from({ length: this.totalPages }, (_, i) => `
              <button type="button" class="av-pagination-btn ${i === this.currentPage ? 'is-active' : ''}" data-page="${i}" aria-current="${i === this.currentPage ? 'page' : 'false'}">
                ${i + 1}
              </button>
            `).join('')}
            <button type="button" class="av-pagination-btn" data-page="${this.currentPage + 1}" ${this.currentPage >= this.totalPages - 1 ? 'disabled' : ''} aria-label="Page suivante">
              &rarr;
            </button>
          </nav>
        ` : ''}
      </div>
    `;

    this.bindDOMEvents();
  }

  renderReviewItem(r) {
    const initials = (r.clientName || 'Client').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const dateFormatted = r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }) : '';

    return `
      <article class="av-review-card" id="review-${r.id}">
        <div class="av-review-card__header">
          <div style="display: flex; align-items: center; gap: var(--av-space-3);">
            <div style="width: 42px; height: 42px; border-radius: var(--av-radius-full); background-color: var(--av-color-brand-light); color: var(--av-color-brand); display: flex; align-items: center; justify-content: center; font-weight: var(--av-font-weight-bold); font-size: var(--av-text-sm);">
              ${initials}
            </div>
            <div>
              <div style="font-weight: var(--av-font-weight-semibold); color: var(--av-color-text);">
                ${r.clientName || 'Voyageur Atlas'}
              </div>
              <div style="font-size: var(--av-text-xs); color: var(--av-color-text-subtle);">
                ${dateFormatted}
              </div>
            </div>
          </div>
          ${r.verifiedBooking ? `
            <span class="av-badge av-badge--success" title="Séjour ou prestation vérifiée par Atlas Voyage">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Avis certifié
            </span>
          ` : ''}
        </div>

        <div style="display: flex; align-items: center; gap: var(--av-space-2); margin-bottom: var(--av-space-2);">
          <div class="av-stars" style="color: var(--av-color-accent);" role="img" aria-label="Note ${r.rating} sur 5">
            ${this.renderStarsSvg(r.rating)}
          </div>
          <strong style="font-size: var(--av-text-base); color: var(--av-color-text);">${r.title || ''}</strong>
        </div>

        <p style="color: var(--av-color-text); font-size: var(--av-text-sm); line-height: 1.6; margin-bottom: var(--av-space-3); white-space: pre-line;">
          ${r.comment || ''}
        </p>

        <!-- Réponse du fournisseur si présente -->
        ${r.supplierReply ? `
          <div class="av-review-reply">
            <div style="display: flex; align-items: center; gap: var(--av-space-2); margin-bottom: var(--av-space-1);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--av-color-brand)" stroke-width="2" aria-hidden="true"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
              <strong style="font-size: var(--av-text-xs); color: var(--av-color-brand); text-transform: uppercase; letter-spacing: 0.05em;">Réponse de l'établissement</strong>
              <span style="font-size: var(--av-text-xs); color: var(--av-color-text-subtle);">
                ${r.supplierRepliedAt ? new Date(r.supplierRepliedAt).toLocaleDateString('fr-FR') : ''}
              </span>
            </div>
            <p style="font-size: var(--av-text-sm); color: var(--av-color-text); margin: 0; line-height: 1.5;">
              ${r.supplierReply}
            </p>
          </div>
        ` : ''}

        <!-- Actions -->
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: var(--av-space-3); margin-top: var(--av-space-3);">
          ${this.currentUser ? `
            <button type="button" class="av-btn av-btn--ghost av-btn--sm av-report-btn" data-review-id="${r.id}" style="font-size: var(--av-text-xs); color: var(--av-color-text-subtle);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              Signaler
            </button>
          ` : ''}
        </div>
      </article>
    `;
  }

  renderStarsSvg(rating) {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.3 && rating - full <= 0.7;
    let out = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= full) {
        out += `<svg width="16" height="16" viewBox="0 0 24 24" fill="#B45309" stroke="#B45309" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      } else if (i === full + 1 && hasHalf) {
        out += `<svg width="16" height="16" viewBox="0 0 24 24" fill="#B45309" stroke="#B45309" stroke-width="2" aria-hidden="true"><defs><linearGradient id="half-star-${this.offerId}"><stop offset="50%" stop-color="#B45309"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half-star-${this.offerId})"/></svg>`;
      } else {
        out += `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      }
    }
    return out;
  }

  bindDOMEvents() {
    // Sort
    const sortSelect = this.container.querySelector('#av-reviews-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.loadReviews(0, e.target.value);
      });
    }

    // Pagination
    this.container.querySelectorAll('.av-pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page, 10);
        if (!isNaN(page)) this.loadReviews(page, this.currentSort);
      });
    });

    // Write review toggle
    const writeBtn = this.container.querySelector('#av-btn-write-review');
    const formContainer = this.container.querySelector('#av-review-form-container');
    const cancelBtn = this.container.querySelector('#av-btn-cancel-review');

    if (writeBtn && formContainer) {
      writeBtn.addEventListener('click', () => {
        formContainer.style.display = 'block';
        formContainer.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (cancelBtn && formContainer) {
      cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
      });
    }

    // Star selector in form
    const starButtons = this.container.querySelectorAll('.av-star-btn');
    const ratingInput = this.container.querySelector('#av-review-rating');

    const updateStarUI = (val) => {
      starButtons.forEach(btn => {
        const s = parseInt(btn.dataset.star, 10);
        const svg = btn.querySelector('svg');
        if (s <= val) {
          svg.setAttribute('fill', '#B45309');
          svg.setAttribute('stroke', '#B45309');
        } else {
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', '#D1D5DB');
        }
      });
    };

    if (starButtons.length > 0) {
      updateStarUI(5);
      starButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseInt(btn.dataset.star, 10);
          if (ratingInput) ratingInput.value = val;
          updateStarUI(val);
        });
      });
    }

    // Submit review form
    const form = this.container.querySelector('#av-review-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookingId = parseInt(this.container.querySelector('#av-review-booking').value, 10);
        const rating = parseInt(ratingInput.value, 10);
        const title = this.container.querySelector('#av-review-title').value.trim();
        const comment = this.container.querySelector('#av-review-comment').value.trim();

        const submitBtn = this.container.querySelector('#av-btn-submit-review');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Envoi en cours...';
        }

        try {
          const res = await api.post(`/api/offers/${this.offerId}/reviews`, {
            bookingId, rating, title, comment
          });

          if (res.status === 'PENDING') {
            alert("Votre avis a bien été enregistré. Il est en cours de validation par notre équipe de modération.");
          } else {
            alert("Merci ! Votre avis a été publié avec succès.");
          }

          // Recharger
          await this.loadSummary();
          await this.loadReviews(0);
        } catch (err) {
          alert(err.message || "Erreur lors de la publication de votre avis.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publier mon avis';
          }
        }
      });
    }

    // Report review button
    this.container.querySelectorAll('.av-report-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rId = btn.dataset.reviewId;
        if (!confirm("Souhaitez-vous signaler cet avis à l'équipe de modération ?")) return;
        try {
          await api.post(`/api/reviews/${rId}/report`);
          btn.textContent = 'Signalé';
          btn.disabled = true;
        } catch (err) {
          alert(err.message || "Erreur lors du signalement.");
        }
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.AtlasReviews = AtlasReviews;
}

