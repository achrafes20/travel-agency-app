-- Phase 7 : Tickets de support

CREATE TABLE IF NOT EXISTS ticket_sequence (
    sequence_year INT NOT NULL,
    last_value BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (sequence_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_ticket_requester (requester_id),
    INDEX idx_ticket_assignee (assignee_id),
    INDEX idx_ticket_status (status),
    INDEX idx_ticket_created (created_at),
    INDEX idx_ticket_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_ticket_msg_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_msg_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket_msg_ticket (ticket_id),
    INDEX idx_ticket_msg_author (author_id),
    INDEX idx_ticket_msg_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(100) NULL,
    size BIGINT NULL,
    CONSTRAINT fk_ticket_attachment_message FOREIGN KEY (message_id) REFERENCES ticket_messages(id) ON DELETE CASCADE,
    INDEX idx_ticket_attachment_msg (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

