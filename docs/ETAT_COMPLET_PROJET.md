# Atlas Voyage — état complet du projet

> **Phase 17 livrée, Novembre 2026 : 126 endpoints REST, 40 entités JPA, 397 tests d'intégration JUnit 5 verts (100% succès), suite E2E de recette 100% passante (39/39), 0 violation d'intégrité BDD, décision GO SOUS CONDITIONS pour la release v1.0.0-rc1.**
> **Chantiers majeurs intégrés :**
> - **Phase 17 (Recette Finale & Démonstration) :** Plan de recette complet (`docs/recette/plan_de_recette.md`), matrice de traçabilité des exigences (`matrice_tracabilite.md`), 52 cas de test qualifiés par rôle (`docs/recette/cas_de_test/`), registre exhaustif des anomalies et dérogations (`registre_anomalies.md`), checklist technique exhaustive (`checklist_technique.md`), cahier des vérifications humaines obligatoires (`humain_a_realiser.md`), procès-verbal formel Go / No-Go (`decision_go_no_go.md`), rapport final de recette (`rapport_final_recette.md`), scénario de démo minuté de 10 minutes (`docs/demo/scenario_10_min.md`), 4 plans B testés (`plan_b.md`), checklist du Jour J (`checklist_jour_j.md`), FAQ jury de 18 questions techniques (`questions_reponses.md`), suite de tests E2E Chromium avec 39 captures de preuves graphiques (`e2e/recette/runner.mjs`), scripts d'intégrité SQL (`check_integrity.mjs`), scan de mock data (`find_mock_data.mjs`), test de vitesse d'installation (`fresh_install_test.mjs`), réinitialisation démo express en 0,44s (`reset_demo.mjs`), et commande globale `npm run recette:all`.
> - **Phase 15 (Documentation & Docs-as-Code) :** Portail centralisé `docs/README.md`, contrat OpenAPI 3.0.3 complet (`docs/api/openapi.yaml`), collection Postman synchronisée (18 dossiers, 181 requêtes), 10 ADRs au format MADR, diagramme entité-relation Mermaid et dictionnaire des données (40 entités), manuel d'exploitation exhaustif et runbooks opérationnels (`docs/exploitation/`), manuels d'utilisation par rôle (`docs/manuel/`), fichiers communautaires (`CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`), et outillage d'automatisation et de validation CI (`npm run docs:check`).
> - **Phase 14 (Internationalisation & Devises) :** Trilingue FR / EN / AR avec support RTL complet, 19 namespaces JSON (parité 100%), formats régionaux stricts, conversion de devises indicatives (EUR, USD, GBP) et règle d'or financière MAD stricte.
> - **Phase 12 (Design, UX, Accessibilité & Composants) :** Design system `av-*` avec CSS `@layer`, palette marocaine, Dark mode sans FOUT, conformité certifiée 100% WCAG 2.1 AA (0 violation sur 14 pages), carte Leaflet 1.9.4 auto-hébergée, Lightbox tactile, module complet d'avis clients vérifiés et modérés, formulaire de contact sécurisé.
> - **Phase 10 (Sécurité & Robustesse OWASP Top 10) :** Cookies `HttpOnly`/`Secure`/`SameSite=Lax`, rotation des refresh tokens avec détection de rejeu, double-submit CSRF, Bucket4j rate limiting (HTTP 429), lockout compte 5 échecs, politique de mot de passe forte, module RGPD / Loi 09-08 complet.
> - **Phases 1 à 9 :** Offres datées en Single Table Inheritance (`OfferAvailability`), catalogue unique, panier connecté, bundles, réservations transactionnelles, paiements sandbox et espèces, notifications in-app/mail, statistiques réelles et exports CSV, tickets de support, favoris, journal d'audit append-only et paramètres globaux.
> 
> **Source de vérité :** Le code source exécutable (Spring Boot 3.3.4, Vanilla JS ES2022) et les tests automatisés font autorité.
> Règles actuelles : [regles_metier.md](regles_metier.md) — Architecture : [architecture.md](architecture.md).

## 1. Présentation générale

Atlas Voyage est une plateforme web de voyage composée de :

- un site public accessible aux invités et aux utilisateurs connectés ;
- un catalogue unique pour les hôtels et riads, vols, voitures, taxis/transferts et excursions ;
- un espace client ;
- un espace fournisseur ;
- un espace agent ;
- un espace administrateur ;
- une API REST Spring Boot ;
- une base de données MySQL.

L’objectif retenu est d’avoir **une seule source publique pour les offres** : `frontend/accueil.html` et `frontend/catalogue.html`. L’ancien catalogue intégré au dashboard client n’est plus utilisé comme deuxième catalogue.

### URLs principales

| Zone | URL locale |
|---|---|
| Accueil public | `http://127.0.0.1:5500/frontend/accueil.html` |
| Catalogue par catégorie | `http://127.0.0.1:5500/frontend/catalogue.html?type=...` |
| Connexion | `http://127.0.0.1:5500/frontend/connexion.html` |
| Détail d’une offre | `http://127.0.0.1:5500/frontend/offre.html?id=...` |
| Panier public/client | `http://127.0.0.1:5500/frontend/panier.html` |
| Administration | `http://127.0.0.1:5500/frontend/admin/index.html` |
| Fournisseur | `http://127.0.0.1:5500/frontend/supplier/index.html` |
| Agent | `http://127.0.0.1:5500/frontend/agent/index.html` |
| Client | `http://127.0.0.1:5500/frontend/client/index.html` |
| API Backend | `http://localhost:8080` |

---

## 2. Stack technique

### Frontend

- HTML5 ;
- CSS3 ;
- JavaScript vanilla ;
- Tailwind chargé par CDN dans certains espaces ;
- Lucide Icons chargé par CDN ;
- stockage de session avec `localStorage` ou `sessionStorage` ;
- appels HTTP avec `fetch`.

### Backend

- Java 21 ;
- Spring Boot 3.3.4 ;
- Spring Web ;
- Spring Data JPA ;
- Spring Security ;
- Jakarta Validation ;
- JWT avec JJWT 0.12.6 ;
- BCrypt pour les mots de passe ;
- Maven Wrapper.

### Données et tests

- MySQL en développement ;
- H2 en mémoire pour les tests ;
- Flyway V1–V9 historique ; Phase 6 scripts SQL manuels et Hibernate `update` en dev, `validate` en prod ;
- JUnit 5, Spring Boot Test et Spring Security Test.

---

## 3. Architecture des dossiers

```text
travel-agency-app/
├── backend/
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/
│       ├── main/java/com/agence/voyage/
│       │   ├── config/       configuration et seeder
│       │   ├── controller/   contrôleurs REST
│       │   ├── dto/          objets d’entrée/sortie API
│       │   ├── entity/       entités JPA
│       │   ├── exception/    erreurs métier et handler global
│       │   ├── repository/   repositories Spring Data
│       │   ├── security/     JWT et authentification
│       │   └── service/      logique métier
│       └── test/             tests automatisés
├── frontend/
│   ├── accueil.html
│   ├── catalogue.html
│   ├── offre.html
│   ├── panier.html
│   ├── connexion.html
│   ├── admin/
│   ├── agent/
│   ├── client/
│   ├── supplier/
│   ├── css/
│   ├── images/
│   └── js/
├── docs/
├── scripts/
└── README.md
```

Le Backend respecte le découpage classique :

```text
Controller → Service → Repository → Base de données
           ↕
          DTO
```

---

## 4. Rôles et autorisations

L’énumération `Role` contient :

- `ADMIN` ;
- `SUPPLIER` ;
- `AGENT` ;
- `CLIENT`.

### Matrice des droits

| Fonction | Invité | Client | Fournisseur | Agent | Admin |
|---|---:|---:|---:|---:|---:|
| Consulter le catalogue | Oui | Oui | Oui | Oui | Oui |
| Consulter une offre | Oui | Oui | Oui | Oui | Oui |
| Créer un compte client | Oui | — | — | — | — |
| Gérer son panier | Non | Oui | Non | Non | Non |
| Créer/modifier ses offres | Non | Non | Oui | Non | Non |
| Gérer ses bundles | Non | Non | Non | Oui | Non |
| Gérer les utilisateurs | Non | Non | Non | Non | Oui |
| Gérer les codes promo | Non | Non | Non | Non | Oui |
| Modérer les offres | Non | Non | Non | Non | Oui |

### Séparation des fournisseurs

Un fournisseur n’est plus autorisé à créer les cinq types d’offres. Le champ `User.supplierCategory` définit sa spécialité :

- `HOTEL` ;
- `FLIGHT` ;
- `CAR` ;
- `TAXI_TRANSFER` ;
- `EXCURSION`.

Le Frontend n’affiche que le type autorisé. Le Backend vérifie également la catégorie, ce qui empêche le contournement par un appel API manuel.

---

## 5. Authentification et sécurité

### Fonctionnement

1. L’utilisateur se connecte avec `POST /api/auth/login`.
2. Le Backend vérifie le mot de passe BCrypt.
3. Un JWT signé est renvoyé avec les informations publiques de l’utilisateur.
4. Le Frontend sauvegarde le jeton.
5. `api.js` ajoute `Authorization: Bearer <token>` aux requêtes.
6. Le filtre JWT recharge l’utilisateur depuis la base.
7. Un compte archivé est refusé même si son ancien token n’est pas expiré.

### Paramètres actuels

- expiration JWT : 24 heures ;
- API stateless ;
- CSRF désactivé pour l’API REST ;
- CORS autorisé pour les origines de développement ;
- routes protégées par rôle ;
- contrôle de propriété pour les offres et bundles ;
- inscription publique forcée au rôle `CLIENT`.

### Composants Frontend

- `frontend/js/core/auth.js` : connexion, inscription, session, déconnexion et garde par rôle ;
- `frontend/js/core/api.js` : appels HTTP, Bearer token et gestion des `401` ;
- `frontend/js/core/config.js` : URL de l’API.

---

## 6. Comptes de démonstration

Mot de passe commun : `password123`.

| Rôle / spécialité | Email |
|---|---|
| Administrateur | `omar.tazi@atlasvoyage.ma` |
| Agent | `nadia.elfassi@atlasvoyage.ma` |
| Client | `sarah.benali@example.com` |
| Fournisseur Hôtels & Riads | `karim.idrissi@atlasvoyage.ma` |
| Fournisseur Vols | `vols@atlasvoyage.ma` |
| Fournisseur Voitures | `voitures@atlasvoyage.ma` |
| Fournisseur Taxi/Transferts | `transferts@atlasvoyage.ma` |
| Fournisseur Excursions | `excursions@atlasvoyage.ma` |

Le `DataSeeder` crée ou met à jour ces comptes de manière idempotente au démarrage.

---

## 7. Modèle de données

### 7.1 User

Champs principaux :

- `id` ;
- `fullName` ;
- `email` unique ;
- `password` haché ;
- `role` ;
- `supplierCategory` pour les fournisseurs ;
- `archived`.

### 7.2 City

- `id` ;
- `name` unique ;
- `latitude` ;
- `longitude`.

Les villes sont recherchées via Open-Meteo. Lorsqu’un fournisseur enregistre une offre, le Backend réutilise une ville existante ou la crée avec ses coordonnées.

### 7.3 Offer

`Offer` est une classe abstraite stockée avec une stratégie JPA `SINGLE_TABLE`. La colonne discriminante est `offer_type`.

Champs communs :

- titre ;
- description ;
- prix de base ;
- paiement à l’arrivée autorisé ou non ;
- statut actif/inactif ;
- ville ;
- fournisseur propriétaire ;
- images, maximum cinq ;
- périodes de disponibilité ;
- informations de modération.

Le champ historique `stock` est conservé seulement pour la compatibilité interne. La disponibilité fonctionnelle repose sur les périodes datées et leur capacité.

### 7.4 OfferAvailability

Chaque offre peut contenir plusieurs périodes :

- `startAt` : début ;
- `endAt` : fin ;
- `capacity` : capacité disponible.

Règles :

- fin strictement postérieure au début ;
- capacité supérieure ou égale à 1 ;
- périodes d’une même offre non chevauchantes ;
- une recherche avec dates doit être couverte par une période ;
- une offre inactive n’est jamais disponible.

### 7.5 Flight

Champs spécifiques :

- compagnie aérienne ;
- numéro de vol ;
- ville/aéroport de départ ;
- ville/aéroport d’arrivée ;
- date et heure de départ aller ;
- date et heure d’arrivée aller ;
- aller simple ou aller-retour ;
- dates et heures du retour ;
- classe : `ECONOMY`, `PREMIUM_ECONOMY`, `BUSINESS`, `FIRST`.

Les dates doivent être chronologiquement cohérentes. Les disponibilités doivent couvrir le départ aller et, si nécessaire, le départ retour.

### 7.6 Hotel

Champs spécifiques :

- nombre d’étoiles, entre 1 et 5 ;
- type de chambre ;
- adresse.

### 7.7 Car

Champs spécifiques :

- marque ;
- modèle ;
- transmission ;
- nombre de places ;
- lieu de prise en charge ;
- autorisation d’une restitution différente ;
- plusieurs lieux de restitution autorisés ;
- âge minimum du conducteur ;
- âge maximum du conducteur.

Les lieux multiples sont stockés dans `car_dropoff_locations`. Une voiture accepte jusqu’à 20 lieux de restitution distincts.

### 7.8 TaxiTransfer

- lieu de prise en charge ;
- lieu de dépose ;
- type de véhicule.

### 7.9 Excursion

- durée en heures ;
- guide inclus ;
- transport inclus ;
- itinéraire.

### 7.10 Autres entités

- `Bundle` : regroupement d’offres créé par un agent avec remise ;
- `Cart` : panier unique d’un client ;
- `CartItem` : offre ou bundle, quantité et critères de voyage JSON ;
- `PromoCode` : remise fixe ou en pourcentage, expiration et statut ;
- `Booking`, `BookingItem`, `BookingItemAllocation`, `BookingSequence` : réservations multi-lignes et allocations ;
- `Payment` : tentatives CARD/CASH_ON_ARRIVAL, montants décimaux et remboursements ;
- `PaymentEvent`, `WebhookEvent`, `IdempotencyRecord`, `AuditLog` : traçabilité, déduplication et réponses figées ;
- `Notification` : messages privés typés, liens internes, lecture, références et déduplication ; préférences et marqueurs de livraison associés (section 35).

Les trois dernières entités existent dans le modèle, mais leurs parcours complets ne sont pas encore tous exposés par des contrôleurs REST dédiés.

---

## 8. Gestion des offres fournisseur

### Formulaire en quatre étapes

1. Type et informations générales ;
2. détails spécifiques au type ;
3. images ;
4. tarif et disponibilités.

La barre des étapes utilise toute la largeur disponible. Un conflit CSS avec un ancien composant `.stepper` a été supprimé.

### Fonctions disponibles

- création ;
- modification ;
- suppression si aucune relation ne bloque la suppression ;
- désactivation en alternative à la suppression ;
- vue tableau ou grille ;
- recherche et filtres ;
- calendrier des disponibilités ;
- plusieurs périodes avec capacité ;
- aperçu en direct ;
- cinq images maximum ;
- validation Frontend et Backend.

### Propriété et modération

- un fournisseur ne voit que ses offres ;
- il ne peut modifier ou supprimer que ses offres ;
- il ne peut créer que le type correspondant à sa spécialité ;
- un fournisseur ne peut pas réactiver une offre désactivée par l’administration sans respecter les règles de modération.

---

## 9. Recherche géographique avec Open-Meteo

L’API utilisée est :

```text
https://geocoding-api.open-meteo.com/v1/search
```

Elle est utilisée dans les champs géographiques des interfaces :

- ville générale de l’offre ;
- départ et destination des vols ;
- prise en charge des voitures ;
- chaque lieu de restitution d’une voiture ;
- départ et destination des taxis/transferts ;
- destination des hôtels ;
- destination des excursions ;
- champs publics de recherche ;
- profil fournisseur ;
- ajout/modification de ville côté administration.

Dans les formulaires fournisseur, une saisie libre n’est pas suffisante : l’utilisateur doit sélectionner une suggestion pour les champs contrôlés.

---

## 10. Recherche publique par catégorie

### 10.1 Accueil

L’accueil est une page neutre : aucun onglet n’est présélectionné et la grande recherche spécialisée n’est pas affichée avant le choix d’une catégorie. La navigation des catégories est centrée.

L’ordre commence par :

1. Hôtels & Riads ;
2. Vols ;
3. Location de voiture ;
4. Taxi/Transferts ;
5. Excursions.

La section « Offres disponibles » sépare les offres par catégorie.

### 10.2 Hôtels & Riads

Critères :

- destination ;
- date d’arrivée ;
- date de départ ;
- voyageurs/chambres ;
- voyage professionnel.

La recherche reste sur la même page de catalogue et remplace le contenu inférieur par les résultats.

### 10.3 Vols

Critères :

- aller simple ou aller-retour ;
- départ ;
- destination ;
- date aller ;
- date retour ;
- nombre de passagers ;
- classe de voyage ;
- capacité disponible.

### 10.4 Location de voiture

Critères :

- lieu de prise en charge ;
- date et heure de prise en charge ;
- date et heure de restitution ;
- restitution dans un autre endroit ;
- destination parmi les lieux autorisés ;
- conducteur entre 30 et 65 ans ;
- disponibilité couvrant toute la durée.

### 10.5 Taxi/Transferts

Critères :

- aller simple ou aller-retour ;
- lieu de prise en charge ;
- destination ;
- date et heure ;
- retour éventuel ;
- passagers.

### 10.6 Excursions

Critères :

- destination ;
- date ;
- participants ;
- guide ;
- transport.

---

## 11. Catalogue et panier

### Catalogue

Le catalogue charge les offres avec `GET /api/offers/search` et applique :

- type ;
- ville ;
- prix maximum ;
- paiement à l’arrivée ;
- dates ;
- tri ;
- pagination ;
- critères spécialisés par catégorie.

Seules les offres actives avec une disponibilité suffisante sont proposées.

### Panier

- invité : panier local dans le navigateur ;
- client connecté : panier persistant via `/api/cart` ;
- ajout d’une offre ou d’un bundle ;
- modification de quantité ;
- suppression d’une ligne ;
- vidage ;
- code promo ;
- conservation des critères de voyage ;
- vérification des dates et capacités par le Backend.

---

## 12. Administration

### Utilisateurs

- liste ;
- recherche ;
- filtre par rôle ;
- création ;
- modification ;
- archivage/restauration ;
- suppression définitive sous conditions ;
- sélection obligatoire de la spécialité pour un fournisseur.

### Offres

- liste réelle depuis l’API ;
- indicateurs ;
- filtres ;
- pagination ;
- détails communs et spécifiques ;
- affichage des disponibilités ;
- affichage des multiples lieux de restitution voiture ;
- activation/désactivation ;
- motif de modération ;
- date et administrateur de modération.

### Codes promo

- CRUD ;
- type fixe ou pourcentage ;
- date d’expiration ;
- activation/désactivation ;
- contraintes métier.

### Villes

Le code actuel contient encore le module administratif des villes avec recherche API. En parallèle, les fournisseurs peuvent créer automatiquement une ville au moment d’enregistrer une offre. Cette coexistence doit être prise en compte si le module administratif doit finalement être entièrement retiré de l’interface.

---

## 13. Espace fournisseur

Pages disponibles :

- tableau de bord ;
- mes offres ;
- nouvelle offre ;
- disponibilités ;
- réservations reçues ;
- profil fournisseur.

Le chargement initial :

- vérifie le token ;
- recharge `/api/auth/me` ;
- vérifie le rôle ;
- vérifie la spécialité ;
- affiche une erreur explicite avec « Réessayer » et « Se reconnecter » au lieu de rester vide.

Le bug d’initialisation où `newDraft()` lisait `state` avant sa création a été corrigé.

### Filtres des disponibilités

- texte ;
- type ;
- ville ;
- disponible maintenant ;
- à venir ;
- sans disponibilité ;
- inactive ;
- horizon 7, 30 ou 90 jours ;
- tri par titre, date, capacité ou ville.

---

## 14. Espace agent

L’agent peut gérer les bundles :

- liste ;
- création ;
- modification ;
- suppression ;
- sélection d’offres ;
- remise ;
- contrôle de propriété par l’API.

Les réservations, paiements et tickets agent sont reliés aux API Booking/Payment/Ticket ; notifications et préférences sont reliées à l'API.

---

## 15. Espace client

Le dashboard client ne contient plus un second catalogue d’offres. Les liens vers :

- Hôtels & Riads ;
- Vols ;
- Location de voiture ;
- Taxi/Transferts ;
- Excursions

renvoient vers le catalogue public unique.

Le panier, le checkout, la confirmation, le dashboard, les réservations, les notifications et le profil utilisent l’API. Les tickets restent des maquettes.

---

## 16. API REST actuelle

L’API contient **85 endpoints** (13 routes Phase 6 détaillées dans api_endpoints.md).

### Statut

- `GET /api/status`

### Authentification

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Utilisateurs

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `POST /api/users/{id}/archive`
- `POST /api/users/{id}/restore`
- `DELETE /api/users/{id}`

### Villes

- `GET /api/cities`
- `GET /api/cities/{id}`
- `POST /api/cities`
- `PUT /api/cities/{id}`
- `DELETE /api/cities/{id}`

### Offres

- `GET /api/offers`
- `GET /api/offers/search`
- `GET /api/offers/{id}`
- `POST /api/offers`
- `PUT /api/offers/{id}`
- `DELETE /api/offers/{id}`
- `POST /api/offers/{id}/moderation`

### Bundles

- `GET /api/bundles`
- `GET /api/bundles/{id}`
- `POST /api/bundles`
- `PUT /api/bundles/{id}`
- `DELETE /api/bundles/{id}`

### Panier

- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/{itemId}`
- `DELETE /api/cart/items/{itemId}`
- `DELETE /api/cart`
- `POST /api/cart/promo`
- `DELETE /api/cart/promo`

### Codes promo

- `GET /api/promo-codes`
- `GET /api/promo-codes/{id}`
- `POST /api/promo-codes`
- `PUT /api/promo-codes/{id}`
- `DELETE /api/promo-codes/{id}`

---

## 17. Seeder Backend

`DataSeeder` s’exécute au démarrage et est idempotent.

Il crée :

- les huit comptes de démonstration ;
- cinq villes de base ;
- dix offres, soit deux par catégorie ;
- des périodes relatives à la date courante ;
- des champs réalistes par type ;
- les multiples lieux de restitution pour les voitures.

Les offres existantes reconnues par leur titre sont réaffectées au fournisseur spécialisé correspondant. Les anciennes voitures seedées reçoivent également les nouveaux critères.

Un second seeder historique existe :

```powershell
python scripts/seed_demo_data.py
```

Il sert au jeu de démonstration étendu. Il faut éviter de confondre ses données avec celles créées automatiquement par `DataSeeder`.

---

## 18. Migrations SQL

| Fichier | Objet |
|---|---|
| `migration_offer_moderation.sql` | modération des offres |
| `migration_offer_availabilities.sql` | périodes de disponibilité |
| `migration_flight_search_criteria.sql` | aller-retour et classe des vols |
| `migration_supplier_categories.sql` | spécialité des fournisseurs |
| `migration_car_search_criteria.sql` | critères de location de voiture |
| `migration_car_multiple_dropoffs.sql` | multiples lieux de restitution |
| `migration_cart_travel_criteria.sql` | critères de voyage dans le panier |
| `migration_promo_code_constraints.sql` | contraintes codes promo |
| `migration_remove_destination.sql` | ancienne évolution de destination |

Depuis la Phase 1, Flyway gère les migrations et Hibernate valide le schéma.
Les scripts historiques ci-dessus sont archivés dans `docs/legacy-migrations/`.
Les procédures applicables sont décrites dans [migrations.md](migrations.md).

---

## 19. Lancement du projet

### Prérequis

- JDK 21 ;
- MySQL ou MariaDB ;
- Python 3 ou Live Server pour le Frontend.

### Base

Configuration actuelle :

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/travel_agency_db?useSSL=false&serverTimezone=UTC&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=validate
```

### Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Vérification :

```text
http://localhost:8080/api/status
```

### Frontend depuis la racine du projet

```powershell
python -m http.server 5500
```

Puis :

```text
http://127.0.0.1:5500/frontend/accueil.html
```

Si `frontend/` est directement la racine du serveur, l’URL devient `http://127.0.0.1:5500/accueil.html`. Il faut rester cohérent avec le mode choisi.

### Après une évolution Backend

Arrêter puis redémarrer Spring Boot afin que :

- le code recompilé soit chargé ;
- Flyway migre le schéma puis Hibernate le valide ;
- `DataSeeder` synchronise les comptes et offres.

### Après une évolution Frontend

Utiliser `Ctrl + F5` si le navigateur garde une ancienne version en cache. Des paramètres `?v=...` sont utilisés sur les scripts principaux pour limiter ce problème.

---

## 20. Tests et validation

Commande :

```powershell
cd backend
.\mvnw.cmd test
```

État au 30 octobre 2026 :

```text
Tests : 310 (248 antérieurs et 62 nouveaux Phase 6 ; adaptations de fixtures de mots de passe et du second e-mail d'inscription documentées dans rapport_phase6.md)
Échecs : 0
Erreurs : 0
Ignorés : 0
```

Vérifications Frontend utilisées :

```powershell
node --check frontend/js/app.js
node --check frontend/supplier/js/app.js
node --check frontend/admin/js/app.js
```

Un script de smoke test existe également : `scripts/frontend_smoke_test.mjs`.

---

## 21. État réel : fonctionnel et maquettes

### Relié au Backend

- authentification et inscription client ;
- utilisateurs administrateur ;
- spécialisations fournisseur ;
- CRUD des offres fournisseur ;
- disponibilités ;
- recherche catalogue ;
- modération des offres ;
- bundles agent ;
- panier client ;
- codes promo ;
- villes et géocodage ;
- règles de sécurité et propriété ;
- statistiques par rôle, graphiques et exports CSV admin ;
- réservations, paiements sandbox, vouchers PDF/QR et notifications in-app/SMTP.
- profils personnels, avatars et profil légal fournisseur persistants ;
- changement/réinitialisation de mot de passe, révocation JWT et vérification d'e-mail ;
- upload JPEG/PNG/WebP, réencodage, miniatures, rattachement et nettoyage d'orphelins.

### Encore partiellement simulé ou incomplet

- prestataire bancaire réel (Stripe/CMI), hors sandbox ;
- module de tickets persistant avec fil de discussion et notifications (relié API) ;

- déploiement SMTP externe (envoi multipart fonctionnel, désactivé par défaut) ;
- paiement externe ;
- stockage cloud S3/Cloudinary (interface locale prête, implémentation non livrée).

Les interfaces correspondantes peuvent exister visuellement, mais certaines utilisent encore des données statiques.

---

## 22. Points techniques importants

1. Ne pas réintroduire un catalogue séparé dans le dashboard client.
2. Ne pas utiliser `stock` comme concept visible : utiliser les disponibilités et capacités.
3. Toujours vérifier la spécialité fournisseur côté Backend.
4. Toujours vérifier le propriétaire avant modification/suppression.
5. Pour une ville, conserver la sélection API et les coordonnées.
6. Pour une voiture, vérifier toute la durée et tous les lieux de restitution autorisés.
7. Pour un vol, vérifier trajet, classe, passagers et dates aller/retour.
8. Conserver les définitions de CA/périodes de statistiques.md ; ne pas inventer de données pour les domaines absents.
9. Mettre à jour les migrations et seeders pour toute évolution du modèle.
10. Relancer tous les tests (310 à la fin de la Phase 6) après toute modification Backend.

---

## 23. Fichiers de référence

- [Règles métier définitives — Phase 1](regles_metier.md).
- [Migrations Flyway](migrations.md).
- [Rapport Phase 1](rapport_phase1.md).
- [Rapport Phase 2 et fichiers modifiés](rapport_phase2.md).

- `README.md` : démarrage rapide et comptes ;
- `docs/ETAT_COMPLET_PROJET.md` : présent document ;
- `docs/api_endpoints.md` : contrat actuel des 85 endpoints, erreurs, pagination et disponibilités ;
- `docs/profils_securite_images.md` : profils, sécurité, stockage et configuration Phase 6 ;
- `docs/rapport_phase6.md` : fichiers modifiés, tests, décisions et limites ;
- `docs/statistiques.md` et `docs/rapport_phase5.md` : dashboards, calculs, cache, CSV, démonstration et vérifications ;
- `docs/rapport_phase3.md` : livraison Paiements, inventaire, preuves et limites ;
- `docs/notifications.md` : modèle, événements, API, SMTP, Mailpit et politique de rétention ;
- `docs/rapport_phase4.md` : livraison Notifications, fichiers et résultats ;
- `docs/architecture.md` : architecture générale ;
- `docs/cahier_de_charges.md` : exigences ;
- `docs/postman/AtlasVoyage.postman_collection.json` : collection Postman ;
- `backend/src/main/java/com/agence/voyage/config/DataSeeder.java` : données automatiques ;
- `backend/src/main/resources/application.properties` : configuration Backend ;
- `frontend/js/app.js` : site public et recherches ;
- `frontend/supplier/js/app.js` : gestion des offres fournisseur ;
- `frontend/admin/js/app.js` : administration.

---

## 24. Résumé des principales évolutions réalisées

- accueil public conservé comme point d’entrée commun ;
- suppression du doublon de catalogue dans l’espace client ;
- navigation de catégories centrée avec Hôtels & Riads en premier ;
- pages de recherche attractives pour les cinq catégories ;
- résultats affichés dans le même catalogue ;
- géocodage mondial Open-Meteo ;
- gestion complète des offres administrateur ;
- remplacement du stock visible par des disponibilités datées ;
- filtres avancés dans l’inventaire fournisseur ;
- critères de vol complets ;
- critères de voiture complets ;
- multiples lieux de restitution ;
- fournisseurs séparés par spécialité ;
- seeders et comptes mis à jour ;
- migrations SQL ajoutées ;
- correction du chargement vide de l’espace fournisseur ;
- correction et élargissement de la barre des étapes ;
- validation automatisée avec 104 tests réussis à la fin de la Phase 1.

---

## 25. Inventaire détaillé des maquettes et écrans

Cette section décrit ce qui est présent visuellement dans les maquettes. La colonne **Source** distingue :

- **API** : données réellement chargées ou modifiées dans le Backend ;
- **Hybride** : une partie utilise l’API et une partie reste statique ;
- **Maquette** : données écrites dans le JavaScript, boutons simulés ou simples notifications visuelles.

### 25.1 Structure visuelle commune des espaces privés

Les quatre espaces privés partagent les principes suivants :

- en-tête bleu Atlas Voyage ;
- logo ;
- bouton de réduction du menu latéral ;
- cloche de notifications ;
- menu du compte connecté ;
- bouton de déconnexion ;
- navigation SPA avec paramètre `?page=...` ;
- cartes blanches avec ombres légères ;
- badges colorés pour les statuts ;
- tableaux et filtres ;
- notifications toast ;
- modales et panneaux latéraux pour certains détails.

La réduction du menu latéral est seulement un comportement Frontend. La protection de chaque espace est effectuée avec `Auth.requireRole()`.

---

## 26. Maquettes du site public

### 26.1 En-tête public

Éléments visibles :

- logo Atlas Voyage ;
- sélecteur de devise ;
- panier avec compteur ;
- connexion ou raccourci vers l’espace de l’utilisateur connecté ;
- barre des catégories centrée ;
- icônes par catégorie.

Catégories :

- Hôtels & Riads ;
- Vols ;
- Location de voiture ;
- Taxi/Transferts ;
- Excursions.

Le sélecteur de devise effectue une conversion Frontend indicative avec des taux constants. Ce n’est pas une conversion bancaire temps réel.

### 26.2 Accueil public

Contenu visuel :

- grande image marocaine avec voile bleu ;
- slogan « Le Maroc vous attend. Vivez-le pleinement. » ;
- texte d’introduction ;
- éléments de confiance ;
- catégories de services ;
- offres disponibles séparées par catégorie ;
- destinations et visuels marocains ;
- pied de page.

L’accueil reste volontairement neutre : aucune catégorie n’est sélectionnée automatiquement.

### 26.3 Catalogue

Contenu :

- hero différent selon la catégorie ;
- formulaire spécialisé ;
- filtres latéraux ;
- prix maximum ;
- types ;
- ville ;
- paiement à l’arrivée ;
- tri ;
- cartes d’offres ;
- image, titre, ville, description, prix et disponibilité ;
- pagination ;
- état vide ;
- état d’erreur API.

Source : **API** pour les offres, puis filtrage spécialisé Frontend.

### 26.4 Détail d’une offre

Éléments :

- galerie d’images ;
- miniatures sélectionnables ;
- catégorie et ville ;
- titre et fournisseur ;
- prix ;
- description ;
- caractéristiques du type ;
- disponibilité ;
- quantité ;
- ajout au panier ;
- indicateur de paiement à l’arrivée ;
- favoris visuels ;
- retour vers le catalogue.

Source : **API** pour l’offre et le panier. Le favori reste visuel et n’est pas persisté.

### 26.5 Panier public

Pour un invité :

- contenu sauvegardé localement ;
- quantités ;
- suppression ;
- total ;
- bouton de poursuite.

Pour un client connecté :

- contenu chargé depuis l’API ;
- vérification des capacités ;
- code promo ;
- sous-total, remise et total.

### 26.6 Connexion

Éléments :

- onglet connexion ;
- onglet création de compte ;
- email ;
- mot de passe ;
- nom complet à l’inscription ;
- option « Se souvenir de moi » ;
- messages d’erreur ;
- redirection selon le rôle.

Source : **API**.

---

## 27. Maquettes de l’espace administrateur

Navigation actuelle :

- Tableau de bord ;
- Utilisateurs ;
- Codes promo ;
- Offres ;
- Réservations ;
- Tickets ;
- Journal d’audit ;
- Paramètres ;
- Notifications ;
- Profil.

### 27.1 Tableau de bord administrateur — API

API /api/stats/admin : utilisateurs/nouveaux comptes, réservations, CA TTC, attente
et panier moyen comparés ; doughnuts rôles/statuts, série CA, tops villes/offres,
promotions et alertes calculées. Sélecteur 7j/30j/12m, Actualiser, exports CSV avec
dates/statut. Les listes de gestion restent sur la page Réservations.

### 27.2 Utilisateurs — API

Éléments :

- recherche nom/email ;
- filtre par rôle ;
- filtre actifs/archivés ;
- pagination ;
- création d’un compte ;
- formulaire nom, email, rôle, mot de passe ;
- spécialité obligatoire pour un fournisseur ;
- modification ;
- archivage ;
- restauration ;
- suppression définitive.

Source : **API**.

### 27.3 Codes promo — API

Éléments :

- liste ;
- recherche et filtres ;
- type de remise ;
- valeur ;
- date d’expiration ;
- statut ;
- création ;
- modification ;
- activation/désactivation ;
- suppression.

Source : **API**.

### 27.4 Supervision des offres — API

Éléments :

- KPI des offres ;
- recherche par titre, ville ou fournisseur ;
- filtre par type ;
- filtre par fournisseur ;
- filtre par état ;
- tableau paginé ;
- image, titre, ville, type, fournisseur et prix ;
- périodes de disponibilité ;
- détail complet dans une modale ;
- caractéristiques propres au type ;
- plusieurs lieux de restitution voiture ;
- désactivation/réactivation ;
- motif de modération.

Source : **API**.

### 27.5 Villes — Hybride

Éléments présents dans le code :

- liste et recherche ;
- pays et code ISO ;
- coordonnées ;
- présence d’aéroport ;
- nombre d’offres ;
- ajout/modification avec géocodage ;
- aperçu géographique ;
- détection d’aéroport.

La base simple `City` ne contient que nom, latitude et longitude. Plusieurs informations affichées dans cette maquette sont donc enrichies ou statiques côté Frontend. Source : **Hybride**.

### 27.6 Réservations administrateur — API

GET /api/bookings/admin : filtres statut, paiement, client, référence, fournisseur,
dates et tri ; pagination ; détail, annulation motivée et voucher.
Le détail inclut les tentatives et événements Payment. ADMIN peut rembourser
avec montant/motif ; l'API reste l'autorité sur le solde. La page Paiements
ajoute une liste réelle filtrée par statut, méthode et dates, avec historique.

### 27.7 Tickets administrateur — Maquette

Éléments :

- tickets ouverts ;
- priorité ;
- demandeur ;
- assignation ;
- statut ;
- raccourcis d’action.

Il n’existe pas encore de contrôleur REST de tickets. Source : **Maquette**.

### 27.8 Journal d’audit — API réelle (Phase 8)

Présente une chronologie exhaustive et immuable d’actions sensibles (connexions, comptes, offres, codes promo, paramètres, paiements, exports) avec acteur, rôle, type de ressource, date, description, adresse IP, User-Agent, et visualiseur de différences JSON avant/après. Filtres multicritères, pagination et export CSV sécurisé contre l'injection de formules (`GET /api/audit/export`). Source : **API réelle**.

### 27.9 Paramètres globaux — API réelle (Phase 8)

Présente les paramètres métier globaux persistés en base de données et mis en cache mémoire :
- Délais et alertes : annulation client (`booking.cancellation.deadline.hours`), alerte disponibilité (`availability.expiration.alert.days`) ;
- Capacités : panier (`cart.items.max`), images par offre (`offers.images.max`) ;
- Paiement : encaissement espèces à l'arrivée (`payment.cash.enabled`), devise par défaut (`payment.currency.default`) ;
- Maintenance globale : activation (`platform.maintenance.enabled` avec dialogue de confirmation) et message personnalisable (`platform.maintenance.message`). Filtre HTTP 503 actif sur le Backend.
- Modifications unitaires ou en masse atomique (`PUT /api/settings`). Suivi des modifications par auteur et date. Source : **API réelle**.

### 27.10 Notifications et profil — API

La page Notifications, la cloche et les préférences utilisent l'API du sujet JWT,
avec pagination, filtres, lecture/suppression et e-mails par catégorie. Aucun
accès aux notifications des autres comptes, même pour ADMIN. Le profil personnel
est persistant : nom, téléphone, pays, avatar uploadé et onglet Sécurité fonctionnel.

## 28. Maquettes de l’espace fournisseur

Navigation :

- Tableau de bord ;
- Mes offres ;
- Nouvelle offre ;
- Disponibilités ;
- Réservations reçues ;
- Notifications ;
- Profil fournisseur.

### 28.1 Tableau de bord fournisseur — API

API /api/stats/supplier : nom réel, offres actives/inactives, réservations période/mois,
revenu de ses seules lignes, graphique six mois, disponibilités à vérifier avec
lien filtré offerId, cinq réservations et notifications récentes. Aucun montant
des autres fournisseurs.

### 28.2 Mes offres — API

Éléments :

- vue tableau/grille ;
- recherche ;
- statut ;
- tri par date ou prix ;
- image ;
- type ;
- prix ;
- nombre de périodes ;
- activation ;
- modification ;
- suppression ;
- état vide et erreur API.

La liste est limitée au fournisseur connecté. Source : **API**.

### 28.3 Nouvelle offre — API

Barre de quatre étapes :

1. type et informations générales ;
2. détails spécialisés ;
3. images ;
4. tarif et disponibilités.

Éléments généraux :

- catégorie imposée par la spécialité ;
- titre ;
- ville Open-Meteo ;
- description ;
- aperçu en direct ;
- images ;
- prix ;
- paiement à l’arrivée ;
- actif/inactif ;
- périodes et capacités.

Champs spécialisés :

- vol : trajet, compagnie, numéro, classe et dates ;
- hôtel : étoiles, chambre et adresse ;
- voiture : véhicule, prise en charge, âge et lieux multiples ;
- taxi : prise en charge, destination et véhicule ;
- excursion : durée, guide, transport et itinéraire.

Source : **API**.

### 28.4 Disponibilités — API

Tableau avec statut actuel, prochaine période et capacité. Filtres détaillés par texte, type, ville, état, horizon et tri. Source : **API**.

### 28.5 Réservations reçues — API

Recherche par référence/client, statuts, période et pagination. Détail filtré aux offres du compte, montants de ses lignes et quote-part promo. Email, autres lignes et critères masqués. Fiche imprimable ; aucun accès au voucher global.

### 28.6 Notifications fournisseur — API

Module NotificationsUI partagé : cloche à compteur réel et panneau des10derniers,
page paginée, filtres, lecture, suppression et préférences persistées. Les événements
Booking/Payment sont limités aux prestations du compte ; modération avec motif,
alertes de capacité et d'expiration. Aucun compteur ou message statique.

### 28.7 Profil fournisseur — API persistante

Éléments :

- logo ;
- raison sociale ;
- email ;
- téléphone ;
- ville avec recherche Open-Meteo ;
- adresse ;
- description ;
- onglet sécurité ;
- changement de mot de passe réel avec révocation des anciennes sessions ;
- informations légales : forme juridique, RC, ICE (15 chiffres), IF et notes.

Le profil est persisté dans SupplierProfile, avec logo propre au fournisseur,
ville sélectionnée Open-Meteo et données légales. Source : **API** (Phase 6).

---

## 29. Maquettes de l’espace agent

Navigation :

- Tableau de bord ;
- Bundles ;
- Réservations ;
- Paiements à l’arrivée ;
- Tickets de support ;
- Notifications ;
- Profil.

### 29.1 Tableau de bord agent — API

API /api/stats/agent : attente, espèces à encaisser, créations du jour, cinq
réservations et paiements à venir. Tickets available=false et « Bientôt disponible ».
Les actions de gestion restent dans les pages Réservations et Paiements.

### 29.2 Bundles — API

Éléments :

- liste des bundles de l’agent ;
- vue carte ;
- prix calculé ;
- remise ;
- offres incluses ;
- création ;
- modification ;
- suppression ;
- sélection d’offres ;
- résumé avant enregistrement.

Source : **API**.

### 29.3 Réservations agent — API

GET /api/bookings/admin avec filtres avancés, détail en dialogue, confirmation réelle et annulation réelle avec motif obligatoire.

### 29.4 Paiements à l’arrivée — API

Source : **API Payment / SANDBOX**, écran désormais fonctionnel. Onglets À encaisser
et Historique, recherche par référence/client, pagination et filtres.
Le tiroir présente les montants réels et événements ; Encaisser ouvre une modale
avec montant exact non modifiable et note facultative. La clé idempotente est
conservée après une erreur réseau. L'historique AGENT ne montre que ses encaissements ;
ADMIN voit l'ensemble. Aucune ligne financière statique.

### 29.5 Notifications et profil — API ; tickets — Maquette

Les tickets sont reliés à l'API /api/tickets (file d'attente, filtres, réponses, notes internes, auto-assignation, statistiques). Le profil et sa sécurité utilisent l'API Phase 6.
La page Notifications et la cloche sont
reliées à l'API : nouvelles réservations/annulations, messages de compte et futurs
tickets assignés. Les préférences sont persistées et le polling est nettoyé à la
déconnexion.

## 30. Maquettes de l’espace client

Navigation principale :

- Dashboard ;
- Panier ;
- Mes réservations ;
- Mes tickets ;
- Mon profil.

Les anciennes entrées « catalogue » redirigent vers l’accueil public afin d’éviter un deuxième catalogue.

### 30.1 Dashboard client — API

API /api/stats/client : prochain voyage confirmé futur, cinq réservations de la
période, notifications non lues, totaux et dépenses nettes personnels. Comparaison
de période et état vide avec lien vers le catalogue public, sans second catalogue.

### 30.2 Panier client — API

Éléments :

- lignes d’offres ou bundles ;
- critères de voyage ;
- quantités ;
- suppression ;
- vidage ;
- code promo ;
- sous-total ;
- réduction ;
- total ;
- choix du paiement.

Source : **API**.

### 30.3 Checkout — API

Panier réel, méthodes ONLINE/PAY_ON_ARRIVAL, arrivée disponible seulement si toutes
les offres l'autorisent ; contact/note et bouton anti double-clic. POST /api/bookings
vide le panier atomiquement puis dirige vers la nouvelle page Paiement.
Celle-ci charge Booking et les tentatives Payment, montre le bandeau SANDBOX, les
cartes de test, le compte à rebours, les erreurs et les actions de reprise.
PAN/CVC restent dans le navigateur, sont convertis en jeton puis effacés.

### 30.4 Confirmation — API

Référence et état réellement relus en base. Le reçu affiche montant payé,
remboursements, méthode et au maximum marque/4 chiffres. Une confirmation cash
indique 0 MAD encaissé tant qu'un agent n'a pas encaissé. Voucher PDF/QR authentifié
si confirmé/terminé. Un paramètre URL status=success ne peut pas fabriquer un succès.

### 30.5 Mes réservations et détail — API

Onglets de statut, recherche, tri, dates et pagination. Détail avec chronologie, annulation conditionnée par canCancel et dialogue, voucher. Chargement, état vide et erreur réessayable.

### 30.6 Tickets client — Maquette

Création de ticket, fil de discussion en temps réel, filtres et changement de statut reliés à /api/tickets. Source : **API**.

### 30.7 Profil client — API

Éléments :

- avatar ;
- prénom et nom ;
- email non modifiable ;
- téléphone ;
- pays ;
- informations de sécurité ;
- date réelle du dernier changement de mot de passe ;
- contact du support.

Le bouton enregistre le profil ; avatar téléversé, nom, téléphone et pays persistent
après reconnexion. L'onglet Sécurité vérifie l'ancien mot de passe et remplace le JWT.
Source : **API**.

---

### 30.8 Notifications client — API

Entrée Notifications dédiée dans le menu client, cloche et panneau accessibles au
clavier. Compteur et messages chargés depuis l'API ; bienvenue, réservations,
paiements, annulation et préférences. Une navigation reconstruit proprement la
cloche sans multiplier les timers. Aucun second catalogue introduit.

## 31. Données statiques utilisées dans les maquettes

Les pages Tickets, paramètres globaux et journal d'audit visuel
contiennent encore des exemples de présentation. Ils ne prouvent pas une
persistance métier. Les données statiques des réservations, paiements,
notifications, profils et quatre dashboards ont été remplacées par leurs API réelles.
Les graphiques et tops du dashboard sont calculés depuis la base ; les exemples
DEMO affichés proviennent eux aussi de réservations persistées et identifiées.

## Phase 5 — état livré et références

72 opérations API, 248 tests (222 antérieurs conservés et 26 nouveaux).
V9 ajoute les dates utilisateur/index ; Flyway + validate conservés. Les dates
inconnues des anciens comptes sont signalées comme estimées. Cache admin local
deux minutes et autorisation avant cache, autres rôles sans cache.

StatsDemoSeeder dev ajoute jusqu'à 60 exemples historiques sur douze mois et un
second client, avec paiements et allocations cohérents, sans doubler les comptes
ou exemples existants. Les tickets restent explicitement available=false dans
les statistiques. Les notifications et vouchers sont opérationnels.

- [Calculs, contrats, démonstration et limites](statistiques.md)
- [Rapport, fichiers et vérifications](rapport_phase5.md)
- [Règles statistiques](regles_metier.md#statistiques--phase-5)
- [Migration V9](migrations.md#phase-5--v9-statistiques)

---

## 32. Correspondance maquette → Backend à développer

| Maquette | Backend nécessaire |
|---|---|
| Réservations client/fournisseur/agent/admin | Livré Phase 2 : BookingController, DTO, droits et services transactionnels |
| Confirmation de checkout | Livré Phase 2 : création atomique depuis le panier |
| Tickets | Livré : TicketController, DTO, machine à états, permissions, notifications et UI client/fournisseur/agent/admin |
| Dashboards | Livrés : agrégats SQL par rôle, six routes stats/CSV, Chart.js ; voir statistiques.md |
| Profils | Livrés Phase 6 : DTO personnel et SupplierProfile, propriété, données légales |
| Mot de passe | Livré Phase 6 : changement, oubli/reset, vérification e-mail et tokenVersion |
| Upload d’image | Livré Phase 6 : stockage local, type réel, dimensions, réencodage ; cloud à venir |
| Favoris | entité et endpoints par client |
| Audit global | Interface admin et extension aux actions hors paiement ; modèle et audit paiement déjà livrés |
| Paramètres globaux | entité de configuration et cache |

Cette table constitue la transition directe entre les écrans déjà dessinés et les prochaines fonctionnalités à implémenter.

## 33. Module Réservations livré

Modèle : Booking avec référence unique, client lazy, statuts séparés, montants
DECIMAL(12,2), snapshots promo, serviceStartAt/serviceEndAt, dates de cycle,
auteur/motif, expiration, contact/note, version et items. Tables booking_items,
booking_allocations et booking_sequence ; disponibilités désormais identifiées.
Les anciennes colonnes Booking restent physiquement conservées pour l'adoption.

BookingService recharge et verrouille le panier, déploie les bundles, valide
chaque service, verrouille les périodes en ordre constant, cumule les quantités,
recalcule prix/promo, génère la référence et vide le panier dans une transaction.
Annulation/expiration restituent exactement les allocations non encore restituées.
Les jobs traitent des lots limités, une transaction par réservation, et sont désactivés en test.

Les exemples Phase 2 présents restent conservés. DemoBookingSeeder ajoute désormais
quatre scénarios de paiement pour Sarah sans écraser son panier (section 34).
Les allocations restent cohérentes ; un redémarrage ne recrée pas les scénarios.
Un callback pré-V4 évite l’ambiguïté des noms de contraintes CHECK historiques
MariaDB ; V6 rétablit la contrainte de dates. VOUCHER_SECRET est obligatoire en production ; aucun secret réel ajouté au dépôt.

Les 8 routes Booking, critères, DTO et codes stables sont détaillés dans
[api_endpoints.md](api_endpoints.md#réservations--phase-2-8-endpoints).
Les 35 nouveaux tests couvrent succès, rollback, concurrence, référence annuelle,
spécialisations, accès, PDF, seeder et pagination ; les 104 tests antérieurs
restent inchangés. [Rapport complet](rapport_phase2.md).

Livrés en Phase 3 : gateway sandbox, webhook, capture, encaissement, remboursement
et audit des paiements. Restent : prestataire bancaire réel,
tickets et audit global ; les profils enrichis sont livrés en Phase 6.

## 34. Module Paiements livré — Phase 3

### Données persistées

Payment : ManyToOne Booking/client, CARD ou CASH_ON_ARRIVAL, statut, montant,
remboursé, réservé pour remboursement concurrent, MAD, provider/providerReference,
clé idempotente, carte masquée, codes/messages d'échec, collectedBy, dates et version.
active_booking_id unique nullable protège un seul paiement actif/capturé par Booking.

PaymentEvent et AuditLog append-only, protégés aussi par triggers MySQL/MariaDB.
WebhookEvent conserve l'empreinte du corps, l'unicité prestataire/événement et
l'état de traitement. IdempotencyRecord conserve empreinte, endpoint, utilisateur,
réponse figée et expiration 24 h. V7 reprend les paiements anciens sans suppression.

### Traitement

PaymentService orchestre deux transactions courtes autour de PaymentGateway :
verrou Booking, validation, PROCESSING, commit ; appel sandbox hors transaction ;
application du résultat, événement/audit et Booking synchronisés.
PaymentTransactions, PaymentLedger, PaymentIdempotency et PaymentQueries séparent
les mutations, le journal, le rejeu et les lectures. Les remboursements réservent
le solde avant l'appel. Les captures tardives sont compensées sans double restitution.

PaymentWebhookService : HMAC et horodatage, déduplication, états monotones.
PaymentExpirationJob remplace la planification d'expiration Booking sans doubler
les traitements. Carte refusée : Booking reste PENDING, nouvelle tentative possible.
Espèces : Booking CONFIRMED, Payment PENDING jusqu'à encaissement AGENT/ADMIN.
Annulation payée : état PAID conservé ; seul remboursement effectif modifie cet état.

### Démonstration et écrans

Quatre scénarios Sarah, identifiés par notes demo:payment:phase3:* et badge
Démonstration : carte PAID, cash PENDING, carte FAILED, carte PARTIALLY_REFUNDED.
Références normales BK-AAAA-NNNNNN ; pas de réinitialisation au redémarrage.
Seuls ces marqueurs servent à l'idempotence du seeder. Ne pas les recréer par
scripts/seed_demo_data.py.

Le module partagé frontend/js/core/payments.js et payments.css fournit paiement,
reçu, listes, modales, événements, reprises réseau et badge sandbox. Le fournisseur
ne charge pas de données carte. Les pages payment/confirmation et tableaux privés
utilisent exclusivement les réponses API. Les montants historiques des graphiques
hors périmètre et les tickets restent des maquettes distinctes.

### Routes ajoutées et vérification

11 nouvelles routes : POST/GET /api/payments ; GET /{id}, /{id}/events, /mine,
/admin, /cash-pending, /cash-history ; POST /{id}/refund, /{id}/collect-cash,
/webhook. Total historique Phase3 : 59 opérations OpenAPI ; Phase4 ajoute7routes (66au total).

190 tests, aucun échec/erreur ; couverture de chaque nouveau service >80 %.
Contrôles navigateur réels : catalogue/panier/checkout/carte/confirmation/voucher,
refus et reprise, réponse réseau perdue, cash agent, remboursement admin et
vue fournisseur. Contrôles HTTP concurrents également exécutés sur MariaDB.
Base vide migrée puis base existante V6 adoptée en V7 avec sauvegarde préalable.
Voir [rapport Phase 3](rapport_phase3.md), [règles](regles_metier.md) et
[contrat des 11 routes](api_endpoints.md#paiements--phase-3-11-endpoints).

## 35. Module Notifications livré — Phase 4

### État réellement constaté et périmètre

Le prompt évoquait40endpoints/72tests et des modules Booking/Payment absents.
Le dépôt livré Phase3 comptait59endpoints/190tests et ces deux modules complets.
Ils sont réutilisés et publient leurs événements ; Ticket demeure absent, sans
contrôleur ajouté. Le listener TicketRepliedEvent est opérationnel et testé
avec des événements manuels. Total actuel :66endpoints,222tests.

### Backend et données

Notification enrichie : propriétaire lazy, type/catégorie, titre/message, lien sûr,
état lu/date de lecture, référence et clé de déduplication. Préférences séparées
par utilisateur, défauts paresseux et catégories e-mail. notification_dispatches
assure la déduplication même lorsque le canal in-app est désactivé.

ApplicationEventPublisher et listeners AFTER_COMMIT : aucune notification après
rollback métier ; transactions REQUIRES_NEW par destinataire ; exceptions isolées.
JavaMailSender et Thymeleaf produisent des messages multipart, variables échappées,
sur un exécuteur dédié avec deux tentatives maximum. SMTP désactivé par défaut.
Les e-mails ACCOUNT contournent les préférences e-mail, mais pas l'arrêt global.

Destinataires : client et fournisseurs concernés pour les étapes Booking/Payment ;
agents actifs pour création/annulation ; fournisseur seul pour modération/disponibilité ;
jamais un utilisateur archivé. Les messages fournisseur ne citent pas les autres
prestations. Un même destinataire est dédupliqué avant envoi.

AvailabilityAlertService reconstitue la capacité de référence depuis résiduel et
allocations non restituées. Seuil20% ou2unités, fin sous3jours, clés par période/palier.
Purge lus90jours et tous180jours. Tous ces seuils sont configurables.
Les schedulers Notifications sont désactivés dans le profil test.

### Interfaces

frontend/js/core/notifications.js et frontend/css/notifications.css sont chargés
dans les quatre espaces. Suppression des listes, toasts et compteurs factices.
Cloche : badge réel0/99+,10derniers messages, lecture/navigation, tout lire et page complète.
Page :20messages, filtres, suppression, squelettes, vide, erreur réessayable,
préférences persistées. Titres/messages utilisent textContent, liens revalidés.
Polling30s ou60s si masqué, pas d'appels de compteur parallèles, timer unique,
arrêt à la déconnexion et au remplacement de l'en-tête client.

### Migration, seeder et vérifications

V8__notifications.sql ajoute colonnes/index, préférences et marqueurs, préserve
les anciennes notifications et adopte la FK utilisateur historique. Les migrations
V1–V7 n'ont pas changé ; validate conservé. Démarrage réussi sur base vide et
base de travail V7 après sauvegarde. Redémarrage sans doublon.

DataSeeder appelle NotificationDemoSeeder :16notifications fixes pour les8comptes,
états lu/non lu, dates échelonnées et préférences ; pas d'e-mail par ce seeder.
Les exemples métier nouveaux produisent aussi leurs notifications réelles.

222tests verts, dont32nouveaux sur les événements, destinataires, rollback, pannes,
déduplication concurrente, droits, préférences, SMTP, purge et seeder.
Mailpit a reçu réellement5e-mails HTML/texte pour inscription/création/confirmation/
paiement/annulation lors du contrôle API isolé. Les tests navigateur vérifient le
polling après modération, lecture au clic, Échap/focus, les quatre pages et préférences.
Le smoke test couvre désormais21pages ; les parcours de paiement Phase3 restent verts.

Références : [Notifications](notifications.md), [API](api_endpoints.md#notifications--phase-4-7-endpoints),
[rapport Phase4](rapport_phase4.md).

## 36. Phase 6 — profils, sécurité et images livrés

État actuel : **85 opérations REST, 310 tests verts**. Les comptages des sections
Phase 4/5 ci-dessus décrivent leur livraison historique. Aucune réservation,
paiement, notification, statistique ou page de profil ne repose sur des lignes
statiques. Tickets, paramètres globaux et audit visuel hors paiement restent distincts.

### Backend

- User : phone, country ISO, avatarUrl, emailVerified, tokenVersion interne,
  passwordChangedAt et updatedAt ; DTO enrichis sans secret.
- SupplierProfile : société, contact, ville sélectionnée et coordonnées, adresse,
  description, logo et informations légales ; propriété contrôlée, lecture ADMIN.
- PasswordPolicy à toutes les écritures, aucun changement de complexité au login ;
  JWT tv, révocation des sessions, changement et réinitialisation.
- Tables password_reset_tokens/email_verification_tokens : SHA-256, usage unique,
  TTL 30 min/24 h, limite 5/15 min IP et identité, purge quotidienne.
- MailService SMTP asynchrone après commit, HTML/texte échappés ; logs complets
  uniquement en développement hors prod si SMTP désactivé.
- FileAsset et stockage local découplé : JPEG/PNG/WebP réencodés, original/miniature,
  droits purpose/propriétaire, quota, limites avant décodage, EXIF supprimé.
- Rattachement TEMP/ATTACHED, cinq images, conservation des anciennes URLs exactes,
  nettoyage horaire 24 h et réconciliation dry-run.

### Frontend et contrats

Modules partagés account.js/uploader.js et account.css. Quatre profils et Sécurité
réels ; société/légal fournisseur, avatars/logos dans les en-têtes. Wizard étape 3 :
aperçu immédiat, progression, annulation/réessai, ordre souris/clavier, cinq images,
blocage pendant upload. Auth : force en direct, oubli, reset, vérification, bandeau
et renvoi ; token retiré des URLs de sécurité. Les assets sont publics, sous UUID.

13 nouvelles routes détaillées dans [api_endpoints.md](api_endpoints.md) et Postman.
Nouveaux codes d'erreur dans le format commun ; 413/429 lisibles, Retry-After
exposé à CORS, JWT obsolète 401 avec retour connexion. Les anciennes routes sont
conservées ; les fixtures de création utilisent désormais des mots de passe forts.

### Schéma et vérifications

La Phase 6 suit la consigne de scripts manuels (backend/scripts/migrations), sans
nouvelle version Flyway ; V1–V9 inchangées. Dev `update`, prod `validate`.
Scripts à exécuter avant le premier démarrage sur une base existante pour conserver
les e-mails historiques vérifiés. Cinq fournisseurs réels initialisés, aucun mot
de passe de démo ni tokenVersion réinitialisé au redémarrage.

Tests : 248 antérieurs conservés/adaptés lorsque nécessaire + 62 nouveaux.
API et navigateur quatre rôles, parcours d'auth complet, cinq images visibles
sur offre publique, SMTP Mailpit HTML/texte, bases vide/existante et répétition SQL,
32 pages smoke et 19 fichiers JS syntaxiquement valides. Les contrôles de paiement,
notifications et statistiques restent verts.

Références : [Profils/sécurité/images](profils_securite_images.md),
[rapport complet et inventaire](rapport_phase6.md), [migrations](migrations.md).

## 37. Phase 9 — Nettoyage des incohérences existantes

État actuel : **105 opérations REST, 374 tests verts**.

### 37.1 Module Villes et normalisation anti-doublons
- `City` enrichi : `country` (« Maroc »), `countryCode` (« MA »), `hasAirport` (booléen) et calcul de `offerCount` (sans N+1).
- Normalisation systématique via `CityNormalizer` (accents, espaces, minuscules, arrondi coordonnées).
- Colonne `normalized_name` avec contrainte unique en base `uk_cities_normalized_name`.
- Rejet de la suppression d'une ville référencée par des offres avec HTTP 409 Conflict.
- Gestion sûre de la concurrence en cas d'insertion simultanée de la même ville.

### 37.2 Élimination définitive du champ stock
- Retrait du champ `stock` et de sa colonne de base de données dans `Offer`.
- Gestion souple de la compatibilité ascendante : `@JsonIgnoreProperties(ignoreUnknown = true)` sur `OfferRequest`.
- Bascule des DTOs et services (`CartService`, `BundleResponse`, `CartResponse`) vers le modèle exclusif de disponibilités et capacités.
- Retrait complet du stock dans l'interface fournisseur.

### 37.3 Seeder unique et migrations Flyway
- Unification dans `DataSeeder.java` idempotent avec support de `app.seed.extended`.
- Archivage du script Python obsolète `scripts/seed_demo_data.py` dans `scripts/legacy/`.
- Consolidation des migrations ordonnées `V1` à `V10` dans `backend/src/main/resources/db/migration/`.
- Archivage des 15 scripts SQL manuels dans `docs/legacy-sql/` avec `README.md`.

### 37.4 Factorisation Vanilla JS et géocodage Open-Meteo
- Création de modules transverses partagés dans `frontend/js/shared/` : `dom.js`, `format.js`, `toast.js`, `modal.js`, `states.js`.
- Intégration sur l'ensemble des pages publiques et espaces privés.
- Client `geocoding.js` avec debounce (300 ms), timeout (5 s), retry automatique, cache mémoire + sessionStorage et fallback `/api/cities`.
- Isolation des jeux de données de démonstration dans `frontend/js/mock/demo-data.js`.

Références : [Rapport Phase 9](rapport_phase9.md).

---

## 38. Phase 10 : Sécurité et Robustesse (OWASP Top 10)

État actuel : **110+ opérations REST, 380+ tests verts**.

### 38.1 Authentification par Cookies Sécurisés et Refresh Tokens
- Élimination totale des tokens JWT du `localStorage` et du `sessionStorage` (prévention des vols XSS).
- Cookie d'accès `atlas_access_token` (15 min) et cookie de rafraîchissement `atlas_refresh_token` (7 jours) en `HttpOnly`, `Secure`, `SameSite=Lax`.
- Refresh token opaque SHA-256 avec rotation à chaque rafraîchissement et détection de rejeu : l'utilisation d'un token déjà révoqué invalide immédiatement toute la famille (`familyId`) et incrémente le `tokenVersion` de l'utilisateur.
- Endpoints de gestion de session : `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/logout-all`.

### 38.2 Protection CSRF Double-Submit
- `CsrfCookieFilter` avec `CookieCsrfTokenRepository.withHttpOnlyFalse()` exposant le cookie `XSRF-TOKEN` pour les requêtes SPA.
- Validation obligatoire de l'en-tête `X-XSRF-TOKEN` sur toutes les requêtes de mutation (`POST`, `PUT`, `PATCH`, `DELETE`) portant un cookie d'authentification.
- Intercepteur `frontend/js/core/api.js` configuré avec `credentials: 'include'` et injection systématique de l'en-tête CSRF.

### 38.3 Protection Anti-Brute-Force et Limitation de Débit
- `RateLimitingFilter` (Bucket4j) : limitation à 5 req/min par IP sur `/api/auth/*` et 100 req/min sur l'API, avec code `429 Too Many Requests` et en-tête `Retry-After`.
- Compteur `failedLoginAttempts` et verrouillage temporaire (`lockedUntil` à 15 min) dès 5 échecs consécutifs d'authentification.
- Messages d'erreur uniformes "Identifiants invalides" garantissant l'absence totale d'énumération d'utilisateurs.
- Endpoint d'administration pour lever le verrouillage : `POST /api/users/{id}/unlock`.

### 38.4 Politique de Mots de Passe Forte
- Service `PasswordPolicy` et validateur Jakarta `@StrongPassword` : min 12, max 128 caractères, 3 des 4 catégories (minuscules, majuscules, chiffres, caractères spéciaux).
- Dictionnaire de mots de passe triviaux interdits (`common-passwords.txt`) et exclusion stricte des segments d'email et noms complets.

### 38.5 Module RGPD / CNDP (Loi 09-08)
- Consentement explicite aux CGU et à la Politique de Confidentialité lors de l'inscription (`consentAt`, `consentVersion`).
- Pages légales dédiées : `frontend/cgu.html` et `frontend/confidentialite.html`.
- Portabilité des données : `GET /api/users/me/export` (export JSON complet de l'historique sans données secrètes).
- Droit à l'oubli : `DELETE /api/users/me` avec confirmation par mot de passe, anonymisation irréversible et purge automatique des comptes inactifs > 36 mois.

### 38.6 Hardening Production & Sauvegardes
- `ProductionEnvironmentValidator` : refus strict de démarrer en profil `prod` en cas de configuration non sécurisée.
- Actuator restreint : `/actuator/health` et `/actuator/info` seuls autorisés en `permitAll()`, métriques et administration réservées aux administrateurs.
- Scripts de sauvegarde et restauration MySQL : `backup_mysql.ps1`, `backup_mysql.sh`, `restore_mysql.ps1`, `test_restore_mysql.ps1`.
- Dossier de documentation sécurité exhaustif : `docs/securite/` (`modele_menaces_stride.md`, `guide_variables_environnement.md`, `nginx_headers.conf`, `procedure_rotation_secrets.md`, `procedure_reponse_incidents.md`, `mysql_app_user.sql`, `matrice_autorisations.md`, `sauvegardes.md`).

---

## 39. Phase 12 : Design, UX, Accessibilité & Responsive (WCAG 2.1 AA)

État actuel : **120+ opérations REST, 390+ tests verts**.

### 39.1 Design System Atlas Voyage & Thèmes
- **Tokens CSS & Couches `@layer` :** Création du système complet dans `frontend/css/design-system/` (`tokens.css`, `themes.css`, `base.css`, `components.css`, `utilities.css`, `legacy.css`) et consolidé dans `frontend/css/av.css`.
- **Palette marocaine & Identité visuelle :** Bleu Majorelle (#0055A5), Ambre Sahara (#D97706 / #B45309), Terre Cuite (#C2410C), Émeraude Atlas (#059669), Nuances d'ardoise et de sable.
- **Mode Sombre / Clair sans FOUT :** Initialisation synchrone en tête de `<head>` (`frontend/js/shared/theme.js`) via `localStorage` ou préférence système `prefers-color-scheme`.
- **Catalogue vivant des composants :** `frontend/design-system/index.html` exposant tous les composants `av-*` (boutons, champs, badges, cartes, tableaux, modales, tiroirs, toasts, accordéons, barres d'étapes, etc.).

### 39.2 Refonte Front-End & Expérience Utilisateur
- **Pages publiques modernisées :** `accueil.html`, `catalogue.html`, `offre.html`, `panier.html`, `connexion.html` intégrées avec design tokens, liens d'évitement (`.av-skip-link`) et balisage sémantique complet.
- **Tunnel de réservation en 4 étapes :** `av-stepper` interactif dans `panier.html` (Panier → Coordonnées → Options → Paiement) avec panneau récapitulatif sticky sur grand écran.
- **Visionneuse plein écran accessible :** `frontend/js/shared/lightbox.js` avec piège de focus, navigation clavier (Flèches, +, -, Échap) et swipe tactile sur mobile.
- **Carte interactive auto-hébergée :** `frontend/js/shared/map.js` avec Leaflet 1.9.4 localisé (`frontend/vendor/leaflet/`) sans dépendance CDN externe et alternative textuelle WAI-ARIA.
- **Pages institutionnelles & utilitaires :** `a-propos.html`, `contact.html`, `faq.html` (accordéons filtrables en direct), `404.html`, `500.html`.
- **Harmonisation des espaces privés :** En-têtes, thèmes, navigation et contrastes unifiés sur `client/`, `supplier/`, `agent/` et `admin/`.

### 39.3 Module Avis & Notations (Reviews)
- **Modèle relationnel et contraintes :** Entité `Review` rattachée à une réservation (`Booking`) obligatoire au statut `COMPLETED`, avec note de 1 à 5 étoiles, titre, commentaire et contrainte d'unicité `(booking_id, offer_id)`.
- **Filtrage automatique et modération :** Détection automatique des mots sensibles/injurieux faisant basculer l'avis en `PENDING` pour modération administrative avec journalisation dans `AuditLog` (`REVIEW_MODERATED`).
- **Interaction fournisseurs & signalements :** Réponse officielle du prestataire (`POST /api/reviews/{id}/reply`) et signalement communautaire (`POST /api/reviews/{id}/report`) basculant automatiquement l'avis en modération dès 3 signalements.
- **Calcul dynamique et tri catalogue :** Recalcul instantané de `averageRating` et `reviewCount` sur `Offer`, intégration du tri par note dans l'API (`sort=rating_desc`, `sort=rating_asc`) et affichage des avis via `frontend/js/shared/reviews.js`.

### 39.4 Contact & Sécurité Anti-Spam
- **Endpoint de contact :** `POST /api/contact` associé à l'entité `ContactMessage`.
- **Protection Honeypot :** Piège de pot de miel silencieux (`_hp`) interceptant les robots de spam sans pénaliser l'ergonomie utilisateur ni recourir à des captchas tiers invasifs.

### 39.5 Accessibilité WCAG 2.1 AA & Documentation Design
- **Audit automatisé axe-core :** **0 violation critique, 0 violation sérieuse** sur l'ensemble des 14 pages (100% de conformité).
- **Contraste des couleurs :** Ratio ≥ 7.0:1 pour les textes secondaires, ≥ 15.4:1 pour les textes primaires, ≥ 3.0:1 pour les contrôles d'interface.
- **Documentation dédiée dans `docs/design/` :**
  - `audit_initial.md` : Bilan des 25 violations d'accessibilité identifiées au départ.
  - `audit_axe_final.json` : Résultat brut certifié 0 violation sur 14 pages.
  - `direction_artistique.md` : Principes visuels, typographie et grille.
  - `palette.md` : Tableau exhaustif des couleurs et ratios de contraste mesurés.
  - `guide_composants.md` : Documentation technique de chaque composant `av-*`.
  - `accessibilite.md` : Déclaration de conformité WCAG 2.1 AA.
  - `credits_images.md` : Licences Unsplash, Lucide et Leaflet.
- **Preuves visuelles :** 42 captures d'écran responsives générées dans `docs/design/screenshots/after/` (360px, 768px, 1280px).

---

## 40. Phase 14 : Internationalisation & Devises (i18n / l10n / RTL)

État actuel : **125+ opérations REST, 397+ tests verts (100% de succès)**.

### 40.1 Vision Produit & Règle d'Or Financière
- **Trois langues supportées :** Français (`fr`, langue source légale et de référence), Anglais (`en`) et Arabe (`ar` avec RTL complet).
- **Règle d'or financière non négociable :** Tous les montants en base de données, réservations, articles du panier et règlements bancaires sont **100% en Dirhams Marocains (MAD)**. Aucune transaction réelle n'est effectuée en devise étrangère.
- **Devises indicatives :** L'Euro (`EUR`), le Dollar (`USD`) et la Livre Sterling (`GBP`) sont convertis à titre purement indicatif selon les cours récents, avec affichage obligatoire d'un astérisque/badge explicatif et mention légale avant paiement.

### 40.2 Infrastructure Front-End & Dictionnaires Multilingues
- **Moteur i18n Vanilla (`frontend/js/shared/i18n.js`) :**
  - Sans compilation ni framework.
  - Résolution de langue en cascade : URL `?lang=` -> `localStorage` -> Cookie `atlas_lang` -> `User.preferredLanguage` -> `navigator.language` -> repli `fr`.
  - Interpolation sécurisée anti-XSS avec assainissement HTML sur liste blanche stricte (`strong`, `em`, `b`, `i`, `a`, `br`).
  - Prise en charge des **6 formes grammaticales de pluriels arabes** (`zero`, `one`, `two`, `few`, `many`, `other`) via `Intl.PluralRules(locale)`.
  - Mode pseudo-localisation dev `en-XA` activable par `?pseudo=1` pour traquer les chaînes en dur et tester l'expansion visuelle (+30%).
  - Attributs déclaratifs HTML (`data-i18n`, `data-i18n-attr`, `data-i18n-html`) et méthode `applyTranslations(root)`.
  - Composant sélecteur de langue accessible WCAG 2.1 AA (`I18n.renderLanguageSwitcher()`).
- **19 Namespaces JSON (`frontend/locales/{fr,en,ar}/`) :**
  - `common.json`, `nav.json`, `home.json`, `catalog.json`, `offer.json`, `cart.json`, `checkout.json`, `auth.json`, `client.json`, `supplier.json`, `agent.json`, `admin.json`, `status.json`, `errors.json`, `validation.json`, `seo.json`, `legal.json`, `faq.json`, `contact.json`.
  - **Parité stricte à 100% validée** par le script d'automatisation `scripts/i18n/check.mjs`.

### 40.3 Backend Multilingue, Messages & Données Dynamiques (Java 21 / Spring Boot 3.3.4)
- **Configuration i18n (`I18nConfig.java`) :**
  - `LocaleResolver` gérant le paramètre `?lang=`, l'en-tête standard `Accept-Language` et repli sur `Locale.FRENCH`.
  - `ReloadableResourceBundleMessageSource` en UTF-8 pour `messages_fr.properties`, `messages_en.properties`, `messages_ar.properties`.
  - Intercepteur HTTP injectant automatiquement `Content-Language` et `Vary: Accept-Language`.
- **Gestionnaire d'exceptions localisé :** `GlobalExceptionHandler` résout les messages d'erreurs et de validation en fonction de la locale demandée.
- **Préférences régionales utilisateur :** Champs `preferredLanguage` (défaut "fr") et `preferredCurrency` (défaut "MAD") ajoutés à l'entité `User`, exposés dans `UserResponse` et administrables via `PUT /api/users/me/preferences`.
- **Traductions dynamiques d'offres (`OfferTranslation`) :**
  - Table SQL `offer_translations` avec contrainte unique `(offer_id, locale)`.
  - Routes d'API : `GET /api/offers/{id}?lang=...`, `GET /api/offers/{id}/translations`, `PUT /api/offers/{id}/translations/{locale}`, `DELETE /api/offers/{id}/translations/{locale}`.
- **Villes multilingues (`CityTranslation`) :**
  - Table SQL `city_translations` avec contrainte unique `(city_id, locale)`.
  - Route d'API `GET /api/cities?lang=...` renvoyant le champ `localizedName` (ex. « مراكش » en arabe).
- **Service de devises & Cache (`CurrencyService.java`) :**
  - Route publique `GET /api/currencies/rates` renvoyant les cours indicatifs par rapport au MAD.
  - Cache mémoire Caffeine haute performance (`currencyRates`) configuré dans `StatsConfig.java`.
- **Migration de base de données :** Script `scripts/migrations/V14__i18n_user_preferences_offer_and_city_translations.sql`.
- **Tests d'intégration backend :** `I18nBackendIntegrationTest.java` validant l'ensemble des contrôleurs et services i18n.

### 40.4 Formats Régionaux, Devises & Support RTL Intégral
- **Formatage localisé (`frontend/js/shared/format.js`) :**
  - Dates, heures, durées et montants formatés via l'Intl API.
  - Locale arabe marocaine normalisée `ar-MA-u-nu-latn-ca-gregory` garantissant l'utilisation des chiffres occidentaux (0-9) et du calendrier grégorien.
- **Module de devises (`frontend/js/shared/currency.js`) :**
  - Taux en mémoire, persistance locale, bascule réactive (`currency:change`).
  - Sélecteur de devise accessible (`AtlasCurrency.renderCurrencySwitcher()`).
  - Formatage protecteur avec astérisque indicatif obligatoire hors MAD.
- **Feuille de styles RTL (`frontend/css/rtl.css`) intégrée à `av.css` :**
  - Direction RTL et typographie arabe (Cairo, Noto Sans Arabic).
  - Inversion miroir horizontale des icônes directionnelles (`arrow-left`, `arrow-right`, `chevron`, steppers) tout en préservant les icônes neutres.
  - Positionnement logique des boutons fermer, menus contextuels et tiroirs latéraux.

### 40.5 Expérience Utilisateur Multilingue Transversale
- **Site public & Pages d'erreur :**
  - Navigation, en-têtes et pieds de page équipés des sélecteurs de langue et de devises.
  - Pages légales (`cgu.html`, `confidentialite.html`) avec encadré explicite de projet technique non certifié et clause d'intégrité de paiement en MAD.
  - Pages d'erreur `404.html` et `500.html` complètement traduites.
- **Espaces privés (`client/`, `supplier/`, `agent/`, `admin/`) :**
  - En-têtes intégrant les sélecteurs de langue et de devise.
  - Onglet « Préférences » ajouté à `AccountUI` pour tous les profils avec synchronisation directe en base.
  - Wizard d'offres fournisseur (Étape 1) doté d'onglets de traduction pour rédiger les titres et descriptions en français, anglais et arabe.

### 40.6 Documentation Maîtresse dans `docs/i18n/`
- `audit_initial.md` : Cartographie initiale des chaînes en dur, propriétés physiques CSS et messages d'erreur.
- `glossaire.md` : Terminologie officielle trilingue (FR / EN / AR) pour les concepts touristiques marocains.
- `etat_traductions.md` : Inventaire exhaustif des 19 namespaces et statut de relecture.
- `guide_i18n.md` : Guide d'architecture et manuel pour les développeurs (`I18n.t`, `I18n.plural`, ajout d'une langue).
- `rtl_guide.md` : Règles de conception RTL, propriétés CSS logiques et typographie arabe.
- `devises.md` : Architecture financière, règle d'or MAD, cache Caffeine et disclaimers légaux.

---

## 41. Phase 15 : Documentation & Docs-as-Code (Novembre 2026)

État actuel : **126 endpoints REST documentés et vérifiés, 40 entités JPA modélisées, 397 tests JUnit 5 verts, chronomètre d'installation < 10 min validé (~12s de build)**.

L'objectif de la Phase 15 est d'établir un référentiel documentaire complet, rigoureux, vérifiable automatiquement (« docs-as-code ») et strictement aligné avec le code source réel.

### 41.1 Livrables Documentaires Réalisés
1. **Portail documentaire & Conventions :**
   - [`docs/README.md`](README.md) : Index central organisé par persona (Développeur, Contributeur, Exploitant/Ops, Utilisateur par rôle, Auditeur sécurité).
   - [`docs/conventions_documentation.md`](conventions_documentation.md) : Règles rédactionnelles, statuts explicites (`✅ Implémenté`, `🟡 Partiel`, `🔲 Prévu`), syntaxe Mermaid stricte et définition du "Prêt pour livraison" (Definition of Done).
   - [`docs/decisions_a_prendre.md`](decisions_a_prendre.md) : Registre exhaustif des choix métier, juridiques et techniques ouverts (licence, contact sécurité, dérogations de remboursement, domaines de production).
2. **Contrat d'API & Spécifications :**
   - [`docs/api/openapi.yaml`](api/openapi.yaml) : Spécification OpenAPI 3.0.3 intégrale (126 endpoints réels extraits du code, 22 domaines, schémas de requêtes et de réponses).
   - [`docs/api_endpoints.md`](api_endpoints.md) : Tableau synoptique complet des 126 endpoints avec méthodes, chemins, descriptions et rôles RBAC exigés.
   - [`docs/api/guide_api.md`](api/guide_api.md) : Guide d'intégration HTTP (URLs, en-têtes de corrélation, conventions ISO-8601, rate limiting 429 et exemples curl).
   - [`docs/api/codes_erreur.md`](api/codes_erreur.md) : Répertoire exhaustif des 58 codes d'erreur applicatifs stables (`ErrorCode.java`).
3. **Suite Postman & Exécution Newman :**
   - [`docs/postman/AtlasVoyage.postman_collection.json`](postman/AtlasVoyage.postman_collection.json) : 18 dossiers, 181 requêtes avec assertions automatiques de statuts et de payloads.
   - [`docs/postman/env.dev.json`](postman/env.dev.json) & [`docs/postman/env.prod.json`](postman/env.prod.json) : Environnements local et production (garantie Zéro Secret).
   - [`docs/postman/README.md`](postman/README.md) : Manuel d'exécution en CLI via Newman et génération de rapports HTML.
4. **Architecture Globale & ADRs :**
   - [`docs/architecture.md`](architecture.md) : Architecture logicielle complète avec diagrammes C4 (Contexte, Conteneurs, Composants), diagramme Entité-Relation Mermaid exhaustif (40 entités JPA), dictionnaire de données complet, 4 diagrammes de séquence (Auth refresh rotation, Réservation atomique, Paiement idempotent, Annulation/Restitution) et 4 machines à états.
   - [`docs/adr/`](adr/) : 10 Décisions d'Architecture (MADR) documentant les choix structurants (STI, disponibilités temporelles, fournisseurs spécialisés, MAD référence, JWT en cookies HttpOnly, Flyway, géocodage Open-Meteo, catalogue unique, i18n runtime vanilla, cache Caffeine).
5. **Règles Métier Exhaustives :**
   - [`docs/regles_metier.md`](regles_metier.md) : Référentiel des règles applicatives (RBAC, Single Table, disponibilités, réservations, barème d'annulation 48h/24h, paiements sandbox et espèces, audit immuable, RGPD).
6. **Exploitation, Runbooks & Supervision :**
   - [`docs/exploitation/`](exploitation/) : Guide de configuration, procédures de déploiement et rollback, stratégie de sauvegarde/restauration MySQL, métriques Actuator, runbooks d'incidents opérationnels et calendrier de maintenance.
7. **Manuels Utilisateurs par Rôle :**
   - [`docs/manuel/`](manuel/) : Manuels illustrés pas-à-pas pour les 5 profils (Invité, Client, Fournisseur, Agent, Administrateur).
8. **Standards Communautaires & Contribution :**
   - [`CONTRIBUTING.md`](../CONTRIBUTING.md), [`CHANGELOG.md`](../CHANGELOG.md), [`SECURITY.md`](../SECURITY.md), [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) et gabarits d'issues/PR GitHub.
9. **Outillage d'Automatisation & Validation (Docs-as-Code) :**
   - `scripts/docs/gen_openapi.mjs` : Extraction et synchronisation automatique du contrat OpenAPI depuis les contrôleurs Spring.
   - `scripts/docs/gen_er.mjs` : Extraction automatique du modèle ER et du dictionnaire depuis les entités JPA.
   - `scripts/docs/check_all.mjs` : Validation automatique de l'intégrité des liens, syntaxe Mermaid, parité d'endpoints et absence de secrets.

---

## 42. Phases Futures & Jalons Prévus

Les phases suivantes font partie de la feuille de route globale d'Atlas Voyage et sont documentées au niveau architectural sans être encore exécutées dans le jalon actuel :

| Phase | Intitulé | Statut | Objectifs Clés |
|---|---|:---:|---|
| **Phase 11** | **Intégration & Déploiement Continus (CI/CD)** | `🔲 Prévu` | Pipeline GitHub Actions automatisé : compilation Java 21, tests Maven avec Testcontainers MySQL, audit de sécurité OWASP Dependency-Check, linter JS/CSS, vérification docs-as-code (`npm run docs:check`), et déploiement continu sur staging. |
| **Phase 13** | **Optimisation & Bundling Front-End Prod** | `🔲 Prévu` | Pipeline d'optimisation statique optionnel (Rollup/esbuild/PostCSS) pour minifier et hacher les assets en production sans altérer l'expérience Vanilla JS en développement local. |
| **Phase 16** | **Conteneurisation & Orchestration Docker Prod** | `🔲 Prévu` | Dockerfile multi-stage durci (Eclipse Temurin 21 distroless/alpine, non-root user), `docker-compose.yml` de production avec MySQL 8, Nginx reverse proxy SSL/TLS et healthchecks Actuator. |
| **Phase 17** | **Recette Finale, Homologation & Audit Externe** | `🔲 Prévu` | Audit de pénétration externe (Pentest OWASP), certification d'accessibilité WCAG 2.1 AA par un organisme agréé, tests de charge Gatling/k6 (1000 req/s), et bascule en production officielle. |



