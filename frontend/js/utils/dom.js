const dom = {
  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  },

  formatCoord(value) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return Number(value).toFixed(4);
  },
};
