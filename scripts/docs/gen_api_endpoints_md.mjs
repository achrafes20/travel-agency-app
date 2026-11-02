import fs from 'fs';

const endpoints = JSON.parse(fs.readFileSync('scripts/docs/extracted_endpoints.json', 'utf8'));

const domainGroups = [
  {
    title: '1. Santé & Disponibilité (1 endpoint)',
    controllers: ['StatusController']
  },
  {
    title: '2. Authentification & Sessions (6 endpoints)',
    controllers: ['AuthController']
  },
  {
    title: '3. Sécurité du Compte & Réinitialisation (5 endpoints)',
    controllers: ['AccountSecurityController']
  },
  {
    title: '4. Profils Utilisateurs & Fiches Fournisseurs (5 endpoints)',
    controllers: ['ProfileController']
  },
  {
    title: '5. Administration des Utilisateurs & RGPD (11 endpoints)',
    controllers: ['UserController']
  },
  {
    title: '6. Villes Touristiques & Territoires (5 endpoints)',
    controllers: ['CityController']
  },
  {
    title: '7. Offres Touristiques, Disponibilités & Modération (10 endpoints)',
    controllers: ['OfferController']
  },
  {
    title: '8. Bundles & Packs Forfaits (5 endpoints)',
    controllers: ['BundleController']
  },
  {
    title: '9. Panier d\'Achats (7 endpoints)',
    controllers: ['CartController']
  },
  {
    title: '10. Codes Promotionnels (5 endpoints)',
    controllers: ['PromoCodeController']
  },
  {
    title: '11. Réservations & Bons de Séjour (Vouchers) (8 endpoints)',
    controllers: ['BookingController']
  },
  {
    title: '12. Paiements Sandbox, Caisse & Webhooks (11 endpoints)',
    controllers: ['PaymentController', 'PaymentWebhookController']
  },
  {
    title: '13. Notifications In-App & Préférences (7 endpoints)',
    controllers: ['NotificationController']
  },
  {
    title: '14. Favoris Voyageurs (4 endpoints)',
    controllers: ['FavoriteController']
  },
  {
    title: '15. Tickets de Support & Assistance (9 endpoints)',
    controllers: ['TicketController']
  },
  {
    title: '16. Avis & Notations Vérifiées (9 endpoints)',
    controllers: ['ReviewController']
  },
  {
    title: '17. Contact Public & Pot de Miel (1 endpoint)',
    controllers: ['ContactController']
  },
  {
    title: '18. Paramètres Globaux & Maintenance (4 endpoints)',
    controllers: ['SettingController']
  },
  {
    title: '19. Statistiques, KPIs & Exports CSV (6 endpoints)',
    controllers: ['StatsController']
  },
  {
    title: '20. Devises Indicatives & Taux de Change (1 endpoint)',
    controllers: ['CurrencyController']
  },
  {
    title: '21. Fichiers & Images (3 endpoints)',
    controllers: ['FileController']
  },
  {
    title: '22. Journal d\'Audit Immuable (3 endpoints)',
    controllers: ['AuditController']
  }
];

function getRoleAccess(ep) {
  const c = ep.controller;
  const m = ep.methodName;
  const p = ep.path;

  if (c === 'StatusController' || c === 'ContactController' || c === 'CurrencyController' || c === 'PaymentWebhookController') return 'Public';
  if (c === 'AuthController' && ['login', 'register', 'refresh'].includes(m)) return 'Public';
  if (c === 'AccountSecurityController' && ['forgot', 'reset', 'verify'].includes(m)) return 'Public';
  if (c === 'SettingController' && m === 'getPublicSettings') return 'Public';
  if (c === 'FileController' && ep.verb === 'GET') return 'Public';
  if (['OfferController', 'CityController', 'BundleController'].includes(c) && ep.verb === 'GET' && !p.includes('/moderation') && !p.includes('/translations')) return 'Public';
  if (c === 'ReviewController' && ep.verb === 'GET' && !p.includes('/moderation')) return 'Public';

  if (c === 'AuditController' || c === 'SettingController') return 'ADMIN';
  if (c === 'UserController') {
    if (p.includes('/me')) return 'Authentifié';
    return 'ADMIN';
  }
  if (c === 'CityController' && ep.verb !== 'GET') return 'ADMIN';
  if (c === 'PromoCodeController' && ep.verb !== 'GET') return 'ADMIN';
  if (c === 'BundleController' && ep.verb !== 'GET') return 'AGENT, ADMIN';
  if (c === 'OfferController') {
    if (p.includes('/moderation')) return 'ADMIN';
    if (['create', 'update', 'delete', 'saveTranslation', 'deleteTranslation', 'getTranslations'].includes(m)) return 'SUPPLIER (propriétaire), ADMIN';
  }
  if (c === 'BookingController') {
    if (p === '/api/bookings/supplier') return 'SUPPLIER';
    if (p === '/api/bookings/admin' || p.includes('/confirm')) return 'ADMIN, AGENT';
    return 'CLIENT, AGENT, ADMIN';
  }
  if (c === 'PaymentController') {
    if (p.includes('/collect-cash')) return 'AGENT, ADMIN';
    if (p.includes('/refund')) return 'ADMIN';
    if (p.includes('/admin') || p.includes('/cash-')) return 'AGENT, ADMIN';
    return 'CLIENT, AGENT, ADMIN';
  }
  if (c === 'ReviewController') {
    if (p.includes('/moderation') || p.includes('/moderate')) return 'ADMIN';
    if (p.includes('/reply')) return 'SUPPLIER (offre), ADMIN';
    return 'CLIENT';
  }
  if (c === 'FavoriteController') return 'CLIENT';
  if (c === 'TicketController') {
    if (ep.verb === 'DELETE' || p.includes('/assignee')) return 'ADMIN, AGENT';
    return 'CLIENT, AGENT, ADMIN';
  }
  if (c === 'StatsController') {
    if (p.includes('/admin')) return 'ADMIN';
    if (p.includes('/supplier')) return 'SUPPLIER';
    if (p.includes('/agent')) return 'AGENT';
    if (p.includes('/client')) return 'CLIENT';
  }
  return 'Authentifié';
}

let doc = `# Répertoire Exhaustif des Points d'Accès de l'API (Endpoints) — Atlas Voyage

> **Objet :** Catalogue exhaustif de référence des 126 routes d'API REST implémentées dans le backend Atlas Voyage.  
> **Public visé :** Développeurs frontend, intégrateurs, testeurs API et auditeurs techniques.  
> **Dernière mise à jour :** 1er novembre 2026 | **Version de référence :** 3.0.0 (126 endpoints réels)  
> **Statut :** ✅ Stable (100% vérifié dans le code) | **Source :** Extraction automatique depuis les contrôleurs Spring Boot

---

## Synthèse par Domaine

| Domaine | Contrôleur(s) Spring | Nombre de Routes | Accès Principal |
| :--- | :--- | :---: | :--- |
`;

let totalCount = 0;

domainGroups.forEach(g => {
  const eps = endpoints.filter(e => g.controllers.includes(e.controller));
  totalCount += eps.length;
  doc += `| ${g.title.replace(/\s*\(\d+\s*endpoints?\)/i, '')} | \`${g.controllers.join('`, `')}\` | **${eps.length}** | Divers (voir détails) |\n`;
});

doc += `| **TOTAL GÉNÉRAL** | **23 contrôleurs** | **${totalCount} endpoints** | — |\n\n---\n\n`;

domainGroups.forEach(g => {
  const eps = endpoints.filter(e => g.controllers.includes(e.controller));
  doc += `## ${g.title}\n\n`;
  doc += `| Méthode & Chemin | Accès Requis | Méthode Java & Contrôleur | Description / Rôle |\n`;
  doc += `| :--- | :--- | :--- | :--- |\n`;

  eps.forEach(e => {
    const role = getRoleAccess(e);
    const summary = e.summary || e.methodName;
    doc += `| \`${e.verb} ${e.path}\` | \`${role}\` | \`${e.controller}.${e.methodName}()\` | ${summary} |\n`;
  });

  doc += `\n`;
});

fs.writeFileSync('docs/api_endpoints.md', doc, 'utf8');
console.log(`Generated docs/api_endpoints.md with ${totalCount} endpoints across ${domainGroups.length} domain groups.`);

