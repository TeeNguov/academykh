package com.academykh.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "attempt_answers")
public class AttemptAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private TestAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    private Question question;

    @Lob
    private String answerText;

    @Lob
    private String selectedOptionIds;

    private Integer awardedPoints;

    @Lob
    private String feedback;

    @Column(nullable = false)
    private boolean requiresManualGrading = false;
}
