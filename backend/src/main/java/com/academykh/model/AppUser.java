package com.academykh.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.EAGER)
    private DropdownOption roleOption;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public boolean isTeacher() {
        return hasRole(DropdownOptionIds.ROLE_TEACHER);
    }

    public boolean hasRole(long roleOptionId) {
        return roleOption != null && roleOption.getId() != null && roleOption.getId() == roleOptionId;
    }

    public String roleValue() {
        if (roleOption == null || roleOption.getId() == null) {
            return "STUDENT";
        }
        if (roleOption.getId() == DropdownOptionIds.ROLE_TEACHER) {
            return "TEACHER";
        }
        if (roleOption.getId() == DropdownOptionIds.ROLE_STUDENT) {
            return "STUDENT";
        }
        return roleOption.getValue() == null ? "STUDENT" : roleOption.getValue();
    }
}
