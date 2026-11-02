# ADR-0005 : Authentification JWT via cookies HttpOnly sécurisés et rotation avec détection de rejeu

> **Date :** 1er novembre 2026 | **Statut :** Accepté  
> **Décideurs :** Équipe d'Ingénierie & Architecture Atlas Voyage  
> **Contexte de référence :** Phases 1 à 14

---

## 1. Contexte et Problématique

Le stockage de jetons d'accès JWT dans `localStorage` ou `sessionStorage` expose directement les sessions utilisateurs aux attaques XSS (Cross-Site Scripting).
De plus, les jetons statiques longue durée empêchent la révocation immédiate en cas de vol de session.

---

## 2. Décision Prise

Transiter l'authentification exclusivement via deux cookies sécurisés :
- `atlas_access_token` : Durée de vie courte (15 minutes), `HttpOnly`, `Secure`, `SameSite=Lax`.
- `atlas_refresh_token` : Durée de vie 7 jours, opaque, persistant en base avec chaîne d'émission (`family`).
À chaque rafraîchissement (`POST /api/auth/refresh`), l'ancien jeton est révoqué et un nouveau jeton est généré (rotation). En cas de tentative de réutilisation d'un ancien jeton de rafraîchissement, TOUTE la famille de jetons est invalidée immédiatement (détection de vol de session).

---

## 3. Conséquences

Avantages :
- Protection absolue contre le vol de jetons par script malveillant (inaccessible via JavaScript document.cookie).
- Révocation granulaire et immédiate des accès sans redémarrer le serveur.
Inconvénients :
- Nécessite une protection CSRF par double-submit cookie (`X-XSRF-TOKEN`) pour les requêtes avec mutation.

---

## 4. Alternatives Envisagées et Raisons du Rejet

1. Bearer token pur en localStorage : Rejeté pour vulnérabilité majeure XSS (OWASP A01/A03).
2. Sessions HTTP d'état (HttpSession) : Rejeté pour préserver l'architecture stateless de l'API REST.
