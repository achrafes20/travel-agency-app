# Frontend Atlas Voyage

Interface **HTML / CSS / JavaScript vanilla** (sans framework), conforme au cahier des charges.

## Site public

| Page | Fichier | Rôle |
|---|---|---|
| **Accueil** | `accueil.html` | Page d’entrée actuelle (conservée telle quelle) |
| **Connexion** | `connexion.html` | **Écran unique** de connexion et de création de compte client |
| Catalogue | `catalogue.html` | Liste d’offres (UI existante) |
| Détail offre | `offre.html` | Fiche produit |
| Panier | `panier.html` | Checkout existant |

## Espace client (maquettes `atlas-voyage-client`)

| Entrée | Fichier |
|---|---|
| SPA client | `client/index.html` |
| Styles | `css/client.css` |
| Logique | `client/js/app.js` |

Redirection : `espace-client.html` → `client/index.html?page=dashboard`. Le logo renvoie vers `accueil.html`. Exemples : `?page=catalogue`, `?page=panier`, `?page=reservations`. Réservé au rôle `CLIENT` (compte de test : **Sarah Benali**) ; le nom affiché est celui du compte connecté. Le **catalogue** (`?page=catalogue`) et la **fiche offre** (`?page=offre&id=…`) sont branchés sur l'API (`/api/offers/search`, `/api/offers/{id}`, `/api/cities`) : filtres, tri, pagination réelle. Le panier, les réservations et le reste de l'espace restent en données démo.

## Espace fournisseur (maquettes `atlas-voyage-supplier`)

| Entrée | Fichier |
|---|---|
| Shell fournisseur | `supplier/index.html` |
| Styles | `css/supplier.css` |
| Logique | `supplier/js/app.js` |

Redirection : `fournisseur.html` → `supplier/index.html`. Réservé au rôle `SUPPLIER` ; les offres affichées et créées sont celles du fournisseur connecté.

## Espace agent (maquettes `atlas-voyage-agent`)

| Entrée | Fichier |
|---|---|
| Shell agent | `agent/index.html` |
| Styles | `css/agent.css` |
| Logique | `agent/js/app.js` |

Redirection : `agent.html` → `agent/index.html`. Navigation : `?page=bookings`, `?page=bundles`, etc. Réservé au rôle `AGENT` (compte de test `nadia.elfassi@atlasvoyage.ma`) ; les bundles sont créés au nom de l'agent connecté.

## Espace admin (maquettes `atlas-voyage-admin`)

| Entrée | Fichier | Rôle |
|---|---|---|
| **Shell admin** | `admin/index.html` | Dashboard, navigation, modules (UI maquette) |
| Styles | `css/admin.css` | Styles de l’admin (Montserrat, layout) |
| Logique | `admin/js/app.js` | Navigation SPA + **API** pour Utilisateurs et Villes |

Réservé au rôle `ADMIN` (comme les pages `pages/admin/`).

## Authentification (JWT)

| Fichier | Rôle |
|---|---|
| `connexion.html`, `css/connexion.css`, `js/pages/connexion.page.js` | Écran unique : onglets « Connexion » et « Créer un compte » ; redirige vers l’espace du rôle |
| `js/core/auth.js` | `Auth` : jeton et utilisateur (`localStorage`, ou `sessionStorage` si « Se souvenir de moi » est décoché), `login`, `register`, `logout`, garde `requireRole()` |
| `js/core/api.js` | Ajoute `Authorization: Bearer <jeton>` ; sur un `401`, efface la session et revient à la connexion |

Chaque espace charge `js/core/auth.js` dans `<head>` puis appelle `Auth.requireRole("<RÔLE>")` : sans session, ou avec un autre rôle, la page redirige vers `connexion.html`. L’en-tête des pages publiques affiche « Se connecter », ou le lien vers l’espace du rôle et « Déconnexion ». Les droits sont toujours **contrôlés par le Backend** : le Frontend ne fait que rediriger.

## Séance 2 — Module Villes (CRUD détaillé)

| Page | Fichier | Rôle |
|---|---|---|
| **Gestion des villes** | `admin/index.html?page=cities` | Liste, détail, création, modification et suppression via API |

Depuis l’admin : menu **Villes** → liste API ; les actions **Ajouter**, **Détail** et **Modifier** s’ouvrent dans des modales intégrées.

### Séparation des responsabilités (Frontend)

```
admin/index.html            → interface d’administration unifiée
admin/js/app.js             → rendu, interactions et appels du domaine « Ville »
js/core/api.js              → couche HTTP (fetch), sans règles métier
```

La **logique métier** (unicité du nom, validation, persistance) reste dans le backend : `CityController → CityService → CityRepository`.

## Lancement

1. Démarrer le backend (`backend/mvnw spring-boot:run`).
2. Live Server sur `accueil.html` ou `connexion.html` (racine = dossier `frontend/`), puis se connecter avec un compte de test (mot de passe `password123`, voir le `README.md` racine).

## Configuration API

Modifier l'URL du backend dans `js/core/config.js` :

```javascript
window.APP_CONFIG = { apiBase: "http://localhost:8080" };
```
