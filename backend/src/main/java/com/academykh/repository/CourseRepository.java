package com.academykh.repository;

import com.academykh.model.Course;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {
    @Query("select course from Course course where course.published = true order by course.createdAt desc")
    List<Course> findByPublishedTrueOrderByCreatedAtDesc();

    @Query("select course from Course course order by course.createdAt desc")
    List<Course> findAllNewestFirst();

    @Query("select course from Course course where course.createdBy.id = :teacherId order by course.createdAt desc")
    List<Course> findByCreatedByIdNewestFirst(@Param("teacherId") Long teacherId);

    @Query("select course from Course course where course.id = :courseId and course.published = true")
    Optional<Course> findPublishedById(@Param("courseId") Long courseId);

    @Query("select course from Course course where course.id = :courseId and course.createdBy.id = :teacherId")
    Optional<Course> findByIdAndCreatedById(@Param("courseId") Long courseId, @Param("teacherId") Long teacherId);
}
