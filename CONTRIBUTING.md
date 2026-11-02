# Guide de Contribution — Atlas Voyage

Merci de votre intérêt pour **Atlas Voyage** ! Ce guide rassemble l'ensemble des règles, conventions et bonnes pratiques permettant de contribuer efficacement et sereinement au projet.

---

## 1. Code de Conduite

Tous les contributeurs, mainteneurs et participants s'engagent à respecter notre [Code de Conduite](CODE_OF_CONDUCT.md). Tout comportement inapproprié ou irrespectueux peut entraîner une exclusion des dépôts et canaux officiels.

---

## 2. Environnement de Développement Local

### Prérequis
- **JDK 21 LTS** ou supérieur (`java -version`)
- **MySQL 8.0+** ou **MariaDB 10.6+** écoutant sur le port `3306` avec base `travel_agency_db`
- **Node.js LTS (v18+ / v20+)** (`node -v`)
- **Git**

### Installation en moins de 10 minutes
1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-organisation/travel-agency-app.git
   cd travel-agency-app
   ```
2. Initialiser la base de données :
   ```sql
   CREATE DATABASE IF NOT EXISTS travel_agency_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Démarrer le Backend (Spring Boot en profil dev) :
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
4. Démarrer le serveur Frontend statique :
   ```bash
   node scripts/serve_frontend.mjs
   ```

---

## 3. Stratégie de Branches Git

Le projet utilise un modèle GitFlow simplifié :
- `main` : Branche principale protégée, toujours déployable en production.
- `develop` : Branche d'intégration des fonctionnalités validées.
- Branches de travail créées depuis `develop` (ou `main` pour les hotfixes) :
  - `feature/nom-de-la-fonctionnalite`
  - `fix/description-du-bug`
  - `docs/sujet-de-la-documentation`
  - `refactor/description-du-refactoring`

---

## 4. Conventions de Commits (Conventional Commits)

Les messages de validation doivent respecter le standard [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) :

```
<type>(<portée optionnelle>): <description courte à l'impératif>

[corps de texte explicatif facultatif]

[référence au ticket ex: Closes #42]
```

### Types autorisés :
- `feat` : Nouvelle fonctionnalité utilisateur.
- `fix` : Correction de bogue.
- `docs` : Modification ou enrichissement de la documentation.
- `style` : Formatage, ponctuation, CSS sans impact logique.
- `refactor` : Refactorisation sans modification du comportement métier.
- `perf` : Optimisation de performance.
- `test` : Ajout ou correction de tests unitaires/intégration.
- `chore` : Tâches d'infrastructure, dépendances ou configuration interne.

*Exemples :*
- `feat(booking): implement 48h cancellation penalty rule`
- `fix(auth): prevent timing attack on user login lockout`
- `docs(api): update openapi.yaml with review endpoints`

---

## 5. Normes & Bonnes Pratiques de Code

### Backend (Java 21 / Spring Boot 3.3.4)
- **Architecture en couches :** Controller → Service → Repository.
- **DTOs stricts :** Ne **jamais** renvoyer d'entité JPA directement dans les réponses d'API. Utiliser des DTOs (`*Request`, `*Response`).
- **Validation Jakarta :** Valider les entrées via `@Valid`, `@NotNull`, `@NotBlank`, etc.
- **Gestion des exceptions :** Les exceptions doivent être déclarées dans `com.agence.voyage.exception` et associées à un code d'erreur de `ErrorCode.java`.
- **Zéro régression de tests :** Les 396 tests JUnit existants doivent impérativement rester au vert :
  ```bash
  cd backend
  ./mvnw clean test
  ```

### Frontend (Vanilla JavaScript ES2022)
- **Zéro Framework :** Pas de React, Vue ou Angular. JavaScript natif modulaire.
- **Accessibilité WCAG 2.1 AA :** Respecter les contrastes (ratio >= 4.5:1), navigation clavier complète, attributs WAI-ARIA explicites.
- **Styles modulaires :** Utiliser les couches CSS `@layer` et les tokens déclarés dans `frontend/css/design-system/tokens.css` (`--av-*`). Ne jamais injecter de style en dur sans token.

---

## 6. Processus de Pull Request (PR)

1. Mettre à jour votre branche par rapport à `develop` (`git rebase origin/develop`).
2. S'assurer que tous les tests passent (`./mvnw test` et `npm run docs:check`).
3. Créer la Pull Request en remplissant méticuleusement le modèle [`.github/pull_request_template.md`](.github/pull_request_template.md).
4. Au moins **une revue par un mainteneur référent** (voir [`.github/CODEOWNERS`](.github/CODEOWNERS)) est requise pour la fusion.
