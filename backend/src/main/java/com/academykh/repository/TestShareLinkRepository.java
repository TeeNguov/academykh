package com.academykh.repository;

import com.academykh.model.TestShareLink;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TestShareLinkRepository extends JpaRepository<TestShareLink, Long> {
    @Query("""
        select link from TestShareLink link
        join fetch link.test test
        order by link.createdAt desc
        """)
    List<TestShareLink> findAllNewestFirst();

    @Query("""
        select link from TestShareLink link
        join fetch link.test test
        where test.createdBy.id = :teacherId
        order by link.createdAt desc
        """)
    List<TestShareLink> findByTestCreatedByIdNewestFirst(@Param("teacherId") Long teacherId);

    @Query("""
        select link from TestShareLink link
        join fetch link.test test
        where link.id = :linkId
        and test.createdBy.id = :teacherId
        """)
    Optional<TestShareLink> findByIdAndTestCreatedById(@Param("linkId") Long linkId, @Param("teacherId") Long teacherId);

    @Query("""
        select link from TestShareLink link
        join fetch link.test test
        left join fetch test.questions questions
        where link.token = :token
        """)
    Optional<TestShareLink> findByTokenWithTest(@Param("token") String token);

    @Query("""
        select distinct link from TestShareLink link
        join fetch link.test test
        left join fetch test.questions
        where link.active = true
        and test.studentIdentityOption.id = 5001
        and (link.availableFrom is null or link.availableFrom <= CURRENT_TIMESTAMP)
        and link.expiresAt > CURRENT_TIMESTAMP
        order by link.expiresAt asc
        """)
    List<TestShareLink> findOpenLoginRequiredLinks();

    @Query("""
        select distinct link from TestAttempt attempt
        join attempt.shareLink link
        join fetch link.test test
        left join fetch test.questions
        where attempt.student.id = :studentId
        and attempt.statusOption.id = 2001
        and link.active = true
        and (link.availableFrom is null or link.availableFrom <= CURRENT_TIMESTAMP)
        and link.expiresAt > CURRENT_TIMESTAMP
        order by link.expiresAt asc
        """)
    List<TestShareLink> findOpenLinksAccessedByStudent(@Param("studentId") Long studentId);
}
