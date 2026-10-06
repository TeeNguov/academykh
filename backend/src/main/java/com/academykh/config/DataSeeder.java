package com.academykh.config;

import com.academykh.model.CodingChallenge;
import com.academykh.model.Course;
import com.academykh.model.DropdownOptionIds;
import com.academykh.model.Question;
import com.academykh.model.QuestionOption;
import com.academykh.model.Test;
import com.academykh.repository.CodingChallengeRepository;
import com.academykh.repository.CourseRepository;
import com.academykh.repository.DropdownOptionRepository;
import com.academykh.repository.TestRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {
    private final CourseRepository courseRepository;
    private final CodingChallengeRepository codingChallengeRepository;
    private final TestRepository testRepository;
    private final DropdownOptionRepository dropdownOptionRepository;

    public DataSeeder(
        CourseRepository courseRepository,
        CodingChallengeRepository codingChallengeRepository,
        TestRepository testRepository,
        DropdownOptionRepository dropdownOptionRepository
    ) {
        this.courseRepository = courseRepository;
        this.codingChallengeRepository = codingChallengeRepository;
        this.testRepository = testRepository;
        this.dropdownOptionRepository = dropdownOptionRepository;
    }

    @Override
    public void run(String... args) {
        if (courseRepository.count() == 0) {
            createCourse("Algebra Foundations", "Mathematics", "Beginner", true);
            createCourse("Physics Problem Solving", "Physics", "Beginner", true);
            createCourse("Chemistry Reactions", "Chemistry", "Intermediate", true);
        }

        if (codingChallengeRepository.count() == 0) {
            createChallenge("Balance A Chemical Equation", "Chemistry", "Easy", true);
            createChallenge("Solve A Quadratic Equation", "Mathematics", "Medium", true);
        }

        if (testRepository.count() == 0) {
            createStarterTest();
        }
    }

    private void createCourse(String title, String language, String level, boolean published) {
        Course course = new Course();
        course.setTitle(title);
        course.setLanguage(language);
        course.setLevel(level);
        course.setPublished(published);
        courseRepository.save(course);
    }

    private void createChallenge(String title, String language, String difficulty, boolean published) {
        CodingChallenge challenge = new CodingChallenge();
        challenge.setTitle(title);
        challenge.setLanguage(language);
        challenge.setDifficulty(difficulty);
        challenge.setPrompt("Solve the problem and submit your source code for review.");
        challenge.setStarterCode("");
        challenge.setPublished(published);
        codingChallengeRepository.save(challenge);
    }

    private void createStarterTest() {
        Test test = new Test();
        test.setTitle("Foundations Checkpoint");
        test.setExam(false);
        test.setDurationMinutes(30);
        test.setPublished(true);

        Question choice = createQuestion(test, DropdownOptionIds.QUESTION_SINGLE_CHOICE, "Which subject studies matter, atoms, and chemical reactions?", 1, 1);
        addOption(choice, "Mathematics", false, 1);
        addOption(choice, "Chemistry", true, 2);
        addOption(choice, "Physics", false, 3);
        test.getQuestions().add(choice);

        Question openEnded = createQuestion(test, DropdownOptionIds.QUESTION_OPEN_ENDED, "Explain how formulas help solve problems in math or physics.", 4, 2);
        test.getQuestions().add(openEnded);

        Question coding = createQuestion(test, DropdownOptionIds.QUESTION_CODING, "Write a small program or pseudocode that calculates the average of three measurements.", 5, 3);
        test.getQuestions().add(coding);

        testRepository.save(test);
    }

    private Question createQuestion(Test test, long typeOptionId, String prompt, int points, int position) {
        Question question = new Question();
        question.setTest(test);
        question.setTypeOption(dropdownOptionRepository.getReferenceById(typeOptionId));
        question.setPrompt(prompt);
        question.setPoints(points);
        question.setPosition(position);
        return question;
    }

    private void addOption(Question question, String label, boolean correct, int position) {
        QuestionOption option = new QuestionOption();
        option.setQuestion(question);
        option.setLabel(label);
        option.setCorrect(correct);
        option.setPosition(position);
        question.getOptions().add(option);
    }
}
