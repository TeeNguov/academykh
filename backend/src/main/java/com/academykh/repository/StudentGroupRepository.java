package com.academykh.repository;

import com.academykh.model.StudentGroup;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentGroupRepository extends JpaRepository<StudentGroup, Long> {
    @Query("""
        select distinct studentGroup from StudentGroup studentGroup
        left join fetch studentGroup.members
        where studentGroup.createdBy.id = :teacherId
        order by studentGroup.createdAt desc
        """)
    List<StudentGroup> findByCreatedByIdWithMembers(@Param("teacherId") Long teacherId);

    @Query("""
        select distinct studentGroup from StudentGroup studentGroup
        left join fetch studentGroup.members
        where studentGroup.id = :groupId and studentGroup.createdBy.id = :teacherId
        """)
    Optional<StudentGroup> findByIdAndCreatedByIdWithMembers(@Param("groupId") Long groupId, @Param("teacherId") Long teacherId);

    @Query("""
        select distinct studentGroup from StudentGroup studentGroup
        join fetch studentGroup.createdBy
        left join fetch studentGroup.members member
        where lower(member.email) = lower(:email)
        order by studentGroup.createdAt desc
        """)
    List<StudentGroup> findByMemberEmailWithMembers(@Param("email") String email);
}
