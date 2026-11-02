-- Critères nécessaires pour faire correspondre les vols aux recherches publiques.
ALTER TABLE offers
    ADD COLUMN round_trip BOOLEAN NULL DEFAULT FALSE,
    ADD COLUMN return_departure_date_time DATETIME(6) NULL,
    ADD COLUMN return_arrival_date_time DATETIME(6) NULL,
    ADD COLUMN cabin_class VARCHAR(40) NULL;

UPDATE offers
SET round_trip = FALSE,
    cabin_class = 'ECONOMY'
WHERE offer_type = 'FLIGHT' AND cabin_class IS NULL;
