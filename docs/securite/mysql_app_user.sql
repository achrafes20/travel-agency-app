-- ==============================================================================
-- ATLAS VOYAGE — PROVISIONNEMENT DES UTILISATEURS MYSQL (MOINDRE PRIVILÈGE)
-- ==============================================================================
-- Ce script configure les comptes d'accès à MySQL en appliquant strictement
-- le principe du moindre privilège (Least Privilege Architecture).
-- 
-- 1. `atlas_app`      : Utilisateur applicatif d'exécution runtime (DML uniquement).
-- 2. `atlas_migrator` : Utilisateur réservé aux migrations de schéma Flyway (DDL).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Création de la Base de Données (UTF8MB4 Strict)
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `travel_agency_db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Compte Applicatif Runtime : `atlas_app`
-- ------------------------------------------------------------------------------
-- Ce compte est utilisé exclusivement par Spring Boot en exploitation quotidienne.
-- Il ne possède AUCUN droit d'altération de schéma (pas de CREATE, DROP, ALTER, TRUNCATE).
-- ------------------------------------------------------------------------------

-- Suppression préventive si déjà existant
DROP USER IF EXISTS 'atlas_app'@'%';

-- Création de l'utilisateur avec authentification forte et chiffrement TLS requis
CREATE USER 'atlas_app'@'%' 
    IDENTIFIED WITH caching_sha2_password BY 'ChangeThisStrongPassword_ProdApp2026!'
    REQUIRE SSL
    WITH MAX_QUERIES_PER_HOUR 0
         MAX_UPDATES_PER_HOUR 0
         MAX_CONNECTIONS_PER_HOUR 0
         MAX_USER_CONNECTIONS 100;

-- Attribution stricte des privilèges DML (Manipulation des Données uniquement)
GRANT SELECT, INSERT, UPDATE, DELETE ON `travel_agency_db`.* TO 'atlas_app'@'%';

-- Interdiction explicite de tout droit d'administration ou de modification structurelle
REVOKE CREATE, DROP, ALTER, INDEX, REFERENCES, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE, CREATE VIEW, SHOW VIEW, CREATE ROUTINE, ALTER ROUTINE, EVENT, TRIGGER ON `travel_agency_db`.* FROM 'atlas_app'@'%';

-- ------------------------------------------------------------------------------
-- 3. Compte Dédié aux Migrations Flyway / CI-CD : `atlas_migrator`
-- ------------------------------------------------------------------------------
-- Ce compte est utilisé uniquement par le pipeline CI/CD ou l'outil de migration
-- lors des déploiements pour exécuter les scripts de schéma.
-- ------------------------------------------------------------------------------

DROP USER IF EXISTS 'atlas_migrator'@'%';

CREATE USER 'atlas_migrator'@'%' 
    IDENTIFIED WITH caching_sha2_password BY 'ChangeThisStrongMigratorPass_2026!'
    REQUIRE SSL
    WITH MAX_USER_CONNECTIONS 10;

-- Privilèges DDL et DML pour la gestion complète du schéma et de la table flyway_schema_history
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES ON `travel_agency_db`.* TO 'atlas_migrator'@'%';

-- ------------------------------------------------------------------------------
-- 4. Application Immédiate des Privilèges
-- ------------------------------------------------------------------------------
FLUSH PRIVILEGES;

-- ------------------------------------------------------------------------------
-- 5. Contrôle et Vérification des Droits Attribués
-- ------------------------------------------------------------------------------
SHOW GRANTS FOR 'atlas_app'@'%';
SHOW GRANTS FOR 'atlas_migrator'@'%';

