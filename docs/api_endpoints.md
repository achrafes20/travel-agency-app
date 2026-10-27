# Liste des endpoints — API REST Atlas Voyage

Ce document recense **tous les endpoints exposés par le Backend** (Spring Boot, `http://localhost:8080`). Il est à jour avec le code des contrôleurs (`backend/src/main/java/com/agence/voyage/controller/`). Pour l'architecture et les règles métier détaillées, voir [`architecture.md`](architecture.md). Une collection Postman prête à l'emploi est fournie dans [`postman/`](postman/README.md).

**26 endpoints** répartis sur 6 ressources :

| Ressource | Base | Endpoints | Contrôleur |
|---|---|---|---|
| Statut | `/api/status` | 1 | `StatusController` |
| Authentification | `/api/auth` | 3 | `AuthController` |
| Utilisateurs | `/api/users` | 7 | `UserController` |
| Villes | `/api/cities` | 5 | `CityController` |
| Offres | `/api/offers` | 5 | `OfferController` |
| Bundles | `/api/bundles` | 5 | `BundleController` |

## Conventions

- **Format** : JSON (`Content-Type: application/json`) en entrée et en sortie.
- **CORS** : toutes les origines sont autorisées pour `GET`, `POST`, `PUT`, `DELETE` ; les en-têtes `Authorization`, `Content-Type` et `Accept` sont acceptés.
- **Authentification** : jeton **JWT** (Spring Security, sans session). Obtenu par `POST /api/auth/login`, il est envoyé à chaque requête protégée : `Authorization: Bearer <jeton>`. Voir [« Authentification et droits d'accès »](#authentification-et-droits-daccès) ci-dessous.
- **Codes de retour** :

| Code | Signification |
|---|---|
| `200 OK` | Lecture ou modification réussie |
| `201 Created` | Création réussie (le corps contient la ressource créée) |
| `204 No Content` | Suppression réussie (pas de corps) |
| `400 Bad Request` | Validation échouée ou règle métier non respectée |
| `401 Unauthorized` | Jeton absent, invalide ou expiré ; identifiants incorrects ; compte archivé |
| `403 Forbidden` | Rôle insuffisant, ou ressource appartenant à un autre utilisateur |
| `404 Not Found` | Ressource introuvable |

- **Format des erreurs** (`400`, `401`, `403`, `404`) — message en français :

```json
{ "status": 400, "message": "Le titre du bundle est obligatoire" }
```

Une erreur de validation de champ est préfixée par le nom du champ (`title: Le titre est obligatoire`). Un JSON mal formé ou une valeur d'énumération inconnue renvoie aussi `400`, avec le format d'erreur par défaut de Spring.

---

## Vue d'ensemble

| # | Méthode | Route | Rôle | Accès | Succès |
|---|---|---|---|---|---|
| 1 | GET | `/api/status` | Vérifier la connexion Frontend / Backend | public | `200` |
| 2 | POST | `/api/auth/register` | Inscription d'un client | public | `201` |
| 3 | POST | `/api/auth/login` | Connexion (renvoie le jeton JWT) | public | `200` |
| 4 | GET | `/api/auth/me` | Utilisateur connecté | tout rôle connecté | `200` |
| 5 | GET | `/api/users` | Liste des utilisateurs (actifs **et** archivés) | `ADMIN` | `200` |
| 6 | GET | `/api/users/{id}` | Détail d'un utilisateur | `ADMIN` | `200` |
| 7 | POST | `/api/users` | Créer un utilisateur | `ADMIN` | `201` |
| 8 | PUT | `/api/users/{id}` | Modifier un utilisateur | `ADMIN` | `200` |
| 9 | POST | `/api/users/{id}/archive` | Archiver un utilisateur | `ADMIN` | `200` |
| 10 | POST | `/api/users/{id}/restore` | Restaurer un utilisateur archivé | `ADMIN` | `200` |
| 11 | DELETE | `/api/users/{id}` | Supprimer définitivement (compte archivé uniquement) | `ADMIN` | `204` |
| 12 | GET | `/api/cities` | Liste des villes | public | `200` |
| 13 | GET | `/api/cities/{id}` | Détail d'une ville | public | `200` |
| 14 | POST | `/api/cities` | Créer une ville | `ADMIN` | `201` |
| 15 | PUT | `/api/cities/{id}` | Modifier une ville | `ADMIN` | `200` |
| 16 | DELETE | `/api/cities/{id}` | Supprimer une ville | `ADMIN` | `204` |
| 17 | GET | `/api/offers` | Liste des offres (filtres `supplierId`, `type`) | public | `200` |
| 18 | GET | `/api/offers/{id}` | Détail d'une offre | public | `200` |
| 19 | POST | `/api/offers` | Créer une offre (5 types possibles) | `SUPPLIER` | `201` |
| 20 | PUT | `/api/offers/{id}` | Modifier une offre (le type ne change pas) | `SUPPLIER` propriétaire | `200` |
| 21 | DELETE | `/api/offers/{id}` | Supprimer une offre | `SUPPLIER` propriétaire | `204` |
| 22 | GET | `/api/bundles` | Liste des bundles (filtre `agentId`) | public | `200` |
| 23 | GET | `/api/bundles/{id}` | Détail d'un bundle | public | `200` |
| 24 | POST | `/api/bundles` | Créer un bundle | `AGENT` | `201` |
| 25 | PUT | `/api/bundles/{id}` | Modifier un bundle | `AGENT` créateur | `200` |
| 26 | DELETE | `/api/bundles/{id}` | Supprimer un bundle | `AGENT` créateur | `204` |

---

## 1. Statut — `/api/status`

### `GET /api/status`
Vérifie que le Backend répond.

```json
{ "status": "ok", "message": "Backend Atlas Voyage connecte avec succes.", "timestamp": "2026-10-12T16:50:26.346" }
```

---

## Authentification et droits d'accès

### Flux

1. `POST /api/auth/login` (ou `/register`) renvoie `{ "token": "<jwt>", "user": { id, fullName, email, role, archived } }`.
2. Le Frontend garde le jeton (`localStorage`, ou `sessionStorage` si « Se souvenir de moi » est décoché) et l'envoie dans `Authorization: Bearer <jeton>`.
3. À chaque requête, le serveur valide la signature et la date d'expiration (24 h), puis **recharge l'utilisateur en base** : un compte archivé est refusé immédiatement, même avec un jeton encore valide.

Le jeton est signé en HMAC (clé `jwt.secret`, durée `jwt.expiration-ms` dans `application.properties`) et contient l'email (sujet), `userId` et `role`.

### Droits par route

| Routes | Accès |
|---|---|
| `GET /api/status`, `POST /api/auth/login`, `POST /api/auth/register` | Public |
| `GET /api/offers/**`, `GET /api/cities/**`, `GET /api/bundles/**` | Public (catalogue en lecture seule) |
| `GET /api/auth/me` | Tout utilisateur connecté |
| `/api/users/**` | `ADMIN` |
| `POST` / `PUT` / `DELETE` `/api/cities/**` | `ADMIN` |
| `POST` / `PUT` / `DELETE` `/api/offers/**` | `SUPPLIER`, et uniquement sur **ses propres offres** |
| `POST` / `PUT` / `DELETE` `/api/bundles/**` | `AGENT`, et uniquement sur **ses propres bundles** |

Sans jeton valide : `401`. Avec un rôle insuffisant ou sur la ressource d'un autre utilisateur : `403`.

### `POST /api/auth/register`

Inscription publique. Corps : `fullName` (obligatoire, 120 max), `email` (obligatoire, valide, unique), `password` (8 à 100 caractères). Le compte créé est **toujours `CLIENT`** : un champ `role` envoyé est ignoré. Renvoie `201` avec le jeton et l'utilisateur ; `400` si l'email existe déjà.

### `POST /api/auth/login`

Corps : `email`, `password`. Renvoie `200` avec le jeton et l'utilisateur. `401` si l'email est inconnu ou le mot de passe faux (même message dans les deux cas : « Email ou mot de passe incorrect »), ou si le compte est archivé (« Ce compte est désactivé »).

### `GET /api/auth/me`

Renvoie `{ id, fullName, email, role, archived }` de l'utilisateur identifié par le jeton. `401` sans jeton.

---

## 2. Utilisateurs — `/api/users`

*Accès : `ADMIN`.*

**Corps de requête** (`POST` / `PUT`) :

| Champ | Type | Règle |
|---|---|---|
| `fullName` | string | Obligatoire, 120 caractères max |
| `email` | string | Obligatoire, format valide, 180 max, **unique** (insensible à la casse) |
| `role` | string | Obligatoire : `CLIENT`, `SUPPLIER`, `AGENT` ou `ADMIN` |
| `password` | string | 8 à 100 caractères. **Obligatoire à la création** ; en modification, vide = inchangé |

**Réponse** : `{ "id", "fullName", "email", "role", "archived" }` — le mot de passe (haché en BCrypt) n'est jamais renvoyé.

| Endpoint | Détail |
|---|---|
| `GET /api/users` | Renvoie tous les comptes, archivés compris (le filtrage se fait côté Frontend). |
| `GET /api/users/{id}` | `404` si l'utilisateur n'existe pas. |
| `POST /api/users` | `400` si l'email existe déjà ou si le mot de passe manque. |
| `PUT /api/users/{id}` | Mêmes règles que la création ; l'unicité de l'email ignore le compte modifié. |
| `POST /api/users/{id}/archive` | Passe `archived` à `true` ; pas de corps. |
| `POST /api/users/{id}/restore` | Passe `archived` à `false` ; pas de corps. |
| `DELETE /api/users/{id}` | `400` si le compte n'est pas archivé, ou s'il est lié à des offres, paniers ou réservations. |

---

## 3. Villes — `/api/cities`

*Lecture publique ; création, modification et suppression : `ADMIN`.*

**Corps de requête** (`POST` / `PUT`) :

| Champ | Type | Règle |
|---|---|---|
| `name` | string | Obligatoire, 120 max, **unique** (insensible à la casse) |
| `latitude` | number | Facultatif |
| `longitude` | number | Facultatif |

**Réponse** : `{ "id", "name", "latitude", "longitude" }`.

| Endpoint | Détail |
|---|---|
| `GET /api/cities` | Liste des villes de référence. |
| `GET /api/cities/{id}` | `404` si introuvable. |
| `POST /api/cities` | `400` si le nom existe déjà. |
| `PUT /api/cities/{id}` | `404` si introuvable, `400` en cas de conflit de nom. |
| `DELETE /api/cities/{id}` | `404` si introuvable ; `400` si la ville est utilisée par des offres. |

---

## 4. Offres — `/api/offers`

*Lecture publique ; création : `SUPPLIER` ; modification et suppression : le `SUPPLIER` propriétaire de l'offre (`403` sinon).*

Une seule ressource couvre les **5 types d'offres** ; le champ `type` choisit la sous-classe (`SINGLE_TABLE`). Les champs qui ne concernent pas le type valent `null` dans la réponse.

**Paramètres de `GET /api/offers`** (facultatifs, combinables) :

| Paramètre | Exemple | Effet |
|---|---|---|
| `supplierId` | `?supplierId=2` | Offres d'un fournisseur |
| `type` | `?type=HOTEL` | Offres d'un type : `FLIGHT`, `HOTEL`, `CAR`, `TAXI_TRANSFER`, `EXCURSION` |

**Champs communs** (`POST` / `PUT`) :

| Champ | Type | Règle |
|---|---|---|
| `type` | string | Obligatoire ; non modifiable après création |
| `title` | string | Obligatoire, 200 max |
| `description` | string | Facultatif, 2000 max |
| `basePrice` | number | Obligatoire, ≥ 0 |
| `stock` | integer | Obligatoire, ≥ 0 |
| `allowsPayOnArrival` | boolean | Défaut `false` |
| `active` | boolean | Défaut `true` |
| `images` | string[] | URL, **5 maximum** |
| `cityId` | integer | Obligatoire, la ville doit exister (`404` sinon) |
| `supplierId` | integer | **Ignoré** : le fournisseur est toujours l'utilisateur authentifié |

**Champs propres à chaque type** :

| Type | Champs | Règles |
|---|---|---|
| `FLIGHT` | `airline`, `flightNumber`, `departureAirport`, `arrivalAirport`, `departureDateTime`, `arrivalDateTime` | Compagnie et aéroports obligatoires ; arrivée postérieure au départ. Dates au format `2026-11-01T08:00:00` |
| `HOTEL` | `stars`, `roomType`, `address` | `stars` de 1 à 5 ; type de chambre obligatoire |
| `CAR` | `brand`, `model`, `transmission`, `seats` | Marque obligatoire ; `seats` ≥ 1 si renseigné |
| `TAXI_TRANSFER` | `pickupLocation`, `dropoffLocation`, `vehicleType` | Lieux de prise en charge et de dépose obligatoires |
| `EXCURSION` | `durationHours`, `includesGuide`, `includesTransport`, `itinerary` | Durée ≥ 1 heure |

**Réponse** : tous les champs ci-dessus plus `id`, `cityName` et `supplierName`.

| Endpoint | Détail |
|---|---|
| `GET /api/offers/{id}` | `404` si introuvable. |
| `POST /api/offers` | `400` si une règle du type n'est pas respectée. |
| `PUT /api/offers/{id}` | `400` si `type` diffère de celui de l'offre. |
| `DELETE /api/offers/{id}` | `400` si l'offre est utilisée dans un panier, un bundle ou une réservation (la désactiver à la place). |

---

## 5. Bundles — `/api/bundles`

*Lecture publique ; création : `AGENT` ; modification et suppression : l'`AGENT` créateur du bundle (`403` sinon).*

**Paramètre de `GET /api/bundles`** (facultatif) : `agentId` (bundles d'un agent).

**Corps de requête** (`POST` / `PUT`) :

| Champ | Type | Règle |
|---|---|---|
| `title` | string | Obligatoire, 200 max |
| `description` | string | Facultatif, 2000 max |
| `discountPercentage` | number | 0 à 100 (défaut 0) |
| `offerIds` | integer[] | Obligatoire, **au moins 2 offres distinctes** et existantes (`404` sinon) |
| `createdById` | integer | **Ignoré** : le créateur est toujours l'agent authentifié |

**Réponse** :

| Champ | Description |
|---|---|
| `id`, `title`, `description`, `discountPercentage` | Données du bundle |
| `createdById`, `createdByName` | Agent créateur |
| `offers` | Liste de `{ id, type, title, cityName, basePrice, stock, active, image }` |
| `cities` | Villes distinctes des offres |
| `sumPrice` | Somme des prix de base des offres |
| `finalPrice` | `sumPrice` moins la remise |
| `stock` | **Stock dynamique** : le plus bas parmi les offres |
| `limitingOfferTitle` | Offre qui limite le stock |

| Endpoint | Détail |
|---|---|
| `POST /api/bundles` | Crée le bundle ; `404` si une offre n'existe pas. |
| `PUT /api/bundles/{id}` | Remplace titre, description, remise et offres. |
| `DELETE /api/bundles/{id}` | N'affecte pas les offres ; `400` si le bundle est dans un panier ou une réservation. |

---

## Exemples d'appels

```bash
# Se connecter en fournisseur et garder le jeton
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"karim.idrissi@atlasvoyage.ma","password":"password123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# Créer un hôtel (ville 1) : le fournisseur est celui du jeton
curl -X POST http://localhost:8080/api/offers -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"HOTEL","title":"Riad Atlas","basePrice":1260,"stock":5,"cityId":1,"stars":4,"roomType":"Suite"}'

# Créer un bundle de deux offres avec 10 % de remise (jeton d'un agent)
curl -X POST http://localhost:8080/api/bundles -H "Content-Type: application/json" -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{"title":"Escapade","discountPercentage":10,"offerIds":[1,2]}'

# Filtrer
curl "http://localhost:8080/api/offers?supplierId=2&type=HOTEL"
```

Comptes de test créés au démarrage (mot de passe `password123`) :

| Rôle | Email |
|---|---|
| `CLIENT` | `sarah.benali@example.com` |
| `SUPPLIER` | `karim.idrissi@atlasvoyage.ma` |
| `AGENT` | `nadia.elfassi@atlasvoyage.ma` |
| `ADMIN` | `omar.tazi@atlasvoyage.ma` |

Au démarrage, un compte existant dont le mot de passe est encore en clair (base créée avant l'introduction de BCrypt) est automatiquement haché.

## Endpoints prévus (non implémentés)

- `GET /api/offers/search?city=…` : filtrage du catalogue public.
- Panier et codes promo, réservations (`POST /api/bookings`), paiements, notifications.
- CRUD des codes promo (espace administrateur).
