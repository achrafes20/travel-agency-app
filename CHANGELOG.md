# Changelog — Atlas Voyage

Toutes les modifications notables apportées au projet Atlas Voyage sont documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.17.0-rc1] - 2026-11-02 (Phase 17 : Recette Finale & Démonstration)

### Ajouté
- **Plan et méthodologie de recette complète :** Documentation détaillée dans `docs/recette/plan_de_recette.md` fixant les critères d'entrée/sortie, périmètres, risques et outils.
- **Matrice de traçabilité des exigences :** Traçabilité exhaustive des 52 exigences fonctionnelles et techniques dans `docs/recette/matrice_tracabilite.md`.
- **Cahiers de tests détaillés par rôle :** 7 cahiers dans `docs/recette/cas_de_test/` couvrant Invité (`invite.md`), Authentification (`auth.md`), Client (`client.md`), Fournisseur (`fournisseur.md`), Agent (`agent.md`), Administrateur (`admin.md`), et Transverses (`transverses.md`).
- **Campagne E2E Chromium automatisée :** Runner Puppeteer `e2e/recette/runner.mjs` exécutant 39 scénarios fonctionnels avec génération de 39 captures d'écran certifiées dans `docs/recette/preuves/` (taux de succès de 100.0%).
- **Outillage de vérification automatisée :**
  - Contrôle d'intégrité relationnelle et financière BDD (`scripts/recette/check_integrity.mjs`) validant 0 capacité négative, monnaie 100% MAD et 0 orphelin.
  - Détection de fausses données (`scripts/recette/find_mock_data.mjs`) certifiant 0 mock data sur 21 écrans.
  - Mesure du temps d'installation à froid (`scripts/recette/fresh_install_test.mjs`) validant 4,59s (< 10 min requis).
  - Réinitialisation démo idempotente express (`scripts/recette/reset_demo.mjs`) exécutée en 0,44s (< 2 min requis).
  - Orchestrateur global `npm run recette:all` (`scripts/recette/run_all.mjs`).
- **Dossier de démonstration 10 minutes :**
  - Scénario minuté minute par minute avec script oral exact (`docs/demo/scenario_10_min.md`).
  - Référentiel du jeu de données démo et licences Unsplash (`docs/demo/jeu_de_donnees_demo.md`).
  - 4 procédures de secours testées Plan B (`docs/demo/plan_b.md`).
  - Checklist opérationnelle du Jour J (`docs/demo/checklist_jour_j.md`).
  - FAQ d'anticipation de 18 questions techniques du jury (`docs/demo/questions_reponses.md`).
- **Gouvernance et certification :**
  - Registre d'anomalies qualifié (`docs/recette/registre_anomalies.md`).
  - Checklist technique exhaustive (`docs/recette/checklist_technique.md`).
  - Cahier des vérifications humaines obligatoires (`docs/recette/humain_a_realiser.md`).
  - Procès-verbal de décision officielle **GO SOUS CONDITIONS** (`docs/recette/decision_go_no_go.md`).
  - Rapport final de recette (`docs/recette/rapport_final_recette.md`).

### Corrigé
- **Collision de clé unique SQL sur Chefchaouen (ANO-04) :** Correction de la méthode `seedCity()` dans `DataSeeder.java` pour combiner `findByNormalizedName` et `findByNameIgnoreCase`, résolvant l'échec de démarrage sur base existante avec test de non-régression validé.

---

## [1.15.0] - 2026-11-01 (Phase 15 : Documentation & Docs-as-Code)

### Ajouté
- **Portail central de documentation :** Création de `docs/README.md` avec plan d'accès par persona et conventions rédactionnelles (`conventions_documentation.md`).
- **Contrat OpenAPI 3.0.3 complet :** Fichier `docs/api/openapi.yaml` couvrant les **126 endpoints REST** réels extraits du code, avec schémas de données et guide d'intégration HTTP (`docs/api/guide_api.md`).
- **Catalogue des codes d'erreur :** Inventaire exhaustif des 58 codes applicatifs stables (`docs/api/codes_erreur.md`).
- **Collection Postman v2.1 synchronisée :** 18 dossiers, 181 requêtes avec assertions automatiques (`docs/postman/AtlasVoyage.postman_collection.json`) et environnements dev/prod sécurisés.
- **Architecture logicielle & ADRs :** Document d'architecture C4, diagramme Entité-Relation Mermaid de 40 entités JPA, dictionnaire de données complet, 4 diagrammes de flux et 10 décisions d'architecture MADR (`docs/adr/`).
- **Manuels d'exploitation :** Suite opérationnelle dans `docs/exploitation/` (configuration, déploiement systemd/nginx, sauvegardes, supervision Actuator, runbooks d'incidents et calendrier de maintenance).
- **Manuels utilisateurs par rôle :** 6 guides illustrés dans `docs/manuel/` avec captures d'écran automatisées pour Invité, Client, Fournisseur, Agent et Administrateur.
- **Gouvernance & Fichiers communautaires :** `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` et templates GitHub.
- **Outillage d'assurance qualité Docs-as-Code :** Scripts d'extraction et de validation automatique des liens, Mermaid et endpoints (`npm run docs:check`).

---

## [1.14.0] - 2026-10-31 (Phase 14 : Internationalisation & Devises)

### Ajouté
- Prise en charge trilingue complète : Français (`fr`, référence), Anglais (`en`), Arabe (`ar` avec RTL complet).
- Moteur i18n Vanilla JS sans compilation avec support des 6 formes grammaticales de pluriels arabes via `Intl.PluralRules`.
- 19 namespaces JSON traduits à 100% (`frontend/locales/`).
- Module de devises indicatives (EUR, USD, GBP) avec règle d'or financière MAD stricte (débits 100% en Dirhams).
- Entités JPA `OfferTranslation` et `CityTranslation` pour le contenu multilingue dynamique.

---

## [1.12.0] - 2026-10-30 (Phase 12 : Design System, UX, A11y & Composants)

### Ajouté
- Design system complet avec architecture CSS `@layer` et tokens `--av-*`.
- Palette de couleurs marocaines (Bleu Majorelle, Ambre, Terre Cuite).
- Conformité d'accessibilité certifiée **100% WCAG 2.1 AA** (0 violation sur 14 pages auditées par axe-core).
- Tunnel de réservation interactif en 4 étapes (`av-stepper`).
- Visionneuse plein écran accessible (`lightbox.js`) et carte Leaflet 1.9.4 auto-hébergée.
- Module complet d'avis et notations clients vérifiés après séjour (`Review`) avec modération admin et réponse fournisseur.

---

## [1.10.0] - 2026-10-29 (Phase 10 : Sécurité OWASP Top 10 & Robustesse)

### Ajouté
- Authentification par cookies `HttpOnly`, `Secure`, `SameSite=Lax` (zéro token dans Web Storage).
- Refresh token opaque avec rotation et détection de rejeu révoquant toute la famille de jetons.
- Protection CSRF double-submit avec en-tête `X-XSRF-TOKEN`.
- Rate limiting Bucket4j (HTTP 429 Retry-After) et verrouillage de compte (15 min / 5 échecs).
- Politique de mots de passe stricte (min 12 caractères, liste noire).
- Module RGPD / Loi marocaine 09-08 (export de données personnelles et droit à l'oubli).

---

## [1.9.0] - 2026-10-28 (Phase 9 : Nettoyage des Incohérences & Consolidation)

### Modifié
- Élimination définitive du champ statique hérité `stock` au profit exclusif de `OfferAvailability`.
- Enrichissement de l'entité `City` (pays, aéroport, géocodage Open-Meteo résilient).
- Factorisation des utilitaires Frontend communs (`dom.js`, `format.js`, `toast.js`).

---

## [1.8.0] - 2026-10-27 (Phase 8 : Favoris, Audit & Paramètres)

### Ajouté
- Module Favoris persistant pour les clients.
- Journal d'audit immuable (*append-only*) traçant les événements sensibles avec export CSV.
- Module de configuration globale avec cache atomique et mode maintenance HTTP 503.

---

## [1.7.0] - 2026-10-26 (Phase 7 : Billetterie de Support)

### Ajouté
- Module Tickets de support client/agent/admin avec fil de discussion persistant et notifications temps réel.

---

## [1.6.0] - 2026-10-25 (Phase 6 : Profils, Sécurité & Médias)

### Ajouté
- Profils complets pour les 4 rôles avec informations légales fournisseurs.
- Gestion du téléversement d'avatars et photos avec validation MIME stricte et quotas.

---

## [1.5.0] - 2026-10-24 (Phase 5 : Statistiques & Tableaux de Bord)

### Ajouté
- Quatre dashboards statistiques réels avec graphiques Chart.js et exports comptables CSV.

---

## [1.4.0] - 2026-10-23 (Phase 4 : Notifications & Messagerie)

### Ajouté
- Cloche de notifications in-app, gestion des préférences et support SMTP multipart optionnel.

---

## [1.3.0] - 2026-10-22 (Phase 3 : Paiements Sandbox & Espèces)

### Ajouté
- Paiement carte bancaire sandbox avec idempotence HTTP (`Idempotency-Key`).
- Encaissement des règlements en espèces au guichet par les agents.
- Webhook sécurisé par signature HMAC-SHA256.

---

## [1.2.0] - 2026-10-21 (Phase 2 : Réservations & Vouchers)

### Ajouté
- Réservations transactionnelles atomiques avec verrouillage de capacité.
- Génération de bons d'échange (vouchers) PDF avec QR code signé cryptographiquement.
- Barème d'annulation automatisé (48h / 24h).

---

## [1.1.0] - 2026-10-20 (Phase 1 : Fondations Applicatives)

### Ajouté
- Architecture Single Table Inheritance pour les 5 catégories d'offres touristiques.
- Catalogue public unique, recherche multi-critères, panier connecté et packages multi-offres (bundles).
