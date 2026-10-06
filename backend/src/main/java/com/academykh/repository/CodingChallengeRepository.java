package com.academykh.repository;

import com.academykh.model.CodingChallenge;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CodingChallengeRepository extends JpaRepository<CodingChallenge, Long> {
    @Query("select challenge from CodingChallenge challenge where challenge.published = true order by challenge.id desc")
    List<CodingChallenge> findByPublishedTrueOrderByIdDesc();

    @Query("select challenge from CodingChallenge challenge order by challenge.id desc")
    List<CodingChallenge> findAllNewestFirst();

    @Query("select challenge from CodingChallenge challenge where challenge.createdBy.id = :teacherId order by challenge.id desc")
    List<CodingChallenge> findByCreatedByIdNewestFirst(@Param("teacherId") Long teacherId);
}
