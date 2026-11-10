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
  3. Vérifier les quatre cartes d'indicateurs, le sélecteur de période (7 jours, 30 jours, 12 mois) et le tableau « Mes dernières réservations » en pleine largeur, sans défilement horizontal.
  4. Vérifier l'absence de la ligne « Du … au … · fuseau · actualisé le … », des mentions « Période précédente : … », du bouton « Actualiser » et des panneaux « Mon prochain voyage » et « Notifications non lues » (retirés le 9 novembre 2026).
- **Résultat Attendu** : L'interface s'affiche sans blocage ni message d'erreur d'API.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-CLI-01-dashboard.png`
- **Note (9 novembre 2026)** : étapes 3 et 4 réécrites après la revue de l'espace client (le texte d'origine citait des « offres recommandées » qui n'ont jamais existé). Le résultat `✅` date de la campagne du 2 novembre et la capture de preuve n'a pas été refaite ; scénario non rejoué.

---

### REC-CLI-02 : Mes réservations
- **Titre** : Consultation de l'historique des réservations réelles.
- **Objectif** : Valider l'affichage de la liste des commandes passées avec statuts (Confirmée, En attente, Annulée) et montants TTC en MAD.
- **Préconditions** : Réservations associées au compte en base de données.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/client/index.html?page=reservations`.
  2. Vérifier les références uniques de dossiers, les dates de voyage, les badges de statuts.
  3. Vérifier qu'aucun filtre « Tri » ni surtitre « VOS VOYAGES ATLAS VOYAGE » n'est affiché (retirés le 9 novembre 2026) : la liste reste ordonnée de la plus récente à la plus ancienne.
  4. Ouvrir une réservation (« Voir ») : la fiche n'affiche ni bandeau « MODE SANDBOX », ni carte « PAIEMENT #… », ni bouton « Historique et opérations », ni commentaire sur le délai d'annulation ; le nom du client figure seul (sans e-mail) ; « Méthode » et « Paiement » sont bien séparés ; « Payer maintenant » n'apparaît que si la réservation est à régler et non expirée.
  5. Cliquer sur l'onglet « Confirmées », puis sur « Réinitialiser » : la liste complète revient (onglet « Toutes », même nombre de réservations qu'au départ) — régression `ANO-16`.
- **Résultat Attendu** : Les données affichées correspondent fidèlement aux lignes de réservation de la base de données (aucune fausse donnée).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-CLI-02-reservations.png`
- **Note (9 novembre 2026)** : étapes 3 à 5 ajoutées. Le résultat `✅` date de la campagne du 2 novembre ; scénario non rejoué.

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

### REC-CLI-10 : Conservation du panier lors de la connexion — **retiré**
- **Statut** : `⛔ Retiré le 9 novembre 2026`
- **Motif** : il n'existe plus de panier invité. Le lien « Panier » est réservé aux clients ; un invité qui veut réserver est redirigé vers la connexion puis ramené sur l'offre (voir `REC-INV-04`).
- **Remarque** : la synchronisation décrite par ce scénario n'était en réalité pas implémentée : l'article ajouté par un invité restait dans le `localStorage` du navigateur, jamais affiché et jamais transféré au compte (la fonction `CartService.mergeCart()` citée par la documentation n'existait pas). Le statut `✅ Réussi` précédent ne reposait sur aucun scénario du runner E2E. Voir l'anomalie `ANO-09`.

