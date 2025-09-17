package com.apiround.greenhub.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiround.greenhub.entity.Company;

public interface CompanyRepository extends JpaRepository<Company, Integer> {

    Optional<Company> findByLoginId(String loginId);

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
