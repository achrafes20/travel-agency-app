-- À exécuter une seule fois sur une base MySQL existante si ddl-auto n'est pas configuré à update.
ALTER TABLE offers
    ADD COLUMN moderation_reason VARCHAR(1000) NULL,
    ADD COLUMN moderated_at DATETIME(6) NULL,
    ADD COLUMN moderated_by_admin_id BIGINT NULL;

ALTER TABLE offers
    ADD CONSTRAINT fk_offers_moderated_by_admin
    FOREIGN KEY (moderated_by_admin_id) REFERENCES users(id);
