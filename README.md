# 🌴 Atlas Voyage

**Atlas Voyage** est une application web de réservation pour une agence de voyage marocaine (Frontend HTML/CSS/JS + Backend Spring Boot + MySQL).

Ce projet s'inscrit dans le cadre du module **Frameworks Technologie Web (ENSA - 3ème année)**.

> ### ⚠️ Périmètre à évaluer
> **Seule la gestion des utilisateurs (CRUD complet, de l'interface à la base de données) est finalisée.**
> Le reste de l'interface (tableau de bord, autres onglets, autres espaces) est composé de maquettes avec des données de démonstration, non reliées au backend.
>
> 👉 **Page à tester : [`frontend/admin/index.html?page=users`](frontend/admin/index.html)**

---

## 🛠️ Stack Technologique

1. **Frontend** — HTML5, CSS3, JavaScript vanilla. *Aucun framework.*
2. **Backend** — Java 21, Spring Boot 3 (Web, Data JPA, Validation), BCrypt pour le hachage des mots de passe, Maven.
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
La base `travel_agency_db` est créée automatiquement au premier démarrage, ainsi que 4 utilisateurs d'exemple (un par rôle). Le backend est prêt quand la console affiche `Backend Spring Boot demarre avec succes !`.

### 2. Frontend
Servez le dossier **`frontend/`** (il doit être la racine du serveur) :
- **Live Server :** ouvrez le dossier `frontend` dans VS Code, clic droit sur `accueil.html` → *Open with Live Server*.
- **Ou en ligne de commande :**
  ```bash
  cd frontend
  python -m http.server 5500
  ```

Puis ouvrez **`http://localhost:5500/admin/index.html?page=users`** (adaptez le port si votre serveur en utilise un autre).

---

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
`UserServiceTest` couvre l'unicité de l'email, le hachage du mot de passe, la conservation du mot de passe lors d'une modification, l'archivage / restauration et la règle de suppression.

### Limites connues
- Il n'y a **pas encore d'authentification** : l'écran de connexion est une maquette et les endpoints sont ouverts (Spring Security est prévu, voir [`docs/cahier_de_charges.md`](docs/cahier_de_charges.md)).

---

## 📁 Structure du projet

```text
travel-agency-app/
├── backend/                 # Spring Boot (controller, service, repository, entity, dto, exception, config)
├── frontend/                # Interface web (HTML / CSS / JS vanilla)
│   ├── admin/               # Espace administrateur (page Utilisateurs)
│   ├── css/  js/            # Styles et scripts partagés (js/core/api.js : appels HTTP)
│   └── *.html               # Autres pages (maquettes)
├── docs/
│   ├── architecture.md      # Architecture logicielle
│   └── cahier_de_charges.md # Spécifications du projet
└── README.md
```
