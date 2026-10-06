package com.academykh.controller;

import com.academykh.model.AppUser;
import com.academykh.model.DropdownOptionIds;
import com.academykh.repository.AppUserRepository;
import com.academykh.repository.DropdownOptionRepository;
import com.academykh.service.AuthCookieService;
import com.academykh.service.PasswordResetService;
import com.academykh.service.TurnstileService;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppUserRepository appUserRepository;
    private final DropdownOptionRepository dropdownOptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthCookieService authCookieService;
    private final TurnstileService turnstileService;
    private final PasswordResetService passwordResetService;

    @Value("${app.cookie-name}")
    private String cookieName;

    @Value("${app.cookie-secure}")
    private boolean cookieSecure;

    @Value("${app.cookie-same-site}")
    private String cookieSameSite;

    public AuthController(
        AppUserRepository appUserRepository,
        DropdownOptionRepository dropdownOptionRepository,
        PasswordEncoder passwordEncoder,
        AuthCookieService authCookieService,
        TurnstileService turnstileService,
        PasswordResetService passwordResetService
    ) {
        this.appUserRepository = appUserRepository;
        this.dropdownOptionRepository = dropdownOptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.authCookieService = authCookieService;
        this.turnstileService = turnstileService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, Object> request, HttpServletResponse response) {
        verifyTurnstile(request);
        String name = requiredString(request, "name");
        String email = requiredString(request, "email").trim().toLowerCase();
        String password = requiredString(request, "password");
        Long roleOptionId = roleOptionId(request.get("role"));

        if (password.length() < 6) {
            throw new IllegalArgumentException("Password needs at least 6 characters.");
        }
        if (appUserRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        AppUser user = new AppUser();
        user.setName(name.trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRoleOption(dropdownOptionRepository.getReferenceById(roleOptionId));

        AppUser savedUser = appUserRepository.save(user);
        setAuthCookie(response, savedUser);
        return userBody(savedUser);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> request, HttpServletResponse response) {
        verifyTurnstile(request);
        String email = requiredString(request, "email").trim().toLowerCase();
        String password = requiredString(request, "password");
        AppUser user = appUserRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        setAuthCookie(response, user);
        return userBody(user);
    }

    @GetMapping("/me")
    public Map<String, Object> me(
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie,
        HttpServletResponse response
    ) {
        AppUser user = userFromCookie(authCookie);
        if (user == null) {
            if (authCookie != null && !authCookie.isBlank()) {
                clearAuthCookie(response);
            }
            return Map.of("authenticated", false);
        }

        Map<String, Object> body = userBody(user);
        body.put("authenticated", true);
        return body;
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletResponse response) {
        clearAuthCookie(response);
        return Map.of("status", "ok");
    }

    private void clearAuthCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite(cookieSameSite)
            .path("/")
            .maxAge(0)
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/password/reset/request")
    public Map<String, String> requestPasswordReset(@RequestBody Map<String, Object> request) {
        return passwordResetService.requestReset(request);
    }

    @PostMapping("/password/reset/confirm")
    public Map<String, String> confirmPasswordReset(@RequestBody Map<String, Object> request) {
        return passwordResetService.confirmReset(request);
    }

    private void setAuthCookie(HttpServletResponse response, AppUser user) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, authCookieService.signedUserId(user.getId()))
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite(cookieSameSite)
            .path("/")
            .maxAge(Duration.ofHours(8))
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private AppUser userFromCookie(String authCookie) {
        return authCookieService.userFromCookie(authCookie);
    }

    private Map<String, Object> userBody(AppUser user) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", user.getId());
        body.put("name", user.getName());
        body.put("email", user.getEmail());
        body.put("role", user.roleValue());
        body.put("createdAt", user.getCreatedAt());
        return body;
    }

    private Long roleOptionId(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        String role = value == null ? "" : String.valueOf(value);
        if (role.equalsIgnoreCase("TEACHER")) {
            return DropdownOptionIds.ROLE_TEACHER;
        }
        if (role.equalsIgnoreCase("STUDENT") || role.isBlank()) {
            return DropdownOptionIds.ROLE_STUDENT;
        }
        return Long.parseLong(role);
    }

    private void verifyTurnstile(Map<String, Object> request) {
        Object token = request.get("turnstileToken");
        if (token == null) {
            token = request.get("cf-turnstile-response");
        }
        turnstileService.verify(token == null ? null : String.valueOf(token));
    }

    private String requiredString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException(key + " is required.");
        }
        return String.valueOf(value);
    }
}
