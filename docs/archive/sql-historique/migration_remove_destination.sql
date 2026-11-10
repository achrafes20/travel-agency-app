-- Référentiel géographique : villes uniquement (suppression de destinations).
-- À exécuter une fois sur une base déjà créée avec l’ancien modèle Destination.
USE travel_agency_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS destinations;

-- Si la colonne n’existe plus (nouvelle install), ignorer l’erreur MySQL.
ALTER TABLE cities DROP COLUMN destination_id;

SET FOREIGN_KEY_CHECKS = 1;
