# Anciennes migrations SQL

Ces scripts sont conservés pour l'historique. Leur contenu est consolidé dans
Flyway V1 et les migrations suivantes sous backend/src/main/resources/db/migration.
Ne pas les lancer sur une base disposant de flyway_schema_history.
Pour une base antérieure au schéma courant, les utiliser uniquement après audit,
sauvegarde et sélection des opérations réellement manquantes.
