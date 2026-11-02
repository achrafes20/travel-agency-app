/**
 * Module Favoris — Gestion côté client des offres favorites.
 * Utilise l'API /api/favorites pour les clients connectés.
 * Pour les invités, redirige vers connexion.html avec paramètre redirect.
 * Pour les autres rôles (ADMIN, AGENT, SUPPLIER), les favoris ne sont pas modifiables.
 */
const Favorites = (() => {
  let favoriteIds = new Set();
  let initialized = false;

  const isClient = () => {
    if (typeof Auth === "undefined") return false;
    const user = Auth.getUser();
    return Boolean(Auth.isLoggedIn() && user && user.role === "CLIENT");
  };

  const isGuest = () => {
    if (typeof Auth === "undefined") return true;
    return !Auth.isLoggedIn();
  };

  const isOtherRole = () => {
    if (typeof Auth === "undefined") return false;
    const user = Auth.getUser();
    return Boolean(Auth.isLoggedIn() && user && user.role !== "CLIENT");
  };

  const emitChange = (detail = {}) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("atlas:favorites-changed", {
        detail: {
          ids: Array.from(favoriteIds),
          count: favoriteIds.size,
          ...detail,
        },
      });
      window.dispatchEvent(event);
    }
  };

  const load = async () => {
    if (!isClient()) {
      favoriteIds.clear();
      initialized = true;
      emitChange();
      return Array.from(favoriteIds);
    }
    try {
      const response = await api.get("/api/favorites/ids");
      const ids = response && Array.isArray(response.offerIds) ? response.offerIds : [];
      favoriteIds = new Set(ids.map(Number));
      initialized = true;
      emitChange();
      return Array.from(favoriteIds);
    } catch (err) {
      console.warn("Impossible de charger les favoris:", err);
      return Array.from(favoriteIds);
    }
  };

  const isFavorite = (offerId) => {
    return favoriteIds.has(Number(offerId));
  };

  const toggle = async (offerId) => {
    const numId = Number(offerId);
    if (!numId) return false;

    if (isGuest()) {
      const currentUrl = window.location.pathname + window.location.search + window.location.hash;
      const redirectParam = encodeURIComponent(currentUrl);
      const targetUrl = (typeof Auth !== "undefined" && Auth.loginUrl)
        ? Auth.loginUrl() + (Auth.loginUrl().includes("?") ? "&" : "?") + `redirect=${redirectParam}`
        : `connexion.html?redirect=${redirectParam}`;
      window.location.href = targetUrl;
      return false;
    }

    if (isOtherRole()) {
      if (typeof toast === "function") {
        toast("Seuls les clients peuvent ajouter des favoris.");
      }
      return false;
    }

    const wasFav = favoriteIds.has(numId);
    // Mise à jour optimiste
    if (wasFav) {
      favoriteIds.delete(numId);
    } else {
      favoriteIds.add(numId);
    }
    emitChange({ offerId: numId, isFavorite: !wasFav });

    try {
      if (wasFav) {
        await api.delete(`/api/favorites/${numId}`);
      } else {
        await api.post(`/api/favorites/${numId}`);
      }
      return !wasFav;
    } catch (err) {
      // Annulation / rollback en cas d'échec
      if (wasFav) {
        favoriteIds.add(numId);
      } else {
        favoriteIds.delete(numId);
      }
      emitChange({ offerId: numId, isFavorite: wasFav, error: err });
      if (typeof toast === "function") {
        toast(err.message || "Erreur lors de la mise à jour des favoris");
      }
      throw err;
    }
  };

  const list = async (page = 0, size = 12) => {
    if (!isClient()) {
      return { content: [], totalElements: 0, totalPages: 0, page: 0, size };
    }
    return api.get(`/api/favorites?page=${page}&size=${size}`);
  };

  const count = () => favoriteIds.size;

  if (typeof window !== "undefined") {
    // Écoute de l'événement de déconnexion pour réinitialiser
    window.addEventListener("atlas:logout", () => {
      favoriteIds.clear();
      initialized = false;
      emitChange();
    });

    // Chargement automatique au démarrage si client connecté
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (isClient()) load();
      });
    } else {
      if (isClient()) load();
    }
  }

  return {
    load,
    isFavorite,
    toggle,
    list,
    count,
    isClient,
    isGuest,
    isOtherRole,
    canFavorite: () => !isOtherRole(),
    getIds: () => Array.from(favoriteIds),
  };
})();

if (typeof window !== "undefined") {
  window.Favorites = Favorites;
}

