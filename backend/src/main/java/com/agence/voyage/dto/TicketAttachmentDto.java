package com.agence.voyage.dto;

import com.agence.voyage.entity.TicketAttachment;
import jakarta.validation.constraints.Size;

public record TicketAttachmentDto(
    Long id,
    @Size(max = 255) String name,
    @Size(max = 1000) String url,
    @Size(max = 100) String mimeType,
    Long size
) {
    public static TicketAttachmentDto from(TicketAttachment attachment) {
        if (attachment == null) {
            return null;
        }
        return new TicketAttachmentDto(
            attachment.getId(),
            attachment.getName(),
            attachment.getUrl(),
            attachment.getMimeType(),
            attachment.getSize()
        );
    }
}

