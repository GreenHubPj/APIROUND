package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Integer> {

    // 기본 조회
    Optional<Company> findByLoginId(String loginId);

    // ✅ 로그인 안전용(탈퇴 제외)
    Optional<Company> findByLoginIdAndDeletedAtIsNull(String loginId);

    // 중복/존재 체크
    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);
    boolean existsByBusinessRegistrationNumber(String businessRegistrationNumber);

    // ✅ 아이디 찾기용: 회사 기본정보 일치 확인
    Optional<Company> findByCompanyNameAndBusinessRegistrationNumberAndManagerNameAndEmail(
            String companyName, String businessRegistrationNumber, String managerName, String email
    );

    // ✅ 비번 재설정 1차 확인용
    Optional<Company> findByLoginIdAndCompanyNameAndBusinessRegistrationNumberAndManagerNameAndEmail(
            String loginId, String companyName, String businessRegistrationNumber, String managerName, String email
    );
}
