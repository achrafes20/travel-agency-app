/**
 * Couche d'accès HTTP — gestion des appels fetch() avec support complet des cookies HttpOnly,
 * jeton CSRF double-submit (XSRF-TOKEN / X-XSRF-TOKEN), et rafraîchissement transparent des sessions (401 -> /api/auth/refresh).
 */
const api = (() => {
  let isRefreshing = false;
  let refreshQueue = [];

  function getCookie(name) {
    if (typeof document === "undefined" || !document.cookie) return null;
    const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  return {
    baseUrl() {
      return window.APP_CONFIG?.apiBase ?? "http://localhost:8080";
    },

    async request(path, options = {}) {
      const method = (options.method ?? "GET").toUpperCase();
      const token = typeof Auth !== "undefined" ? Auth.getToken() : null;
      const xsrfToken = getCookie("XSRF-TOKEN");

      const headers = {
        Accept: "application/json",
        ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(!["GET", "HEAD", "OPTIONS"].includes(method) && xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        ...options.headers,
      };

      const fetchOptions = {
        ...options,
        method,
        headers,
        credentials: "include", // Envoi systématique des cookies d'authentification HttpOnly
      };

      let response;
      try {
        response = await fetch(`${this.baseUrl()}${path}`, fetchOptions);
      } catch (networkError) {
        throw networkError;
      }

      // Gestion transparente du 401 (expiration de l'access token -> renouvellement silencieux par refresh token)
      if (response.status === 401 && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/refresh") && !path.startsWith("/api/auth/logout")) {
        if (isRefreshing) {
          // Si un rafraîchissement est déjà en cours, mettre en attente la requête
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject, path, options });
          });
        }

        isRefreshing = true;
        try {
          const latestXsrf = getCookie("XSRF-TOKEN");
          const refreshRes = await fetch(`${this.baseUrl()}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: {
              Accept: "application/json",
              ...(latestXsrf ? { "X-XSRF-TOKEN": latestXsrf } : {}),
            },
          });

          if (!refreshRes.ok) {
            throw new Error("Session expirée");
          }

          const refreshData = await refreshRes.json();
          if (typeof Auth !== "undefined") {
            if (refreshData.token) {
              const remember = localStorage.getItem("atlas-user") !== null;
              Auth.save(refreshData, remember);
            } else if (refreshData.user) {
              Auth.refreshSessionUser(refreshData.user);
            }
          }

          const queued = refreshQueue;
          refreshQueue = [];
          isRefreshing = false;

          queued.forEach(({ resolve, reject, path: qPath, options: qOptions }) => {
            this.request(qPath, qOptions).then(resolve).catch(reject);
          });

          // Réessayer la requête initiale
          return this.request(path, options);
        } catch (refreshErr) {
          const queued = refreshQueue;
          refreshQueue = [];
          isRefreshing = false;
          queued.forEach(({ reject }) => reject(refreshErr));

          if (typeof Auth !== "undefined") {
            Auth.logout("expired");
          }
          throw refreshErr;
        }
      }

      if (!response.ok) {
        let message = `Erreur HTTP ${response.status}`, code = null;
        try {
          const payload = await response.json();
          code = payload.code || null;
          if (payload.message) message = payload.message;
          if (Array.isArray(payload.details) && payload.details.length) {
            message += " : " + payload.details.map(d => [d.field, d.message].filter(Boolean).join(" : ")).join("; ");
          }
        } catch {
          /* corps non JSON */
        }
        const error = new Error(message);
        error.code = code;
        error.status = response.status;
        error.retryAfter = Number(response.headers.get("Retry-After") || 0);
        if (response.status === 429 && error.retryAfter) {
          error.message += " — réessayez dans " + error.retryAfter + " s";
        }
        throw error;
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    },

    get(path, options = {}) {
      return this.request(path, { ...options, method: "GET" });
    },

    post(path, body, options = {}) {
      return this.request(path, { ...options, method: "POST", body: JSON.stringify(body) });
    },

    put(path, body, options = {}) {
      return this.request(path, { ...options, method: "PUT", body: JSON.stringify(body) });
    },

    patch(path, body, options = {}) {
      return this.request(path, { ...options, method: "PATCH", body: JSON.stringify(body) });
    },

    delete(path, options = {}) {
      return this.request(path, { ...options, method: "DELETE" });
    },

    multipart(path, form, options = {}) {
      return this.request(path, { ...options, method: "POST", body: form });
    },
  };
})();
