package com.academykh.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
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
@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private DropdownOption typeOption;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String prompt;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String explanation;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private int points = 1;

    @Column(nullable = false)
    private boolean archived = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private Test test;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<QuestionOption> options = new ArrayList<>();

    public boolean hasType(long typeOptionId) {
        return typeOption != null && typeOption.getId() != null && typeOption.getId() == typeOptionId;
    }

    public String typeValue() {
        if (typeOption == null || typeOption.getId() == null) {
            return "OPEN_ENDED";
        }
        if (typeOption.getId() == DropdownOptionIds.QUESTION_SINGLE_CHOICE) {
            return "SINGLE_CHOICE";
        }
        if (typeOption.getId() == DropdownOptionIds.QUESTION_MULTIPLE_CHOICE) {
            return "MULTIPLE_CHOICE";
        }
        if (typeOption.getId() == DropdownOptionIds.QUESTION_CODING) {
            return "CODING";
        }
        if (typeOption.getId() == DropdownOptionIds.QUESTION_OPEN_ENDED) {
            return "OPEN_ENDED";
        }
        return typeOption.getValue() == null ? "OPEN_ENDED" : typeOption.getValue();
    }
}
