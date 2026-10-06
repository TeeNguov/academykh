package com.academykh.controller;

import com.academykh.service.StudentDashboardService;
import java.util.Map;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class StudentDashboardController {
    private final StudentDashboardService studentDashboardService;

    public StudentDashboardController(StudentDashboardService studentDashboardService) {
        this.studentDashboardService = studentDashboardService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard(@CookieValue(name = "${app.cookie-name}", required = false) String authCookie) {
        return studentDashboardService.getDashboard(authCookie);
    }
}
