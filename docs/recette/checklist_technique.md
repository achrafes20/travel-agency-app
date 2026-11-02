# Checklist Technique d'Avant-Livraison — Atlas Voyage (Section 17.2)

Cette checklist consigne l'ensemble des vérifications techniques menées par l'équipe d'ingénierie et de release management avant toute autorisation de mise en production.

---

## 1. Environnement Backend & Compilation Java

- [x] **Version de Java** : Exécution stricte sous **Java 21 LTS** (`openjdk 21.0.10`).
- [x] **Framework Backend** : **Spring Boot 3.3.4** avec configuration Spring Web, Spring Data JPA, Spring Security, Jakarta Validation.
- [x] **Compilation Propre** : `mvnw.cmd clean compile` réussit sans avertissement bloquant (`BUILD SUCCESS`).
- [x] **Temps de Compilation Mesuré** : **4,59 secondes** mesuré par `fresh_install_test.mjs` (seuil exigé < 600 secondes).
- [x] **Suite de Tests Automatisés Backend** :
  - **397 / 397 tests JUnit 5 au vert**.
  - **0 échec**, **0 erreur**, **0 test ignoré** (`Failures: 0, Errors: 0, Skipped: 0`).
  - Base H2 en mémoire isolée pour la suite de tests unitaires et d'intégration.
- [x] **Gestion des Dépendances** :
  - Dépendances JJWT alignées sur la version `0.12.6` (jjwt-api, jjwt-impl, jjwt-jackson).
  - Aucune dépendance obsolète porteuse de CVE critique connue.

---

## 2. Base de Données & Modèle Relationnel MySQL

- [x] **Système de Gestion de BDD** : **MySQL 8.0** / **MariaDB 10.4.32** sur le port standard 3306.
- [x] **Schéma et Tables** : Tables générées et synchronisées via `spring.jpa.hibernate.ddl-auto=update`.
- [x] **Héritage Single Table Inheritance (STI)** :
  - Entité abstraite `Offer` persistée en table unique `offers` avec discriminant `offer_type` (`HOTEL`, `FLIGHT`, `CAR`, `TAXI_TRANSFER`, `EXCURSION`).
  - Champs spécifiques partitionnés selon la stratégie STI (`stars`, `flight_number`, `seats`, etc.).
- [x] **Gestion des Disponibilités & Concurrence** :
  - Table `offer_availabilities` avec dates de début/fin (`available_from`, `available_until`) et capacité restante (`capacity`).
  - Verrous pessimistes `PESSIMISTIC_WRITE` implémentés dans `BookingService.java` pour éliminer tout risque de surréservation (overselling).
- [x] **Contrôle d'Intégrité SQL Réel (`check_integrity.mjs`)** :
  - **0 capacité négative** : Aucune ligne avec `capacity < 0`.
  - **100% monnaie MAD** : Tous les montants et paiements sont rigoureusement libellés en Dirhams Marocains.
  - **0 orphelin** : Intégrité référentielle complète entre réservations, allocations et disponibilités.
  - **Unicité des villes** : Contrainte d'unicité vérifiée sur `normalized_name`.

---

## 3. Sécurité Applicative, API REST & OpenAPI

- [x] **Contrat OpenAPI 3.0.3 & Parité Stricte** :
  - 126 endpoints Spring Boot extraits du code source Java.
  - 126 opérations documentées dans `docs/openapi.yaml`.
  - 126 entrées dans le tableau récapitulatif `docs/api_endpoints.md`.
  - **Parité validée à 100%** par l'outil automatisé `npm run docs:check`.
- [x] **Garantie Zéro Secret de Production** :
  - Aucun mot de passe ni clé API réelle dans le dépôt Git.
  - Environnement Postman de production `docs/postman/env.prod.json` 100% purgé de secrets (`{{PROD_SECRET_*}}`).
- [x] **Architecture Stateless & JWT** :
  - API REST strictement sans état (stateless), aucune session HTTP côté serveur (`STATELESS`).
  - Jetons JWT sécurisés transmis par cookies `HttpOnly`, `SameSite=Lax` et en-tête `Authorization: Bearer <token>`.
- [x] **Rate Limiting Applicatif** :
  - Implémentation Bucket4j via `RateLimitingFilter.java` protégeant les routes `/api/auth/*` contre le brute-force.
- [x] **Format Standardisé des Erreurs** :
  - Réponses d'erreur formatées selon la structure `ApiError` (conforme RFC 7807) avec code d'erreur explicite, message compréhensible et correlation ID pour traçabilité.

---

## 4. Frontend Vanilla & Design System

- [x] **Architecture Frontend** : HTML5 sémantique, CSS3 moderne et **JavaScript vanilla** natif sans aucun framework lourd (React/Angular/Vue).
- [x] **Absence d'Étape de Build Obligatoire** : Les fichiers du dossier `frontend/` sont directement exécutables et interprétables par tout navigateur moderne.
- [x] **Ressources Tiers & CDN** : Chargement fluide de Tailwind CSS, des icônes Lucide et de Leaflet pour la cartographie.
- [x] **Quatre Espaces Privés en SPA** :
  - Espace Client : `frontend/client/index.html?page=...`
  - Espace Fournisseur : `frontend/supplier/index.html?page=...`
  - Espace Agent : `frontend/agent/index.html?page=...`
  - Espace Administrateur : `frontend/admin/index.html?page=...`
- [x] **Garde d'Accès par Rôle** :
  - Chaque espace privé est protégé par un appel synchrone précoce `Auth.requireRole("ROLE")` garantissant la redirection immédiate des utilisateurs non autorisés.
- [x] **Absence de Données Bouchonnées (Mock Data)** :
  - Le scan statique et dynamique `find_mock_data.mjs` confirme l'absence totale de mocks résiduels dans l'interface de production.

---

## 5. Accessibilité, Responsive & Internationalisation

- [x] **Accessibilité WCAG 2.1 AA** :
  - Liens d'évitement (`.av-skip-link`) présents en en-tête de page pour la navigation au clavier.
  - Ratios de contraste de couleurs validés (texte sombre sur fond clair / mode sombre adapté).
  - Attributs ARIA sur les accordéons, menus déroulants et modales.
- [x] **Responsive Design Mobile** :
  - Adaptabilité complète validée en résolution smartphone 375x667 (iPhone SE).
  - Absence de tout scroll horizontal indésirable.
- [x] **Support Trilingue (i18n)** :
  - Bascule instantanée entre Français (FR), Anglais (EN) et Arabe (AR).
  - Inversion complète de l'interface en mode Right-To-Left (`dir="rtl"`) pour la langue arabe via CSS logique.
- [x] **Affichage Multi-Devises Indicatif** :
  - Affichage des prix en Dirhams Marocains (MAD) par défaut avec conversion indicative en Euros (EUR) et Dollars (USD).

---

## 6. Outillage d'Automatisation de la Recette

- [x] **Script de Contrôle d'Intégrité BDD** : `scripts/recette/check_integrity.mjs` (0 violation).
- [x] **Script de Détection des Mocks** : `scripts/recette/find_mock_data.mjs` (0 mock).
- [x] **Script de Test de Performance** : `scripts/recette/fresh_install_test.mjs` (4,59s).
- [x] **Script de Réinitialisation Démo** : `scripts/recette/reset_demo.mjs` (0,44s).
- [x] **Suite de Tests E2E Automatisée** : `e2e/recette/runner.mjs` (39/39 tests réussis, 100%).
- [x] **Orchestrateur Global** : `npm run recette:all` (`scripts/recette/run_all.mjs`).

---

**Visa Technique du Release Manager** :  
Tous les contrôles techniques automatisés sont passés avec un score de conformité de **100%**.  
Les 3 écarts d'infrastructure résiduels (CI/CD GitHub, dist bundling, Docker prod) sont dûment tracés avec plans de livraison associés.

