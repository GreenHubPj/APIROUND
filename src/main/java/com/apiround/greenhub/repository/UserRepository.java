package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginIdAndPassword(String loginId, String password);
    boolean existsByEmail(String email);
    boolean existsByLoginId(String loginId);
}
