import fs from 'node:fs';

const content = `# Tests Postman & Guide d'Exécution Newman — Atlas Voyage

> **Statut :** ✅ Implémenté & Synchronisé  
> **Date de mise à jour :** 2026-11-01  
> **Auteur :** Équipe Docs-as-Code & Qualité API Atlas Voyage  
> **Rôles concernés :** Développeurs, Testeurs QA, DevOps  
> **Source de vérité :** [\`AtlasVoyage.postman_collection.json\`](./AtlasVoyage.postman_collection.json) & [\`../api_endpoints.md\`](../api_endpoints.md)

---

## 1. Vue d'ensemble

Le dossier \`docs/postman/\` fournit la suite de tests fonctionnels et d'intégration HTTP automatisés pour l'ensemble des modules d'Atlas Voyage.

- **Format :** Postman Collection v2.1.0
- **Volume :** **18 dossiers**, **181 requêtes** outillées avec scripts de validation JavaScript.
- **Environnements supportés :**
  - Dev local : [\`env.dev.json\`](./env.dev.json) (\`http://localhost:8080\`, identifiants de démonstration décrits avec avertissement)
  - Production : [\`env.prod.json\`](./env.prod.json) (\`https://api.atlasvoyage.ma\`, gabarit sécurisé sans aucun secret ni mot de passe)

---

## 2. Inventaire des Dossiers de Test

| N° | Dossier | Requêtes | Description & Domaines Couverts |
|---|---|:---:|---|
| 00 | **Fondations Phase 1** | 3 | Villes de référence, géocodage Open-Meteo et santé applicative de base. |
| 00 | **Statut** | 1 | Contrôle \`GET /api/status\` et handshake applicatif. |
| 01 | **Utilisateurs** | 6 | Cycle de vie CRUD Utilisateurs (Admin), archivage, restauration et activation. |
| 02 | **Offres** | 15 | Création et validation des 5 types d'offres (Hôtel, Vol, Voiture, Taxi, Excursion), filtres et pagination. |
| 03 | **Bundles** | 9 | Agrégation dynamique de packages multi-offres, calcul du prix remisé et stock consolidé. |
| 04 | **Authentification et droits** | 28 | Connexion (succès, échecs, lockout), rotation refresh token, RBAC strict (401/403), isolation fournisseur. |
| 05 | **Panier et codes promo** | 42 | Ajout/suppression, fusion de lignes de panier, règles de codes promo, calculs TTC et remise. |
| 09 | **Réservations Phase 2** | 8 | Création de commande, verrouillage temporaire, statuts, annulation avec barème d'indemnité. |
| 10 | **Paiements Phase 3 (SANDBOX)** | 13 | Idempotence (\`Idempotency-Key\`), simulation paiement carte, espèces en agence et webhook HMAC CMI. |
| 11 | **Notifications Phase 4** | 7 | Notifications in-app pour tous les rôles, marquage lu/non-lu, compteur non-lus. |
| 12 | **Statistiques Phase 5 et exports CSV** | 6 | Tableaux de bord financiers, KPI d'occupation, exports CSV comptables pour Admin et Fournisseur. |
| 13 | **Profils, sécurité et images Phase 6** | 13 | Mise à jour du profil, avatar multipart, changement de mot de passe, politique de complexité. |
| 14 | **Tickets de support** | 9 | Ouverture de réclamation client, réponses bidirectionnelles, escalade et clôture. |
| 15 | **Favoris Phase 8** | 4 | Ajout aux favoris de l'espace client, listing paginé et suppression. |
| 16 | **Journal d'audit Phase 8** | 3 | Traçabilité des actions sensibles (Admin), consultation filtrée par acteur et type d'événement. |
| 17 | **Paramètres globaux Phase 8** | 4 | Configuration dynamique des clés applicatives (maintenance, contact, taux de commission). |
| 18 | **Avis, Notations et Contact (Phase 12)** | 5 | Soumission d'avis sur offre consommée, modération admin, formulaire de contact public avec rate limiting. |
| 19 | **Devises et Internationalisation (Phase 14)** | 5 | Taux de change EUR/USD/GBP par rapport au MAD de référence, dictionnaire i18n FR/EN/AR. |

---

## 3. Prérequis d'Exécution Locale

1. **Serveur de base de données :** MySQL 8 ou MariaDB démarré sur le port \`3306\` avec la base \`travel_agency_db\` initialisée.
2. **Backend démarré :**
   \`\`\`bash
   cd backend
   ./mvnw spring-boot:run
   \`\`\`
   Le serveur écoute sur \`http://localhost:8080\`.
3. **Comptes de test (fournis par le DataInitializer en profil dev) :**
   - Admin : \`omar.tazi@atlasvoyage.ma\` / \`password123\`
   - Fournisseur Hôtel : \`leila.fournisseur@atlasvoyage.ma\` / \`password123\`
   - Agent : \`karim.agent@atlasvoyage.ma\` / \`password123\`
   - Client : \`youssef.client@atlasvoyage.ma\` / \`password123\`

> [!WARNING]
> Ces comptes et mots de passe ne sont valables **qu'en environnement de développement local**. Ils ne doivent jamais être déployés ou conservés en environnement de production.

---

## 4. Exécution Automatisée avec Newman (CLI)

[Newman](https://www.npmjs.com/package/newman) permet d'exécuter l'intégralité de la collection en ligne de commande ou dans un pipeline d'intégration continue (CI/CD).

### 4.1. Installation de Newman
\`\`\`bash
npm install -g newman newman-reporter-htmlextra
\`\`\`

### 4.2. Exécution complète avec environnement local
\`\`\`bash
newman run docs/postman/AtlasVoyage.postman_collection.json \\
  -e docs/postman/env.dev.json \\
  --reporters cli
\`\`\`

### 4.3. Exécution d'un dossier spécifique
Pour exécuter uniquement le module Authentification & RBAC :
\`\`\`bash
newman run docs/postman/AtlasVoyage.postman_collection.json \\
  -e docs/postman/env.dev.json \\
  --folder "04 - Authentification et droits"
\`\`\`

### 4.4. Génération d'un rapport HTML interactif
\`\`\`bash
newman run docs/postman/AtlasVoyage.postman_collection.json \\
  -e docs/postman/env.dev.json \\
  -r htmlextra --reporter-htmlextra-export docs/postman/report.html
\`\`\`

---

## 5. Utilisation dans Postman Desktop ou Extension VS Code

1. Ouvrir l'application **Postman** ou l'extension VS Code **Postman**.
2. Cliquer sur **Import** (ou \`Ctrl+O\`).
3. Sélectionner les deux fichiers :
   - \`docs/postman/AtlasVoyage.postman_collection.json\`
   - \`docs/postman/env.dev.json\`
4. Dans le sélecteur d'environnement en haut à droite, choisir **Atlas Voyage - Dev Local**.
5. Ouvrir le **Collection Runner**, sélectionner la collection et cliquer sur **Run Atlas Voyage - API REST**.

---

## 6. Politique de Sécurité des Environnements

> [!CAUTION]
> **Règle absolue « Zéro Secret » :**  
> Le fichier \`docs/postman/env.prod.json\` ne contient aucun mot de passe ni token valide. En production, les variables d'authentification (\`adminEmail\`, \`adminPassword\`, \`jwtToken\`) doivent être transmises soit par variables d'environnement au runner Newman, soit renseignées temporairement dans le coffre-fort secret de votre agent d'intégration continue (GitHub Actions Secrets, GitLab CI Masked Variables).
