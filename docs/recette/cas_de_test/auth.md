# Cahier de Recette — Authentification & Sécurité (REC-AUT)

Ce document détaille l'ensemble des scénarios de test exécutés pour le sous-système d'authentification, de contrôle d'accès et de sécurité applicative d'Atlas Voyage.

---

### REC-AUT-01 : Formulaire d'inscription client
- **Titre** : Inscription d'un nouveau client avec aide à la saisie du mot de passe (12 caractères minimum).
- **Objectif** : Valider le fonctionnement ergonomique et sécurisé du formulaire de création de compte.
- **Préconditions** : Page `connexion.html` ouverte.
- **Étapes** :
  1. Cliquer sur l'onglet « Créer un compte ».
  2. Cliquer dans le champ « Mot de passe » : l'aide apparaît avec 5 règles (12 caractères minimum, minuscule, majuscule, chiffre, caractère spécial) et une barre à 0/5. Le runner E2E vérifie ces 5 règles.
  3. Saisir 11 caractères respectant les autres règles : la barre indique 4/5 et « 12 caractères minimum » reste à respecter. Saisir un mot de passe contenant l'e-mail : un message rouge apparaît sous la liste.
  4. Vérifier qu'aucune case de consentement n'est présentée.
- **Résultat Attendu** : Le formulaire bloque la soumission tant qu'une des règles n'est pas respectée ; avec 12 caractères et les 4 classes, le compte est créé et le client arrive dans son espace (ou sur l'offre qu'il consultait).
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AUT-01-inscription-form.png`

---

### REC-AUT-02 : Connexion client réussie
- **Titre** : Connexion avec identifiants valides et émission de JWT sécurisé.
- **Objectif** : Vérifier la chaîne complète d'authentification, la création du jeton JWT, la configuration des cookies HttpOnly / SameSite=Lax et la redirection vers l'espace du rôle.
- **Préconditions** : Compte client actif (`sarah.benali@example.com` / `password123`).
- **Étapes** :
  1. Renseigner l'email et le mot de passe sur `connexion.html`.
  2. Soumettre le formulaire.
- **Résultat Attendu** : L'API répond avec HTTP 200, le cookie JWT est positionné, le client est automatiquement redirigé vers `client/index.html`.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AUT-02-login-client-succes.png`
- **Compléments vérifiés le 9 novembre 2026 (hors runner E2E)** :
  - « Se souvenir de moi » décochée : le cookie `atlas_refresh_token` est un cookie de session, avant et après `POST /api/auth/refresh`. Cochée : cookie persistant d'environ 7 jours, avant et après rafraîchissement (Chrome, via Puppeteer ; test d'intégration `SecurityPhase10Test.rememberMeChoiceSurvivesTokenRefresh`).
  - Le lien « Mot de passe oublié ? » est affiché à droite de « Se souvenir de moi » et mène à `mot-de-passe-oublie.html`.
  - Un paramètre `redirect` pointant vers une URL externe est ignoré : le client est envoyé dans son espace.

---

### REC-AUT-03 : Connexion avec identifiants invalides
- **Titre** : Rejet sécurisé des tentatives de connexion erronées.
- **Objectif** : Vérifier que l'application ne divulgue pas d'informations sensibles (ne pas indiquer si l'email ou le mot de passe est erroné).
- **Préconditions** : Identifiants erronés.
- **Étapes** :
  1. Tenter de se connecter avec `sarah.benali@example.com` et un faux mot de passe `wrongPassword!`.
  2. Observer le message d'alerte affiché.
- **Résultat Attendu** : L'API renvoie un code HTTP 401 avec message générique « Identifiants incorrects » ; aucun jeton n'est émis.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AUT-03-login-echec.png`

---

### REC-AUT-04 : Déconnexion sécurisée
- **Titre** : Révocation de session et suppression des jetons d'accès.
- **Objectif** : Vérifier qu'une déconnexion efface intégralement l'état d'authentification côté client et côté serveur.
- **Préconditions** : Utilisateur connecté.
- **Étapes** :
  1. Déclencher l'action `Auth.logout()`.
  2. Tenter de naviguer à nouveau vers une page protégée.
- **Résultat Attendu** : Les données de session locales (`localStorage`, `sessionStorage`) sont purgées, les cookies de session sont expirés et l'utilisateur est redirigé vers `connexion.html`.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AUT-04-deconnexion.png`

---

### REC-AUT-05 : Rate Limiting sur les routes d'authentification
- **Titre** : Blocage des tentatives de force brute via Bucket4j.
- **Objectif** : Vérifier que plus de 20 requêtes consécutives sur `/api/auth/*` depuis une même adresse IP déclenchent une temporisation forcée.
- **Préconditions** : Filtre `RateLimitingFilter.java` actif.
- **Étapes** :
  1. Émettre une série rapide de requêtes de connexion vers `/api/auth/login`.
- **Résultat Attendu** : Le serveur renvoie un code HTTP 429 (`TOO_MANY_REQUESTS`) avec l'en-tête `Retry-After` et le code d'erreur `RATE_LIMIT_EXCEEDED`.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : Capture du log d'erreur HTTP 429 validée lors du test de charge auth.

---

### REC-AUT-06 : Mot de passe oublié
- **Titre** : Demande de réinitialisation de mot de passe par jeton temporaire.
- **Objectif** : S'assurer que le formulaire `mot-de-passe-oublie.html` accepte une adresse email et génère un jeton sécurisé à durée de vie limitée (15 minutes).
- **Préconditions** : Compte existant en base.
- **Étapes** :
  1. Naviguer vers `http://localhost:5500/frontend/mot-de-passe-oublie.html`.
  2. Saisir l'adresse email et valider.
- **Résultat Attendu** : Un message de confirmation rassurant est affiché, invitant l'utilisateur à consulter sa boîte e-mail.
- **Statut d'Exécution** : `✅ Réussi`
- **Preuve** : `docs/recette/preuves/REC-AUT-05-mot-de-passe-oublie.png`

