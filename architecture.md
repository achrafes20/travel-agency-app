# Architecture du Projet "Atlas Voyage"

Ce document décrit l'architecture technique, la stack et le modèle de données de l'application web de l'agence de voyage "Atlas Voyage".

## Diagramme Général de l'Architecture

`mermaid
flowchart TD
    subgraph Client [Frontend (Navigateur)]
        UI[Pages HTML / CSS / JS]
        JS[Logique Client - fetch API]
        UI <--> JS
    end

    subgraph Serveur [Backend (Spring Boot sur port 8080)]
        API[Contrôleurs REST]
        Service[Couche Métier / Services]
        Repo[Couche Accès Données / Repositories]
        API <--> Service
        Service <--> Repo
    end

    subgraph Base de Données
        DB[(MySQL - port 3306)]
    end

    JS <-->|Requêtes HTTP (GET, POST...)| API
    Repo <-->|JPA / Hibernate| DB
`

## 1. Stack Technologique

Le projet suit une architecture découplée (Frontend autonome communiquant avec une API REST Backend). Conformément au cahier des charges strict, aucun framework Frontend n'est utilisé.

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
  - *Spring Security* (Optionnel/À venir pour sécuriser l'espace agent).

**Base de données :**
- **SGBD** : MySQL.

---

## 2. Architecture Logicielle (Backend)

Le Backend Spring Boot est structuré en couches classiques (Layered Architecture) :
1. **Controller (`@RestController`)** : Expose les points de terminaison (Endpoints REST). Reçoit les requêtes HTTP (GET, POST, etc.) du Frontend.
2. **Service (`@Service`)** : Contient toute la logique métier (calcul des réductions, vérification des disponibilités).
3. **Repository (`@Repository`)** : Interfaces Spring Data JPA étendant `JpaRepository` pour les requêtes à la base de données.
4. **Entity (`@Entity`)** : Classes Java mappées sur les tables MySQL.

---

## 3. Modèle de Données (Entités Principales)

Voici les futures entités Java qui seront créées pour la base de données MySQL :

### A. `Offer` (Offre de voyage / Hébergement)
- `Long id` (PK)
- `String title` (ex: "Riad Authentique")
- `String city` (Chefchaouen, Marrakech, etc. - Réservé au Maroc)
- `String type` (Hôtel & Riads, Excursion, etc.)
- `Double price` (Prix en MAD)
- `Integer stars` (Nombre d'étoiles)
- `String imagePath` (Chemin vers l'image)
- `Integer availableSpots` (Places ou chambres disponibles)

### B. `User` (Client ou Agent)
- `Long id` (PK)
- `String fullName`
- `String email` (Unique)
- `String password`
- `String role` (CLIENT, AGENT_ADMIN)

### C. `Booking` (Réservation)
- `Long id` (PK)
- `User client` (FK -> User)
- `Offer offer` (FK -> Offer)
- `LocalDate checkInDate`
- `LocalDate checkOutDate`
- `Integer travelersCount`
- `Double totalPrice`
- `String status` (PENDING, CONFIRMED, CANCELLED)
- `String paymentMethod` (ARRIVAL)

---

## 4. Communication Frontend <-> Backend

Le fichier `app.js` du Frontend utilisera l'API `fetch()` pour interagir avec Spring Boot sur le port `8080`.

**Exemples d'Endpoints prévus :**
- `GET /api/offers` : Récupérer toutes les offres pour alimenter le catalogue.
- `GET /api/offers/search?city=Marrakech` : Filtrer les offres.
- `POST /api/bookings` : Soumettre le panier et créer une réservation.
- `GET /api/admin/bookings` : Récupérer les réservations pour l'Espace Agent.


