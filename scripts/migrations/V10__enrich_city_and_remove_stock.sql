-- Phase 9 : Enrichissement des villes, normalisation sans doublons, suppression de stock et nettoyage destinations

-- 1. Nettoyage de l'ancienne table destinations si encore présente
DROP TABLE IF EXISTS destinations;

-- 2. Suppression de la colonne destination_id sur cities si existante
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='cities' AND column_name='destination_id');
SET @sql_stmt = IF(@col_exists > 0, 'ALTER TABLE cities DROP COLUMN destination_id', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Enrichissement de la table cities
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='cities' AND column_name='normalized_name');
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE cities ADD COLUMN normalized_name VARCHAR(120) NULL', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='cities' AND column_name='country');
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE cities ADD COLUMN country VARCHAR(100) NOT NULL DEFAULT ''Maroc''', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='cities' AND column_name='country_code');
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE cities ADD COLUMN country_code VARCHAR(2) NOT NULL DEFAULT ''MA''', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='cities' AND column_name='has_airport');
SET @sql_stmt = IF(@col_exists = 0, 'ALTER TABLE cities ADD COLUMN has_airport BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Initialisation de normalized_name pour les villes existantes
UPDATE cities SET normalized_name = LOWER(TRIM(name)) WHERE normalized_name IS NULL OR normalized_name = '';

-- S'assurer que normalized_name est NOT NULL
ALTER TABLE cities MODIFY COLUMN normalized_name VARCHAR(120) NOT NULL;

-- Ajout idempotent de la contrainte unique sur normalized_name
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='cities' AND index_name='uk_cities_normalized_name');
SET @sql_stmt = IF(@idx_exists = 0, 'CREATE UNIQUE INDEX uk_cities_normalized_name ON cities(normalized_name)', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Suppression de la colonne historique stock de la table offers si existante
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='offers' AND column_name='stock');
SET @sql_stmt = IF(@col_exists > 0, 'ALTER TABLE offers DROP COLUMN stock', 'SELECT 1');
PREPARE stmt FROM @sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

