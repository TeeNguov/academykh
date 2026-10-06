package com.academykh.controller;

import com.academykh.service.CourseService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public List<Map<String, Object>> listCourses(@CookieValue(name = "${app.cookie-name}", required = false) String authCookie) {
        return courseService.listCourses(authCookie);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createCourse(
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.createCourse(request, authCookie);
    }

    @GetMapping("/{courseId}")
    public Map<String, Object> getCourse(
        @PathVariable Long courseId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.getCourse(courseId, authCookie);
    }

    @GetMapping("/{courseId}/access")
    public Map<String, Object> getCourseAccess(
        @PathVariable Long courseId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.getCourseAccess(courseId, authCookie);
    }

    @PostMapping("/{courseId}/enrollments")
    public Map<String, Object> enrollStudents(
        @PathVariable Long courseId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.enrollStudents(courseId, request, authCookie);
    }

    @DeleteMapping("/{courseId}/enrollments/{enrollmentId}")
    public Map<String, Object> removeEnrollment(
        @PathVariable Long courseId,
        @PathVariable Long enrollmentId,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.removeEnrollment(courseId, enrollmentId, authCookie);
    }

    @PostMapping("/{courseId}/share/links")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createCourseShareLink(
        @PathVariable Long courseId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.createCourseShareLink(courseId, request, authCookie);
    }

    @GetMapping("/share/links/{token}")
    public Map<String, Object> getCourseShareLink(@PathVariable String token) {
        return courseService.getCourseShareLink(token);
    }

    @PostMapping("/share/links/{token}/join")
    public Map<String, Object> claimCourseShareLink(
        @PathVariable String token,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.claimCourseShareLink(token, authCookie);
    }

    @PostMapping("/{courseId}/modules")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createModule(
        @PathVariable Long courseId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.createModule(courseId, request, authCookie);
    }

    @PutMapping("/{courseId}/modules/reorder")
    public Map<String, Object> reorderModules(
        @PathVariable Long courseId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.reorderModules(courseId, request, authCookie);
    }

    @PutMapping("/{courseId}/modules/{moduleId}")
    public Map<String, Object> updateModule(
        @PathVariable Long courseId,
        @PathVariable Long moduleId,
        @RequestBody Map<String, Object> request,
        @CookieValue(name = "${app.cookie-name}", required = false) String authCookie
    ) {
        return courseService.updateModule(moduleId, request, authCookie);
    }
}
