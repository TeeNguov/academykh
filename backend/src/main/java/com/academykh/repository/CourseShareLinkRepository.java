package com.academykh.repository;

import com.academykh.model.CourseShareLink;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseShareLinkRepository extends JpaRepository<CourseShareLink, Long> {
    @Query("""
        select link from CourseShareLink link
        join fetch link.course course
        where course.id = :courseId
        and course.createdBy.id = :teacherId
        order by link.createdAt desc
        """)
    List<CourseShareLink> findByCourseIdAndCreatedByIdNewestFirst(@Param("courseId") Long courseId, @Param("teacherId") Long teacherId);

    @Query("""
        select link from CourseShareLink link
        join fetch link.course course
        where link.token = :token
        """)
    Optional<CourseShareLink> findByTokenWithCourse(@Param("token") String token);
}
