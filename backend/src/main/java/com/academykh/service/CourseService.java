package com.academykh.service;

import com.academykh.model.AppUser;
import com.academykh.model.Course;
import com.academykh.model.CourseEnrollment;
import com.academykh.model.CourseModule;
import com.academykh.model.CourseShareLink;
import com.academykh.model.DropdownOption;
import com.academykh.model.DropdownOptionIds;
import com.academykh.model.Lesson;
import com.academykh.model.StudentGroup;
import com.academykh.model.StudentGroupMember;
import com.academykh.model.TestShareLink;
import com.academykh.repository.AppUserRepository;
import com.academykh.repository.CourseEnrollmentRepository;
import com.academykh.repository.CourseModuleRepository;
import com.academykh.repository.CourseRepository;
import com.academykh.repository.CourseShareLinkRepository;
import com.academykh.repository.DropdownOptionRepository;
import com.academykh.repository.StudentGroupRepository;
import com.academykh.repository.TestShareLinkRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseService {
    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final CourseShareLinkRepository courseShareLinkRepository;
    private final AppUserRepository appUserRepository;
    private final AuthCookieService authCookieService;
    private final DropdownOptionRepository dropdownOptionRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final TestShareLinkRepository testShareLinkRepository;

    public CourseService(
        CourseRepository courseRepository,
        CourseModuleRepository courseModuleRepository,
        CourseEnrollmentRepository courseEnrollmentRepository,
        CourseShareLinkRepository courseShareLinkRepository,
        AppUserRepository appUserRepository,
        AuthCookieService authCookieService,
        DropdownOptionRepository dropdownOptionRepository,
        StudentGroupRepository studentGroupRepository,
        TestShareLinkRepository testShareLinkRepository
    ) {
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.courseEnrollmentRepository = courseEnrollmentRepository;
        this.courseShareLinkRepository = courseShareLinkRepository;
        this.appUserRepository = appUserRepository;
        this.authCookieService = authCookieService;
        this.dropdownOptionRepository = dropdownOptionRepository;
        this.studentGroupRepository = studentGroupRepository;
        this.testShareLinkRepository = testShareLinkRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listCourses(String authCookie) {
        AppUser user = userFromCookie(authCookie);
        if (user == null) {
            return List.of();
        }
        if (user.isTeacher()) {
            Map<Long, Course> courses = new LinkedHashMap<>();
            courseRepository.findByCreatedByIdNewestFirst(user.getId()).forEach(course -> courses.put(course.getId(), course));
            studentCourses(user).forEach(course -> courses.putIfAbsent(course.getId(), course));
            return courses.values().stream()
                .map(this::courseBody)
                .toList();
        }

        return studentCourses(user).stream()
            .map(this::courseBody)
            .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCourse(Long courseId, String authCookie) {
        AppUser user = userFromCookie(authCookie);
        if (user == null) {
            throw new EntityNotFoundException("Course not found: " + courseId);
        }
        Course course = user.isTeacher()
            ? courseRepository.findByIdAndCreatedById(courseId, user.getId())
                .orElseGet(() -> findAccessibleStudentCourse(courseId, user))
            : findAccessibleStudentCourse(courseId, user);
        return courseDetail(course);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCourseAccess(Long courseId, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Course course = findOwnedCourse(courseId, teacher);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("course", courseBody(course));
        body.put("students", courseEnrollmentRepository.findByCourseIdWithStudent(courseId).stream()
            .map(this::enrollmentBody)
            .toList());
        body.put("shareLinks", courseShareLinkRepository.findByCourseIdAndCreatedByIdNewestFirst(courseId, teacher.getId()).stream()
            .map(this::courseShareLinkBody)
            .toList());
        return body;
    }

    @Transactional
    public Map<String, Object> enrollStudents(Long courseId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Course course = findOwnedCourse(courseId, teacher);
        List<String> emails = normalizedEmails(request.get("emails"));
        List<String> enrolled = new java.util.ArrayList<>();
        List<String> alreadyEnrolled = new java.util.ArrayList<>();
        List<String> notFound = new java.util.ArrayList<>();
        List<String> owners = new java.util.ArrayList<>();

        for (String email : emails) {
            AppUser student = appUserRepository.findByEmail(email).orElse(null);
            if (student == null) {
                notFound.add(email);
                continue;
            }
            if (student.getId().equals(teacher.getId())) {
                owners.add(email);
                continue;
            }
            if (courseEnrollmentRepository.existsByStudentIdAndCourseId(student.getId(), courseId)) {
                alreadyEnrolled.add(email);
                continue;
            }
            CourseEnrollment enrollment = new CourseEnrollment();
            enrollment.setCourse(course);
            enrollment.setStudent(student);
            courseEnrollmentRepository.save(enrollment);
            enrolled.add(email);
        }

        Map<String, Object> body = getCourseAccess(courseId, authCookie);
        body.put("enrolled", enrolled);
        body.put("alreadyEnrolled", alreadyEnrolled);
        body.put("notFound", notFound);
        body.put("owners", owners);
        return body;
    }

    @Transactional
    public Map<String, Object> removeEnrollment(Long courseId, Long enrollmentId, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        findOwnedCourse(courseId, teacher);
        CourseEnrollment enrollment = courseEnrollmentRepository.findByIdAndCourseIdAndCourseCreatedById(enrollmentId, courseId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Enrollment not found: " + enrollmentId));
        courseEnrollmentRepository.delete(enrollment);
        return getCourseAccess(courseId, authCookie);
    }

    @Transactional
    public Map<String, Object> createCourseShareLink(Long courseId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Course course = findOwnedCourse(courseId, teacher);
        CourseShareLink link = new CourseShareLink();
        link.setCourse(course);
        link.setToken(UUID.randomUUID().toString().replace("-", ""));
        link.setLabel(optionalString(request.get("label"), course.getTitle()));
        link.setExpiresAt(requiredInstant(request.get("expiresAt")));
        link.setActive(booleanValueWithDefault(request.get("active"), true));
        return courseShareLinkBody(courseShareLinkRepository.save(link));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCourseShareLink(String token) {
        CourseShareLink link = findCourseShareLink(token);
        validateCourseShareLink(link);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("shareLink", courseShareLinkBody(link));
        body.put("course", courseBody(link.getCourse()));
        return body;
    }

    @Transactional
    public Map<String, Object> claimCourseShareLink(String token, String authCookie) {
        AppUser student = userFromCookie(authCookie);
        if (student == null) {
            throw new IllegalStateException("Sign in before joining this course.");
        }
        CourseShareLink link = findCourseShareLink(token);
        validateCourseShareLink(link);
        Course course = link.getCourse();
        if (course.getCreatedBy() != null && course.getCreatedBy().getId().equals(student.getId())) {
            throw new IllegalStateException("You already own this course.");
        }
        if (courseEnrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId()).isEmpty()) {
            CourseEnrollment enrollment = new CourseEnrollment();
            enrollment.setCourse(course);
            enrollment.setStudent(student);
            courseEnrollmentRepository.save(enrollment);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("course", courseDetail(course));
        body.put("shareLink", courseShareLinkBody(link));
        return body;
    }

    @Transactional
    public Map<String, Object> createCourse(Map<String, Object> request, String authCookie) {
        AppUser user = requireTeacher(authCookie);
        Course course = new Course();
        course.setTitle(requiredString(request, "title"));
        course.setLanguage(requiredString(request, "language"));
        course.setLevel(requiredString(request, "level"));
        course.setPublished(booleanValue(request.get("published")));
        course.setCreatedBy(user);

        return courseBody(courseRepository.save(course));
    }

    @Transactional
    public Map<String, Object> createModule(Long courseId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Course course = courseRepository.findByIdAndCreatedById(courseId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Course not found: " + courseId));

        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setTitle(requiredString(request, "title"));
        module.setPosition(integerValue(request.get("position"), nextModulePosition(courseId)));
        applyLessons(module, request);
        course.getModules().add(module);

        return courseDetail(courseRepository.save(course));
    }

    @Transactional
    public Map<String, Object> updateModule(Long moduleId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        CourseModule module = courseModuleRepository.findByIdAndCourseCreatedByIdWithLessons(moduleId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Module not found: " + moduleId));
        module.setTitle(requiredString(request, "title"));
        module.setPosition(integerValue(request.get("position"), module.getPosition()));
        applyLessons(module, request);

        CourseModule savedModule = courseModuleRepository.save(module);
        return courseDetail(savedModule.getCourse());
    }

    @Transactional
    public Map<String, Object> reorderModules(Long courseId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Course course = courseRepository.findByIdAndCreatedById(courseId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Course not found: " + courseId));
        Map<Long, Integer> positions = new LinkedHashMap<>();
        int fallbackPosition = 1;
        for (Object value : listOfObjects(request.get("moduleIds"))) {
            Long moduleId = longValue(value);
            if (moduleId != null) {
                positions.put(moduleId, fallbackPosition++);
            }
        }

        for (CourseModule module : courseModuleRepository.findByCourseIdAndCourseCreatedById(courseId, teacher.getId())) {
            Integer position = positions.get(module.getId());
            if (position != null) {
                module.setPosition(position);
            }
        }

        return courseDetail(course);
    }

    private Map<String, Object> courseBody(Course course) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", course.getId());
        body.put("title", course.getTitle());
        body.put("language", course.getLanguage());
        body.put("level", course.getLevel());
        body.put("published", course.isPublished());
        body.put("createdById", course.getCreatedBy() == null ? null : course.getCreatedBy().getId());
        body.put("moduleCount", course.getModules().size());
        body.put("lessonCount", course.getModules().stream().mapToInt(module -> module.getLessons().size()).sum());
        return body;
    }

    private Map<String, Object> enrollmentBody(CourseEnrollment enrollment) {
        AppUser student = enrollment.getStudent();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", enrollment.getId());
        body.put("studentId", student == null ? null : student.getId());
        body.put("name", student == null ? "Student" : student.getName());
        body.put("email", student == null ? null : student.getEmail());
        body.put("enrolledAt", enrollment.getEnrolledAt());
        return body;
    }

    private Map<String, Object> courseShareLinkBody(CourseShareLink link) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", link.getId());
        body.put("token", link.getToken());
        body.put("label", link.getLabel());
        body.put("courseId", link.getCourse().getId());
        body.put("courseTitle", link.getCourse().getTitle());
        body.put("expiresAt", link.getExpiresAt());
        body.put("active", link.isActive());
        body.put("createdAt", link.getCreatedAt());
        body.put("expired", !java.time.Instant.now().isBefore(link.getExpiresAt()));
        return body;
    }

    private List<Course> studentCourses(AppUser user) {
        Map<Long, Course> courses = new LinkedHashMap<>();
        for (CourseEnrollment enrollment : courseEnrollmentRepository.findByStudentIdWithCourse(user.getId())) {
            Course course = enrollment.getCourse();
            if (course != null && course.getId() != null) {
                courses.put(course.getId(), course);
            }
        }
        for (TestShareLink link : invitedOpenShareLinks(user)) {
            Course course = link.getTest().getCourse();
            if (course != null && course.getId() != null) {
                courses.putIfAbsent(course.getId(), course);
            }
        }
        return List.copyOf(courses.values());
    }

    private Course findAccessibleStudentCourse(Long courseId, AppUser user) {
        if (courseEnrollmentRepository.existsByStudentIdAndCourseId(user.getId(), courseId)) {
            return courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + courseId));
        }
        return invitedOpenShareLinks(user).stream()
            .map(link -> link.getTest().getCourse())
            .filter(course -> course != null && course.getId().equals(courseId))
            .findFirst()
            .orElseThrow(() -> new EntityNotFoundException("Course not found: " + courseId));
    }

    private Course findOwnedCourse(Long courseId, AppUser teacher) {
        return courseRepository.findByIdAndCreatedById(courseId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Course not found: " + courseId));
    }

    private CourseShareLink findCourseShareLink(String token) {
        return courseShareLinkRepository.findByTokenWithCourse(token)
            .orElseThrow(() -> new EntityNotFoundException("Course link not found."));
    }

    private void validateCourseShareLink(CourseShareLink link) {
        if (!link.isActive()) {
            throw new IllegalStateException("This course link is no longer active.");
        }
        if (!java.time.Instant.now().isBefore(link.getExpiresAt())) {
            throw new IllegalStateException("This course link has expired.");
        }
    }

    private List<TestShareLink> invitedOpenShareLinks(AppUser user) {
        String email = user.getEmail() == null ? "" : user.getEmail().trim().toLowerCase();
        return testShareLinkRepository.findOpenLoginRequiredLinks().stream()
            .filter(link -> link.getTest().getCourse() != null)
            .filter(link -> isInvited(link, email))
            .toList();
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

    private Map<String, Object> courseDetail(Course course) {
        Map<String, Object> body = courseBody(course);
        List<CourseModule> modules = courseModuleRepository.findByCourseIdWithLessons(course.getId());
        body.put("modules", modules.stream()
            .sorted(Comparator.comparing(CourseModule::getPosition))
            .map(this::moduleBody)
            .toList());
        return body;
    }

    private Map<String, Object> moduleBody(CourseModule module) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", module.getId());
        body.put("title", module.getTitle());
        body.put("position", module.getPosition());
        body.put("lessons", module.getLessons().stream()
            .sorted(Comparator.comparing(Lesson::getPosition))
            .map(this::lessonBody)
            .toList());
        return body;
    }

    private Map<String, Object> lessonBody(Lesson lesson) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", lesson.getId());
        body.put("title", lesson.getTitle());
        body.put("content", lesson.getContent());
        body.put("position", lesson.getPosition());
        body.put("published", lesson.isPublished());
        body.put("type", lesson.typeValue());
        body.put("codeLanguage", lesson.getCodeLanguage());
        return body;
    }

    private void applyLessons(CourseModule module, Map<String, Object> request) {
        module.getLessons().clear();
        int position = 1;
        for (Map<String, Object> lessonRequest : listOfMaps(request.get("lessons"))) {
            Lesson lesson = new Lesson();
            DropdownOption type = lessonType(lessonRequest.get("type"));
            lesson.setModule(module);
            lesson.setTypeOption(type);
            lesson.setCodeLanguage(type.getId() == DropdownOptionIds.LESSON_CODE ? optionalString(lessonRequest.get("codeLanguage"), "text") : null);
            lesson.setContent(requiredString(lessonRequest, "content"));
            lesson.setTitle(optionalString(lessonRequest.get("title"), type.getId() == DropdownOptionIds.LESSON_CODE ? "Code Snippet" : "Rich Text"));
            lesson.setPosition(integerValue(lessonRequest.get("position"), position++));
            lesson.setPublished(booleanValueWithDefault(lessonRequest.get("published"), true));
            module.getLessons().add(lesson);
        }
    }

    private int nextModulePosition(Long courseId) {
        return courseModuleRepository.findByCourseIdWithLessons(courseId).stream()
            .mapToInt(CourseModule::getPosition)
            .max()
            .orElse(0) + 1;
    }

    private String requiredString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException(key + " is required.");
        }
        return String.valueOf(value);
    }

    private boolean booleanValue(Object value) {
        return value instanceof Boolean bool ? bool : Boolean.parseBoolean(String.valueOf(value));
    }

    private boolean booleanValueWithDefault(Object value, boolean fallback) {
        return value == null ? fallback : booleanValue(value);
    }

    private int integerValue(Object value, int fallback) {
        if (value == null || String.valueOf(value).isBlank()) {
            return fallback;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private java.time.Instant requiredInstant(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("expiresAt is required.");
        }
        return java.time.Instant.parse(String.valueOf(value));
    }

    private Long longValue(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        return Long.parseLong(String.valueOf(value));
    }

    private String optionalString(Object value, String fallback) {
        if (value == null || String.valueOf(value).isBlank()) {
            return fallback;
        }
        return String.valueOf(value);
    }

    private DropdownOption lessonType(Object value) {
        Long optionId = dropdownOptionId(value);
        return dropdownOptionRepository.getReferenceById(optionId);
    }

    private Long dropdownOptionId(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        String text = value == null ? "" : String.valueOf(value);
        if (text.isBlank() || text.equals("RICH_TEXT") || text.equals("RICH_TEXT_WITH_MATH")) {
            return DropdownOptionIds.LESSON_RICH_TEXT;
        }
        if (text.equals("CODE")) {
            return DropdownOptionIds.LESSON_CODE;
        }
        return Long.parseLong(text);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> listOfMaps(Object value) {
        if (value instanceof List<?> items) {
            return items.stream()
                .filter(Map.class::isInstance)
                .map(item -> (Map<String, Object>) item)
                .toList();
        }
        return List.of();
    }

    private List<?> listOfObjects(Object value) {
        return value instanceof List<?> items ? items : List.of();
    }

    private List<String> normalizedEmails(Object value) {
        String text = value == null ? "" : String.valueOf(value);
        return java.util.Arrays.stream(text.split("[,\\n]"))
            .map(String::trim)
            .filter(item -> !item.isBlank())
            .map(String::toLowerCase)
            .distinct()
            .toList();
    }

    private AppUser requireTeacher(String authCookie) {
        AppUser user = userFromCookie(authCookie);
        if (user == null || !user.isTeacher()) {
            throw new IllegalStateException("Teacher access is required.");
        }
        return user;
    }

    private AppUser userFromCookie(String authCookie) {
        return authCookieService.userFromCookie(authCookie);
    }
}
