package com.apiround.greenhub.service;

import java.time.LocalDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.util.PasswordUtil;

@Service
@Transactional
public class CompanySignupServiceImpl implements CompanySignupService {

    private final CompanyRepository companyRepository;

    public CompanySignupServiceImpl(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Override
    public Company signupCompany(Company c) {
        if (companyRepository.existsByLoginId(c.getLoginId()))
            throw new IllegalArgumentException("이미 사용 중인 판매자 아이디입니다.");
        if (companyRepository.existsByEmail(c.getEmail()))
            throw new IllegalArgumentException("이미 등록된 회사 이메일입니다.");
        if (companyRepository.existsByBusinessRegistrationNumber(c.getBusinessRegistrationNumber()))
            throw new IllegalArgumentException("이미 등록된 사업자등록번호입니다.");

        // 비밀번호 정책(서버 보강) – 컨트롤러에서 1차 검증했지만 서비스에서도 한 번 더 확인
        if (!PasswordUtil.isStrong(c.getPassword())) {
            throw new IllegalArgumentException(PasswordUtil.policyMessage());
        }

        // 🔐 여기서 '단 한 번' 해싱 (컨트롤러에서는 원문을 넘겨줘야 함)
        c.setPassword(PasswordUtil.encode(c.getPassword()));
        LocalDateTime now = LocalDateTime.now();
        c.setCreatedAt(now);
        c.setUpdatedAt(now);

        try {
            return companyRepository.save(c);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("판매자 정보가 중복되었거나 잘못되었습니다.");
        }
    }
}
