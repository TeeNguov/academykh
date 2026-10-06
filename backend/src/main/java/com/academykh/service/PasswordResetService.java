package com.academykh.service;

import com.academykh.model.AppUser;
import com.academykh.model.PasswordResetToken;
import com.academykh.repository.AppUserRepository;
import com.academykh.repository.PasswordResetTokenRepository;
import jakarta.transaction.Transactional;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {
    private static final String GENERIC_RESPONSE = "If an account exists, a password reset link has been created.";
    private final SecureRandom secureRandom = new SecureRandom();
    private final AppUserRepository appUserRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public PasswordResetService(
        AppUserRepository appUserRepository,
        PasswordResetTokenRepository passwordResetTokenRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Map<String, String> requestReset(Map<String, Object> request) {
        String email = optionalString(request.get("email")).trim().toLowerCase();
        if (!email.isBlank()) {
            appUserRepository.findByEmail(email).ifPresent(this::createResetToken);
        }
        return Map.of("message", GENERIC_RESPONSE);
    }

    @Transactional
    public Map<String, String> confirmReset(Map<String, Object> request) {
        String token = requiredString(request, "token");
        String password = requiredString(request, "password");
        if (password.length() < 6) {
            throw new IllegalArgumentException("Password needs at least 6 characters.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash(token))
            .orElseThrow(() -> new IllegalArgumentException("This password reset link is invalid or expired."));

        Instant now = Instant.now();
        if (resetToken.getUsedAt() != null || resetToken.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException("This password reset link is invalid or expired.");
        }
        AppUser user = resetToken.getUser();
        if (user == null) {
            throw new IllegalArgumentException("This password reset link is invalid or expired.");
        }

        user.setPasswordHash(passwordEncoder.encode(password));
        resetToken.setUsedAt(now);
        resetToken.setResetUrl(null);
        passwordResetTokenRepository.markUnusedTokensUsedForUser(user.getId(), now);
        resetToken.setUsedAt(now);
        resetToken.setResetUrl(null);

        return Map.of("message", "Password updated. You can sign in with your new password.");
    }

    private void createResetToken(AppUser user) {
        Instant now = Instant.now();
        passwordResetTokenRepository.markUnusedTokensUsedForUser(user.getId(), now);

        String token = rawToken();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenHash(token));
        resetToken.setResetUrl(normalizedFrontendUrl() + "/reset/password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8));
        resetToken.setExpiresAt(now.plus(45, ChronoUnit.MINUTES));
        resetToken.setCreatedAt(now);
        passwordResetTokenRepository.save(resetToken);
    }

    private String rawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String tokenHash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is not available.", error);
        }
    }

    private String normalizedFrontendUrl() {
        String value = frontendUrl == null || frontendUrl.isBlank() ? "https://academykh.jaekjay.com" : frontendUrl.trim();
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String optionalString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String requiredString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException(key + " is required.");
        }
        return String.valueOf(value);
    }
}
