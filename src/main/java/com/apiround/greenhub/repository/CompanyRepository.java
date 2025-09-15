package com.apiround.greenhub.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiround.greenhub.entity.Company;

public interface CompanyRepository extends JpaRepository<Company, Integer> {

    Optional<Company> findByLoginId(String loginId);

    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);
    boolean existsByBusinessRegistrationNumber(String businessRegistrationNumber);
}
