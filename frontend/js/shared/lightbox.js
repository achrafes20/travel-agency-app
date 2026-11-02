/**
 * Atlas Voyage - Visionneuse d'images accessible (Lightbox)
 * Conforme WCAG 2.1 AA : navigation clavier, focus trap, zoom, swipe tactile, aria-modal
 */
export class AtlasLightbox {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.zoomLevel = 1;
    this.isOpen = false;
    this.triggerElement = null;
    this.touchStartX = 0;
    this.touchEndX = 0;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    let existing = document.getElementById('av-lightbox');
    if (existing) {
      this.dialog = existing;
    } else {
      this.dialog = document.createElement('div');
      this.dialog.id = 'av-lightbox';
      this.dialog.className = 'av-lightbox';
      this.dialog.setAttribute('role', 'dialog');
      this.dialog.setAttribute('aria-modal', 'true');
      this.dialog.setAttribute('aria-label', "Visionneuse d'images de l'offre");
      this.dialog.hidden = true;

      this.dialog.innerHTML = `
        <div class="av-lightbox__backdrop" data-action="close"></div>
        <div class="av-lightbox__container">
          <header class="av-lightbox__header">
            <div class="av-lightbox__counter" id="av-lightbox-counter" aria-live="polite"></div>
            <div class="av-lightbox__toolbar">
              <button type="button" class="av-btn av-btn--ghost av-btn--sm" data-action="zoom-in" title="Zoom avant (+)" aria-label="Agrandir l'image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
              <button type="button" class="av-btn av-btn--ghost av-btn--sm" data-action="zoom-out" title="Zoom arrière (-)" aria-label="Réduire l'image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
              <button type="button" class="av-btn av-btn--ghost av-btn--sm" data-action="zoom-reset" title="Taille réelle (0)" aria-label="Réinitialiser le zoom">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
              <button type="button" class="av-btn av-btn--ghost av-btn--sm" data-action="close" title="Fermer (Échap)" aria-label="Fermer la visionneuse">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </header>

          <div class="av-lightbox__content">
            <button type="button" class="av-lightbox__nav av-lightbox__nav--prev" data-action="prev" title="Image précédente (Flèche gauche)" aria-label="Image précédente">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <div class="av-lightbox__viewport">
              <img id="av-lightbox-img" class="av-lightbox__image" src="" alt="" draggable="false">
            </div>

            <button type="button" class="av-lightbox__nav av-lightbox__nav--next" data-action="next" title="Image suivante (Flèche droite)" aria-label="Image suivante">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <footer class="av-lightbox__footer">
            <p id="av-lightbox-caption" class="av-lightbox__caption"></p>
          </footer>
        </div>
      `;
      document.body.appendChild(this.dialog);
    }

    this.imgEl = document.getElementById('av-lightbox-img');
    this.counterEl = document.getElementById('av-lightbox-counter');
    this.captionEl = document.getElementById('av-lightbox-caption');
    this.closeBtn = this.dialog.querySelector('[data-action="close"]');
  }

  bindEvents() {
    this.dialog.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'close') this.close();
      else if (action === 'prev') this.prev();
      else if (action === 'next') this.next();
      else if (action === 'zoom-in') this.zoom(0.25);
      else if (action === 'zoom-out') this.zoom(-0.25);
      else if (action === 'zoom-reset') this.resetZoom();
    });

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        this.zoom(0.25);
      } else if (e.key === '-') {
        e.preventDefault();
        this.zoom(-0.25);
      } else if (e.key === '0') {
        e.preventDefault();
        this.resetZoom();
      } else if (e.key === 'Tab') {
        this.trapFocus(e);
      }
    });

    // Touch Swipe
    const viewport = this.dialog.querySelector('.av-lightbox__viewport');
    if (viewport) {
      viewport.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        const diff = this.touchEndX - this.touchStartX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) this.prev();
          else this.next();
        }
      }, { passive: true });
    }
  }

  open(images, startIndex = 0, triggerEl = null) {
    if (!images || images.length === 0) return;
    this.images = images.map(img => typeof img === 'string' ? { src: img, alt: '' } : img);
    this.currentIndex = Math.max(0, Math.min(startIndex, this.images.length - 1));
    this.triggerElement = triggerEl || document.activeElement;
    this.isOpen = true;
    this.dialog.hidden = false;
    document.body.style.overflow = 'hidden';

    this.updateImage();
    this.resetZoom();

    setTimeout(() => {
      const focusable = this.dialog.querySelector('button, [tabindex="0"]');
      if (focusable) focusable.focus();
    }, 50);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dialog.hidden = true;
    document.body.style.overflow = '';
    this.resetZoom();

    if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
      this.triggerElement.focus();
    }
  }

  prev() {
    if (this.images.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.resetZoom();
    this.updateImage();
  }

  next() {
    if (this.images.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.resetZoom();
    this.updateImage();
  }

  zoom(delta) {
    this.zoomLevel = Math.max(0.5, Math.min(3.0, this.zoomLevel + delta));
    if (this.imgEl) {
      this.imgEl.style.transform = `scale(${this.zoomLevel})`;
    }
  }

  resetZoom() {
    this.zoomLevel = 1;
    if (this.imgEl) {
      this.imgEl.style.transform = 'scale(1)';
    }
  }

  updateImage() {
    const current = this.images[this.currentIndex];
    if (!current) return;
    this.imgEl.src = current.src;
    this.imgEl.alt = current.alt || `Photo ${this.currentIndex + 1} de l'offre`;
    this.counterEl.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    this.captionEl.textContent = current.caption || current.alt || '';

    const prevBtn = this.dialog.querySelector('.av-lightbox__nav--prev');
    const nextBtn = this.dialog.querySelector('.av-lightbox__nav--next');
    if (this.images.length <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    } else {
      if (prevBtn) prevBtn.style.display = '';
      if (nextBtn) nextBtn.style.display = '';
    }
  }

  trapFocus(e) {
    const focusable = Array.from(this.dialog.querySelectorAll(
      'button:not([disabled]), [tabindex="0"], a[href]'
    )).filter(el => el.offsetParent !== null);

    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

// Instance globale si importé comme script
if (typeof window !== 'undefined') {
  window.AtlasLightbox = AtlasLightbox;
}

