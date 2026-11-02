package com.agence.voyage.controller;
import com.agence.voyage.service.PaymentWebhookService;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController @RequestMapping("/api/payments/webhook")
@Tag(name="Webhook Paiements",description="Public, protégé par HMAC-SHA256 et horodatage.")
public class PaymentWebhookController {
 private final PaymentWebhookService service;
 public PaymentWebhookController(PaymentWebhookService service){this.service=service;}
 @PostMapping @Operation(summary="Recevoir un événement sandbox signé")
 public PaymentWebhookService.Reply receive(@RequestBody byte[] body,@RequestHeader(value="X-Atlas-Signature",required=false)String signature,
  @RequestHeader(value="X-Atlas-Timestamp",required=false)String timestamp){return service.receive(body,signature,timestamp);}
}

