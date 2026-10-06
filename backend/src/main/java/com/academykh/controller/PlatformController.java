package com.academykh.controller;

import com.academykh.model.DropdownOptionIds;
import com.academykh.repository.AppUserRepository;
import com.academykh.repository.TestAttemptRepository;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/platform")
public class PlatformController {
    private final AppUserRepository appUserRepository;
    private final TestAttemptRepository testAttemptRepository;

    public PlatformController(AppUserRepository appUserRepository, TestAttemptRepository testAttemptRepository) {
        this.appUserRepository = appUserRepository;
        this.testAttemptRepository = testAttemptRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return Map.of(
            "students", appUserRepository.countByRoleOptionId(DropdownOptionIds.ROLE_STUDENT),
            "teachers", appUserRepository.countByRoleOptionId(DropdownOptionIds.ROLE_TEACHER),
            "attempts", testAttemptRepository.count()
        );
    }
}
