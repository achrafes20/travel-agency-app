-- À exécuter une seule fois si la base MySQL existe déjà et si Hibernate
-- n'est pas autorisé à modifier automatiquement le schéma.
ALTER TABLE offers ADD COLUMN car_pickup_location VARCHAR(255) NULL;
ALTER TABLE offers ADD COLUMN car_dropoff_location VARCHAR(255) NULL;
ALTER TABLE offers ADD COLUMN allows_different_dropoff BIT(1) NOT NULL DEFAULT b'0';
ALTER TABLE offers ADD COLUMN minimum_driver_age INT NULL;
ALTER TABLE offers ADD COLUMN maximum_driver_age INT NULL;

UPDATE offers
SET minimum_driver_age = 21, maximum_driver_age = 75
WHERE offer_type = 'CAR' AND minimum_driver_age IS NULL;
