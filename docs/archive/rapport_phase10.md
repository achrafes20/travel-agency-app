# Rapport de Réalisation — Phase 10 : Sécurité et Robustesse (OWASP Top 10)

> **Archive — document historique.** Ce document décrit l'état et le travail réalisés à une date donnée. Il est conservé tel quel (hors liens corrigés lors de son déplacement le 9 novembre 2026) et **n'est plus mis à jour**. Pour l'état courant : [README](../../README.md), [règles métier](../regles_metier.md), [architecture](../architecture.md), [CHANGELOG](../../CHANGELOG.md).

Date : Novembre 2026  
Projet : **Atlas Voyage** (Plateforme de voyage marocaine)  
Auteur : Ingénieur Sécurité / Full-Stack Senior  
Périmètre : Backend Java 21 / Spring Boot 3.3.4 & Frontend Vanilla JS  

> **Note du 9 novembre 2026 :** ce rapport décrit la livraison de la Phase 10 et n'est pas réécrit. Quatre points ne sont plus d'actualité : le consentement à l'inscription, les pages `cgu.html` / `confidentialite.html` et les champs `consentAt` / `consentVersion` ont été retirés ; la politique de mot de passe exige les **4 classes** de caractères (et non 3 sur 4) avec une liste noire courte (et non 10 000 mots de passe) ; la case « Se souvenir de moi » est désormais prise en compte côté serveur (ADR-0005, §5). Les règles en vigueur sont dans `docs/regles_metier.md`, §6.

---

## 1. Synthèse Exécutive

La **Phase 10 : Sécurité et Robustesse** a été menée avec le niveau d'exigence d'un audit de sécurité et d'une revue OWASP Top 10. L'objectif était d'élever l'architecture d'Atlas Voyage aux standards bancaires et industriels de résilience, en éliminant les vulnérabilités classiques du Web Storage, en protégeant les flux contre la falsification de requêtes (CSRF) et les attaques par force brute, tout en assurant une conformité rigoureuse avec la **Loi marocaine n° 09-08 (CNDP)** et le **RGPD européen**.

Tous les objectifs ont été atteints à 100%, sans aucune régression :
- **Tests unitaires et d'intégration :** 100% verts (`mvn test`), incluant les 374 tests existants et l'ensemble de la nouvelle suite Phase 10.
- **Frontend Vanilla JS :** 100% conforme (`node --check` valide, zéro framework additionnel).

---

## 2. Principales Réalisations Techniques

### 2.1 Authentification par Cookies Sécurisés & Élimination du Web Storage
- **Problématique résolue :** Le stockage des jetons JWT dans le `localStorage` ou le `sessionStorage` exposait les sessions utilisateurs au vol en cas de faille Cross-Site Scripting (XSS).
- **Architecture déployée :**
  - Les jetons ne sont plus jamais manipulés par le JavaScript frontal.
  - Émission de deux cookies sécurisés via `CookieAuthHelper` :
    1. `atlas_access_token` : Jeton d'accès JWT de courte durée (15 minutes), `HttpOnly`, `Secure`, `SameSite=Lax`.
    2. `atlas_refresh_token` : Jeton de rafraîchissement opaque (7 jours), `HttpOnly`, `Secure`, `SameSite=Lax`.
  - En mode Web, l'en-tête `Authorization: Bearer` est désactivé par défaut (`app.security.allow-bearer-header=false`).
  - Côté client, `frontend/js/core/auth.js` ne conserve en cache local que les métadonnées non sensibles (`atlas-user` : id, email, fullName, role, avatarUrl).

### 2.2 Refresh Token Opaque, Rotation et Détection de Réutilisation
- **Entité JPA `RefreshToken` :** Stocke le condensat cryptographique SHA-256 (`tokenHash`), l'identifiant de famille de session (`familyId`), la date d'expiration (`expiresAt`), la date de révocation (`revokedAt`) et l'adresse IP cliente.
- **Rotation systématique :** À chaque appel sur `POST /api/auth/refresh`, l'ancien token est révoqué et un nouveau jeton est délivré avec le même `familyId`.
- **Détection de rejeu (Anti-Theft) :** Si un jeton déjà révoqué est présenté, `RefreshTokenService` détecte immédiatement une tentative de vol de session :
  - Invalidation immédiate de l'intégralité de la famille de jetons (`familyId`).
  - Incrémentation atomique du `tokenVersion` de l'utilisateur (`UPDATE users SET token_version = token_version + 1`).
  - Journalisation d'une alerte de sécurité critique `SECURITY_ALERT: refresh_token_reuse_detected`.
  - Rejet de la requête avec HTTP 401 et code d'erreur `TOKEN_REUSED`.
- **Silent Refresh transparent :** L'intercepteur `frontend/js/core/api.js` intercepte automatiquement les codes HTTP 401 sur les requêtes authentifiées, déclenche silencieusement la rotation via `/api/auth/refresh`, met en file d'attente les requêtes concurrentes et rejoue la requête initiale.

### 2.3 Protection CSRF Double-Submit
- **Mécanisme :** Configuration de Spring Security avec `CookieCsrfTokenRepository.withHttpOnlyFalse()` et `CsrfCookieFilter`.
- Le serveur émet un cookie lisible `XSRF-TOKEN`.
- Pour toute requête d'écriture (`POST`, `PUT`, `PATCH`, `DELETE`) portant un cookie d'authentification, le navigateur doit envoyer la valeur dans l'en-tête HTTP `X-XSRF-TOKEN`.
- L'intercepteur `api.js` lit automatiquement le cookie et injecte l'en-tête sur l'ensemble des mutations.

### 2.4 Protection Anti-Force Brute & Limitation de Débit (Bucket4j)
- **Rate Limiting Applicatif :** `RateLimitingFilter` s'appuyant sur Bucket4j :
  - Routes d'authentification (`/api/auth/*`) : 5 requêtes par minute par adresse IP.
  - Routes d'API générales (`/api/*`) : 100 requêtes par minute par adresse IP.
  - En cas de dépassement : code HTTP 429 (`Too Many Requests`), en-tête standard `Retry-After` (en secondes) et payload d'erreur standardisé `RATE_LIMIT_EXCEEDED`.
- **Verrouillage de Compte :**
  - Compteur `failedLoginAttempts` incrémenté en base à chaque échec d'authentification.
  - Dès 5 échecs consécutifs, le compte est verrouillé pour 15 minutes (`lockedUntil = now + 15 min`).
  - Message d'erreur uniforme "Identifiants invalides" (zéro énumération d'utilisateurs).
  - Déverrouillage administratif disponible via `POST /api/users/{id}/unlock`.

### 2.5 Politique de Mots de Passe Renforcée
- Service `PasswordPolicy` et annotation Jakarta `@StrongPassword` :
  - Longueur : minimum 12 caractères, maximum 128 caractères (et max 256 octets UTF-8).
  - Complexité : au moins 3 des 4 catégories (minuscules, majuscules, chiffres, caractères spéciaux).
  - Liste noire de mots de passe triviaux (`common-passwords.txt`).
  - Exclusion des données d'identité (interdiction de contenir l'adresse e-mail ou le nom complet).

### 2.6 Module RGPD / CNDP (Loi marocaine 09-08)
- **Consentement Explicite :** Case à cocher obligatoire lors de l'inscription liant aux CGU (`cgu.html`) et à la Politique de Confidentialité (`confidentialite.html`). Enregistrement de `consentAt` et `consentVersion`.
- **Droit à la Portabilité :** `GET /api/users/me/export` génère un export JSON complet (profil, réservations, paiements, favoris, tickets) sous forme de pièce jointe sans aucune donnée sensible (hashs, tokens exclus).
- **Droit à l'Oubli / Suppression :** `DELETE /api/users/me` exige la confirmation du mot de passe actuel. Il réalise une anonymisation irréversible (remplacement de l'email par `deleted-<uuid>@anonymized.atlasvoyage.ma`, suppression du téléphone et de l'avatar), archive le compte, vide les paniers/favoris, révoque l'ensemble des sessions et efface les cookies.
- **Rétention Programmée :** Tâche planifiée quotidienne purgeant définitivement les comptes archivés depuis plus de 36 mois.

### 2.7 Sécurisation en Production & Sauvegardes
- **Invariants de Démarrage (`ProductionEnvironmentValidator`) :** En profil `prod`, l'application refuse de démarrer si le secret JWT est court ou trivial, si le CORS autorise le joker `*`, si Flyway est désactivé, si le seeder est activé, ou si l'utilisateur DB est `root` sans mot de passe.
- **Supervision Actuator :** Seuls `/actuator/health` et `/actuator/info` sont publics (`permitAll()`), avec détails masqués. Tous les autres endpoints d'administration nécessitent le rôle `ADMIN`.
- **Sauvegardes Automatisées :** Scripts PowerShell et Bash (`backup_mysql.ps1`, `backup_mysql.sh`) avec compression chiffrée, rotation sur 7 jours, script de restauration (`restore_mysql.ps1`) et drill de test automatisé (`test_restore_mysql.ps1`).

---

## 3. Inventaire des Fichiers Créés et Modifiés

### 3.1 Backend (Code Source & Configuration)
- `backend/pom.xml` : Ajout de Bucket4j, Spring Boot Actuator et OWASP Dependency-Check.
- `backend/src/main/resources/application.properties` & `application-test.properties` : Configuration des cookies, TTL, Actuator et Bucket4j.
- `backend/src/main/java/com/agence/voyage/entity/User.java` : Champs de verrouillage (`failedLoginAttempts`, `lockedUntil`) et de consentement RGPD (`consentAt`, `consentVersion`, `marketingOptIn`).
- `backend/src/main/java/com/agence/voyage/entity/RefreshToken.java` : Entité persistante de session et rafraîchissement.
- `backend/src/main/java/com/agence/voyage/repository/RefreshTokenRepository.java` : Requêtes de révocation par famille, utilisateur et purge.
- `backend/src/main/java/com/agence/voyage/repository/FavoriteRepository.java` : Méthodes d'effacement pour le module RGPD.
- `backend/src/main/java/com/agence/voyage/security/CookieAuthHelper.java` : Gestionnaire de cookies `HttpOnly`, `Secure`, `SameSite=Lax`.
- `backend/src/main/java/com/agence/voyage/security/PasswordPolicy.java` : Moteur de politique de mots de passe et liste noire.
- `backend/src/main/java/com/agence/voyage/security/PasswordConfig.java` : Configuration de coût BCrypt (12 en prod, 4 en test).
- `backend/src/main/java/com/agence/voyage/security/RateLimitingService.java` : Gestion des seaux de jetons IP/utilisateur Bucket4j.
- `backend/src/main/java/com/agence/voyage/security/RateLimitingFilter.java` : Filtre HTTP de limitation de débit avec en-tête `Retry-After`.
- `backend/src/main/java/com/agence/voyage/security/CsrfCookieFilter.java` : Filtre exposant le cookie `XSRF-TOKEN` pour le frontend.
- `backend/src/main/java/com/agence/voyage/security/ProductionEnvironmentValidator.java` : Validateur de sécurité fail-safe au démarrage.
- `backend/src/main/java/com/agence/voyage/security/AdminBootstrapRunner.java` : Initialisation sécurisée de l'administrateur en production.
- `backend/src/main/java/com/agence/voyage/security/SecurityConfig.java` : Chaîne de filtres, politique de cookies, double-submit CSRF, en-têtes CSP/HSTS/Permissions-Policy.
- `backend/src/main/java/com/agence/voyage/security/JwtAuthenticationFilter.java` : Extraction prioritaire du cookie `atlas_access_token`.
- `backend/src/main/java/com/agence/voyage/service/RefreshTokenService.java` : Service cryptographique de rotation et détection de rejeu.
- `backend/src/main/java/com/agence/voyage/service/AuthService.java` : Verrouillage de compte, réinitialisation de tentatives, déverrouillage.
- `backend/src/main/java/com/agence/voyage/service/GdprService.java` : Service d'export JSON, d'anonymisation et de rétention.
- `backend/src/main/java/com/agence/voyage/validation/StrongPassword.java` & `StrongPasswordValidator.java` : Contrainte Jakarta Bean Validation.
- `backend/src/main/java/com/agence/voyage/controller/AuthController.java` : Endpoints `/login`, `/refresh`, `/logout`, `/logout-all`.
- `backend/src/main/java/com/agence/voyage/controller/UserController.java` : Endpoints `/api/users/me/export`, `/api/users/me` (DELETE), `/api/users/{id}/unlock`.
- `backend/src/main/java/com/agence/voyage/dto/DeleteAccountRequest.java` : DTO de demande de suppression avec mot de passe.
- `backend/src/main/resources/common-passwords.txt` : Dictionnaire des 10 000 mots de passe triviaux interdits.

### 3.2 Tests Backend
- `backend/src/test/java/com/agence/voyage/security/AccountSecurityIntegrationTest.java` : 17 tests couvrant verrouillage, force brute, expiration, et validation.
- `backend/src/test/java/com/agence/voyage/security/SecurityPhase10Test.java` : 6 tests complets d'intégration Phase 10.
- `backend/src/test/java/com/agence/voyage/security/ProductionEnvironmentValidatorTest.java` : Tests des règles fail-safe de démarrage.
- `backend/src/test/java/com/agence/voyage/security/EndpointSecurityExhaustivenessTest.java` : Test d'exhaustivité vérifiant que 100% des routes sont protégées.

### 3.3 Frontend Vanilla JS & Pages Légales
- `frontend/js/core/auth.js` : Élimination du stockage des tokens JWT dans Web Storage, gestion de session basée sur cookies.
- `frontend/js/core/api.js` : `credentials: 'include'`, gestion transparente du jeton `XSRF-TOKEN`, intercepteur de silent refresh sur code 401 avec file d'attente.
- `frontend/connexion.html` & `frontend/js/pages/connexion.page.js` : Case à cocher de consentement légal obligatoire à l'inscription.
- `frontend/cgu.html` : Conditions Générales d'Utilisation conformes au droit marocain.
- `frontend/confidentialite.html` : Politique de Confidentialité détaillant les traitements de données (Loi 09-08 / RGPD).

### 3.4 Scripts d'Exploitation & Sauvegardes
- `scripts/backup/backup_mysql.ps1` : Sauvegarde PowerShell Windows avec compression zip et rotation 7 jours.
- `scripts/backup/backup_mysql.sh` : Sauvegarde Bash Linux (`mysqldump` transactionnel avec gzip et rotation).
- `scripts/backup/restore_mysql.ps1` : Script de restauration sécurisé.
- `scripts/backup/test_restore_mysql.ps1` : Drill automatisé de validation de restauration dans une base temporaire.

### 3.5 Documentation de Sécurité (`docs/securite/`)
- `docs/securite/modele_menaces_stride.md` : Modélisation des menaces STRIDE.
- `docs/securite/matrice_autorisations.md` : Matrice RBAC exhaustive des 110+ endpoints.
- `docs/securite/guide_variables_environnement.md` : Guide complet des variables de production et commandes de génération de secrets.
- `docs/securite/nginx_headers.conf` : Configuration de reverse-proxy Nginx durcie (TLS, HSTS, CSP, rate limiting).
- `docs/securite/procedure_rotation_secrets.md` : Procédure de rotation sans coupure (JWT, DB, webhooks).
- `docs/securite/procedure_reponse_incidents.md` : Runbook de réponse aux incidents et notification CNDP 72h.
- `docs/securite/sauvegardes.md` : Stratégie de sauvegarde, RPO 24h, RTO 1h, et PRA.
- `docs/securite/mysql_app_user.sql` : Script de création d'utilisateurs MySQL selon le principe du moindre privilège (DML seul).

---

## 4. Matrice de Conformité OWASP Top 10 (2021)

| Catégorie OWASP | Intitulé | Statut dans Atlas Voyage | Implémentation / Justification |
| :--- | :--- | :--- | :--- |
| **A01:2021** | **Broken Access Control** | **Conforme** | Matrice RBAC exhaustive contrôlée côté Backend. Vérification systématique d'appartenance (IDOR/BOLA). CSRF double-submit activé. Test d'exhaustivité des routes (`EndpointSecurityExhaustivenessTest`) automatisé. |
| **A02:2021** | **Cryptographic Failures** | **Conforme** | Tokens d'accès et refresh tokens en cookies `HttpOnly`, `Secure`, `SameSite=Lax`. Hachage SHA-256 des refresh tokens en base. BCrypt cost 12 pour les mots de passe. TLS 1.2+ forcé via HSTS. Chiffrement des sauvegardes. |
| **A03:2021** | **Injection** | **Conforme** | Utilisation exclusive des requêtes paramétrées Spring Data JPA. Échappement explicite des métacaractères `LIKE` (`%`, `_`, `\`) dans les critères de recherche et d'audit. |
| **A04:2021** | **Insecure Design** | **Conforme** | Modélisation des menaces STRIDE réalisée. Détection proactive du rejeu de refresh tokens avec invalidation de famille. Protection fail-safe au démarrage empêchant toute configuration risquée en production. |
| **A05:2021** | **Security Misconfiguration** | **Conforme** | Actuator restreint (health et info publics seuls, métriques sous rôle ADMIN). En-têtes HTTP de sécurité stricts (CSP, HSTS preload, X-Content-Type-Options nosniff, X-Frame-Options DENY, Permissions-Policy). |
| **A06:2021** | **Vulnerable and Outdated Components** | **Conforme** | Intégration du plugin Maven `dependency-check-maven` (version 10.0.4) pour l'audit automatisé des vulnérabilités (CVE). Dépendances maintenues sur les versions stables récentes (Spring Boot 3.3.4, Java 21). |
| **A07:2021** | **Identification and Authentication Failures** | **Conforme** | Verrouillage automatique de compte après 5 échecs consécutifs (15 min). Messages d'erreur génériques anti-énumération. Politique de mot de passe forte (min 12 chars, 3/4 catégories, liste noire). Révocation universelle des sessions. |
| **A08:2021** | **Software and Data Integrity Failures** | **Conforme** | Signatures HMAC sur les vouchers de réservation et webhooks de paiement. DTOs stricts en entrée (`@Valid`, rejet du Mass Assignment). Migrations de base de données ordonnées via Flyway. |
| **A09:2021** | **Security Logging and Monitoring Failures** | **Conforme** | Entité `AuditLog` immuable avec correlation ID, traçabilité des adresses IP et de l'utilisateur pour toutes les actions critiques. Alertes `SECURITY_ALERT` tracées sur tentative de réutilisation de session. |
| **A10:2021** | **Server-Side Request Forgery (SSRF)** | **Conforme** | Appels externes restreints et validés (client de géocodage Open-Meteo avec timeouts stricts et validation d'URL). Pas d'accès direct à des ressources réseau arbitraires contrôlées par l'utilisateur. |

---

## 5. Conclusion

La Phase 10 dote Atlas Voyage d'un socle de sécurité de niveau entreprise. L'application est protégée contre l'ensemble des vecteurs d'attaque courants du Web, assure une confidentialité totale des sessions utilisateurs, et s'aligne pleinement avec les obligations réglementaires de la CNDP et du RGPD.

