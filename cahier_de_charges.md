# Cahier des Charges — Plateforme Agence de Voyage

## 1. Présentation du projet

### 1.1 Contexte
Projet scolaire réalisé en binôme (2 personnes) consistant à développer une plateforme web pour une agence de voyage. La plateforme permet la réservation en ligne de prestations touristiques individuelles ou groupées (bundles), avec un focus sur le marché marocain tout en offrant des destinations internationales.

### 1.2 Objectifs
- Fournir aux clients une plateforme intuitive pour rechercher et réserver des offres de voyage.
- Permettre aux fournisseurs (hôtels, compagnies, prestataires) de gérer leurs propres offres et inventaires.
- Donner aux agents de l'agence les outils pour composer des bundles et gérer le service client.
- Offrir à l'administration un contrôle global sur la plateforme.

### 1.3 Équipe
- Projet réalisé par **2 développeurs**.
- Répartition détaillée dans la section *Planning*.

---

## 2. Périmètre fonctionnel

### 2.1 Types d'offres proposées
La plateforme propose 5 catégories d'offres :
- **Vols** (flights)
- **Hôtels** (hotels)
- **Location de voitures** (cars)
- **Taxis aéroport** (transferts)
- **Excursions guidées** (day trips avec transport + guide, ex : Chefchaouen → Tanger)

Chaque type d'offre peut être réservé **individuellement** ou intégré à un **bundle** (package composé par un agent).

### 2.2 Portée géographique
- **Destination principale : Le Maroc** (Chefchaouen, Tanger, Marrakech, Casablanca, etc.).
- L'application cible le **tourisme interne** (voyages à l'intérieur du Maroc) et le **tourisme entrant** (voyages depuis l'étranger vers le Maroc).
- *Note : Les trajets du Maroc vers l'étranger sont gérés **uniquement dans le cadre de vols retours** pour les touristes rentrant chez eux. Le tourisme sortant pur (vacances à l'étranger) est hors périmètre.*

### 2.3 Langue de l'application
- Interface utilisateur en **français uniquement**.

---

## 3. Utilisateurs et rôles

La plateforme gère **4 rôles** distincts :

### 3.1 Client
- S'inscrit, se connecte, gère son profil.
- Parcourt le catalogue, utilise la recherche et les filtres.
- Ajoute des offres à son panier et peut appliquer des **codes promo**.
- Effectue des réservations et paiements (simulés ou à l'arrivée).
- Consulte l'historique de ses réservations.
- Annule ses réservations dans les délais autorisés.
- Reçoit des notifications in-app et **par email**.

### 3.2 Supplier (fournisseur)
- Gère son profil fournisseur.
- Crée, modifie et supprime **ses propres offres** (les 5 types).
- Gère l'inventaire de ses offres (stock disponible).
- Consulte les réservations effectuées sur ses offres.

### 3.3 Agent
- Compose des **bundles** à partir des offres des fournisseurs (avec calcul dynamique des prix/stocks).
- Gère les réservations : validation manuelle si nécessaire, annulations, remboursements.
- Assure le support client (traitement des demandes).
- Marque les paiements « pay-on-arrival » comme effectués.

### 3.4 Admin
- Gère les utilisateurs (activation, désactivation, changement de rôle).
- Gère les destinations et villes référencées.
- **Gère les codes promo et réductions** (création, modification, désactivation).
- Supervise la configuration globale de la plateforme.

---

## 4. Modules fonctionnels

1. **Authentification & gestion des utilisateurs** — inscription, connexion, gestion de profil, contrôle d'accès basé sur les rôles.
2. **Catalogue d'offres** — affichage avec **pagination**, tri, et gestion des 5 types d'offres.
3. **Bundles** — création et gestion par les agents.
4. **Recherche & filtres** — par destination, dates, prix, type d'offre.
5. **Panier & Réductions** — ajout d'offres avant paiement et application de **codes promo**.
6. **Réservation** — workflow complet avec gestion du cycle de vie.
7. **Paiement** — paiement simulé (formulaire fake) et paiement à l'arrivée.
8. **Notifications** — alertes in-app (icône cloche) et **envois d'emails automatiques** (confirmation, annulation).
9. **Dashboards** — un tableau de bord par rôle (Client, Supplier, Agent, Admin).
10. **Carte géographique** — affichage de la localisation des offres via Leaflet (Vanilla JS).

---

## 5. Règles métier

### 5.1 Gestion de l'inventaire et Panier
- Chaque offre possède un **stock** (chambres, sièges, unités, etc.).
- **Panier :** L'ajout au panier ne réserve pas le stock. La vérification finale se fait au paiement.
- Une réservation confirmée **décrémente** le stock.
- Une annulation **libère** le stock.

### 5.2 Paiement
- Chaque offre possède un flag `allowsPayOnArrival`.
- À la finalisation : si tous les articles du panier autorisent le pay-on-arrival, le client a le choix. Sinon, paiement simulé obligatoire.
- Le **paiement à l'arrivée** est marqué comme effectué par un agent.

### 5.3 Les Bundles
- Toujours en **pay-now** (paiement simulé obligatoire).
- **Prix :** L'agent peut appliquer une réduction globale au bundle par rapport à la somme des offres individuelles.
- **Stock :** Le stock d'un bundle est calculé dynamiquement en fonction du stock le plus bas parmi ses offres.

### 5.4 Codes Promo et Réductions
- Un code promo peut offrir une réduction en pourcentage (ex: -10%) ou une valeur fixe.
- Il est validé au niveau du panier et s'applique sur le montant total.
- Il possède une date d'expiration et peut être désactivé par l'Admin.

### 5.5 Cycle de vie d'une réservation
États : `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`.
Transitions gérées automatiquement ou manuellement (par l'agent ou le client jusqu'à 48h avant).

### 5.6 Publication et médias
- Les offres des fournisseurs sont **publiées immédiatement**.
- **Images :** Les images des offres sont stockées localement sur le système de fichiers du serveur (dossier dédié) et leurs chemins sont enregistrés en BDD.

---

## 6. Modèle de données (entités principales)

- **`User`** — avec un champ `role` (CLIENT, SUPPLIER, AGENT, ADMIN).
- **`Offer`** — classe parent abstraite (héritage `SINGLE_TABLE`). Champs : `id`, `title`, `description`, `basePrice`, `stock`, `images` (chemins), etc.
  - Sous-classes : `Flight`, `Hotel`, `Car`, `TaxiTransfer`, `Excursion`.
- **`Bundle`** — contient plusieurs `Offer`.
- **`Booking`** — lien entre un `Client` et des Offres/Bundles.
- **`Cart` / `CartItem`** — panier du client.
- **`PromoCode`** — entité pour les réductions (`code`, `discountType`, `value`, `expiryDate`).
- **`Payment`** — lié à une `Booking`.
- **`Notification`** — messages in-app.
- **`Destination` / `City`** — référentiel géographique.

---

## 7. Stack technique

| Couche | Technologie |
|---|---|
| Backend | **Spring Boot** (Spring Web, Spring Data JPA, Spring Security) |
| Envoi d'emails | **Spring Boot Starter Mail** (JavaMailSender) |
| Authentification | **Spring Security + JWT** (stateless) |
| Base de données | **MySQL** |
| Build | **Maven** |
| Frontend | **HTML, CSS, JavaScript (Vanilla)** |
| Cartographie | **Leaflet (JS)** |

---

## 9. Planning

### Phase 1 — Analyse & conception *(les deux)*
- Modélisation et endpoints API.

### Phase 2 — Mise en place & modélisation *(en parallèle)*
**Personne 2 :** Setup Spring Boot, structure Frontend HTML/CSS/JS, MySQL, Git. *(Livrable : `pom.xml`, page d'accueil HTML)*
**Personne 1 :** Entités JPA, script SQL (incluant PromoCode). *(Livrable : `script BDD`)*

### Phase 3 — Fondations & documentation *(en parallèle)*
**Personne 1 :** Authentification complète (Spring Security + JWT).
**Personne 2 :** Diagramme d'architecture.

### Phase 4 — Développement des modules en parallèle *(les deux)*
**Personne 1 — Modules transactionnels :**
- Panier & application des Codes Promo.
- Workflow réservation & Paiement.
- Notifications in-app et **envoi d'emails (SMTP)**.
- Dashboard client.

**Personne 2 — Catalogue & modules staff-facing :**
- Catalogue HTML/JS (avec **pagination**) et carte Leaflet.
- Module Supplier (CRUD offres, inventaire).
- Module Agent (Bundles).
- Module Admin (Users, Destinations, **CRUD des Codes Promo**).

### Phase 5 — Intégration & finalisation *(les deux)*
- Tests de flux via API Fetch/AJAX, correction de bugs, préparation de démo.

---

## 10. Hors périmètre

- Intégration de paiement réel (CMI, Stripe, PayPal, etc.).
- Notifications par SMS.
- Support multilingue (français uniquement).
- Design mobile / responsive (desktop uniquement).
- Système d'avis et de notations.
- Devis personnalisés à la demande.
- Programme de fidélité.
- Modération manuelle des offres fournisseurs.
- Déploiement en production.

