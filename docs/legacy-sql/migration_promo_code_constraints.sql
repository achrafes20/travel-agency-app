-- Migration pour une base Atlas Voyage créée avant le renommage de PromoCode.value.
-- À exécuter une seule fois sur une base existante, avant de redémarrer le backend.
USE travel_agency_db;

ALTER TABLE promo_codes
    CHANGE COLUMN `value` discount_value DECIMAL(12, 2) NOT NULL;

ALTER TABLE promo_codes
    MODIFY COLUMN code VARCHAR(255) NOT NULL,
    MODIFY COLUMN discount_type ENUM('FIXED', 'PERCENTAGE') NOT NULL;

ALTER TABLE offers
    MODIFY COLUMN city_id BIGINT NOT NULL,
    MODIFY COLUMN supplier_id BIGINT NOT NULL;

ALTER TABLE bundles
    MODIFY COLUMN created_by_agent_id BIGINT NOT NULL;

ALTER TABLE carts
    MODIFY COLUMN client_id BIGINT NOT NULL;

ALTER TABLE cart_items
    MODIFY COLUMN cart_id BIGINT NOT NULL,
    MODIFY COLUMN quantity INT NOT NULL,
    ADD CONSTRAINT chk_cart_item_target
        CHECK ((offer_id IS NOT NULL AND bundle_id IS NULL)
            OR (offer_id IS NULL AND bundle_id IS NOT NULL));

ALTER TABLE bookings
    MODIFY COLUMN client_id BIGINT NOT NULL,
    MODIFY COLUMN quantity INT NOT NULL,
    MODIFY COLUMN total_price DOUBLE NOT NULL,
    MODIFY COLUMN payment_method ENUM('ON_ARRIVAL', 'SIMULATED') NOT NULL,
    MODIFY COLUMN status ENUM('CANCELLED', 'COMPLETED', 'CONFIRMED', 'PENDING') NOT NULL,
    MODIFY COLUMN created_at DATETIME(6) NOT NULL,
    ADD CONSTRAINT chk_booking_target
        CHECK ((offer_id IS NOT NULL AND bundle_id IS NULL)
            OR (offer_id IS NULL AND bundle_id IS NOT NULL));

ALTER TABLE payments
    MODIFY COLUMN booking_id BIGINT NOT NULL,
    MODIFY COLUMN amount DOUBLE NOT NULL,
    MODIFY COLUMN method ENUM('ON_ARRIVAL', 'SIMULATED') NOT NULL,
    MODIFY COLUMN status ENUM('COMPLETED', 'PENDING') NOT NULL;

ALTER TABLE notifications
    MODIFY COLUMN user_id BIGINT NOT NULL,
    MODIFY COLUMN message VARCHAR(1000) NOT NULL,
    MODIFY COLUMN is_read BOOLEAN NOT NULL,
    MODIFY COLUMN created_at DATETIME(6) NOT NULL;

ALTER TABLE bundle_offers
    ADD CONSTRAINT uk_bundle_offer UNIQUE (bundle_id, offer_id);
