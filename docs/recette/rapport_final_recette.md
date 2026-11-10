# Rapport Final de Recette — Atlas Voyage (Phase 17)

## 1. Synthèse Exécutive & Contexte du Projet

Le présent rapport clôture la **Phase 17 : Recette finale et démonstration** de la plateforme **Atlas Voyage**, solution web de référence pour le tourisme et les voyages au Maroc (Riads, Hôtels, Vols, Locations de véhicules, Taxis/Transferts et Excursions).

La mission de recette s'est attachée à vérifier avec une rigueur absolue la réalité du travail accompli sur l'ensemble des chantiers (Phases 1 à 16), en s'appuyant exclusivement sur des **preuves matérielles vérifiables** (logs de compilation JDK 21, rapports d'exécution JUnit 5, contrôles d'intégrité SQL MySQL, scans automatisés de code et captures d'écran E2E sous Chromium).

### Chiffres Clés de la Recette
- **Tests Unitaires & Intégration Backend (JUnit 5)** : **397 / 397 réussis (100%)**, 0 échec, 0 régression.
- **Tests Fonctionnels E2E Automatisés** : **39 / 39 réussis (100.0%)**, 0 échec, 39 preuves graphiques archivées.
- **Requêtes d'Intégrité BDD Réelles** : **9 / 9 règles validées**, **0 violation** (0 capacité négative, monnaie 100% MAD).
- **Parité de Documentation API (OpenAPI 3.0.3)** : **126 / 126 endpoints synchronisés**, 0 secret exposé.
- **Détection de Données Bouchonnées** : **0 mock résiduel**, 21 écrans connectés à l'API réelle.
- **Temps d'Installation & Compilation Mesuré** : **4,59 secondes** (exigence < 10 minutes validée).
- **Temps de Réinitialisation Démo Idempotente** : **0,44 seconde** (exigence < 2 minutes validée).
- **Décision Finale Prononcée** : **GO SOUS CONDITIONS** (Version cible `v1.0.0-rc1`).

---

## 2. Bilan de la Couverture Fonctionnelle par Rôle

### 2.1 Espace Public & Invité (REC-INV) — 8 Cas Validés
> *Les puces marquées ⚠️ décrivent l'état constaté le 2 novembre 2026 et ne sont plus exactes : voir l'addendum du §6.*

- ⚠️ Accueil responsive neutre avec bascule trilingue (Français, Anglais, Arabe) et thème sombre/clair.
- ⚠️ Moteur de recherche et catalogue dynamique avec filtres multicritères (catégorie, ville, budget).
- Fiche détaillée de prestation avec galerie photos, carte Leaflet interactive, avis clients et calendrier de réservation.
- ⚠️ Panier d'achats localisé sans compte, calcul TTC en MAD et persistance dans `localStorage`.
- ⚠️ Support natif de l'inversion Right-To-Left (`dir="rtl"`) pour la langue arabe.
- Cloisonnement étanche des espaces réservés (redirection automatique vers `connexion.html`).
- ⚠️ Pages institutionnelles (À propos, FAQ, CGU, Confidentialité) et page d'erreur 404 personnalisée.

### 2.2 Authentification & Sécurité (REC-AUT) — 6 Cas Validés
- ⚠️ Inscription client avec jauge de complexité de mot de passe et consentement RGPD (Loi 09-08).
- Connexion sécurisée avec émission de jeton JWT transmis par cookies `HttpOnly` / `SameSite=Lax`.
- Rejet sécurisé des tentatives frauduleuses sans divulgation d'informations (réponse HTTP 401 générique).
- Déconnexion complète invalidant la session locale et serveur.
- Protection anti-brute-force par Rate Limiting Bucket4j sur `/api/auth/*` (HTTP 429).
- Procédure de mot de passe oublié avec jeton temporaire sécurisé.

### 2.3 Espace Client (REC-CLI) — 10 Cas Validés
- Tableau de bord personnalisé avec indicateurs de séjours à venir.
- Historique complet des réservations avec statuts réels et références de dossiers.
- Tunnel d'achat en 4 étapes (`av-stepper`) fluide et sans rechargement.
- Messagerie SAV de support client avec fil de discussion horodaté.
- Gestion du profil voyageur et export des données personnelles (Loi 09-08).
- Liste personnelle d'offres favorites avec persistance BDD.
- Dépôt d'avis notés après séjour et recalcul automatique de la note moyenne de l'offre.
- Annulation de réservation avec restitution instantanée des places disponibles en BDD (verrous pessimistes).

### 2.4 Espace Fournisseur (REC-FOU) — 7 Cas Validés
- Tableau de bord prestataire avec chiffre d'affaires, volume de ventes et statut du catalogue.
- Assistant de création d'offre en 4 étapes adapté à la typologie (Hôtel, Vol, Voiture, Taxi, Excursion).
- Gestion du cycle de vie des offres et suivi de l'état de modération (Actif, En attente, Rejeté).
- Calendrier des disponibilités datées et alertes visuelles de stock faible.
- Registre des réservations passées sur les prestations du fournisseur.
- Statistiques de performance et export CSV des transactions.
- Cloisonnement strict multi-tenant interdisant l'accès aux données des autres prestataires.

### 2.5 Espace Agent de Voyage (REC-AGE) — 5 Cas Validés
- Tableau de bord opérationnel de comptoir d'agence.
- Guichet d'encaissement d'espèces avec régularisation immédiate et émission de reçu numéroté.
- Création et gestion de Packages touristiques (Bundles) multi-offres avec remise commerciale globale.
- Supervision et assistance aux réservations clients en agence physique.
- Prise en charge et traitement des réclamations clients (tickets support).

### 2.6 Espace Administrateur (REC-ADM) — 8 Cas Validés
- Tableau de bord macro-économique avec volume d'affaires consolidé de la plateforme.
- Administration des utilisateurs, attribution des rôles et déverrouillage des comptes bloqués.
- File de modération des offres en attente avec obligation de motiver tout refus.
- Journal d'audit immuable (append-only) consignant chaque action sensible avec export CSV.
- Paramètres globaux du système (frais de service) et commutateur de mode maintenance.
- Supervision centralisée de l'ensemble des flux de réservations et des paiements.
- Gestion référentielle des villes marocaines (nom normalisé unique, aéroport, géolocalisation).

---

## 3. Audits Techniques, Sécurité et Données

### 3.1 Intégrité de la Base de Données (MySQL 8.0)
L'exécution du script `scripts/recette/check_integrity.mjs` confirme le respect absolu des règles de gestion :
- **Règle 1 (Capacités positives)** : 0 créneau avec `capacity < 0`. Les verrous `PESSIMISTIC_WRITE` de Spring Data JPA protègent efficacement les allocations concurrentes.
- **Règle 2 (Cohérence temporelle)** : 100% des disponibilités vérifient `available_until >= available_from`.
- **Règle 3 (Allocations intègres)** : Chaque ligne de réservation est rattachée à une disponibilité valide sans orphelin.
- **Règle 4 (Monnaie unique)** : 100% des tarifs et transactions sont libellés en `MAD`.
- **Règle 5 (Unicité référentielle)** : Les villes disposent d'un `normalized_name` unique (anomalie `Chefchaouen` résolue).

### 3.2 Audit Zéro Mock Data Frontend
L'analyse automatisée de 21 écrans et modules JavaScript via `scripts/recette/find_mock_data.mjs` a démontré que :
- Aucun tableau statique de fausses données n'est injecté dans les vues de production.
- Toutes les pages interagissent avec les contrôleurs Spring Boot via le client HTTP `frontend/js/core/api.js`.
- Les données présentées aux utilisateurs sont exclusivement extraites de la base MySQL.

### 3.3 Sécurité OWASP & Conformité
- **CSRF / CORS** : L'API étant stateless avec authentification par jeton Bearer / cookies SameSite, la configuration Spring Security est optimale.
- **Protection XSS** : Toutes les entrées utilisateurs affichées dans le DOM sont échappées via des helpers de sécurisation (`escapeHtml` / `esc`).
- **En-têtes HTTP** : Présence systématique des en-têtes `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` sur les flux sensibles.

---

## 4. Bilan des Anomalies et Correctifs Appliqués

Durant la phase de recette, 6 anomalies ont été formellement identifiées :
- **1 anomalie P0 (Bloquante)** : Collision SQL de clé unique sur la ville de Chefchaouen lors du seeder.  
  *Statut : **Corrigée immédiatement** dans `DataSeeder.java` avec test de non-régression validé.*
- **3 anomalies P1 (Majeures)** : Phases 11 (CI/CD GitHub), 13 (Bundling dist) et 16 (Docker compose) non implémentées dans le dépôt.  
  *Statut : **Reportées sous dérogation formelle** avec conditions résolutoires et dates limites d'extinction.*
- **2 anomalies P2 (Mineures)** : Timing de navigation sous Puppeteer et cohérence de requête SQL de recette.  
  *Statut : **Corrigées et validées**.*

---

## 5. Décision Finale et Recommandations

L'équipe d'assurance qualité et release management prononce la décision suivante :

### **Verdict : 🟡 GO SOUS CONDITIONS (Release Candidate `v1.0.0-rc1`)**

### Recommandations Immédiates :
1. **Démonstration Jury (Phase 17)** : Dérouler le scénario de 10 minutes minute par minute sur l'environnement local validé (`http://localhost:5500/frontend`), en s'appuyant sur le jeu de données démo réaliste.
2. **Levée des Conditions Résolutoires** : Livrer les workflows GitHub Actions et le stack Docker Compose sous 10 à 14 jours avant le déploiement grand public.
3. **Campagnes Humaines** : Réaliser l'évaluation chronométrée avec un tiers externe et déposer le dossier déclaratif auprès de la CNDP.

---

## 6. Addendum du 9 novembre 2026 — évolutions postérieures à la campagne

Les chiffres des §1 à §5 sont ceux de la campagne du **2 novembre 2026** et sont conservés tels quels. Depuis, l'interface a évolué à la suite de la revue visiteur (voir `CHANGELOG.md`, section « Non publié ») :

| Sujet | Changement | Effet sur la recette |
| :--- | :--- | :--- |
| Accueil | Bandeau de preuves sociales, bandeau de réassurance, bandeau d'appel à l'action et séparateur décoratif retirés ; pied de page réduit au logo et au lien de connexion. | `REC-INV-01` : description mise à jour. |
| Panier | Plus de panier invité : lien « Panier » réservé aux clients, redirection vers la connexion avec retour sur l'offre. | `REC-INV-04` réécrit (runner et cahier). |
| Pages | `a-propos`, `contact`, `faq`, `cgu`, `confidentialite` supprimées. | `REC-INV-07` retiré ; **38 scénarios E2E** au lieu de 39. |
| Inscription | Case de consentement supprimée ; colonnes `consent_at` / `consent_version` supprimées (script `V15`). | `REC-AUT-01` mis à jour ; exigence `REQ-TRA-17` retirée. |
| Mot de passe | Minimum aligné sur 12 caractères dans l'interface ; aide à la saisie compacte. | `ANO-07` corrigée. |
| Session | « Se souvenir de moi » réellement pris en compte côté serveur. | `ANO-08` corrigée. |
| Accessibilité | Bouton du sélecteur de devise corrigé (WCAG 2.5.3) ; audit rejoué : 0 violation sur 11 pages. | `ANO-11` corrigée. |
| Fiche d'offre | Module d'avis de nouveau chargé (import invalide retiré) ; images du marqueur de la carte Leaflet servies depuis `vendor/leaflet/images/`. | `ANO-12` et `ANO-13` corrigées. |
| Espace client | Tableau de bord allégé (ligne de période, mentions « Période précédente », bouton « Actualiser », panneaux « Mon prochain voyage » et « Notifications non lues » retirés ; « Mes dernières réservations » en pleine largeur) ; « Mes réservations » sans surtitre ni filtre « Tri » ; menu latéral sans « Notifications », « Mes favoris » après « Mon panier » ; panier sans sous-titre ni compteur ; bouton du panier vide corrigé ; Tailwind (CDN) retiré de la page. | `REC-CLI-01` et `REC-CLI-02` : descriptions mises à jour ; `ANO-14`, `ANO-15` (client) et `ANO-16` corrigées. |
| Espace fournisseur | Tailwind (CDN) retiré ; mêmes retraits que pour le client (tableau de bord, « Réservations reçues », fiche, menu) ; tableau de bord ramené à quatre indicateurs avec « Dernières réservations reçues » à côté des revenus ; carte « Besoin d'aide ? », encadré du formulaire d'offre et mention de la fiche retirés ; « Calendrier des disponibilités » renommé « Périodes de disponibilité ». | `REC-FOU-01`, `REC-FOU-04` et `REC-FOU-05` : descriptions mises à jour ; `ANO-15` corrigée ; `ANO-19` ouverte. |

**Revérifié le 9 novembre 2026 :** suite backend **399 / 399** réussis (397 + 2 tests ajoutés), couverture JaCoCo conforme ; deux séries de contrôles dans Chrome (22 puis 23 vérifications : parcours invité → connexion → retour sur l'offre, ajout au panier d'un client, rôle non client, cookies de session et persistants avant et après rafraîchissement, aide du mot de passe, pages 404/500, inscription réelle) ; audit axe-core WCAG 2.1 A/AA.

**Non rejoué :** la campagne E2E complète (`e2e/recette/runner.mjs`) n'a pas été relancée depuis ces changements. Le résultat « 39 / 39 » ne vaut donc que pour la version du 2 novembre, et les captures de `docs/recette/preuves/` ne reflètent pas encore les écrans modifiés.

**Écart ouvert :** `ANO-10` — la langue est forcée en français et le thème en clair ; `REC-INV-05` (bascule trilingue / RTL) ne peut pas être satisfait en l'état.

**Anomalie ouverte relevée dans l'espace client :** `ANO-15` (menu du sélecteur de devise illisible, texte blanc sur fond blanc), corrigée pour les espaces client et fournisseur (Tailwind retiré le 9 puis le 10 novembre). `ANO-19` est ouverte (liste des réservations du formulaire de ticket vide pour un fournisseur : 403 avalé). `ANO-17` (accessibilité des étoiles du module d'avis, révélée par sa réparation) est corrigée. `ANO-18` reste ouverte : le résultat « 0 violation sur 11 pages » porte en réalité sur les pages publiques et la page de connexion ; les quatre espaces connectés sont audités sans session (donc via la page de connexion) et la fiche d'offre avec un identifiant inexistant.

