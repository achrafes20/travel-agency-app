# Cahier de Recette — Espace Client (REC-CLI)

Ce document détaille l'ensemble des scénarios de test exécutés pour le rôle Client de la plateforme Atlas Voyage.

---

### REC-CLI-01 : Tableau de bord Client
- **Titre** : Affichage et ergonomie du tableau de bord personnel.
- **Objectif** : Vérifier que le client connecté visualise son récapitulatif d'activité, son statut, et ses raccourcis vers ses réservations.
- **Préconditions** : Authentifié avec le compte `sarah.benali@example.com`.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/client/index.html?page=dashboard`.
  2. Vérifier l'en-tête de bienvenue personnalisé avec nom et initiales.
  3. Vérifier les widgets de réservations récentes et d'offres recommandées.
- **Résultat Attendu** : L'interface s'affiche sans blocage ni message d'erreur d'API.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-CLI-01-dashboard.png`

---

### REC-CLI-02 : Mes réservations
- **Titre** : Consultation de l'historique des réservations réelles.
- **Objectif** : Valider l'affichage de la liste des commandes passées avec statuts (Confirmée, En attente, Annulée) et montants TTC en MAD.
- **Préconditions** : Réservations associées au compte en base de données.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/client/index.html?page=reservations`.
  2. Vérifier les références uniques de dossiers, les dates de voyage, les badges de statuts.
- **Résultat Attendu** : Les données affichées correspondent fidèlement aux lignes de réservation de la base de données (aucune fausse donnée).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-CLI-02-reservations.png`

---

### REC-CLI-03 : Tunnel de commande Checkout
- **Titre** : Parcours d'achat en 4 étapes avec stepper interactif.
- **Objectif** : Contrôler l'ergonomie et la validation des étapes de commande : 1. Coordonnées voyageur, 2. Options, 3. Récapitulatif tarifaire, 4. Paiement.
- **Préconditions** : Panier contenant au moins une offre.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/panier.html#checkout`.
  2. Observer le composant `av-stepper` et la mise en page responsive.
- **Résultat Attendu** : Le stepper guide clairement l'utilisateur sans rechargement intempestif de page.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-CLI-03-checkout.png`

---

### REC-CLI-04 : Tickets de support SAV
- **Titre** : Billetterie de support et messagerie d'assistance.
- **Objectif** : Valider la création d'un ticket de support client et la consultation des réponses apportées par les agents.
- **Préconditions** : Module tickets actif.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/client/index.html?page=tickets`.
  2. Consulter la liste des tickets ouverts et fermés.
  3. Ouvrir un ticket pour visualiser le fil de discussion horodaté.
- **Résultat Attendu** : L'historique des échanges s'affiche clairement avec distinction des messages du client et du service support.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-CLI-04-tickets.png`

---

### REC-CLI-05 : Gestion du profil et droits RGPD
- **Titre** : Modification des informations personnelles et conformité Loi 09-08.
- **Objectif** : S'assurer que le client peut mettre à jour ses coordonnées et exercer son droit d'accès et d'export de ses données personnelles.
- **Préconditions** : Page profil client.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/client/index.html?page=profile`.
  2. Vérifier les champs éditables (téléphone, préférences) et le bouton d'export des données personnelles.
- **Résultat Attendu** : Les données sont persistées en base via l'API REST ; l'export JSON/CSV respecte la législation marocaine sur la protection des données.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-CLI-05-profil.png`

---

### REC-CLI-06 : Mes favoris
- **Titre** : Gestion de la sélection d'offres favorites.
- **Objectif** : Contrôler l'ajout, la persistance et le retrait d'offres favorites par le client.
- **Préconditions** : Au moins une offre mise en favori.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/client/index.html?page=favorites`.
  2. Vérifier la présence des cartes d'offres enregistrées.
- **Résultat Attendu** : La page liste les offres sauvegardées avec lien direct vers leur fiche détaillée et possibilité de suppression en 1 clic.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-CLI-06-favoris.png`

---

### REC-CLI-07 : Notations et avis clients
- **Titre** : Dépôt d'un avis noté après consommation d'un voyage.
- **Objectif** : Vérifier qu'un client ayant réalisé un séjour peut lui attribuer une note de 1 à 5 étoiles et un commentaire modérable.
- **Préconditions** : Réservation terminée (`COMPLETED`).
- **Étapes** :
  1. Soumettre un avis via l'interface ou l'API `POST /api/reviews`.
- **Résultat Attendu** : L'avis est enregistré, la moyenne des étoiles de l'offre est recalculée dynamiquement.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Validé dans la suite de tests backend `ReviewControllerTest.java`.

---

### REC-CLI-08 : Annulation d'une réservation
- **Titre** : Annulation d'une réservation avec libération du stock.
- **Objectif** : Vérifier que l'annulation d'un dossier client libère immédiatement les places allouées dans la table `offer_availabilities`.
- **Préconditions** : Réservation active existante.
- **Étapes** :
  1. Annuler la réservation via `POST /api/bookings/{id}/cancel`.
  2. Contrôler la colonne `capacity` en base de données.
- **Résultat Attendu** : Le statut passe à `CANCELLED` et la capacité restante est incrémentée sans conflit de concurrence (verrou pessimiste).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Validé dans `BookingServiceTest.java`.

---

### REC-CLI-09 : Reçu de paiement électronique
- **Titre** : Émission et visualisation du reçu de règlement.
- **Objectif** : Vérifier la mise à disposition d'un reçu numérique pour toute transaction confirmée.
- **Préconditions** : Transaction validée.
- **Étapes** :
  1. Visualiser le détail d'un paiement dans l'historique client.
- **Résultat Attendu** : Le reçu indique le numéro de transaction, la date, le mode de paiement (Carte Sandbox / Cash), et le montant exact en MAD.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Module `payments.js` intégré.

---

### REC-CLI-10 : Conservation du panier lors de la connexion
- **Titre** : Synchronisation du panier invité avec le compte client.
- **Objectif** : S'assurer qu'un visiteur qui remplit son panier avant de s'authentifier ne perd pas ses articles après connexion.
- **Préconditions** : Panier invité rempli dans `localStorage`.
- **Étapes** :
  1. Remplir le panier en tant qu'invité.
  2. Se connecter sur `connexion.html`.
  3. Retourner sur `panier.html`.
- **Résultat Attendu** : Le contenu du panier est intact et prêt pour le passage en caisse.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Scénario automatisé de persistance validé.

