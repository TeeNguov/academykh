package com.academykh.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "test_share_links")
public class TestShareLink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String token;

    @Column(nullable = false, length = 180)
    private String label;

    private Instant availableFrom;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int maxAttempts = 1;

    @Column(nullable = false)
    private boolean allowStudentReview = false;

    @Column(nullable = false)
    private boolean simpleMode = false;

    @Column(columnDefinition = "LONGTEXT")
    private String invitedEmails;

    @Column(columnDefinition = "LONGTEXT")
    private String invitedGroupIds;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private Test test;
}
