/**
 * Atlas Voyage — Utilitaires de formatage localisés et multidevises
 * frontend/js/shared/format.js
 *
 * Supporte :
 * - Devises : MAD (référence), EUR, USD, GBP
 * - Locales : fr-MA, en-GB, ar-MA (avec numérotation latine 'latn' et calendrier grégorien)
 * - Dates et heures via Intl.DateTimeFormat
 * - Nombres via Intl.NumberFormat
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FormatUtils = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // Obtient la locale standardisée pour Intl
  function resolveLocale(loc) {
    const lang = loc || (typeof window !== 'undefined' && window.I18n ? window.I18n.lang : 'fr');
    if (lang === 'ar') {
      // Arabe marocain avec chiffres 0-9 et calendrier grégorien
      return 'ar-MA-u-nu-latn-ca-gregory';
    }
    if (lang === 'en') {
      return 'en-GB';
    }
    return 'fr-MA';
  }

  const numberFormatters = {};
  const dateTimeFormatters = {};

  function getMoneyFormatter(currency, locale, showDecimals) {
    const loc = resolveLocale(locale);
    const cur = currency || 'MAD';
    const key = `${loc}_${cur}_${showDecimals ? 'dec' : 'nodec'}`;

    if (!numberFormatters[key]) {
      numberFormatters[key] = new Intl.NumberFormat(loc, {
        style: 'currency',
        currency: cur,
        minimumFractionDigits: showDecimals || cur !== 'MAD' ? 2 : 0,
        maximumFractionDigits: showDecimals || cur !== 'MAD' ? 2 : 0,
      });
    }
    return numberFormatters[key];
  }

  function formatMoney(amount, currency = 'MAD', locale = null, showDecimals = false) {
    const val = Number(amount) || 0;
    try {
      const formatter = getMoneyFormatter(currency, locale, showDecimals);
      return formatter.format(val);
    } catch (e) {
      return `${val.toFixed(showDecimals ? 2 : 0)} ${currency}`;
    }
  }

  function formatNumber(number, locale = null, options = {}) {
    const loc = resolveLocale(locale);
    try {
      return new Intl.NumberFormat(loc, options).format(number);
    } catch {
      return String(number);
    }
  }

  function formatDate(isoString, locale = null, options = { dateStyle: 'medium' }) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      const loc = resolveLocale(locale);
      return new Intl.DateTimeFormat(loc, options).format(d);
    } catch {
      return '—';
    }
  }

  function formatDateTime(isoString, locale = null) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      const loc = resolveLocale(locale);
      return new Intl.DateTimeFormat(loc, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return '—';
    }
  }

  function formatDuration(hours, locale = null) {
    const h = Number(hours) || 0;
    const lang = locale || (typeof window !== 'undefined' && window.I18n ? window.I18n.lang : 'fr');

    if (lang === 'ar') {
      if (h < 1) return 'أقل من ساعة';
      if (h < 24) return `${h} س`;
      const days = Math.floor(h / 24);
      const rem = h % 24;
      return rem > 0 ? `${days} ي ${rem} س` : `${days} ي`;
    }

    if (lang === 'en') {
      if (h < 1) return '< 1h';
      if (h < 24) return `${h}h`;
      const days = Math.floor(h / 24);
      const rem = h % 24;
      return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
    }

    // Français
    if (h < 1) return '< 1h';
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    const rem = h % 24;
    return rem > 0 ? `${days}j ${rem}h` : `${days}j`;
  }

  return {
    formatMoney,
    formatNumber,
    formatDate,
    formatDateTime,
    formatDuration,
    resolveLocale
  };
});
