package com.academykh.repository;

import com.academykh.model.TestAttempt;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        left join fetch test.questions
        order by attempt.startedAt desc
        """)
    List<TestAttempt> findAllByOrderByStartedAtDesc();

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        left join fetch test.questions
        where test.createdBy.id = :teacherId
        order by attempt.startedAt desc
        """)
    List<TestAttempt> findByTestCreatedByIdNewestFirst(@Param("teacherId") Long teacherId);

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        left join fetch attempt.student student
        where test.createdBy.id = :teacherId
        order by attempt.startedAt desc
        """)
    List<TestAttempt> findStudentsByTestCreatedByIdNewestFirst(@Param("teacherId") Long teacherId);

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        left join fetch attempt.answers answers
        left join fetch answers.question answerQuestion
        where attempt.id = :attemptId
        """)
    Optional<TestAttempt> findByIdWithAnswers(@Param("attemptId") Long attemptId);

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        left join fetch attempt.answers answers
        left join fetch answers.question answerQuestion
        where attempt.id = :attemptId and test.createdBy.id = :teacherId
        """)
    Optional<TestAttempt> findByIdAndTestCreatedByIdWithAnswers(@Param("attemptId") Long attemptId, @Param("teacherId") Long teacherId);

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        left join fetch attempt.answers answers
        left join fetch answers.question answerQuestion
        where attempt.id = :attemptId and attempt.student.id = :studentId
        """)
    Optional<TestAttempt> findByIdAndStudentIdWithAnswers(@Param("attemptId") Long attemptId, @Param("studentId") Long studentId);

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        join fetch attempt.shareLink link
        where link.token = :token and lower(attempt.studentName) = lower(:studentName)
        order by attempt.startedAt desc
        """)
    List<TestAttempt> findByShareTokenAndStudentName(
        @Param("token") String token,
        @Param("studentName") String studentName
    );

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        left join fetch test.questions
        where attempt.student.id = :studentId
        order by attempt.startedAt desc
        """)
    List<TestAttempt> findByStudentIdNewestFirst(@Param("studentId") Long studentId);

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        join fetch attempt.shareLink link
        left join fetch attempt.answers answers
        left join fetch answers.question
        where link.token = :token and attempt.id = :attemptId
        """)
    Optional<TestAttempt> findByShareTokenAndAttemptId(
        @Param("token") String token,
        @Param("attemptId") Long attemptId
    );

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        join fetch attempt.shareLink link
        left join fetch test.questions
        where link.id = :shareLinkId and (test.createdBy.id = :teacherId or test.createdBy is null)
        order by attempt.startedAt desc
        """)
    List<TestAttempt> findByShareLinkIdAndTestCreatedByIdNewestFirst(
        @Param("shareLinkId") Long shareLinkId,
        @Param("teacherId") Long teacherId
    );

    @Query("""
        select distinct attempt from TestAttempt attempt
        join fetch attempt.test test
        join fetch attempt.shareLink link
        left join fetch attempt.answers answers
        left join fetch answers.question answerQuestion
        where link.id = :shareLinkId and attempt.id = :attemptId and (test.createdBy.id = :teacherId or test.createdBy is null)
        """)
    Optional<TestAttempt> findByShareLinkIdAndAttemptIdAndTestCreatedByIdWithAnswers(
        @Param("shareLinkId") Long shareLinkId,
        @Param("attemptId") Long attemptId,
        @Param("teacherId") Long teacherId
    );
}
