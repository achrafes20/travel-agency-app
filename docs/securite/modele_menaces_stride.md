# Modèle de Menaces STRIDE — Atlas Voyage

Ce document formalise la modélisation des menaces selon la méthodologie **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) pour la plateforme Atlas Voyage (Java 21 / Spring Boot 3.3.4 / MySQL / Vanilla JS).

---

## 1. Périmètre et Architecture

Atlas Voyage traite des flux transactionnels de voyages (vols, hôtels, locations de voiture, excursions, transferts) avec gestion des paiements, des comptes utilisateurs (CLIENT, AGENT, SUPPLIER, ADMIN), de la conformité RGPD / Loi marocaine 09-08 (CNDP).

### Frontières de Confiance (Trust Boundaries)
1. **Navigateur Client / Application Web (Untrusted)**
2. **Reverse Proxy Nginx (TLS Termination & Rate Limiting Zone)**
3. **Application Backend Spring Boot (Stateless REST API, Context Security)**
4. **Base de Données Relationnelle MySQL (Data Tier)**
5. **Services Tiers Externes (Passerelle de paiement CMI/Stripe, Open-Meteo Geocoding, Serveur SMTP)**

```
[Navigateur / Client SPA]
         │  HTTPS / Cookies HttpOnly SameSite=Lax + X-XSRF-TOKEN
         ▼
[Reverse Proxy Nginx] ── TLS Termination / Header Hardening
         │  HTTP interne (réseau privé)
         ▼
[Spring Boot 3.3.4 (Atlas Backend)]
   ├── RateLimitingFilter (Bucket4j)
   ├── CsrfCookieFilter + Double Submit Cookie
   ├── JwtAuthenticationFilter (Cookies atlas_access_token / atlas_refresh_token)
   ├── SecurityFilterChain (RBAC, Ownership, Parameter Validation)
   └── Services Métier & DTO Mappers
         │  JDBC (TLS / Credentials atlas_app restreints)
         ▼
[MySQL Database]
```

---

## 2. Analyse Détaillée des Menaces STRIDE

| Catégorie STRIDE | Menace Identifiée | Impact | Vulnérabilité / Composant Cible | Contre-Mesure Implémentée dans Atlas Voyage | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S - Spoofing** (Usurpation d'identité) | Vol de jeton JWT via XSS ou attaque Man-in-the-Middle | Critique | Stockage de jetons dans Web Storage (`localStorage` / `sessionStorage`) | `CookieAuthHelper` stocke le jeton d'accès (15 min) et le refresh token (7 jours) en cookies `HttpOnly`, `Secure`, `SameSite=Lax`. Aucun token accessible en JavaScript. Rotation systématique avec détection du rejeu (`RefreshTokenService`) révoquant toute la famille de jetons. | **Atténué** |
| **S - Spoofing** | Attaque par force brute / Credential Stuffing sur `/api/auth/login` | Élevé | Authentification sans limitation de tentatives | `AuthService` verrouille le compte pendant 15 minutes dès 5 échecs consécutifs (`failedLoginAttempts >= 5`). `RateLimitingFilter` (Bucket4j) limite à 5 requêtes par minute par IP. Message d'erreur uniforme "Identifiants invalides" (zéro énumération). | **Atténué** |
| **T - Tampering** (Altération de données) | Falsification de requête intersites (CSRF) sur les opérations sensibles | Élevé | Requêtes d'écriture (POST, PUT, DELETE) utilisant des cookies d'authentification ambiants | `CsrfCookieFilter` avec `CookieCsrfTokenRepository.withHttpOnlyFalse()` exige le header `X-XSRF-TOKEN` validé contre le cookie `XSRF-TOKEN` pour toute mutation protégée par cookie. | **Atténué** |
| **T - Tampering** | Injection SQL sur les critères de recherche ou filtres d'audit | Critique | Requêtes dynamiques ou critères JPA `LIKE` non échappés | Requêtes paramétrées Spring Data JPA. Échappement explicite des métacaractères SQL `LIKE` (`%`, `_`, `\`) dans `AuditLogFilter` et `CityService`. | **Atténué** |
| **T - Tampering** | Mass Assignment / Over-posting lors de la mise à jour de profil ou d'offres | Élevé | Réutilisation directe des entités JPA comme corps de requête HTTP | Architecture stricte DTO en entrée (`UserUpdateRequest`, `OfferRequest`). Validation Jakarta stricte (`@NotBlank`, `@Size`, `@Positive`). Les champs sensibles (`role`, `isArchived`, `balance`) ne sont jamais exposés dans les DTOs modifiables par l'utilisateur. | **Atténué** |
| **R - Repudiation** (Répudiation) | Déni d'une action administrative ou financière (annulation d'une réservation, bannissement d'un compte) | Moyen / Élevé | Absence de traçabilité des opérations de gouvernance | Entité `AuditLog` et service `AuditLogService` enregistrant de manière immuable l'auteur (`performedBy`), l'adresse IP, l'action, l'entité cible et les détails de chaque action critique. | **Atténué** |
| **I - Information Disclosure** (Divulgation d'informations) | Énumération d'utilisateurs via les messages d'erreur de connexion ou réinitialisation | Faible / Moyen | Messages d'erreur différenciés ("Compte inexistant" vs "Mot de passe erroné") | Message générique unique "Identifiants invalides" pour toute défaillance d'authentification (`AuthService`). Réponses uniformes pour l'existence de compte. | **Atténué** |
| **I - Information Disclosure** | Fuite de stack traces, versions ou détails d'infrastructure | Moyen | Gestion par défaut des exceptions Spring Boot / Whitelabel error | `GlobalExceptionHandler` unifié interceptant toutes les exceptions (`@RestControllerAdvice`). Format JSON standardisé (`timestamp`, `status`, `code`, `message`, `correlationId`). Aucun stack trace en production. En-tête `Server` supprimé. | **Atténué** |
| **I - Information Disclosure** | Exposition d'informations sensibles via Spring Boot Actuator | Élevé | Actuator exposé par défaut sans authentification | `/actuator/health` et `/actuator/info` seuls autorisés en `permitAll()`. `health.show-details=never`. Tous les autres endpoints (`/actuator/metrics`, `/actuator/env`, etc.) restreints strictement au rôle `ADMIN` ou désactivés. | **Atténué** |
| **I - Information Disclosure** | BOLA / IDOR (Broken Object-Level Authorization) sur les réservations, paiements ou tickets | Critique | Accès aux ressources par identifiant numérique direct (`/api/bookings/{id}`) sans validation d'appartenance | Vérification systématique d'appartenance dans chaque couche de service (`booking.getClient().getId().equals(currentUser.getId())`). Seuls les rôles `ADMIN` et `AGENT` disposent de privilèges de lecture globale. | **Atténué** |
| **D - Denial of Service** (Déni de service) | Épuisement des ressources par saturation de requêtes d'authentification ou d'API | Élevé | Endpoints publics non limités | Bucket4j `RateLimitingFilter` actif sur `/api/auth/*` (5 req/min/IP) et l'ensemble de `/api/*` (100 req/min/IP). Code HTTP 429 renvoyé avec en-tête standard `Retry-After`. | **Atténué** |
| **D - Denial of Service** | DoS par calcul cryptographique intensif de hachage BCrypt | Moyen | Mots de passe excessivement longs (ex. 100 Mo) soumis au hachage BCrypt | `PasswordPolicy` et `StrongPasswordValidator` plafonnent la longueur des mots de passe à 128 caractères et 256 octets UTF-8 avant tout traitement cryptographique. | **Atténué** |
| **E - Elevation of Privilege** (Élévation de privilèges) | Auto-attribution d'un rôle `ADMIN` ou `AGENT` lors de l'inscription | Critique | DTO d'inscription acceptant un champ `role` | `RegisterRequest` ne comporte aucun champ de rôle. `AuthService.register()` force programmatiquement `user.setRole(Role.CLIENT)`. Les comptes administratifs ne peuvent être créés que par un ADMIN authentifié (`POST /api/users`) ou via le bootstrap sécurisé. | **Atténué** |
| **E - Elevation of Privilege** | Contournement du contrôle d'accès fournisseur (création d'offres d'un type non autorisé) | Moyen | Contrôle de rôle uniquement sur `SUPPLIER` sans vérification de spécialité | `OfferService` valide que la catégorie de l'offre correspond rigoureusement à la `supplierCategory` attribuée au compte fournisseur. | **Atténué** |

---

## 3. Matrice de Risque Résiduel

Toutes les menaces critiques et élevées identifiées dans le cadre du modèle STRIDE sont couvertes par des mécanismes applicatifs natifs (Java 21, Spring Security 6) et des politiques de configuration testées de bout en bout.

