# Cahier de Recette — Espace Fournisseur (REC-FOU)

Ce document détaille l'ensemble des scénarios de test exécutés pour le rôle Fournisseur (Prestataire touristique : Hôtels, Riads, Vols, Véhicules, Excursions) de la plateforme Atlas Voyage.

---

### REC-FOU-01 : Connexion et tableau de bord Fournisseur
- **Titre** : Accès et affichage des indicateurs d'activité du prestataire.
- **Objectif** : Vérifier que le fournisseur accède à sa synthèse d'activité : chiffre d'affaires généré, volume de réservations reçues, statut de son catalogue.
- **Préconditions** : Authentifié avec `karim.idrissi@atlasvoyage.ma` / `password123`.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/supplier/index.html?page=dashboard`.
  2. Vérifier les blocs de statistiques et le bandeau d'en-tête de l'espace fournisseur.
- **Résultat Attendu** : La page charge les indicateurs de performance du fournisseur sans erreur d'API.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-FOU-01-dashboard.png`

---

### REC-FOU-02 : Wizard de création d'offre en 4 étapes
- **Titre** : Assistant pas-à-pas de publication d'une nouvelle offre.
- **Objectif** : Contrôler les 4 étapes du wizard : 1. Type et informations générales (avec champs multilingues), 2. Ville de rattachement, 3. Tarification de base en MAD, 4. Périodes de disponibilité et capacité d'accueil.
- **Préconditions** : Rôle Fournisseur connecté.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/supplier/index.html?page=new-offer`.
  2. Vérifier la présence des contrôles de saisie, du téléversement d'images et de la sélection de la ville.
- **Résultat Attendu** : Le formulaire valide la cohérence des champs spécifiques à la typologie de l'offre (ex : étoiles et type de chambre pour hôtel).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-FOU-02-wizard-offre.png`

---

### REC-FOU-03 : Gestion du catalogue d'offres
- **Titre** : Liste, consultation et statuts des prestations proposées.
- **Objectif** : Vérifier que le fournisseur visualise la liste de ses offres avec leur état de modération (Actif, En attente de modération, Rejeté).
- **Préconditions** : Offres rattachées au fournisseur existantes en base.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/supplier/index.html?page=offers`.
  2. Filtrer par type d'offre ou statut.
- **Résultat Attendu** : La table récapitule les offres avec vignette, titre, ville, tarif et badge d'état.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-FOU-03-mes-offres.png`

---

### REC-FOU-04 : Calendrier des disponibilités et alertes de stock
- **Titre** : Suivi des créneaux datés et alerte de capacité faible.
- **Objectif** : Contrôler le planning des disponibilités par offre et l'affichage des alertes visuelles lorsque la capacité restante passe sous le seuil critique.
- **Préconditions** : Offre avec disponibilités configurées.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/supplier/index.html?page=availabilities`.
  2. Examiner les lignes de périodes (`available_from`, `available_until`, capacité restante).
- **Résultat Attendu** : Les créneaux épuisés (capacité = 0) ou en stock faible sont clairement mis en évidence.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-FOU-04-disponibilites.png`

---

### REC-FOU-05 : Suivi des réservations reçues
- **Titre** : Liste des commandes passées par les clients sur les offres du fournisseur.
- **Objectif** : Vérifier que le fournisseur accède au registre de ses réservations sans divulgation de données clients non autorisées.
- **Préconditions** : Réservations enregistrées sur les prestations du fournisseur.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/supplier/index.html?page=bookings`.
  2. Consulter les détails d'un dossier.
- **Résultat Attendu** : Le fournisseur voit les dates de séjour, le nombre de passagers, et le statut de la prestation.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-FOU-05-reservations-fournisseur.png`

---

### REC-FOU-06 : Statistiques de vente et export CSV
- **Titre** : Tableaux de bord financiers et export de données prestataire.
- **Objectif** : Valider les calculs statistiques (taux d'occupation, volume en MAD) et la génération de fichier CSV exportable.
- **Préconditions** : Historique de commandes existant.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/supplier/index.html?page=stats`.
  2. Vérifier les graphiques et le bouton d'export CSV.
- **Résultat Attendu** : Le rapport statistique se charge sans lenteur et l'export CSV contient les lignes ventilées.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-FOU-06-stats-fournisseur.png`

---

### REC-FOU-07 : Cloisonnement strict multi-tenant
- **Titre** : Sécurité et étanchéité des données entre prestataires concurrents.
- **Objectif** : S'assurer qu'un fournisseur ne peut en aucun cas consulter, modifier ou supprimer les offres d'un autre fournisseur.
- **Préconditions** : Deux fournisseurs distincts enregistrés.
- **Étapes** :
  1. Tenter d'accéder via l'API ou l'URL à l'ID d'une offre d'un tiers.
- **Résultat Attendu** : Le backend intercepte la requête au niveau Service et renvoie un code HTTP 403 (`ACCESS_DENIED`) ou 404.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Validé par les tests de sécurité du contrôleur dans `SupplierOfferSecurityTest.java`.

