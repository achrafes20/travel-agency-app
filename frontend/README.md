# Frontend Atlas Voyage

Interface **HTML / CSS / JavaScript vanilla** (sans framework), conforme au cahier des charges.

## Site public

| Page | Fichier | Rôle |
|---|---|---|
| **Accueil** | `accueil.html` | Page d’entrée actuelle (conservée telle quelle) |
| Catalogue | `catalogue.html` | Liste d’offres (UI existante) |
| Détail offre | `offre.html` | Fiche produit |
| Panier | `panier.html` | Checkout existant |

## Espace client (maquettes `atlas-voyage-client`)

| Entrée | Fichier |
|---|---|
| SPA client | `client/index.html` |
| Styles | `css/client.css` |
| Logique | `client/js/app.js` |

Redirection : `espace-client.html` → `client/index.html?page=dashboard`. Le logo renvoie vers `accueil.html`. Exemples : `?page=catalogue`, `?page=panier`, `?page=reservations`. Persona démo alignée sur le seed : **Sarah Benali**.

## Espace fournisseur (maquettes `atlas-voyage-supplier`)

| Entrée | Fichier |
|---|---|
| Shell fournisseur | `supplier/index.html` |
| Styles | `css/supplier.css` |
| Logique | `supplier/js/app.js` |

Redirection : `fournisseur.html` → `supplier/index.html`.

## Espace agent (maquettes `atlas-voyage-agent`)

| Entrée | Fichier |
|---|---|
| Shell agent | `agent/index.html` |
| Styles | `css/agent.css` |
| Logique | `agent/js/app.js` |

Redirection : `agent.html` → `agent/index.html`. Navigation : `?page=bookings`, `?page=bundles`, etc. Connexion démo alignée sur le seed backend (`nadia.elfassi@atlasvoyage.ma`).

## Espace admin (maquettes `atlas-voyage-admin`)

| Entrée | Fichier | Rôle |
|---|---|---|
| **Shell admin** | `admin/index.html` | Dashboard, navigation, modules (UI maquette) |
| Styles | `css/admin.css` | Styles de l’admin (Montserrat, layout) |
| Logique | `admin/js/app.js` | Navigation SPA + **API** pour Utilisateurs et Villes |

## Séance 2 — Module Villes (CRUD détaillé) · **livrable B4**

Documentation complète : [`../docs/B4-seance2-livrable.md`](../docs/B4-seance2-livrable.md).

| Page | Fichier | Rôle |
|---|---|---|
| **Liste (entrée Séance 2)** | `pages/admin/villes.html` | Liste API, suppression, navigation |
| Formulaire | `pages/admin/ville-form.html` | Création (`POST`) ou modification (`PUT`) |
| Détail | `pages/admin/ville-detail.html` | Consultation (`GET /api/cities/{id}`) |

Depuis l’admin : menu **Villes** → liste API ; **Ajouter / Modifier** ouvre les pages `pages/admin/`.

### Séparation des responsabilités (Frontend)

```
pages/admin/*.html          → structure HTML, chargement des scripts
js/core/api.js              → couche HTTP (fetch), sans règles métier
js/services/city.service.js → appels API du domaine « Ville »
js/pages/*.page.js            → manipulation DOM, navigation, messages UI
js/components/admin-layout.js → layout admin partagé
```

La **logique métier** (unicité du nom, validation, persistance) reste dans le backend : `CityController → CityService → CityRepository`.

## Lancement

1. Démarrer le backend (`backend/mvnw spring-boot:run`).
2. Live Server sur `accueil.html` ou `pages/admin/villes.html` (racine = dossier `frontend/`).

## Configuration API

Modifier l'URL du backend dans `js/core/config.js` :

```javascript
window.APP_CONFIG = { apiBase: "http://localhost:8080" };
```
