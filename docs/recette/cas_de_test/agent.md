# Cahier de Recette — Espace Agent (REC-AGE)

Ce document détaille l'ensemble des scénarios de test exécutés pour le rôle Agent de voyage de la plateforme Atlas Voyage.

---

### REC-AGE-01 : Connexion et tableau de bord Agent
- **Titre** : Accès et supervision de l'activité du comptoir d'agence.
- **Objectif** : Vérifier que l'agent de voyage accède à son tableau de bord opérationnel : réservations du jour, encaissements en attente, alertes de gestion.
- **Préconditions** : Authentifié avec `nadia.elfassi@atlasvoyage.ma` / `password123`.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/agent/index.html?page=dashboard`.
  2. Vérifier la disposition des tuiles d'activité et la barre de navigation latérale.
- **Résultat Attendu** : L'espace s'affiche de manière fluide et présente les dossiers en cours.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AGE-01-dashboard.png`

---

### REC-AGE-02 : Guichet d'encaissement d'espèces
- **Titre** : Encaissement physique de paiements cash au comptoir et émission de reçu.
- **Objectif** : Valider le fonctionnement du guichet de régularisation des paiements à l'arrivée (`payOnArrival`), avec saisie de la référence dossier et enregistrement de l'encaissement.
- **Préconditions** : Réservation avec mode de paiement au comptoir en attente.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/agent/index.html?page=payments`.
  2. Rechercher un dossier par sa référence ou le nom du client.
  3. Valider l'encaissement en espèces en MAD.
- **Résultat Attendu** : Le statut de paiement passe immédiatement à `PAID`, le statut de la réservation est confirmé, et un reçu de caisse avec référence unique est émis.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AGE-02-encaissement.png`

---

### REC-AGE-03 : Composition de Packages (Bundles)
- **Titre** : Création et tarification de packages multi-offres avec remise globale.
- **Objectif** : Contrôler la fonctionnalité de bundle permettant de combiner un hébergement, un vol et une excursion avec application d'un pourcentage de remise.
- **Préconditions** : Offres élémentaires disponibles au catalogue.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/agent/index.html?page=bundles`.
  2. Sélectionner les offres constituantes du pack.
  3. Définir le taux de remise commerciale.
- **Résultat Attendu** : Le prix global du bundle est calculé dynamiquement, la remise commerciale est déduite et le pack est publié pour les clients.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AGE-03-bundles.png`

---

### REC-AGE-04 : Supervision des réservations clients
- **Titre** : Gestion et suivi des dossiers de réservation d'agence.
- **Objectif** : Vérifier que l'agent peut rechercher, modifier et assister un client dans le suivi de son dossier de voyage.
- **Préconditions** : Réservations clientes existantes.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/agent/index.html?page=bookings`.
  2. Filtrer par statut ou date.
- **Résultat Attendu** : Le tableau récapitule les réservations avec détails complets des prestations et passagers.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AGE-04-reservations-agence.png`

---

### REC-AGE-05 : Traitement des tickets de support client
- **Titre** : Prise en charge et réponse aux demandes SAV des voyageurs.
- **Objectif** : Vérifier que l'agent peut répondre aux réclamations, ajouter des messages au fil de discussion et modifier l'état du ticket (En cours, Résolu).
- **Préconditions** : Ticket client ouvert.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/agent/index.html?page=tickets`.
  2. Ouvrir une réclamation et publier une réponse.
- **Résultat Attendu** : Le message est enregistré, notifié au client et horodaté de manière indélébile.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AGE-05-tickets-agent.png`

