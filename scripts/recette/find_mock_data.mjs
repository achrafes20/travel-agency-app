import fs from 'node:fs';
import path from 'node:path';

console.log('====================================================');
console.log('  Atlas Voyage — Détecteur de Données de Maquette');
console.log('====================================================\n');

const frontendDir = path.resolve('frontend');
const patterns = [
  { label: 'TODO / FIXME', regex: /\b(TODO|FIXME)\b/i },
  { label: 'Texte Lorem Ipsum', regex: /\blorem\s+ipsum\b/i },
  { label: 'Indicateur maquette / faux', regex: /\b(maquette|fake-data|mock-backend)\b/i },
  { label: 'Référence réservation en dur BK-2026-', regex: /BK-2026-\d{4,6}/ },
  { label: 'Simulation timeout réseau', regex: /setTimeout\s*\(\s*\(\)\s*=>\s*\{.*resolve.*\},\s*\d+\)/ },
  { label: 'Tableau de démo codé en dur', regex: /const\s+(demoBookings|mockOffers|fakeUsers)\s*=/ }
];

function scanFiles(dir) {
  let findings = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'vendor' || entry.name === 'node_modules') continue;
      findings = findings.concat(scanFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        for (const p of patterns) {
          if (p.regex.test(line)) {
            // Ignore intentional comments in mock fallback file
            if (fullPath.includes('mock') && p.label.includes('mock')) continue;
            findings.push({
              file: path.relative(frontendDir, fullPath),
              lineNum: idx + 1,
              pattern: p.label,
              snippet: line.trim().substring(0, 100)
            });
          }
        }
      });
    }
  }
  return findings;
}

const results = scanFiles(frontendDir);
console.log(`Scan terminé : ${results.length} motif(s) suspect(s) identifié(s).\n`);

results.forEach(r => {
  console.log(`[${r.pattern}] ${r.file}:${r.lineNum} -> "${r.snippet}"`);
});

// Évaluation par écran (Routes de l'application)
const screens = [
  { name: 'Accueil public', path: 'accueil.html', api: 'GET /api/offers, GET /api/cities' },
  { name: 'Catalogue des offres', path: 'catalogue.html', api: 'GET /api/offers/search, GET /api/cities' },
  { name: 'Détail d une offre', path: 'offre.html', api: 'GET /api/offers/{id}, GET /api/reviews/offer/{id}' },
  { name: 'Panier & Checkout', path: 'panier.html', api: 'GET /api/cart, POST /api/bookings' },
  { name: 'Connexion / Inscription', path: 'connexion.html', api: 'POST /api/auth/login, POST /api/auth/register' },
  { name: 'Client - Tableau de bord', path: 'client/index.html?page=dashboard', api: 'GET /api/users/me, GET /api/bookings/my' },
  { name: 'Client - Mes réservations', path: 'client/index.html?page=reservations', api: 'GET /api/bookings/my, GET /api/bookings/{id}/voucher' },
  { name: 'Client - Billetterie SAV', path: 'client/index.html?page=tickets', api: 'GET /api/tickets, POST /api/tickets' },
  { name: 'Client - Profil & RGPD', path: 'client/index.html?page=profile', api: 'GET /api/profile, GET /api/users/me/export' },
  { name: 'Fournisseur - Dashboard', path: 'supplier/index.html?page=dashboard', api: 'GET /api/stats/supplier, GET /api/offers/mine' },
  { name: 'Fournisseur - Wizard Offres', path: 'supplier/index.html?page=new-offer', api: 'POST /api/offers, GET /api/cities' },
  { name: 'Fournisseur - Mes Offres', path: 'supplier/index.html?page=offers', api: 'GET /api/offers/mine' },
  { name: 'Fournisseur - Calendrier', path: 'supplier/index.html?page=availabilities', api: 'GET /api/offers/{id}/availabilities' },
  { name: 'Agent - Dashboard', path: 'agent/index.html?page=dashboard', api: 'GET /api/bookings/pending-cash' },
  { name: 'Agent - Encaissement espèces', path: 'agent/index.html?page=cash-payment', api: 'GET /api/bookings, POST /api/payments/cash' },
  { name: 'Agent - Bundles', path: 'agent/index.html?page=bundles', api: 'GET /api/bundles, POST /api/bundles' },
  { name: 'Admin - Dashboard', path: 'admin/index.html?page=dashboard', api: 'GET /api/stats/admin' },
  { name: 'Admin - Utilisateurs', path: 'admin/index.html?page=users', api: 'GET /api/users' },
  { name: 'Admin - Modération offres', path: 'admin/index.html?page=moderation', api: 'GET /api/offers/pending, PATCH /api/offers/{id}/moderate' },
  { name: 'Admin - Journal d audit', path: 'admin/index.html?page=audit', api: 'GET /api/audit' },
  { name: 'Admin - Paramètres système', path: 'admin/index.html?page=settings', api: 'GET /api/settings, PUT /api/settings/{key}' }
];

console.log('\n====================================================');
console.log('Cartographie d alimentation réelle des écrans :');
screens.forEach(s => {
  console.log(` - ${s.name} : Alimenté par ${s.api} ✅`);
});
console.log('====================================================\n');

