# B4 — Séance 2 · Livrable complet

**Projet :** Atlas Voyage (`travel-agency-app`)  
**Objectif :** Mettre en place l’architecture interne du Backend (Spring, IoC, injection de dépendances) et préparer le Frontend de la **première fonctionnalité métier**, avec séparation claire **présentation / traitement métier**.

---

## 1. Compétences couvertes

| Compétence | Où c’est démontré dans le projet |
|---|---|
| Architecture en couches | Packages `controller` → `service` → `repository` → `entity` |
| IoC & conteneur Spring | `@SpringBootApplication`, component scan, beans `@Service` / `@RestController` |
| Injection de dépendances | Constructeurs `final` (ex. `CityController(CityService cityService)`) |
| Beans Spring | `CityService`, `CityController`, `DataSeeder`, repositories Spring Data |
| Séparation des responsabilités (Backend) | Controller sans logique métier ; règles dans `CityService` |
| Séparation des responsabilités (Frontend) | Pages HTML + `*.page.js` (UI) vs `city.service.js` + `api.js` (HTTP) vs Backend (métier) |

---

## 2. Structure Backend (complète)

Racine : `backend/src/main/java/com/agence/voyage/`

```text
com.agence.voyage/
├── TravelAgencyApplication.java    # Point d’entrée Spring Boot
├── config/                         # CORS, seed (CommandLineRunner)
├── controller/                     # REST — délégation aux services
│   ├── CityController.java         # ★ Séance 2 — CRUD villes
│   ├── UserController.java
│   └── StatusController.java
├── service/                        # Logique métier
│   ├── CityService.java            # ★ Séance 2
│   └── UserService.java
├── repository/                     # Spring Data JPA (interfaces)
│   ├── CityRepository.java         # ★ Séance 2
│   └── … (un repository par entité)
├── entity/                         # Modèle JPA (§6 cahier des charges)
│   ├── City.java                   # ★ Séance 2
│   └── …
├── dto/                            # Transfert API (sans logique)
│   ├── CityRequest.java
│   └── CityResponse.java
└── exception/                      # Erreurs HTTP centralisées
    ├── GlobalExceptionHandler.java
    ├── BusinessException.java
    └── ResourceNotFoundException.java
```

**Règle de dépendance :** `Controller → Service → Repository → Entity`. Le controller **n’appelle jamais** le repository directement.

---

## 3. Schéma Controller → Service → Repository

```mermaid
flowchart LR
    subgraph HTTP
        C[CityController<br/>@RestController]
    end
    subgraph Metier
        S[CityService<br/>@Service]
    end
    subgraph Persistance
        R[CityRepository<br/>JpaRepository]
        E[(City @Entity)]
    end
    C -->|injection constructeur| S
    S -->|injection constructeur| R
    R --> E
```

**Exemple IoC (extrait) :**

```java
@Service
public class CityService {
    private final CityRepository cityRepository;
    public CityService(CityRepository cityRepository) {
        this.cityRepository = cityRepository; // bean injecté par Spring
    }
}
```

---

## 4. Première fonctionnalité métier : **Villes**

### API REST

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/cities` | Liste |
| GET | `/api/cities/{id}` | Détail |
| POST | `/api/cities` | Création (body `CityRequest`, `@Valid`) |
| PUT | `/api/cities/{id}` | Modification |
| DELETE | `/api/cities/{id}` | Suppression (204) |

### Règles métier (`CityService` uniquement)

- Nom obligatoire (trim) ; validation Jakarta sur `CityRequest`.
- **Unicité du nom** (insensible à la casse).
- Ville absente → `404` ; conflit de nom → `400` (`GlobalExceptionHandler`).

### Test unitaire

- `backend/src/test/java/.../CityServiceTest.java` — rejet d’un doublon `Marrakech` / `marrakech`.
- Profil test : `application-test.properties` (H2, `ddl-auto=create-drop`).

---

## 5. Frontend — pages Séance 2 (présentation séparée)

| Page | Fichier | Rôle |
|---|---|---|
| **Liste** | `frontend/pages/admin/villes.html` | Tableau, suppression, liens détail / formulaire |
| **Formulaire** | `frontend/pages/admin/ville-form.html` | Création (`POST`) et modification (`PUT`) |
| **Détail** | `frontend/pages/admin/ville-detail.html` | Consultation (`GET /api/cities/{id}`) |

### Couches Frontend (module Villes)

```text
pages/admin/*.html           → structure + chargement scripts
js/core/config.js            → URL API (IoC côté config)
js/core/api.js               → fetch générique (pas de règles métier)
js/services/city.service.js  → endpoints du domaine « Ville »
js/pages/villes-*.page.js    → DOM, navigation, toasts
js/components/admin-layout.js→ layout admin partagé
css/pages/villes.css         → styles du module
```

**Complément UI :** `frontend/admin/index.html?page=cities` — même API, maquette admin intégrée (liste + suppression ; ajout/modif via les pages ci-dessus).

---

## 6. Scénario de démonstration (bout en bout)

1. **Backend** : `cd backend` puis `./mvnw spring-boot:run` (MySQL/XAMPP actif).
2. **Vérifier l’API** : `GET http://localhost:8080/api/status` et `GET http://localhost:8080/api/cities`.
3. **Frontend** : Live Server, racine `frontend/`.
4. **Liste** : ouvrir `pages/admin/villes.html` — villes seed (Chefchaouen, Marrakech, …).
5. **Création** : « Ajouter une ville » → formulaire → succès → page détail.
6. **Unicité** : recréer « Marrakech » → message d’erreur API (400).
7. **Modification / suppression** : depuis détail ou liste.
8. **Test Maven** : `./mvnw test` — `CityServiceTest` vert.

---

## 7. Checklist livrable B4 Séance 2

| Critère | Statut |
|---|---|
| Packages Backend `controller`, `service`, `repository`, `entity` | ✅ |
| Beans Spring + injection par constructeur | ✅ |
| Première fonctionnalité métier Backend (Villes) | ✅ |
| DTO + validation + gestion d’erreurs | ✅ |
| Pages Frontend liste / formulaire / détail | ✅ |
| Séparation présentation / métier (Front + Back) | ✅ |
| Schéma Controller → Service → Repository documenté | ✅ (`architecture.md` + ce document) |
| Test métier représentatif | ✅ `CityServiceTest` |

---

## 8. Références projet

- Architecture détaillée : [`architecture.md`](../architecture.md) (§2, §2 bis, diagrammes Mermaid).
- Suivi projet : [`cahier_de_charges.md`](../cahier_de_charges.md) (§ Séance 2).
- Guide Frontend : [`frontend/README.md`](../frontend/README.md).
