package com.academykh.repository;

import com.academykh.model.CourseModule;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseModuleRepository extends JpaRepository<CourseModule, Long> {
    @Query("""
        select distinct module from CourseModule module
        join fetch module.course course
        left join fetch module.lessons lessons
        where course.id = :courseId
        order by module.position asc, lessons.position asc
        """)
    List<CourseModule> findByCourseIdWithLessons(@Param("courseId") Long courseId);

    @Query("""
        select distinct module from CourseModule module
        join fetch module.course course
        left join fetch module.lessons lessons
        where module.id = :moduleId and course.createdBy.id = :teacherId
        """)
    Optional<CourseModule> findByIdAndCourseCreatedByIdWithLessons(
        @Param("moduleId") Long moduleId,
        @Param("teacherId") Long teacherId
    );

    @Query("""
        select module from CourseModule module
        join fetch module.course course
        where course.id = :courseId and course.createdBy.id = :teacherId
        order by module.position asc
        """)
    List<CourseModule> findByCourseIdAndCourseCreatedById(
        @Param("courseId") Long courseId,
        @Param("teacherId") Long teacherId
    );
}
