-- Evolution de l'entité minimale existante ; Flyway applique cette migration une seule fois.
ALTER TABLE notifications
 ADD COLUMN type ENUM('BOOKING_CREATED','BOOKING_CONFIRMED','BOOKING_CANCELLED','PAYMENT_RECEIVED','PAYMENT_FAILED','AVAILABILITY_LOW','AVAILABILITY_EXPIRED','OFFER_DEACTIVATED','OFFER_REACTIVATED','TICKET_REPLY','ACCOUNT_WELCOME','SYSTEM') NOT NULL DEFAULT 'SYSTEM',
 ADD COLUMN title VARCHAR(150) NOT NULL DEFAULT 'Information Atlas Voyage',
 ADD COLUMN link VARCHAR(500) NULL,
 ADD COLUMN read_at DATETIME(6) NULL,
 ADD COLUMN reference_type VARCHAR(50) NULL,
 ADD COLUMN reference_id BIGINT NULL,
 ADD COLUMN dedup_key VARCHAR(200) NULL;
UPDATE notifications SET read_at=created_at WHERE is_read=true AND read_at IS NULL;
CREATE INDEX idx_notification_user_read_created ON notifications(user_id,is_read,created_at);
CREATE INDEX idx_notification_user_created ON notifications(user_id,created_at);
CREATE UNIQUE INDEX uk_notification_user_dedup ON notifications(user_id,dedup_key);
-- Le nom de FK diffère sur les anciennes bases créées par Hibernate.
SET @notification_fk = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notifications' AND COLUMN_NAME='user_id'
 AND REFERENCED_TABLE_NAME='users' LIMIT 1);
SET @notification_drop_fk = IF(@notification_fk IS NULL,'SELECT 1',CONCAT('ALTER TABLE notifications DROP FOREIGN KEY `',REPLACE(@notification_fk,'`','``'),'`'));
PREPARE notification_fk_statement FROM @notification_drop_fk;
EXECUTE notification_fk_statement;
DEALLOCATE PREPARE notification_fk_statement;
ALTER TABLE notifications ADD CONSTRAINT fk_notification_user_v8 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE TABLE IF NOT EXISTS notification_preferences (
 user_id BIGINT PRIMARY KEY,
 email_enabled BIT NOT NULL DEFAULT 1, in_app_enabled BIT NOT NULL DEFAULT 1,
 booking_email BIT NOT NULL DEFAULT 1, payment_email BIT NOT NULL DEFAULT 1,
 offer_email BIT NOT NULL DEFAULT 1, support_email BIT NOT NULL DEFAULT 1,
 CONSTRAINT fk_notification_preferences_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS notification_dispatches (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id BIGINT NOT NULL,
 dedup_key VARCHAR(200) NOT NULL,created_at DATETIME(6) NOT NULL,
 CONSTRAINT uk_notification_dispatch UNIQUE(user_id,dedup_key),
 CONSTRAINT fk_notification_dispatch_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
