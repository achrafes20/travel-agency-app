# Scripts SQL historiques (archive)

Scripts SQL manuels écrits pendant les premières phases du projet, conservés **pour l'historique uniquement**.

> [!WARNING]
> **Ne pas exécuter ces scripts.** Ni sur une base gérée par Flyway (présence de `flyway_schema_history`), ni sur une base de production. Pour une base antérieure au schéma courant, ne les consulter qu'après audit et sauvegarde, pour identifier les opérations réellement manquantes.

## Où sont les migrations en vigueur ?

| Besoin | Emplacement |
| :--- | :--- |
| Migrations Flyway (V1 à V9, appliquées au démarrage) | `backend/src/main/resources/db/migration/` (SQL) et `backend/src/main/java/db/migration/` (Java) |
| Scripts manuels de production (V1 à V15, idempotents) | [`scripts/migrations/`](../../../scripts/migrations/), décrits dans [`docs/migrations.md`](../../migrations.md) |

## Contenu de l'archive

- Migrations initiales de modération, de critères de recherche des vols et des voitures, de contraintes des codes promo, de villes et de destinations.
- Scripts des phases 6 à 8 : profils et sécurité des comptes, profils fournisseurs, fichiers, réinitialisation de mot de passe, tickets, favoris, audit et paramètres.

Les quatre scripts de la Phase 6 (`migration_user_profile_security.sql`, `migration_supplier_profile.sql`, `migration_file_assets.sql`, `migration_password_reset_email_verification.sql`) ont un SQL équivalent à `V3`, `V4`, `V6` et `V5` de `scripts/migrations/`, qui sont leur version en vigueur.

## Historique de ce dossier

- 9 novembre 2026 : consolidation. Le dossier `docs/legacy-migrations/` (9 scripts strictement identiques à ceux d'ici) et le dossier `backend/scripts/migrations/` (4 scripts de la Phase 6, SQL équivalent à `scripts/migrations/V3` à `V6`) ont été supprimés ; ce dossier est la seule archive.
- Le README précédent affirmait que Flyway portait des migrations V1 à V10 avec ces contenus : c'était inexact (Flyway s'arrête à V9, et ses V3 à V7 sont des migrations Java d'adoption).
