package com.academykh.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "test_attempts")
public class TestAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private AppUser student;

    @Column(nullable = false, length = 160)
    private String studentName = "Student";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY)
    private TestShareLink shareLink;

    @ManyToOne(fetch = FetchType.LAZY)
    private DropdownOption statusOption;

    private Integer scorePercent;

    @Column(nullable = false)
    private Instant startedAt = Instant.now();

    private Instant submittedAt;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<AttemptAnswer> answers = new ArrayList<>();

    public boolean isInProgress() {
        return hasStatus(DropdownOptionIds.ATTEMPT_IN_PROGRESS);
    }

    public boolean hasStatus(long statusOptionId) {
        return statusOption != null && statusOption.getId() != null && statusOption.getId() == statusOptionId;
    }

    public String statusValue() {
        if (statusOption == null || statusOption.getId() == null) {
            return "IN_PROGRESS";
        }
        if (statusOption.getId() == DropdownOptionIds.ATTEMPT_SUBMITTED) {
            return "SUBMITTED";
        }
        if (statusOption.getId() == DropdownOptionIds.ATTEMPT_GRADED) {
            return "GRADED";
        }
        if (statusOption.getId() == DropdownOptionIds.ATTEMPT_IN_PROGRESS) {
            return "IN_PROGRESS";
        }
        return statusOption.getValue() == null ? "IN_PROGRESS" : statusOption.getValue();
    }
}
