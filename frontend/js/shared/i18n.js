/**
 * Atlas Voyage — Module Central d'Internationalisation (i18n)
 * frontend/js/shared/i18n.js
 *
 * Supporte :
 * - 3 langues : Français (fr), Anglais (en), Arabe (ar - RTL complet)
 * - Pseudo-localisation dev (en-XA) activable par ?pseudo=1
 * - Pluriels via Intl.PluralRules (y compris les 6 formes grammaticales arabes)
 * - Interpolation sécurisée avec échappement HTML anti-XSS
 * - Chargement de namespaces à la demande avec mise en cache
 * - Repli automatique en cascade (langue demandée -> fr -> clé brute)
 * - Attributs déclaratifs HTML (data-i18n, data-i18n-attr, data-i18n-html)
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.I18n = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const SUPPORTED_LANGS = ['fr'];
  const DEFAULT_LANG = 'fr';
  const RTL_LANGS = [];

  // Cache mémoire des traductions par langue et namespace : translationsCache[lang][namespace] = { ... }
  const translationsCache = { fr: {}, en: {}, ar: {} };
  const loadedNamespaces = new Set();

  let currentLang = DEFAULT_LANG;
  let isPseudo = false;
  let pluralRulesCache = {};

  // Table de pseudo-localisation pour tester les débordements visuels et détecter les chaînes en dur
  const PSEUDO_MAP = {
    a: 'à', b: 'ƀ', c: 'ç', d: 'đ', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ',
    k: 'ķ', l: 'ł', m: 'ɱ', n: 'ñ', o: 'ó', p: 'þ', q: 'q', r: 'ř', s: 'ś', t: 'ŧ',
    u: 'ú', v: 'ṽ', w: 'ŵ', x: 'x', y: 'ý', z: 'ž',
    A: 'À', B: 'Ɓ', C: 'Ç', D: 'Đ', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Í', J: 'Ĵ',
    K: 'Ķ', L: 'Ł', M: 'Ṃ', N: 'Ñ', O: 'Ó', P: 'Þ', Q: 'Q', R: 'Ř', S: 'Ś', T: 'Ŧ',
    U: 'Ú', V: 'Ṽ', W: 'Ŵ', X: 'X', Y: 'Ý', Z: 'Ž'
  };

  function toPseudo(str) {
    if (typeof str !== 'string') return str;
    let res = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      res += PSEUDO_MAP[ch] || ch;
    }
    // Allongement de 30% et balisage reconnaissable
    return `[!! ${res} !!]`;
  }

  function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Liste blanche stricte de balises autorisées pour data-i18n-html
  function sanitizeSafeHtml(html) {
    if (html == null) return '';
    const temp = document.createElement('div');
    temp.textContent = ''; // vide
    // Parsing sécurisé via DOMParser
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const allowedTags = new Set(['STRONG', 'EM', 'B', 'I', 'A', 'SPAN', 'BR', 'CODE']);

    function cleanNode(node) {
      const childNodes = Array.from(node.childNodes);
      for (const child of childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (!allowedTags.has(child.tagName)) {
            // Remplace l'élément non autorisé par son texte pur
            const textNode = document.createTextNode(child.textContent);
            node.replaceChild(textNode, child);
          } else {
            // Supprimer tous les attributs sauf href et title sur <a>
            const attrs = Array.from(child.attributes);
            for (const attr of attrs) {
              if (child.tagName === 'A' && (attr.name === 'href' || attr.name === 'title' || attr.name === 'target')) {
                if (attr.name === 'href' && attr.value.trim().toLowerCase().startsWith('javascript:')) {
                  child.removeAttribute(attr.name);
                }
              } else if (attr.name === 'class' || attr.name === 'aria-label') {
                // autoriser class et aria-label
              } else {
                child.removeAttribute(attr.name);
              }
            }
            cleanNode(child);
          }
        }
      }
    }

    cleanNode(doc.body);
    return doc.body.innerHTML;
  }

  function getBaseUrl() {
    if (typeof window !== 'undefined' && window.AtlasConfig && window.AtlasConfig.apiBaseUrl) {
      // Déterminer la racine statique du projet
    }
    // Trouver le chemin relatif vers frontend/locales
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/client/') || path.includes('/admin/') || path.includes('/supplier/') || path.includes('/agent/') || path.includes('/design-system/')) {
        return '../locales/';
      }
      return 'locales/';
    }
    return './locales/';
  }

  /**
   * Forcé en français uniquement ('fr')
   */
  function detectInitialLang() {
    try {
      localStorage.setItem('atlas-lang', 'fr');
    } catch (e) {}
    try {
      document.cookie = 'atlas_lang=fr; path=/; max-age=31536000; SameSite=Lax';
    } catch (e) {}
    return DEFAULT_LANG;
  }

  /**
   * Charge un fichier JSON de namespace pour une langue donnée
   */
  async function fetchNamespace(lang, namespace) {
    if (translationsCache[lang] && translationsCache[lang][namespace]) {
      return translationsCache[lang][namespace];
    }
    const base = getBaseUrl();
    const url = `${base}${lang}/${namespace}.json`;

    try {
      const response = await fetch(url, { cache: 'default' });
      if (!response.ok) {
        console.warn(`[i18n] Impossible de charger ${url} (HTTP ${response.status})`);
        return {};
      }
      const data = await response.json();
      if (!translationsCache[lang]) translationsCache[lang] = {};
      translationsCache[lang][namespace] = data;
      return data;
    } catch (err) {
      console.warn(`[i18n] Échec réseau pour ${url}:`, err);
      return {};
    }
  }

  /**
   * Charge un ensemble de namespaces dans la langue active et en français (repli)
   */
  async function loadNamespaces(namespaces) {
    const list = Array.isArray(namespaces) ? namespaces : [namespaces];
    const promises = [];

    for (const ns of list) {
      loadedNamespaces.add(ns);
      // Toujours précharger le français pour le repli garanti
      promises.push(fetchNamespace('fr', ns));
      if (currentLang !== 'fr') {
        promises.push(fetchNamespace(currentLang, ns));
      }
    }
    await Promise.all(promises);
  }

  function getPluralRule(locale) {
    if (!pluralRulesCache[locale]) {
      try {
        pluralRulesCache[locale] = new Intl.PluralRules(locale);
      } catch (e) {
        pluralRulesCache[locale] = new Intl.PluralRules('fr');
      }
    }
    return pluralRulesCache[locale];
  }

  /**
   * Récupère la valeur brute d'une clé (ex: "common.actions.save")
   */
  function getRawTranslation(key, lang) {
    if (!key || typeof key !== 'string') return null;
    const parts = key.split('.');
    const ns = parts[0];
    const rest = parts.slice(1);

    const dict = (translationsCache[lang] && translationsCache[lang][ns]) || null;
    if (!dict) return null;

    let cur = dict;
    for (const p of rest) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        return null;
      }
    }
    return cur;
  }

  /**
   * Traduit une clé avec interpolation sécurisée
   */
  function t(key, params = {}) {
    let raw = getRawTranslation(key, currentLang);
    // Repli sur le français si non trouvé dans la langue courante
    if (raw == null && currentLang !== 'fr') {
      raw = getRawTranslation(key, 'fr');
    }
    // Si toujours absent, retourner la clé pour éviter un blanc
    if (raw == null) {
      return key;
    }

    if (typeof raw !== 'string') {
      return String(raw);
    }

    // Interpolation des paramètres : {name} -> valeur échappée
    let result = raw.replace(/\{(\w+)\}/g, (match, paramName) => {
      if (paramName in params) {
        return escapeHtml(params[paramName]);
      }
      return match;
    });

    if (isPseudo && currentLang === 'en') {
      return toPseudo(result);
    }

    return result;
  }

  /**
   * Gestion avancée des pluriels prenant en charge les 6 formes grammaticales arabes :
   * zero, one, two, few, many, other.
   *
   * Dans le JSON :
   * "travelers": {
   *   "zero": "Aucun voyageur",
   *   "one": "{count} voyageur",
   *   "two": "مسافران",
   *   "few": "{count} voyageurs",
   *   "many": "{count} voyageurs",
   *   "other": "{count} voyageurs"
   * }
   */
  function plural(key, count, params = {}) {
    const num = Number(count) || 0;
    const locale = currentLang === 'ar' ? 'ar-MA' : (currentLang === 'en' ? 'en-GB' : 'fr-MA');
    const rule = getPluralRule(locale);
    const form = rule.select(num); // 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

    // Chercher la clé exacte de forme
    const formKey = `${key}.${form}`;
    let raw = getRawTranslation(formKey, currentLang);

    // Repli sur 'other' si la forme spécifique n'existe pas
    if (raw == null) {
      raw = getRawTranslation(`${key}.other`, currentLang);
    }
    // Repli sur 'fr'
    if (raw == null && currentLang !== 'fr') {
      const frRule = getPluralRule('fr-MA');
      const frForm = frRule.select(num);
      raw = getRawTranslation(`${key}.${frForm}`, 'fr') || getRawTranslation(`${key}.other`, 'fr');
    }

    if (raw == null) {
      return `${key} (${num})`;
    }

    const mergedParams = Object.assign({ count: num }, params);
    let result = String(raw).replace(/\{(\w+)\}/g, (match, paramName) => {
      if (paramName in mergedParams) {
        return escapeHtml(mergedParams[paramName]);
      }
      return match;
    });

    if (isPseudo && currentLang === 'en') {
      return toPseudo(result);
    }

    return result;
  }

  /**
   * Applique les traductions de manière déclarative sur le DOM
   */
  function applyTranslations(rootElement = document) {
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') return;

    // 1. data-i18n : remplace textContent
    const textNodes = rootElement.querySelectorAll('[data-i18n]');
    textNodes.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key);
      }
    });

    // 2. data-i18n-attr : traduit les attributs (ex: "placeholder:common.search;aria-label:common.close")
    const attrNodes = rootElement.querySelectorAll('[data-i18n-attr]');
    attrNodes.forEach((el) => {
      const spec = el.getAttribute('data-i18n-attr');
      if (!spec) return;
      // Syntaxe : attr:key;attr2:key2
      const pairs = spec.split(';');
      for (const pair of pairs) {
        const [attrName, key] = pair.split(':').map((s) => s.trim());
        if (attrName && key) {
          el.setAttribute(attrName, t(key));
        }
      }
    });

    // 3. data-i18n-html : injecte du HTML nettoyé avec liste blanche
    const htmlNodes = rootElement.querySelectorAll('[data-i18n-html]');
    htmlNodes.forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        let raw = getRawTranslation(key, currentLang);
        if (raw == null && currentLang !== 'fr') raw = getRawTranslation(key, 'fr');
        if (raw != null) {
          el.innerHTML = sanitizeSafeHtml(raw);
        }
      }
    });
  }

  /**
   * Change la langue active et met à jour le DOM et la persistance
   */
  async function setLang(newLang) {
    if (!SUPPORTED_LANGS.includes(newLang)) {
      console.warn(`[i18n] Langue non supportée: ${newLang}`);
      return;
    }

    currentLang = newLang;

    // Persistance dans localStorage et cookie
    try {
      localStorage.setItem('atlas-lang', newLang);
    } catch (e) {}

    try {
      document.cookie = `atlas_lang=${encodeURIComponent(newLang)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}

    // Mise à jour attributs <html>
    const isRtl = RTL_LANGS.includes(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

    if (isRtl) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }

    // Recharger tous les namespaces déjà chargés dans la nouvelle langue
    await loadNamespaces(Array.from(loadedNamespaces));

    // Réappliquer sur le document entier
    applyTranslations(document);

    // Synchroniser la préférence si l'utilisateur est connecté
    try {
      if (typeof api !== 'undefined' && typeof api.put === 'function' && window.Auth && window.Auth.isLoggedIn && window.Auth.isLoggedIn()) {
        api.put('/api/users/me/preferences', { preferredLanguage: newLang }).catch(() => {});
      } else if (window.Auth && window.Auth.isLoggedIn && window.Auth.isLoggedIn() && window.Auth.api) {
        window.Auth.api('/api/users/me/preferences', {
          method: 'PUT',
          body: JSON.stringify({ preferredLanguage: newLang })
        }).catch(() => {});
      }
    } catch (e) {}

    // Émettre l'événement global i18n:change
    const event = new CustomEvent('i18n:change', {
      detail: { lang: newLang, dir: isRtl ? 'rtl' : 'ltr' }
    });
    window.dispatchEvent(event);
  }

  /**
   * Initialise le système i18n avec les namespaces critiques
   */
  async function init(options = {}) {
    currentLang = detectInitialLang();

    const isRtl = RTL_LANGS.includes(currentLang);
    document.documentElement.lang = currentLang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    if (isRtl) {
      document.documentElement.classList.add('rtl');
    }

    const defaultNamespaces = ['common', 'nav', 'errors', 'status'];
    const customNamespaces = options.namespaces || [];
    const allNamespaces = Array.from(new Set([...defaultNamespaces, ...customNamespaces]));

    await loadNamespaces(allNamespaces);
    applyTranslations(document);

    return {
      lang: currentLang,
      dir: isRtl ? 'rtl' : 'ltr'
    };
  }

  /**
   * Génère le composant sélecteur de langue accessible
   * Désactivé : seule la langue française est active.
   */
  function renderLanguageSwitcher() {
    return '';
  }

  /**
   * Attache les écouteurs d'événements pour le sélecteur de langue (no-op)
   */
  function bindLanguageSwitcher(container = document) {
    // Aucune action nécessaire : le sélecteur de langue est masqué.
  }

  return {
    init,
    t,
    plural,
    applyTranslations,
    loadNamespaces,
    setLang,
    renderLanguageSwitcher,
    bindLanguageSwitcher,
    has: (key) => getRawTranslation(key, currentLang) != null,
    get lang() { return currentLang; },
    get dir() { return RTL_LANGS.includes(currentLang) ? 'rtl' : 'ltr'; },
    get isRtl() { return RTL_LANGS.includes(currentLang); },
    get supportedLangs() { return [...SUPPORTED_LANGS]; }
  };
});
