-- Phase 6.3 : Gestion des fichiers et quotas
CREATE TABLE IF NOT EXISTS file_assets (
 id VARCHAR(36) NOT NULL PRIMARY KEY,
 stored_name VARCHAR(45) NOT NULL,
 thumbnail_name VARCHAR(45) NOT NULL,
 original_size BIGINT NOT NULL,
 stored_size BIGINT NOT NULL,
 width INT NOT NULL,
 height INT NOT NULL,
 content_type VARCHAR(30) NOT NULL,
 purpose VARCHAR(24) NOT NULL,
 owner_id BIGINT NOT NULL,
 status VARCHAR(12) NOT NULL,
 created_at DATETIME(6) NOT NULL,
 attached_at DATETIME(6) NULL,
 orphaned_at DATETIME(6) NULL,
 attachment_key VARCHAR(80) NULL,
 CONSTRAINT uk_file_stored UNIQUE(stored_name),
 CONSTRAINT uk_file_thumbnail UNIQUE(thumbnail_name),
 CONSTRAINT fk_file_owner FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_file_owner_status(owner_id,status),
 INDEX idx_file_status_created(status,created_at)
) ENGINE=InnoDB;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='file_assets' AND column_name='orphaned_at')=0,'ALTER TABLE file_assets ADD COLUMN orphaned_at DATETIME(6) NULL','SELECT 1');
PREPARE phase6 FROM @ddl; EXECUTE phase6; DEALLOCATE PREPARE phase6;

