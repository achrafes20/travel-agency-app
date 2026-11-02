-- Phase 10: Refresh tokens avec rotation et détection de réutilisation, verrouillage de compte et consentement RGPD

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    family_id VARCHAR(36) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6) NULL,
    replaced_by VARCHAR(64) NULL,
    created_at DATETIME(6) NOT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_token_family (family_id),
    INDEX idx_refresh_token_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Colonnes sur users (idempotent via stored procedure)
DROP PROCEDURE IF EXISTS upgrade_users_security_v11;
DELIMITER //
CREATE PROCEDURE upgrade_users_security_v11()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'failed_login_attempts') THEN
        ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'locked_until') THEN
        ALTER TABLE users ADD COLUMN locked_until DATETIME(6) NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'consent_at') THEN
        ALTER TABLE users ADD COLUMN consent_at DATETIME(6) NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'consent_version') THEN
        ALTER TABLE users ADD COLUMN consent_version VARCHAR(50) NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'marketing_opt_in') THEN
        ALTER TABLE users ADD COLUMN marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END //
DELIMITER ;

CALL upgrade_users_security_v11();
DROP PROCEDURE IF EXISTS upgrade_users_security_v11;
