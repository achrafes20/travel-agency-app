package com.agence.voyage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReviewReplyRequest {

    @NotBlank(message = "La réponse est obligatoire")
    @Size(max = 2000, message = "La réponse ne doit pas dépasser 2000 caractères")
    private String reply;

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}

