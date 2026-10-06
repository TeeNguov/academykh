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
@Table(name = "lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private boolean published = false;

    @ManyToOne(fetch = FetchType.LAZY)
    private DropdownOption typeOption;

    @Column(length = 80)
    private String codeLanguage;

    @ManyToOne(fetch = FetchType.LAZY)
    private CourseModule module;

    public boolean isCode() {
        return hasType(DropdownOptionIds.LESSON_CODE);
    }

    public boolean hasType(long typeOptionId) {
        return typeOption != null && typeOption.getId() != null && typeOption.getId() == typeOptionId;
    }

    public String typeValue() {
        if (typeOption == null || typeOption.getId() == null) {
            return "RICH_TEXT";
        }
        if (typeOption.getId() == DropdownOptionIds.LESSON_CODE) {
            return "CODE";
        }
        if (typeOption.getId() == DropdownOptionIds.LESSON_RICH_TEXT) {
            return "RICH_TEXT";
        }
        return typeOption.getValue() == null ? "RICH_TEXT" : typeOption.getValue();
    }
}
