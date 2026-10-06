package com.academykh.repository;

import com.academykh.model.AppUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    @Query("select user from AppUser user where lower(user.email) = lower(:email)")
    Optional<AppUser> findByEmail(@Param("email") String email);

    @Query("select count(user) > 0 from AppUser user where lower(user.email) = lower(:email)")
    boolean existsByEmail(@Param("email") String email);

    @Query("select count(user) from AppUser user where user.roleOption.id = :roleOptionId")
    long countByRoleOptionId(@Param("roleOptionId") Long roleOptionId);
}
