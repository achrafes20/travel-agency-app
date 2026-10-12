# Liste des endpoints — API REST Atlas Voyage

Ce document recense **tous les endpoints exposés par le Backend** (Spring Boot, `http://localhost:8080`). Il est à jour avec le code des contrôleurs (`backend/src/main/java/com/agence/voyage/controller/`). Pour l'architecture et les règles métier détaillées, voir [`architecture.md`](architecture.md). Une collection Postman prête à l'emploi est fournie dans [`postman/`](postman/README.md).

**23 endpoints** répartis sur 5 ressources :

| Ressource | Base | Endpoints | Contrôleur |
|---|---|---|---|
| Statut | `/api/status` | 1 | `StatusController` |
| Utilisateurs | `/api/users` | 7 | `UserController` |
| Villes | `/api/cities` | 5 | `CityController` |
| Offres | `/api/offers` | 5 | `OfferController` |
| Bundles | `/api/bundles` | 5 | `BundleController` |

## Conventions

- **Format** : JSON (`Content-Type: application/json`) en entrée et en sortie.
- **CORS** : toutes les origines sont autorisées pour `GET`, `POST`, `PUT` et `DELETE`.
- **Authentification** : aucune pour le moment (Spring Security est prévu, Phase 3). Les endpoints sont ouverts.
- **Codes de retour** :

| Code | Signification |
|---|---|
| `200 OK` | Lecture ou modification réussie |
| `201 Created` | Création réussie (le corps contient la ressource créée) |
| `204 No Content` | Suppression réussie (pas de corps) |
| `400 Bad Request` | Validation échouée ou règle métier non respectée |
| `404 Not Found` | Ressource introuvable |

- **Format des erreurs** (`400` de validation ou métier, `404`) — message en français :

```json
{ "status": 400, "message": "Le titre du bundle est obligatoire" }
```

Une erreur de validation de champ est préfixée par le nom du champ (`title: Le titre est obligatoire`). Un JSON mal formé ou une valeur d'énumération inconnue renvoie aussi `400`, avec le format d'erreur par défaut de Spring.

---

## Vue d'ensemble

| # | Méthode | Route | Rôle | Succès |
|---|---|---|---|---|
| 1 | GET | `/api/status` | Vérifier la connexion Frontend / Backend | `200` |
| 2 | GET | `/api/users` | Liste des utilisateurs (actifs **et** archivés) | `200` |
| 3 | GET | `/api/users/{id}` | Détail d'un utilisateur | `200` |
| 4 | POST | `/api/users` | Créer un utilisateur | `201` |
| 5 | PUT | `/api/users/{id}` | Modifier un utilisateur | `200` |
| 6 | POST | `/api/users/{id}/archive` | Archiver un utilisateur | `200` |
| 7 | POST | `/api/users/{id}/restore` | Restaurer un utilisateur archivé | `200` |
| 8 | DELETE | `/api/users/{id}` | Supprimer définitivement (compte archivé uniquement) | `204` |
| 9 | GET | `/api/cities` | Liste des villes | `200` |
| 10 | GET | `/api/cities/{id}` | Détail d'une ville | `200` |
| 11 | POST | `/api/cities` | Créer une ville | `201` |
| 12 | PUT | `/api/cities/{id}` | Modifier une ville | `200` |
| 13 | DELETE | `/api/cities/{id}` | Supprimer une ville | `204` |
| 14 | GET | `/api/offers` | Liste des offres (filtres `supplierId`, `type`) | `200` |
| 15 | GET | `/api/offers/{id}` | Détail d'une offre | `200` |
| 16 | POST | `/api/offers` | Créer une offre (5 types possibles) | `201` |
| 17 | PUT | `/api/offers/{id}` | Modifier une offre (le type ne change pas) | `200` |
| 18 | DELETE | `/api/offers/{id}` | Supprimer une offre | `204` |
| 19 | GET | `/api/bundles` | Liste des bundles (filtre `agentId`) | `200` |
| 20 | GET | `/api/bundles/{id}` | Détail d'un bundle | `200` |
| 21 | POST | `/api/bundles` | Créer un bundle | `201` |
| 22 | PUT | `/api/bundles/{id}` | Modifier un bundle | `200` |
| 23 | DELETE | `/api/bundles/{id}` | Supprimer un bundle | `204` |

---

## 1. Statut — `/api/status`

### `GET /api/status`
Vérifie que le Backend répond.

```json
{ "status": "ok", "message": "Backend Atlas Voyage connecte avec succes.", "timestamp": "2026-10-12T16:50:26.346" }
```

---

## 2. Utilisateurs — `/api/users`

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
| `supplierId` | integer | Obligatoire, utilisateur `SUPPLIER` non archivé |

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

**Paramètre de `GET /api/bundles`** (facultatif) : `agentId` (bundles d'un agent).

**Corps de requête** (`POST` / `PUT`) :

| Champ | Type | Règle |
|---|---|---|
| `title` | string | Obligatoire, 200 max |
| `description` | string | Facultatif, 2000 max |
| `discountPercentage` | number | 0 à 100 (défaut 0) |
| `offerIds` | integer[] | Obligatoire, **au moins 2 offres distinctes** et existantes (`404` sinon) |
| `createdById` | integer | Obligatoire, utilisateur `AGENT` non archivé |

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
# Créer un hôtel (fournisseur 2, ville 1)
curl -X POST http://localhost:8080/api/offers -H "Content-Type: application/json" \
  -d '{"type":"HOTEL","title":"Riad Atlas","basePrice":1260,"stock":5,"cityId":1,"supplierId":2,"stars":4,"roomType":"Suite"}'

# Créer un bundle de deux offres (agent 3) avec 10 % de remise
curl -X POST http://localhost:8080/api/bundles -H "Content-Type: application/json" \
  -d '{"title":"Escapade","discountPercentage":10,"offerIds":[1,2],"createdById":3}'

# Filtrer
curl "http://localhost:8080/api/offers?supplierId=2&type=HOTEL"
```

Comptes de test créés au démarrage (mot de passe `password123`) : `1` client, `2` fournisseur, `3` agent, `4` administrateur.

## Endpoints prévus (non implémentés)

- `GET /api/offers/search?city=…` : filtrage du catalogue public.
- Authentification (login / register) et protection par rôle (Spring Security + JWT).
- Panier et codes promo, réservations (`POST /api/bookings`), paiements, notifications.
- CRUD des codes promo (espace administrateur).
