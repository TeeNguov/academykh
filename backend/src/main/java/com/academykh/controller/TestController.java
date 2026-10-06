package com.academykh.controller;

import com.academykh.service.TestService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {
    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    @GetMapping("/tests")
    public List<Map<String, Object>> listTests(@CookieValue(name = "${app.cookie-name}", required = false) String authCookie) {
        return testService.listTests(authCookie);
    }

    @GetMapping("/tests/{testId}")
    public Map<String, Object> getTest(@PathVariable Long testId) {
        return testService.getTest(testId);
    }

    @GetMapping("/admin/tests/{testId}")
    public Map<String, Object> getTestForEditing(
        @PathVariable Long testId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.getTestForEditing(testId, authCookie);
    }

    @PostMapping("/tests")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createTest(
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.createTest(request, authCookie);
    }

    @PutMapping("/tests/{testId}")
    public Map<String, Object> updateTest(
        @PathVariable Long testId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.updateTest(testId, request, authCookie);
    }

    @GetMapping("/admin/share/links")
    public List<Map<String, Object>> listShareLinks(@CookieValue(name = "${app.cookie-name}", required = false) String authCookie) {
        return testService.listShareLinks(authCookie);
    }

    @GetMapping("/admin/share/links/{shareLinkId}/attempts")
    public List<Map<String, Object>> listShareLinkAttempts(
        @PathVariable Long shareLinkId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.listShareLinkAttempts(shareLinkId, authCookie);
    }

    @GetMapping("/admin/share/links/{shareLinkId}/attempts/{attemptId}")
    public Map<String, Object> getShareLinkAttempt(
        @PathVariable Long shareLinkId,
        @PathVariable Long attemptId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.getShareLinkAttempt(shareLinkId, attemptId, authCookie);
    }

    @GetMapping("/admin/students")
    public List<Map<String, Object>> listTeacherStudents(
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.listTeacherStudents(authCookie);
    }

    @GetMapping("/admin/student/groups")
    public List<Map<String, Object>> listStudentGroups(
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.listStudentGroups(authCookie);
    }

    @PostMapping("/admin/student/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createStudentGroup(
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.createStudentGroup(request, authCookie);
    }

    @PutMapping("/admin/student/groups/{groupId}")
    public Map<String, Object> updateStudentGroup(
        @PathVariable Long groupId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.updateStudentGroup(groupId, request, authCookie);
    }

    @PostMapping("/tests/{testId}/share/links")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createShareLink(
        @PathVariable Long testId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.createShareLink(testId, request, authCookie);
    }

    @PostMapping("/admin/share/links/{shareLinkId}/revoke")
    public Map<String, Object> revokeShareLink(
        @PathVariable Long shareLinkId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.revokeShareLink(shareLinkId, authCookie);
    }

    @GetMapping("/share/links/{token}")
    public Map<String, Object> getSharedTest(
        @PathVariable String token,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.getSharedTest(token, authCookie);
    }

    @PostMapping("/share/links/{token}/start")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> startSharedAttempt(
        @PathVariable String token,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.startSharedAttempt(token, request, authCookie);
    }

    @PostMapping("/share/links/{token}/attempts/{attemptId}/submit")
    public Map<String, Object> submitSharedAttempt(
        @PathVariable String token,
        @PathVariable Long attemptId,
        @RequestBody Map<String, Object> request
    ) {
        return testService.submitSharedAttempt(token, attemptId, request);
    }

    @PostMapping("/tests/{testId}/attempts")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> submitAttempt(
        @PathVariable Long testId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.submitAttempt(testId, request, authCookie);
    }

    @GetMapping("/attempts")
    public List<Map<String, Object>> listAttempts(@CookieValue(name = "${app.cookie-name}", required = false) String authCookie) {
        return testService.listAttempts(authCookie);
    }

    @GetMapping("/admin/attempts")
    public List<Map<String, Object>> listTeacherAttempts(@CookieValue(name = "${app.cookie-name}", required = false) String authCookie) {
        return testService.listTeacherAttempts(authCookie);
    }

    @GetMapping("/attempts/{attemptId}")
    public Map<String, Object> getAttempt(
        @PathVariable Long attemptId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.getAttempt(attemptId, authCookie);
    }

    @PostMapping("/attempts/{attemptId}/grade")
    public Map<String, Object> gradeAttempt(
        @PathVariable Long attemptId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.gradeAttempt(attemptId, request, authCookie);
    }

    @PostMapping("/attempts/{attemptId}/complete")
    public Map<String, Object> completeAttempt(
        @PathVariable Long attemptId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return testService.completeAttempt(attemptId, authCookie);
    }
}
