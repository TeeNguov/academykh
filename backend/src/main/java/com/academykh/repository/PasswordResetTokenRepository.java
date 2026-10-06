package com.academykh.repository;

import com.academykh.model.PasswordResetToken;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
        update PasswordResetToken token
        set token.usedAt = :usedAt,
            token.resetUrl = null
        where token.user.id = :userId
        and token.usedAt is null
        """)
    void markUnusedTokensUsedForUser(@Param("userId") Long userId, @Param("usedAt") Instant usedAt);
}
