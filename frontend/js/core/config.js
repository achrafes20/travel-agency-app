window.APP_CONFIG = {
  apiBase: window.APP_CONFIG?.apiBase || (
    typeof window !== "undefined" && window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8080"
      : "http://localhost:8080"
  ),
};
