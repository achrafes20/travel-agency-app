/**
 * Atlas Voyage — Composants d'états d'interface partagés
 * frontend/js/shared/states.js
 */
(function (root) {
  'use strict';

  function renderSkeleton(type = 'rows', count = 3) {
    const items = [];
    if (type === 'table') {
      for (let i = 0; i < count; i++) {
        items.push(`
          <tr class="skeleton-row" aria-hidden="true">
            <td><div class="skeleton-shimmer" style="height:16px;width:75%;border-radius:4px;"></div></td>
            <td><div class="skeleton-shimmer" style="height:16px;width:50%;border-radius:4px;"></div></td>
            <td><div class="skeleton-shimmer" style="height:16px;width:30%;border-radius:4px;"></div></td>
            <td><div class="skeleton-shimmer" style="height:16px;width:40%;border-radius:4px;"></div></td>
          </tr>
        `);
      }
      return items.join('');
    }

    if (type === 'cards') {
      for (let i = 0; i < count; i++) {
        items.push(`
          <div class="card skeleton-card" aria-hidden="true">
            <div class="skeleton-shimmer" style="height:140px;width:100%;border-radius:8px 8px 0 0;margin-bottom:12px;"></div>
            <div class="skeleton-shimmer" style="height:18px;width:70%;border-radius:4px;margin-bottom:8px;"></div>
            <div class="skeleton-shimmer" style="height:14px;width:45%;border-radius:4px;margin-bottom:16px;"></div>
            <div class="skeleton-shimmer" style="height:28px;width:100%;border-radius:6px;"></div>
          </div>
        `);
      }
      return `<div class="skeleton-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:16px;">${items.join('')}</div>`;
    }

    // Default rows
    for (let i = 0; i < count; i++) {
      items.push(`
        <div class="skeleton-row-block" aria-hidden="true" style="padding:12px;border-bottom:1px solid var(--border);">
          <div class="skeleton-shimmer" style="height:16px;width:60%;border-radius:4px;margin-bottom:6px;"></div>
          <div class="skeleton-shimmer" style="height:12px;width:40%;border-radius:4px;"></div>
        </div>
      `);
    }
    return items.join('');
  }

  function renderEmptyState({
    icon = '',
    title = 'Aucun élément',
    message = 'Il n’y a aucune donnée à afficher pour le moment.',
    actionLabel = '',
    actionAttr = '',
  }) {
    const esc = root.escapeHtml || (s => String(s || ''));
    const actionBtn = actionLabel
      ? `<button type="button" class="btn btn-primary" ${actionAttr} style="margin-top:14px;">${esc(actionLabel)}</button>`
      : '';
    return `
      <div class="empty-state" role="status">
        ${icon ? `<span class="round-icon">${icon}</span>` : ''}
        <h2>${esc(title)}</h2>
        <p>${esc(message)}</p>
        ${actionBtn}
      </div>
    `;
  }

  function renderErrorBanner(message = 'Une erreur est survenue lors du chargement des données.', retryAction = null) {
    const esc = root.escapeHtml || (s => String(s || ''));
    const retryBtn = retryAction
      ? `<button type="button" class="btn btn-sm btn-outline" ${retryAction} style="margin-left:auto;">Réessayer</button>`
      : '';
    return `
      <div class="api-error-banner" role="alert" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:8px;background:#fef2f2;border:1px solid #fee2e2;color:#991b1b;margin-bottom:16px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span style="font-size:12px;font-weight:500;">${esc(message)}</span>
        ${retryBtn}
      </div>
    `;
  }

  const UIStates = { renderSkeleton, renderEmptyState, renderErrorBanner };

  root.UIStates = UIStates;
  if (!root.apiErrorBanner) root.apiErrorBanner = renderErrorBanner;
})(typeof window !== 'undefined' ? window : globalThis);

