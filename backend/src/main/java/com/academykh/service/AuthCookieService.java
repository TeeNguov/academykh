package com.academykh.service;

import com.academykh.model.AppUser;
import com.academykh.repository.AppUserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthCookieService {
    private final AppUserRepository appUserRepository;

    @Value("${app.cookie-secret}")
    private String cookieSecret;

    public AuthCookieService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public String signedUserId(Long userId) {
        String value = String.valueOf(userId);
        return value + "." + sign(value);
    }

    public AppUser userFromCookie(String authCookie) {
        if (authCookie == null || authCookie.isBlank()) {
            return null;
        }

        try {
            String[] parts = authCookie.split("\\.", 2);
            if (parts.length == 2 && signatureMatches(parts[0], parts[1])) {
                return appUserRepository.findById(Long.parseLong(parts[0])).orElse(null);
            }

            return appUserRepository.findById(Long.parseLong(authCookie)).orElse(null);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private boolean signatureMatches(String value, String signature) {
        byte[] expected = sign(value).getBytes(StandardCharsets.UTF_8);
        byte[] actual = signature.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, actual);
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(cookieSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not sign auth cookie.", exception);
        }
    }
}
