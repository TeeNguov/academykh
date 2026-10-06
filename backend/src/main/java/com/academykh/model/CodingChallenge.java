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
@Table(name = "coding_challenges")
public class CodingChallenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 80)
    private String language;

    @Column(nullable = false, length = 80)
    private String difficulty;

    @Lob
    @Column(nullable = false)
    private String prompt;

    @Lob
    private String starterCode;

    @Column(nullable = false)
    private boolean published = false;

    @ManyToOne(fetch = FetchType.LAZY)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    private AppUser createdBy;
}
