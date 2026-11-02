/**
 * Atlas Voyage — Gestionnaire de toasts unifié et accessible
 * frontend/js/shared/toast.js
 */
(function (root) {
  'use strict';

  let container = null;

  function ensureContainer() {
    if (container && document.body.contains(container)) return container;
    container = document.querySelector('#toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'unified-toast-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  function getToneIcon(tone) {
    switch (tone) {
      case 'success':
      case 'green':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      case 'error':
      case 'danger':
      case 'red':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      case 'warning':
      case 'amber':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      default:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
  }

  function show(title, message = '', tone = 'info', duration = 4000) {
    if (typeof tone === 'number') {
      duration = tone;
      tone = 'info';
    }
    const c = ensureContainer();
    const toast = document.createElement('div');
    const normalizedTone = ['success', 'error', 'danger', 'warning', 'info'].includes(tone) ? tone : 'info';
    toast.className = `unified-toast toast-${normalizedTone}`;
    toast.setAttribute('role', normalizedTone === 'error' ? 'alert' : 'status');

    const iconHtml = getToneIcon(normalizedTone);
    const esc = root.escapeHtml || (s => String(s || ''));

    toast.innerHTML = `
      <div class="toast-icon">${iconHtml}</div>
      <div class="toast-content">
        <strong class="toast-title">${esc(title)}</strong>
        ${message ? `<p class="toast-message">${esc(message)}</p>` : ''}
      </div>
      <button type="button" class="toast-close" aria-label="Fermer la notification">&times;</button>
    `;

    function dismiss() {
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
      setTimeout(() => toast.remove(), 300);
    }

    toast.querySelector('.toast-close').addEventListener('click', dismiss);

    c.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return toast;
  }

  const Toast = {
    show,
    success: (title, msg, dur) => show(title, msg, 'success', dur),
    error: (title, msg, dur) => show(title, msg, 'error', dur || 5000),
    warning: (title, msg, dur) => show(title, msg, 'warning', dur),
    info: (title, msg, dur) => show(title, msg, 'info', dur),
  };

  root.Toast = Toast;
  root.showToast = (title, message, tone) => Toast.show(title, message, tone);
  root.toast = (title, message, tone) => Toast.show(title, message, tone);
})(typeof window !== 'undefined' ? window : globalThis);

