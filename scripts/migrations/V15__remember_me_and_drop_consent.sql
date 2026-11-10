-- Choix « Se souvenir de moi » conservé avec le refresh token (le cookie reste persistant ou de session à chaque rotation)
-- et retrait du consentement à l'inscription : les colonnes users.consent_at et users.consent_version sont supprimées.
-- Idempotent : peut être rejoué sans erreur.

DROP PROCEDURE IF EXISTS upgrade_v15_remember_me_and_consent;
DELIMITER //
CREATE PROCEDURE upgrade_v15_remember_me_and_consent()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'refresh_tokens' AND column_name = 'remember_me') THEN
        ALTER TABLE refresh_tokens ADD COLUMN remember_me BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'consent_at') THEN
        ALTER TABLE users DROP COLUMN consent_at;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'consent_version') THEN
        ALTER TABLE users DROP COLUMN consent_version;
    END IF;
END //
DELIMITER ;

CALL upgrade_v15_remember_me_and_consent();
DROP PROCEDURE IF EXISTS upgrade_v15_remember_me_and_consent;
