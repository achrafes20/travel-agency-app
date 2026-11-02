package com.agence.voyage.controller;
import com.agence.voyage.dto.*;
import com.agence.voyage.security.AppUserDetails;
import com.agence.voyage.service.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController @RequestMapping("/api/auth") @Tag(name="Sécurité du compte")
public class AccountSecurityController {
    private final AccountSecurityService service;private final AuthRequestLimiter limiter;
    public AccountSecurityController(AccountSecurityService service,AuthRequestLimiter limiter){this.service=service;this.limiter=limiter;}
    @PostMapping("/change-password") @Operation(summary="Changer mon mot de passe et révoquer les anciennes sessions")
    public AuthResponse change(@AuthenticationPrincipal AppUserDetails u,@Valid @RequestBody AccountRequests.ChangePassword r){return service.change(u.getId(),r);}
    @PostMapping("/forgot-password") @Operation(summary="Demander un lien de réinitialisation",description="Public. Réponse identique pour compte connu/inconnu ; 5 demandes/15 minutes par IP et e-mail.")
    public AccountRequests.Message forgot(@Valid @RequestBody AccountRequests.ForgotPassword r,HttpServletRequest request){limiter.check("forgot",request.getRemoteAddr(),r.email());service.forgot(r.email(),request.getRemoteAddr());return new AccountRequests.Message(AccountSecurityService.GENERIC_RESET);}
    @PostMapping("/reset-password") @Operation(summary="Réinitialiser le mot de passe avec un lien à usage unique")
    public AccountRequests.Message reset(@Valid @RequestBody AccountRequests.ResetPassword r,HttpServletRequest request){limiter.check("reset",request.getRemoteAddr(),service.resetIdentity(r.token()));service.reset(r);return new AccountRequests.Message("Votre mot de passe a été réinitialisé. Connectez-vous avec le nouveau mot de passe.");}
    @PostMapping("/verify-email") @Operation(summary="Vérifier l'adresse e-mail avec un lien à usage unique")
    public AccountRequests.Message verify(@Valid @RequestBody AccountRequests.VerifyEmail r,HttpServletRequest request){limiter.check("verify",request.getRemoteAddr(),r.token());service.verify(r.token());return new AccountRequests.Message("Votre adresse e-mail est vérifiée.");}
    @PostMapping("/resend-verification") @Operation(summary="Renvoyer le lien de vérification",description="Authentifié ; limité en débit ; le jeton brut est envoyé uniquement par e-mail.")
    public AccountRequests.Message resend(@AuthenticationPrincipal AppUserDetails u,HttpServletRequest request){limiter.check("resend",request.getRemoteAddr(),u.getId().toString());service.resend(u.getId());return new AccountRequests.Message("Si votre adresse nécessite une vérification, un nouveau lien vous a été envoyé.");}
}
