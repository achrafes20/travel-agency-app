/**
 * Couche d'accès HTTP — aucune logique métier, uniquement les appels fetch().
 */
const api = {
  baseUrl() {
    return window.APP_CONFIG?.apiBase ?? "http://localhost:8080";
  },

  async request(path, options = {}) {
    const token = typeof Auth !== "undefined" ? Auth.getToken() : null;
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl()}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && token) {
      // jeton expiré ou compte désactivé : retour à l'écran de connexion
      Auth.logout();
    }

    if (!response.ok) {
      let message = `Erreur HTTP ${response.status}`;
      try {
        const payload = await response.json();
        if (payload.message) message = payload.message;
      } catch {
        /* corps non JSON */
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  },

  get(path) {
    return this.request(path);
  },

  post(path, body) {
    return this.request(path, { method: "POST", body: JSON.stringify(body) });
  },

  put(path, body) {
    return this.request(path, { method: "PUT", body: JSON.stringify(body) });
  },

  delete(path) {
    return this.request(path, { method: "DELETE" });
  },
};
