-- Phase 6.1/6.2 : Sécurité et profils utilisateurs
SET @phase6_new_email_column = (SELECT COUNT(*)=0 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='email_verified');
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='phone')=0,'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL','SELECT 1');
PREPARE phase6 FROM @ddl; EXECUTE phase6; DEALLOCATE PREPARE phase6;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='country')=0,'ALTER TABLE users ADD COLUMN country VARCHAR(2) NULL','SELECT 1');
PREPARE phase6 FROM @ddl; EXECUTE phase6; DEALLOCATE PREPARE phase6;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='avatar_url')=0,'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL','SELECT 1');
PREPARE phase6 FROM @ddl; EXECUTE phase6; DEALLOCATE PREPARE phase6;
SET @ddl = IF(@phase6_new_email_column,'ALTER TABLE users ADD COLUMN email_verified BIT NOT NULL DEFAULT 0','SELECT 1');
PREPARE phase6 FROM @ddl; EXECUTE phase6; DEALLOCATE PREPARE phase6;
UPDATE users SET email_verified=1 WHERE @phase6_new_email_column;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='token_version')=0,'ALTER TABLE users ADD COLUMN token_version BIGINT NOT NULL DEFAULT 0','SELECT 1');
PREPARE phase6 FROM @ddl; EXECUTE phase6; DEALLOCATE PREPARE phase6;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='password_changed_at')=0,'ALTER TABLE users ADD COLUMN password_changed_at DATETIME(6) NULL','SELECT 1');
PREPARE phase6 FROM @ddl; EXECUTE phase6; DEALLOCATE PREPARE phase6;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='updated_at')=0,'ALTER TABLE users ADD COLUMN updated_at DATETIME(6) NULL','SELECT 1');
PREPARE phase6 FROM @ddl; EXECUTE phase6; DEALLOCATE PREPARE phase6;
UPDATE users SET updated_at=COALESCE(created_at,UTC_TIMESTAMP(6)) WHERE updated_at IS NULL;
ALTER TABLE users MODIFY updated_at DATETIME(6) NOT NULL;

