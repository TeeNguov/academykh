package com.academykh.repository;

import com.academykh.model.Test;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TestRepository extends JpaRepository<Test, Long> {
    @Query("select distinct q from AcademyTest q left join fetch q.questions questions order by q.id desc")
    List<Test> findAllWithQuestions();

    @Query("""
        select distinct q from AcademyTest q
        left join fetch q.questions questions
        where q.published = true
        order by q.id desc
        """)
    List<Test> findPublishedWithQuestions();

    @Query("""
        select distinct q from AcademyTest q
        left join fetch q.questions questions
        where q.createdBy.id = :teacherId
        order by q.id desc
        """)
    List<Test> findByCreatedByIdWithQuestions(@Param("teacherId") Long teacherId);

    @Query("""
        select distinct q from AcademyTest q
        left join fetch q.questions questions
        where q.id = :testId
        """)
    Optional<Test> findByIdWithQuestions(@Param("testId") Long testId);

    @Query("""
        select distinct q from AcademyTest q
        left join fetch q.questions questions
        where q.id = :testId and q.createdBy.id = :teacherId
        """)
    Optional<Test> findByIdAndCreatedByIdWithQuestions(@Param("testId") Long testId, @Param("teacherId") Long teacherId);

    @Query("select q from AcademyTest q where q.exam = true order by q.id desc")
    List<Test> findByExamTrueOrderByIdDesc();
}
