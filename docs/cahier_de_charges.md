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
- Gère les villes référencées.
- **Gère les codes promo et réductions** (création, modification, désactivation).
- Supervise la configuration globale de la plateforme.

---

## 4. Modules fonctionnels

1. **Authentification & gestion des utilisateurs** — inscription, connexion, gestion de profil, contrôle d'accès basé sur les rôles.
2. **Catalogue d'offres** — affichage avec **pagination**, tri, et gestion des 5 types d'offres.
3. **Bundles** — création et gestion par les agents.
4. **Recherche & filtres** — par ville, dates, prix, type d'offre.
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
- **`City`** — référentiel géographique (villes avec coordonnées pour la carte).

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
- Module Admin (Users, Villes, **CRUD des Codes Promo**).

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

---

## 11. Suivi d'avancement

*Dernière mise à jour : 2026-10-26.*

### Phase 1 — Analyse & conception
✅ **Terminée.** Cahier des charges (ce document) et diagramme d'architecture (`architecture.md`) rédigés.

### Phase 2 — Mise en place & modélisation
✅ **Terminée.**
- Projet Spring Boot fonctionnel, connexion MySQL (XAMPP) vérifiée (`backend/pom.xml`, `backend/src/main/resources/application.properties`).
- Structure Frontend HTML/CSS/JS en place (`frontend/`), page d'accueil et pages catalogue/offre/panier/agent déjà présentes.
- **Toutes les entités JPA du modèle de données (§6) sont créées**, avec un repository Spring Data pour chacune :
  - `User` (rôles CLIENT/SUPPLIER/AGENT/ADMIN)
  - `Offer` (classe abstraite, héritage `SINGLE_TABLE`) + sous-classes `Flight`, `Hotel`, `Car`, `TaxiTransfer`, `Excursion`
  - `Bundle`, `Cart` / `CartItem`, `PromoCode`, `Booking`, `Payment`, `Notification`, `City`
- **Script SQL** généré (dump du schéma via `mysqldump`) et conservé hors du dépôt Git (stocké séparément par l'équipe). La création/mise à jour des tables en local se fait uniquement via Hibernate (`spring.jpa.hibernate.ddl-auto=update`) à partir des entités JPA — pas de script `schema.sql` dans `backend/src/main/resources/`.
- Premier bout-en-bout validé : entité `User` → repository → contrôleur REST (`GET /api/users`) → CORS → `fetch()` frontend → tableau affiché dans l'onglet « Utilisateurs » de l'espace agent, avec 4 comptes de test (un par rôle) insérés via un `CommandLineRunner`.
- Endpoint de vérification `GET /api/status`. Page d’accueil : `frontend/accueil.html` (plus de page `index.html` séparée).

### Séance 2 — Architecture en couches (IoC / injection de dépendances)
✅ **Terminée.** Première fonctionnalité métier : **gestion des villes** (référentiel Admin).
- ✅ Packages Backend : `controller`, `service`, `repository`, `entity`, `dto`, `exception`, `config`.
- ✅ Flux **Controller → Service → Repository** sur `CityController` / `CityService` / `CityRepository` avec injection par constructeur (beans Spring / IoC).
- ✅ API REST CRUD `/api/cities` + DTOs `CityRequest` / `CityResponse` + validation + gestion d'erreurs (`GlobalExceptionHandler`).
- ✅ Test unitaire `CityServiceTest` (règle d'unicité du nom).
- ✅ Interface unifiée `admin/index.html?page=cities` : liste et modales d’ajout, modification et détail, connectées à l’API via `js/core/api.js`.
- ✅ `architecture.md` : schéma de séquence Séance 2 et structure Frontend.

### Module Admin — Gestion des utilisateurs
✅ **Terminé** (page `admin/index.html?page=users`), branché sur l'API :
- ✅ API REST `/api/users` : liste, détail, création, modification, archivage/restauration, suppression définitive (comptes archivés uniquement) — voir `architecture.md`, « Module Utilisateurs ».
- ✅ Couche métier `UserService` : email unique (insensible à la casse), mot de passe haché en BCrypt, mot de passe jamais renvoyé (`UserResponse`), erreurs en `400`/`404` via `GlobalExceptionHandler`.
- ✅ Entité `User` : nouvel indicateur `archived` (colonne ajoutée par Hibernate, `false` par défaut pour les comptes existants).
- ✅ Test unitaire `UserServiceTest` (unicité de l'email, hachage, mot de passe conservé, archivage/suppression).
- ✅ Interface : formulaire de création/modification (nom complet, email, rôle, mot de passe), boutons modifier/archiver, confirmations dans l'application (fenêtres modales, plus de `confirm()` du navigateur), filtres rôle et statut (les archivés sont masqués par défaut), recherche et pagination.
- ✅ Accès réservé au rôle `ADMIN` (Spring Security + JWT) ; un compte archivé est refusé à la connexion et son jeton est rejeté.
- Nettoyage de l'interface admin : badge « Données API », fausses notifications, pastille de la cloche, raccourci Ctrl+K et « Dernière connexion » retirés ; barre de défilement de la barre latérale masquée.

### Module Fournisseur — Gestion des offres
✅ **Terminé** (page `supplier/index.html?page=offers`), branché sur l'API :
- ✅ API REST `/api/offers` : liste (filtres fournisseur / type), détail, création, modification, suppression — voir `architecture.md`, « Module Offres ».
- ✅ Les **5 sous-types** (`Flight`, `Hotel`, `Car`, `TaxiTransfer`, `Excursion`) sont gérés par un seul endpoint (champ `type`) ; `Offer` reçoit un indicateur `active`.
- ✅ Couche métier `OfferService` : validation par type, fournisseur actif de rôle `SUPPLIER`, ville existante, 5 images maximum, suppression refusée si l'offre est utilisée (désactivation proposée).
- ✅ Test unitaire `OfferServiceTest` (création des 5 types, validations, modification sans changement de type, filtre fournisseur, suppression).
- ✅ Interface : liste (tableau / cartes, recherche, filtres type et statut, tri) avec boutons d'action par ligne (modifier, stock, supprimer), formulaire en 4 étapes avec champs propres à chaque type (création et modification), activation par interrupteur, suppression avec repli sur la désactivation.
- ✅ Page **Inventaire** : niveau de stock (Disponible / Stock bas / Épuisé) et stock modifiable directement dans le tableau (boutons − / + ou saisie), enregistré automatiquement.
- ✅ Le fournisseur est l'utilisateur connecté (jeton JWT) : il ne peut modifier, supprimer ni rattacher d'offre qu'à son propre compte (`403` sinon).
- ⚠️ Limites connues : les images sont saisies par URL (pas d'upload) ; le stock réservé / disponible n'existe pas encore (réservations non implémentées).

### Module Agent — Gestion des bundles
✅ **Terminé** (page `agent/index.html?page=bundles`), branché sur l'API :
- ✅ API REST `/api/bundles` : liste (filtre agent), détail, création, modification, suppression — voir `architecture.md`, « Module Bundles ».
- ✅ Prix final et stock dynamique (stock le plus bas des offres, §5.3) sont calculés par l'API.
- ✅ Couche métier `BundleService` : 2 offres minimum, remise 0–100 %, créateur de rôle `AGENT`.
- ✅ Test unitaire `BundleServiceTest` (prix et stock dynamiques, validations, modification, filtre agent, suppression).
- ✅ Interface : liste (recherche), éditeur en 3 sections avec sélecteur d'offres, récapitulatif en temps réel (somme, remise, prix final, stock dynamique) et suppression avec confirmation.
- ✅ L'agent est l'utilisateur connecté (jeton JWT) : il ne peut modifier ni supprimer que ses propres bundles (`403` sinon).
- ⚠️ Limites connues : remise en pourcentage uniquement ; pas encore de réservation de bundle (panier / réservations non implémentés) ; le tableau de bord, les réservations, paiements et tickets de l'espace agent restent en données démo.

### Séance 3 & 4 — Modèle de données (JPA/Hibernate), CRUD et API REST
⚠️ **Presque terminée** : il ne manque que le diagramme de classes.
- ✅ **Entités JPA et mappings** : 15 entités et 6 énumérations, avec `@ManyToOne`, `@OneToMany`, `@OneToOne`, `@ManyToMany` (`bundle_offers`) et héritage `SINGLE_TABLE` pour les offres — voir `architecture.md`, §3.
- ✅ **Base MySQL fonctionnelle** : tables générées par Hibernate (`ddl-auto=update`), persistance vérifiée.
- ✅ **CRUD complet (Repository, Service, Controller) pour 4 entités** : `User`, `City`, `Offer` (5 sous-types) et `Bundle`.
- ✅ **Liste des endpoints** : [`api_endpoints.md`](api_endpoints.md) — 26 endpoints, champs, règles, droits d'accès et codes de retour.
- ✅ **Tests Postman** : `docs/postman/` — collection de 59 requêtes et 104 vérifications (utilisateurs, offres, bundles, authentification et droits) ; chaque dossier est autonome (il se connecte lui-même avec les comptes de test) et nettoie ses données.
- ✅ **Interfaces CRUD** : Admin (utilisateurs, villes), Fournisseur (offres, stock), Agent (bundles).
- ✅ **Harmonisation de l'interface** : menus latéraux repliables dans les quatre espaces ; retrait des mentions « Version 2 », des liens « Voir le site public » et des cartes « Besoin d'aide » des menus.
- ✅ **Tests automatisés** : 35 tests (`CityServiceTest`, `UserServiceTest`, `OfferServiceTest`, `BundleServiceTest`, `AuthServiceTest`, et `SecurityRulesTest` pour les règles d'accès par route).
- ✅ Suppression d'une ville refusée (`400`) si des offres l'utilisent.
- ❌ **Diagramme de classes** — à produire.

### Phase 3 — Fondations & documentation
✅ **Terminée.**
- ✅ Diagramme général de l'architecture (`architecture.md`).
- ✅ **Authentification complète (Spring Security + JWT)**, sans session serveur :
  - API `/api/auth` : `register` (inscription publique, rôle toujours `CLIENT`), `login` (jeton JWT valable 24 h) et `me` ; mot de passe haché en BCrypt, même message d'erreur pour un email inconnu et un mauvais mot de passe.
  - Compte archivé refusé à la connexion ; son jeton est aussi rejeté immédiatement (l'utilisateur est rechargé en base à chaque requête).
  - **Contrôle d'accès par rôle** (`SecurityConfig`) : `/api/users` et écriture sur `/api/cities` = `ADMIN` ; écriture sur `/api/offers` = `SUPPLIER` ; écriture sur `/api/bundles` = `AGENT` ; lecture du catalogue (offres, villes, bundles) publique. `401` sans jeton valide, `403` si le rôle ne convient pas.
  - **Propriété des ressources** : le fournisseur d'une offre et le créateur d'un bundle sont pris dans le jeton ; modifier ou supprimer la ressource d'un autre utilisateur renvoie `403`.
  - Tests : `AuthServiceTest` (connexion, inscription, jeton falsifié, compte archivé), `SecurityRulesTest` (règles par route avec MockMvc), tests de propriété dans `OfferServiceTest` / `BundleServiceTest`, et dossier Postman « 04 - Authentification et droits ».
  - **Frontend** : écran unique `connexion.html` (connexion + création de compte client) qui remplace les anciens écrans de connexion fictifs ; `js/core/auth.js` (session, garde par rôle) ; chaque espace (admin, fournisseur, agent, client) redirige vers la connexion sans session ou avec un autre rôle, et propose une déconnexion ; l'en-tête public affiche « Se connecter » ou l'espace du rôle.
  - Les espaces Fournisseur et Agent n'utilisent plus « le premier compte actif du rôle » : ils agissent avec le compte connecté.
- ⚠️ Limites connues : pas de renouvellement ni de révocation de jeton avant expiration (déconnexion côté navigateur uniquement) ; « Mot de passe oublié » et changement de mot de passe par l'utilisateur ne sont pas implémentés ; la clé `jwt.secret` est une valeur de développement dans `application.properties`.

### Phase 4 — Développement des modules
⚠️ **Partiellement commencée** : les modules Admin **Villes** (Séance 2) et **Utilisateurs**, le module Fournisseur **Offres** et le module Agent **Bundles** (voir ci-dessus) sont terminés. Restent à faire :
- **Modules transactionnels** (Personne 1) : panier + application des codes promo, workflow réservation/paiement, notifications in-app et envoi d'emails (SMTP), dashboard client. Les entités existent, mais aucune logique métier ni endpoint n'a été écrit.
- **Catalogue & modules staff** (Personne 2) : catalogue connecté au backend (actuellement données statiques codées en dur dans `app.js`) avec pagination réelle et carte Leaflet, CRUD codes promo côté Admin. *(Modules Admin **Villes** et **Utilisateurs** : terminés.)*

### Phase 5 — Intégration & finalisation
❌ **Non commencée** — bloquée tant que la Phase 4 n'est pas avancée.

### Notes techniques complémentaires
- Les **nouveaux** comptes créés par le seed utilisent **BCrypt** (`spring-security-crypto`). Un compte dont le mot de passe est encore en clair (table `users` créée avant BCrypt) est haché automatiquement au démarrage du Backend (`DataSeeder`), ce qui permet de se connecter avec les comptes de test existants.
- Le dépôt Git ne contenait pas encore de `.gitignore` ; les artefacts compilés (`backend/target/`) étaient suivis par erreur — corrigé (voir `.gitignore` à la racine).
- Un wrapper Maven (`backend/mvnw`, `mvnw.cmd`) a été ajouté pour que le projet reste exécutable sans installation Maven séparée sur une autre machine.

