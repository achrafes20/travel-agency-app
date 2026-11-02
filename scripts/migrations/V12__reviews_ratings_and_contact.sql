-- Migration V12 : Module Avis et Notations + Messages de Contact
-- Phase 12 - Atlas Voyage

-- 1. Ajout des colonnes de note moyenne et de nombre d'avis sur les offres
ALTER TABLE `offers`
    ADD COLUMN IF NOT EXISTS `average_rating` DOUBLE NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS `review_count` INT NOT NULL DEFAULT 0;

-- 2. Table des avis clients certifiés (reviews)
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `offer_id` BIGINT NOT NULL,
    `client_id` BIGINT NOT NULL,
    `booking_id` BIGINT NOT NULL,
    `rating` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `comment` VARCHAR(2000) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `moderated_by_id` BIGINT NULL,
    `moderated_at` DATETIME(6) NULL,
    `moderation_reason` VARCHAR(1000) NULL,
    `supplier_reply` VARCHAR(2000) NULL,
    `supplier_replied_at` DATETIME(6) NULL,
    `report_count` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_review_offer` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_review_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_review_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_review_moderator` FOREIGN KEY (`moderated_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `uk_review_booking_offer` UNIQUE (`booking_id`, `offer_id`),
    INDEX `idx_review_offer_status` (`offer_id`, `status`),
    INDEX `idx_review_client` (`client_id`),
    INDEX `idx_review_booking` (`booking_id`),
    INDEX `idx_review_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des messages de contact publics avec protection honeypot
CREATE TABLE IF NOT EXISTS `contact_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `message` VARCHAR(3000) NOT NULL,
    `ip_address` VARCHAR(50) NULL,
    `processed` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_contact_created_at` (`created_at`),
    INDEX `idx_contact_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

