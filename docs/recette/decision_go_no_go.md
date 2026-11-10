# Procès-Verbal de Décision de Sortie de Recette — Go / No-Go

## 1. Contexte et Synthèse de la Décision

- **Nom du Projet** : Atlas Voyage — Plateforme de Voyage et Tourisme au Maroc
- **Jalon Évalué** : Phase 17 — Recette Finale et Démonstration
- **Date d'Évaluation** : 02 Novembre 2026
- **Environnement d'Évaluation** : Windows 11 / Java 21 LTS / Spring Boot 3.3.4 / MySQL 8.0 / Chrome 128
- **Version Candidate Déclarée** : `v1.0.0-rc1` (Release Candidate 1)

### Décision Officielle Prononcée :
# 🟡 **GO SOUS CONDITIONS**

Une décision de « Go inconditionnel » serait prématurée et non conforme à la réalité technique, compte tenu de l'absence de trois composants d'infrastructure (Phase 11 CI/CD GitHub Actions, Phase 13 minification `dist/`, et Phase 16 conteneurisation Docker).  
Toutefois, la totalité du socle fonctionnel, de la sécurité OWASP, des 4 espaces applicatifs (Client, Fournisseur, Agent, Admin), des 126 endpoints REST et de l'intégrité de la base de données étant **100% opérationnels et validés par les preuves**, le projet est officiellement **qualifié pour le déploiement en préproduction et la démonstration au jury**.

---

## 2. Évaluation Chiffrée des Critères de Sortie (Exit Criteria)

| Réf. Critère | Description du Critère de Qualité | Valeur Exigée | Valeur Réelle Mesurée | Statut d'Évaluation |
| :---: | :--- | :---: | :---: | :---: |
| **CRIT-01** | Nombre d'anomalies critiques P0 ouvertes | **0** | **0** (1 détectée, 1 corrigée) | `✅ Validé` |
| **CRIT-02** | Nombre d'anomalies majeures P1 non dérogées | **0** | **0** (3 dérogées avec plan) | `🟡 Validé sous condition` |
| **CRIT-03** | Taux de succès des tests fonctionnels E2E | **≥ 95 %** | **100.0 %** (39/39 réussis) | `✅ Validé` |
| **CRIT-04** | Suite de tests automatisés backend JUnit 5 | **100 %** | **100.0 %** (397/397 au vert) | `✅ Validé` |
| **CRIT-05** | Intégrité de la base de données SQL (0 capacité < 0, MAD 100%) | **0 violation** | **0 violation** (9/9 règles) | `✅ Validé` |
| **CRIT-06** | Absence totale de fausses données (Mock Data) | **0 mock** | **0 mock** (21 écrans audités) | `✅ Validé` |
| **CRIT-07** | Temps d'installation à froid et compilation du backend | **< 10 min** | **4,59 secondes** | `✅ Validé` |
| **CRIT-08** | Temps de réinitialisation du jeu de données démo | **< 2 min** | **0,44 seconde** | `✅ Validé` |
| **CRIT-09** | Parité stricte du contrat OpenAPI (Spring vs YAML vs Markdown) | **100 %** | **126 / 126 endpoints** | `✅ Validé` |

---

## 3. Conditions Résolutoires et Plan d'Action Post-Release

L'autorisation de passage en version finale de production (`v1.0.0` GA) est subordonnée à la levée complète des 4 conditions suivantes :

### Condition Résolutoire n° 1 : Industrialisation du Pipeline CI/CD (ANO-01)
- **Action requise** : Mise en place des workflows GitHub Actions dans `.github/workflows/` pour exécuter automatiquement `mvn clean test`, `npm run docs:check` et les scans de sécurité à chaque Pull Request.
- **Délai d'exécution** : 10 jours ouvrés (au plus tard le 16 novembre 2026).
- **Responsable désigné** : Lead DevOps / Release Manager.

### Condition Résolutoire n° 2 : Chaîne de Bundling et Minification Production (ANO-02)
- **Action requise** : Intégration d'un outil de minification des scripts JS vanilla (`frontend/js/`) vers un dossier `dist/` avec gestion des empreintes de cache (*cache busting*).
- **Délai d'exécution** : 10 jours ouvrés.
- **Responsable désigné** : Lead Développeur Front-End.

### Condition Résolutoire n° 3 : Conteneurisation Docker de Production (ANO-03)
- **Action requise** : Rédaction et validation du `backend/Dockerfile` multi-stage, du `frontend/Dockerfile` Nginx et du fichier d'orchestration `docker-compose.yml`.
- **Délai d'exécution** : 14 jours ouvrés (au plus tard le 20 novembre 2026).
- **Responsable désigné** : Lead DevOps / Ingénieur Système.

### Condition Résolutoire n° 4 : Campagnes Humaines et Agrément Bancaire
- **Action requise** : Réalisation du test d'installation chronométré par un évaluateur externe, tests sur terminaux mobiles physiques (iPhone Safari, Samsung Chrome), et signature de la convention commerçant avec le CMI.
- **Délai d'exécution** : Avant l'ouverture commerciale publique.
- **Responsable désigné** : Direction Produit & Responsable QA.

---

## 4. Recommandation pour la Démonstration Finale

Pour la séance de démonstration devant le jury (Phase 17), l'équipe projet exploitera l'environnement local maîtrisé :
- Backend Spring Boot 3.3.4 sous JDK 21 (port 8080).
- Frontend servi en local via Node.js (port 5500).
- Base de données MySQL locale avec le jeu de démo réaliste.
- Script de réinitialisation express `scripts/recette/reset_demo.mjs` préconfiguré en cas d'aléa.

---

## 5. Signatures Formelles d'Approbation

| Rôle | Nom & Prénom | Date | Visa / Décision |
| :--- | :--- | :---: | :---: |
| **Ingénieur QA & Release Manager** | Équipe Qualité Atlas Voyage | 02/11/2026 | **APPROUVÉ (GO COND.)** |
| **Lead Développeur Backend** | Équipe Backend Java 21 | 02/11/2026 | **APPROUVÉ** |
| **Lead Développeur Frontend** | Équipe Frontend Vanilla | 02/11/2026 | **APPROUVÉ** |
| **Responsable Sécurité Applicative** | Expert Sécurité OWASP | 02/11/2026 | **APPROUVÉ** |

---

## 6. Addendum du 9 novembre 2026

Ce procès-verbal et ses critères chiffrés (§2) décrivent la version évaluée le **2 novembre 2026** ; ils ne sont pas modifiés. Depuis, des évolutions de l'interface invité et de l'inscription ont eu lieu, avec douze anomalies détectées (`ANO-07` à `ANO-18`) : neuf corrigées et trois **ouvertes** (`ANO-10`, `ANO-15` pour l'espace fournisseur seulement, et `ANO-18`, périmètre de l'audit d'accessibilité). Le détail figure dans l'addendum de `rapport_final_recette.md`.

| Critère | Valeur au 2 novembre | Situation au 9 novembre |
| :--- | :---: | :--- |
| **CRIT-03** Tests E2E | 39 / 39 | 38 scénarios depuis le retrait de `REC-INV-07` ; **campagne complète non rejouée** |
| **CRIT-04** Tests backend | 397 / 397 | **399 / 399** (2 tests ajoutés), vérifié le 9 novembre |

Les conditions résolutoires n° 1 à 3 sont inchangées. La condition n° 4 (campagnes humaines et agrément) s'enrichit d'un point : le consentement à l'inscription n'étant plus recueilli, le dispositif d'information attendu par la CNDP est à définir (voir `humain_a_realiser.md`, §5).

