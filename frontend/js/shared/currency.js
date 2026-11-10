/**
 * Atlas Voyage — Module de Gestion des Devises et Taux Indicatifs
 * frontend/js/shared/currency.js
 *
 * RÈGLES STRICTES :
 * - La devise de référence et de facturation légale reste TOUJOURS le MAD.
 * - Les conversions en EUR, USD, GBP sont STRICTEMENT INDICATIVES.
 * - Tout montant converti s'accompagne d'une mention claire.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AtlasCurrency = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const SUPPORTED_CURRENCIES = [
    { code: 'MAD', symbol: 'MAD', name: 'Dirham Marocain (Référence)' },
    { code: 'EUR', symbol: '€', name: 'Euro (Indicatif)' },
    { code: 'USD', symbol: '$', name: 'Dollar US (Indicatif)' },
    { code: 'GBP', symbol: '£', name: 'Livre Sterling (Indicatif)' }
  ];

  // Taux de secours par défaut si l'API est injoignable (1 MAD = X devise)
  const FALLBACK_RATES = {
    MAD: 1.0,
    EUR: 0.092,
    USD: 0.100,
    GBP: 0.078
  };

  let rates = { ...FALLBACK_RATES };
  let lastUpdated = '2026-11-01';
  let activeCurrency = 'MAD';

  function getStoredCurrency() {
    try {
      const stored = localStorage.getItem('atlas-cur');
      if (stored && SUPPORTED_CURRENCIES.some((c) => c.code === stored)) {
        return stored;
      }
    } catch (e) {}
    return 'MAD';
  }

  async function fetchRates() {
    try {
      const base = (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.apiBase)
        || (typeof api !== 'undefined' && typeof api.baseUrl === 'function' ? api.baseUrl() : 'http://localhost:8080');
      const res = await fetch(`${base}/api/currencies/rates`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          rates = Object.assign({}, FALLBACK_RATES, data.rates);
          if (data.updatedAt) lastUpdated = data.updatedAt;
        }
      }
    } catch (err) {
      // Utilisation résiliente des taux de repli
    }
  }

  function init() {
    activeCurrency = getStoredCurrency();
    fetchRates();
  }

  function setCurrency(cur) {
    if (!SUPPORTED_CURRENCIES.some((c) => c.code === cur)) return;
    activeCurrency = cur;
    try {
      localStorage.setItem('atlas-cur', cur);
    } catch (e) {}

    // Synchroniser avec les préférences utilisateur si connecté
    try {
      if (typeof api !== 'undefined' && typeof api.put === 'function' && window.Auth && window.Auth.isLoggedIn && window.Auth.isLoggedIn()) {
        api.put('/api/users/me/preferences', { preferredCurrency: cur }).catch(() => {});
      } else if (window.Auth && window.Auth.isLoggedIn && window.Auth.isLoggedIn() && window.Auth.api) {
        window.Auth.api('/api/users/me/preferences', {
          method: 'PUT',
          body: JSON.stringify({ preferredCurrency: cur })
        }).catch(() => {});
      }
    } catch (e) {}

    const event = new CustomEvent('currency:change', {
      detail: { currency: cur, rate: rates[cur] || 1.0 }
    });
    window.dispatchEvent(event);
  }

  function convertFromMad(amountMad, targetCur = activeCurrency) {
    const val = Number(amountMad) || 0;
    const rate = rates[targetCur] || 1.0;
    return val * rate;
  }

  /**
   * Formate un prix en MAD ou dans la devise sélectionnée avec indication
   * Ex: "1 200 MAD" ou "110.40 € (indicatif)"
   */
  function formatPrice(amountMad, targetCur = activeCurrency, options = {}) {
    const val = Number(amountMad) || 0;
    const target = targetCur || activeCurrency;
    const converted = convertFromMad(val, target);
    const locale = options.locale || (window.I18n ? window.I18n.lang : 'fr');

    if (window.FormatUtils) {
      const formatted = window.FormatUtils.formatMoney(converted, target, locale, target !== 'MAD');
      if (target === 'MAD' || options.hideDisclaimer) {
        return formatted;
      }
      return `${formatted} <span class="av-currency-indicative" title="Montant indicatif. Paiement prélevé en MAD.">*</span>`;
    }

    return `${converted.toFixed(target === 'MAD' ? 0 : 2)} ${target}`;
  }

  function renderCurrencySwitcher() {
    const curObj = SUPPORTED_CURRENCIES.find((c) => c.code === activeCurrency) || SUPPORTED_CURRENCIES[0];
    const labelHtml = curObj.symbol === curObj.code
      ? `<span class="av-cur-code">${curObj.code}</span>`
      : `<span class="av-cur-symbol">${curObj.symbol}</span> <span class="av-cur-code">${curObj.code}</span>`;

    // WCAG 2.5.3 : le nom accessible doit commencer par le texte visible du bouton (ex. « € EUR »).
    const visibleLabel = curObj.symbol === curObj.code ? curObj.code : `${curObj.symbol} ${curObj.code}`;

    return `
      <div class="av-currency-switcher" id="av-currency-switcher">
        <button type="button" class="av-cur-btn" aria-haspopup="true" aria-expanded="false"
                aria-label="${visibleLabel}, sélectionner la devise d'affichage">
          ${labelHtml}
          <svg class="av-icon-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        <div class="av-cur-menu" role="menu" hidden>
          <div class="av-cur-header">
            <strong>Devises d'affichage</strong>
            <p>Paiement final obligatoire en MAD</p>
          </div>
          <div class="av-cur-list">
            ${SUPPORTED_CURRENCIES.map((c) => `
              <button type="button" role="menuitem" class="av-cur-item ${c.code === activeCurrency ? 'is-active' : ''}" 
                      data-currency-code="${c.code}" ${c.code === activeCurrency ? 'aria-current="true"' : ''}>
                <span class="av-cur-badge">${c.symbol}</span>
                <span class="av-cur-name">${c.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function bindCurrencySwitcher(container = document) {
    const switchers = container.querySelectorAll('.av-currency-switcher');
    switchers.forEach((sw) => {
      const btn = sw.querySelector('.av-cur-btn');
      const menu = sw.querySelector('.av-cur-menu');
      if (!btn || !menu) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = menu.hidden;
        document.querySelectorAll('.av-lang-menu, .av-cur-menu').forEach((m) => {
          if (m !== menu) {
            m.hidden = true;
            const otherBtn = m.parentElement?.querySelector('button');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });
        menu.hidden = !willOpen;
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });

      menu.querySelectorAll('.av-cur-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetCur = item.getAttribute('data-currency-code');
          menu.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
          if (targetCur && targetCur !== activeCurrency) {
            setCurrency(targetCur);
          }
        });
      });
    });

    document.addEventListener('click', () => {
      switchers.forEach((sw) => {
        const btn = sw.querySelector('.av-cur-btn');
        const menu = sw.querySelector('.av-cur-menu');
        if (menu && !menu.hidden) {
          menu.hidden = true;
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        switchers.forEach((sw) => {
          const btn = sw.querySelector('.av-cur-btn');
          const menu = sw.querySelector('.av-cur-menu');
          if (menu && !menu.hidden) {
            menu.hidden = true;
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
  }

  init();

  return {
    init,
    setCurrency,
    convertFromMad,
    formatPrice,
    renderCurrencySwitcher,
    bindCurrencySwitcher,
    get currency() { return activeCurrency; },
    get rates() { return { ...rates }; },
    get lastUpdated() { return lastUpdated; },
    get supportedCurrencies() { return [...SUPPORTED_CURRENCIES]; }
  };
});
