package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);

    Optional<User> findByLoginId(String loginId);
    Optional<User> findByEmail(String email);
}
