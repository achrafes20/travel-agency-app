package com.agence.voyage.profile;

import com.agence.voyage.config.AuthAccountProperties;
import com.agence.voyage.dto.*;
import com.agence.voyage.entity.*;
import com.agence.voyage.entity.Role;
import com.agence.voyage.event.AccountMailEvent;
import com.agence.voyage.repository.*;
import com.agence.voyage.security.*;
import com.agence.voyage.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.*;
import org.springframework.context.annotation.*;
import org.springframework.context.event.EventListener;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Import(AccountSecurityIntegrationTest.TimeConfig.class)
class AccountSecurityIntegrationTest {
    static class MutableClock extends Clock {Instant instant=Instant.parse("2026-10-31T12:00:00Z");public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return instant;}}
    static class Outbox {final Queue<AccountMailEvent> events=new ConcurrentLinkedQueue<>();@EventListener public void record(AccountMailEvent e){events.add(e);}}
    @TestConfiguration static class TimeConfig {@Bean @Primary MutableClock accountClock(){return new MutableClock();}@Bean Outbox outbox(){return new Outbox();}}
    @Autowired MockMvc mvc;@Autowired UserRepository users;@Autowired PasswordResetTokenRepository resets;@Autowired EmailVerificationTokenRepository verifications;
    @Autowired PasswordEncoder encoder;@Autowired JwtService jwt;@Autowired ObjectMapper json;@Autowired AccountSecurityService service;
    @Autowired MemoryAuthRequestLimiter limiter;@Autowired MutableClock clock;@Autowired Outbox outbox;@Autowired PlatformTransactionManager manager;
    @Autowired com.agence.voyage.config.AppProperties application;
    @MockBean MailService mail;@SpyBean AuthAccountProperties properties;
    User client;
    @BeforeEach void setup(){clock.instant=Instant.parse("2026-10-31T12:00:00Z");limiter.clear();outbox.events.clear();reset(mail);doReturn(false).when(properties).requireEmailVerification();
        client=new User("Client compte","account-"+UUID.randomUUID()+"@test.ma",encoder.encode("password123"),Role.CLIENT);client.setEmailVerified(true);client=users.saveAndFlush(client);}
    String token(){return jwt.generateToken(users.findById(client.getId()).orElseThrow());}
    ResultActions postJson(String path,Object body,String token)throws Exception{return mvc.perform(post(path).contentType("application/json").content(json.writeValueAsString(body)).header("Authorization",token==null?"":"Bearer "+token));}
    String raw(String subject){return outbox.events.stream().filter(e->e.to().equals(client.getEmail())&&e.subject().equals(subject)).reduce((a,b)->b).map(e->{Matcher m=Pattern.compile("token=([A-Za-z0-9_-]{43})").matcher(e.text());assertTrue(m.find());return m.group(1);}).orElseThrow();}
    void forgot()throws Exception{postJson("/api/auth/forgot-password",Map.of("email",client.getEmail()),null).andExpect(status().isOk());}
    void update(java.util.function.Consumer<User> change){new TransactionTemplate(manager).execute(s->{change.accept(users.findById(client.getId()).orElseThrow());return null;});}
    Map<String,String> change(String current,String next,String confirm){return Map.of("currentPassword",current,"newPassword",next,"confirmNewPassword",confirm);}
    @Test void changeReturnsWorkingTokenAndRevokesOldToken()throws Exception{
        String old=token();var result=postJson("/api/auth/change-password",change("password123","Atlas!Voyage2026","Atlas!Voyage2026"),old).andExpect(status().isOk()).andReturn();
        String fresh=json.readTree(result.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(get("/api/auth/me").header("Authorization","Bearer "+old)).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("TOKEN_REVOKED"));
        mvc.perform(get("/api/auth/me").header("Authorization","Bearer "+fresh)).andExpect(status().isOk());assertEquals(1,users.findById(client.getId()).orElseThrow().getTokenVersion());
        assertTrue(outbox.events.stream().anyMatch(e->e.subject().equals("Mot de passe modifié")));
    }
    @Test void wrongCurrentSamePasswordAndDifferentConfirmationRefused()throws Exception{
        postJson("/api/auth/change-password",change("wrong","Atlas!Voyage2026","Atlas!Voyage2026"),token()).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_CURRENT_PASSWORD"));
        postJson("/api/auth/change-password",change("password123","password123","password123"),token()).andExpect(status().isBadRequest());
        postJson("/api/auth/change-password",change("password123","Atlas!Voyage2026","Other!Voyage2026"),token()).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PASSWORD_CONFIRMATION_MISMATCH"));
    }
    @Test void legacyJwtWithoutVersionIsRefused()throws Exception{
        String legacy=io.jsonwebtoken.Jwts.builder().subject(client.getEmail()).claim("userId",client.getId()).issuedAt(new Date()).expiration(new Date(System.currentTimeMillis()+60000))
            .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(io.jsonwebtoken.io.Decoders.BASE64.decode(application.jwt().secret()))).compact();
        mvc.perform(get("/api/auth/me").header("Authorization","Bearer "+legacy)).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("TOKEN_REVOKED"));
    }
    @Test void forgotKnownAndUnknownHaveIdenticalResponse()throws Exception{
        String known=postJson("/api/auth/forgot-password",Map.of("email",client.getEmail()),null).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String missing=postJson("/api/auth/forgot-password",Map.of("email","unknown-"+UUID.randomUUID()+"@test.ma"),null).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();assertEquals(known,missing);
        String raw=raw("Réinitialiser votre mot de passe");assertEquals(43,raw.length());assertTrue(resets.findByTokenHash(AccountTokens.hash(raw)).isPresent());
        assertTrue(resets.findAll().stream().noneMatch(t->t.tokenHash.equals(raw)));
    }
    @Test void resetIsSingleUseAndRevokesJwt()throws Exception{
        String old=token();forgot();String raw=raw("Réinitialiser votre mot de passe");var body=Map.of("token",raw,"newPassword","Atlas!Voyage2026","confirmNewPassword","Atlas!Voyage2026");
        postJson("/api/auth/reset-password",body,null).andExpect(status().isOk());postJson("/api/auth/reset-password",body,null).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_OR_EXPIRED_TOKEN"));
        mvc.perform(get("/api/auth/me").header("Authorization","Bearer "+old)).andExpect(status().isUnauthorized());assertTrue(encoder.matches("Atlas!Voyage2026",users.findById(client.getId()).orElseThrow().getPassword()));
    }
    @Test void resetExpiresAtExactlyThirtyMinutes()throws Exception{
        forgot();String raw=raw("Réinitialiser votre mot de passe");clock.instant=clock.instant.plusSeconds(1800);
        postJson("/api/auth/reset-password",Map.of("token",raw,"newPassword","Atlas!Voyage2026","confirmNewPassword","Atlas!Voyage2026"),null).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_OR_EXPIRED_TOKEN"));
    }
    @Test void newRequestInvalidatesPreviousToken()throws Exception{
        forgot();String first=raw("Réinitialiser votre mot de passe");forgot();String next=raw("Réinitialiser votre mot de passe");assertNotEquals(first,next);
        postJson("/api/auth/reset-password",Map.of("token",first,"newPassword","Atlas!Voyage2026","confirmNewPassword","Atlas!Voyage2026"),null).andExpect(status().isBadRequest());
    }
    @Test void archivedAccountReceivesNoReset()throws Exception{
        update(u->u.setArchived(true));forgot();assertTrue(outbox.events.isEmpty());
    }
    @Test void rateLimitHasRetryAfterAndResetsAfterWindow()throws Exception{
        for(int i=0;i<5;i++)forgot();
        mvc.perform(post("/api/auth/forgot-password").header("Origin","http://127.0.0.1:5500")
            .contentType("application/json").content(json.writeValueAsString(Map.of("email",client.getEmail()))))
            .andExpect(status().isTooManyRequests()).andExpect(header().exists("Retry-After"))
            .andExpect(header().string("Access-Control-Expose-Headers",org.hamcrest.Matchers.containsString("Retry-After")));
        clock.instant=clock.instant.plusSeconds(901);forgot();
    }
    @Test void registerCreatesVerificationAndVerifyIsSingleUse()throws Exception{
        String email="new-"+UUID.randomUUID()+"@test.ma";client.setEmail(email);
        var result=postJson("/api/auth/register",Map.of("fullName","Nom <script>","email",email,"password","Atlas!Voyage2026","role","ADMIN"),null).andExpect(status().isCreated()).andExpect(jsonPath("$.user.role").value("CLIENT")).andExpect(jsonPath("$.user.emailVerified").value(false)).andReturn();
        String raw=raw("Vérifiez votre adresse e-mail");assertTrue(verifications.findByTokenHash(AccountTokens.hash(raw)).isPresent());
        postJson("/api/auth/verify-email",Map.of("token",raw),null).andExpect(status().isOk());postJson("/api/auth/verify-email",Map.of("token",raw),null).andExpect(status().isBadRequest());
        assertTrue(users.findByEmailIgnoreCase(email).orElseThrow().isEmailVerified());
        assertTrue(outbox.events.stream().filter(e->e.to().equals(email)).allMatch(e->!e.html().contains("<script>")));
    }
    @Test void verificationExpiresAndResendIsLimited()throws Exception{
        update(u->u.setEmailVerified(false));for(int i=0;i<5;i++)postJson("/api/auth/resend-verification",Map.of(),token()).andExpect(status().isOk());
        postJson("/api/auth/resend-verification",Map.of(),token()).andExpect(status().isTooManyRequests());String raw=raw("Vérifiez votre adresse e-mail");
        clock.instant=clock.instant.plusSeconds(86400);postJson("/api/auth/verify-email",Map.of("token",raw),null).andExpect(status().isBadRequest());
    }
    @Test void optionalVerificationGateAndLegacyDemoLogin()throws Exception{
        postJson("/api/auth/login",Map.of("email",client.getEmail(),"password","password123"),null).andExpect(status().isOk());
        update(u->u.setEmailVerified(false));doReturn(true).when(properties).requireEmailVerification();
        postJson("/api/auth/login",Map.of("email",client.getEmail(),"password","password123"),null).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));
        doReturn(false).when(properties).requireEmailVerification();postJson("/api/auth/login",Map.of("email",client.getEmail(),"password","password123"),null).andExpect(status().isOk());
    }
    @Test void smtpFailureNeverBreaksBusiness()throws Exception{
        doThrow(new IllegalStateException("SMTP indisponible")).when(mail).send(any(),any(),any(),any());forgot();
        postJson("/api/auth/register",Map.of("fullName","Inscription durable","email","mail-failed-"+UUID.randomUUID()+"@test.ma","password","Atlas!Voyage2026"),null).andExpect(status().isCreated());
    }
    @Test void weakRegistrationReturnsRulesButLoginNeverUsesPolicy()throws Exception{
        postJson("/api/auth/register",Map.of("fullName","Inscription faible","email","weak-"+UUID.randomUUID()+"@test.ma","password","password123"),null).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PASSWORD_POLICY_VIOLATION")).andExpect(jsonPath("$.details[0].field").value("newPassword"));
        postJson("/api/auth/login",Map.of("email",client.getEmail(),"password","password123"),null).andExpect(status().isOk());
    }
    @Test void tokenPurgeRemovesUsedAndExpiredOnly()throws Exception{
        forgot();String raw=raw("Réinitialiser votre mot de passe");clock.instant=clock.instant.plusSeconds(1801);service.purge();assertTrue(resets.findByTokenHash(AccountTokens.hash(raw)).isEmpty());
    }
    @Test void resetRateLimitAppliesToInvalidTokens()throws Exception{
        var body=Map.of("token","unknown-token","newPassword","Atlas!Voyage2026","confirmNewPassword","Atlas!Voyage2026");
        for(int i=0;i<5;i++)postJson("/api/auth/reset-password",body,null).andExpect(status().isBadRequest());
        postJson("/api/auth/reset-password",body,null).andExpect(status().isTooManyRequests()).andExpect(header().exists("Retry-After"));
    }
    @Test void concurrentResetConsumesTokenOnlyOnce()throws Exception{
        forgot();var request=new AccountRequests.ResetPassword(raw("Réinitialiser votre mot de passe"),"Atlas!Voyage2026","Atlas!Voyage2026");
        var pool=Executors.newFixedThreadPool(4);var start=new CountDownLatch(1);
        try{var futures=new ArrayList<Future<Boolean>>();for(int i=0;i<4;i++)futures.add(pool.submit(()->{start.await();try{service.reset(request);return true;}catch(com.agence.voyage.exception.BusinessException ex){assertEquals(com.agence.voyage.exception.ErrorCode.INVALID_OR_EXPIRED_TOKEN,ex.getCode());return false;}}));start.countDown();int successes=0;for(var f:futures)if(f.get(10,TimeUnit.SECONDS))successes++;assertEquals(1,successes);}
        finally{pool.shutdownNow();}
    }
}
