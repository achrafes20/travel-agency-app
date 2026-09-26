# 🌴 Atlas Voyage

**Atlas Voyage** est une application web complète de réservation pour une agence de voyage marocaine premium. Elle permet aux utilisateurs de parcourir des destinations marocaines authentiques, de réserver des séjours ou excursions, et offre aux agents un tableau de bord pour gérer l'activité de l'agence.

Ce projet s'inscrit dans le cadre du module **Frameworks Technologie Web (ENSA - 3ème année)**.

---

## ✨ Fonctionnalités Principales

- **Côté Client (Frontend) :**
  - Catalogue interactif avec filtres (Destinations, Prix, Étoiles).
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
Le backend est configuré pour créer automatiquement la base de données si elle n'existe pas, et pour créer toutes les tables au premier démarrage (script `backend/src/main/resources/schema.sql`, exécuté automatiquement). Assurez-vous que les accès root (sans mot de passe par défaut) correspondent à votre installation MySQL/XAMPP locale.
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
- Faites un clic droit sur `index.html` et sélectionnez **"Open with Live Server"**.
- *(Alternative)* : Ouvrez simplement le fichier `index.html` directement dans votre navigateur web.

---

## 📁 Structure du Projet

```text
travel-agency-app/
│
├── backend/                   # Projet Java Spring Boot
│   ├── src/main/java/         # Code source Java (Controllers, Services, Models)
│   ├── src/main/resources/    # Configuration (application.properties)
│   └── pom.xml                # Dépendances Maven
│
├── frontend/                  # Interface Web
│   ├── css/                   # Feuilles de style (style.css)
│   ├── js/                    # Logique client (app.js)
│   ├── images/                # Assets visuels, zellige, favicons
│   └── *.html                 # Pages web (index, catalogue, panier, agent...)
│
├── architecture.md            # Documentation de l'architecture logicielle
├── cahier_de_charges.md       # Spécifications du projet
└── README.md                  # Ce fichier
```
# travel-agency-app