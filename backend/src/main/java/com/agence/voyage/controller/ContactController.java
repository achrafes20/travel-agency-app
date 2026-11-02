package com.agence.voyage.controller;

import com.agence.voyage.dto.ContactRequest;
import com.agence.voyage.entity.ContactMessage;
import com.agence.voyage.repository.ContactMessageRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private static final Logger log = LoggerFactory.getLogger(ContactController.class);

    private final ContactMessageRepository contactMessageRepository;

    public ContactController(ContactMessageRepository contactMessageRepository) {
        this.contactMessageRepository = contactMessageRepository;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitContact(
            @Valid @RequestBody ContactRequest request,
            HttpServletRequest httpRequest) {

        // Anti-spam Honeypot : si le champ caché est rempli, on feint le succès sans enregistrer
        if (request.get_hp() != null && !request.get_hp().trim().isEmpty()) {
            log.warn("Spambot honeypot détecté pour l'email={}", request.getEmail());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Votre message a bien été envoyé. Notre équipe vous répondra sous 24h."
            ));
        }

        ContactMessage msg = new ContactMessage();
        msg.setName(request.getName().trim());
        msg.setEmail(request.getEmail().trim().toLowerCase());
        msg.setSubject(request.getSubject().trim());
        msg.setMessage(request.getMessage().trim());

        String ip = httpRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = httpRequest.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        msg.setIpAddress(ip);

        contactMessageRepository.save(msg);
        log.info("Message de contact reçu de {} ({}) : {}", msg.getName(), msg.getEmail(), msg.getSubject());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Votre message a bien été envoyé. Notre équipe vous répondra sous 24h."
        ));
    }
}

