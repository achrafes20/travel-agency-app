# 🌴 Atlas Voyage

**Atlas Voyage** est une application web de réservation pour une agence de voyage marocaine (Frontend HTML/CSS/JS + Backend Spring Boot + MySQL).

Ce projet s'inscrit dans le cadre du module **Frameworks Technologie Web (ENSA - 3ème année)**.

> ### ⚠️ Périmètre à évaluer
> **Ces modules sont finalisés (CRUD complet, de l'interface à la base de données).** Lancez le backend et le serveur du frontend (voir [Lancement](#-lancement), frontend sur le port `5500`), puis ouvrez :
>
> | Module | Lien | Entité |
> |---|---|---|
> | 👤 **Utilisateurs** (administration) | [http://localhost:5500/admin/index.html?page=users](http://localhost:5500/admin/index.html?page=users) | `User` |
> | 🏨 **Offres** (fournisseur, 5 types) | [http://localhost:5500/supplier/index.html?page=offers](http://localhost:5500/supplier/index.html?page=offers) | `Offer` (`Flight`, `Hotel`, `Car`, `TaxiTransfer`, `Excursion`) |
> | 📦 **Stocks** (fournisseur, inventaire) | [http://localhost:5500/supplier/index.html?page=inventory](http://localhost:5500/supplier/index.html?page=inventory) | stock des `Offer` |
> | 🎁 **Bundles** (agent) | [http://localhost:5500/agent/index.html?page=bundles](http://localhost:5500/agent/index.html?page=bundles) | `Bundle` |
> | 🏙️ **Villes** (administration) | [http://localhost:5500/admin/index.html?page=cities](http://localhost:5500/admin/index.html?page=cities) | `City` |
> | 🛒 **Panier** (client) | [http://localhost:5500/client/index.html?page=panier](http://localhost:5500/client/index.html?page=panier) | `Cart`, `CartItem` |
> | 🏷️ **Codes promo** (administration) | [http://localhost:5500/admin/index.html?page=promos](http://localhost:5500/admin/index.html?page=promos) | `PromoCode` |
>
> Le reste de l'interface (tableaux de bord, réservations, paiements, tickets, notifications…) est composé de maquettes avec des données de démonstration, non reliées au backend.

---

## 🛠️ Stack Technologique

1. **Frontend** — HTML5, CSS3, JavaScript vanilla. *Aucun framework.*
2. **Backend** — Java 21, Spring Boot 3 (Web, Data JPA, Validation, Security), authentification par jeton JWT, BCrypt pour le hachage des mots de passe, Maven.
3. **Base de données** — MySQL. Les tables sont créées / mises à jour automatiquement par Hibernate au démarrage (`spring.jpa.hibernate.ddl-auto=update`).

---

## 🚀 Lancement

### Prérequis
- JDK 21.
- MySQL / MariaDB démarré sur le port 3306 (par ex. via [XAMPP](https://www.apachefriends.org/)), avec l'utilisateur `root` sans mot de passe (valeurs par défaut de XAMPP). Sinon, adaptez `backend/src/main/resources/application.properties`.
- Aucune installation de Maven nécessaire : le projet embarque son wrapper (`mvnw` / `mvnw.cmd`).
- Un petit serveur statique pour le frontend (extension *Live Server* de VS Code, ou `python -m http.server`).

### 1. Backend (API sur `http://localhost:8080`)
```bash
cd backend
./mvnw spring-boot:run        # Windows PowerShell / CMD : .\mvnw.cmd spring-boot:run
```
La base `travel_agency_db` est créée automatiquement au premier démarrage, ainsi que 4 utilisateurs d'exemple (un par rôle, voir [Connexion](#-connexion-et-comptes-de-test)). Le backend est prêt quand la console affiche `Backend Spring Boot demarre avec succes !`.

### 2. Frontend
Servez le dossier **`frontend/`** (il doit être la racine du serveur) :
- **Live Server :** ouvrez le dossier `frontend` dans VS Code, clic droit sur `accueil.html` → *Open with Live Server*.
- **Ou en ligne de commande :**
  ```bash
  cd frontend
  python -m http.server 5500
  ```

Puis ouvrez **`http://localhost:5500/connexion.html`** (adaptez le port si votre serveur en utilise un autre). Les liens des modules finalisés sont dans l'encadré « Périmètre à évaluer » ci-dessus : si vous n'êtes pas connecté, vous êtes d'abord redirigé vers l'écran de connexion. Les menus latéraux des espaces sont repliables avec le bouton ☰.

---

## 🔐 Connexion et comptes de test

L'accès aux quatre espaces passe par **un seul écran de connexion** (`connexion.html`). Après connexion, vous êtes redirigé vers l'espace correspondant à votre rôle. Un visiteur peut aussi y **créer un compte client**.

Comptes de test (mot de passe `password123`) :

| Rôle | Email | Espace |
|---|---|---|
| Administrateur | `omar.tazi@atlasvoyage.ma` | `admin/` |
| Fournisseur | `karim.idrissi@atlasvoyage.ma` | `supplier/` |
| Agent | `nadia.elfassi@atlasvoyage.ma` | `agent/` |
| Client | `sarah.benali@example.com` | `client/` |

Un rôle ne peut pas ouvrir l'espace d'un autre rôle (redirection vers la connexion avec un message). Le bouton « Déconnexion » de chaque espace efface la session. Détail des droits par route dans [`docs/api_endpoints.md`](docs/api_endpoints.md#authentification-et-droits-daccès).

---

## 🧪 Données de démonstration

Une base vide ne montre rien dans les espaces : le script `scripts/seed_demo_data.py` la remplit en passant **par l'API** (donc avec les vraies règles : mots de passe hachés, propriétaire des offres, stock, prix).

Il crée **3 villes**, **6 comptes** (fournisseurs, agent, clients, dont un compte archivé), **26 offres** (hôtels, vols, voitures, taxis, excursions — avec des photos adaptées à chaque type ; dont une offre désactivée, une épuisée et plusieurs à stock bas), **7 bundles**, **5 codes promo** (actifs, désactivé, expiré) et un **panier prérempli** pour `lina.tazi@example.com` (2 lignes + `AUTOMNE25`). Les mots de passe sont `password123`.

```bash
# backend démarré (port 8080) ET frontend servi sur le port 5500 (les photos sont lues depuis ce serveur)
python scripts/seed_demo_data.py
# autre port pour le frontend :  python scripts/seed_demo_data.py --images http://localhost:PORT/images
```

Pour avoir un code promo **expiré** (l'API refuse d'en créer un), lancer ensuite une fois `scripts/demo_expire_promo.sql` (`ETE2026`) : `mysql -u root travel_agency_db < scripts/demo_expire_promo.sql`.

Le script est **relançable** : ce qui existe déjà n'est pas recréé. Il demande Python 3 (aucune bibliothèque à installer). Crédits des photos : [`frontend/images/offers/CREDITS.md`](frontend/images/offers/CREDITS.md).

## 👤 Gestion des utilisateurs — ce qu'il faut tester

Sur la page *Utilisateurs* de l'espace administrateur :

| Action | Comportement |
|---|---|
| **Lister** | Les utilisateurs sont lus depuis la base (`GET /api/users`). Recherche par nom/email, filtre par rôle, pagination. |
| **Créer** | Bouton « Créer un compte » : nom complet, email, rôle, mot de passe (8 caractères minimum, haché en BCrypt). Un email déjà utilisé est refusé (insensible à la casse). |
| **Modifier** | Icône crayon : modifie nom, email et rôle. Un mot de passe laissé vide reste inchangé. |
| **Archiver** | Icône d'archive, avec confirmation dans l'application. L'utilisateur disparaît de la liste par défaut. |
| **Voir les archivés / Restaurer** | Filtre de statut « Utilisateurs archivés » (ou « Tous les statuts »), puis icône de restauration. |
| **Supprimer définitivement** | Réservé aux comptes archivés, avec confirmation. Refusé si le compte est lié à d'autres données. |

### API REST `/api/users`

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/users` | Liste (actifs et archivés) |
| GET | `/api/users/{id}` | Détail |
| POST | `/api/users` | Création |
| PUT | `/api/users/{id}` | Modification |
| POST | `/api/users/{id}/archive` | Archivage |
| POST | `/api/users/{id}/restore` | Restauration |
| DELETE | `/api/users/{id}` | Suppression définitive (comptes archivés uniquement) |

Erreurs de validation / règles métier → `400`, utilisateur introuvable → `404`, avec un message en français.

La liste complète des endpoints de l'API (authentification, utilisateurs, villes, offres, bundles) est dans [`docs/api_endpoints.md`](docs/api_endpoints.md).

### Autres modules

Même découpage Controller → Service → Repository. Le détail des champs, règles et codes d'erreur est dans [`docs/api_endpoints.md`](docs/api_endpoints.md).

| Module | Ce qu'il faut tester |
|---|---|
| **Villes** (`/api/cities`) | Liste, ajout, modification, détail et suppression. Un nom de ville déjà utilisé est refusé ; une ville utilisée par des offres ne peut pas être supprimée. |
| **Offres** (`/api/offers`) | Formulaire en 4 étapes avec les champs propres à chaque type (vol, hôtel, voiture, taxi, excursion) ; modification (le type ne change pas) ; interrupteur actif / inactif ; boutons d'action modifier / stock / supprimer sur chaque ligne ; suppression, refusée si l'offre est utilisée dans un bundle (la désactiver à la place). |
| **Catalogue** (espace client, `client/index.html?page=catalogue`) | Offres réelles (actives et en stock) : filtres par destination, type, prix maximum et paiement à l'arrivée, tri, pagination ; clic sur une offre pour sa fiche (`?page=offre&id=…`). Le bouton « Ajouter au panier » (avec choix de la quantité) alimente le panier du client. |
| **Panier** (espace client, `client/index.html?page=panier`) | Connecté en client (`sarah.benali@example.com`) : ajouter une offre depuis sa fiche, changer la quantité, supprimer une ligne, vider le panier ; la pastille de l'en-tête suit le nombre d'articles. Saisir un code promo (`BIENVENUE10`, `AUTOMNE25`, `RIAD200`) : la remise et le total se mettent à jour, un code inconnu, désactivé ou expiré affiche l'erreur de l'API. Une quantité supérieure au stock est refusée. « Passer au paiement » reste désactivé (réservations non implémentées). |
| **Codes promo** (administration, `admin/index.html?page=promos`) | Liste, recherche, filtres statut / type ; création et modification (code mis en majuscules, pourcentage de 1 à 100 ou montant fixe, date d'expiration facultative) ; interrupteur actif / désactivé ; suppression. Un code désactivé est retiré du panier des clients à leur prochaine lecture. |
| **Stocks** (page *Inventaire*) | Niveau de stock de chaque offre (Disponible, Stock bas, Épuisé) et stock **modifiable directement dans le tableau** (boutons − / + ou saisie) ; la modification est enregistrée automatiquement, sans bouton de confirmation. |
| **Bundles** (`/api/bundles`) | Sélecteur d'offres (2 minimum), remise en %, récapitulatif en temps réel : somme des offres, prix final et **stock dynamique** (le plus bas des offres) ; modification et suppression. |

### Où lire le code

Architecture en couches `Controller → Service → Repository → Entity` (voir [`docs/architecture.md`](docs/architecture.md)) :

| Couche | Fichier |
|---|---|
| Controller | `backend/src/main/java/com/agence/voyage/controller/UserController.java` |
| Service (règles métier) | `backend/src/main/java/com/agence/voyage/service/UserService.java` |
| Repository | `backend/src/main/java/com/agence/voyage/repository/UserRepository.java` |
| Entity | `backend/src/main/java/com/agence/voyage/entity/User.java` |
| DTO | `backend/src/main/java/com/agence/voyage/dto/UserRequest.java`, `UserResponse.java` |
| Gestion des erreurs | `backend/src/main/java/com/agence/voyage/exception/GlobalExceptionHandler.java` |
| Interface | `frontend/admin/js/app.js` (fonction `usersPage` et modales utilisateur) |
| Appels HTTP | `frontend/js/core/api.js` |

### Tests
```bash
cd backend
./mvnw test
```
67 tests : `UserServiceTest` (email unique, hachage du mot de passe, mot de passe conservé à la modification, archivage / restauration, règle de suppression), `CityServiceTest`, `OfferServiceTest` (5 types, validations, propriété de l'offre), `OfferSearchTest` (recherche du catalogue : filtres, tris, pagination), `BundleServiceTest` (prix final, stock dynamique, validations, propriété du bundle), `AuthServiceTest` (connexion, inscription, jeton, compte archivé), `CartServiceTest` (fusion des lignes, stock, bundle, paiement à l'arrivée, code promo), `PromoCodeServiceTest` (unicité, bornes, expiration) et `SecurityRulesTest` (droits d'accès par route et par rôle).

**Tests de l'API avec Postman** : importer la collection [`docs/postman/AtlasVoyage.postman_collection.json`](docs/postman/AtlasVoyage.postman_collection.json) (mode d'emploi dans [`docs/postman/README.md`](docs/postman/README.md)). Le backend et MySQL doivent être démarrés ; la collection se connecte elle-même avec les comptes de test.

### Limites connues
- Le jeton JWT (24 h) n'est ni renouvelé ni révocable avant expiration (la déconnexion efface seulement la session du navigateur) ; « mot de passe oublié » n'est pas implémenté ; la clé `jwt.secret` de `application.properties` est une valeur de développement à remplacer hors de ce contexte.
- Les images des offres sont saisies par URL (pas d'envoi de fichier).
- Les réservations, les paiements et les notifications ne sont pas encore implémentés : le panier fonctionne, mais « Passer au paiement » est désactivé ; une offre ou un bundle ne peut donc pas encore être réservé.
- Le panier **public** (`panier.html`, `offre.html`) garde son propre panier de démonstration (`localStorage`), distinct du panier de l'espace client branché sur l'API.
- Seul le catalogue de l'**espace client** est branché sur l'API ; les pages publiques (`accueil.html`, `catalogue.html`, `offre.html`) restent en données statiques.

---

## 📁 Structure du projet

```text
travel-agency-app/
├── backend/                 # Spring Boot (controller, service, repository, entity, dto, exception, security, config)
├── frontend/                # Interface web (HTML / CSS / JS vanilla)
│   ├── connexion.html       # Écran unique de connexion / inscription client
│   ├── admin/               # Espace administrateur (Utilisateurs)
│   ├── supplier/            # Espace fournisseur (Offres)
│   ├── agent/               # Espace agent (Bundles)
│   ├── pages/admin/         # Redirections des anciennes pages Villes
│   ├── css/  js/            # Styles et scripts partagés (js/core/api.js : appels HTTP, js/core/auth.js : session)
│   └── *.html, client/      # Autres pages (maquettes)
├── docs/
│   ├── architecture.md      # Architecture logicielle
│   ├── api_endpoints.md     # Liste consolidée des endpoints REST
│   ├── postman/             # Collection Postman de test de l'API
│   └── cahier_de_charges.md # Spécifications du projet
└── README.md
```
