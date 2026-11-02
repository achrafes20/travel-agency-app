package com.agence.voyage.service;

import com.agence.voyage.config.*;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.event.*;
import com.agence.voyage.exception.*;
import com.agence.voyage.repository.*;
import com.agence.voyage.security.*;
import jakarta.persistence.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;
import java.time.*;

@Service @Transactional
public class AccountSecurityService {
    public static final String GENERIC_RESET="Si ce compte est disponible, un lien de réinitialisation vous sera envoyé.";
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(AccountSecurityService.class);
    private final ProfileService profiles;private final UserRepository users;private final PasswordResetTokenRepository resets;
    private final EmailVerificationTokenRepository verifications;private final PasswordEncoder passwords;private final JwtService jwt;
    private final com.agence.voyage.repository.RefreshTokenRepository refreshTokenRepository; private final AuthAccountProperties properties;private final FrontendProperties frontend;private final Clock clock;private final ApplicationEventPublisher events;
    @PersistenceContext EntityManager em;
    public AccountSecurityService(ProfileService profiles,UserRepository users,PasswordResetTokenRepository resets,EmailVerificationTokenRepository verifications,
        PasswordEncoder passwords,JwtService jwt,AuthAccountProperties properties,FrontendProperties frontend,Clock clock,ApplicationEventPublisher events,@org.springframework.lang.Nullable com.agence.voyage.repository.RefreshTokenRepository refreshTokenRepository){
        this.profiles=profiles;this.users=users;this.resets=resets;this.verifications=verifications;this.passwords=passwords;this.jwt=jwt;this.properties=properties;this.frontend=frontend;this.clock=clock;this.events=events;this.refreshTokenRepository=refreshTokenRepository;
    }
    private LocalDateTime now(){return LocalDateTime.now(clock);}
    private void confirmation(String first,String second){if(!first.equals(second))throw new BusinessException(ErrorCode.PASSWORD_CONFIRMATION_MISMATCH,"La confirmation du mot de passe est différente");}
    private void setPassword(User u,String value){u.setPassword(passwords.encode(value));u.setTokenVersion(Math.addExact(u.getTokenVersion(),1));u.setPasswordChangedAt(now());u.setUpdatedAt(now());resets.invalidate(u.getId(),now());if(refreshTokenRepository!=null)refreshTokenRepository.revokeAllForUser(u.getId(),now());}
    public AuthResponse change(Long actor,AccountRequests.ChangePassword r){
        User u=profiles.actor(actor);
        if(r.currentPassword().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72||!passwords.matches(r.currentPassword(),u.getPassword()))throw new BusinessException(ErrorCode.INVALID_CURRENT_PASSWORD,"Le mot de passe actuel est incorrect");
        confirmation(r.newPassword(),r.confirmNewPassword());
        PasswordPolicy.require(r.newPassword(),u.getEmail());
        if(passwords.matches(r.newPassword(),u.getPassword()))throw new BusinessException(ErrorCode.PASSWORD_POLICY_VIOLATION,"Le nouveau mot de passe doit être différent de l'ancien");
        setPassword(u,r.newPassword());
        mail(u,"Mot de passe modifié","Votre mot de passe a été modifié. Si vous n'êtes pas à l'origine de cette action, contactez le support.",null);
        log.info("password_changed userId={}",u.getId());return new AuthResponse(jwt.generateToken(u),UserResponse.from(u));
    }
    public void forgot(String email,String ip){
        // Même résultat HTTP, même texte, aucun compte ni jeton dans les journaux de production.
        User found=users.findByEmailIgnoreCase(email.strip()).orElse(null);
        if(found==null||found.isArchived())return;
        User u=users.lockNotificationRecipient(found.getId()).orElse(null);if(u==null||u.isArchived())return;
        resets.invalidate(u.getId(),now());String token=AccountTokens.create();
        PasswordResetToken saved=new PasswordResetToken();saved.user=u;saved.tokenHash=AccountTokens.hash(token);saved.createdAt=now();saved.expiresAt=now().plusMinutes(properties.resetTokenTtlMinutes());
        saved.requestIp=ip==null?null:ip.substring(0,Math.min(64,ip.length()));resets.save(saved);
        mail(u,"Réinitialiser votre mot de passe","Ce lien est valable "+properties.resetTokenTtlMinutes()+" minutes et ne peut être utilisé qu'une fois.",link("reinitialiser-mot-de-passe.html",token));
        log.info("password_reset_requested");
    }
    public void reset(AccountRequests.ResetPassword r){
        PasswordResetToken token=resets.findByTokenHash(AccountTokens.hash(r.token())).orElseThrow(this::invalidToken);
        User u=tokenUser(token.user.getId());em.refresh(token,LockModeType.PESSIMISTIC_WRITE);
        if(token.usedAt!=null||!token.expiresAt.isAfter(now())||u.isArchived())throw invalidToken();
        confirmation(r.newPassword(),r.confirmNewPassword());PasswordPolicy.require(r.newPassword(),u.getEmail());
        if(passwords.matches(r.newPassword(),u.getPassword()))throw new BusinessException(ErrorCode.PASSWORD_POLICY_VIOLATION,"Le nouveau mot de passe doit être différent de l'ancien");
        setPassword(u,r.newPassword());token.usedAt=now();
        mail(u,"Mot de passe réinitialisé","Votre mot de passe a été réinitialisé et vos anciennes sessions ont été déconnectées.",null);
        log.info("password_reset_completed userId={}",u.getId());
    }
    @Transactional(readOnly=true)
    public String resetIdentity(String token){return resets.findByTokenHash(AccountTokens.hash(token)).map(t->"account:"+t.user.getId()).orElse("unknown:"+AccountTokens.hash(token));}
    @EventListener
    public void registered(AccountRegisteredEvent event){
        User u=profiles.actor(event.userId());u.setEmailVerified(false);issueVerification(u);
    }
    public void resend(Long actor){User u=profiles.actor(actor);if(!u.isEmailVerified())issueVerification(u);}
    private void issueVerification(User u){
        verifications.invalidate(u.getId(),now());String token=AccountTokens.create();
        EmailVerificationToken saved=new EmailVerificationToken();saved.user=u;saved.tokenHash=AccountTokens.hash(token);saved.createdAt=now();saved.expiresAt=now().plusHours(properties.verifyTokenTtlHours());verifications.save(saved);
        mail(u,"Vérifiez votre adresse e-mail","Confirmez votre adresse grâce à ce lien valable "+properties.verifyTokenTtlHours()+" heures.",link("verification-email.html",token));
    }
    public void verify(String raw){
        EmailVerificationToken token=verifications.findByTokenHash(AccountTokens.hash(raw)).orElseThrow(this::invalidToken);
        User u=tokenUser(token.user.getId());em.refresh(token,LockModeType.PESSIMISTIC_WRITE);
        if(token.usedAt!=null||!token.expiresAt.isAfter(now()))throw invalidToken();
        token.usedAt=now();u.setEmailVerified(true);u.setUpdatedAt(now());verifications.invalidate(u.getId(),now());log.info("email_verified userId={}",u.getId());
    }
    private BusinessException invalidToken(){return new BusinessException(ErrorCode.INVALID_OR_EXPIRED_TOKEN,"Ce lien est invalide, expiré ou déjà utilisé");}
    private User tokenUser(Long id){return users.lockNotificationRecipient(id).filter(u->!u.isArchived()).orElseThrow(this::invalidToken);}
    private String link(String page,String token){return frontend.baseUrl().replaceAll("/$","")+"/"+page+"?token="+token;}
    private void mail(User u,String subject,String text,String link){
        String name=u.getFullName()==null?"":u.getFullName();String plain="Bonjour "+name+",\n\n"+text+(link==null?"":"\n"+link)+"\n\nAtlas Voyage";
        String html="<!doctype html><html lang=\"fr\"><body style=\"font:16px Arial;background:#f4f6fa;padding:24px\"><main style=\"max-width:580px;margin:auto;background:white;padding:28px\"><h1 style=\"color:#0b3c8f\">Atlas Voyage</h1><p>Bonjour "+HtmlUtils.htmlEscape(name)+",</p><p>"+HtmlUtils.htmlEscape(text)+"</p>"+(link==null?"":"<p><a style=\"background:#0b3c8f;color:white;padding:12px;display:inline-block\" href=\""+HtmlUtils.htmlEscape(link)+"\">Continuer</a></p>")+"<p>Si vous n'avez rien demandé, ignorez ce message.</p></main></body></html>";
        events.publishEvent(new AccountMailEvent(u.getEmail(),subject,html,plain));
    }
    public void purge(){resets.purge(now());verifications.purge(now());}
}
