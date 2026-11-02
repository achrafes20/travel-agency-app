import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs/promises';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = 'http://127.0.0.1:5500/frontend';

const targets = [
  // Invite
  { role: 'invite', file: '01-accueil.png', url: `${baseUrl}/accueil.html` },
  { role: 'invite', file: '02-catalogue.png', url: `${baseUrl}/catalogue.html?type=HOTEL` },
  { role: 'invite', file: '03-detail-offre.png', url: `${baseUrl}/offre.html?id=1` },
  { role: 'invite', file: '04-panier.png', url: `${baseUrl}/panier.html` },
  { role: 'invite', file: '05-connexion.png', url: `${baseUrl}/connexion.html` },

  // Client
  { role: 'client', file: '01-dashboard.png', url: `${baseUrl}/client/index.html?page=dashboard`, authRole: 'CLIENT', name: 'Sarah Benali', email: 'sarah.benali@example.com' },
  { role: 'client', file: '02-reservations.png', url: `${baseUrl}/client/index.html?page=reservations`, authRole: 'CLIENT', name: 'Sarah Benali', email: 'sarah.benali@example.com' },
  { role: 'client', file: '03-checkout.png', url: `${baseUrl}/panier.html#checkout` },
  { role: 'client', file: '04-tickets.png', url: `${baseUrl}/client/index.html?page=tickets`, authRole: 'CLIENT', name: 'Sarah Benali', email: 'sarah.benali@example.com' },
  { role: 'client', file: '05-profil.png', url: `${baseUrl}/client/index.html?page=profile`, authRole: 'CLIENT', name: 'Sarah Benali', email: 'sarah.benali@example.com' },

  // Fournisseur
  { role: 'fournisseur', file: '01-dashboard.png', url: `${baseUrl}/supplier/index.html?page=dashboard`, authRole: 'SUPPLIER', name: 'Leila Belhadj', email: 'leila.fournisseur@atlasvoyage.ma' },
  { role: 'fournisseur', file: '02-wizard-offre.png', url: `${baseUrl}/supplier/index.html?page=new-offer`, authRole: 'SUPPLIER', name: 'Leila Belhadj', email: 'leila.fournisseur@atlasvoyage.ma' },
  { role: 'fournisseur', file: '03-offres.png', url: `${baseUrl}/supplier/index.html?page=offers`, authRole: 'SUPPLIER', name: 'Leila Belhadj', email: 'leila.fournisseur@atlasvoyage.ma' },
  { role: 'fournisseur', file: '04-disponibilites.png', url: `${baseUrl}/supplier/index.html?page=availabilities`, authRole: 'SUPPLIER', name: 'Leila Belhadj', email: 'leila.fournisseur@atlasvoyage.ma' },
  { role: 'fournisseur', file: '05-stats.png', url: `${baseUrl}/supplier/index.html?page=stats`, authRole: 'SUPPLIER', name: 'Leila Belhadj', email: 'leila.fournisseur@atlasvoyage.ma' },

  // Agent
  { role: 'agent', file: '01-dashboard.png', url: `${baseUrl}/agent/index.html?page=dashboard`, authRole: 'AGENT', name: 'Karim Agent', email: 'karim.agent@atlasvoyage.ma' },
  { role: 'agent', file: '02-encaissement.png', url: `${baseUrl}/agent/index.html?page=cash-payment`, authRole: 'AGENT', name: 'Karim Agent', email: 'karim.agent@atlasvoyage.ma' },
  { role: 'agent', file: '03-bundles.png', url: `${baseUrl}/agent/index.html?page=bundles`, authRole: 'AGENT', name: 'Karim Agent', email: 'karim.agent@atlasvoyage.ma' },
  { role: 'agent', file: '04-support.png', url: `${baseUrl}/agent/index.html?page=tickets`, authRole: 'AGENT', name: 'Karim Agent', email: 'karim.agent@atlasvoyage.ma' },

  // Admin
  { role: 'admin', file: '01-dashboard.png', url: `${baseUrl}/admin/index.html?page=dashboard`, authRole: 'ADMIN', name: 'Omar Tazi', email: 'omar.tazi@atlasvoyage.ma' },
  { role: 'admin', file: '02-utilisateurs.png', url: `${baseUrl}/admin/index.html?page=users`, authRole: 'ADMIN', name: 'Omar Tazi', email: 'omar.tazi@atlasvoyage.ma' },
  { role: 'admin', file: '03-moderation.png', url: `${baseUrl}/admin/index.html?page=moderation`, authRole: 'ADMIN', name: 'Omar Tazi', email: 'omar.tazi@atlasvoyage.ma' },
  { role: 'admin', file: '04-audit.png', url: `${baseUrl}/admin/index.html?page=audit`, authRole: 'ADMIN', name: 'Omar Tazi', email: 'omar.tazi@atlasvoyage.ma' },
  { role: 'admin', file: '05-parametres.png', url: `${baseUrl}/admin/index.html?page=settings`, authRole: 'ADMIN', name: 'Omar Tazi', email: 'omar.tazi@atlasvoyage.ma' },
];

console.log('--- Lancement du navigateur Chrome pour la capture ---');
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const t of targets) {
    const roleDir = path.resolve(process.cwd(), 'docs/assets/screenshots', t.role);
    await fs.mkdir(roleDir, { recursive: true });
    const dest = path.join(roleDir, t.file);

    // Initialisation du localStorage si authRole requis
    if (t.authRole) {
      await page.evaluateOnNewDocument((user) => {
        localStorage.setItem('atlas-user', JSON.stringify(user));
      }, { id: 1, email: t.email, fullName: t.name, role: t.authRole });
    }

    try {
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 5000 });
      // Attente brève de rendu
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: dest, fullPage: false });
      console.log(`[OK] ${t.role}/${t.file}`);
    } catch (err) {
      console.error(`[WARN] ${t.role}/${t.file} (timeout/error, force screenshot):`, err.message);
      try {
        await page.screenshot({ path: dest, fullPage: false });
        console.log(`[OK fallback] ${t.role}/${t.file}`);
      } catch (e) {
        console.error(`[ERR] Failed fallback screenshot ${t.role}/${t.file}`);
      }
    }
  }
} finally {
  await browser.close();
  console.log('--- Fin des captures Puppeteer ---');
}
