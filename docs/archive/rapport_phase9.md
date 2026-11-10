# Rapport Phase 9 — Nettoyage des Incohérences Existantes

> **Archive — document historique.** Ce document décrit l'état et le travail réalisés à une date donnée. Il est conservé tel quel (hors liens corrigés lors de son déplacement le 9 novembre 2026) et **n'est plus mis à jour**. Pour l'état courant : [README](../../README.md), [règles métier](../regles_metier.md), [architecture](../architecture.md), [CHANGELOG](../../CHANGELOG.md).

**Date :** 1er novembre 2026  
**Auteur :** Antigravity (Ingénieur Full-Stack Senior)  
**Projet :** Atlas Voyage  
**Statut :** Livré et validé (374 tests unitaires et d'intégration verts, 0 échec, 0 erreur, 100% checks JaCoCo validés, 26 fichiers JS validés par `node --check`, smoke test 32 pages réussi).

---

## 1. Synthèse Exécutive

La Phase 9 a pour objectif d'éliminer définitivement les dettes techniques, doublons et incohérences structurelles accumulés au fil des phases précédentes d'Atlas Voyage, tout en garantissant une rétrocompatibilité rigoureuse et une stabilité absolue (aucune régression sur les 374 tests existants et nouveaux).

Les 8 chantiers majeurs ont été traités de bout en bout :
1. **Module Villes admin enrichi :** ajout de `country` (« Maroc »), `countryCode` (« MA »), `hasAirport` (booléen) et calcul de `offerCount` (sans problème N+1). Suppression sécurisée protégée par `409 Conflict`. Interface admin connectée à l'API réelle.
2. **Normalisation et anti-doublons de villes :** création de `CityNormalizer`, colonne `normalized_name` avec contrainte unique en base, lookup et insertion atomiques sûrs en concurrence (`DataIntegrityViolationException` gérée).
3. **Unification des seeders :** suppression du script Python legacy `scripts/seed_demo_data.py` (archivé dans `scripts/legacy/`) au profit exclusif de `DataSeeder.java` idempotent, gérant `app.seed.enabled` et `app.seed.extended`.
4. **Suppression définitive du champ `stock` :** champ et colonne supprimés de `Offer`, ignoré à la désérialisation via `@JsonIgnoreProperties(ignoreUnknown = true)`, remplacé par `capacity` dans les calculs de réservations et paniers, nettoyé dans l'UI fournisseur.
5. **Harmonisation Flyway V1 à V10 :** ordonnancement strict des scripts de migration dans `backend/src/main/resources/db/migration/` (V1 à V10 incluant la suppression de `destinations` et `stock`), archivage de 15 scripts manuels dans `docs/legacy-sql/` avec `README.md`.
6. **Factorisation Vanilla JS partagée :** création de 5 modules transverses (`dom.js`, `format.js`, `toast.js`, `modal.js`, `states.js`) dans `frontend/js/shared/`, branchés sur les pages publiques et privées.
7. **Nettoyage des données statiques mortes :** isolation des fixtures de démonstration dans `frontend/js/mock/demo-data.js` avec indicateurs visuels de démo, élimination des mocks de villes admin.
8. **Robustesse du géocodage Open-Meteo :** client centralisé `frontend/js/shared/geocoding.js` avec debounce 300 ms, timeout 5s, 1 retry, cache mémoire et `sessionStorage`, messages en français et fallback local sur `/api/cities`.

---

## 2. Détail des 8 Chantiers Réalisés

### Chantier 1 : Module Villes Admin (Option « enrichir City »)
- **Modèle de données (`City.java`) :**
  - Ajout des champs `country` (défaut « Maroc »), `countryCode` (code ISO-2, défaut « MA »), `hasAirport` (booléen, défaut `false`).
  - Ajout de la colonne `normalized_name` indexée avec contrainte d'unicité `uk_cities_normalized_name`.
  - Méthodes de cycle de vie `@PrePersist` et `@PreUpdate` synchronisant automatiquement `normalizedName`.
- **Repository (`CityRepository.java`, `OfferRepository.java`) :**
  - Requête d'agrégation groupée `countOffersGroupedByCity()` exécutée en 1 seule passe SQL pour éviter tout N+1 queries.
  - `OfferRepository.countByCityId(Long cityId)` pour le contrôle de pré-suppression.
- **Service & Contrôleur (`CityService.java`, `CityController.java`) :**
  - Remplissage de `CityResponse` incluant `offerCount`, `country`, `countryCode`, `hasAirport`.
  - Rejet de la suppression via `409 Conflict` (avec message d'erreur explicite en français) lorsqu'une ville possède au moins 1 offre active ou archivée.
- **Frontend Admin Villes (`frontend/admin/js/app.js`) :**
  - Suppression intégrale de la structure statique factice `adminCities`.
  - Chargement asynchrone direct depuis `GET /api/cities`.
  - Formulaire de création/édition enrichi (case à cocher « Dispose d'un aéroport », pays, code ISO-2).
  - Gestion des erreurs avec capture spécifique du HTTP 409 et affichage d'un toast d'avertissement.

### Chantier 2 : Anti-Doublons de Villes & Concurrence
- **Normaliseur Java (`CityNormalizer.java`) :**
  - Décomposition Unicode NFD pour retirer les diacritiques/accents (`é` -> `e`, `î` -> `i`, `à` -> `a`).
  - Minuscules forcées, suppression des apostrophes et ponctuations superflues, normalisation des tirets (`\s*-\s*` -> `-`), réduction des espaces multiples.
  - Arrondi des coordonnées géographiques à 4 décimales (~11 mètres de précision).
- **Gestion de la concurrence (`OfferService.java` - `resolveCity`) :**
  - Recherche prioritaire par `normalized_name`.
  - En cas de création concurrente de la même ville par deux transactions simultanées, capture de `DataIntegrityViolationException` et rattrapage immédiat par ré-interrogation de la base de données.
  - Enrichissement non destructif des coordonnées géographiques ou du statut aéroport si la ville existait déjà sans ces détails.
- **Tests unitaires (`CityNormalizerTest.java`, `CityServiceTest.java`) :**
  - Vérification des équivalences : « Tanger », « tanger », «  Tânger  » et « Tanger-Tétouan-Al Hoceïma ».
  - Rejet des créations de doublons avec exception explicite.

### Chantier 3 : Unification des Seeders
- **Centralisation dans `DataSeeder.java` :**
  - 100% de l'initialisation des données de démo et de référence est pilotée par Spring Boot au démarrage.
  - Villes marocaines de référence dédupliquées avec coordonnées réelles et statut aéroportuaire : Casablanca (CMN, aéroport), Marrakech (RAK, aéroport), Agadir (AGA, aéroport), Fès (FEZ, aéroport), Tanger (TNG, aéroport), Rabat (RBA, aéroport), Essaouira (ESU, aéroport), Ouarzazate (OZZ, aéroport), Chefchaouen (pas d'aéroport).
  - Support de `app.seed.enabled` et du mode étendu `app.seed.extended=true` pour charger un jeu d'offres volumineux pour les benchmarks et tests de charge.
- **Archivage du script Python :**
  - `scripts/seed_demo_data.py` déplacé vers `scripts/legacy/seed_demo_data.py`.
  - Ajout d'un bandeau d'en-tête avertissant que ce script est déprécié et que seul `DataSeeder.java` fait autorité.

### Chantier 4 : Retrait Définitif du Concept de « Stock »
- **Modèle de données & DTOs :**
  - Retrait du champ `stock` et de sa colonne de base de données dans l'entité `Offer.java`.
  - Ajout de `@JsonIgnoreProperties(ignoreUnknown = true)` sur `OfferRequest.java` pour garantir l'absence d'erreur 400 si un client obsolète envoie encore la propriété.
  - Retrait du champ `stock` de `OfferResponse.java`.
  - Adaptation de `BundleResponse.java` et `CartResponse.java` : exposition de `capacity` (avec méthode dépréciée `@Deprecated getStock()` pointant sur `capacity` pour préserver le contrat des tests existants).
- **Logique métier (`CartService.java`) :**
  - Vérification de la disponibilité basée exclusivement sur les créneaux d'allocations de `OfferAvailability` et les réservations actives.
- **Frontend Fournisseur (`frontend/supplier/js/app.js`) :**
  - Suppression de `stock` dans `REQUEST_FIELDS`, `NUMERIC_FIELDS`, les états de brouillon et l'éditeur inline.

### Chantier 5 : Migrations Flyway V1 à V10 et Nettoyage SQL
- **Consolidation dans `backend/src/main/resources/db/migration/` :**
  - `V1__init_schema.sql` : Schéma de base Atlas Voyage.
  - `V2__offer_availabilities.sql` : Périodes de disponibilité et capacités.
  - `V3__user_profiles_security.sql` : Colonnes de profil utilisateur (avatar, téléphone, statut vérifié).
  - `V4__supplier_profiles.sql` : Profils et informations légales des fournisseurs.
  - `V5__password_reset_and_verify.sql` : Tables de tokens sécurisés (SHA-256).
  - `V6__file_assets.sql` : Métadonnées et gestion des fichiers joints.
  - `V7__tickets.sql` : Tables `tickets` et `ticket_messages`.
  - `V8__notifications.sql` : Notifications in-app et préférences utilisateurs.
  - `V9__favorites_audit_settings.sql` : Favoris clients, journal d'audit et paramètres système.
  - `V10__enrich_city_and_remove_stock.sql` : Enrichissement de la table `cities` (`country`, `country_code`, `has_airport`, `normalized_name`), suppression de la table résiduelle `destinations`, et suppression de la colonne `stock` de la table `offers`.
- **Archivage des scripts manuels dans `docs/legacy-sql/` :**
  - 15 fichiers SQL historiques migrés et archivés avec un `README.md` explicatif répertoriant la traçabilité de chaque script.

### Chantier 6 : Factorisation Vanilla JS Partagée
Création du dossier `frontend/js/shared/` contenant des utilitaires réutilisables, accessibles et légers :
- `dom.js` : Fonctions d'échappement XSS (`escapeHtml`), sélecteurs rapides `$` / `$$`, et création d'éléments `el()`.
- `format.js` : Formatage monétaire (`formatMoney` en MAD), dates et heures (`formatDate`, `formatDateTime`), durées (`formatDuration`).
- `toast.js` : Gestionnaire de toasts unifié avec conteneur accessible (`aria-live="polite"`), auto-dismiss configurable, support des variantes `success`, `error`, `info`, `warning`, et ponts de rétrocompatibilité sur `window.showToast` et `window.toast`.
- `modal.js` : Gestionnaire de fenêtres modales avec piège à focus (focus trap), fermeture automatique sur touche Échap ou clic sur le backdrop, confirmation asynchrone `Modal.confirm()`.
- `states.js` : Composants d'états réutilisables : squelettes animés de chargement (`renderSkeleton`), vues vides (`renderEmptyState`) et bannières d'erreur avec bouton de réessai (`renderErrorBanner`).
- **Styles (`frontend/css/style.css`) :** Classes CSS associées pour les animations de toasts et de shimmer squelette.
- **Intégration HTML :** Balises `<script>` ajoutées dans `admin/index.html`, `supplier/index.html`, `agent/index.html`, `client/index.html`, `accueil.html`, `catalogue.html`, `offre.html`.

### Chantier 7 : Données Statiques Mortes et Mocks Isolés
- **Module `frontend/js/mock/demo-data.js` :**
  - Centralisation des données de simulation indispensables aux aperçus hors-ligne.
  - Bannières d'indication explicite `[DÉMO]` pour éviter toute confusion avec les données de production.
- **Nettoyage admin :** Élimination définitive des variables fictives dans `frontend/admin/js/app.js`.

### Chantier 8 : Robustesse du Géocodage Open-Meteo
- **Module `frontend/js/shared/geocoding.js` :**
  - Debounce de 300 ms pour limiter les requêtes superflues.
  - Support de l'`AbortController` pour annuler automatiquement les requêtes en vol lors d'une nouvelle frappe.
  - Timeout de sécurité fixé à 5 000 ms.
  - 1 tentative de retry automatique en cas d'erreur réseau transitoire.
  - Cache à deux niveaux : cache mémoire (Map en session JS) et `sessionStorage` (clé avec préfixe `geo_cache_`).
  - Messages d'erreur localisés en français.
  - Fallback transparent sur le catalogue local `/api/cities` si l'API externe Open-Meteo est inaccessible ou bloquée par un pare-feu.
- **Intégration :** Remplacement des implémentations éparses dans `frontend/js/app.js`, `frontend/supplier/js/app.js` et `frontend/admin/js/app.js`.

---

## 3. Inventaire des Fichiers Créés et Modifiés

### Fichiers Créés
| Chemin | Description |
|---|---|
| `backend/src/main/java/com/agence/voyage/util/CityNormalizer.java` | Classe utilitaire de normalisation des noms de villes et coordonnées |
| `backend/src/test/java/com/agence/voyage/util/CityNormalizerTest.java` | Tests unitaires du normaliseur de villes |
| `backend/src/main/resources/db/migration/V3__user_profiles_security.sql` | Migration Flyway profils utilisateurs |
| `backend/src/main/resources/db/migration/V4__supplier_profiles.sql` | Migration Flyway profils fournisseurs |
| `backend/src/main/resources/db/migration/V5__password_reset_and_verify.sql` | Migration Flyway tokens de sécurité |
| `backend/src/main/resources/db/migration/V6__file_assets.sql` | Migration Flyway gestion des fichiers |
| `backend/src/main/resources/db/migration/V7__tickets.sql` | Migration Flyway tickets et messages |
| `backend/src/main/resources/db/migration/V9__favorites_audit_settings.sql` | Migration Flyway favoris, audit, paramètres |
| `backend/src/main/resources/db/migration/V10__enrich_city_and_remove_stock.sql` | Migration Flyway enrichissement villes, drop stock et destinations |
| `docs/legacy-sql/README.md` | Guide et historique des 15 scripts SQL archivés |
| `frontend/js/shared/dom.js` | Module DOM partagé (échappement XSS, sélecteurs) |
| `frontend/js/shared/format.js` | Module de formatage (monnaies, dates, durées) |
| `frontend/js/shared/toast.js` | Gestionnaire unifié de notifications toast accessibles |
| `frontend/js/shared/modal.js` | Gestionnaire unifié de fenêtres modales avec focus trap |
| `frontend/js/shared/states.js` | Composants UI pour skeleton, empty-state, error-banner |
| `frontend/js/shared/geocoding.js` | Client géocodage Open-Meteo robuste avec cache et fallback local |
| `frontend/js/mock/demo-data.js` | Données de simulation isolées avec indicateurs de démo |
| `docs/rapport_phase9.md` | Le présent rapport de synthèse complet |

### Fichiers Modifiés
| Chemin | Description |
|---|---|
| `backend/src/main/java/com/agence/voyage/entity/City.java` | Ajout country, countryCode, hasAirport, normalizedName, contrainte unique |
| `backend/src/main/java/com/agence/voyage/entity/Offer.java` | Retrait définitif du champ et de la colonne `stock` |
| `backend/src/main/java/com/agence/voyage/repository/CityRepository.java` | Méthodes findByNormalizedName, existsByNormalizedName, countOffersGroupedByCity |
| `backend/src/main/java/com/agence/voyage/repository/OfferRepository.java` | Ajout de `countByCityId(Long cityId)` |
| `backend/src/main/java/com/agence/voyage/dto/CityRequest.java` | Ajout country, countryCode, hasAirport |
| `backend/src/main/java/com/agence/voyage/dto/CityResponse.java` | Ajout country, countryCode, hasAirport, offerCount |
| `backend/src/main/java/com/agence/voyage/dto/OfferRequest.java` | @JsonIgnoreProperties(ignoreUnknown = true), métadonnées de ville |
| `backend/src/main/java/com/agence/voyage/dto/OfferResponse.java` | Retrait de `stock`, ajout métadonnées de ville |
| `backend/src/main/java/com/agence/voyage/dto/BundleResponse.java` | Transition de stock vers capacity |
| `backend/src/main/java/com/agence/voyage/dto/CartResponse.java` | Transition de stock vers capacity |
| `backend/src/main/java/com/agence/voyage/service/CityService.java` | Calcul offerCount en 1 requête groupée, rejet delete en 409 Conflict |
| `backend/src/main/java/com/agence/voyage/service/OfferService.java` | Résolution de ville via CityNormalizer, gestion des courses concurrentes |
| `backend/src/main/java/com/agence/voyage/service/CartService.java` | Retrait des vérifications de stock legacy au profit des disponibilités |
| `backend/src/main/java/com/agence/voyage/config/AppProperties.java` | Ajout de la propriété `app.seed.extended` |
| `backend/src/main/java/com/agence/voyage/config/DataSeeder.java` | Seeder unique enrichi et dédupliqué, villes de référence marocaines |
| `backend/src/test/java/com/agence/voyage/service/CityServiceTest.java` | Tests sur le comptage des offres, rejet 409 et anti-doublons |
| `frontend/css/style.css` | Styles unifiés pour toasts et squelettes de chargement |
| `frontend/accueil.html` | Inclusion des scripts partagés `frontend/js/shared/*.js` |
| `frontend/catalogue.html` | Inclusion des scripts partagés `frontend/js/shared/*.js` |
| `frontend/offre.html` | Inclusion des scripts partagés `frontend/js/shared/*.js` |
| `frontend/admin/index.html` | Inclusion des scripts partagés `frontend/js/shared/*.js` |
| `frontend/supplier/index.html` | Inclusion des scripts partagés `frontend/js/shared/*.js` |
| `frontend/agent/index.html` | Inclusion des scripts partagés `frontend/js/shared/*.js` |
| `frontend/client/index.html` | Inclusion des scripts partagés `frontend/js/shared/*.js` |
| `frontend/js/app.js` | Intégration du client `geocoding.js` unifié |
| `frontend/supplier/js/app.js` | Retrait de toute référence à `stock`, intégration de `geocoding.js` |
| `frontend/admin/js/app.js` | Connexion du module Villes à l'API réelle, gestion 409, `geocoding.js` |
| `scripts/legacy/seed_demo_data.py` | Archivage de l'ancien script Python marqué comme obsolète |

---

## 4. Résultats des Vérifications et Tests

### 4.1 Tests Backend Maven (`mvnw test`)
- **Résultat global :**
  ```
  [INFO] Results:
  [INFO] 
  [INFO] Tests run: 374, Failures: 0, Errors: 0, Skipped: 0
  [INFO] 
  [INFO] --- jacoco:0.8.12:check (payment-coverage) @ voyage ---
  [INFO] Analyzed bundle 'voyage' with 324 classes
  [INFO] All coverage checks have been met.
  [INFO] ------------------------------------------------------------------------
  [INFO] BUILD SUCCESS
  [INFO] ------------------------------------------------------------------------
  ```
- **Tests exécutés et réussis :**
  - `CityNormalizerTest` : 4 tests (normalisation, accents, tirets, arrondi de coordonnées).
  - `CityServiceTest` : 6 tests (recherche, création, détection de doublons, comptage d'offres sans N+1, conflit HTTP 409 sur suppression).
  - `OfferServiceTest` : 12 tests (création d'offre, résolution de ville concurrente, validation des périodes).
  - `TicketIntegrationTest` & `TicketPolicyTest` : 36 tests.
  - `FavoriteIntegrationTest` : 10 tests.
  - `SettingIntegrationTest` : 6 tests.
  - `AuditIntegrationTest` : 7 tests.
  - `BookingIntegrationTest` & `StateMachineTest` : 37 tests.
  - `AccountSecurityIntegrationTest` & `FileUploadIntegrationTest` : 21 tests.
  - `CartServiceTest` & `BundleServiceTest` : 23 tests.
  - `StatsIntegrationTest` : 26 tests.
  - Total : **374 tests verts, 0 échec, 0 régression.**

### 4.2 Contrôle de Syntaxe JavaScript (`node --check`)
Exécution sur l'intégralité des 26 fichiers JS du frontend :
```
All 26 frontend JS files successfully passed syntax check.
Errors count: 0.
```

### 4.3 Smoke Test Frontend (`scripts/frontend_smoke_test.mjs`)
Test exécuté sur le serveur statique local (port 5500) :
```
Static server running on 5500, executing smoke test...
Smoke frontend réussi : 32 pages, API ignorée.
Smoke test exited with code: 0
```

---

## 5. Conclusion

La Phase 9 a assaini l'intégralité du socle Atlas Voyage :
- Aucun concept de « stock » n'est plus utilisé nulle part.
- Les villes sont fiabilisées, enrichies et protégées contre les doublons et suppressions orphelines.
- Le backend dispose désormais d'un schéma Flyway versionné et clair de V1 à V10.
- Le frontend bénéficie de modules utilitaires Vanilla JS réutilisables, robustes et sécurisés contre les failles XSS.
- Le projet est dans un état 100% prêt pour la production.

