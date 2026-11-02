package com.agence.voyage.repository;
import com.agence.voyage.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.*;
import java.time.LocalDateTime;
import java.util.Optional;
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken,Long> {
    Optional<PasswordResetToken> findByTokenHash(String hash);
    @Modifying @Query("update PasswordResetToken t set t.usedAt=:now where t.user.id=:id and t.usedAt is null") int invalidate(Long id,LocalDateTime now);
    @Modifying @Query("delete from PasswordResetToken t where t.expiresAt<:now or t.usedAt is not null") int purge(LocalDateTime now);
}
