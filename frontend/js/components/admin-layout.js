/**
 * Présentation partagée de l'espace administration (sidebar + en-tête).
 */
const AdminLayout = {
  root: "../../",

  navItems: [
    { label: "Dashboard", href: "../../admin/index.html", icon: "chart", external: true },
    { label: "Villes", href: "villes.html", icon: "pin", key: "villes" },
    { label: "Utilisateurs", href: "../../admin/index.html?page=users", icon: "users", external: true },
  ],

  render(activeKey, title, subtitle, contentHtml) {
    const nav = this.navItems
      .map((item) => {
        const active = item.key === activeKey ? "active" : "";
        const cls = `admin-nav-link ${active}`.trim();
        return `<a class="${cls}" href="${item.href}">${this.icon(item.icon)} ${item.label}</a>`;
      })
      .join("");

    return `
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <a class="brand" href="${this.root}accueil.html">
            <img src="${this.root}images/logo.png" alt="Atlas Voyage" class="brand-logo">
          </a>
          <nav>${nav}</nav>
          <a class="back-link" href="${this.root}accueil.html">← Retour au site</a>
        </aside>
        <main class="admin-content">
          <div class="admin-header">
            <div>
              <h1>${dom.escapeHtml(title)}</h1>
              <p>${dom.escapeHtml(subtitle)}</p>
            </div>
            <div class="admin-avatar">AV</div>
          </div>
          ${contentHtml}
        </main>
      </div>`;
  },

  icon(name) {
    const paths = {
      pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      users:
        '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-13a4 4 0 0 1 0 8m6 5v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
      chart: '<path d="M3 20h18M6 17V9m6 8V4m6 13v-6"/>',
    };
    return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.pin}</svg>`;
  },

  mount(activeKey, title, subtitle, contentHtml) {
    document.getElementById("app").innerHTML = this.render(
      activeKey,
      title,
      subtitle,
      contentHtml,
    );
  },
};
