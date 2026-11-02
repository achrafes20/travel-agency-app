package com.agence.voyage.repository;
import com.agence.voyage.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.*;
import java.time.LocalDateTime;
import java.util.Optional;
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken,Long> {
    Optional<EmailVerificationToken> findByTokenHash(String hash);
    @Modifying @Query("update EmailVerificationToken t set t.usedAt=:now where t.user.id=:id and t.usedAt is null") int invalidate(Long id,LocalDateTime now);
    @Modifying @Query("delete from EmailVerificationToken t where t.expiresAt<:now or t.usedAt is not null") int purge(LocalDateTime now);
}
