package com.academykh.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity(name = "AcademyTest")
@Table(name = "tests")
public class Test {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false)
    private boolean exam = false;

    private Integer durationMinutes;

    @ManyToOne(fetch = FetchType.LAZY)
    private DropdownOption studentIdentityOption;

    @Column(nullable = false)
    private boolean published = false;

    @ManyToOne(fetch = FetchType.LAZY)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    private AppUser createdBy;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<Question> questions = new ArrayList<>();

    public boolean hasStudentIdentity(long studentIdentityOptionId) {
        return studentIdentityOption != null && studentIdentityOption.getId() != null && studentIdentityOption.getId() == studentIdentityOptionId;
    }

    public String studentIdentityValue() {
        if (studentIdentityOption == null || studentIdentityOption.getId() == null) {
            return "NAME_INPUT";
        }
        if (studentIdentityOption.getId() == DropdownOptionIds.STUDENT_IDENTITY_REQUIRE_LOGIN) {
            return "REQUIRE_LOGIN";
        }
        if (studentIdentityOption.getId() == DropdownOptionIds.STUDENT_IDENTITY_ANONYMOUS) {
            return "ANONYMOUS";
        }
        if (studentIdentityOption.getId() == DropdownOptionIds.STUDENT_IDENTITY_NAME_INPUT) {
            return "NAME_INPUT";
        }
        return studentIdentityOption.getValue() == null ? "NAME_INPUT" : studentIdentityOption.getValue();
    }
}
