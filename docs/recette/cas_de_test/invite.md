# Cahier de Recette — Rôle Invité / Public (REC-INV)

Ce document détaille l'ensemble des scénarios de test exécutés pour l'utilisateur non authentifié (visiteur public) de la plateforme Atlas Voyage.

---

### REC-INV-01 : Accueil neutre et sélecteurs
- **Titre** : Affichage de la page d'accueil neutre et sélecteur de devise.
- **Objectif** : Vérifier que le visiteur accède à une page d'accueil claire, fluide et sans blocage, avec la navigation par catégories et le choix de la devise d'affichage.
- **Préconditions** : Backend et Frontend actifs. Aucune session en cache.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/accueil.html`.
  2. Vérifier la présence du logo Atlas Voyage, de la barre de navigation (« Toutes les offres » suivi des cinq catégories), des cartes de catégories et des offres disponibles par catégorie.
  3. Vérifier la présence du sélecteur de devise (MAD/EUR/USD/GBP) et du bouton « Se connecter ».
  4. Vérifier que le pied de page ne contient que le logo et le lien de connexion, et qu'aucun lien « Panier » n'est affiché.
- **Résultat Attendu** : La page se charge en moins de 1 seconde, la mise en page est responsive, les polices Montserrat s'affichent correctement.
- **Remarque (9 novembre 2026)** : l'accueil ne comporte plus de moteur de recherche, de bandeau de preuves sociales ni de bandeau de réassurance. Aucun sélecteur de langue ni bouton de thème n'est affiché (langue forcée en français, thème clair : voir REC-INV-05).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-01-accueil.png`

---

### REC-INV-02 : Catalogue et filtres
- **Titre** : Recherche et filtrage du catalogue par catégorie et critères.
- **Objectif** : Valider l'interrogation de l'API catalogue et l'application des filtres combinés côté client.
- **Préconditions** : Offres actives présentes en base de données.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/catalogue.html?type=Hôtels%20%26%20Riads`.
  2. Filtrer par ville (Marrakech).
  3. Ajuster la fourchette de prix.
  4. Depuis l'accueil, cliquer sur « Toutes les offres » : le catalogue complet s'ouvre sans filtre de type (10 offres avec les données de démonstration) et l'entrée est mise en surbrillance.
- **Résultat Attendu** : Les cartes d'offres s'affichent avec leur image, titre, ville, note moyenne, et prix à partir de en MAD. Seules les offres de type hôtel à Marrakech apparaissent.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-02-catalogue-hotels.png`
- **Note (9 novembre 2026)** : étape 4 ajoutée ; le résultat `✅` date de la campagne du 2 novembre, scénario non rejoué.

---

### REC-INV-03 : Fiche détaillée d'une offre
- **Titre** : Affichage complet de la fiche détaillée d'une offre.
- **Objectif** : Contrôler le rendu de la galerie d'images, de la carte Leaflet, des avis clients et du widget de sélection de date/capacité.
- **Préconditions** : Offre avec ID 1 existante.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/offre.html?id=1`.
  2. Faire défiler pour voir la galerie photos, la description, les prestations incluses, la carte interactive.
  3. Vérifier les dates de disponibilité proposées.
- **Résultat Attendu** : L'offre charge toutes ses métadonnées sans erreur de console ; le calendrier reflète les disponibilités réelles de l'offre (Single Table Inheritance).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-03-detail-offre.png`

---

### REC-INV-04 : Panier réservé aux clients
- **Titre** : Panier réservé aux clients : l'invité est invité à se connecter avant de réserver.
- **Objectif** : Vérifier qu'il n'existe pas de panier invité : le lien « Panier » est masqué et les actions de réservation dirigent l'invité vers la connexion, avec retour sur l'offre ensuite.
- **Préconditions** : Aucune session active.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/offre.html?id=1` et vérifier l'absence du lien « Panier » dans l'en-tête.
  2. Cliquer sur « Ajouter au panier » (ou « Réserver maintenant »).
  3. Vérifier l'arrivée sur `connexion.html?redirect=offre.html…` avec le message « Connectez-vous ou créez un compte pour réserver cette offre ».
  4. Se connecter avec un compte client : la page de l'offre se rouvre, avec les dates et le nombre de voyageurs saisis, et le lien « Panier » est désormais visible.
- **Résultat Attendu** : Aucun article n'est conservé côté navigateur ; seules les étapes 1 à 3 sont vérifiées par le runner E2E. Un compte non client (agent, fournisseur, administrateur) reçoit un message d'information au lieu d'une redirection.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-04-panier.png`

---

### REC-INV-05 : Support trilingue et RTL
- **Titre** : Bascule de langue vers l'Arabe et alignement RTL natif.
- **Objectif** : Valider le basculement complet de la mise en page en mode Right-To-Left (`dir="rtl"`) avec les traductions arabes.
- **Préconditions** : Dictionnaire i18n arabe chargé.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/accueil.html?lang=ar`.
  2. Examiner l'attribut `dir` de l'élément `<html>` et l'inversion des composants.
- **Résultat Attendu** : Le texte est traduit en arabe, la barre de navigation est inversée, les icônes directionnelles sont correctement retournées en CSS logique.
- **Statut d'Exécution** : `✅ Réussi` à la campagne du 2 novembre 2026
- **Preuve** : `docs/recette/preuves/REC-INV-05-langue-arabe-rtl.png`
- **⚠️ Constat du 9 novembre 2026 : le résultat attendu n'est plus atteignable.** La langue est forcée en français (`detectInitialLang` dans `frontend/js/shared/i18n.js` renvoie toujours `fr`), le paramètre `?lang=ar` n'est pas pris en charge et aucun sélecteur de langue n'est affiché aux visiteurs. Le runner se contentait de capturer la page sans contrôler l'attribut `dir`, ce qui ne permettait pas de le détecter. Voir l'anomalie ANO-10 du registre.

---

### REC-INV-06 : Contrôle d'accès protégé
- **Titre** : Tentative d'accès non autorisé à un espace privé.
- **Objectif** : Vérifier que l'accès direct aux URLs `/admin/index.html`, `/supplier/index.html`, `/agent/index.html` ou `/client/index.html` est bloqué.
- **Préconditions** : Aucun jeton d'authentification en session.
- **Étapes** :
  1. Tenter d'ouvrir directement `http://localhost:5500/frontend/admin/index.html`.
- **Résultat Attendu** : Le script de sécurité `Auth.requireRole("ADMIN")` intercepte l'accès et redirige immédiatement l'invité vers `connexion.html`.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-06-acces-interdit.png`

---

### REC-INV-07 : Pages institutionnelles — **retiré**
- **Statut** : `⛔ Retiré le 9 novembre 2026`
- **Motif** : les pages `a-propos.html`, `contact.html`, `faq.html`, `cgu.html` et `confidentialite.html` ont été supprimées du site, ainsi que leurs liens (pied de page, en-tête de la FAQ, page 500, formulaire d'inscription). Le scénario, qui ne consistait qu'à les ouvrir, n'a plus d'objet ; il a été retiré du runner E2E (`e2e/recette/runner.mjs`). L'identifiant est conservé pour la traçabilité.
- **Archive** : la capture `docs/recette/preuves/REC-INV-07-pages-institutionnelles.png` date de la campagne du 2 novembre 2026 et ne reflète plus le site.

---

### REC-INV-08 : Gestion d'erreur 404
- **Titre** : Page d'erreur 404 personnalisée et accessible.
- **Objectif** : Vérifier la gestion gracieuse d'une ressource inexistante.
- **Préconditions** : URL inexistante demandée.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/404.html`.
- **Résultat Attendu** : La page 404 affiche un message convivial en français, propose un bouton de retour à l'accueil et respecte le design system Atlas Voyage.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-08-erreur-404.png`

