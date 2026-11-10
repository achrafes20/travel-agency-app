-- =============================================================================
-- Atlas Voyage — Migration SQL : Module Tickets de Support
-- Fichier : scripts/migration_tickets.sql
-- Description : Crée les tables ticket_sequence, tickets, ticket_messages et
--               ticket_attachments avec clés étrangères et index de performance.
-- ATTENTION : À exécuter sur bases MySQL gérées manuellement.
-- Ce script est idempotent grâce aux clauses IF NOT EXISTS et procédures stockées.
-- =============================================================================

-- 1. Table de séquence annuelle atomique pour les références TK-YYYY-XXXXXX
CREATE TABLE IF NOT EXISTS ticket_sequence (
    sequence_year INT NOT NULL,
    last_value BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (sequence_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table principale des tickets
CREATE TABLE IF NOT EXISTS tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(32) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    category VARCHAR(32) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    requester_id BIGINT NOT NULL,
    assignee_id BIGINT NULL,
    booking_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    resolved_at DATETIME(6) NULL,
    closed_at DATETIME(6) NULL,
    CONSTRAINT uk_ticket_reference UNIQUE (reference),
    CONSTRAINT fk_ticket_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des messages du fil de discussion
CREATE TABLE IF NOT EXISTS ticket_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_ticket_msg_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_msg_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table des métadonnées de pièces jointes (URLs prêtes pour futur stockage fichier)
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(100) NULL,
    size BIGINT NULL,
    CONSTRAINT fk_ticket_attachment_message FOREIGN KEY (message_id) REFERENCES ticket_messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Création idempotente des index utiles
DELIMITER $$
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists $$
CREATE PROCEDURE CreateIndexIfNotExists(
    IN target_table VARCHAR(64),
    IN index_name VARCHAR(64),
    IN index_columns VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = target_table
          AND index_name = index_name
    ) THEN
        SET @stmt = CONCAT('CREATE INDEX `', index_name, '` ON `', target_table, '` (', index_columns, ')');
        PREPARE s FROM @stmt;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END $$
DELIMITER ;

CALL CreateIndexIfNotExists('tickets', 'idx_ticket_requester', 'requester_id');
CALL CreateIndexIfNotExists('tickets', 'idx_ticket_assignee', 'assignee_id');
CALL CreateIndexIfNotExists('tickets', 'idx_ticket_status', 'status');
CALL CreateIndexIfNotExists('tickets', 'idx_ticket_created', 'created_at');
CALL CreateIndexIfNotExists('tickets', 'idx_ticket_priority', 'priority');

CALL CreateIndexIfNotExists('ticket_messages', 'idx_ticket_msg_ticket', 'ticket_id');
CALL CreateIndexIfNotExists('ticket_messages', 'idx_ticket_msg_author', 'author_id');
CALL CreateIndexIfNotExists('ticket_messages', 'idx_ticket_msg_created', 'created_at');

CALL CreateIndexIfNotExists('ticket_attachments', 'idx_ticket_attachment_msg', 'message_id');

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

