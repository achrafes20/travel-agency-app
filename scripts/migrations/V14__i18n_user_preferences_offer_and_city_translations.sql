-- ==============================================================================
-- ATLAS VOYAGE — MIGRATION V14 : INTERNATIONALISATION, DEVISES & TRADUCTIONS
-- ==============================================================================

-- 1. Ajout des colonnes de préférences utilisateur (langue et devise)
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'fr',
    ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(5) DEFAULT 'MAD';

-- 2. Table des traductions d'offres
CREATE TABLE IF NOT EXISTS offer_translations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    offer_id BIGINT NOT NULL,
    locale VARCHAR(5) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    itinerary TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_offer_translations_offer_locale UNIQUE (offer_id, locale),
    CONSTRAINT fk_offer_translations_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_offer_translations_offer ON offer_translations(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_translations_locale ON offer_translations(locale);

-- 3. Table des traductions des noms de villes marocaines
CREATE TABLE IF NOT EXISTS city_translations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city_id BIGINT NOT NULL,
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(120) NOT NULL,
    CONSTRAINT uk_city_translations_city_locale UNIQUE (city_id, locale),
    CONSTRAINT fk_city_translations_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_city_translations_city ON city_translations(city_id);
CREATE INDEX IF NOT EXISTS idx_city_translations_locale ON city_translations(locale);

-- 4. Initialisation des traductions pour les principales villes marocaines existantes
INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'en', 'Marrakech' FROM cities c WHERE LOWER(c.normalized_name) = 'marrakech';

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'ar', 'مراكش' FROM cities c WHERE LOWER(c.normalized_name) = 'marrakech';

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'en', 'Fes' FROM cities c WHERE LOWER(c.normalized_name) IN ('fes', 'fes');

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'ar', 'فاس' FROM cities c WHERE LOWER(c.normalized_name) IN ('fes', 'fes');

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'en', 'Casablanca' FROM cities c WHERE LOWER(c.normalized_name) = 'casablanca';

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'ar', 'الدار البيضاء' FROM cities c WHERE LOWER(c.normalized_name) = 'casablanca';

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'en', 'Tangier' FROM cities c WHERE LOWER(c.normalized_name) = 'tanger';

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'ar', 'طنجة' FROM cities c WHERE LOWER(c.normalized_name) = 'tanger';

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'en', 'Chefchaouen' FROM cities c WHERE LOWER(c.normalized_name) = 'chefchaouen';

INSERT IGNORE INTO city_translations (city_id, locale, name)
SELECT c.id, 'ar', 'شفشاون' FROM cities c WHERE LOWER(c.normalized_name) = 'chefchaouen';

