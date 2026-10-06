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
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "code_submissions")
public class CodeSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private AppUser student;

    @ManyToOne(fetch = FetchType.LAZY)
    private CodingChallenge challenge;

    @Column(nullable = false, length = 80)
    private String language;

    @Lob
    @Column(nullable = false)
    private String sourceCode;

    @Column(nullable = false)
    private String status = "SUBMITTED";

    @Column(nullable = false)
    private Instant submittedAt = Instant.now();
}
