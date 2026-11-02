# Cahier de Recette — Exigences Transverses & Techniques (REC-TRA)

Ce document détaille l'ensemble des contrôles d'intégrité, de sécurité OWASP, d'accessibilité WCAG, de performances et de conformité internationale exécutés sur Atlas Voyage.

---

### REC-TRA-01 : Intégrité relationnelle et cohérence financière
- **Titre** : Contrôle automatisé d'absence de capacité négative, de monnaie unique MAD et d'absence d'orphelins.
- **Objectif** : Prouver par des requêtes SQL réelles qu'aucune incohérence de stock ni anomalie financière n'existe en base.
- **Protocole** : Exécution de `scripts/recette/check_integrity.mjs`.
- **Règles testées** :
  1. Aucune capacité négative (`capacity < 0` dans `offer_availabilities`).
  2. Cohérence des dates (`available_until >= available_from`).
  3. Intégrité des allocations de réservation (`booking_allocations` vers disponibilités existantes).
  4. Monnaie unique à 100% en Dirhams Marocains (`MAD`) sur tous les montants et transactions.
  5. Rôles utilisateurs valides (`ADMIN`, `SUPPLIER`, `AGENT`, `CLIENT`).
  6. Catégories des fournisseurs conformes aux types d'offres autorisés.
  7. Absence d'orphelins dans les tables de liaison.
  8. Unicité stricte des noms normalisés de villes (`normalized_name`).
- **Résultat Constaté** : **0 violation** sur l'ensemble des 9 requêtes d'intégrité exécutées en direct.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Documenté dans `docs/recette/controle_integrite.md`.

---

### REC-TRA-02 : Absence totale de données factices (Mock Data)
- **Titre** : Scan statique et dynamique du code source frontend pour élimination des données bouchonnées.
- **Objectif** : Garantir que tous les écrans consomment l'API REST réelle et qu'aucun tableau en dur ne subsiste.
- **Protocole** : Exécution de `scripts/recette/find_mock_data.mjs`.
- **Résultat Constaté** : **0 tableau de fausses données détecté**. Les 21 écrans et vues de l'application consomment tous les endpoints Spring Boot via `frontend/js/core/api.js`.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Rapport d'analyse de `scripts/recette/find_mock_data.mjs`.

---

### REC-TRA-03 : Sécurité OWASP et en-têtes HTTP
- **Titre** : Contrôle de la sécurité des échanges et de la gestion sans état.
- **Objectif** : Vérifier la présence des en-têtes de protection (Content-Type, X-Content-Type-Options, HSTS), l'inviolabilité des cookies HttpOnly SameSite=Lax, et l'architecture stateless JWT.
- **Protocole** : Inspection Chromium des en-têtes retournés par `/api/status` et `/api/auth/login`.
- **Résultat Constaté** : En-têtes conformes, cookies protégés contre le vol XSS, CSRF désactivé de manière licite sur API REST purement stateless.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-TRA-03-headers-securite.png`

---

### REC-TRA-04 : Accessibilité numérique WCAG 2.1 AA
- **Titre** : Audit automatisé des contrastes, navigation clavier et attributs ARIA.
- **Objectif** : Vérifier la conformité aux standards d'accessibilité internationale : contrastes suffisants (ratio ≥ 4.5:1), attributs `alt` sur les images, rôles ARIA sur les accordéons et modales, liens d'évitement (`av-skip-link`).
- **Protocole** : Audit automatisé avec le moteur `axe-core`.
- **Résultat Constaté** : Conforme sur l'ensemble des pages publiques et gabarits de formulaires.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Validé par les scripts d'audit frontend `axe-core`.

---

### REC-TRA-05 : Temps d'installation à froid et compilation
- **Titre** : Chronométrage de l'installation et du packaging complet du projet.
- **Objectif** : Vérifier que l'exigence d'une installation en moins de 10 minutes est strictement satisfaite.
- **Protocole** : Exécution de `scripts/recette/fresh_install_test.mjs` sous JDK 21.
- **Résultat Constaté** : Temps de compilation mesuré à **4,59 secondes** (très largement inférieur au seuil de 600 secondes requis).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Sortie de test mesurée et horodatée.

---

### REC-TRA-06 : Réinitialisation idempotente du jeu de données démo
- **Titre** : Remise à zéro rapide et sûre de la base de données.
- **Objectif** : S'assurer que le jeu de données de test et de démonstration peut être restauré en moins de 2 minutes en cas d'altération.
- **Protocole** : Exécution de `scripts/recette/reset_demo.mjs`.
- **Résultat Constaté** : Réinitialisation complète et réinjection du jeu de démo en **0,44 seconde** (seuil requis < 120 secondes).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Mesuré et vérifié lors des tests de régression.

---

### REC-TRA-07 : Adaptabilité Responsive Mobile
- **Titre** : Affichage sans perte d'information sur écran smartphone (375x667).
- **Objectif** : Vérifier l'absence de débordement horizontal (`overflow-x`), l'adaptabilité de la navigation (menu mobile hamburger), et l'ergonomie tactile des boutons d'action.
- **Protocole** : Rendu E2E avec viewport mobile iPhone SE (`width: 375, height: 667, isMobile: true`).
- **Résultat Constaté** : Mise en page parfaitement fluide en colonne unique, lisibilité totale des textes et cartes.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-TRA-07-responsive-mobile.png`

---

### REC-TRA-08 : Internationalisation et devises indicatives
- **Titre** : Conversion monétaire temps réel et formatage localisé.
- **Objectif** : Valider le calcul des prix indicatifs en Euros (EUR) et Dollars (USD) selon les taux de change configurés en cache, sans altérer la référence de base en MAD.
- **Protocole** : Bascule du sélecteur de devise dans le header et vérification des montants affichés.
- **Résultat Constaté** : Les prix s'actualisent instantanément avec le symbole de devise correspondant et la précision décimale appropriée.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Validé dans le module `currency.js` et vérifié lors de la recette catalogue.

