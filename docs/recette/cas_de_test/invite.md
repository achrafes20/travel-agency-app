# Cahier de Recette — Rôle Invité / Public (REC-INV)

Ce document détaille l'ensemble des scénarios de test exécutés pour l'utilisateur non authentifié (visiteur public) de la plateforme Atlas Voyage.

---

### REC-INV-01 : Accueil neutre et sélecteurs
- **Titre** : Affichage de la page d'accueil neutre, sélecteurs de langue, devise et thème.
- **Objectif** : Vérifier que le visiteur accède à une page d'accueil claire, fluide, sans blocage et disposant des commandes d'internationalisation.
- **Préconditions** : Backend et Frontend actifs. Aucune session en cache.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/accueil.html`.
  2. Vérifier la présence du logo Atlas Voyage, du menu de navigation, du moteur de recherche.
  3. Vérifier la présence des sélecteurs de langue (FR/EN/AR), de devise (MAD/EUR/USD) et du bouton de bascule de thème.
- **Résultat Attendu** : La page se charge en moins de 1 seconde, la mise en page est responsive, les polices Montserrat s'affichent correctement.
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
- **Résultat Attendu** : Les cartes d'offres s'affichent avec leur image, titre, ville, note moyenne, et prix à partir de en MAD. Seules les offres de type hôtel à Marrakech apparaissent.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-02-catalogue-hotels.png`

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

### REC-INV-04 : Panier invité
- **Titre** : Panier d'achats localisé sans compte et calcul TTC en MAD.
- **Objectif** : Vérifier que l'invité peut ajouter un article au panier sans être connecté, avec conservation dans `localStorage`.
- **Préconditions** : Aucune session client active.
- **Étapes** :
  1. Ajouter un séjour depuis la fiche offre.
  2. Naviguer vers `http://localhost:5500/frontend/panier.html`.
  3. Vérifier le récapitulatif : prix unitaire, nombre de personnes, total TTC.
- **Résultat Attendu** : Le panier affiche la ligne de réservation, calcule fidèlement le total en MAD et invite l'utilisateur à se connecter pour finaliser la commande.
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
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-05-langue-arabe-rtl.png`

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

### REC-INV-07 : Pages institutionnelles
- **Titre** : Rendu des pages d'information et mentions légales.
- **Objectif** : S'assurer que les pages `a-propos.html`, `contact.html`, `faq.html`, `cgu.html`, `confidentialite.html` sont accessibles et complètes.
- **Préconditions** : Fichiers HTML statiques disponibles.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/a-propos.html`.
  2. Contrôler les liens de pied de page vers les CGU et la charte de confidentialité.
- **Résultat Attendu** : Les pages se chargent sans anomalie de style ni liens rompus.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-INV-07-pages-institutionnelles.png`

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

