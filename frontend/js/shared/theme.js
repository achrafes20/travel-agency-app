/**
 * Atlas Voyage — Gestionnaire de thème
 * Forcé en mode clair uniquement.
 */
(function () {
  const STORAGE_KEY = "atlas_theme";

  function enforceLightTheme() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }

  // Application immédiate avant rendu pour garantir le mode clair
  enforceLightTheme();

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enforceLightTheme);
  }

  window.AtlasTheme = {
    get: function () {
      return "light";
    },
    set: function (_theme) {
      enforceLightTheme();
      window.dispatchEvent(new CustomEvent("atlas-theme-changed", { detail: { theme: "light" } }));
      return "light";
    },
    toggle: function () {
      enforceLightTheme();
      return "light";
    }
  };
})();
