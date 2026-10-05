# 🌴 Atlas Voyage

**Atlas Voyage** est une application web complète de réservation pour une agence de voyage marocaine premium. Elle permet aux utilisateurs de parcourir des destinations marocaines authentiques, de réserver des séjours ou excursions, et offre aux agents un tableau de bord pour gérer l'activité de l'agence.

Ce projet s'inscrit dans le cadre du module **Frameworks Technologie Web (ENSA - 3ème année)**.

---

## ✨ Fonctionnalités Principales

- **Côté Client (Frontend) :**
  - Catalogue interactif avec filtres (Villes, Prix, Étoiles).
  - Détail des offres avec preuves sociales et informations de localisation.
  - Panier de réservation et formulaire de validation.
  - Interface responsive et identité visuelle "Maroc" soignée (Zellige, couleurs adaptées).
- **Côté Serveur (Backend) :**
  - API REST pour la gestion des offres de voyage, des réservations et des utilisateurs.
  - Espace "Agent" (Dashboard) pour valider ou annuler des réservations.
  - Envoi d'emails transactionnels (confirmation de réservation).

---

## 🛠️ Stack Technologique

Pour respecter strictement le cahier des charges, le projet est divisé en deux parties indépendantes :

1. **Frontend (Côté Client)**
   - HTML5, CSS3, JavaScript (Vanilla)
   - *Aucun framework (pas de React, pas de Tailwind, pas de Bootstrap)*

2. **Backend (Côté Serveur)**
   - Java 21
   - Spring Boot 3.x (Web, Data JPA, Mail, Security)
   - SGBD : MySQL
   - Gestionnaire de dépendances : Maven

---

## 🚀 Installation et Lancement

### Prérequis
- [Java Development Kit (JDK) 21](https://jdk.java.net/21/)
- Un serveur MySQL/MariaDB en cours d'exécution sur le port 3306 (par ex. via [XAMPP](https://www.apachefriends.org/)).
- Aucune installation Maven séparée n'est nécessaire : le projet embarque son propre wrapper (`mvnw` / `mvnw.cmd`).
- Une extension comme *Live Server* (VS Code) pour le frontend, ou simplement un navigateur.

### 1. Configuration de la Base de Données
Le backend est configuré pour créer automatiquement la base de données si elle n'existe pas, et pour créer/mettre à jour toutes les tables au démarrage via Hibernate (`spring.jpa.hibernate.ddl-auto=update`), à partir des entités JPA. Assurez-vous que les accès root (sans mot de passe par défaut) correspondent à votre installation MySQL/XAMPP locale.
Modifiez si besoin le fichier : `backend/src/main/resources/application.properties`.

### 2. Lancement du Backend (API)

**Option A — avec IntelliJ IDEA (recommandé) :**
1. `File > Open...` et sélectionnez le dossier `backend` (IntelliJ détecte le `pom.xml` et importe le projet Maven automatiquement).
2. Attendez la fin de l'indexation / du téléchargement des dépendances.
3. Ouvrez `src/main/java/com/agence/voyage/TravelAgencyApplication.java` et cliquez sur le bouton ▶ (Run) à côté de la méthode `main`.

**Option B — en ligne de commande :**
```bash
cd backend
./mvnw spring-boot:run
```
*(Sous Windows en PowerShell/CMD : `mvnw.cmd spring-boot:run`)*

Dans les deux cas, l'API démarre sur `http://localhost:8080`.

### 3. Lancement du Frontend (Interface Client)
Le frontend est entièrement statique. Pour l'ouvrir :
- Ouvrez le dossier `frontend` dans Visual Studio Code.
- Faites un clic droit sur `accueil.html` et sélectionnez **"Open with Live Server"**.
- *(Alternative)* : Ouvrez simplement le fichier `accueil.html` directement dans votre navigateur web.
- Vérification API : `GET http://localhost:8080/api/status` (navigateur ou curl).

**Espace administrateur (maquettes intégrées) :** `frontend/admin/index.html` — **Utilisateurs** et **Villes** branchés sur l’API.

**Espace fournisseur (maquettes intégrées) :** `frontend/supplier/index.html` — UI complète (offres, inventaire, réservations, wizard création) ; liste des **villes** dans « Nouvelle offre » via `/api/cities` ; reste en données démo jusqu’à l’API offres.

**Espace agent (maquettes intégrées) :** `frontend/agent/index.html` — tableau de bord, réservations, bundles, paiements à l’arrivée, tickets, notifications, profil (données démo ; compte seed **Nadia El Fassi** / `password123`).

**Espace client (maquettes intégrées) :** `frontend/client/index.html` — dashboard, catalogue maquette, panier, paiement, réservations, tickets, profil (`?page=…`). L’**accueil** reste `frontend/accueil.html` (logo client → accueil actuel).

---

## B4 — Séance 2 (livrable complet)

Première fonctionnalité métier : **gestion des villes** (architecture en couches, IoC Spring, pages admin liste / formulaire / détail).

| Document | Contenu |
|---|---|
| [`docs/B4-seance2-livrable.md`](docs/B4-seance2-livrable.md) | Checklist, compétences, arborescence Backend, scénario de démo |
| [`architecture.md`](architecture.md) | Diagrammes Mermaid (flux HTTP + séquence CRUD ville) |
| [`frontend/pages/admin/villes.html`](frontend/pages/admin/villes.html) | Point d’entrée Frontend Séance 2 |

**Tests :** `cd backend && ./mvnw test` (dont `CityServiceTest`).

---

## 📁 Structure du Projet

```text
travel-agency-app/
│
├── backend/                   # Projet Java Spring Boot
│   ├── src/main/java/         # Code source Java (controller, service, repository, entity, config)
│   ├── src/main/resources/    # Configuration (application.properties)
│   └── pom.xml                # Dépendances Maven
│
├── frontend/                  # Interface Web
│   ├── css/                   # Feuilles de style (style.css, pages/villes.css)
│   ├── js/                    # app.js (catalogue) + core/services/pages (Séance 2)
│   ├── pages/admin/           # Module Villes (liste, formulaire, détail)
│   ├── images/                # Assets visuels, zellige, favicons
│   └── *.html                 # Pages publiques (accueil, catalogue, panier, agent...)
│
├── architecture.md            # Documentation de l'architecture logicielle
├── cahier_de_charges.md       # Spécifications du projet
└── README.md                  # Ce fichier
```
# travel-agency-app