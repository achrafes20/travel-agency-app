# Plan de Recette Globale — Atlas Voyage (Phase 17)

## 1. Objet et Objectifs du Document

Le présent document constitue le plan de recette fonctionnelle, technique et opérationnelle de la plateforme **Atlas Voyage**.  
Il formalise le cadre d'évaluation qualité, les conditions de passage des tests, la traçabilité des exigences, ainsi que la méthodologie retenue pour prononcer la décision de mise en production (**Go / No-Go**).

La mission de recette ne consiste pas à développer de nouvelles fonctionnalités, mais à :
1. **Évaluer de manière objective et vérifiable** l'état réel de conformité du logiciel vis-à-vis des spécifications des Phases 1 à 16.
2. **Fournir des preuves concrètes** (captures d'écran, logs de compilation, résultats d'exécution SQL et E2E automatisés) sans simulation ni invention.
3. **Identifier et isoler les anomalies résiduelles** (P0, P1, P2, P3) et valider les correctifs ciblés.
4. **Émettre une décision d'autorisation de mise en service argumentée et honnête**.

---

## 2. Périmètre de Recette

### 2.1 Périmètre Couvert (In-Scope)
- **Site Public & Invité** : Accueil, navigation, catalogue dynamique, filtres combinés, fiche détail de l'offre (Single Table Inheritance), redirection vers la connexion lors d'une tentative de réservation (pas de panier invité), sélecteur de devises, pages d'erreurs (404, 500). *Support trilingue (FR, EN, AR) avec RTL natif : désactivé dans l'interface depuis ce périmètre initial, voir `ANO-10`.*
- **Authentification & Gestion des Rôles** : Inscription avec contrôle de robustesse du mot de passe (12 caractères minimum, 4 classes ; le consentement RGPD n'est plus recueilli depuis le 9 novembre 2026), connexion JWT avec option « Se souvenir de moi » avec cookies HttpOnly / SameSite=Lax, réinitialisation de mot de passe, déconnexion, contrôle d'accès strict par rôle (`CLIENT`, `SUPPLIER`, `AGENT`, `ADMIN`), rate-limiting Bucket4j sur `/api/auth/*`.
- **Espace Client** : Tableau de bord, consultation et annulation des réservations, tunnel de commande en 4 étapes (`av-stepper`), billetterie de support SAV, gestion des favoris, notations et avis par étoiles, export RGPD du profil.
- **Espace Fournisseur** : Métriques d'activité, wizard de création d'offres en 4 étapes avec support multilingue et coordonnées géographiques, gestion du cycle de vie des offres (modération), calendrier des disponibilités et alertes de stock faible, suivi des commandes, statistiques de ventes.
- **Espace Agent** : Guichet d'encaissement d'espèces avec génération de reçu unique, composition de packages touristiques (Bundles) multi-offres remisés, supervision des réservations au comptoir, traitement des tickets SAV.
- **Espace Administrateur** : Vue d'ensemble de la plateforme (KPIs, volume d'affaires), modération des offres avec motif de rejet obligatoire, gestion et déverrouillage des utilisateurs, journal d'audit immuable (append-only) avec export CSV, configuration dynamique des paramètres système et bascule en mode maintenance.
- **Architecture Technique & Données** :
  - Backend Spring Boot 3.3.4 (Java 21) avec Spring Data JPA et Spring Security.
  - Base de données MySQL 8.0 en développement, H2 en mémoire pour les suites de tests.
  - Intégrité référentielle, contraintes financières en MAD, absence de capacité négative.
  - Absence totale de données factices ou simulées (mock data) dans le code de production.

### 2.2 Hors Périmètre (Out-of-Scope)
- Passerelle bancaire de production CMI / VISA / Mastercard réelle (utilisation de la Sandbox CMI documentée).
- Passerelle SMS réelle pour les notifications OTP (simulée via log et notifications in-app).
- Envoi réel d'e-mails par SMTP externe de production (gestion via capture locale et logs applicatifs).
- Phases d'infrastructures non intégrées dans le dépôt :
  - **Phase 11** : Workflows CI/CD GitHub Actions automatisés.
  - **Phase 13** : Chaîne d'outillage de minification/bundling `dist/` en production.
  - **Phase 16** : Fichiers `Dockerfile` et `docker-compose.yml` multi-conteneurs de production.

---

## 3. Environnements et Outils de Test

### 3.1 Matrice des Environnements
| Composant | Environnement de Recette | Caractéristiques / Versions |
| :--- | :--- | :--- |
| **Système Hôte** | Windows 11 Pro 64-bit | Environnement d'exécution local du poste de recette |
| **Java Development Kit** | OpenJDK 21.0.10 LTS | `C:\Program Files\Java\jdk-21.0.10` |
| **Serveur Backend** | Spring Boot 3.3.4 | Port 8080 (`http://localhost:8080`) |
| **Base de Données** | MySQL 8.0 / MariaDB 10.4.32 | Port 3306 (`travel_agency_db`), utilisateur `root` |
| **Serveur Frontend** | Serveur HTTP Node.js | Port 5500 (`http://localhost:5500/frontend`) |
| **Navigateur E2E** | Google Chrome 128+ | Moteur Chromium piloté via `puppeteer-core` |
| **Suite de Tests Backend** | JUnit 5 + Spring Boot Test | 399 tests d'intégration et unitaires (397 à la campagne du 2 novembre 2026, +2 le 9 novembre) |

### 3.2 Outillage de Recette
- **Script de contrôle d'intégrité SQL** : `scripts/recette/check_integrity.mjs`
- **Script de détection de données mockées** : `scripts/recette/find_mock_data.mjs`
- **Script de test de performance d'installation** : `scripts/recette/fresh_install_test.mjs`
- **Script de réinitialisation de démonstration** : `scripts/recette/reset_demo.mjs`
- **Runner E2E automatisé** : `e2e/recette/runner.mjs`
- **Orchestrateur global de recette** : `scripts/recette/run_all.mjs`

---

## 4. Critères d'Entrée et de Sortie

### 4.1 Critères d'Entrée en Recette (Entry Criteria)
1. **Compilation Backend sans erreur** : `mvnw.cmd clean compile` s'exécute avec succès sous JDK 21.
2. **Suite de tests automatisés au vert** : 100% des tests JUnit 5 (399 au 9 novembre 2026) passent avec succès.
3. **Schéma de base de données à jour** : Les tables MySQL sont créées et cohérentes sans erreur de migration.
4. **Contrat OpenAPI et Documentation synchronisés** : L'outil `npm run docs:check` valide à 100% la parité des 126 endpoints et les liens.

### 4.2 Critères de Sortie (Exit Criteria pour Go / No-Go)
- **Blocage P0** : **0 anomalie P0 ouverte** (bloquante pour les flux vitaux ou l'intégrité financière).
- **Majeures P1** : **0 anomalie P1 non dérogée**. Toute P1 résiduelle doit faire l'objet d'un plan d'action validé avec date de livraison et propriétaire identifié.
- **Taux de succès des tests fonctionnels** : **≥ 95%** sur la campagne de tests automatisés.
- **Intégrité des données** : **0 violation** constatée lors des requêtes d'intégrité SQL (aucune capacité négative, monnaie 100% MAD, aucun orphelin).
- **Données factices** : **0 mock** résiduel dans le code frontend de production.
- **Temps d'installation à froid** : **< 10 minutes** mesuré en conditions réelles.
- **Réinitialisation du jeu démo** : **< 2 minutes** mesuré.

---

## 5. Typologie et Gestion des Anomalies

Les écarts constatés durant la recette sont classifiés selon l'échelle suivante :

| Niveau | Désignation | Description | Impact sur la Décision |
| :--- | :--- | :--- | :--- |
| **P0** | **Critique / Bloquant** | Perte de données, corruption financière, faille de sécurité critique, blocage total d'un rôle. | **NO-GO Immédiat** |
| **P1** | **Majeur** | Fonctionnalité clé indisponible sans contournement immédiat, composant de déploiement manquant. | **GO SOUS CONDITIONS** (si dérogation formalisée) |
| **P2** | **Mineur** | Dysfonctionnement partiel avec solution de contournement documentée, anomalie cosmétique visible. | **GO Acceptable** (planifié pour sprint correctif) |
| **P3** | **Trivial** | Amélioration ergonomique, coquille textuelle, écart esthétique sans impact fonctionnel. | **GO Acceptable** |

---

## 6. Stratégie de Gestion des Risques

| Risque Identifié | Probabilité | Impact | Stratégie d'Atténuation / Contingence |
| :--- | :--- | :--- | :--- |
| **Conflit de ports locaux (8080 ou 5500)** | Moyenne | Élevé | Script de diagnostic automatique et kill de processus avant démarrage ; fallback sur ports alternatifs (8081 / 5501). |
| **Rate Limiting Bucket4j sur l'authentification** | Faible | Moyen | Temporisation calibrée dans les scénarios E2E et capacité d'authentification IP configurée à 20 requêtes/minute. |
| **Désynchronisation du jeu de données démo** | Moyenne | Moyen | Script idempotent `reset_demo.mjs` réinitialisant la BDD en 0,44 seconde. |
| **Absence d'accès réseau externe durant la démo** | Faible | Élevé | Démonstration 100% autonome en local (aucun appel externe obligatoire, polices et CDN mis en cache). |

