package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    // 기본 조회
    Optional<User> findByLoginId(String loginId);

    // ✅ 로그인 안전용(탈퇴 제외)
    Optional<User> findByLoginIdAndDeletedAtIsNull(String loginId);

    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);

    // ✅ 아이디 찾기용: 이름+이메일
    Optional<User> findByNameAndEmail(String name, String email);

    // ✅ 비번 재설정 1차 확인용: 아이디+이름+이메일
    Optional<User> findByLoginIdAndNameAndEmail(String loginId, String name, String email);

    // SMS 동의한 사용자들만 조회하는 메서드
    List<User> findBySmsConsentTrueAndDeletedAtIsNull();

}
