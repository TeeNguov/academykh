package com.academykh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TurnstileService {
    private static final URI SITEVERIFY_URI = URI.create("https://challenges.cloudflare.com/turnstile/v0/siteverify");

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.turnstile-secret-key:}")
    private String secretKey;

    @Value("${app.turnstile-verify-enabled:false}")
    private boolean verifyEnabled;

    public TurnstileService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    }

    public void verify(String token) {
        if (!verifyEnabled || secretKey == null || secretKey.isBlank()) {
            return;
        }
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Security check is required.");
        }

        String body = "secret=" + encode(secretKey)
            + "&response=" + encode(token);

        HttpRequest request = HttpRequest.newBuilder(SITEVERIFY_URI)
            .timeout(Duration.ofSeconds(8))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode payload = objectMapper.readTree(response.body());
            if (!payload.path("success").asBoolean(false)) {
                throw new IllegalArgumentException("Security check failed. Please try again.");
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Security check could not be verified. Please try again.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Security check could not be verified. Please try again.", exception);
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
