import fs from 'fs';
import path from 'path';

const adrDir = 'docs/adr';
fs.mkdirSync(adrDir, { recursive: true });

const adrs = [
  {
    num: '0001',
    slug: 'single-table-inheritance-offres',
    title: 'Stratégie d\'héritage SINGLE_TABLE pour les offres touristiques',
    status: 'Accepté',
    context: `Dans Atlas Voyage, les offres touristiques se divisent en 5 types distincts (Hôtels/Riads, Vols, Locations de voitures, Taxis/Transferts, Excursions).
Chaque catégorie possède des attributs spécifiques (ex. étoiles pour les hôtels, compagnie/aéroports pour les vols, transmission/catégorie pour les voitures), tout en partageant des propriétés communes critiques (titre, description, ville, prix de base, statut actif/modéré, fournisseur propriétaire, disponibilités, images).`,
    decision: `Adopter la stratégie JPA \`@Inheritance(strategy = InheritanceType.SINGLE_TABLE)\` avec une colonne discriminateur \`offer_type\` sur la table unique \`offers\`.`,
    consequences: `Avantages :
- Requêtes de recherche et catalogue ultra-rapides sans jointures polymorphiques coûteuses (LEFT JOIN sur 5 tables).
- Pagination et tri globaux simples et performants en SQL natif.
Inconvénients :
- Colonnes spécifiques nullables au niveau du schéma SQL ; l'intégrité des champs obligatoires est assurée par Jakarta Validation au niveau des sous-classes (@NotNull conditionnel).`,
    alternatives: `1. JOINED : Normalisé mais très lourd en performances (4 jointures obligatoires par recherche catalogue).
2. TABLE_PER_CLASS : Requêtes polymorphiques par UNION lentes et impossibilité d'avoir des clés étrangères uniques simples.`
  },
  {
    num: '0002',
    slug: 'disponibilites-par-periodes-vs-stock',
    title: 'Gestion des disponibilités par périodes datées plutôt qu\'un stock statique',
    status: 'Accepté',
    context: `Le voyage est un produit périssable par nature : une chambre d'hôtel ou un siège de vol n'a de valeur qu'à une date et heure données.
L'ancien modèle utilisant un entier \`stock\` créait des conflits majeurs : vendre une chambre le 15 août ne devait pas bloquer la réservation de la même chambre le 20 août.`,
    decision: `Supprimer tout décompte par stock global et introduire l'entité \`OfferAvailability\` associant chaque offre à des intervalles temporels [startAt, endAt] dotés d'une capacité numérique unitaire. Le champ historique \`stock\` est définitivement retiré (Phase 9).`,
    consequences: `Avantages :
- Modèle temporel rigoureux et réaliste pour l'industrie du voyage.
- Vérification instantanée de capacité résiduelle sans survente.
- Support natif des périodes de haute et basse saison.
Inconvénients :
- Requêtes de réservation nécessitant une vérification de chevauchement d'intervalles et verrouillage pessimiste (\`PESSIMISTIC_WRITE\`).`,
    alternatives: `1. Stock statique : Rejeté pour incompatibilité absolue avec la notion de calendrier touristique.
2. Système de créneaux fixes par jour (Allotement hôtelier pur) : Moins flexible pour les circuits ou transferts à l'heure.`
  },
  {
    num: '0003',
    slug: 'fournisseurs-specialises-par-categorie',
    title: 'Spécialisation stricte des comptes fournisseurs par catégorie',
    status: 'Accepté',
    context: `Les prestataires touristiques sur le marché marocain sont des entités juridiques spécialisées (hôteliers, transporteurs touristiques agréés, loueurs de voitures déclarés, guides/agences d'excursions).
Permettre à un hôtelier de publier des billets de vol ou à un loueur de voitures de publier des séjours présentait un risque légal et opérationnel majeur.`,
    decision: `Associer chaque compte utilisateur ayant le rôle \`SUPPLIER\` à une catégorie obligatoire \`supplierCategory\` (\`HOTEL\`, \`FLIGHT\`, \`CAR\`, \`TAXI\`, \`EXCURSION\`). Le backend rejette toute création ou modification d'offre en dehors de la spécialité avec le code d'erreur \`SUPPLIER_CATEGORY_MISMATCH\` (HTTP 403).`,
    consequences: `Avantages :
- Ségrégation stricte des responsabilités métier et respect de la réglementation touristique marocaine.
- Interface du portail fournisseur pré-configurée et personnalisée dès la connexion.
Inconvénients :
- Un partenaire multi-activités doit disposer de comptes fournisseurs séparés ou passer par un compte agence.`,
    alternatives: `1. Fournisseurs généralistes sans restriction : Rejeté pour manque de traçabilité et risque de fraude.`
  },
  {
    num: '0004',
    slug: 'dirham-marocain-reference-devises-indicatives',
    title: 'Dirham Marocain (MAD) comme devise unique de référence et conversions indicatives',
    status: 'Accepté',
    context: `Atlas Voyage opère au Maroc sous la réglementation stricte de l'Office des Changes.
Autoriser des règlements réels en monnaie étrangère sans statut de banque ou intermédiaire agréé expose l'entreprise à des sanctions de change et à des risques de volatilité financière.`,
    decision: `Tous les montants en base de données, calculs du panier, transactions bancaires et factures sont EXCLUSIVEMENT libellés en Dirhams Marocains (MAD TTC). Les devises étrangères (EUR, USD, GBP) sont calculées à titre strictement indicatif côté frontend avec mention obligatoire de l'astérisque légal.`,
    consequences: `Avantages :
- Conformité juridique et fiscale marocaine absolue (TVA, facturation en Dirhams).
- Zéro risque de change pour la trésorerie de l'agence.
- Clarté totale pour le consommateur grâce au double affichage transparent.
Inconvénients :
- L'acheteur international peut être soumis à des frais de change par sa banque émettrice.`,
    alternatives: `1. Multi-devises avec comptes bancaires séparés : Rejeté (complexité juridique et agréments bancaires hors périmètre).
2. Tarification en Euros sur le site : Rejeté par la réglementation marocaine.`
  },
  {
    num: '0005',
    slug: 'authentification-jwt-cookies-httponly-rotation-refresh',
    title: 'Authentification JWT via cookies HttpOnly sécurisés et rotation avec détection de rejeu',
    status: 'Accepté',
    context: `Le stockage de jetons d'accès JWT dans \`localStorage\` ou \`sessionStorage\` expose directement les sessions utilisateurs aux attaques XSS (Cross-Site Scripting).
De plus, les jetons statiques longue durée empêchent la révocation immédiate en cas de vol de session.`,
    decision: `Transiter l'authentification exclusivement via deux cookies sécurisés :
- \`atlas_access_token\` : Durée de vie courte (15 minutes), \`HttpOnly\`, \`Secure\`, \`SameSite=Lax\`.
- \`atlas_refresh_token\` : Durée de vie 7 jours, opaque, persistant en base avec chaîne d'émission (\`family\`).
À chaque rafraîchissement (\`POST /api/auth/refresh\`), l'ancien jeton est révoqué et un nouveau jeton est généré (rotation). En cas de tentative de réutilisation d'un ancien jeton de rafraîchissement, TOUTE la famille de jetons est invalidée immédiatement (détection de vol de session).`,
    consequences: `Avantages :
- Protection absolue contre le vol de jetons par script malveillant (inaccessible via JavaScript document.cookie).
- Révocation granulaire et immédiate des accès sans redémarrer le serveur.
Inconvénients :
- Nécessite une protection CSRF par double-submit cookie (\`X-XSRF-TOKEN\`) pour les requêtes avec mutation.`,
    alternatives: `1. Bearer token pur en localStorage : Rejeté pour vulnérabilité majeure XSS (OWASP A01/A03).
2. Sessions HTTP d'état (HttpSession) : Rejeté pour préserver l'architecture stateless de l'API REST.`
  },
  {
    num: '0006',
    slug: 'flyway-et-migrations-sql-idempotentes',
    title: 'Migrations Flyway historiques et scripts SQL manuels versionnés',
    status: 'Accepté',
    context: `Les évolutions de modèle au fil des phases ont combiné des migrations automatiques Flyway (V1 à V9) et des ajustements SQL manuels en profil dev avec Hibernate \`ddl-auto=update\`.`,
    decision: `Garantir la reproductibilité stricte du schéma :
- En développement local : Flyway applique la base puis Hibernate complète le schéma en \`update\`.
- En production : Schéma verrouillé en \`validate\` avec exécution préalable des scripts ordonnancés (\`scripts/migrations/V*.sql\`).
- Tous les scripts DDL doivent être idempotents (\`IF EXISTS\`, \`IF NOT EXISTS\`).`,
    consequences: `Avantages :
- Zéro dérive de schéma entre dev, tests et production.
- Traçabilité complète des modifications d'index et de contraintes d'intégrité.
Inconvénients :
- Nécessite d'écrire manuellement le script SQL pour chaque nouvelle entité ou colonne ajoutée.`,
    alternatives: `1. ddl-auto=update en production : Rejeté formellement (risque critique de perte de données ou de verrous prolongés).
2. Liquibase : Rejeté pour cohérence avec l'existant Flyway déjà en place.`
  },
  {
    num: '0007',
    slug: 'geocodage-resilient-open-meteo',
    title: 'Géocodage mondial résilient via l\'API Open-Meteo sans clé payante',
    status: 'Accepté',
    context: `La localisation géographique des offres et villes requiert des coordonnées GPS (latitude, longitude) fiables pour l'affichage cartographique et le calcul d'itinéraires.
Les solutions payantes (Google Maps API, Mapbox) introduisaient des coûts et des clés d'API contraignantes.`,
    decision: `Utiliser l'API publique de géocodage Open-Meteo (\`https://geocoding-api.open-meteo.com/v1/search\`) avec une stratégie de résilience à triple niveau :
1. Recherche exacte et normalisée (\`CityNormalizer\`).
2. Cache persistant des villes résolues dans la table \`cities\`.
3. Coordonnées de repli par défaut sur les métropoles marocaines (Marrakech, Casablanca) en cas de panne réseau ou de limite de requêtes.`,
    consequences: `Avantages :
- Zéro coût financier et zéro clé d'API secrète à gérer.
- Résolution rapide des villes marocaines et internationales.
Inconvénients :
- Dépendance réseau externe lors de la première saisie d'une nouvelle ville par un fournisseur.`,
    alternatives: `1. Google Places API : Rejeté pour coûts récurrents et nécessité d'enregistrer une carte bancaire.
2. Nominatim OpenStreetMap direct : Rejeté pour politique de restriction d'usage très stricte (1 req/s maximum).`
  },
  {
    num: '0008',
    slug: 'catalogue-public-unique',
    title: 'Catalogue public unique partagé entre visiteurs invités et clients connectés',
    status: 'Accepté',
    context: `Le projet comportait historiquement deux pages de catalogue distinctes : \`frontend/catalogue.html\` pour les visiteurs et un second catalogue intégré dans le tableau de bord client (\`frontend/client/index.html?page=catalog\`), entraînant de la duplication de code et des divergences de filtres.`,
    decision: `Unifier la recherche d'offres autour d'une source unique :
- Les pages publiques \`accueil.html\`, \`catalogue.html\` et \`offre.html\` constituent l'unique point d'entrée pour la consultation des offres.
- Le menu client redirige directement vers \`catalogue.html\`.
- L'état de session (connecté vs invité) personnalise dynamiquement l'affichage (bouton favori, ajout direct au panier connecté, coordonnées pré-remplies).`,
    consequences: `Avantages :
- Élimination de 800+ lignes de code dupliqué.
- Même expérience riche de recherche et de filtres pour tous les utilisateurs.
Inconvénients :
- La navigation client sort temporairement de la SPA pour revenir sur le catalogue public.`,
    alternatives: `1. Maintenir deux catalogues : Rejeté pour coût de maintenance et risque d'incohérence visuelle.`
  },
  {
    num: '0009',
    slug: 'i18n-runtime-vanilla-vs-build-time',
    title: 'Internationalisation runtime Vanilla JavaScript sans étape de compilation',
    status: 'Accepté',
    context: `Atlas Voyage doit supporter le Français, l'Anglais et l'Arabe (avec RTL et 6 formes de pluriel) sans rompre le principe fondateur du frontend Vanilla JS (zéro étape de build obligatoire, fichiers HTML directement exécutables via serveur statique local).`,
    decision: `Implémenter un moteur i18n natif en JavaScript moderne (\`frontend/js/shared/i18n.js\`) chargeant des dictionnaires JSON modulaires (\`frontend/locales/{lang}/{ns}.json\`) à la volée avec mise en cache mémoire.
Utiliser l'API standard \`Intl.PluralRules\` pour la gestion des pluriels arabes et des sélecteurs déclaratifs (\`data-i18n\`, \`data-i18n-attr\`).`,
    consequences: `Avantages :
- Zéro dépendance à Webpack, Vite ou un compilateur.
- Modification instantanée des traductions visible au simple rafraîchissement (\`F5\`).
- Prise en charge native et accessible du mode RTL.
Inconvénients :
- Légère latence de chargement réseau des fichiers JSON au premier affichage (compensée par le cache navigateur et Caffeine côté serveur).`,
    alternatives: `1. i18next compilé : Rejeté car imposait une étape de bundling Node.js.
2. Pages HTML dupliquées par langue (\`accueil_fr.html\`, \`accueil_ar.html\`) : Rejeté pour démultiplication ingérable de la maintenance.`
  },
  {
    num: '0010',
    slug: 'cache-caffeine-mono-instance',
    title: 'Mise en cache mémoire locale Caffeine pour les statistiques et les taux de change',
    status: 'Accepté',
    context: `Certaines requêtes d'agrégation de données (calculs des tableaux de bord administratifs, agrégation du chiffre d'affaires, taux de devises indicatifs) sollicitent intensément la base MySQL ou nécessitent des appels réseau externes.`,
    decision: `Utiliser la bibliothèque haute performance \`CaffeineCacheManager\` en mémoire locale dans Spring Boot pour les caches critiques :
- \`adminStats\` : Durée de rétention 2 minutes avec éviction automatique.
- \`currencyRates\` : Durée de rétention 12 heures.`,
    consequences: `Avantages :
- Temps de réponse inférieurs à 2 ms pour les endpoints en cache.
- Réduction drastique de la charge processeur sur MySQL.
- Configuration simple et sans serveur Redis externe.
Inconvénients :
- Cache en mémoire vive local à chaque instance : en cas de déploiement multi-instances derrière un load balancer, une divergence transitoire de 2 minutes peut exister entre deux nœuds.`,
    alternatives: `1. Redis distribué : Jugé disproportionné et coûteux pour la volumétrie actuelle.
2. Pas de cache : Rejeté en raison des temps de réponse inacceptables sur les calculs d'agrégation.`
  }
];

// Nettoyage préalable des anciens fichiers
const existing = fs.readdirSync(adrDir);
for (const f of existing) {
  if (f.endsWith('.md')) {
    fs.unlinkSync(path.join(adrDir, f));
  }
}

adrs.forEach(a => {
  const md = `# ADR-${a.num} : ${a.title}

> **Date :** 1er novembre 2026 | **Statut :** ${a.status}  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

${a.context}

---

## 2. Décision Prise

${a.decision}

---

## 3. Conséquences

${a.consequences}

---

## 4. Alternatives Envisagées et Raisons du Rejet

${a.alternatives}
`;

  const fileName = `${a.num}-${a.slug}.md`;
  fs.writeFileSync(path.join(adrDir, fileName), md, 'utf8');
});

console.log('Successfully generated all 10 ADRs with clean ASCII slugs in docs/adr/!');
