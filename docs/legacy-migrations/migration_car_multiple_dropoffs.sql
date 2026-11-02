-- Lieux de restitution multiples pour les offres de location de voiture.
-- À exécuter une seule fois si Hibernate ddl-auto=update n'est pas utilisé.
CREATE TABLE car_dropoff_locations (
    offer_id BIGINT NOT NULL,
    location VARCHAR(255) NOT NULL,
    CONSTRAINT fk_car_dropoff_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

INSERT INTO car_dropoff_locations (offer_id, location)
SELECT id, car_dropoff_location
FROM offers
WHERE offer_type = 'CAR' AND car_dropoff_location IS NOT NULL AND TRIM(car_dropoff_location) <> '';
