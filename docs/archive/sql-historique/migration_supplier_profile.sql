-- Phase 6.1. Ne pas exécuter deux fois sans vérifier le schéma.
CREATE TABLE IF NOT EXISTS supplier_profiles (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT NOT NULL, city_id BIGINT NULL,
 company_name VARCHAR(160), contact_phone VARCHAR(20), address VARCHAR(500), description VARCHAR(2000),
 logo_url VARCHAR(500), legal_form VARCHAR(80), registration_number VARCHAR(80), ice VARCHAR(15), tax_id VARCHAR(80), legal_notes VARCHAR(2000),
 created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL,
 CONSTRAINT uk_supplier_profile_user UNIQUE(user_id),
 CONSTRAINT fk_supplier_profile_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_supplier_profile_city FOREIGN KEY(city_id) REFERENCES cities(id)
) ENGINE=InnoDB;
