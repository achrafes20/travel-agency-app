# Référentiel des Règles Métier — Atlas Voyage

> **Objet :** Spécification formelle et exhaustive de toutes les règles métier, politiques de gestion, contraintes d'intégrité et calculs applicables dans Atlas Voyage.  
> **Public visé :** Équipes produit, développeurs full-stack, auditeurs qualité, agents de voyage et administrateurs.  
> **Dernière mise à jour :** 1er novembre 2026 | **Version de référence :** 3.0.0 (Phases 1 à 14)  
> **Statut :** ✅ Stable (100% extrait et vérifié dans le code source) | **Propriétaire :** Équipe Produit & Ingénierie

---

## 1. Rôles, Permissions & Règles de Propriété

### 1.1 Matrice des Rôles (`com.agence.voyage.entity.Role`)
Atlas Voyage gère 4 rôles d'utilisateurs distincts. L'accès est contrôlé par `SecurityConfig.java` et les annotations `@PreAuthorize` :

| Domaine / Action | Public / Invité | CLIENT | SUPPLIER | AGENT | ADMIN | Source Code |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Consultation catalogue & recherche | ✅ | ✅ | ✅ | ✅ | ✅ | `OfferController.list()`, `search()` |
| Panier | ❌ (redirigé vers la connexion) | ✅ (API) | ❌ | ❌ | ❌ | `CartController` (`/api/cart/**` : `hasRole("CLIENT")`) |
| Passer une réservation | ❌ | ✅ | ❌ | ❌ | ❌ | `BookingController.create()` |
| Consulter une réservation | ❌ | ✅ (propriétaire) | ✅ (lignes propres) | ✅ (toutes) | ✅ (toutes) | `BookingController.get()` |
| Annuler une réservation | ❌ | ✅ (>= 48 h) | ❌ | ✅ (avec motif) | ✅ (avec motif) | `BookingController.cancel()` |
| Payer par carte bancaire (Sandbox) | ❌ | ✅ | ❌ | ❌ | ❌ | `PaymentController.pay()` |
| Encaisser un paiement espèces (Caisse) | ❌ | ❌ | ❌ | ✅ | ✅ | `PaymentController.collectCash()` |
| Rembourser un paiement | ❌ | ❌ | ❌ | ❌ | ✅ | `PaymentController.refund()` |
| Créer / Modifier ses offres | ❌ | ❌ | ✅ (propriétaire) | ❌ | ✅ | `OfferController.create()`, `update()` |
| Modérer une offre (activer/suspendre) | ❌ | ❌ | ❌ | ❌ | ✅ | `OfferController.moderate()` |
| Créer / Modifier des Bundles | ❌ | ❌ | ❌ | ✅ | ✅ | `BundleController` |
| Déposer un avis certifié | ❌ | ✅ (après séjour) | ❌ | ❌ | ❌ | `ReviewController.create()` |
| Répondre à un avis client | ❌ | ❌ | ✅ (offre propre) | ❌ | ✅ | `ReviewController.reply()` |
| Modérer les avis clients | ❌ | ❌ | ❌ | ❌ | ✅ | `ReviewController.moderate()` |
| Gérer les tickets de support | ❌ | ✅ (créer/suivre) | ❌ | ✅ (traiter) | ✅ (traiter/suppr) | `TicketController` |
| Gérer les favoris | ❌ | ✅ | ❌ | ❌ | ❌ | `FavoriteController` |
| Paramètres globaux & mode maintenance | ❌ | ❌ | ❌ | ❌ | ✅ | `SettingController` |
| Journal d'audit & export CSV | ❌ | ❌ | ❌ | ❌ | ✅ | `AuditController` |

### 1.2 Spécialisation des Fournisseurs (`SupplierProfile.java` & `OfferType.java`)
- Chaque compte `SUPPLIER` possède obligatoirement une spécialité fixée par l'administrateur : `HOTEL`, `FLIGHT`, `CAR`, `TAXI`, ou `EXCURSION` (*Source : `User.supplierCategory`*).
- Un fournisseur ne peut publier ou modifier que des offres dont le type correspond strictement à sa spécialité (*Source : `OfferService.checkSupplierCategory()`* -> Rejet `SUPPLIER_CATEGORY_MISMATCH`, HTTP 403).

---

## 2. Offres Touristiques, Disponibilités & Modération

### 2.1 Règles Communes à Toutes les Offres (`Offer.java`)
- **Titre :** Obligatoire, 3 à 120 caractères (*Source : `@Size(min=3, max=120)` dans `OfferRequest`*).
- **Description :** Obligatoire, 10 à 4000 caractères (*Source : `@Size(min=10, max=4000)`*).
- **Prix de base :** Supérieur ou égal à 0.00 MAD (*Source : `@Min(0)`*). Toujours exprimé en **MAD TTC**.
- **Images :** Maximum **5 images** par offre. Téléversées via `POST /api/files/images`, format JPEG ou PNG, taille max **5 Mo** par image (*Source : `UploadProperties.maxSizeBytes = 5242880`*).
- **Ville :** Obligatoire pour les hébergements, voitures, transferts et excursions. Pour les vols, la ville de l'offre est déduite automatiquement de la ville d'arrivée (*Source : `OfferService.validateOffer()`*).

### 2.2 Règles Spécifiques par Catégorie
- **Hôtels & Riads (`Hotel.java`) :**
  - Étoiles : Entier de 1 à 5 (*Source : `@Min(1) @Max(5)`*).
  - Type de chambre obligatoire (ex. Chambre Double, Suite Royale).
  - Adresse physique obligatoire.
- **Vols (`Flight.java`) :**
  - Compagnie aérienne et numéro de vol obligatoires.
  - Aéroports de départ et d'arrivée distincts.
  - Date/heure d'arrivée strictement postérieure à la date/heure de départ.
  - Classe de voyage : `ECONOMY`, `PREMIUM_ECONOMY`, `BUSINESS`, `FIRST`.
- **Location de Voitures (`Car.java`) :**
  - Âge minimum du conducteur : 18 à 75 ans (*Source : `@Min(18) @Max(75)`*).
  - Lieux de restitution optionnels : Jusqu'à 20 lieux distincts enregistrés dans `car_dropoff_locations` (*Source : `OfferService.MAX_DROPOFF_LOCATIONS = 20`*).
  - Kilométrage inclus ou illimité, type de transmission (Manuelle / Automatique), carburant.
- **Taxis & Transferts (`TaxiTransfer.java`) :**
  - Type de véhicule (Berline, Van, Minibus), capacité passagers (1 à 20), bagages autorisés.
  - Trajet simple ou aller-retour.
- **Excursions (`Excursion.java`) :**
  - Durée en heures (ex. 4 h) ou jours.
  - Guide inclus et langue du guide.

### 2.3 Disponibilités Temporelles (`OfferAvailability.java`)
- Une offre dispose de 1 à N périodes de disponibilité.
- **Période :** `startAt` et `endAt` (format ISO LocalDateTime). Contrainte stricte : `endAt > startAt` (*Source : `OfferService.validateAvailabilities()`*).
- **Capacité :** Entier strictement positif (`capacity >= 1`) représentant le nombre de chambres, sièges ou véhicules disponibles (*Source : `@Min(1)`*).
- **Interdiction de chevauchement :** Pour une même offre, deux périodes de disponibilité ne peuvent se chevaucher dans le temps (*Source : Rejet `AVAILABILITY_OVERLAP`*).
- **Consommation de la capacité :** la capacité d'une période est le stock restant à vendre. Une réservation doit tenir entièrement dans une seule période (début ≤ début du service et fin ≥ fin du service, sinon `AVAILABILITY_NOT_COVERED`) et retire sa quantité de la capacité (et exige `capacité ≥ nombre de personnes` pour les vols, transferts et excursions) ; une annulation ou une expiration la rend (*Source : `BookingService`*).
- **Écran fournisseur « Périodes de disponibilité » :** lecture seule, une ligne par offre (état, nombre de périodes, période en cours ou prochaine). Les données de démonstration (`StatsDemoSeeder`) créent des périodes passées de 2 heures pour l'historique `DEMO-STATS-…` : elles sont occupées par des réservations de démonstration et conservées.
- **Tickets de support :** échange entre le demandeur (client ou fournisseur) et le personnel (agents, administrateur), jamais entre un fournisseur et un client ; ce n'est pas un chat en direct (aucune mise à jour automatique de l'écran). Chaque message est enregistré (`tickets`, `ticket_messages`) et notifie l'autre partie ; les notes internes du personnel ne sont pas visibles du demandeur (dans les interfaces agent et administrateur, elles sont identifiées par le libellé « Note interne ») ; un ticket `CLOSED` n'accepte plus de message (*Source : `TicketService`*).

### 2.4 Modération Administrative des Offres
- Un administrateur peut modérer toute offre : `POST /api/offers/{id}/moderation`.
- Paramètres : `active` (boolean) et `reason` (obligatoire si suspension).
- Toute action de modération est journalisée de façon immuable dans `AuditLog` avec l'action `OFFER_MODERATED` (*Source : `AuditService.log()`*).

---

## 3. Panier, Codes Promotionnels & Bundles

### 3.1 Panier d'Achats (`Cart.java` & `CartItem.java`)
- **Panier réservé aux clients :** Il n'existe pas de panier invité. L'API `/api/cart/**` n'est accessible qu'au rôle `CLIENT` (*Source : `SecurityConfig`*), et le lien « Panier » n'est affiché qu'aux clients connectés. Un invité qui clique sur « Ajouter au panier » ou « Réserver maintenant » est envoyé vers `connexion.html?redirect=…` ; après connexion ou inscription, il est ramené sur la même offre, avec les dates et le nombre de voyageurs saisis (paramètres `start`, `end`, `travelers`). Les rôles `SUPPLIER`, `AGENT` et `ADMIN` reçoivent un message d'information. Le paramètre `redirect` n'accepte qu'un nom de page du site (`^[\w-]+\.html(\?…)?$`), jamais une URL externe (*Source : `frontend/js/pages/connexion.page.js`*).
- **Vérification de disponibilité :** L'ajout au panier vérifie que les dates demandées sont intégralement couvertes par une `OfferAvailability` active et que la quantité ne dépasse pas la capacité (*Source : `CartService.addItem()`*).
- **Paiement à l'arrivée :** Si un article du panier interdit le paiement à l'arrivée (`allowsPayOnArrival = false`), le mode de paiement à l'arrivée est automatiquement désactivé pour la commande entière (*Source : `CartService.getCartSummary()`*).

### 3.2 Codes Promotionnels (`PromoCode.java`)
- **Types de remise :** `PERCENTAGE` (ex. 10%) ou `FIXED_AMOUNT` (ex. 200 MAD) (*Source : `DiscountType.java`*).
- **Contraintes :**
  - Date de validité : `expiresAt > NOW()`.
  - Montant minimum de commande : `subtotal >= minPurchaseAmount`.
  - Nombre maximum d'utilisations : `usageCount < maxUsages`.
  - Unicité : Un seul code promo applicable par panier (*Source : `CartService.applyPromo()`*).
- **Arrondis :** Calcul en mode `BigDecimal.ROUND_HALF_UP` à 2 décimales. La réduction ne peut jamais excéder le sous-total.

### 3.3 Packs & Bundles (`Bundle.java`)
- Créés par les agents d'agence pour composer des offres combinées (ex : Vol + Hôtel + Transfert).
- Applique une remise globale sur le total combiné.
- La disponibilité du bundle dépend de la disponibilité simultanée de chacun de ses sous-éléments (*Source : `BundleService.checkAvailability()`*).

---

## 4. Réservations & Cycles de Vie (`Booking.java`)

### 4.1 Processus de Réservation Atomique
1. Validation du panier (`CartService.validateCart()`).
2. Début de transaction `@Transactional(isolation = READ_COMMITTED)`.
3. Verrouillage pessimiste (`PESSIMISTIC_WRITE`) sur les lignes `OfferAvailability` concernées.
4. Décrémentation de la capacité résiduelle (`capacity = capacity - quantity`). Si capacité < 0 -> Rollback et rejet `CAPACITY_EXCEEDED`.
5. Génération de la référence unique au format `BK-YYYYMMDD-XXXX` (*Source : `BookingSequence.java`*).
6. Création du statut initial `PENDING` et vidage du panier.
7. Lancement du timer d'expiration : **30 minutes** pour finaliser le paiement (*Source : `app.booking.payment-expiration-minutes=30`*).

### 4.2 Statuts d'une Réservation (`BookingStatus.java`)
- `PENDING` : En attente de règlement ou de confirmation.
- `CONFIRMED` : Entièrement réglée (carte bancaire sandbox) ou confirmée avec paiement à l'arrivée.
- `CANCELLED` : Annulée par le client (dans les délais) ou par l'agent/administrateur.
- `COMPLETED` : Prestation de voyage terminée avec succès.
- `EXPIRED` : Délai de 30 minutes de règlement dépassé sans paiement.

### 4.3 Politiques d'Annulation & Délais Légaux (`CancellationPolicy.java`)
- **Annulation par le client :**
  - **Jusqu'à 48 heures avant le début :** Annulation gratuite autorisée (*Source : `app.booking.cancellation.free-hours=48`*). La capacité est immédiatement restituée à l'offre (*Source : `BookingService.cancel()`*).
  - **Entre 48 h et 24 h avant :** Remboursement partiel à **50%** (*Source : `app.booking.cancellation.partial-refund-percent=50`*).
  - **Moins de 24 h avant :** Aucun remboursement (0%).
- **Annulation par un Agent ou Administrateur :**
  - Possible à tout moment avec saisie obligatoire d'un motif textuel (*Source : `BookingService.adminCancel(bookingId, reason)`*).

---

## 5. Paiements, Caisse & Idempotence (`Payment.java`)

### 5.1 Modes de Paiement Supportés (`PaymentMethod.java`)
- `CREDIT_CARD` : Paiement carte sandbox (simulation passerelle CMI sans débit réel).
- `CASH` : Encaissement en espèces sur place au guichet d'une agence Atlas Voyage par un agent.
- `PAY_ON_ARRIVAL` : Règlement en espèces ou terminal auprès du prestataire à l'arrivée.

### 5.2 Règle d'Idempotence Absolue
- Toute requête initiant un paiement (`POST /api/payments`) ou un remboursement doit fournir un en-tête `Idempotency-Key` (UUID v4 de 16 à 64 caractères).
- L'API garantit qu'une même clé renvoie exactement le même résultat sans réexécuter de transaction financière (*Source : `IdempotencyRecord.java`*, rétention : **24 heures**).

### 5.3 Webhook Bancaire Sécurisé
- Endpoint : `POST /api/payments/webhook`.
- Authentification par signature cryptographique HMAC-SHA256 (`X-Atlas-Signature`) calculée sur le corps brut avec le secret partagé (*Source : `payment.webhook-secret`*).
- Tolérance d'horodatage (`X-Atlas-Timestamp`) : **300 secondes** (5 minutes) pour contrer les attaques par rejeu (*Source : `payment.webhook-tolerance-seconds=300`*).

---

## 6. Sécurité des Comptes, Mots de Passe & RGPD

### 6.1 Politique de Mots de Passe (`PasswordPolicy.java`)
- Longueur : Minimum **12 caractères**, maximum **128 caractères** et **72 octets UTF-8** (limite de BCrypt). Le minimum est une constante unique (`PasswordPolicy.MIN_LENGTH`) appliquée à l'inscription, au changement, à la réinitialisation, à la création par un administrateur et à la validation des formulaires (*Source : `PasswordPolicy`, `@StrongPassword`*).
- Complexité : Les **4 classes sont obligatoires** : au moins une minuscule, une majuscule, un chiffre et un caractère spécial.
- Exclusion : Rejet des mots de passe courants (`common-passwords.txt` et liste intégrée à `PasswordPolicy`), de ceux qui contiennent l'adresse e-mail de l'utilisateur (ou sa partie avant `@`) et des caractères de contrôle.
- Interface : l'aide à la saisie (`AccountUI.strength`) applique les mêmes règles et le même minimum de 12 caractères. Elle affiche en permanence les 5 règles à remplir ; les règles rares (e-mail contenu, mot de passe trop courant ou trop long) n'apparaissent qu'en cas de violation.
- Hachage : **BCrypt avec coût 12** en production, coût 10 en dev (*Source : `app.security.password.bcrypt-cost`*).

### 6.2 Protection Anti-Brute-Force & Verrouillage
- Compteur `failedLoginAttempts` incrémenté à chaque tentative erronée.
- Dès **5 échecs consécutifs**, le compte est automatiquement verrouillé pendant **15 minutes** (`lockedUntil = NOW() + 15 min`).
- Déblocage anticipé possible par l'administrateur via `POST /api/users/{id}/unlock`.

### 6.3 Droits RGPD & CNDP (Loi marocaine n° 09-08)
- **Droit d'accès et de portabilité :** `GET /api/users/me/export` renvoie l'intégralité des données personnelles en JSON téléchargeable.
- **Droit à l'oubli :** `DELETE /api/users/me` avec confirmation par mot de passe. Les données nominatives sont irréversiblement pseudonymisées et le compte est anonymisé.
- **Purge automatique :** Les comptes inactifs supprimés sont définitivement purgés de la base de données après un délai de **36 mois** (*Source : `AccountJobs.java`*).
- **Consentement à l'inscription :** non demandé depuis le 9 novembre 2026. La case à cocher, les pages « Conditions Générales » et « Politique de Confidentialité » et les colonnes `users.consent_at` / `users.consent_version` ont été supprimées (script `scripts/migrations/V15__remember_me_and_drop_consent.sql`). L'inscription n'enregistre donc aucune preuve de consentement. L'option `marketingOptIn` subsiste en base mais n'est renseignée par aucun écran (toujours `false`). Ce choix devra être réexaminé avant toute ouverture commerciale (voir `recette/humain_a_realiser.md`, §5).

### 6.4 Sessions & « Se souvenir de moi »
- **Jetons :** le jeton d'accès (cookie `HttpOnly`) dure **15 minutes** (`app.jwt.access-ttl-seconds`) ; le jeton de rafraîchissement (cookie `HttpOnly`, chemin `/api/auth`) est tourné à chaque utilisation, avec détection de rejeu qui révoque toute la famille de jetons.
- **Case « Se souvenir de moi » (cochée par défaut) :** le formulaire de connexion envoie `rememberMe` à `POST /api/auth/login` (valeur par défaut `true` côté API). Cochée, le cookie de rafraîchissement est **persistant** et dure `app.jwt.refresh-ttl-days` jours (**7** par défaut). Décochée, c'est un **cookie de session**, supprimé à la fermeture du navigateur.
- **Conservation du choix :** il est enregistré avec le jeton (`refresh_tokens.remember_me`) et repris à chaque rotation ; un cookie de session ne devient donc jamais persistant lors d'un rafraîchissement (*Source : `RefreshTokenService.rotateRefreshToken()`, test `SecurityPhase10Test.rememberMeChoiceSurvivesTokenRefresh`*). L'inscription ouvre toujours une session persistante.
- **Côté navigateur :** le profil de l'utilisateur est conservé dans `localStorage` si la case est cochée, dans `sessionStorage` sinon (donc perdu à la fermeture de l'onglet).

---

## 7. Avis & Notations Clients (`Review.java`)

- **Éligibilité stricte :** Seul un client ayant une réservation au statut `COMPLETED` pour l'offre concernée peut déposer un avis (*Source : `ReviewService.createReview()`*).
- **Contrainte d'unicité :** Un seul avis autorisé par réservation et par offre `(booking_id, offer_id)`.
- **Note :** Entier de 1 à 5 étoiles.
- **Modération automatique :** Si le commentaire contient des mots sensibles ou injurieux, son statut initial passe à `PENDING` (modération requise par l'admin). Sinon, il passe directement à `APPROVED`.
- **Signalement communautaire :** Tout utilisateur authentifié peut signaler un avis. Dès **3 signalements** (`reportCount >= 3`), l'avis est automatiquement masqué et rebascule en `PENDING` (*Source : `ReviewService.reportReview()`*).
- **Réponse du fournisseur :** Le fournisseur propriétaire de l'offre peut publier une réponse officielle unique via `POST /api/reviews/{id}/reply`.

---

## 8. Tableau des Paramètres Configurables

| Propriété Spring | Valeur par Défaut | Variable d'Environnement | Rôle & Impact Métier |
| :--- | :--- | :--- | :--- |
| `server.port` | `8080` | `SERVER_PORT` | Port d'écoute HTTP du backend Spring Boot |
| `spring.profiles.active` | `dev` | `SPRING_PROFILES_ACTIVE` | Profil d'exécution (`dev`, `test`, `prod`) |
| `app.currency.reference` | `MAD` | — | Devise légale unique de référence financière |
| `app.booking.payment-expiration-minutes` | `30` | — | Délai d'attente max avant annulation auto d'un panier réservé |
| `app.booking.cancellation.free-hours` | `48` | — | Délai limite pour annulation gratuite à 100% |
| `app.booking.cancellation.partial-hours` | `24` | — | Délai pour remboursement partiel à 50% |
| `app.booking.cancellation.partial-refund-percent`| `50` | — | Pourcentage remboursé en cas d'annulation entre 48h et 24h |
| `app.upload.max-size-bytes` | `5242880` (5 Mo) | `UPLOAD_MAX_SIZE_BYTES` | Poids maximal d'une image téléversée |
| `app.jwt.access-ttl-seconds` | `900` (15 min) | `JWT_ACCESS_TTL_SECONDS` | Durée de vie du jeton d'accès JWT |
| `app.jwt.refresh-ttl-days` | `7` (jours) | `JWT_REFRESH_TTL_DAYS` | Durée de vie du jeton de rafraîchissement |
| `app.security.password.bcrypt-cost` | `12` | — | Nombre d'itérations de hachage BCrypt |
| `payment.webhook-tolerance-seconds` | `300` (5 min) | — | Tolérance d'horodatage anti-rejeu du webhook bancaire |

---

## 9. Décisions Ouvertes (« À décider par le métier »)

Les points suivants ne sont pas imposés rigidement par le code et font l'objet de recommandations en attente d'arbitrage final :

1. **Frais d'annulation hôtelière vs billets d'avion :**
   - *Constat code :* La règle des 48 h s'applique uniformément à toutes les catégories d'offres.
   - *Recommandation :* Permettre aux compagnies aériennes de définir leurs propres conditions de vol (non remboursable ou avec pénalité fixe).
2. **Politique d'acompte à la réservation :**
   - *Constat code :* Le règlement par carte prélève 100% du montant lors de la commande en ligne.
   - *Recommandation :* Introduire une option d'acompte à 30% lors de la réservation et solde prélevé 7 jours avant le départ.
3. **Plafond d'encaissement d'espèces par les agents :**
   - *Constat code :* Aucune limite monétaire sur le montant encaissé en cash via `collectCash()`.
   - *Recommandation juridique :* Plafonner les encaissements en espèces à 10 000 MAD par transaction conformément à la loi fiscale marocaine anti-blanchiment.
