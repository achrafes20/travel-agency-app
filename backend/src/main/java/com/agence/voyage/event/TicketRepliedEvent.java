package com.agence.voyage.event;
public record TicketRepliedEvent(String eventId,Long ticketId,String reference,Long requesterId,Long assignedId,
 Long authorId,String subject,String replyPreview) {}
