/**
 * Atlas Voyage — Utilitaires DOM partagés
 * frontend/js/shared/dom.js
 */
(function (root) {
  'use strict';

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function $(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function $$(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (val == null || val === false) continue;
      if (key === 'className' || key === 'class') {
        element.className = val;
      } else if (key.startsWith('on') && typeof val === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(element.style, val);
      } else if (key === 'dataset' && typeof val === 'object') {
        Object.assign(element.dataset, val);
      } else {
        element.setAttribute(key, val === true ? '' : val);
      }
    }
    for (const child of children.flat(Infinity)) {
      if (child == null) continue;
      if (child instanceof Node) {
        element.appendChild(child);
      } else {
        element.appendChild(document.createTextNode(String(child)));
      }
    }
    return element;
  }

  const DOMUtils = { escapeHtml, $, $$, el };

  root.DOMUtils = DOMUtils;
  if (!root.escapeHtml) root.escapeHtml = escapeHtml;
  if (!root.$) root.$ = $;
  if (!root.$$) root.$$ = $$;
})(typeof window !== 'undefined' ? window : globalThis);

