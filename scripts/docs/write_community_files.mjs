import fs from 'node:fs';
import path from 'node:path';

// 1. CONTRIBUTING.md
const contributing = `# Guide de Contribution — Atlas Voyage

Merci de votre intérêt pour **Atlas Voyage** ! Ce guide rassemble l'ensemble des règles, conventions et bonnes pratiques permettant de contribuer efficacement et sereinement au projet.

---

## 1. Code de Conduite

Tous les contributeurs, mainteneurs et participants s'engagent à respecter notre [Code de Conduite](CODE_OF_CONDUCT.md). Tout comportement inapproprié ou irrespectueux peut entraîner une exclusion des dépôts et canaux officiels.

---

## 2. Environnement de Développement Local

### Prérequis
- **JDK 21 LTS** ou supérieur (\`java -version\`)
- **MySQL 8.0+** ou **MariaDB 10.6+** écoutant sur le port \`3306\` avec base \`travel_agency_db\`
- **Node.js LTS (v18+ / v20+)** (\`node -v\`)
- **Git**

### Installation en moins de 10 minutes
1. Cloner le dépôt :
   \`\`\`bash
   git clone https://github.com/votre-organisation/travel-agency-app.git
   cd travel-agency-app
   \`\`\`
2. Initialiser la base de données :
   \`\`\`sql
   CREATE DATABASE IF NOT EXISTS travel_agency_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   \`\`\`
3. Démarrer le Backend (Spring Boot en profil dev) :
   \`\`\`bash
   cd backend
   ./mvnw spring-boot:run
   \`\`\`
4. Démarrer le serveur Frontend statique :
   \`\`\`bash
   node scripts/serve_frontend.mjs
   \`\`\`

---

## 3. Stratégie de Branches Git

Le projet utilise un modèle GitFlow simplifié :
- \`main\` : Branche principale protégée, toujours déployable en production.
- \`develop\` : Branche d'intégration des fonctionnalités validées.
- Branches de travail créées depuis \`develop\` (ou \`main\` pour les hotfixes) :
  - \`feature/nom-de-la-fonctionnalite\`
  - \`fix/description-du-bug\`
  - \`docs/sujet-de-la-documentation\`
  - \`refactor/description-du-refactoring\`

---

## 4. Conventions de Commits (Conventional Commits)

Les messages de validation doivent respecter le standard [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) :

\`\`\`
<type>(<portée optionnelle>): <description courte à l'impératif>

[corps de texte explicatif facultatif]

[référence au ticket ex: Closes #42]
\`\`\`

### Types autorisés :
- \`feat\` : Nouvelle fonctionnalité utilisateur.
- \`fix\` : Correction de bogue.
- \`docs\` : Modification ou enrichissement de la documentation.
- \`style\` : Formatage, ponctuation, CSS sans impact logique.
- \`refactor\` : Refactorisation sans modification du comportement métier.
- \`perf\` : Optimisation de performance.
- \`test\` : Ajout ou correction de tests unitaires/intégration.
- \`chore\` : Tâches d'infrastructure, dépendances ou configuration interne.

*Exemples :*
- \`feat(booking): implement 48h cancellation penalty rule\`
- \`fix(auth): prevent timing attack on user login lockout\`
- \`docs(api): update openapi.yaml with review endpoints\`

---

## 5. Normes & Bonnes Pratiques de Code

### Backend (Java 21 / Spring Boot 3.3.4)
- **Architecture en couches :** Controller → Service → Repository.
- **DTOs stricts :** Ne **jamais** renvoyer d'entité JPA directement dans les réponses d'API. Utiliser des DTOs (\`*Request\`, \`*Response\`).
- **Validation Jakarta :** Valider les entrées via \`@Valid\`, \`@NotNull\`, \`@NotBlank\`, etc.
- **Gestion des exceptions :** Les exceptions doivent être déclarées dans \`com.agence.voyage.exception\` et associées à un code d'erreur de \`ErrorCode.java\`.
- **Zéro régression de tests :** Les 397 tests JUnit existants doivent impérativement rester au vert :
  \`\`\`bash
  cd backend
  ./mvnw clean test
  \`\`\`

### Frontend (Vanilla JavaScript ES2022)
- **Zéro Framework :** Pas de React, Vue ou Angular. JavaScript natif modulaire.
- **Accessibilité WCAG 2.1 AA :** Respecter les contrastes (ratio >= 4.5:1), navigation clavier complète, attributs WAI-ARIA explicites.
- **Styles modulaires :** Utiliser les couches CSS \`@layer\` et les tokens déclarés dans \`frontend/css/design-system/tokens.css\` (\`--av-*\`). Ne jamais injecter de style en dur sans token.

---

## 6. Processus de Pull Request (PR)

1. Mettre à jour votre branche par rapport à \`develop\` (\`git rebase origin/develop\`).
2. S'assurer que tous les tests passent (\`./mvnw test\` et \`npm run docs:check\`).
3. Créer la Pull Request en remplissant méticuleusement le modèle [\`.github/pull_request_template.md\`](.github/pull_request_template.md).
4. Au moins **une revue par un mainteneur référent** (voir [\`.github/CODEOWNERS\`](.github/CODEOWNERS)) est requise pour la fusion.
`;

// 2. CHANGELOG.md
const changelog = `# Changelog — Atlas Voyage

Toutes les modifications notables apportées au projet Atlas Voyage sont documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/), et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.15.0] - 2026-11-01 (Phase 15 : Documentation & Docs-as-Code)

### Ajouté
- **Portail central de documentation :** Création de \`docs/README.md\` avec plan d'accès par persona et conventions rédactionnelles (\`conventions_documentation.md\`).
- **Contrat OpenAPI 3.0.3 complet :** Fichier \`docs/api/openapi.yaml\` couvrant les **126 endpoints REST** réels extraits du code, avec schémas de données et guide d'intégration HTTP (\`docs/api/guide_api.md\`).
- **Catalogue des codes d'erreur :** Inventaire exhaustif des 58 codes applicatifs stables (\`docs/api/codes_erreur.md\`).
- **Collection Postman v2.1 synchronisée :** 18 dossiers, 181 requêtes avec assertions automatiques (\`docs/postman/AtlasVoyage.postman_collection.json\`) et environnements dev/prod sécurisés.
- **Architecture logicielle & ADRs :** Document d'architecture C4, diagramme Entité-Relation Mermaid de 40 entités JPA, dictionnaire de données complet, 4 diagrammes de flux et 10 décisions d'architecture MADR (\`docs/adr/\`).
- **Manuels d'exploitation :** Suite opérationnelle dans \`docs/exploitation/\` (configuration, déploiement systemd/nginx, sauvegardes, supervision Actuator, runbooks d'incidents et calendrier de maintenance).
- **Manuels utilisateurs par rôle :** 6 guides illustrés dans \`docs/manuel/\` avec captures d'écran automatisées pour Invité, Client, Fournisseur, Agent et Administrateur.
- **Gouvernance & Fichiers communautaires :** \`CONTRIBUTING.md\`, \`CHANGELOG.md\`, \`SECURITY.md\`, \`CODE_OF_CONDUCT.md\` et templates GitHub.
- **Outillage d'assurance qualité Docs-as-Code :** Scripts d'extraction et de validation automatique des liens, Mermaid et endpoints (\`npm run docs:check\`).

---

## [1.14.0] - 2026-10-31 (Phase 14 : Internationalisation & Devises)

### Ajouté
- Prise en charge trilingue complète : Français (\`fr\`, référence), Anglais (\`en\`), Arabe (\`ar\` avec RTL complet).
- Moteur i18n Vanilla JS sans compilation avec support des 6 formes grammaticales de pluriels arabes via \`Intl.PluralRules\`.
- 19 namespaces JSON traduits à 100% (\`frontend/locales/\`).
- Module de devises indicatives (EUR, USD, GBP) avec règle d'or financière MAD stricte (débits 100% en Dirhams).
- Entités JPA \`OfferTranslation\` et \`CityTranslation\` pour le contenu multilingue dynamique.

---

## [1.12.0] - 2026-10-30 (Phase 12 : Design System, UX, A11y & Composants)

### Ajouté
- Design system complet avec architecture CSS \`@layer\` et tokens \`--av-*\`.
- Palette de couleurs marocaines (Bleu Majorelle, Ambre, Terre Cuite).
- Conformité d'accessibilité certifiée **100% WCAG 2.1 AA** (0 violation sur 14 pages auditées par axe-core).
- Tunnel de réservation interactif en 4 étapes (\`av-stepper\`).
- Visionneuse plein écran accessible (\`lightbox.js\`) et carte Leaflet 1.9.4 auto-hébergée.
- Module complet d'avis et notations clients vérifiés après séjour (\`Review\`) avec modération admin et réponse fournisseur.

---

## [1.10.0] - 2026-10-29 (Phase 10 : Sécurité OWASP Top 10 & Robustesse)

### Ajouté
- Authentification par cookies \`HttpOnly\`, \`Secure\`, \`SameSite=Lax\` (zéro token dans Web Storage).
- Refresh token opaque avec rotation et détection de rejeu révoquant toute la famille de jetons.
- Protection CSRF double-submit avec en-tête \`X-XSRF-TOKEN\`.
- Rate limiting Bucket4j (HTTP 429 Retry-After) et verrouillage de compte (15 min / 5 échecs).
- Politique de mots de passe stricte (min 12 caractères, liste noire).
- Module RGPD / Loi marocaine 09-08 (export de données personnelles et droit à l'oubli).

---

## [1.9.0] - 2026-10-28 (Phase 9 : Nettoyage des Incohérences & Consolidation)

### Modifié
- Élimination définitive du champ statique hérité \`stock\` au profit exclusif de \`OfferAvailability\`.
- Enrichissement de l'entité \`City\` (pays, aéroport, géocodage Open-Meteo résilient).
- Factorisation des utilitaires Frontend communs (\`dom.js\`, \`format.js\`, \`toast.js\`).

---

## [1.8.0] - 2026-10-27 (Phase 8 : Favoris, Audit & Paramètres)

### Ajouté
- Module Favoris persistant pour les clients.
- Journal d'audit immuable (*append-only*) traçant les événements sensibles avec export CSV.
- Module de configuration globale avec cache atomique et mode maintenance HTTP 503.

---

## [1.7.0] - 2026-10-26 (Phase 7 : Billetterie de Support)

### Ajouté
- Module Tickets de support client/agent/admin avec fil de discussion persistant et notifications temps réel.

---

## [1.6.0] - 2026-10-25 (Phase 6 : Profils, Sécurité & Médias)

### Ajouté
- Profils complets pour les 4 rôles avec informations légales fournisseurs.
- Gestion du téléversement d'avatars et photos avec validation MIME stricte et quotas.

---

## [1.5.0] - 2026-10-24 (Phase 5 : Statistiques & Tableaux de Bord)

### Ajouté
- Quatre dashboards statistiques réels avec graphiques Chart.js et exports comptables CSV.

---

## [1.4.0] - 2026-10-23 (Phase 4 : Notifications & Messagerie)

### Ajouté
- Cloche de notifications in-app, gestion des préférences et support SMTP multipart optionnel.

---

## [1.3.0] - 2026-10-22 (Phase 3 : Paiements Sandbox & Espèces)

### Ajouté
- Paiement carte bancaire sandbox avec idempotence HTTP (\`Idempotency-Key\`).
- Encaissement des règlements en espèces au guichet par les agents.
- Webhook sécurisé par signature HMAC-SHA256.

---

## [1.2.0] - 2026-10-21 (Phase 2 : Réservations & Vouchers)

### Ajouté
- Réservations transactionnelles atomiques avec verrouillage de capacité.
- Génération de bons d'échange (vouchers) PDF avec QR code signé cryptographiquement.
- Barème d'annulation automatisé (48h / 24h).

---

## [1.1.0] - 2026-10-20 (Phase 1 : Fondations Applicatives)

### Ajouté
- Architecture Single Table Inheritance pour les 5 catégories d'offres touristiques.
- Catalogue public unique, recherche multi-critères, panier connecté et packages multi-offres (bundles).
`;

// 3. SECURITY.md
const security = `# Politique de Sécurité & Divulgation Responsable — Atlas Voyage

La sécurité de la plateforme **Atlas Voyage** et la protection des données de nos utilisateurs et partenaires sont des priorités absolues.

---

## 1. Versions Supportées

Seule la dernière version mineure de chaque branche majeure reçoit des correctifs de sécurité officiels :

| Version | Statut | Correctifs de Sécurité |
|---|:---:|:---:|
| **1.15.x** | ✅ Actuelle | Supportée |
| 1.14.x | 🟡 Maintenance | Correctifs critiques uniquement |
| < 1.14 | ❌ Obsolète | Non supportée |

---

## 2. Signalement d'une Vulnérabilité (Responsible Disclosure)

Si vous découvrez une faille ou une vulnérabilité de sécurité sur Atlas Voyage :

> [!CAUTION]
> **Ne créez jamais d'issue publique sur GitHub** pour signaler un problème de sécurité.

Veuillez transmettre votre rapport détaillé par e-mail sécurisé à notre équipe de sécurité :
- **Adresse de contact :** \`securite@atlasvoyage.ma\` (ou consulter [\`docs/decisions_a_prendre.md\`](docs/decisions_a_prendre.md#2-contact-de-sécurité-officiel) pour les contacts alternatifs)
- **Objet :** \`[VULNÉRABILITÉ SÉCURITÉ] - Brève description du problème\`

### Informations à inclure dans votre rapport :
1. Type et gravité estimée de la vulnérabilité (ex. Injection SQL, XSS, Contournement CSRF, BOLA / IDOR).
2. Composants et URLs affectés (contrôleurs Spring Boot ou pages frontend).
3. Procédure détaillée de reproduction étape par étape (Proof of Concept, commandes curl ou requêtes HTTP brutes).
4. Impact potentiel sur l'intégrité, la confidentialité ou la disponibilité du système.

---

## 3. Nos Engagements

Dès réception de votre signalement :
- **Accusé de réception :** sous **48 heures ouvrées**.
- **Évaluation & Qualification :** sous 5 jours ouvrés avec attribution d'un score CVSS v3.1.
- **Période d'embargo :** Nous vous demandons de préserver la confidentialité du signalement pendant un délai de **90 jours**, le temps de concevoir, tester et déployer le correctif.
- **Remerciements :** Après publication du correctif, votre nom ou pseudonyme pourra être crédité dans notre panthéon des contributeurs de sécurité (Hall of Fame).
`;

// 4. CODE_OF_CONDUCT.md
const coc = `# Code de Conduite des Contributeurs — Atlas Voyage

## Notre Engagement

Dans l'intérêt de favoriser un environnement ouvert, accueillant et stimulant, nous, contributeurs et mainteneurs du projet **Atlas Voyage**, nous engageons à faire en sorte que la participation à notre communauté soit exempte de harcèlement pour tout le monde, quel que soit l'âge, la corpulence, le handicap, l'origine ethnique, l'identité de genre, le niveau d'expérience, la nationalité, l'apparence physique, la religion ou l'orientation sexuelle.

---

## Nos Standards

### Comportements favorisant un environnement positif :
- Faire preuve d'empathie et de bienveillance envers les autres membres.
- Respecter les points de vue et les retours constructifs.
- Se concentrer sur ce qui est le plus bénéfique pour la communauté et les utilisateurs.
- Accepter les critiques constructives avec professionnalisme.

### Comportements inacceptables :
- L'utilisation de langage ou d'images à connotation sexuelle.
- Les attaques personnelles, insultes ou remarques désobligeantes.
- Le harcèlement public ou privé sous toutes ses formes.
- La publication d'informations privées d'autrui (doxxing) sans autorisation explicite.

---

## Responsabilités d'Application

Les mainteneurs du projet sont responsables de clarifier et de faire respecter les standards de comportement acceptable. Ils prendront des mesures correctives justes et proportionnées en cas de comportement contraire à ces règles, pouvant aller du simple avertissement à l'exclusion définitive de la communauté.

Les signalements de comportements inappropriés peuvent être adressés à l'équipe de gouvernance via \`contact@atlasvoyage.ma\`.
`;

// 5. GitHub templates
const githubDir = path.resolve('.github');
const issueDir = path.resolve(githubDir, 'ISSUE_TEMPLATE');
if (!fs.existsSync(issueDir)) {
  fs.mkdirSync(issueDir, { recursive: true });
}

const bugReport = `---
name: Rapport d'anomalie (Bug Report)
about: Signaler un dysfonctionnement ou un comportement inattendu
title: "[BUG] "
labels: bug
assignees: ''
---

## Description de l'anomalie
Une description claire et concise du problème rencontré.

## Étapes pour reproduire
1. Aller sur '...'
2. Cliquer sur '....'
3. Constater l'erreur '....'

## Comportement attendu
Ce qui aurait dû se produire normalement.

## Environnement
- OS : [ex. Windows 11, Ubuntu 22.04, macOS]
- Navigateur : [ex. Chrome 124, Firefox 125]
- Profil Spring actif : [dev / prod]
- Version du projet : [ex. 1.15.0]

## Captures d'écran ou Journaux
Ajoutez des captures d'écran ou des extraits de logs Spring Boot / console JS si disponible.
`;

const featureRequest = `---
name: Demande d'évolution (Feature Request)
about: Proposer une nouvelle fonctionnalité ou une amélioration
title: "[FEAT] "
labels: enhancement
assignees: ''
---

## Votre besoin métier
En tant que [rôle : Client, Fournisseur, Agent, Admin], je souhaite [action] afin de [bénéfice attendu].

## Solution proposée
Description claire de la façon dont vous imaginez cette fonctionnalité.

## Alternatives envisagées
Avez-vous pensé à d'autres approches ou solutions de contournement ?

## Contexte additionnel
Tout schéma, maquette ou documentation pertinente.
`;

const prTemplate = `## Description des modifications
Une description concise de ce que cette Pull Request apporte (nouvelle fonctionnalité, correction de bug, refactoring).

## Type de modification
- [ ] 🚀 Nouvelle fonctionnalité (\`feat\`)
- [ ] 🐛 Correction de bug (\`fix\`)
- [ ] 📝 Documentation (\`docs\`)
- [ ] 🎨 Design / A11y / CSS (\`style\`)
- [ ] ♻️ Refactoring sans impact fonctionnel (\`refactor\`)
- [ ] 🧪 Tests unitaires / intégration (\`test\`)
- [ ] 🔧 Tâches d'infrastructure / build (\`chore\`)

## Checklist de validation
- [ ] Mon code respecte les conventions de style et d'architecture du projet.
- [ ] Les 397 tests d'intégration backend sont verts (\`./mvnw clean test\`).
- [ ] La syntaxe Frontend est vérifiée (\`node --check ...\`).
- [ ] La documentation a été mise à jour si nécessaire (\`npm run docs:check\`).
- [ ] Aucun secret ni mot de passe en dur n'a été introduit.

## Ticket associé
Closes #
`;

const codeowners = `# CODEOWNERS — Atlas Voyage
# Responsables par domaine de code

# Règles générales pour l'ensemble du dépôt
* @lead-maintainer

# Backend Spring Boot & Sécurité
/backend/ @backend-lead @security-officer

# Frontend Vanilla JS, Design System & i18n
/frontend/ @frontend-lead @accessibility-lead

# Référentiel documentaire Docs-as-Code
/docs/ @tech-writer @backend-lead

# Scripts & Automatisation
/scripts/ @devops-lead
`;

fs.writeFileSync('CONTRIBUTING.md', contributing, 'utf8');
fs.writeFileSync('CHANGELOG.md', changelog, 'utf8');
fs.writeFileSync('SECURITY.md', security, 'utf8');
fs.writeFileSync('CODE_OF_CONDUCT.md', coc, 'utf8');
fs.writeFileSync(path.join(issueDir, 'bug_report.md'), bugReport, 'utf8');
fs.writeFileSync(path.join(issueDir, 'feature_request.md'), featureRequest, 'utf8');
fs.writeFileSync(path.join(githubDir, 'pull_request_template.md'), prTemplate, 'utf8');
fs.writeFileSync(path.join(githubDir, 'CODEOWNERS'), codeowners, 'utf8');

console.log('Successfully generated all community, contribution and GitHub templates!');

