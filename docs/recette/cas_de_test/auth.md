# Cahier de Recette — Authentification & Sécurité (REC-AUT)

Ce document détaille l'ensemble des scénarios de test exécutés pour le sous-système d'authentification, de contrôle d'accès et de sécurité applicative d'Atlas Voyage.

---

### REC-AUT-01 : Formulaire d'inscription client
- **Titre** : Inscription d'un nouveau client avec contrôle de mot de passe et consentement RGPD.
- **Objectif** : Valider le fonctionnement ergonomique et sécurisé du formulaire de création de compte.
- **Préconditions** : Page `connexion.html` ouverte.
- **Étapes** :
  1. Cliquer sur l'onglet « Créer un compte ».
  2. Vérifier la présence de l'indicateur de robustesse de mot de passe (règles de complexité).
  3. Vérifier la case à cocher obligatoire de consentement aux CGU et à la politique de confidentialité (Loi marocaine 09-08).
- **Résultat Attendu** : Le formulaire bloque la soumission si le mot de passe est trop faible ou si le consentement n'est pas coché.
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

