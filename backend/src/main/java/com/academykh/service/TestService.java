package com.academykh.service;

import com.academykh.model.AppUser;
import com.academykh.model.AttemptAnswer;
import com.academykh.model.DropdownOptionIds;
import com.academykh.model.Question;
import com.academykh.model.QuestionOption;
import com.academykh.model.Test;
import com.academykh.model.TestAttempt;
import com.academykh.model.StudentGroup;
import com.academykh.model.StudentGroupMember;
import com.academykh.model.TestShareLink;
import com.academykh.repository.AppUserRepository;
import com.academykh.repository.DropdownOptionRepository;
import com.academykh.repository.TestAttemptRepository;
import com.academykh.repository.TestRepository;
import com.academykh.repository.StudentGroupRepository;
import com.academykh.repository.TestShareLinkRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestService {
    private final TestRepository testRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final TestShareLinkRepository testShareLinkRepository;
    private final AppUserRepository appUserRepository;
    private final AuthCookieService authCookieService;
    private final DropdownOptionRepository dropdownOptionRepository;
    private final StudentGroupRepository studentGroupRepository;

    public TestService(
        TestRepository testRepository,
        TestAttemptRepository testAttemptRepository,
        TestShareLinkRepository testShareLinkRepository,
        AppUserRepository appUserRepository,
        AuthCookieService authCookieService,
        DropdownOptionRepository dropdownOptionRepository,
        StudentGroupRepository studentGroupRepository
    ) {
        this.testRepository = testRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.testShareLinkRepository = testShareLinkRepository;
        this.appUserRepository = appUserRepository;
        this.authCookieService = authCookieService;
        this.dropdownOptionRepository = dropdownOptionRepository;
        this.studentGroupRepository = studentGroupRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listTests(String authCookie) {
        AppUser user = userFromCookie(authCookie);
        List<Test> tests = user != null && user.isTeacher()
            ? testRepository.findByCreatedByIdWithQuestions(user.getId())
            : testRepository.findPublishedWithQuestions();
        return tests.stream()
            .map(this::testSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTest(Long testId) {
        return testDetail(findTest(testId), false);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTestForEditing(Long testId, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        return testDetail(findOwnedTest(testId, teacher), true);
    }

    @Transactional
    public Map<String, Object> createTest(Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Test test = new Test();
        test.setTitle(requiredString(request, "title"));
        test.setExam(booleanValue(request.get("exam")));
        test.setDurationMinutes(durationMinutes(request.get("durationMinutes")));
        test.setStudentIdentityOption(dropdownOptionRepository.getReferenceById(studentIdentityOptionId(request.get("studentIdentityMode"))));
        test.setPublished(booleanValue(request.get("published")));
        test.setCreatedBy(teacher);

        int position = 1;
        for (Map<String, Object> questionRequest : listOfMaps(request.get("questions"))) {
            Question question = new Question();
            question.setTest(test);
            question.setTypeOption(dropdownOptionRepository.getReferenceById(questionTypeOptionId(requiredString(questionRequest, "type"))));
            question.setPrompt(requiredString(questionRequest, "prompt"));
            question.setExplanation(stringValue(questionRequest.get("explanation")));
            question.setPoints(Math.max(0, integerValue(questionRequest.get("points"), 0)));
            question.setPosition(integerValue(questionRequest.get("position"), position++));

            int optionPosition = 1;
            for (Map<String, Object> optionRequest : listOfMaps(questionRequest.get("options"))) {
                QuestionOption option = new QuestionOption();
                option.setQuestion(question);
                option.setLabel(requiredString(optionRequest, "label"));
                option.setCorrect(booleanValue(optionRequest.get("correct")));
                option.setPosition(integerValue(optionRequest.get("position"), optionPosition++));
                question.getOptions().add(option);
            }

            test.getQuestions().add(question);
        }

        if (test.getQuestions().isEmpty()) {
            throw new IllegalArgumentException("A test needs at least one question.");
        }

        return testDetail(testRepository.save(test), true);
    }

    @Transactional
    public Map<String, Object> updateTest(Long testId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Test test = findOwnedTest(testId, teacher);
        test.setTitle(requiredString(request, "title"));
        test.setExam(booleanValue(request.get("exam")));
        test.setDurationMinutes(durationMinutes(request.get("durationMinutes")));
        test.setStudentIdentityOption(dropdownOptionRepository.getReferenceById(studentIdentityOptionId(request.get("studentIdentityMode"))));
        test.setPublished(booleanValue(request.get("published")));

        Set<Long> activeQuestionIds = new HashSet<>();
        int position = 1;
        for (Map<String, Object> questionRequest : listOfMaps(request.get("questions"))) {
            Long questionId = optionalLong(questionRequest.get("id"));
            Question question = questionId == null
                ? new Question()
                : test.getQuestions().stream()
                    .filter(existingQuestion -> Objects.equals(existingQuestion.getId(), questionId))
                    .findFirst()
                    .orElseGet(Question::new);

            question.setTest(test);
            question.setTypeOption(dropdownOptionRepository.getReferenceById(questionTypeOptionId(requiredString(questionRequest, "type"))));
            question.setPrompt(requiredString(questionRequest, "prompt"));
            question.setExplanation(stringValue(questionRequest.get("explanation")));
            question.setPoints(Math.max(0, integerValue(questionRequest.get("points"), 0)));
            question.setPosition(integerValue(questionRequest.get("position"), position++));
            question.setArchived(false);

            Set<Long> activeOptionIds = new HashSet<>();
            int optionPosition = 1;
            for (Map<String, Object> optionRequest : listOfMaps(questionRequest.get("options"))) {
                Long optionId = optionalLong(optionRequest.get("id"));
                QuestionOption option = optionId == null
                    ? new QuestionOption()
                    : question.getOptions().stream()
                        .filter(existingOption -> Objects.equals(existingOption.getId(), optionId))
                        .findFirst()
                        .orElseGet(QuestionOption::new);
                option.setQuestion(question);
                option.setLabel(requiredString(optionRequest, "label"));
                option.setCorrect(booleanValue(optionRequest.get("correct")));
                option.setPosition(integerValue(optionRequest.get("position"), optionPosition++));
                option.setArchived(false);
                if (option.getId() == null) {
                    question.getOptions().add(option);
                } else {
                    activeOptionIds.add(option.getId());
                }
            }

            question.getOptions().stream()
                .filter(option -> option.getId() != null)
                .filter(option -> !activeOptionIds.contains(option.getId()))
                .forEach(option -> option.setArchived(true));

            if (question.getId() == null) {
                test.getQuestions().add(question);
            } else {
                activeQuestionIds.add(question.getId());
            }
        }

        test.getQuestions().stream()
            .filter(question -> question.getId() != null)
            .filter(question -> !activeQuestionIds.contains(question.getId()))
            .forEach(question -> question.setArchived(true));

        if (test.getQuestions().stream().noneMatch(question -> !question.isArchived())) {
            throw new IllegalArgumentException("A test needs at least one question.");
        }

        return testDetail(testRepository.save(test), true);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listShareLinks(String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        return testShareLinkRepository.findByTestCreatedByIdNewestFirst(teacher.getId()).stream()
            .map(this::shareLinkBody)
            .toList();
    }

    @Transactional
    public List<Map<String, Object>> listShareLinkAttempts(Long shareLinkId, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        List<TestAttempt> attempts = testAttemptRepository.findByShareLinkIdAndTestCreatedByIdNewestFirst(shareLinkId, teacher.getId());
        completeExpiredAttempts(attempts);
        return attempts.stream()
            .map(this::attemptSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listTeacherStudents(String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Map<String, Map<String, Object>> students = new LinkedHashMap<>();
        for (TestAttempt attempt : testAttemptRepository.findStudentsByTestCreatedByIdNewestFirst(teacher.getId())) {
            AppUser student = attempt.getStudent();
            String key = student == null ? "name:" + attempt.getStudentName().trim().toLowerCase() : "user:" + student.getId();
            Map<String, Object> body = students.computeIfAbsent(key, ignored -> studentBody(attempt));
            body.put("attemptCount", ((Integer) body.get("attemptCount")) + 1);
            body.put("lastAttemptAt", attempt.getStartedAt());

            @SuppressWarnings("unchecked")
            Set<String> tests = (Set<String>) body.get("tests");
            tests.add(testLabel(attempt.getTest()));
        }

        return students.values().stream()
            .peek(student -> student.put("tests", new ArrayList<>((Set<String>) student.get("tests"))))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listStudentGroups(String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        return studentGroupRepository.findByCreatedByIdWithMembers(teacher.getId()).stream()
            .map(this::studentGroupBody)
            .toList();
    }

    @Transactional
    public Map<String, Object> createStudentGroup(Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        StudentGroup group = new StudentGroup();
        group.setName(requiredString(request, "name").trim());
        group.setCreatedBy(teacher);
        applyGroupMembers(group, request.get("emails"));
        return studentGroupBody(studentGroupRepository.save(group));
    }

    @Transactional
    public Map<String, Object> updateStudentGroup(Long groupId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        StudentGroup group = studentGroupRepository.findByIdAndCreatedByIdWithMembers(groupId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Student group not found: " + groupId));
        group.setName(requiredString(request, "name").trim());
        applyGroupMembers(group, request.get("emails"));
        return studentGroupBody(studentGroupRepository.save(group));
    }

    @Transactional
    public Map<String, Object> getShareLinkAttempt(Long shareLinkId, Long attemptId, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        TestAttempt attempt = testAttemptRepository.findByShareLinkIdAndAttemptIdAndTestCreatedByIdWithAnswers(shareLinkId, attemptId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
        completeExpiredAttempt(attempt);
        return attemptDetail(attempt);
    }

    @Transactional
    public Map<String, Object> createShareLink(Long testId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        Test test = findOwnedTest(testId, teacher);
        TestShareLink link = new TestShareLink();
        link.setTest(test);
        link.setToken(UUID.randomUUID().toString().replace("-", ""));
        link.setLabel(optionalString(request.get("label"), test.getTitle()));
        link.setAvailableFrom(optionalInstant(request.get("availableFrom")));
        link.setExpiresAt(requiredInstant(request.get("expiresAt")));
        link.setActive(booleanValueWithDefault(request.get("active"), true));
        link.setMaxAttempts(integerValue(request.get("maxAttempts"), 1));
        link.setAllowStudentReview(booleanValueWithDefault(request.get("allowStudentReview"), false));
        link.setSimpleMode(booleanValueWithDefault(request.get("simpleMode"), false));
        link.setInvitedEmails(toCsvStrings(normalizedEmails(request.get("invitedEmails"))));
        link.setInvitedGroupIds(toCsv(listOfLongs(request.get("invitedGroupIds"))));
        return shareLinkBody(testShareLinkRepository.save(link));
    }

    @Transactional
    public Map<String, Object> revokeShareLink(Long shareLinkId, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        TestShareLink link = testShareLinkRepository.findByIdAndTestCreatedById(shareLinkId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Share link not found: " + shareLinkId));
        link.setActive(false);
        return shareLinkBody(testShareLinkRepository.save(link));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSharedTest(String token, String authCookie) {
        TestShareLink link = findShareLink(token);
        validateShareLink(link);
        AppUser user = userFromCookie(authCookie);
        if (user != null || !link.getTest().hasStudentIdentity(DropdownOptionIds.STUDENT_IDENTITY_REQUIRE_LOGIN)) {
            validateInvitation(link, user);
        }
        Map<String, Object> body = testDetail(link.getTest(), false);
        body.put("shareLink", shareLinkBody(link));
        return body;
    }

    @Transactional
    public Map<String, Object> submitAttempt(Long testId, Map<String, Object> request, String authCookie) {
        Test test = findTest(testId);
        return submitAttemptForTest(test, null, request, authCookie);
    }

    @Transactional
    public Map<String, Object> startSharedAttempt(String token, Map<String, Object> request, String authCookie) {
        TestShareLink link = findShareLink(token);
        validateShareLink(link);
        AppUser student = userFromCookie(authCookie);
        validateInvitation(link, student);
        String studentName = attemptStudentName(link.getTest(), request, student);

        List<TestAttempt> existingAttempts = testAttemptRepository.findByShareTokenAndStudentName(token, studentName);
        if (!existingAttempts.isEmpty()) {
            TestAttempt latestAttempt = existingAttempts.get(0);
            completeExpiredAttempt(latestAttempt);
            if (latestAttempt.isInProgress()) {
                return sharedAttemptBody(link, latestAttempt);
            }
            throw new IllegalStateException("You have already used your attempt for this test link.");
        }

        TestAttempt attempt = new TestAttempt();
        attempt.setTest(link.getTest());
        attempt.setShareLink(link);
        attempt.setStudent(student);
        attempt.setStudentName(studentName);
        attempt.setStatusOption(statusOption(DropdownOptionIds.ATTEMPT_IN_PROGRESS));
        attempt.setStartedAt(Instant.now());

        return sharedAttemptBody(link, testAttemptRepository.save(attempt));
    }

    @Transactional
    public Map<String, Object> submitSharedAttempt(String token, Long attemptId, Map<String, Object> request) {
        TestShareLink link = findShareLink(token);
        validateShareLink(link);
        TestAttempt attempt = testAttemptRepository.findByShareTokenAndAttemptId(token, attemptId)
            .orElseThrow(() -> new EntityNotFoundException("Attempt not found."));

        if (!attempt.isInProgress()) {
            throw new IllegalStateException("This attempt has already been submitted.");
        }

        if (Instant.now().isAfter(attemptSubmitWindowEndsAt(attempt))) {
            completeAttempt(attempt, attemptEndsAt(attempt));
            return attemptDetail(testAttemptRepository.save(attempt));
        }

        validateAttemptTime(attempt);
        return submitExistingAttempt(attempt, request);
    }

    private Map<String, Object> submitAttemptForTest(Test test, TestShareLink link, Map<String, Object> request, String authCookie) {
        Map<Long, Question> questionsById = test.getQuestions().stream()
            .filter(question -> !question.isArchived())
            .collect(Collectors.toMap(Question::getId, question -> question));

        TestAttempt attempt = new TestAttempt();
        attempt.setTest(test);
        attempt.setShareLink(link);
        AppUser student = userFromCookie(authCookie);
        attempt.setStudent(student);
        attempt.setStudentName(attemptStudentName(test, request, student));
        attempt.setStartedAt(Instant.now());
        attempt.setSubmittedAt(Instant.now());

        boolean requiresManualGrading = applySubmittedAnswers(attempt, questionsById, request);

        attempt.setStatusOption(statusOption(requiresManualGrading ? DropdownOptionIds.ATTEMPT_SUBMITTED : DropdownOptionIds.ATTEMPT_GRADED));
        updateScore(attempt);
        return attemptDetail(testAttemptRepository.save(attempt));
    }

    private Map<String, Object> submitExistingAttempt(TestAttempt attempt, Map<String, Object> request) {
        Test test = attempt.getTest();
        Map<Long, Question> questionsById = test.getQuestions().stream()
            .filter(question -> !question.isArchived())
            .collect(Collectors.toMap(Question::getId, question -> question));

        attempt.getAnswers().clear();
        boolean requiresManualGrading = applySubmittedAnswers(attempt, questionsById, request);

        attempt.setSubmittedAt(Instant.now());
        attempt.setStatusOption(statusOption(requiresManualGrading ? DropdownOptionIds.ATTEMPT_SUBMITTED : DropdownOptionIds.ATTEMPT_GRADED));
        updateScore(attempt);
        return attemptDetail(testAttemptRepository.save(attempt));
    }

    @Transactional
    public List<Map<String, Object>> listAttempts(String authCookie) {
        AppUser user = userFromCookie(authCookie);
        List<TestAttempt> attempts = user == null ? List.of() : testAttemptRepository.findByStudentIdNewestFirst(user.getId());
        completeExpiredAttempts(attempts);
        return attempts.stream()
            .map(this::attemptSummary)
            .toList();
    }

    @Transactional
    public List<Map<String, Object>> listTeacherAttempts(String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        List<TestAttempt> attempts = testAttemptRepository.findByTestCreatedByIdNewestFirst(teacher.getId());
        completeExpiredAttempts(attempts);
        return attempts.stream()
            .map(this::attemptSummary)
            .toList();
    }

    @Transactional
    public Map<String, Object> getAttempt(Long attemptId, String authCookie) {
        AppUser user = userFromCookie(authCookie);
        if (user == null) {
            throw new EntityNotFoundException("Attempt not found: " + attemptId);
        }
        TestAttempt attempt = testAttemptRepository.findByIdAndStudentIdWithAnswers(attemptId, user.getId())
            .or(() -> user.isTeacher() ? testAttemptRepository.findByIdAndTestCreatedByIdWithAnswers(attemptId, user.getId()) : java.util.Optional.empty())
            .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
        completeExpiredAttempt(attempt);
        if (!user.isTeacher() && !studentCanViewAttemptDetails(attempt)) {
            return attemptSummaryOnly(attempt);
        }
        return attemptDetail(attempt);
    }

    @Transactional
    public Map<String, Object> completeAttempt(Long attemptId, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        TestAttempt attempt = testAttemptRepository.findByIdAndTestCreatedByIdWithAnswers(attemptId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
        if (!attempt.isInProgress()) {
            return attemptDetail(attempt);
        }
        completeAttempt(attempt, Instant.now());
        return attemptDetail(testAttemptRepository.save(attempt));
    }

    @Transactional
    public Map<String, Object> gradeAttempt(Long attemptId, Map<String, Object> request, String authCookie) {
        AppUser teacher = requireTeacher(authCookie);
        TestAttempt attempt = testAttemptRepository.findByIdAndTestCreatedByIdWithAnswers(attemptId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
        Map<Long, AttemptAnswer> answersById = attempt.getAnswers().stream()
            .collect(Collectors.toMap(AttemptAnswer::getId, answer -> answer));

        for (Map<String, Object> gradeRequest : listOfMaps(request.get("answers"))) {
            Long answerId = longValue(gradeRequest.get("answerId"));
            AttemptAnswer answer = answersById.get(answerId);
            if (answer == null) {
                throw new EntityNotFoundException("Attempt answer not found: " + answerId);
            }

            int maxPoints = answer.getQuestion().getPoints();
            int awardedPoints = Math.max(0, Math.min(maxPoints, integerValue(gradeRequest.get("awardedPoints"), 0)));
            answer.setAwardedPoints(awardedPoints);
            answer.setFeedback(stringValue(gradeRequest.get("feedback")));
            answer.setRequiresManualGrading(false);
        }

        attempt.setStatusOption(statusOption(DropdownOptionIds.ATTEMPT_GRADED));
        updateScore(attempt);
        return attemptDetail(testAttemptRepository.save(attempt));
    }

    private Test findTest(Long testId) {
        return testRepository.findByIdWithQuestions(testId)
            .orElseThrow(() -> new EntityNotFoundException("Test not found: " + testId));
    }

    private Test findOwnedTest(Long testId, AppUser teacher) {
        return testRepository.findByIdAndCreatedByIdWithQuestions(testId, teacher.getId())
            .orElseThrow(() -> new EntityNotFoundException("Test not found: " + testId));
    }

    private TestAttempt findAttempt(Long attemptId) {
        return testAttemptRepository.findByIdWithAnswers(attemptId)
            .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
    }

    private TestShareLink findShareLink(String token) {
        return testShareLinkRepository.findByTokenWithTest(token)
            .orElseThrow(() -> new EntityNotFoundException("Share link not found."));
    }

    private void validateShareLink(TestShareLink link) {
        Instant now = Instant.now();
        if (!link.isActive()) {
            throw new IllegalStateException("This test link is no longer active.");
        }
        if (link.getAvailableFrom() != null && now.isBefore(link.getAvailableFrom())) {
            throw new IllegalStateException("This test link is not open yet.");
        }
        if (!now.isBefore(link.getExpiresAt())) {
            throw new IllegalStateException("This test link has expired.");
        }
    }

    private void validateAttemptTime(TestAttempt attempt) {
        if (Instant.now().isAfter(attemptSubmitWindowEndsAt(attempt))) {
            throw new IllegalStateException("This attempt has run out of time.");
        }
    }

    private void completeExpiredAttempts(List<TestAttempt> attempts) {
        attempts.forEach(attempt -> {
            completeExpiredAttempt(attempt);
            if (!attempt.isInProgress()) {
                ensureAnswerRowsForAllQuestions(attempt);
            }
        });
    }

    private void completeExpiredAttempt(TestAttempt attempt) {
        if (attempt.isInProgress() && Instant.now().isAfter(attemptEndsAt(attempt))) {
            completeAttempt(attempt, attemptEndsAt(attempt));
        }
    }

    private Instant attemptEndsAt(TestAttempt attempt) {
        return attempt.getStartedAt().plusSeconds(effectiveDurationMinutes(attempt.getTest()) * 60L);
    }

    private Instant attemptSubmitWindowEndsAt(TestAttempt attempt) {
        return attemptEndsAt(attempt).plusSeconds(10L);
    }

    private void completeAttempt(TestAttempt attempt, Instant completedAt) {
        ensureAnswerRowsForAllQuestions(attempt);
        attempt.setSubmittedAt(completedAt);
        attempt.setStatusOption(statusOption(DropdownOptionIds.ATTEMPT_SUBMITTED));
        updateScore(attempt);
    }

    private void validateInvitation(TestShareLink link, AppUser student) {
        if (!link.getTest().hasStudentIdentity(DropdownOptionIds.STUDENT_IDENTITY_REQUIRE_LOGIN)) {
            return;
        }
        if (student == null) {
            throw new IllegalStateException("Login is required to take this test.");
        }
        if (hasInvitations(link) && !isInvited(link, student.getEmail())) {
            throw new IllegalStateException("This test is not available for this account.");
        }
    }

    private boolean hasInvitations(TestShareLink link) {
        return !fromCsvStrings(link.getInvitedEmails()).isEmpty() || !fromCsv(link.getInvitedGroupIds()).isEmpty();
    }

    private boolean isInvited(TestShareLink link, String emailValue) {
        String email = emailValue == null ? "" : emailValue.trim().toLowerCase();
        if (email.isBlank()) {
            return false;
        }
        if (fromCsvStrings(link.getInvitedEmails()).stream().anyMatch(email::equalsIgnoreCase)) {
            return true;
        }
        Set<Long> groupIds = new HashSet<>(fromCsv(link.getInvitedGroupIds()));
        if (groupIds.isEmpty()) {
            return false;
        }
        return groupIds.stream()
            .map(groupId -> studentGroupRepository.findById(groupId).orElse(null))
            .filter(Objects::nonNull)
            .flatMap(group -> group.getMembers().stream())
            .map(StudentGroupMember::getEmail)
            .anyMatch(email::equalsIgnoreCase);
    }

    private Map<String, Object> testSummary(Test test) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", test.getId());
        body.put("title", test.getTitle());
        body.put("exam", test.isExam());
        body.put("durationMinutes", effectiveDurationMinutes(test));
        body.put("studentIdentityMode", effectiveStudentIdentityMode(test));
        body.put("published", test.isPublished());
        body.put("questionCount", test.getQuestions().stream().filter(question -> !question.isArchived()).count());
        body.put("totalPoints", totalPoints(test));
        return body;
    }

    private String testLabel(Test test) {
        return test.getTitle() + " #" + test.getId();
    }

    private Map<String, Object> testDetail(Test test, boolean includeCorrectOptions) {
        Map<String, Object> body = testSummary(test);
        body.put("questions", test.getQuestions().stream()
            .filter(question -> !question.isArchived())
            .sorted(Comparator.comparing(Question::getPosition))
            .map(question -> questionBody(question, includeCorrectOptions))
            .toList());
        return body;
    }

    private Map<String, Object> questionBody(Question question, boolean includeCorrectOptions) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", question.getId());
        body.put("type", question.typeValue());
        body.put("prompt", question.getPrompt());
        body.put("points", question.getPoints());
        body.put("position", question.getPosition());
        body.put("options", question.getOptions().stream()
            .filter(option -> !option.isArchived())
            .sorted(Comparator.comparing(QuestionOption::getPosition))
            .map(option -> optionBody(option, includeCorrectOptions))
            .toList());
        return body;
    }

    private Map<String, Object> optionBody(QuestionOption option, boolean includeCorrect) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", option.getId());
        body.put("label", option.getLabel());
        body.put("position", option.getPosition());
        if (includeCorrect) {
            body.put("correct", option.isCorrect());
        }
        return body;
    }

    private Map<String, Object> attemptSummary(TestAttempt attempt) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", attempt.getId());
        body.put("testId", attempt.getTest().getId());
        body.put("testTitle", attempt.getTest().getTitle());
        body.put("studentName", attempt.getStudentName());
        body.put("status", attempt.statusValue());
        body.put("scorePercent", attempt.getScorePercent());
        body.put("earnedPoints", earnedPoints(attempt));
        body.put("totalPoints", totalPoints(attempt.getTest()));
        body.put("startedAt", attempt.getStartedAt());
        body.put("submittedAt", attempt.getSubmittedAt());
        if (attempt.getShareLink() != null) {
            body.put("shareLinkId", attempt.getShareLink().getId());
        }
        return body;
    }

    private Map<String, Object> shareLinkBody(TestShareLink link) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", link.getId());
        body.put("token", link.getToken());
        body.put("label", link.getLabel());
        body.put("testId", link.getTest().getId());
        body.put("testTitle", link.getTest().getTitle());
        body.put("availableFrom", link.getAvailableFrom());
        body.put("expiresAt", link.getExpiresAt());
        body.put("active", link.isActive());
        body.put("createdAt", link.getCreatedAt());
        body.put("maxAttempts", link.getMaxAttempts());
        body.put("allowStudentReview", link.isAllowStudentReview());
        body.put("simpleMode", link.isSimpleMode());
        body.put("invitedEmails", fromCsvStrings(link.getInvitedEmails()));
        body.put("invitedGroupIds", fromCsv(link.getInvitedGroupIds()));
        body.put("expired", !Instant.now().isBefore(link.getExpiresAt()));
        return body;
    }

    private Map<String, Object> sharedAttemptBody(TestShareLink link, TestAttempt attempt) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("test", testDetail(link.getTest(), false));
        body.put("shareLink", shareLinkBody(link));
        body.put("attempt", attemptSummary(attempt));
        return body;
    }

    private Map<String, Object> studentBody(TestAttempt attempt) {
        AppUser student = attempt.getStudent();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", student == null ? null : student.getId());
        body.put("name", student == null ? attempt.getStudentName() : student.getName());
        body.put("email", student == null ? null : student.getEmail());
        body.put("source", student == null ? "Name Input" : "Registered Account");
        body.put("attemptCount", 0);
        body.put("lastAttemptAt", attempt.getStartedAt());
        body.put("tests", new java.util.LinkedHashSet<String>());
        return body;
    }

    private Map<String, Object> attemptDetail(TestAttempt attempt) {
        if (!attempt.isInProgress()) {
            ensureAnswerRowsForAllQuestions(attempt);
        }
        Map<String, Object> body = attemptSummary(attempt);
        body.put("canViewDetails", true);
        body.put("answers", attempt.getAnswers().stream()
            .sorted(Comparator.comparing(answer -> answer.getQuestion().getPosition()))
            .map(this::answerBody)
            .toList());
        return body;
    }

    private boolean applySubmittedAnswers(TestAttempt attempt, Map<Long, Question> questionsById, Map<String, Object> request) {
        Map<Long, Map<String, Object>> submittedAnswersByQuestionId = listOfMaps(request.get("answers")).stream()
            .collect(Collectors.toMap(
                answerRequest -> longValue(answerRequest.get("questionId")),
                answerRequest -> answerRequest,
                (left, right) -> right,
                LinkedHashMap::new
            ));

        submittedAnswersByQuestionId.keySet().stream()
            .filter(questionId -> !questionsById.containsKey(questionId))
            .findFirst()
            .ifPresent(questionId -> {
                throw new EntityNotFoundException("Question not found: " + questionId);
            });

        boolean requiresManualGrading = false;
        for (Question question : questionsById.values().stream().sorted(Comparator.comparing(Question::getPosition)).toList()) {
            AttemptAnswer answer = answerForQuestion(attempt, question, submittedAnswersByQuestionId.get(question.getId()));
            if (answer.isRequiresManualGrading()) {
                requiresManualGrading = true;
            }
            attempt.getAnswers().add(answer);
        }
        return requiresManualGrading;
    }

    private void ensureAnswerRowsForAllQuestions(TestAttempt attempt) {
        Set<Long> answeredQuestionIds = attempt.getAnswers().stream()
            .map(AttemptAnswer::getQuestion)
            .filter(Objects::nonNull)
            .map(Question::getId)
            .collect(Collectors.toSet());

        attempt.getTest().getQuestions().stream()
            .filter(question -> !question.isArchived())
            .filter(question -> !answeredQuestionIds.contains(question.getId()))
            .sorted(Comparator.comparing(Question::getPosition))
            .map(question -> answerForQuestion(attempt, question, null))
            .forEach(answer -> attempt.getAnswers().add(answer));
    }

    private AttemptAnswer answerForQuestion(TestAttempt attempt, Question question, Map<String, Object> answerRequest) {
        AttemptAnswer answer = new AttemptAnswer();
        answer.setAttempt(attempt);
        answer.setQuestion(question);
        answer.setAnswerText(answerRequest == null ? "" : stringValue(answerRequest.get("answerText")));

        List<Long> selectedOptionIds = answerRequest == null ? List.of() : listOfLongs(answerRequest.get("selectedOptionIds"));
        answer.setSelectedOptionIds(toCsv(selectedOptionIds));

        if (isAutoGradable(question)) {
            answer.setRequiresManualGrading(false);
            answer.setAwardedPoints(isChoiceCorrect(question, selectedOptionIds) ? question.getPoints() : 0);
        } else {
            answer.setRequiresManualGrading(true);
        }

        return answer;
    }

    private Map<String, Object> attemptSummaryOnly(TestAttempt attempt) {
        Map<String, Object> body = attemptSummary(attempt);
        body.put("canViewDetails", false);
        body.put("answers", List.of());
        return body;
    }

    private Map<String, Object> answerBody(AttemptAnswer answer) {
        List<Long> selectedOptionIds = fromCsv(answer.getSelectedOptionIds());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", answer.getId());
        body.put("questionId", answer.getQuestion().getId());
        body.put("type", answer.getQuestion().typeValue());
        body.put("prompt", answer.getQuestion().getPrompt());
        body.put("points", answer.getQuestion().getPoints());
        body.put("answerText", answer.getAnswerText());
        body.put("selectedOptionIds", selectedOptionIds);
        body.put("selectedOptions", selectedOptions(answer.getQuestion(), selectedOptionIds));
        body.put("awardedPoints", answer.getAwardedPoints());
        body.put("feedback", answer.getFeedback());
        body.put("requiresManualGrading", answer.isRequiresManualGrading());
        return body;
    }

    private List<Map<String, Object>> selectedOptions(Question question, List<Long> selectedOptionIds) {
        Set<Long> selected = new HashSet<>(selectedOptionIds);
        return question.getOptions().stream()
            .filter(option -> selected.contains(option.getId()))
            .sorted(Comparator.comparing(QuestionOption::getPosition))
            .map(option -> optionBody(option, false))
            .toList();
    }

    private boolean isAutoGradable(Question question) {
        return question.hasType(DropdownOptionIds.QUESTION_SINGLE_CHOICE) || question.hasType(DropdownOptionIds.QUESTION_MULTIPLE_CHOICE);
    }

    private boolean isChoiceCorrect(Question question, List<Long> selectedOptionIds) {
        Set<Long> selected = new HashSet<>(selectedOptionIds);
        Set<Long> correct = question.getOptions().stream()
            .filter(option -> !option.isArchived())
            .filter(QuestionOption::isCorrect)
            .map(QuestionOption::getId)
            .collect(Collectors.toSet());
        return selected.equals(correct);
    }

    private void updateScore(TestAttempt attempt) {
        int total = totalPoints(attempt.getTest());
        int earned = earnedPoints(attempt);
        attempt.setScorePercent(total == 0 ? 0 : Math.round((earned * 100f) / total));
    }

    private int totalPoints(Test test) {
        return test.getQuestions().stream()
            .filter(question -> !question.isArchived())
            .collect(Collectors.toMap(
                Question::getId,
                question -> question,
                (left, right) -> left,
                LinkedHashMap::new
            ))
            .values()
            .stream()
            .mapToInt(Question::getPoints)
            .sum();
    }

    private int earnedPoints(TestAttempt attempt) {
        return attempt.getAnswers().stream()
            .map(AttemptAnswer::getAwardedPoints)
            .filter(points -> points != null)
            .mapToInt(Integer::intValue)
            .sum();
    }

    private String toCsv(List<Long> ids) {
        if (ids.isEmpty()) {
            return "";
        }

        return ids.stream().sorted().map(String::valueOf).collect(Collectors.joining(","));
    }

    private String toCsvStrings(List<String> values) {
        return String.join(",", values);
    }

    private List<Long> fromCsv(String value) {
        if (value == null || value.isBlank()) {
            return new ArrayList<>();
        }

        return Arrays.stream(value.split(","))
            .filter(item -> !item.isBlank())
            .map(Long::valueOf)
            .toList();
    }

    private List<String> fromCsvStrings(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(item -> !item.isBlank())
            .toList();
    }

    private List<String> normalizedEmails(Object value) {
        if (value == null) {
            return List.of();
        }
        if (value instanceof List<?> items) {
            return items.stream()
                .map(String::valueOf)
                .flatMap(item -> Arrays.stream(item.split("[,\\n]")))
                .map(item -> item.trim().toLowerCase())
                .filter(item -> !item.isBlank())
                .distinct()
                .toList();
        }
        return Arrays.stream(String.valueOf(value).split("[,\\n]"))
            .map(item -> item.trim().toLowerCase())
            .filter(item -> !item.isBlank())
            .distinct()
            .toList();
    }

    private void applyGroupMembers(StudentGroup group, Object emailsValue) {
        group.getMembers().clear();
        for (String email : normalizedEmails(emailsValue)) {
            StudentGroupMember member = new StudentGroupMember();
            member.setGroup(group);
            member.setEmail(email);
            group.getMembers().add(member);
        }
    }

    private Map<String, Object> studentGroupBody(StudentGroup group) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", group.getId());
        body.put("name", group.getName());
        body.put("createdAt", group.getCreatedAt());
        body.put("emails", group.getMembers().stream().map(StudentGroupMember::getEmail).toList());
        body.put("studentCount", group.getMembers().size());
        return body;
    }

    private boolean studentCanViewAttemptDetails(TestAttempt attempt) {
        return attempt.getShareLink() == null || attempt.getShareLink().isAllowStudentReview();
    }

    private String requiredString(Map<String, Object> body, String key) {
        String value = stringValue(body.get(key));
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(key + " is required.");
        }
        return value;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private boolean booleanValue(Object value) {
        return value instanceof Boolean bool ? bool : Boolean.parseBoolean(String.valueOf(value));
    }

    private boolean booleanValueWithDefault(Object value, boolean fallback) {
        if (value == null) {
            return fallback;
        }
        return booleanValue(value);
    }

    private Integer optionalInteger(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        return integerValue(value, 0);
    }

    private int durationMinutes(Object value) {
        Integer minutes = optionalInteger(value);
        return minutes == null || minutes <= 0 ? 30 : minutes;
    }

    private int effectiveDurationMinutes(Test test) {
        Integer minutes = test.getDurationMinutes();
        return minutes == null || minutes <= 0 ? 30 : minutes;
    }

    private Long studentIdentityOptionId(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        String mode = stringValue(value);
        if (mode == null || mode.isBlank() || mode.equals("NAME_INPUT")) {
            return DropdownOptionIds.STUDENT_IDENTITY_NAME_INPUT;
        }
        if (mode.equals("REQUIRE_LOGIN")) {
            return DropdownOptionIds.STUDENT_IDENTITY_REQUIRE_LOGIN;
        }
        if (mode.equals("ANONYMOUS")) {
            return DropdownOptionIds.STUDENT_IDENTITY_ANONYMOUS;
        }
        return Long.parseLong(mode);
    }

    private String effectiveStudentIdentityMode(Test test) {
        return test.studentIdentityValue();
    }

    private String attemptStudentName(Test test, Map<String, Object> request, AppUser user) {
        if (test.hasStudentIdentity(DropdownOptionIds.STUDENT_IDENTITY_REQUIRE_LOGIN)) {
            if (user == null) {
                throw new IllegalStateException("Login is required to take this test.");
            }
            return user.getName();
        }
        if (test.hasStudentIdentity(DropdownOptionIds.STUDENT_IDENTITY_ANONYMOUS)) {
            String providedName = stringValue(request.get("studentName"));
            return providedName == null || providedName.isBlank() ? "Anonymous Student" : providedName.trim();
        }
        return requiredString(request, "studentName").trim();
    }

    private AppUser userFromCookie(String authCookie) {
        return authCookieService.userFromCookie(authCookie);
    }

    private AppUser requireTeacher(String authCookie) {
        AppUser user = userFromCookie(authCookie);
        if (user == null || !user.isTeacher()) {
            throw new IllegalStateException("Teacher access is required.");
        }
        return user;
    }

    private com.academykh.model.DropdownOption statusOption(long optionId) {
        return dropdownOptionRepository.getReferenceById(optionId);
    }

    private Long questionTypeOptionId(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        String type = stringValue(value);
        if (type == null || type.isBlank()) {
            return DropdownOptionIds.QUESTION_OPEN_ENDED;
        }
        if (type.equals("SINGLE_CHOICE")) {
            return DropdownOptionIds.QUESTION_SINGLE_CHOICE;
        }
        if (type.equals("MULTIPLE_CHOICE")) {
            return DropdownOptionIds.QUESTION_MULTIPLE_CHOICE;
        }
        if (type.equals("OPEN_ENDED")) {
            return DropdownOptionIds.QUESTION_OPEN_ENDED;
        }
        if (type.equals("CODING")) {
            return DropdownOptionIds.QUESTION_CODING;
        }
        return Long.parseLong(type);
    }

    private int integerValue(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null || String.valueOf(value).isBlank()) {
            return fallback;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private Long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    private Long optionalLong(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        return longValue(value);
    }

    private String optionalString(Object value, String fallback) {
        if (value == null || String.valueOf(value).isBlank()) {
            return fallback;
        }
        return String.valueOf(value);
    }

    private Instant requiredInstant(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("expiresAt is required.");
        }
        return Instant.parse(String.valueOf(value));
    }

    private Instant optionalInstant(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        return Instant.parse(String.valueOf(value));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> listOfMaps(Object value) {
        if (value == null) {
            return List.of();
        }
        return (List<Map<String, Object>>) value;
    }

    private List<Long> listOfLongs(Object value) {
        if (value == null) {
            return List.of();
        }
        if (!(value instanceof List<?> items)) {
            return List.of();
        }
        return items.stream().map(this::longValue).toList();
    }
}
