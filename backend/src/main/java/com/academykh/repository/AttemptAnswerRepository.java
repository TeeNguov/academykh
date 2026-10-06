package com.academykh.repository;

import com.academykh.model.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {
    @Query("select answer from AttemptAnswer answer join fetch answer.question where answer.id = :answerId")
    AttemptAnswer findOneForGrading(@Param("answerId") Long answerId);
}
