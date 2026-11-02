import fs from 'fs';

const collectionPath = 'docs/postman/AtlasVoyage.postman_collection.json';
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Check existing folders
const existingFolderNames = collection.item.map(i => i.name);

// 1. Add Phase 12: Avis & Notations + Contact
if (!existingFolderNames.some(n => n.includes('Avis'))) {
  const reviewsFolder = {
    name: "18 - Avis, Notations et Contact (Phase 12)",
    item: [
      {
        name: "Lister les avis publics d'une offre",
        request: {
          method: "GET",
          header: [{ key: "Accept", value: "application/json" }],
          url: {
            raw: "{{baseUrl}}/api/offers/1/reviews?page=0&size=10&sort=recent",
            host: ["{{baseUrl}}"],
            path: ["api", "offers", "1", "reviews"],
            query: [
              { key: "page", value: "0" },
              { key: "size", value: "10" },
              { key: "sort", value: "recent" }
            ]
          },
          description: "Retourne les avis approuvés pour une offre."
        },
        response: []
      },
      {
        name: "Obtenir le résumé des avis d'une offre",
        request: {
          method: "GET",
          header: [{ key: "Accept", value: "application/json" }],
          url: {
            raw: "{{baseUrl}}/api/offers/1/reviews/summary",
            host: ["{{baseUrl}}"],
            path: ["api", "offers", "1", "reviews", "summary"]
          },
          description: "Note moyenne et distribution 1 à 5 étoiles."
        },
        response: []
      },
      {
        name: "Déposer un avis certifié (CLIENT)",
        request: {
          method: "POST",
          header: [
            { key: "Content-Type", value: "application/json" },
            { key: "Authorization", value: "Bearer {{clientToken}}" }
          ],
          body: {
            mode: "raw",
            raw: JSON.stringify({
              bookingId: 1,
              rating: 5,
              title: "Séjour inoubliable au riad",
              comment: "Accueil chaleureux, thé à la menthe offert et vue imprenable sur la médina de Marrakech."
            }, null, 2)
          },
          url: {
            raw: "{{baseUrl}}/api/offers/1/reviews",
            host: ["{{baseUrl}}"],
            path: ["api", "offers", "1", "reviews"]
          },
          description: "Nécessite une réservation terminée COMPLETED."
        },
        response: []
      },
      {
        name: "Répondre à un avis (SUPPLIER / ADMIN)",
        request: {
          method: "POST",
          header: [
            { key: "Content-Type", value: "application/json" },
            { key: "Authorization", value: "Bearer {{supplierToken}}" }
          ],
          body: {
            mode: "raw",
            raw: JSON.stringify({
              reply: "Merci beaucoup Sarah pour votre retour chaleureux, au plaisir de vous revoir !"
            }, null, 2)
          },
          url: {
            raw: "{{baseUrl}}/api/reviews/1/reply",
            host: ["{{baseUrl}}"],
            path: ["api", "reviews", "1", "reply"]
          },
          description: "Réservé au fournisseur propriétaire de l'offre ou à l'administrateur."
        },
        response: []
      },
      {
        name: "Envoyer un message de contact public (Honeypot)",
        request: {
          method: "POST",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: {
            mode: "raw",
            raw: JSON.stringify({
              name: "Visiteur Curieux",
              email: "visiteur@example.com",
              subject: "Demande d'informations circuits Sud",
              message: "Bonjour, proposez-vous des circuits privatifs dans le désert de Merzouga ?",
              _hp: ""
            }, null, 2)
          },
          url: {
            raw: "{{baseUrl}}/api/contact",
            host: ["{{baseUrl}}"],
            path: ["api", "contact"]
          },
          description: "Formulaire de contact avec protection par pot de miel (_hp doit rester vide)."
        },
        response: []
      }
    ]
  };
  collection.item.push(reviewsFolder);
}

// 2. Add Phase 14: Devises & Internationalisation
if (!existingFolderNames.some(n => n.includes('Devises'))) {
  const i18nFolder = {
    name: "19 - Devises et Internationalisation (Phase 14)",
    item: [
      {
        name: "Obtenir les taux de change indicatifs (MAD de référence)",
        request: {
          method: "GET",
          header: [{ key: "Accept", value: "application/json" }],
          url: {
            raw: "{{baseUrl}}/api/currencies/rates",
            host: ["{{baseUrl}}"],
            path: ["api", "currencies", "rates"]
          },
          description: "Renvoie les taux indicatifs mis en cache (EUR, USD, GBP) et l'avertissement légal."
        },
        response: []
      },
      {
        name: "Mettre à jour mes préférences linguistiques et de devise (CLIENT)",
        request: {
          method: "PUT",
          header: [
            { key: "Content-Type", value: "application/json" },
            { key: "Authorization", value: "Bearer {{clientToken}}" }
          ],
          body: {
            mode: "raw",
            raw: JSON.stringify({
              preferredLanguage: "ar",
              preferredCurrency: "EUR"
            }, null, 2)
          },
          url: {
            raw: "{{baseUrl}}/api/users/me/preferences",
            host: ["{{baseUrl}}"],
            path: ["api", "users", "me", "preferences"]
          },
          description: "Enregistre la langue (fr/en/ar) et la devise d'affichage préférées de l'utilisateur."
        },
        response: []
      },
      {
        name: "Lister les traductions d'une offre (SUPPLIER / ADMIN)",
        request: {
          method: "GET",
          header: [
            { key: "Accept", value: "application/json" },
            { key: "Authorization", value: "Bearer {{supplierToken}}" }
          ],
          url: {
            raw: "{{baseUrl}}/api/offers/1/translations",
            host: ["{{baseUrl}}"],
            path: ["api", "offers", "1", "translations"]
          },
          description: "Liste toutes les traductions existantes pour l'offre."
        },
        response: []
      },
      {
        name: "Enregistrer une traduction arabe pour une offre (SUPPLIER)",
        request: {
          method: "PUT",
          header: [
            { key: "Content-Type", value: "application/json" },
            { key: "Authorization", value: "Bearer {{supplierToken}}" }
          ],
          body: {
            mode: "raw",
            raw: JSON.stringify({
              title: "جناح أزرق بإطلالة على المدينة العتيقة",
              description: "إقامة ساحرة في قلب مراكش مع وجبة فطور تقليدية وإطلالة بانورامية."
            }, null, 2)
          },
          url: {
            raw: "{{baseUrl}}/api/offers/1/translations/ar",
            host: ["{{baseUrl}}"],
            path: ["api", "offers", "1", "translations", "ar"]
          },
          description: "Enregistre le titre et la description en arabe (RTL)."
        },
        response: []
      },
      {
        name: "Consulter une offre en arabe (avec fallback auto)",
        request: {
          method: "GET",
          header: [{ key: "Accept", value: "application/json" }],
          url: {
            raw: "{{baseUrl}}/api/offers/1?lang=ar",
            host: ["{{baseUrl}}"],
            path: ["api", "offers", "1"],
            query: [{ key: "lang", value: "ar" }]
          },
          description: "Retourne l'offre avec titre et description traduits en arabe si disponibles."
        },
        response: []
      }
    ]
  };
  collection.item.push(i18nFolder);
}

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('Updated Postman collection with Phases 12 and 14!');

// Create env.dev.json
const envDev = {
  id: "atlas-voyage-dev-env",
  name: "Atlas Voyage - Dev Local",
  values: [
    { key: "baseUrl", value: "http://localhost:8080", enabled: true },
    { key: "adminEmail", value: "omar.tazi@atlasvoyage.ma", enabled: true },
    { key: "adminPassword", value: "password123", enabled: true },
    { key: "agentEmail", value: "nadia.elfassi@atlasvoyage.ma", enabled: true },
    { key: "agentPassword", value: "password123", enabled: true },
    { key: "supplierEmail", value: "karim.idrissi@atlasvoyage.ma", enabled: true },
    { key: "supplierPassword", value: "password123", enabled: true },
    { key: "clientEmail", value: "sarah.benali@example.com", enabled: true },
    { key: "clientPassword", value: "password123", enabled: true },
    { key: "adminToken", value: "", enabled: true },
    { key: "agentToken", value: "", enabled: true },
    { key: "supplierToken", value: "", enabled: true },
    { key: "clientToken", value: "", enabled: true }
  ],
  _postman_variable_scope: "environment"
};
fs.writeFileSync('docs/postman/env.dev.json', JSON.stringify(envDev, null, 2), 'utf8');

// Create env.prod.json (ZERO SECRET, placeholders only)
const envProd = {
  id: "atlas-voyage-prod-env",
  name: "Atlas Voyage - Production (Sensible)",
  values: [
    { key: "baseUrl", value: "https://api.atlasvoyage.ma", enabled: true },
    { key: "adminEmail", value: "<VOTRE_EMAIL_ADMIN>", enabled: true },
    { key: "adminPassword", value: "<MOT_DE_PASSE_SECURISE>", type: "secret", enabled: true },
    { key: "adminToken", value: "", type: "secret", enabled: true },
    { key: "clientToken", value: "", type: "secret", enabled: true }
  ],
  _postman_variable_scope: "environment"
};
fs.writeFileSync('docs/postman/env.prod.json', JSON.stringify(envProd, null, 2), 'utf8');

console.log('Created docs/postman/env.dev.json and docs/postman/env.prod.json successfully!');

