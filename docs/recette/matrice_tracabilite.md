# Matrice de Traçabilité des Exigences et Recette — Atlas Voyage

La présente matrice assure la traçabilité complète de chaque exigence fonctionnelle et technique d'Atlas Voyage jusqu'à son cas de test d'acceptation, son statut d'exécution réel et sa preuve matérielle vérifiable.

## Légende des Statuts
- `✅ Réussi` : Test exécuté avec succès en environnement réel, résultat conforme et vérifié avec preuve.
- `❌ Échoué` : Anomalie bloquante constatée à l'exécution.
- `🔲 Non implémenté` : Fonctionnalité absente du code ou phase non livrée (tracée au registre des anomalies).
- `⚠️ À réaliser par un humain` : Test nécessitant une validation physique, un tiers externe, une certification bancaire ou un équipement spécifique (tracé dans `humain_a_realiser.md`).
- `⛔ Retiré` : Exigence abandonnée par décision de l'équipe ; son cas de test est retiré de la recette (identifiant conservé pour la traçabilité).

> **Mise à jour du 9 novembre 2026 :** les statuts `✅ Réussi` proviennent de la campagne du 2 novembre 2026. Depuis, l'interface invité et l'inscription ont changé (voir `rapport_final_recette.md`, addendum) : les exigences modifiées sont signalées ci-dessous et leurs preuves graphiques devront être regénérées à la prochaine exécution du runner E2E.

---

## 1. Exigences Visiteur / Invité (REQ-INV)

| ID Exigence | Description du Besoin | ID Cas de Test | Statut Réel | Type de Test | Preuve / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **REQ-INV-01** | Page d'accueil neutre avec navigation par catégories et sélecteur de devise (langue et thème : voir `REQ-INV-05` et `ANO-10`). | `REC-INV-01` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-INV-01-accueil.png` (campagne du 2 novembre ; l'accueil a été simplifié depuis). |
| **REQ-INV-02** | Catalogue complet avec recherche textuelle et filtres (type, ville, prix). | `REC-INV-02` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-INV-02-catalogue-hotels.png` |
| **REQ-INV-03** | Fiche détaillée d'une offre avec galerie, avis clients, carte et disponibilités. | `REC-INV-03` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-INV-03-detail-offre.png` |
| **REQ-INV-04** | Panier réservé aux clients : l'invité est redirigé vers la connexion puis ramené sur l'offre (aucun panier invité). | `REC-INV-04` | `✅ Réussi` | E2E Automatisé | Scénario réécrit le 9 novembre 2026 (`runner.mjs`), corps vérifié dans Chrome ; la preuve `docs/recette/preuves/REC-INV-04-panier.png` date de l'ancien panier invité et sera regénérée à la prochaine campagne. |
| **REQ-INV-05** | Support trilingue complet (Français, Anglais, Arabe) avec inversion RTL native. | `REC-INV-05` | `🔲 Non implémenté` | E2E Automatisé (capture seule) | Langue forcée en français et aucun sélecteur affiché : tracé en anomalie `ANO-10` (ouverte). Résultat `✅` de la campagne du 2 novembre non confirmé, la capture ne contrôlait pas l'attribut `dir`. Ancienne preuve : `docs/recette/preuves/REC-INV-05-langue-arabe-rtl.png` |
| **REQ-INV-06** | Cloisonnement des espaces privés (redirection immédiate vers connexion.html). | `REC-INV-06` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-INV-06-acces-interdit.png` |
| **REQ-INV-07** | ~~Pages institutionnelles et légales complètes (À propos, Contact, FAQ, CGU).~~ | `REC-INV-07` | `⛔ Retiré` | — | Pages supprimées le 9 novembre 2026 ; scénario retiré du runner. Ancienne capture archivée : `docs/recette/preuves/REC-INV-07-pages-institutionnelles.png`. |
| **REQ-INV-08** | Page d'erreur 404 personnalisée, accessible et offrant un retour à l'accueil. | `REC-INV-08` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-INV-08-erreur-404.png` |

---

## 2. Exigences Authentification & Sécurité (REQ-AUT)

| ID Exigence | Description du Besoin | ID Cas de Test | Statut Réel | Type de Test | Preuve / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **REQ-AUT-01** | Formulaire d'inscription client avec aide à la saisie du mot de passe (12 caractères minimum, 4 classes). Le consentement Loi 09-08 n'est plus recueilli : voir `REQ-TRA-17`. | `REC-AUT-01` | `✅ Réussi` | E2E Automatisé | Scénario mis à jour le 9 novembre 2026 (contrôle des 5 règles affichées) et vérifié dans Chrome, avec une inscription réelle ; la preuve `docs/recette/preuves/REC-AUT-01-inscription-form.png` sera regénérée à la prochaine campagne. |
| **REQ-AUT-02** | Connexion sécurisée avec génération de JWT et pose de cookies HttpOnly SameSite. | `REC-AUT-02` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AUT-02-login-client-succes.png` |
| **REQ-AUT-03** | Rejet net des mauvais identifiants sans divulgation d'informations sensibles. | `REC-AUT-03` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AUT-03-login-echec.png` |
| **REQ-AUT-04** | Déconnexion avec révocation locale et suppression des jetons d'accès. | `REC-AUT-04` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AUT-04-deconnexion.png` |
| **REQ-AUT-05** | Protection contre le brute-force via Rate Limiting Bucket4j sur `/api/auth/*`. | `REC-AUT-05` | `✅ Réussi` | Intégration API | Réponse HTTP 429 (`RATE_LIMIT_EXCEEDED`) validée. |
| **REQ-AUT-06** | Demande de réinitialisation de mot de passe par jeton à durée de vie limitée. | `REC-AUT-06` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AUT-05-mot-de-passe-oublie.png` |

---

## 3. Exigences Espace Client (REQ-CLI)

| ID Exigence | Description du Besoin | ID Cas de Test | Statut Réel | Type de Test | Preuve / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **REQ-CLI-01** | Tableau de bord personnel du client avec indicateurs et dernières réservations. | `REC-CLI-01` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-CLI-01-dashboard.png` (campagne du 2 novembre ; le tableau de bord a été simplifié depuis). |
| **REQ-CLI-02** | Historique des réservations réelles avec statuts et références réelles. | `REC-CLI-02` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-CLI-02-reservations.png` |
| **REQ-CLI-03** | Tunnel de commande complet en 4 étapes (`av-stepper`) avec choix de paiement. | `REC-CLI-03` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-CLI-03-checkout.png` |
| **REQ-CLI-04** | Billetterie de support SAV avec fil de messages et horodatage. | `REC-CLI-04` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-CLI-04-tickets.png` |
| **REQ-CLI-05** | Gestion du profil, préférences et droit d'accès/export RGPD (Loi 09-08). | `REC-CLI-05` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-CLI-05-profil.png` |
| **REQ-CLI-06** | Gestion de la liste personnelle d'offres favorites avec persistance BDD. | `REC-CLI-06` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-CLI-06-favoris.png` |
| **REQ-CLI-07** | Dépôt d'un avis client et note par étoiles après exécution de la prestation. | `REC-CLI-07` | `✅ Réussi` | Intégration API | Validé via `ReviewControllerTest.java` (JUnit). |
| **REQ-CLI-08** | Annulation d'une réservation avec libération automatique des disponibilités BDD. | `REC-CLI-08` | `✅ Réussi` | Intégration API | Validé via `BookingServiceTest.java` (verrous pessimistes). |
| **REQ-CLI-09** | Émission et affichage du reçu de paiement / confirmation de réservation. | `REC-CLI-09` | `✅ Réussi` | E2E Automatisé | Module `payments.js` / reçu électronique. |
| **REQ-CLI-10** | ~~Préservation du panier d'achat invité lors de la connexion du client.~~ | `REC-CLI-10` | `⛔ Retiré` | — | Retiré le 9 novembre 2026 : plus de panier invité (voir `REQ-INV-04`). La synchronisation annoncée n'avait jamais été implémentée (`ANO-09`) ; le scénario ne figurait pas dans le runner E2E. |

---

## 4. Exigences Espace Fournisseur (REQ-FOU)

| ID Exigence | Description du Besoin | ID Cas de Test | Statut Réel | Type de Test | Preuve / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **REQ-FOU-01** | Tableau de bord avec statistiques du fournisseur (CA, réservations, panier moyen, offres actives). | `REC-FOU-01` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-FOU-01-dashboard.png` |
| **REQ-FOU-02** | Wizard de création d'offre en 4 étapes (catégorie, ville, tarifs, stock). | `REC-FOU-02` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-FOU-02-wizard-offre.png` |
| **REQ-FOU-03** | Liste des offres avec état de modération (Actif, En attente, Rejeté). | `REC-FOU-03` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-FOU-03-mes-offres.png` |
| **REQ-FOU-04** | Périodes de disponibilité par offre (écran en lecture seule, renommé le 10 novembre) et alertes de stock faible. | `REC-FOU-04` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-FOU-04-disponibilites.png` |
| **REQ-FOU-05** | Liste et suivi des réservations passées sur les prestations du fournisseur. | `REC-FOU-05` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-FOU-05-reservations-fournisseur.png` |
| **REQ-FOU-06** | Statistiques de ventes et export des données du fournisseur au format CSV. | `REC-FOU-06` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-FOU-06-stats-fournisseur.png` |
| **REQ-FOU-07** | Cloisonnement strict multi-tenant : impossibilité de voir les données d'autrui. | `REC-FOU-07` | `✅ Réussi` | Intégration Backend | `SupplierOfferSecurityTest.java` (contrôle au niveau Service). |

---

## 5. Exigences Espace Agent (REQ-AGE)

| ID Exigence | Description du Besoin | ID Cas de Test | Statut Réel | Type de Test | Preuve / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **REQ-AGE-01** | Tableau de bord Agent avec indicateurs d'encaissement, réservations récentes et paiements à venir. | `REC-AGE-01` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AGE-01-dashboard.png` |
| **REQ-AGE-02** | Guichet d'encaissement d'espèces avec émission de reçu numéroté immédiat. | `REC-AGE-02` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AGE-02-encaissement.png` |
| **REQ-AGE-03** | Composition et gestion des packages touristiques (Bundles) multi-offres. | `REC-AGE-03` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AGE-03-bundles.png` |
| **REQ-AGE-04** | Consultation et assistance à la réservation au comptoir de l'agence. | `REC-AGE-04` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AGE-04-reservations-agence.png` |
| **REQ-AGE-05** | Prise en charge, escalade et résolution des tickets de support client. | `REC-AGE-05` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-AGE-05-tickets-agent.png` |

---

## 6. Exigences Espace Administrateur (REQ-ADM)

| ID Exigence | Description du Besoin | ID Cas de Test | Statut Réel | Type de Test | Preuve / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **REQ-ADM-01** | Tableau de bord global avec volume d'affaires de la plateforme et KPIs. | `REC-ADM-01` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-ADM-01-dashboard.png` |
| **REQ-ADM-02** | Gestion complète des comptes utilisateurs, attribution de rôles et déverrouillage. | `REC-ADM-02` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-ADM-02-utilisateurs.png` |
| **REQ-ADM-03** | File de modération des offres en attente avec motif obligatoire en cas de refus. | `REC-ADM-03` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-ADM-03-moderation.png` |
| **REQ-ADM-04** | Journal d'audit immuable (append-only) traçant les actions sensibles avec export CSV. | `REC-ADM-04` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-ADM-04-audit.png` |
| **REQ-ADM-05** | Paramètres globaux (délai d'annulation, paiement à l'arrivée, devise par défaut, images par offre) et bascule en mode maintenance dynamique. | `REC-ADM-05` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-ADM-05-parametres.png` |
| **REQ-ADM-06** | Supervision centralisée de toutes les réservations de la plateforme. | `REC-ADM-06` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-ADM-06-reservations-admin.png` |
| **REQ-ADM-07** | Supervision financière des transactions et ventilation des règlements. | `REC-ADM-07` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-ADM-07-paiements-admin.png` |
| **REQ-ADM-08** | Gestion référentielle des villes marocaines (nom normalisé, aéroport, coordonnées). | `REC-ADM-08` | `✅ Réussi` | Intégration BDD | `DataSeeder.java` / `CityRepositoryTest.java`. |

---

## 7. Exigences Transverses et Techniques (REQ-TRA)

| ID Exigence | Description du Besoin | ID Cas de Test | Statut Réel | Type de Test | Preuve / Justification |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **REQ-TRA-01** | Intégrité relationnelle et financière : 0 capacité négative, monnaie 100% MAD, 0 orphelin. | `REC-TRA-01` | `✅ Réussi` | SQL Automatisé | `docs/recette/controle_integrite.md` (0 violation). |
| **REQ-TRA-02** | Absence totale de données mockées ou factices dans le code source frontend. | `REC-TRA-02` | `✅ Réussi` | Scan Statique/Dyn | `scripts/recette/find_mock_data.mjs` (0 mock résiduel). |
| **REQ-TRA-03** | Sécurité OWASP : Protection CSRF/CORS, en-têtes HTTP sécurisés, JWT stateless. | `REC-TRA-03` | `✅ Réussi` | Scan Headers | `docs/recette/preuves/REC-TRA-03-headers-securite.png` |
| **REQ-TRA-04** | Accessibilité WCAG 2.1 AA : Contrastes de couleurs, navigation clavier, attributs ARIA. | `REC-TRA-04` | `✅ Réussi` | Audit Automatisé | Vérifié via `axe-core` dans la suite de tests frontend. |
| **REQ-TRA-05** | Temps d'installation à froid et compilation complète du projet < 10 minutes. | `REC-TRA-05` | `✅ Réussi` | Chronométré | `scripts/recette/fresh_install_test.mjs` (4,59 secondes). |
| **REQ-TRA-06** | Réinitialisation idempotente du jeu de données de démo < 2 minutes. | `REC-TRA-06` | `✅ Réussi` | Chronométré | `scripts/recette/reset_demo.mjs` (0,44 seconde). |
| **REQ-TRA-07** | Adaptabilité responsive sur terminaux mobiles (375x667) sans débordement horizontal. | `REC-TRA-07` | `✅ Réussi` | E2E Automatisé | `docs/recette/preuves/REC-TRA-07-responsive-mobile.png` |
| **REQ-TRA-08** | Conversion dynamique et affichage indicatif des devises (EUR, USD). | `REC-TRA-08` | `✅ Réussi` | E2E Automatisé | Module `currency.js` validé sur le catalogue et panier. |

---

## 8. Éléments Non Implémentés & Actions Humaines

| ID Exigence | Description du Besoin | Rôle / Domaine | Statut Réel | Référence / Justification |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-TRA-09** | Pipeline d'intégration continue CI/CD GitHub Actions (Phase 11). | DevOps / CI | `🔲 Non implémenté` | Tracé en anomalie `ANO-01`. Dérogation Go accordée. |
| **REQ-TRA-10** | Chaîne d'outillage de minification et bundling production `dist/` (Phase 13). | Frontend / Build | `🔲 Non implémenté` | Tracé en anomalie `ANO-02`. Dérogation Go accordée. |
| **REQ-TRA-11** | Conteneurisation Docker & docker-compose de production (Phase 16). | DevOps / Infra | `🔲 Non implémenté` | Tracé en anomalie `ANO-03`. Dérogation Go accordée. |
| **REQ-TRA-12** | Test d'installation chronométré par un opérateur humain externe indépendant. | Qualité Externe | `⚠️ À réaliser par un humain` | Fiche de test détaillée dans `humain_a_realiser.md`. |
| **REQ-TRA-13** | Validation sur terminaux physiques mobiles réels (iPhone iOS, Samsung Galaxy). | Mobile QA | `⚠️ À réaliser par un humain` | Protocole décrit dans `humain_a_realiser.md`. |
| **REQ-TRA-14** | Test avec lecteurs d'écran physiques (NVDA Windows, VoiceOver iOS/macOS). | Accessibilité | `⚠️ À réaliser par un humain` | Grille de validation dans `humain_a_realiser.md`. |
| **REQ-TRA-15** | Obtention du contrat commerçant et homologation bancaire CMI réelle. | FinTech / Légal | `⚠️ À réaliser par un humain` | Démarche administrative détaillée dans `humain_a_realiser.md`. |
| **REQ-TRA-16** | Dépôt de dossier de déclaration de traitement de données auprès de la CNDP. | Juridique | `⚠️ À réaliser par un humain` | Procédure Loi 09-08 détaillée dans `humain_a_realiser.md`. |
| **REQ-TRA-17** | Recueil et archivage du consentement à l'inscription (CGU et politique de confidentialité, Loi 09-08). | Juridique | `⛔ Retiré` | Retiré le 9 novembre 2026 : case à cocher, pages légales et colonnes `consent_at` / `consent_version` supprimées. À réexaminer avant toute ouverture commerciale (`humain_a_realiser.md`, §5). |

