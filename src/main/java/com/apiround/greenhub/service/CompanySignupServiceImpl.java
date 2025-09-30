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

        String incomingPw = c.getPassword();
        if (incomingPw == null || incomingPw.isBlank()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }

        // ⚠️ 만약 상위 레이어(컨트롤러/필터)에서 이미 해시됐다면 정책 검증을 건너뜀
        if (!PasswordUtil.isEncoded(incomingPw)) {
            // 원문 비번만 정책 검증
            if (!PasswordUtil.isStrong(incomingPw)) {
                throw new IllegalArgumentException(PasswordUtil.policyMessage());
            }
            // 단일 해시
            c.setPassword(PasswordUtil.encode(incomingPw));
        } else {
            // 이미 해시된 값은 그대로 저장 (재해시 금지)
            // 정책 검증은 프런트/상위 레이어에서 완료됐다고 간주
            c.setPassword(incomingPw);
        }

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
