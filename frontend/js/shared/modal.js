/**
 * Atlas Voyage — Gestionnaire de fenêtres modales unifié et accessible
 * frontend/js/shared/modal.js
 */
(function (root) {
  'use strict';

  let activeModal = null;
  let previousActiveElement = null;

  function ensureModalRoot() {
    let r = document.querySelector('#modal-root');
    if (!r) {
      r = document.createElement('div');
      r.id = 'modal-root';
      document.body.appendChild(r);
    }
    return r;
  }

  function close() {
    const rootEl = document.querySelector('#modal-root');
    if (rootEl) {
      rootEl.innerHTML = '';
    }
    document.body.classList.remove('modal-open');
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      try { previousActiveElement.focus(); } catch (_) {}
      previousActiveElement = null;
    }
    activeModal = null;
  }

  function open({
    title = '',
    subtitle = '',
    icon = '',
    body = '',
    size = 'md',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    confirmTone = 'primary',
    isDetail = false,
    onConfirm = null,
    onCancel = null,
  }) {
    close();
    previousActiveElement = document.activeElement;

    const rootEl = ensureModalRoot();
    const esc = root.escapeHtml || (s => String(s || ''));

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const modal = document.createElement('div');
    modal.className = `modal modal-${size}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'unified-modal-title');

    const iconHtml = icon ? `<span class="modal-header-icon">${icon}</span>` : '';
    const footerButtons = isDetail
      ? `<button type="button" class="btn btn-ghost" data-close-modal>${esc(cancelText || 'Fermer')}</button>`
      : `
        <button type="button" class="btn btn-ghost" data-close-modal>${esc(cancelText)}</button>
        <button type="button" class="btn btn-${confirmTone}" data-confirm-modal>${esc(confirmText)}</button>
      `;

    modal.innerHTML = `
      <header class="modal-header">
        <div class="modal-title-wrap">
          ${iconHtml}
          <div>
            <h2 id="unified-modal-title">${esc(title)}</h2>
            ${subtitle ? `<p class="modal-subtitle">${esc(subtitle)}</p>` : ''}
          </div>
        </div>
        <button type="button" class="modal-close" data-close-modal aria-label="Fermer la boîte de dialogue">&times;</button>
      </header>
      <div class="modal-body">${body}</div>
      <footer class="modal-footer">${footerButtons}</footer>
    `;

    backdrop.appendChild(modal);
    rootEl.appendChild(backdrop);
    document.body.classList.add('modal-open');

    // Backdrop click dismiss
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        if (onCancel) onCancel();
        close();
      }
    });

    // Close buttons
    modal.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (onCancel) onCancel();
        close();
      });
    });

    // Confirm button
    const confirmBtn = modal.querySelector('[data-confirm-modal]');
    if (confirmBtn && onConfirm) {
      confirmBtn.addEventListener('click', async () => {
        try {
          const res = await onConfirm();
          if (res !== false) close();
        } catch (err) {
          console.error('Modal confirm error:', err);
        }
      });
    }

    // Keyboard accessibility: Escape and Tab trap
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onCancel) onCancel();
        close();
        document.removeEventListener('keydown', handleKeyDown);
      } else if (e.key === 'Tab') {
        const focusables = Array.from(modal.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    // Initial focus on first input or confirm button
    const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea, [data-confirm-modal]');
    if (firstInput) {
      setTimeout(() => {
        try { firstInput.focus(); } catch (_) {}
      }, 50);
    }

    activeModal = { backdrop, modal, close };
    return activeModal;
  }

  function confirm({
    title = 'Confirmation',
    message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
    label = 'Confirmer',
    danger = false,
    onConfirm = null,
  }) {
    const esc = root.escapeHtml || (s => String(s || ''));
    return open({
      title,
      body: `<p style="font-size:13px;line-height:1.5;color:var(--text);">${esc(message)}</p>`,
      size: 'sm',
      confirmText: label,
      confirmTone: danger ? 'danger' : 'primary',
      onConfirm,
    });
  }

  const Modal = { open, close, confirm };

  root.Modal = Modal;
  if (!root.closeModal) root.closeModal = close;
  if (!root.confirmModal) root.confirmModal = confirm;
})(typeof window !== 'undefined' ? window : globalThis);

