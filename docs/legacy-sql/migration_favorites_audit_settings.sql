-- ==============================================================================
-- Migration Phase 8 : Favoris, Journal d'audit et Paramètres globaux
-- Base de données : MySQL 8+
-- Date : Novembre 2026
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table des Favoris (favorites)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    offer_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_favorite_client_offer UNIQUE (client_id, offer_id),
    CONSTRAINT fk_favorite_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    INDEX idx_favorite_client (client_id),
    INDEX idx_favorite_offer (offer_id),
    INDEX idx_favorite_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table du Journal d'Audit (audit_logs)
-- Note : colonnes scalaires pour l'acteur (pas de FK pour survivre à la suppression d'un compte)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id BIGINT NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id BIGINT NULL,
    description VARCHAR(500) NULL,
    before_json TEXT NULL,
    after_json TEXT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_actor (actor_email),
    INDEX idx_audit_action (action),
    INDEX idx_audit_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Triggers d'immuabilité (append-only) pour MySQL
DROP TRIGGER IF EXISTS trg_audit_logs_no_update;
DELIMITER $$
CREATE TRIGGER trg_audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Les logs d audit sont immuables (append-only) : mise a jour interdite';
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_audit_logs_no_delete;
DELIMITER $$
CREATE TRIGGER trg_audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Les logs d audit sont immuables (append-only) : suppression interdite';
END$$
DELIMITER ;

-- ------------------------------------------------------------------------------
-- 3. Table des Paramètres Globaux (settings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL,
    description VARCHAR(255) NULL,
    min_value DOUBLE NULL,
    max_value DOUBLE NULL,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    updated_by VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    CONSTRAINT uk_setting_key UNIQUE (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Initialisation idempotente des paramètres système par défaut
-- ------------------------------------------------------------------------------
INSERT INTO settings (setting_key, setting_value, value_type, description, min_value, max_value, updated_at, updated_by)
VALUES
    ('booking.cancellation.hours', '48', 'INTEGER', 'Délai d''annulation client (heures)', 0.0, 720.0, NOW(6), 'SYSTEM'),
    ('payment.expiration.minutes', '30', 'INTEGER', 'Délai d''expiration du paiement (minutes)', 5.0, 1440.0, NOW(6), 'SYSTEM'),
    ('offers.images.max', '5', 'INTEGER', 'Nombre maximum d''images par offre', 1.0, 10.0, NOW(6), 'SYSTEM'),
    ('currency.default', 'MAD', 'STRING', 'Devise par défaut de la plateforme (MAD, EUR, USD, GBP)', NULL, NULL, NOW(6), 'SYSTEM'),
    ('payment.cash.enabled', 'true', 'BOOLEAN', 'Autoriser le paiement en espèces à l''arrivée', NULL, NULL, NOW(6), 'SYSTEM'),
    ('maintenance.enabled', 'false', 'BOOLEAN', 'Activer le mode maintenance', NULL, NULL, NOW(6), 'SYSTEM'),
    ('maintenance.message', 'Atlas Voyage est actuellement en maintenance. Nous serons de retour très bientôt.', 'STRING', 'Message affiché aux visiteurs pendant la maintenance', NULL, NULL, NOW(6), 'SYSTEM')
ON DUPLICATE KEY UPDATE
    setting_key = setting_key;

