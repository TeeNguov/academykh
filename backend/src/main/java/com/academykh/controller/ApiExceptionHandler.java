package com.academykh.controller;

import jakarta.persistence.EntityNotFoundException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.GONE)
    public Map<String, String> gone(IllegalStateException exception) {
        return Map.of("message", exception.getMessage());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> notFound(EntityNotFoundException exception) {
        return Map.of("message", exception.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> badRequest(IllegalArgumentException exception) {
        return Map.of("message", exception.getMessage());
    }
}
