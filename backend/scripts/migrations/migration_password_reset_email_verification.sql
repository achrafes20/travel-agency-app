-- Phase 6.2. Ne pas exécuter deux fois sans vérifier le schéma.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL,
 token_hash VARCHAR(64) NOT NULL, created_at DATETIME(6) NOT NULL, expires_at DATETIME(6) NOT NULL,
 used_at DATETIME(6), request_ip VARCHAR(64),
 CONSTRAINT uk_reset_hash UNIQUE(token_hash),
 CONSTRAINT fk_reset_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_reset_user(user_id), INDEX idx_reset_expiry(expires_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS email_verification_tokens (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL,
 token_hash VARCHAR(64) NOT NULL, created_at DATETIME(6) NOT NULL, expires_at DATETIME(6) NOT NULL, used_at DATETIME(6),
 CONSTRAINT uk_verification_hash UNIQUE(token_hash),
 CONSTRAINT fk_verification_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_verification_user(user_id), INDEX idx_verification_expiry(expires_at)
) ENGINE=InnoDB;
