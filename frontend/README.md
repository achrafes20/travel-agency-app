# Frontend Atlas Voyage

Interface **HTML / CSS / JavaScript vanilla** (sans framework), conforme au cahier des charges.

## Site public

| Page | Fichier | Rôle |
|---|---|---|
| **Accueil** | `accueil.html` | Page d’entrée actuelle (conservée telle quelle) |
| **Connexion** | `connexion.html` | **Écran unique** de connexion et de création de compte client |
| Catalogue | `catalogue.html` | Liste d’offres (UI existante) |
| Détail offre | `offre.html` | Fiche produit |
| Panier | `panier.html` | Checkout du client connecté ; un invité n'y voit qu'une invitation à se connecter (le lien « Panier » n'est affiché qu'aux clients) |

## Espace client (maquettes `atlas-voyage-client`)

| Entrée | Fichier |
|---|---|
| SPA client | `client/index.html` |
| Styles | `css/client.css` |
| Logique | `client/js/app.js` |

Redirection : `espace-client.html` → `client/index.html?page=dashboard`. Le logo renvoie vers `accueil.html`. Le catalogue n'est plus dupliqué dans le tableau de bord client : tous les visiteurs utilisent les pages publiques par catégorie. Le panier public utilise `localStorage` pour un invité et `/api/cart` pour un client connecté.

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
| Logique | `admin/js/app.js` | Navigation SPA + API pour les utilisateurs et codes promo |

Réservé au rôle `ADMIN` (comme les pages `pages/admin/`).

## Authentification (JWT)

| Fichier | Rôle |
|---|---|
| `connexion.html`, `css/connexion.css`, `js/pages/connexion.page.js` | Écran unique : onglets « Connexion » et « Créer un compte » ; redirige vers l’espace du rôle, ou vers la page d'origine (paramètre `redirect`, nom de page du site uniquement) pour un client. Le lien « Mot de passe oublié ? » est dans `.login-options` ; l'aide du mot de passe vient de `AccountUI.strength` |
| `js/core/auth.js` | `Auth` : jeton et utilisateur (`localStorage`, ou `sessionStorage` si « Se souvenir de moi » est décoché ; le choix est aussi envoyé à l'API sous `rememberMe`), `login`, `register`, `logout`, garde `requireRole()` |
| `js/core/api.js` | Ajoute `Authorization: Bearer <jeton>` ; sur un `401`, efface la session et revient à la connexion |

Chaque espace charge `js/core/auth.js` dans `<head>` puis appelle `Auth.requireRole("<RÔLE>")` : sans session, ou avec un autre rôle, la page redirige vers `connexion.html`. L’en-tête des pages publiques affiche « Se connecter », ou le lien vers l’espace du rôle et « Déconnexion ». Les droits sont toujours **contrôlés par le Backend** : le Frontend ne fait que rediriger.

## Localisation des offres

Le module Villes n’est plus exposé dans l’administration. Dans l’espace fournisseur, le formulaire d’offre recherche les villes avec Open-Meteo et remplit automatiquement le nom et les coordonnées. Le backend crée ou réutilise la ville au moment de l’enregistrement.

### Séparation des responsabilités (Frontend)

```
supplier/index.html         → formulaire de création et modification d’offre
supplier/js/app.js          → recherche Open-Meteo et sélection de la ville
js/core/api.js              → enregistrement de l’offre dans le backend
```

La logique métier de création ou réutilisation d’une ville reste dans `OfferService → CityRepository`.

## Lancement

1. Démarrer le backend (`backend/mvnw spring-boot:run`).
2. Live Server sur `accueil.html` ou `connexion.html` (racine = dossier `frontend/`), puis se connecter avec un compte de test (mot de passe `password123`, voir le `README.md` racine).

## Configuration API

Modifier l'URL du backend dans `js/core/config.js` :

```javascript
window.APP_CONFIG = { apiBase: "http://localhost:8080" };
```
