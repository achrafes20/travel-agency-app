# Atlas Voyage 🇲🇦 — Plateforme de Voyage & Tourisme

[![Java 21](https://img.shields.io/badge/Java-21_LTS-orange.svg?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla_JS_ES2022-yellow.svg?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Database](https://img.shields.io/badge/MySQL-8.0_%2F_MariaDB-blue.svg?logo=mysql)](https://www.mysql.com/)
[![Tests](https://img.shields.io/badge/Tests-397_Passed-success.svg)](backend/)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-purple.svg)](docs/design/accessibilite.md)
[![Security](https://img.shields.io/badge/Security-OWASP_Top_10-red.svg)](docs/securite/matrice_autorisations.md)
[![License](https://img.shields.io/badge/License-Proprietary_%2F_À_confirmer-lightgrey.svg)](docs/decisions_a_prendre.md#1-licence-du-code-source-et-propriété-intellectuelle)

Atlas Voyage est une plateforme de voyage et d'e-tourisme marocaine de référence, permettant la réservation en ligne et l'encaissement d'offres touristiques complètes : **hôtels & riads, vols nationaux et internationaux, locations de voitures, taxis & transferts aéroportuaires, et excursions guidées**.

L'application intègre une architecture découplée **Spring Boot 3.3.4 (Java 21) REST API** et un **Frontend modulaire en Vanilla JavaScript (zéro framework, zéro étape de build obligatoire)**, avec support trilingue natif (**Français, Anglais, Arabe avec RTL complet**), conformité d'accessibilité **WCAG 2.1 AA**, sécurité bancaire simulée (Sandbox + Espèces en agence) et protection **OWASP Top 10**.

> **English Summary:**  
> Atlas Voyage is a full-featured Moroccan travel booking platform built with **Java 21 / Spring Boot 3.3.4** and **Vanilla JavaScript**. It features multi-role portals (Client, Supplier, Agent, Admin), dated availability management, dynamic multi-item bundling, cart with coupon engine, 2-step atomic booking with cancellation policies, simulated payment gateways (Card sandbox & Cash on arrival), in-app notifications, WCAG 2.1 AA responsive UI with dark mode, full trilingual i18n (FR, EN, AR with native RTL), and OWASP Top 10 hardened security (HttpOnly SameSite cookies, family refresh token rotation, double-submit CSRF, Bucket4j rate limiting, and GDPR compliance).

---

## Sommaire

1. [Aperçu Visuel & Démonstration](#1-aperçu-visuel--démonstration)
2. [Matrice des Fonctionnalités & État](#2-matrice-des-fonctionnalités--état)
3. [Stack Technique & Versions](#3-stack-technique--versions)
4. [Prérequis](#4-prérequis)
5. [Démarrage Rapide (< 10 minutes)](#5-démarrage-rapide--10-minutes)
6. [Configuration & Variables d'Environnement](#6-configuration--variables-denvironnement)
7. [Comptes de Démonstration (Développement Local)](#7-comptes-de-démonstration-développement-local)
8. [Commandes Utiles & Tests](#8-commandes-utiles--tests)
9. [Arborescence du Projet](#9-arborescence-du-projet)
10. [Dépannage & FAQ Technique](#10-dépannage--faq-technique)
11. [Documentation & Liens Utiles](#11-documentation--liens-utiles)
12. [Contribution & Sécurité](#12-contribution--sécurité)

---

## 1. Aperçu Visuel & Démonstration

Atlas Voyage propose une interface moderne aux couleurs marocaines (Bleu Majorelle, Ambre, Terre Cuite) articulée autour d'un portail public et de quatre espaces métiers :

```
[Portail Public & Catalogue] ──> [Tunnel Panier / Checkout] ──> [Paiement Sandbox / Espèces]
               │                                                          │
    ┌──────────┴───────────────┬─────────────────────────┬────────────────┴────────────┐
    ▼                          ▼                         ▼                             ▼
[Espace Client]      [Espace Fournisseur]         [Espace Agent]               [Espace Admin]
- Réservations       - Wizard 4 étapes            - Encaissement espèces       - Modération offres
- Téléchargement PDF - Calendrier disponibilités  - Composition de bundles     - Gestion utilisateurs
- Billetterie SAV    - Statistiques de ventes     - Support client             - Audit & Paramètres
```

*(Des captures d'écran complètes de chaque espace sont disponibles dans le dossier [`docs/assets/screenshots/`](docs/assets/screenshots/) et référencées dans les [Manuels Utilisateurs](docs/manuel/README.md)).*

---

## 2. Matrice des Fonctionnalités & État

> **Légende des statuts :**  
> `✅ Implémenté` : Développé, testé, documenté et opérationnel en environnement nominal.  
> `🟡 Partiel` : Fonctionnel avec limitations connues ou enrichissements prévus.  
> `🔲 Prévu` : Conçu au niveau architectural mais non implémenté dans le jalon actuel.

| Domaine / Module | Fonctionnalité Clé | Statut | Documentation associée |
|---|---|:---:|---|
| **Authentification & Sécurité** | JWT via cookies HttpOnly, rotation refresh token, détection de rejeu | `✅ Implémenté` | [`docs/architecture.md`](docs/architecture.md), [`ADR-0005`](docs/adr/0005-authentification-jwt-cookies-httponly-rotation-refresh.md) |
| **Protection OWASP** | Rate limiting Bucket4j (429), CSRF double-submit, anti-bruteforce (lockout 5 échecs) | `✅ Implémenté` | [`docs/securite/matrice_autorisations.md`](docs/securite/matrice_autorisations.md) |
| **RGPD / Loi marocaine 09-08** | Export de données personnelles JSON, droit à l'oubli et anonymisation | `✅ Implémenté` | [`docs/regles_metier.md#11-protection-des-données-personnelles`](docs/regles_metier.md) |
| **Offres & Hébergement** | Single Table Inheritance (5 types d'offres), géocodage Open-Meteo résilient | `✅ Implémenté` | [`ADR-0001`](docs/adr/0001-single-table-inheritance-offres.md), [`ADR-0007`](docs/adr/0007-geocodage-resilient-open-meteo.md) |
| **Disponibilités & Stock** | Périodes datées exclusives (`OfferAvailability`), aucun stock global statique | `✅ Implémenté` | [`ADR-0002`](docs/adr/0002-disponibilites-par-periodes-vs-stock.md) |
| **Fournisseurs Spécialisés** | Validation stricte par catégorie (`HOTEL`, `FLIGHT`, `CAR`, `TAXI`, `ACTIVITY`) | `✅ Implémenté` | [`ADR-0003`](docs/adr/0003-fournisseurs-specialises-par-categorie.md) |
| **Catalogue & Recherche** | Recherche multi-critères, filtres à facettes, tri dynamique, pagination | `✅ Implémenté` | [`ADR-0008`](docs/adr/0008-catalogue-public-unique.md) |
| **Panier & Promotions** | Panier connecté, fusion d'items, calculs TTC en MAD, codes promotionnels | `✅ Implémenté` | [`docs/regles_metier.md#5-panier-et-codes-promotionnels`](docs/regles_metier.md) |
| **Packages / Bundles** | Composition de packs dynamiques multi-offres par les agents, prix remisé | `✅ Implémenté` | [`docs/regles_metier.md#4-packages-touristiques-bundles`](docs/regles_metier.md) |
| **Réservations** | Réservation transactionnelle atomique, verrouillage, voucher PDF avec QR code | `✅ Implémenté` | [`docs/regles_metier.md#6-cycle-de-vie-dune-réservation`](docs/regles_metier.md) |
| **Annulation & Indemnités** | Barème automatisé : gratuit >48h, 50% entre 24h et 48h, 0% <24h | `✅ Implémenté` | [`docs/regles_metier.md#7-politique-dannulation-et-restitution`](docs/regles_metier.md) |
| **Paiements (Sandbox & Cash)** | Carte bancaire sandbox (idempotence HTTP), encaissement espèces agent, webhook HMAC | `✅ Implémenté` | [`docs/regles_metier.md#8-système-de-paiement--idempotence`](docs/regles_metier.md) |
| **Notifications** | Cloche in-app temps réel, gestion des préférences, support SMTP/Mailpit optionnel | `✅ Implémenté` | [`docs/notifications.md`](docs/notifications.md) |
| **Statistiques & Reporting** | Dashboard Chart.js 4.4.8, KPI chiffre d'affaires/occupation, exports CSV | `✅ Implémenté` | [`docs/statistiques.md`](docs/statistiques.md) |
| **Support Client (Tickets)** | Billetterie SAV avec fil de discussion persistant client/agent/admin | `✅ Implémenté` | [`docs/api_endpoints.md#14-tickets-de-support`](docs/api_endpoints.md) |
| **Favoris, Audit & Paramètres** | Favoris client, journal d'audit append-only (Admin), maintenance globale | `✅ Implémenté` | [`docs/regles_metier.md#13-journal-daudit-et-traçabilité`](docs/regles_metier.md) |
| **Design System & UX** | Architecture CSS `@layer`, tokens `av-*`, Dark mode sans scintillement (FOUT) | `✅ Implémenté` | [`docs/design/guide_composants.md`](docs/design/guide_composants.md) |
| **Accessibilité (A11y)** | 100% conforme WCAG 2.1 AA (audité par axe-core), navigation clavier, aria | `✅ Implémenté` | [`docs/design/accessibilite.md`](docs/design/accessibilite.md) |
| **Composants Riches** | Carte interactive Leaflet 1.9.4 auto-hébergée, Lightbox plein écran tactile | `✅ Implémenté` | [`docs/design/guide_composants.md`](docs/design/guide_composants.md) |
| **Avis & Modération** | Avis clients vérifiés post-séjour, modération admin, réponse fournisseur | `✅ Implémenté` | [`docs/regles_metier.md#12-avis-et-notations-clients`](docs/regles_metier.md) |
| **Internationalisation (i18n)** | Trilingue FR / EN / AR, support RTL complet, 6 formes de pluriel arabes | `✅ Implémenté` | [`docs/i18n/guide_i18n.md`](docs/i18n/guide_i18n.md), [`ADR-0009`](docs/adr/0009-i18n-runtime-vanilla-vs-build-time.md) |
| **Multi-Devises Indicatives** | Taux de change en direct (EUR, USD, GBP), règle d'or financière MAD stricte | `✅ Implémenté` | [`docs/i18n/devises.md`](docs/i18n/devises.md), [`ADR-0004`](docs/adr/0004-dirham-marocain-reference-devises-indicatives.md) |
| **CI / CD Pipeline** | GitHub Actions automatisé (compilation, tests Maven, audit docs, linter JS) | `🔲 Prévu` (Phase 11) | [`docs/decisions_a_prendre.md`](docs/decisions_a_prendre.md) |
| **Build & Minification Prod** | Bundling/minification optionnel des assets JS/CSS pour CDN haute performance | `🔲 Prévu` (Phase 13) | [`docs/decisions_a_prendre.md`](docs/decisions_a_prendre.md) |
| **Conteneurisation Docker Prod** | Dockerfile multi-stage, docker-compose orchestration production | `🔲 Prévu` (Phase 16) | [`docs/decisions_a_prendre.md`](docs/decisions_a_prendre.md) |

---

## 3. Stack Technique & Versions

### Backend
- **Langage :** Java 21 LTS (OpenJDK 21.0.x)
- **Framework :** Spring Boot 3.3.4
- **Modules Spring :** Spring Web, Spring Data JPA, Spring Security, Jakarta Bean Validation, Spring Actuator
- **Sécurité & JWT :** JJWT (`io.jsonwebtoken`) 0.12.6, BCrypt (cost factor 12)
- **Rate Limiting :** Bucket4j 8.10.1
- **Cache local :** Caffeine 3.1.8
- **Bases de données :** MySQL 8.0 / MariaDB 10.11 (développement & production), H2 Database 2.3.232 (tests unitaires en mémoire)
- **Génération PDF :** OpenPDF / iText 8 & ZXing (génération QR codes signés)
- **Outil de build :** Apache Maven 3.9+ via Maven Wrapper inclus (`./mvnw`, `mvnw.cmd`)

### Frontend
- **Architecture :** Vanilla JavaScript ES2022 modulaire (sans framework, sans transpileur obligatoire)
- **Styles :** CSS3 moderne avec `@layer` (base, components, utilities) et tokens `--av-*`
- **Typographie :** Plus Jakarta Sans (latin) & Noto Sans Arabic (arabe)
- **Cartographie :** Leaflet 1.9.4 (auto-hébergé, OpenStreetMap tiles)
- **Visualisation graphique :** Chart.js 4.4.8 (tableaux de bord)
- **Iconographie :** Lucide Icons (auto-hébergé + CDN fallback)

---

## 4. Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé sur votre machine hôte :
1. **Java Development Kit (JDK) 21 LTS** ou supérieur (Oracle JDK ou Eclipse Temurin).  
   Vérifier avec : `java -version`
2. **Serveur de Base de Données MySQL 8.0+** ou **MariaDB 10.6+** écoutant sur le port `3306`.  
   (Accessible via XAMPP, Laragon, WampServer ou service natif MySQL).
3. **Node.js LTS (v18+)** pour le serveur statique de développement et les outils de validation.  
   Vérifier avec : `node -v`
4. *(Optionnel)* **Mailpit** ou **MailHog** pour intercepter localement les e-mails de notification sur le port SMTP `1025`.

---

## 5. Démarrage Rapide (< 10 minutes)

Le chronomètre mesuré de première installation et démarrage est de **~12 secondes** de compilation et **~2 secondes** de lancement de serveur.

### Étape 1 : Cloner le dépôt
```bash
git clone https://github.com/votre-organisation/travel-agency-app.git
cd travel-agency-app
```

### Étape 2 : Préparer la base de données MySQL
Connectez-vous à votre serveur MySQL et créez la base de données :
```sql
CREATE DATABASE IF NOT EXISTS travel_agency_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Étape 3 : Démarrer le Backend (Spring Boot)

#### Sur Windows (PowerShell) :
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

#### Sur Linux / macOS (Bash) :
```bash
cd backend
chmod +x ./mvnw
./mvnw spring-boot:run
```

Le backend initialise automatiquement la base de données via Hibernate (`update`) et le seeder dev (`DataSeeder`), puis écoute sur **`http://localhost:8080`**.

### Étape 4 : Démarrer le Frontend

Dans un **second terminal**, depuis la racine du dépôt :
```bash
node scripts/serve_frontend.mjs
```
Le serveur statique écoute sur **`http://127.0.0.1:5500`**.

### Étape 5 : Accéder à l'application
- **Accueil public :** [http://127.0.0.1:5500/frontend/accueil.html](http://127.0.0.1:5500/frontend/accueil.html)
- **Page de connexion :** [http://127.0.0.1:5500/frontend/connexion.html](http://127.0.0.1:5500/frontend/connexion.html)
- **Contrôle de santé API :** [http://localhost:8080/api/status](http://localhost:8080/api/status)
- **Documentation OpenAPI (Swagger UI) :** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## 6. Configuration & Variables d'Environnement

Le fichier [`.env.example`](.env.example) liste l'intégralité des variables de configuration. En développement, les valeurs par défaut définies dans `backend/src/main/resources/application-dev.properties` permettent un fonctionnement immédiat sans modification.

| Variable | Rôle | Valeur par défaut (Dev) | Obligatoire en Prod ? |
|---|---|---|:---:|
| `SPRING_PROFILES_ACTIVE` | Profil Spring actif (`dev`, `test`, `prod`) | `dev` | Oui |
| `DB_URL` | URL JDBC MySQL | `jdbc:mysql://localhost:3306/travel_agency_db?useSSL=false&serverTimezone=UTC` | Oui |
| `DB_USERNAME` | Utilisateur MySQL | `root` | Oui |
| `DB_PASSWORD` | Mot de passe MySQL | *(vide en dev local)* | Oui |
| `JWT_SECRET` | Clé secrète de signature HMAC-SHA256 (>= 256 bits) | *(Clé dev publique non sécurisée)* | **Oui (Strict)** |
| `VOUCHER_SECRET` | Clé secrète de signature QR codes vouchers | *(Clé dev publique)* | **Oui (Strict)** |
| `PAYMENT_WEBHOOK_SECRET` | Clé secrète HMAC de validation du webhook CMI | *(Clé dev publique)* | **Oui (Strict)** |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées par le navigateur | `http://localhost:5500,http://127.0.0.1:5500` | Oui |
| `MAIL_ENABLED` | Active l'envoi effectif d'e-mails SMTP | `false` | Optionnel |
| `APP_BASE_URL` | URL de base du frontend pour les liens d'e-mails | `http://127.0.0.1:5500/frontend` | Oui |

> [!CAUTION]
> **Règle Zéro Secret :** Ne versionnez jamais de fichier `.env` ou de mots de passe réels dans Git. En production, les secrets doivent être fournis par le gestionnaire de secrets du système hôte ou injectés par variables d'environnement.

---

## 7. Comptes de Démonstration (Développement Local)

En profil `dev`, le `DataSeeder` insère automatiquement un jeu de données initial complet avec les comptes suivants :

| Rôle | Nom & Spécialité | Adresse Email | Mot de passe (Dev) |
|---|---|---|---|
| **ADMIN** | Omar Tazi (Superviseur Plateforme) | `omar.tazi@atlasvoyage.ma` | `password123` |
| **SUPPLIER** | Karim Riads (**Hôtels & Riads**) | `karim.idrissi@atlasvoyage.ma` | `password123` |
| **SUPPLIER** | Royal Air Atlas (**Vols**) | `vols@atlasvoyage.ma` | `password123` |
| **SUPPLIER** | Atlas Auto Drive (**Locations**) | `voitures@atlasvoyage.ma` | `password123` |
| **SUPPLIER** | Marrakech Shuttle (**Taxis/Transferts**) | `transferts@atlasvoyage.ma` | `password123` |
| **SUPPLIER** | Sahara Aventure (**Excursions**) | `excursions@atlasvoyage.ma` | `password123` |
| **AGENT** | Nadia El Fassi (Gestionnaire Guichet & Packs) | `nadia.elfassi@atlasvoyage.ma` | `password123` |
| **CLIENT** | Sarah Benali (Voyageuse Individuelle) | `sarah.benali@example.com` | `password123` |

---

## 8. Commandes Utiles & Tests

### Lancer la suite complète de tests unitaires et d'intégration Backend
```bash
cd backend
./mvnw clean test
```
*(Résultat attendu : 397 tests exécutés, 0 échec, 0 erreur, couverture JaCoCo validée).*

### Lancer les vérifications de syntaxe Frontend
```bash
node --check frontend/js/app.js
node --check frontend/client/js/app.js
node --check frontend/supplier/js/app.js
node --check frontend/agent/js/app.js
node --check frontend/admin/js/app.js
```

### Exécuter le test de fumée (Smoke Test)
Vérifie la connectivité HTTP, les statuts d'API et la disponibilité des pages HTML :
```bash
node scripts/frontend_smoke_test.mjs
```

### Lancer les tests d'API automatisés avec Newman
```bash
npx newman run docs/postman/AtlasVoyage.postman_collection.json -e docs/postman/env.dev.json
```

### Contrôle de qualité de la documentation (Docs-as-Code)
```bash
npm run docs:check
```

---

## 9. Arborescence du Projet

```
travel-agency-app/
├── backend/                       # Application Spring Boot 3.3.4 (Java 21)
│   ├── src/main/java/com/agence/voyage/
│   │   ├── config/                # Configurations (CORS, Security, Async, Cache, i18n)
│   │   ├── controller/            # 23 Contrôleurs REST (126 endpoints)
│   │   ├── dto/                   # Objets de transfert de données (Request/Response)
│   │   ├── entity/                # 40 Entités JPA (Single Table Offres, Audit, Réservations)
│   │   ├── exception/             # Gestion centralisée des erreurs & ErrorCode
│   │   ├── repository/            # Interfaces Spring Data JPA
│   │   ├── security/              # Filtres JWT, CSRF, Rate Limiting & UserDetailsService
│   │   └── service/               # Logique métier transactionnelle
│   ├── src/main/resources/        # Propriétés applicatives, templates emails, i18n messages
│   ├── src/test/java/             # 397 tests d'intégration et unitaires JUnit 5
│   └── pom.xml                    # Descripteur de build Maven
├── frontend/                      # Interface utilisateur Vanilla JavaScript & CSS
│   ├── admin/                     # Espace d'administration (SPA ?page=...)
│   ├── agent/                     # Espace agent de voyage & encaissement guichet
│   ├── supplier/                  # Espace fournisseur & wizard d'offres
│   ├── client/                    # Espace client & gestion des réservations
│   ├── css/                       # Feuilles de style modulaires @layer (tokens av-*)
│   ├── js/                        # Briques partagées (auth, api, config, i18n, toast, modal)
│   └── *.html                     # Pages publiques (accueil, catalogue, offre, panier, connexion)
├── docs/                          # Référentiel documentaire Docs-as-Code
│   ├── adr/                       # 10 Décisions d'architecture (MADR)
│   ├── api/                       # Spécification OpenAPI 3.0.3, guide API et codes d'erreur
│   ├── assets/                    # Schémas et captures d'écran des espaces
│   ├── design/                    # Guides design system, accessibilité WCAG AA, DA
│   ├── exploitation/              # Manuels d'exploitation, runbooks et supervision
│   ├── i18n/                      # Guides internationalisation, RTL et conversion de devises
│   ├── manuel/                    # Guides d'utilisation pas-à-pas par rôle
│   ├── postman/                   # Collection Postman (181 requêtes) et environnements
│   ├── securite/                  # Matrice des autorisations, modèle de menaces STRIDE
│   ├── architecture.md            # Document d'architecture globale (C4 model, ER, flux)
│   ├── regles_metier.md           # Référentiel exhaustif des règles métier
│   └── ETAT_COMPLET_PROJET.md     # État d'avancement détaillé et exhaustif du projet
├── scripts/                       # Scripts utilitaires d'automatisation et de documentation
│   ├── docs/                      # Générateurs et validateurs de documentation
│   └── serve_frontend.mjs         # Serveur HTTP local pour le développement frontend
└── README.md                      # Le présent document
```

---

## 10. Dépannage & FAQ Technique

### Pourquoi mes cookies de session ne sont-ils pas enregistrés ?
L'application utilise des cookies sécurisés `SameSite=Lax` et `HttpOnly`. Le navigateur refuse de partager des cookies entre des domaines différents.  
👉 **Solution :** Utilisez impérativement **`http://127.0.0.1:5500`** ou **`http://localhost:5500`** pour accéder au frontend, et assurez-vous que `backend/src/main/resources/application-dev.properties` contient bien cette origine dans `cors.allowed-origins`.

### Erreur `Access-Control-Allow-Origin` (CORS) lors des appels API
Cette erreur survient si vous servez le frontend sur un port différent (ex. `5501` ou `3000`).  
👉 **Solution :** Démarrez le serveur statique avec `node scripts/serve_frontend.mjs` (port par défaut `5500`), ou configurez la variable d'environnement `CORS_ALLOWED_ORIGINS` côté backend.

### Erreur `Access denied for user 'root'@'localhost'`
Le backend tente de se connecter à MySQL avec l'utilisateur `root` et un mot de passe vide par défaut.  
👉 **Solution :** Si votre MySQL requiert un mot de passe, définissez la variable d'environnement avant de lancer Spring Boot :  
`$env:DB_PASSWORD="votre_mot_de_passe"` (PowerShell) ou `export DB_PASSWORD=votre_mot_de_passe` (Bash).

### Port 8080 ou 5500 déjà utilisé
Si un processus occupe déjà l'un des ports :
- Sur Windows : `netstat -ano | findstr :8080` puis `taskkill /PID <PID> /F`
- Sur Linux/Mac : `lsof -i :8080` puis `kill -9 <PID>`

---

## 11. Documentation & Liens Utiles

Le portail central de documentation est situé dans [`docs/README.md`](docs/README.md).

- **Architecture & Modèle Conceptuel :** [`docs/architecture.md`](docs/architecture.md)
- **Règles Métier Exhaustives :** [`docs/regles_metier.md`](docs/regles_metier.md)
- **Inventaire des Endpoints (126 routes) :** [`docs/api_endpoints.md`](docs/api_endpoints.md)
- **Contrat OpenAPI 3.0.3 :** [`docs/api/openapi.yaml`](docs/api/openapi.yaml)
- **Catalogue des Codes d'Erreur API :** [`docs/api/codes_erreur.md`](docs/api/codes_erreur.md)
- **Guides d'Exploitation & Runbooks :** [`docs/exploitation/README.md`](docs/exploitation/README.md)
- **Guides Utilisateurs par Rôle :** [`docs/manuel/README.md`](docs/manuel/README.md)
- **État d'Avancement Global :** [`docs/ETAT_COMPLET_PROJET.md`](docs/ETAT_COMPLET_PROJET.md)
- **Décisions Ouvertes à Prendre :** [`docs/decisions_a_prendre.md`](docs/decisions_a_prendre.md)

---

## 12. Contribution & Sécurité

- Pour contribuer au projet, veuillez lire attentivement le guide de contribution : [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Pour signaler une vulnérabilité de sécurité, suivez notre politique de divulgation responsable : [`SECURITY.md`](SECURITY.md).
- Code de conduite communautaire : [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
