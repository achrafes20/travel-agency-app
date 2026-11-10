# Matrice Complète des Autorisations et Contrôles d'Accès — Atlas Voyage

## 1. Principes Directeurs
- **Défense en profondeur :** Toute règle de sécurité est vérifiée côté Backend indépendamment des gardes du frontend (`SecurityConfig` + validations de propriété en couche Service).
- **Principe du moindre privilège :** Chaque rôle n'accède qu'aux opérations strictement nécessaires à son périmètre métier.
- **Protection IDOR / BOLA systématique :** Aucune ressource sensible n'est consultable ou modifiable sur la seule base de son identifiant numérique (`id`) sans contrôle d'appartenance.

---

## 2. Rôles Applicatifs

| Rôle | Description |
|---|---|
| **ANONYMOUS** | Visiteur non authentifié (accès catalogue public, villes, connexion, inscription). |
| **CLIENT** | Client particulier (gestion panier, réservations personnelles, paiements, favoris, tickets support). |
| **SUPPLIER** | Fournisseur partenaire spécialisé (gestion de ses propres offres selon spécialité, consultation de ses réservations, tickets). |
| **AGENT** | Agent de voyage (assemblage de formules/packages combinés, validation réservations, encaissement espèces). |
| **ADMIN** | Administrateur plateforme (modération des offres, gestion des utilisateurs, codes promo, journal d'audit, paramètres système). |

---

## 3. Matrice des Endpoints REST

| Méthode | Chemin Endpoint | Rôles Autorisés | Règle de Propriété (IDOR) & Contrôles Métier | CSRF Requis |
|---|---|---|---|---|
| `GET` | `/api/status` | ANONYMOUS, TOUS | Public (monitoring basique). | Non |
| `GET` | `/actuator/health` | ANONYMOUS, TOUS | Public, détails masqués (`show-details: never`). | Non |
| `GET` | `/actuator/info` | ANONYMOUS, TOUS | Public (version et nom d'application). | Non |
| `GET` | `/actuator/**` | `ADMIN` | Réservé aux administrateurs. | Non |
| `POST` | `/api/auth/login` | ANONYMOUS | Validation identifiants, verrouillage après 5 échecs, cookie HttpOnly ; `rememberMe` choisit un cookie de rafraîchissement persistant (7 jours) ou de session. | Non |
| `POST` | `/api/auth/register` | ANONYMOUS | Rôle forcé à `CLIENT`, vérification politique mot de passe (12 caractères minimum, 4 classes). Aucun consentement n'est demandé ni enregistré. | Non |
| `POST` | `/api/auth/refresh` | ANONYMOUS | Rotation de refresh token, détection de réutilisation (invalidation famille) ; le choix « Se souvenir de moi » du login est conservé à chaque rotation. | Oui |
| `POST` | `/api/auth/logout` | ANONYMOUS, TOUS | Révocation du refresh token courant, purge des cookies. | Oui |
| `POST` | `/api/auth/logout-all` | Authentifié (`ANY`) | Incrémentation de `tokenVersion`, révocation de toute la famille de sessions. | Oui |
| `POST` | `/api/auth/forgot-password` | ANONYMOUS | Génération de jeton à usage unique, réponse générique sans énumération. | Non |
| `POST` | `/api/auth/reset-password` | ANONYMOUS | Consommation atomique du jeton, politique stricte de mot de passe. | Non |
| `POST` | `/api/auth/verify-email` | ANONYMOUS | Validation du jeton de confirmation d'email. | Non |
| `POST` | `/api/auth/resend-verification` | Authentifié (`ANY`) | Limitation de débit par utilisateur et IP. | Oui |
| `POST` | `/api/auth/change-password` | Authentifié (`ANY`) | Vérification du mot de passe actuel, politique de mot de passe, révocation sessions. | Oui |
| `GET` | `/api/auth/me` | Authentifié (`ANY`) | Renvoie le profil de l'utilisateur connecté depuis le token. | Non |
| `PUT` | `/api/auth/profile` | Authentifié (`ANY`) | Mise à jour de ses propres coordonnées (nom, téléphone, pays, avatar). | Oui |
| `GET` | `/api/users/me/export` | Authentifié (`ANY`) | **RGPD :** Export complet au format JSON des seules données de l'utilisateur connecté. | Non |
| `DELETE` | `/api/users/me` | Authentifié (`ANY`) | **RGPD :** Suppression et anonymisation avec vérification du mot de passe actuel. | Oui |
| `POST` | `/api/users/{id}/unlock` | `ADMIN` | Déverrouillage manuel d'un compte bloqué par rate-limiting. | Oui |
| `GET` | `/api/users` | `ADMIN` | Liste paginée de tous les utilisateurs. | Non |
| `GET` | `/api/users/{id}` | `ADMIN` | Détail d'un utilisateur. | Non |
| `POST` | `/api/users` | `ADMIN` | Création d'un utilisateur tous rôles avec mot de passe fort. | Oui |
| `PUT` | `/api/users/{id}` | `ADMIN` | Modification d'un utilisateur. | Oui |
| `POST` | `/api/users/{id}/archive` | `ADMIN` | Archivage (désactivation) d'un compte. | Oui |
| `POST` | `/api/users/{id}/restore` | `ADMIN` | Restauration d'un compte archivé. | Oui |
| `DELETE` | `/api/users/{id}` | `ADMIN` | Suppression physique d'un utilisateur. | Oui |
| `GET` | `/api/cities/**` | ANONYMOUS, TOUS | Consultation publique du référentiel des villes. | Non |
| `POST, PUT, DELETE` | `/api/cities/**` | `ADMIN` | Administration du catalogue de villes. | Oui |
| `GET` | `/api/offers/**` | ANONYMOUS, TOUS | Consultation des offres validées par la modération (ou de ses propres offres). | Non |
| `POST` | `/api/offers` | `SUPPLIER` | Création d'une offre correspondant à la spécialité du fournisseur (`supplierCategory`). | Oui |
| `PUT` | `/api/offers/{id}` | `SUPPLIER` | Modification autorisée uniquement si `offer.supplierId == principal.id`. | Oui |
| `DELETE` | `/api/offers/{id}` | `SUPPLIER`, `ADMIN` | Suppression autorisée si propriétaire ou `ADMIN`. | Oui |
| `POST` | `/api/offers/{id}/moderation` | `ADMIN` | Validation ou rejet d'une offre soumise par un fournisseur. | Oui |
| `GET` | `/api/bundles/**` | ANONYMOUS, TOUS | Consultation publique des formules de voyages combinés. | Non |
| `POST, PUT, DELETE` | `/api/bundles/**` | `AGENT` | Création et mise à jour de packages combinés par les agents. | Oui |
| `GET` | `/api/cart` | `CLIENT` | Récupération du panier lié à `principal.id`. | Non |
| `POST, PUT, DELETE` | `/api/cart/**` | `CLIENT` | Manipulation du panier : contrôle strict `cart.clientId == principal.id`. | Oui |
| `GET` | `/api/bookings` | `CLIENT` | Liste des réservations de l'utilisateur connecté (`booking.clientId == principal.id`). | Non |
| `GET` | `/api/bookings/supplier`| `SUPPLIER` | Réservations concernant les offres du fournisseur connecté. | Non |
| `GET` | `/api/bookings/admin` | `ADMIN`, `AGENT` | Vue globale de toutes les réservations. | Non |
| `GET` | `/api/bookings/{id}` | Authentifié | Accessible si client propriétaire, fournisseur concerné, agent ou admin. | Non |
| `POST` | `/api/bookings` | `CLIENT` | Création de réservation depuis le panier actif du client. | Oui |
| `POST` | `/api/bookings/{id}/confirm` | `ADMIN`, `AGENT` | Confirmation manuelle de réservation. | Oui |
| `POST` | `/api/bookings/{id}/cancel` | `CLIENT`, `ADMIN`, `AGENT` | Annulation : client uniquement si sa réservation et conditions respectées. | Oui |
| `GET` | `/api/bookings/{id}/voucher` | `CLIENT`, `ADMIN`, `AGENT` | Émission du voucher PDF/HTML si réservation confirmée. | Non |
| `POST` | `/api/payments` | `CLIENT` | Paiement sécurisé d'une réservation appartenant au client connecté. | Oui |
| `POST` | `/api/payments/webhook` | ANONYMOUS | Notification asynchrone passerelle (exemptée CSRF, protégée par signature webhook). | Non |
| `POST` | `/api/payments/{id}/collect-cash` | `AGENT`, `ADMIN` | Encaissement d'un paiement en espèces en agence physique. | Oui |
| `POST` | `/api/payments/{id}/refund` | `ADMIN` | Remboursement officiel d'un paiement. | Oui |
| `GET` | `/api/payments/mine` | `CLIENT` | Historique de paiement du client connecté (`payment.clientId == principal.id`). | Non |
| `GET` | `/api/payments/**` | `CLIENT`, `AGENT`, `ADMIN` | Détail de paiement restreint au propriétaire ou au personnel autorisé. | Non |
| `POST` | `/api/tickets` | `CLIENT`, `SUPPLIER` | Création d'un ticket de support par un utilisateur. | Oui |
| `GET` | `/api/tickets` | Authentifié | Filtre automatique : client/fournisseur ne voit que ses tickets, agent/admin voient tout. | Non |
| `GET` | `/api/tickets/{id}` | Authentifié | Consultation restreinte au demandeur, agent assigné ou admin. | Non |
| `PATCH`| `/api/tickets/{id}/assignee` | `AGENT`, `ADMIN` | Attribution d'un ticket à un agent. | Oui |
| `PATCH`| `/api/tickets/{id}/priority` | `AGENT`, `ADMIN` | Modification de la priorité d'un ticket. | Oui |
| `DELETE`| `/api/tickets/{id}` | `ADMIN` | Suppression définitive d'un ticket. | Oui |
| `GET` | `/api/promo-codes/**` | `ADMIN` | Gestion des codes promotionnels réservée aux administrateurs. | Non |
| `POST, PUT, DELETE` | `/api/promo-codes/**` | `ADMIN` | Création, modification et suppression de codes promotionnels. | Oui |
| `GET` | `/api/audit-logs/**` | `ADMIN` | Consultation du journal d'audit et export CSV réservés aux administrateurs. | Non |
| `GET` | `/api/settings/**` | `ADMIN` | Consultation des paramètres système. | Non |
| `PUT` | `/api/settings/**` | `ADMIN` | Modification des paramètres système. | Oui |
| `GET` | `/api/favorites` | `CLIENT` | Consultation des favoris du client connecté (`favorite.clientId == principal.id`). | Non |
| `POST, DELETE` | `/api/favorites/**` | `CLIENT` | Ajout et suppression de favoris restreints au client connecté. | Oui |
| `POST` | `/api/files/images` | Authentifié (`ANY`) | Upload d'image avec validation MIME, extension, taille, et strip EXIF. | Oui |
| `GET` | `/api/files/*` | ANONYMOUS, TOUS | Consultation publique des médias protégés contre le path traversal. | Non |
| `DELETE` | `/api/files/*` | Authentifié (`ANY`) | Suppression d'image autorisée si uploader propriétaire ou `ADMIN`. | Oui |

