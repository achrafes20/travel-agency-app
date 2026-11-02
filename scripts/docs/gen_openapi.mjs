import fs from 'fs';
import path from 'path';

const endpoints = JSON.parse(fs.readFileSync('scripts/docs/extracted_endpoints.json', 'utf8'));

// Tag mapping by controller
const tagMapping = {
  AuthController: { tag: 'Authentification', desc: 'Gestion des sessions, connexions et jetons de rafraîchissement' },
  AccountSecurityController: { tag: 'Sécurité du Compte', desc: 'Changement de mot de passe, vérification d\'email et réinitialisation' },
  ProfileController: { tag: 'Profils', desc: 'Gestion des profils clients et fiches fournisseurs' },
  UserController: { tag: 'Utilisateurs & RGPD', desc: 'Administration des comptes, archivage, export RGPD et droit à l\'oubli' },
  CityController: { tag: 'Villes & Géocodage', desc: 'Villes touristiques marocaines et coordonnées géographiques' },
  OfferController: { tag: 'Offres Touristiques', desc: 'Hébergements, vols, voitures, transferts et excursions' },
  BundleController: { tag: 'Bundles & Forfaits', desc: 'Packs promotionnels et forfaits combinés par les agents' },
  CartController: { tag: 'Panier', desc: 'Gestion du panier d\'achats, articles et validation des dates' },
  PromoCodeController: { tag: 'Codes Promo', desc: 'Gestion des réductions promotionnelles' },
  BookingController: { tag: 'Réservations', desc: 'Conversion du panier en réservation, annulation et bons d\'échange (vouchers)' },
  PaymentController: { tag: 'Paiements & Caisse', desc: 'Règlements sandbox en ligne, encaissement espèces et remboursements' },
  PaymentWebhookController: { tag: 'Webhook Paiements', desc: 'Notification asynchrone des passerelles de paiement bancaire' },
  NotificationController: { tag: 'Notifications', desc: 'Centre de notifications in-app et préférences de réception' },
  FavoriteController: { tag: 'Favoris', desc: 'Gestion des listes de souhaits des voyageurs clients' },
  TicketController: { tag: 'Tickets de Support', desc: 'Assistance client, suivi des réclamations et messagerie d\'assistance' },
  ReviewController: { tag: 'Avis & Notations', desc: 'Retours d\'expérience certifiés après séjour, modération et réponses' },
  ContactController: { tag: 'Contact Public', desc: 'Formulaire de contact avec protection anti-spam par pot de miel' },
  SettingController: { tag: 'Paramètres Système', desc: 'Configuration globale de la plateforme et mode maintenance' },
  StatsController: { tag: 'Statistiques & KPIs', desc: 'Indicateurs de performance des 4 tableaux de bord et exports CSV' },
  CurrencyController: { tag: 'Devises & Taux', desc: 'Taux de change indicatifs (EUR, USD, GBP) par rapport au MAD' },
  FileController: { tag: 'Fichiers & Images', desc: 'Téléversement et distribution d\'images et pièces jointes' },
  StatusController: { tag: 'Santé & Supervision', desc: 'Sondes de disponibilité et métriques d\'exploitation' },
  AuditController: { tag: 'Journal d\'Audit', desc: 'Traçabilité immuable des actions sensibles et export d\'audit' }
};

// Build paths object
const paths = {};

endpoints.forEach(ep => {
  const p = ep.path;
  if (!paths[p]) paths[p] = {};
  
  const method = ep.verb.toLowerCase();
  const info = tagMapping[ep.controller] || { tag: ep.controller, desc: ep.controller };

  // Detect path parameters
  const pathParams = [];
  const paramMatches = p.matchAll(/\{([^}]+)\}/g);
  for (const m of paramMatches) {
    pathParams.push({
      name: m[1],
      in: 'path',
      required: true,
      schema: { type: m[1].toLowerCase().includes('id') ? 'integer' : 'string' },
      description: `Identifiant ${m[1]}`
    });
  }

  // Security
  const isPublic = (
    (ep.controller === 'AuthController' && ['login', 'register', 'refresh'].includes(ep.methodName)) ||
    (ep.controller === 'AccountSecurityController' && ['forgot', 'reset', 'verify'].includes(ep.methodName)) ||
    (ep.controller === 'StatusController') ||
    (ep.controller === 'CurrencyController') ||
    (ep.controller === 'ContactController') ||
    (ep.controller === 'PaymentWebhookController') ||
    (ep.controller === 'FileController' && ep.verb === 'GET') ||
    (ep.controller === 'SettingController' && ep.methodName === 'getPublicSettings') ||
    (ep.verb === 'GET' && ['OfferController', 'CityController', 'BundleController'].includes(ep.controller) && !p.includes('/moderation') && !p.includes('/translations')) ||
    (ep.controller === 'ReviewController' && ep.verb === 'GET' && !p.includes('/moderation'))
  );

  const security = isPublic ? [] : [{ bearerAuth: [] }, { cookieAuth: [] }];

  // Summary
  let summary = ep.summary || `${ep.methodName} sur ${ep.controller}`;
  summary = summary.replace(/\s+/g, ' ').trim();

  // Responses
  let defaultSuccess = '200';
  if (ep.verb === 'POST' && (ep.methodName.includes('create') || ep.methodName.includes('add') || ep.methodName.includes('submit') || ep.path.endsWith('/bookings'))) {
    defaultSuccess = '201';
  }
  if (ep.verb === 'DELETE') {
    defaultSuccess = '204';
  }

  const responses = {
    [defaultSuccess]: {
      description: 'Opération réalisée avec succès'
    }
  };

  if (!isPublic) {
    responses['401'] = { description: 'Non authentifié - Jeton absent ou expiré' };
    responses['403'] = { description: 'Accès refusé - Privilèges insuffisants pour cette ressource' };
  }
  if (p.includes('{')) {
    responses['404'] = { description: 'Ressource introuvable' };
  }
  if (['POST', 'PUT', 'PATCH'].includes(ep.verb)) {
    responses['400'] = { description: 'Requête invalide ou corps non conforme' };
    responses['422'] = { description: 'Erreur métier ou validation de règle échouée' };
  }
  responses['429'] = { description: 'Limite de débit dépassée (Rate limit) - Consulter Retry-After' };
  responses['500'] = { description: 'Erreur interne du serveur Atlas Voyage' };

  paths[p][method] = {
    tags: [info.tag],
    summary,
    description: `Endpoint contrôlé par \`${ep.controller}.${ep.methodName}()\`.`,
    operationId: `${ep.controller}_${ep.methodName}_${method}_${ep.path.replace(/[^\w]/g, '_')}`,
    parameters: pathParams.length ? pathParams : undefined,
    security: security.length ? security : undefined,
    responses
  };
});

// Produce clean YAML
function toYaml(obj, indent = 0) {
  const sp = ' '.repeat(indent);
  let res = '';
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        res += `${sp}- \n${toYaml(item, indent + 2).replace(/^(\s+)/, '$1  ')}`;
      } else {
        res += `${sp}- ${item}\n`;
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined) return;
      if (typeof v === 'object' && v !== null && Object.keys(v).length === 0) return;
      if (typeof v === 'object' && v !== null) {
        res += `${sp}${k}:\n${toYaml(v, indent + 2)}`;
      } else {
        const valStr = typeof v === 'string' && (v.includes(':') || v.includes('#') || v.includes("'") || v.includes('"') || v.startsWith('@'))
          ? JSON.stringify(v)
          : String(v);
        res += `${sp}${k}: ${valStr}\n`;
      }
    });
  }
  return res;
}

const openApiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'Atlas Voyage API REST',
    version: '3.0.0',
    description: 'API officielle de réservation touristique au Maroc (Hôtels & Riads, Vols, Voitures, Transferts, Excursions). Toutes les transactions et calculs de prix réels sont strictement exécutés en Dirhams Marocains (MAD TTC). Les devises étrangères (EUR, USD, GBP) sont fournies à titre strictement indicatif.',
    contact: {
      name: 'Support Technique Atlas Voyage',
      url: 'https://example.ma',
      email: 'tech@atlasvoyage.ma'
    },
    license: {
      name: 'Propriétaire Atlas Voyage S.A.R.L. - Tous droits réservés (À confirmer)',
      url: 'https://example.ma/legal'
    }
  },
  servers: [
    { url: 'http://localhost:8080', description: 'Serveur de Développement Local' },
    { url: 'https://api.example.ma', description: 'Serveur de Préproduction / Staging' },
    { url: 'https://api.atlasvoyage.ma', description: 'Serveur de Production' }
  ],
  tags: Object.values(tagMapping).map(t => ({ name: t.tag, description: t.desc })),
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Jeton JWT transmis via en-tête Authorization: Bearer <token>'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'atlas_access_token',
        description: 'Cookie de session sécurisé HttpOnly émis lors de la connexion'
      }
    }
  }
};

fs.mkdirSync('docs/api', { recursive: true });
const yamlContent = toYaml(openApiDoc);
fs.writeFileSync('docs/api/openapi.yaml', yamlContent, 'utf8');
console.log(`Generated docs/api/openapi.yaml with ${Object.keys(paths).length} unique paths and ${endpoints.length} operations.`);

