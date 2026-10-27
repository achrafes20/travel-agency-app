/**
 * Session utilisateur (JWT) — stockage du jeton, garde d'accès par rôle, déconnexion.
 * Aucune logique métier : le serveur reste seul juge des droits.
 */
const Auth = (() => {
  const TOKEN_KEY = "atlas-token";
  const USER_KEY = "atlas-user";
  // Racine du dossier frontend, déduite de l'emplacement de ce script (js/core/auth.js).
  const base = document.currentScript ? document.currentScript.src : window.location.href;
  const url = (path) => new URL(`../../${path}`, base).href;

  const HOMES = {
    ADMIN: "admin/index.html",
    SUPPLIER: "supplier/index.html",
    AGENT: "agent/index.html",
    CLIENT: "client/index.html?page=dashboard",
  };

  const read = (key) => {
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const clear = () => {
    try {
      [sessionStorage, localStorage].forEach((s) => {
        s.removeItem(TOKEN_KEY);
        s.removeItem(USER_KEY);
      });
    } catch {
      /* stockage indisponible */
    }
  };

  return {
    loginUrl: (reason) => url("connexion.html") + (reason ? `?reason=${reason}` : ""),
    homeUrl: (role) => url(HOMES[role] ?? "accueil.html"),

    getToken: () => read(TOKEN_KEY),

    getUser() {
      try {
        return JSON.parse(read(USER_KEY));
      } catch {
        return null;
      }
    },

    isLoggedIn() {
      return Boolean(this.getToken() && this.getUser());
    },

    /** Enregistre la session ; « remember » = false la limite à l'onglet courant. */
    save({ token, user }, remember = true) {
      clear();
      const store = remember ? localStorage : sessionStorage;
      store.setItem(TOKEN_KEY, token);
      store.setItem(USER_KEY, JSON.stringify(user));
    },

    async login(email, password, remember = true) {
      clear();
      const session = await api.post("/api/auth/login", { email, password });
      this.save(session, remember);
      return session.user;
    },

    async register(fullName, email, password) {
      clear();
      const session = await api.post("/api/auth/register", { fullName, email, password });
      this.save(session, true);
      return session.user;
    },

    logout() {
      clear();
      window.location.replace(this.loginUrl());
    },

    /** À appeler en tête de chaque espace : redirige vers la connexion si la session ne convient pas. */
    requireRole(role) {
      const user = this.getUser();
      if (!this.getToken() || !user) {
        window.location.replace(this.loginUrl());
        return null;
      }
      if (user.role !== role) {
        window.location.replace(this.loginUrl("role"));
        return null;
      }
      return user;
    },
  };
})();
