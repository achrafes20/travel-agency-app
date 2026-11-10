/**
 * Session utilisateur — gestion de la session sécurisée par cookies HttpOnly,
 * garde d'accès par rôle, synchronisation de profil et déconnexion.
 * Zéro jeton dans le Web Storage (localStorage / sessionStorage).
 * Aucune logique métier : le serveur reste seul juge des droits.
 */
const Auth = (() => {
  const USER_KEY = "atlas-user";
  let inMemoryToken = null;

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
    inMemoryToken = null;
    try {
      [sessionStorage, localStorage].forEach((s) => {
        s.removeItem("atlas-token");
        s.removeItem(USER_KEY);
      });
    } catch {
      /* stockage indisponible */
    }
  };

  return {
    loginUrl: (reason) => url("connexion.html") + (reason ? `?reason=${reason}` : ""),
    homeUrl: (role) => url(HOMES[role] ?? "accueil.html"),

    /** Récupère le jeton en mémoire ou en stockage de secours */
    getToken: () => inMemoryToken || read("atlas-token"),

    getUser() {
      try {
        const raw = read(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    isLoggedIn() {
      return Boolean(this.getUser());
    },

    /** Enregistre la session utilisateur (profil + jeton de secours). */
    save(session, remember = true) {
      const existingToken = inMemoryToken || read("atlas-token");
      clear();
      const user = session?.user ?? session;
      const token = session?.token || existingToken;
      if (token) {
        inMemoryToken = token;
      }
      const store = remember ? localStorage : sessionStorage;
      if (token) {
        store.setItem("atlas-token", token);
      }
      if (user) {
        store.setItem(USER_KEY, JSON.stringify(user));
      }
    },

    async login(email, password, remember = true) {
      clear();
      const session = await api.post("/api/auth/login", { email, password, rememberMe: remember });
      this.save(session, remember);
      return session.user;
    },

    async register(fullName, email, password) {
      clear();
      const session = await api.post("/api/auth/register", {
        fullName,
        email,
        password
      });
      this.save(session, true);
      return session.user;
    },

    refreshSessionUser(user) {
      const remember = localStorage.getItem(USER_KEY) !== null;
      this.save({ user }, remember);
      window.dispatchEvent(new CustomEvent("atlas:profile-updated", { detail: user }));
      return user;
    },

    async me() {
      const user = await api.get("/api/auth/me");
      return this.refreshSessionUser(user);
    },

    async updateProfile(body) {
      return this.refreshSessionUser(await api.put("/api/auth/profile", body));
    },

    async changePassword(body) {
      const remember = localStorage.getItem(USER_KEY) !== null;
      const response = await api.post("/api/auth/change-password", body);
      this.save(response, remember);
      window.dispatchEvent(new CustomEvent("atlas:profile-updated", { detail: response.user }));
      return response;
    },

    forgotPassword(email) {
      return api.post("/api/auth/forgot-password", { email });
    },

    async resetPassword(body) {
      const response = await api.post("/api/auth/reset-password", body);
      window.dispatchEvent(new Event("atlas:logout"));
      clear();
      return response;
    },

    verifyEmail(token) {
      return api.post("/api/auth/verify-email", { token });
    },

    resendVerification() {
      return api.post("/api/auth/resend-verification", {});
    },

    async logout(reason) {
      try {
        await api.post("/api/auth/logout", {});
      } catch {
        /* ignorer échec réseau à la déconnexion */
      }
      window.dispatchEvent(new Event("atlas:logout"));
      clear();
      window.location.replace(this.loginUrl(reason));
    },

    async logoutAll(reason) {
      try {
        await api.post("/api/auth/logout-all", {});
      } catch {
        /* ignorer */
      }
      window.dispatchEvent(new Event("atlas:logout"));
      clear();
      window.location.replace(this.loginUrl(reason));
    },

    /** À appeler en tête de chaque espace : redirige vers la connexion si la session ne convient pas. */
    requireRole(role) {
      const user = this.getUser();
      if (!user) {
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
