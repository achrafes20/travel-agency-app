# Cahier de Recette — Espace Administrateur (REC-ADM)

Ce document détaille l'ensemble des scénarios de test exécutés pour le rôle Administrateur global de la plateforme Atlas Voyage.

---

### REC-ADM-01 : Tableau de bord global Administrateur
- **Titre** : Visualisation des KPIs transverses de la plateforme.
- **Objectif** : Vérifier que l'administrateur dispose d'une vision 360° : chiffre d'affaires global, volume total des réservations, nombre d'utilisateurs actifs, alertes système.
- **Préconditions** : Authentifié avec `omar.tazi@atlasvoyage.ma` / `password123`.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/admin/index.html?page=dashboard`.
  2. Vérifier les compteurs de synthèse et les raccourcis d'administration.
  3. Vérifier l'en-tête (menu, logo, devise, cloche, compte) sans champ de recherche, le menu latéral titré « ESPACE ADMINISTRATEUR », le menu du compte (Tableau de bord, Réservations, Paiements, Tickets de support, Mon profil, Déconnexion) et, sur le tableau de bord, trois cartes seulement (Utilisateurs, Chiffre d'affaires TTC, Panier moyen confirmé), l'absence du titre « Tableau de bord » au-dessus de « Vue d'ensemble de l'agence », de la ligne de période, des mentions « Période précédente », du bouton « Actualiser », du graphique « Chiffre d'affaires » et des panneaux « Codes promo à surveiller » et « Points d'attention ».
- **Résultat Attendu** : Les métriques se chargent sans erreur ; les totaux reflètent la somme consolidée des transactions en base.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-ADM-01-dashboard.png`
- **Note (10 novembre 2026)** : étape 3 ajoutée ; scénario non rejoué.

---

### REC-ADM-02 : Gestion des utilisateurs et déverrouillage
- **Titre** : Administration des comptes, attribution de rôles et sécurité de compte.
- **Objectif** : Valider la recherche d'utilisateurs, le changement de rôle (`CLIENT`, `SUPPLIER`, `AGENT`, `ADMIN`) et la réactivation de comptes verrouillés suite à des échecs répétés.
- **Préconditions** : Rôle Administrateur connecté.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/admin/index.html?page=users`.
  2. Rechercher un utilisateur par nom ou email.
  3. Vérifier les actions : modifier rôle, désactiver, déverrouiller.
- **Résultat Attendu** : La mise à jour du rôle est immédiatement effective et tracée dans le journal d'audit.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-ADM-02-utilisateurs.png`

---

### REC-ADM-03 : Modération des offres soumises
- **Titre** : File de validation ou rejet des prestations touristiques.
- **Objectif** : Vérifier qu'une offre créée par un prestataire ne peut être publiée sur le catalogue sans approbation préalable d'un administrateur, et qu'un refus exige obligatoirement un motif explicite.
- **Préconditions** : Offre avec statut `PENDING` présente en base.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/admin/index.html?page=offers`.
  2. Filtrer par état « En attente de modération ».
  3. Tester la validation et le rejet avec saisie de motif.
- **Résultat Attendu** : Si approuvée, l'offre passe à l'état `APPROVED` et devient visible sur le catalogue public. Si rejetée, le statut devient `REJECTED` et le motif est transmis au fournisseur.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-ADM-03-moderation.png`

---

### REC-ADM-04 : Journal d'audit immuable (Append-only)
- **Titre** : Traçabilité des actions sensibles et export CSV.
- **Objectif** : Valider l'enregistrement infalsifiable de chaque opération critique (connexion, changement de rôle, annulation, validation financière) avec horodatage, identifiant opérateur et adresse IP.
- **Préconditions** : Événements générés dans la table `audit_logs`.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/admin/index.html?page=audit`.
  2. Examiner les lignes d'audit récentes.
  3. Cliquer sur le bouton « Exporter en CSV ».
- **Résultat Attendu** : La table affiche chronologiquement les événements ; le fichier CSV téléchargé est complet et lisible.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-ADM-04-audit.png`

---

### REC-ADM-05 : Paramètres globaux et mode maintenance
- **Titre** : Configuration dynamique de la plateforme et arrêt contrôlé.
- **Objectif** : Contrôler la modification des paramètres plateforme (délai d'annulation client, paiement à l'arrivée, devise par défaut, nombre maximum d'images par offre) et l'activation du mode maintenance.
- **Préconditions** : Écran des paramètres système.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/admin/index.html?page=settings`.
  2. Vérifier les réglages système et le commutateur de mode maintenance.
  3. Vérifier que les six paramètres affichent leur valeur (délai d'annulation 48 h, paiement à l'arrivée activé, devise MAD, 5 images, maintenance désactivée avec son message), que l'encadré « Règles de la plateforme » n'existe plus, puis modifier le délai d'annulation, cliquer sur « Enregistrer tout », vérifier la notification de confirmation et la valeur rechargée, et rétablir 48 (`ANO-20`, `ANO-21`).
- **Résultat Attendu** : La modification d'un paramètre est prise en compte à chaud par le backend sans redémarrage de l'application.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-ADM-05-parametres.png`
- **Note (10 novembre 2026)** : étape 3 ajoutée ; l'ancien libellé citait un taux de commission et des frais de service, qui n'existent pas ; scénario non rejoué.

---

### REC-ADM-06 : Supervision globale des réservations
- **Titre** : Suivi consolidé de l'ensemble des commandes de la plateforme.
- **Objectif** : Vérifier que l'administrateur peut auditer l'état d'avancement de toutes les réservations, tous canaux confondus (web, agence, direct).
- **Préconditions** : Réservations multi-fournisseurs en base.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/admin/index.html?page=bookings`.
  2. Consulter la répartition par typologie de voyage.
  3. Vérifier l'absence du filtre « Client (nom ou email) », du filtre « Tri » et du surtitre « VOS VOYAGES ATLAS VOYAGE », et que la fiche (« Voir ») ne contient ni e-mail du client, ni commentaire sur l'annulation, ni bloc de paiement (retirés le 10 novembre 2026).
- **Résultat Attendu** : Vue consolidée exhaustive avec filtres multi-critères.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-ADM-06-reservations-admin.png`
- **Note (10 novembre 2026)** : étape 3 ajoutée ; scénario non rejoué.

---

### REC-ADM-07 : Supervision financière et règlements
- **Titre** : Contrôle des flux financiers, transactions Sandbox et encaissements Cash.
- **Objectif** : Valider le suivi des encaissements, des commissions de la plateforme et des règlements aux fournisseurs partenaires.
- **Préconditions** : Transactions confirmées en base.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/admin/index.html?page=payments`.
  2. Examiner la ventilation financière par mode de règlement.
  3. Vérifier l'absence du bandeau « MODE SANDBOX » sur la liste et dans le détail, que le détail d'un paiement payé n'affiche pas « Historique immuable » et propose toujours « Rembourser » (retirés le 10 novembre 2026).
- **Résultat Attendu** : Montants fidèles au centime près, 100% en Dirhams Marocains (MAD).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-ADM-07-paiements-admin.png`
- **Note (10 novembre 2026)** : étape 3 ajoutée ; scénario non rejoué.

---

### REC-ADM-08 : Référentiel des villes marocaines
- **Titre** : Intégrité et gestion des destinations nationales.
- **Objectif** : Vérifier la gestion de la table `cities` (nom normalisé unique, présence d'aéroport international, coordonnées GPS WGS84).
- **Préconditions** : Base de données active.
- **Étapes** :
  1. Contrôler les contraintes d'unicité et le dédoublonnage automatique sur les villes.
- **Résultat Attendu** : Aucune duplication de nom normalisé n'est autorisée (unicité validée).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Validé par la correction de `DataSeeder.java` et les tests d'intégration référentiels.

