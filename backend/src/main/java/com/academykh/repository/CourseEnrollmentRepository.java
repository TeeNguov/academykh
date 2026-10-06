package com.academykh.repository;

import com.academykh.model.CourseEnrollment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {
    @Query("""
        select enrollment from CourseEnrollment enrollment
        join fetch enrollment.course course
        where enrollment.student.id = :studentId
        order by enrollment.enrolledAt desc
        """)
    List<CourseEnrollment> findByStudentIdWithCourse(@Param("studentId") Long studentId);

    @Query("""
        select count(enrollment) > 0 from CourseEnrollment enrollment
        where enrollment.student.id = :studentId
        and enrollment.course.id = :courseId
        """)
    boolean existsByStudentIdAndCourseId(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("""
        select enrollment from CourseEnrollment enrollment
        join fetch enrollment.student student
        where enrollment.course.id = :courseId
        order by enrollment.enrolledAt desc
        """)
    List<CourseEnrollment> findByCourseIdWithStudent(@Param("courseId") Long courseId);

    @Query("""
        select enrollment from CourseEnrollment enrollment
        where enrollment.student.id = :studentId
        and enrollment.course.id = :courseId
        """)
    Optional<CourseEnrollment> findByStudentIdAndCourseId(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("""
        select enrollment from CourseEnrollment enrollment
        where enrollment.id = :enrollmentId
        and enrollment.course.id = :courseId
        and enrollment.course.createdBy.id = :teacherId
        """)
    Optional<CourseEnrollment> findByIdAndCourseIdAndCourseCreatedById(
        @Param("enrollmentId") Long enrollmentId,
        @Param("courseId") Long courseId,
        @Param("teacherId") Long teacherId
    );
}
