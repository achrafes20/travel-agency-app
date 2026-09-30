# Architecture du Projet "Atlas Voyage"

Ce document décrit l'architecture technique, la stack et le modèle de données de l'application web de l'agence de voyage "Atlas Voyage".

## Diagramme Général de l'Architecture

```mermaid
flowchart TD
    subgraph Client [Frontend (Navigateur)]
        UI[Pages HTML / CSS]
        JS[Logique Client - fetch API]
        UI <--> JS
    end

    subgraph Serveur [Backend (Spring Boot sur port 8080)]
        API[Controllers REST]
        Service[Services - logique métier]
        Repo[Repositories - accès aux données]
        Entity[Entities JPA]
        API --> Service
        Service --> Repo
        Repo -.->|manipule| Entity
    end

    subgraph Base de Données
        DB[(MySQL - port 3306)]
    end

    JS <-->|Requêtes HTTP JSON| API
    Repo <-->|JPA / Hibernate| DB
```

## 1. Stack Technologique

Le projet suit une architecture découplée (Frontend autonome communiquant avec une API REST Backend). Conformément au cahier des charges, aucun framework Frontend n'est utilisé.

**Frontend (Côté Client) :**
- **HTML5 & CSS3** : Sémantique, Responsive Design (Mobile First).
- **JavaScript (Vanilla)** : Manipulation du DOM, gestion du carrousel, filtres et requêtes API via `fetch()`.

**Backend (Côté Serveur) :**
- **Langage** : Java 21.
- **Framework** : Spring Boot 3.x.
- **Dépendances principales** :
  - *Spring Web* (Création des API REST).
  - *Spring Data JPA* (ORM pour interagir avec la base de données).
  - *Spring Boot Starter Mail* (Pour l'envoi d'emails de confirmation).
  - *Spring Security* (À venir pour sécuriser l'espace agent — pas encore ajouté au `pom.xml`).

**Base de données :**
- **SGBD** : MySQL (XAMPP en local). Les tables sont générées par Hibernate (`spring.jpa.hibernate.ddl-auto=update`).

---

## 2. Architecture Logicielle (Backend)

Le Backend Spring Boot est structuré en couches (Layered Architecture), sous le package racine `com.agence.voyage` :

| Package | Rôle | Annotation Spring |
|---|---|---|
| `controller` | Expose les endpoints REST, reçoit les requêtes HTTP, délègue au service. Aucune logique métier. | `@RestController` |
| `service` | Contient la logique métier (validation, règles, calculs). Seule couche qui appelle les repositories. | `@Service` |
| `repository` | Interfaces Spring Data JPA (`JpaRepository`) pour l'accès à la base. | (détecté automatiquement) |
| `entity` | Classes Java mappées sur les tables MySQL (et énumérations associées). | `@Entity` |
| `config` | Configuration transverse (CORS, données de démarrage). | `@Configuration`, `@Component` |

### Flux d'une requête : Controller → Service → Repository

```mermaid
sequenceDiagram
    participant F as Frontend (fetch)
    participant C as Controller
    participant S as Service
    participant R as Repository
    participant DB as MySQL

    F->>C: GET /api/users
    C->>S: getAllUsers()
    S->>R: findAll()
    R->>DB: SELECT * FROM users
    DB-->>R: lignes
    R-->>S: List<User>
    S-->>C: List<User>
    C-->>F: JSON
```

Règle de dépendance : `Controller → Service → Repository → Entity`. Une couche ne connaît que celle située juste en dessous ; le Controller n'accède jamais directement au Repository.

### IoC et injection de dépendances

- Les classes annotées `@RestController`, `@Service`, `@Component` sont détectées au démarrage par le *component scan* de `@SpringBootApplication` et instanciées comme **beans** par le **conteneur Spring** (IoC : ce n'est plus le code qui fait `new`, c'est le conteneur).
- Les repositories sont des interfaces : Spring Data génère leur implémentation et l'enregistre comme bean.
- Les dépendances sont injectées **par constructeur** (champs `final`), par exemple :

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {   // injecté par Spring
        this.userService = userService;
    }
}
```

### État actuel de l'implémentation

| Composant | Classes |
|---|---|
| Controllers | `UserController` (`GET /api/users`), `StatusController` (`GET /api/status`) |
| Services | `UserService` |
| Repositories | un par entité (`User`, `Offer`, `Bundle`, `Cart`, `CartItem`, `PromoCode`, `Booking`, `Payment`, `Notification`, `Destination`, `City`) |
| Config | `CorsConfig`, `DataSeeder` (4 comptes de test) |

---

## 3. Modèle de Données (package `entity`)

Toutes les entités sont créées ; voir le cahier des charges (§6) pour le détail des champs.

- **`User`** : `id`, `fullName`, `email` (unique), `password`, `role`. Rôles (`Role`) : `CLIENT`, `SUPPLIER`, `AGENT`, `ADMIN`.
- **`Offer`** (classe abstraite, héritage `SINGLE_TABLE`, discriminant `offer_type`) : `title`, `description`, `basePrice`, `stock`, `allowsPayOnArrival`, `images`, `city`, `supplier`. Sous-classes : `Flight`, `Hotel`, `Car`, `TaxiTransfer`, `Excursion`.
- **`Destination`** / **`City`** : une destination (pays) contient plusieurs villes ; une offre est rattachée à une ville.
- **`Bundle`** : offre composée de plusieurs offres, créée par un agent.
- **`Cart`** / **`CartItem`** : panier du client et ses lignes.
- **`PromoCode`** : code de réduction (`DiscountType`).
- **`Booking`** : réservation (`BookingStatus`).
- **`Payment`** : paiement (`PaymentMethod`, `PaymentStatus`).
- **`Notification`** : notifications in-app.

---

## 4. Communication Frontend <-> Backend

Le Frontend appelle l'API REST Spring Boot (port `8080`) avec `fetch()` ; le CORS est autorisé par `CorsConfig`. Le Frontend ne contient que la présentation et l'appel à l'API ; toute la logique métier reste dans les services du Backend.

**Endpoints existants :**
- `GET /api/status` : vérifie la connexion Frontend/Backend.
- `GET /api/users` : liste des utilisateurs (espace agent).

**Endpoints prévus :**
- `GET /api/offers` : offres du catalogue ; `GET /api/offers/search?city=Marrakech` : filtrage.
- `POST /api/bookings` : créer une réservation à partir du panier.
- `GET /api/admin/bookings` : réservations pour l'espace agent.
