/**
 * Atlas Voyage — Client géocodage unifié et robuste (Open-Meteo + repli local API)
 * frontend/js/shared/geocoding.js
 */
(function (root) {
  'use strict';

  const OPEN_METEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
  const TIMEOUT_MS = 5000;
  const memoryCache = new Map();

  function normalizeQuery(q) {
    if (!q) return '';
    return q.trim().toLowerCase();
  }

  function getFromSession(key) {
    try {
      const item = sessionStorage.getItem(`geo_cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  function saveToSession(key, data) {
    try {
      sessionStorage.setItem(`geo_cache_${key}`, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  async function searchOpenMeteo(q, signal, retryCount = 1) {
    const url = `${OPEN_METEO_BASE}?name=${encodeURIComponent(q)}&count=10&language=fr&format=json`;
    let lastError = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const res = await fetchWithTimeout(url, { signal });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !Array.isArray(data.results)) return [];
        return data.results.map(item => ({
          name: item.name,
          country: item.country || 'Maroc',
          country_code: (item.country_code || 'MA').toUpperCase(),
          latitude: item.latitude != null ? Number(item.latitude.toFixed(4)) : null,
          longitude: item.longitude != null ? Number(item.longitude.toFixed(4)) : null,
          admin1: item.admin1 || '',
          source: 'open-meteo',
        }));
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        lastError = err;
        if (attempt < retryCount) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }
    throw lastError;
  }

  async function fallbackLocalCities(q) {
    try {
      if (typeof root.api !== 'undefined' && root.api.get) {
        const list = await root.api.get('/api/cities');
        if (Array.isArray(list)) {
          const lower = q.toLowerCase();
          return list
            .filter(c => c.name && c.name.toLowerCase().includes(lower))
            .map(c => ({
              id: c.id,
              name: c.name,
              country: c.country || 'Maroc',
              country_code: c.countryCode || 'MA',
              latitude: c.latitude != null ? Number(Number(c.latitude).toFixed(4)) : null,
              longitude: c.longitude != null ? Number(Number(c.longitude).toFixed(4)) : null,
              admin1: '',
              has_airport: c.hasAirport,
              source: 'local-api',
            }));
        }
      }
    } catch (err) {
      console.warn('Fallback local /api/cities failed:', err);
    }
    return [];
  }

  let activeAbortController = null;

  async function search(query) {
    const q = (query || '').trim();
    if (q.length < 2) return [];

    const norm = normalizeQuery(q);

    // 1. Memory Cache
    if (memoryCache.has(norm)) {
      return memoryCache.get(norm);
    }

    // 2. SessionStorage Cache
    const sessionCached = getFromSession(norm);
    if (sessionCached) {
      memoryCache.set(norm, sessionCached);
      return sessionCached;
    }

    // 3. Cancel preceding in-flight request
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();

    try {
      const results = await searchOpenMeteo(q, activeAbortController.signal);
      memoryCache.set(norm, results);
      saveToSession(norm, results);
      return results;
    } catch (err) {
      if (err.name === 'AbortError') return [];
      console.warn('Open-Meteo indisponible, bascule sur le référentiel local :', err);
      // 4. Fallback on backend /api/cities
      const localResults = await fallbackLocalCities(q);
      if (localResults.length > 0) {
        memoryCache.set(norm, localResults);
        return localResults;
      }
      throw new Error("L'API géographique est temporairement indisponible et aucune ville locale ne correspond.");
    }
  }

  function bindAutocomplete(inputEl, {
    suggestionsBox,
    spinnerEl,
    onSelect,
    debounceMs = 300,
  }) {
    if (!inputEl) return;
    let timer = null;
    let currentResults = [];

    async function doSearch(text) {
      if (text.length < 2) {
        if (suggestionsBox) {
          suggestionsBox.innerHTML = '';
          suggestionsBox.classList.add('hidden');
        }
        if (spinnerEl) spinnerEl.classList.add('hidden');
        return;
      }

      if (spinnerEl) spinnerEl.classList.remove('hidden');

      try {
        const results = await search(text);
        if (spinnerEl) spinnerEl.classList.add('hidden');
        currentResults = results;

        if (!suggestionsBox) return;

        const esc = root.escapeHtml || (s => String(s || ''));

        if (!results.length) {
          suggestionsBox.innerHTML = `
            <div style="padding:10px 14px;font-size:11px;color:var(--muted);text-align:center;">
              Aucun résultat pour « ${esc(text)} »
            </div>
          `;
          suggestionsBox.classList.remove('hidden');
          return;
        }

        suggestionsBox.innerHTML = results.map((item, idx) => `
          <div class="city-item" data-idx="${idx}" style="cursor:pointer;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);">
            <div class="city-item-main">
              <strong>${esc(item.name)}</strong>
              <span style="font-size:10px;color:var(--muted);margin-left:6px;">${item.admin1 ? esc(item.admin1) + ', ' : ''}${esc(item.country)}</span>
            </div>
            <span class="city-item-badge" style="font-size:9px;padding:2px 6px;border-radius:4px;background:var(--bg-subtle,#e2e8f0);color:var(--text);font-weight:600;">${esc(item.country_code)}</span>
          </div>
        `).join('');

        suggestionsBox.classList.remove('hidden');

        suggestionsBox.querySelectorAll('.city-item').forEach(el => {
          el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const idx = parseInt(el.dataset.idx, 10);
            const chosen = currentResults[idx];
            if (chosen && onSelect) {
              onSelect(chosen);
              suggestionsBox.innerHTML = '';
              suggestionsBox.classList.add('hidden');
            }
          });
        });
      } catch (err) {
        if (spinnerEl) spinnerEl.classList.add('hidden');
        if (!suggestionsBox) return;
        const esc = root.escapeHtml || (s => String(s || ''));
        suggestionsBox.innerHTML = `
          <div style="padding:10px 14px;font-size:11px;color:#dc2626;text-align:center;">
            <span>${esc(err.message)}</span>
            <button type="button" class="btn btn-sm btn-ghost" data-retry-geo style="margin-left:8px;text-decoration:underline;">Réessayer</button>
          </div>
        `;
        suggestionsBox.classList.remove('hidden');
        suggestionsBox.querySelector('[data-retry-geo]')?.addEventListener('click', (e) => {
          e.preventDefault();
          doSearch(text);
        });
      }
    }

    inputEl.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => doSearch(inputEl.value.trim()), debounceMs);
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(() => {
        if (suggestionsBox) suggestionsBox.classList.add('hidden');
      }, 200);
    });
  }

  const GeocodingClient = { search, bindAutocomplete };

  root.GeocodingClient = GeocodingClient;
})(typeof window !== 'undefined' ? window : globalThis);

