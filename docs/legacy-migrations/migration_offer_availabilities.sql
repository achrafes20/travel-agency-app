-- Migration MySQL : remplace le stock générique par des périodes réservables.
-- À exécuter une seule fois après migration_offer_moderation.sql.
CREATE TABLE offer_availabilities (
    offer_id BIGINT NOT NULL,
    available_from DATETIME(6) NOT NULL,
    available_until DATETIME(6) NOT NULL,
    capacity INT NOT NULL,
    CONSTRAINT fk_offer_availabilities_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    CONSTRAINT chk_offer_availability_dates CHECK (available_until > available_from),
    CONSTRAINT chk_offer_availability_capacity CHECK (capacity > 0)
);

CREATE INDEX idx_offer_availability_period
    ON offer_availabilities (offer_id, available_from, available_until);

-- Conversion des anciennes offres disponibles en une première période.
-- Ajustez ensuite ces dates depuis l'espace fournisseur.
INSERT INTO offer_availabilities (offer_id, available_from, available_until, capacity)
SELECT id, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), GREATEST(stock, 1)
FROM offers
WHERE active = TRUE AND stock > 0;
