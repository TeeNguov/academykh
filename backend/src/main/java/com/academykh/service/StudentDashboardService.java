package com.academykh.service;

import com.academykh.model.AppUser;
import com.academykh.model.Course;
import com.academykh.model.CourseEnrollment;
import com.academykh.model.DropdownOptionIds;
import com.academykh.model.TestAttempt;
import com.academykh.model.StudentGroup;
import com.academykh.model.StudentGroupMember;
import com.academykh.model.TestShareLink;
import com.academykh.repository.AppUserRepository;
import com.academykh.repository.CourseEnrollmentRepository;
import com.academykh.repository.DropdownOptionRepository;
import com.academykh.repository.TestAttemptRepository;
import com.academykh.repository.StudentGroupRepository;
import com.academykh.repository.TestShareLinkRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentDashboardService {
    private final AppUserRepository appUserRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final DropdownOptionRepository dropdownOptionRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final TestShareLinkRepository testShareLinkRepository;
    private final AuthCookieService authCookieService;

    public StudentDashboardService(
        AppUserRepository appUserRepository,
        CourseEnrollmentRepository courseEnrollmentRepository,
        TestAttemptRepository testAttemptRepository,
        DropdownOptionRepository dropdownOptionRepository,
        StudentGroupRepository studentGroupRepository,
        TestShareLinkRepository testShareLinkRepository,
        AuthCookieService authCookieService
    ) {
        this.appUserRepository = appUserRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.dropdownOptionRepository = dropdownOptionRepository;
        this.studentGroupRepository = studentGroupRepository;
        this.testShareLinkRepository = testShareLinkRepository;
        this.authCookieService = authCookieService;
    }

    @Transactional
    public Map<String, Object> getDashboard(String authCookie) {
        AppUser user = userFromCookie(authCookie);
        if (user == null) {
            throw new EntityNotFoundException("Signed-in user not found.");
        }

        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByStudentIdWithCourse(user.getId());
        List<TestAttempt> attempts = testAttemptRepository.findByStudentIdNewestFirst(user.getId());
        completeExpiredAttempts(attempts);
        Map<Long, TestShareLink> sharedTestsById = new LinkedHashMap<>();
        String studentEmail = user.getEmail().trim().toLowerCase();
        testShareLinkRepository.findOpenLoginRequiredLinks().stream()
            .filter(link -> isInvited(link, studentEmail))
            .filter(link -> !hasCompletedAttempt(attempts, link))
            .forEach(link -> sharedTestsById.put(link.getId(), link));
        testShareLinkRepository.findOpenLinksAccessedByStudent(user.getId()).stream()
            .filter(link -> !hasCompletedAttempt(attempts, link))
            .forEach(link -> sharedTestsById.put(link.getId(), link));
        List<TestShareLink> sharedTests = List.copyOf(sharedTestsById.values());
        List<Course> courses = dashboardCourses(enrollments, sharedTests);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user", userBody(user));
        body.put("stats", statsBody(courses, attempts, sharedTests));
        body.put("enrolledCourses", courses.stream().map(this::courseBody).toList());
        body.put("sharedTests", sharedTests.stream().map(this::shareLinkBody).toList());
        body.put("attempts", attempts.stream().map(this::attemptBody).toList());
        return body;
    }

    private List<Course> dashboardCourses(List<CourseEnrollment> enrollments, List<TestShareLink> sharedTests) {
        Map<Long, Course> courses = new LinkedHashMap<>();
        for (CourseEnrollment enrollment : enrollments) {
            Course course = enrollment.getCourse();
            if (course != null && course.getId() != null) {
                courses.put(course.getId(), course);
            }
        }
        for (TestShareLink link : sharedTests) {
            Course course = link.getTest().getCourse();
            if (course != null && course.getId() != null) {
                courses.putIfAbsent(course.getId(), course);
            }
        }
        return List.copyOf(courses.values());
    }

    private Map<String, Object> statsBody(List<Course> courses, List<TestAttempt> attempts, List<TestShareLink> sharedTests) {
        List<TestAttempt> scoredAttempts = attempts.stream()
            .filter(attempt -> attempt.getScorePercent() != null)
            .toList();

        int averageScore = scoredAttempts.isEmpty()
            ? 0
            : (int) Math.round(scoredAttempts.stream().mapToInt(TestAttempt::getScorePercent).average().orElse(0));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("enrolledCourses", courses.size());
        body.put("sharedTests", sharedTests.size());
        body.put("attempts", attempts.size());
        body.put("averageScore", averageScore);
        return body;
    }

    private Map<String, Object> userBody(AppUser user) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", user.getId());
        body.put("name", user.getName());
        body.put("email", user.getEmail());
        body.put("role", user.roleValue());
        return body;
    }

    private Map<String, Object> courseBody(Course course) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", course.getId());
        body.put("title", course.getTitle());
        body.put("language", course.getLanguage());
        body.put("level", course.getLevel());
        body.put("published", course.isPublished());
        body.put("moduleCount", course.getModules().size());
        body.put("lessonCount", course.getModules().stream().mapToInt(module -> module.getLessons().size()).sum());
        return body;
    }

    private Map<String, Object> shareLinkBody(TestShareLink link) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", link.getId());
        body.put("token", link.getToken());
        body.put("label", link.getLabel());
        body.put("testId", link.getTest().getId());
        body.put("testTitle", link.getTest().getTitle());
        body.put("expiresAt", link.getExpiresAt());
        body.put("durationMinutes", link.getTest().getDurationMinutes());
        body.put("questionCount", link.getTest().getQuestions().stream().filter(question -> !question.isArchived()).count());
        body.put("courseId", link.getTest().getCourse() == null ? null : link.getTest().getCourse().getId());
        body.put("courseTitle", link.getTest().getCourse() == null ? null : link.getTest().getCourse().getTitle());
        body.put("invitedGroupIds", csvLongs(link.getInvitedGroupIds()));
        return body;
    }

    private Map<String, Object> attemptBody(TestAttempt attempt) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", attempt.getId());
        body.put("testId", attempt.getTest().getId());
        body.put("testTitle", attempt.getTest().getTitle());
        body.put("status", attempt.statusValue());
        body.put("scorePercent", attempt.getScorePercent());
        body.put("startedAt", attempt.getStartedAt());
        body.put("submittedAt", attempt.getSubmittedAt());
        body.put("courseId", attempt.getTest().getCourse() == null ? null : attempt.getTest().getCourse().getId());
        body.put("courseTitle", attempt.getTest().getCourse() == null ? null : attempt.getTest().getCourse().getTitle());
        if (attempt.getShareLink() != null) {
            body.put("shareLinkId", attempt.getShareLink().getId());
            body.put("invitedGroupIds", csvLongs(attempt.getShareLink().getInvitedGroupIds()));
        }
        return body;
    }

    private AppUser userFromCookie(String authCookie) {
        return authCookieService.userFromCookie(authCookie);
    }

    private boolean hasCompletedAttempt(List<TestAttempt> attempts, TestShareLink link) {
        return attempts.stream()
            .anyMatch(attempt -> attempt.getShareLink() != null
                && attempt.getShareLink().getId().equals(link.getId())
                && !attempt.isInProgress());
    }

    private void completeExpiredAttempts(List<TestAttempt> attempts) {
        Instant now = Instant.now();
        attempts.stream()
            .filter(TestAttempt::isInProgress)
            .filter(attempt -> now.isAfter(attempt.getStartedAt().plusSeconds(durationMinutes(attempt) * 60L)))
            .forEach(attempt -> {
                attempt.setSubmittedAt(attempt.getStartedAt().plusSeconds(durationMinutes(attempt) * 60L));
                attempt.setStatusOption(dropdownOptionRepository.getReferenceById(DropdownOptionIds.ATTEMPT_SUBMITTED));
                attempt.setScorePercent(0);
            });
    }

    private int durationMinutes(TestAttempt attempt) {
        Integer durationMinutes = attempt.getTest().getDurationMinutes();
        return durationMinutes == null || durationMinutes <= 0 ? 30 : durationMinutes;
    }

    private boolean isInvited(TestShareLink link, String email) {
        if (csvContains(link.getInvitedEmails(), email)) {
            return true;
        }
        for (Long groupId : csvLongs(link.getInvitedGroupIds())) {
            StudentGroup group = studentGroupRepository.findById(groupId).orElse(null);
            if (group != null && group.getMembers().stream().map(StudentGroupMember::getEmail).anyMatch(email::equalsIgnoreCase)) {
                return true;
            }
        }
        return false;
    }

    private boolean csvContains(String csv, String value) {
        if (csv == null || csv.isBlank()) {
            return false;
        }
        for (String item : csv.split(",")) {
            if (item.trim().equalsIgnoreCase(value)) {
                return true;
            }
        }
        return false;
    }

    private List<Long> csvLongs(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(csv.split(","))
            .filter(item -> !item.isBlank())
            .map(item -> Long.parseLong(item.trim()))
            .toList();
    }
}
