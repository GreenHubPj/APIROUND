package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.service.EmailCodeService;
import com.apiround.greenhub.service.PasswordResetService;
import com.apiround.greenhub.util.PasswordUtil;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
public class AccountRecoveryController {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final EmailCodeService emailCodeService;
    private final PasswordResetService resetService;

    public AccountRecoveryController(UserRepository userRepository,
                                     CompanyRepository companyRepository,
                                     EmailCodeService emailCodeService,
                                     PasswordResetService resetService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.emailCodeService = emailCodeService;
        this.resetService = resetService;
    }

    // ──────────────────────────────
    // 아이디 찾기 (개인)
    // name, email, code(선택) → email 인증 여부 확인 후 반환
    // ──────────────────────────────
    @PostMapping("/find-id")
    public ResponseEntity<Map<String, Object>> findUserId(
            @RequestParam String name,
            @RequestParam String email
    ) {
        Map<String, Object> res = new HashMap<>();
        if (!emailCodeService.isVerified(email.trim())) {
            res.put("success", false);
            res.put("message", "이메일 인증이 완료되지 않았습니다.");
            return ResponseEntity.badRequest().body(res);
        }

        return userRepository.findByNameAndEmail(name.trim(), email.trim())
                .map(u -> {
                    res.put("success", true);
                    res.put("userId", u.getLoginId());
                    res.put("joinDate", u.getCreatedAt() != null
                            ? u.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_DATE)
                            : null);
                    return ResponseEntity.ok(res);
                })
                .orElseGet(() -> {
                    res.put("success", false);
                    res.put("message", "일치하는 회원을 찾을 수 없습니다.");
                    return ResponseEntity.ok(res);
                });
    }

    // ──────────────────────────────
    // 아이디 찾기 (판매자)
    // companyName, businessNo, managerName, email
    // ──────────────────────────────
    @PostMapping("/find-id-company")
    public ResponseEntity<Map<String, Object>> findCompanyId(
            @RequestParam String companyName,
            @RequestParam String businessNumber,
            @RequestParam String managerName,
            @RequestParam String email
    ) {
        Map<String, Object> res = new HashMap<>();
        if (!emailCodeService.isVerified(email.trim())) {
            res.put("success", false);
            res.put("message", "이메일 인증이 완료되지 않았습니다.");
            return ResponseEntity.badRequest().body(res);
        }

        return companyRepository
                .findByCompanyNameAndBusinessRegistrationNumberAndManagerNameAndEmail(
                        companyName.trim(),
                        businessNumber.trim().replaceAll("\\s", ""),
                        managerName.trim(),
                        email.trim()
                )
                .map(c -> {
                    res.put("success", true);
                    res.put("userId", c.getLoginId());
                    res.put("joinDate", c.getCreatedAt() != null
                            ? c.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_DATE)
                            : null);
                    return ResponseEntity.ok(res);
                })
                .orElseGet(() -> {
                    res.put("success", false);
                    res.put("message", "일치하는 판매자 계정을 찾을 수 없습니다.");
                    return ResponseEntity.ok(res);
                });
    }

    // ──────────────────────────────
    // 비밀번호 재설정 시작 (개인)
    // loginId, name, email (이메일 인증 필수) → resetToken 발급
    // ──────────────────────────────
    @PostMapping("/reset/start-personal")
    public ResponseEntity<Map<String, Object>> startResetPersonal(
            @RequestParam String loginId,
            @RequestParam String name,
            @RequestParam String email
    ) {
        Map<String, Object> res = new HashMap<>();
        if (!emailCodeService.isVerified(email.trim())) {
            res.put("success", false);
            res.put("message", "이메일 인증이 완료되지 않았습니다.");
            return ResponseEntity.badRequest().body(res);
        }

        return userRepository.findByLoginIdAndNameAndEmail(loginId.trim(), name.trim(), email.trim())
                .map(u -> {
                    String token = resetService.issueForUser(u.getUserId());
                    res.put("success", true);
                    res.put("resetToken", token);
                    return ResponseEntity.ok(res);
                })
                .orElseGet(() -> {
                    res.put("success", false);
                    res.put("message", "입력한 정보와 일치하는 계정을 찾을 수 없습니다.");
                    return ResponseEntity.ok(res);
                });
    }

    // ──────────────────────────────
    // 비밀번호 재설정 시작 (판매)
    // loginId, companyName, businessNumber, managerName, email (이메일 인증 필수)
    // ──────────────────────────────
    @PostMapping("/reset/start-company")
    public ResponseEntity<Map<String, Object>> startResetCompany(
            @RequestParam String loginId,
            @RequestParam String companyName,
            @RequestParam String businessNumber,
            @RequestParam String managerName,
            @RequestParam String email
    ) {
        Map<String, Object> res = new HashMap<>();
        if (!emailCodeService.isVerified(email.trim())) {
            res.put("success", false);
            res.put("message", "이메일 인증이 완료되지 않았습니다.");
            return ResponseEntity.badRequest().body(res);
        }

        return companyRepository.findByLoginIdAndCompanyNameAndBusinessRegistrationNumberAndManagerNameAndEmail(
                        loginId.trim(),
                        companyName.trim(),
                        businessNumber.trim().replaceAll("\\s", ""),
                        managerName.trim(),
                        email.trim()
                )
                .map(c -> {
                    String token = resetService.issueForCompany(c.getCompanyId());
                    res.put("success", true);
                    res.put("resetToken", token);
                    return ResponseEntity.ok(res);
                })
                .orElseGet(() -> {
                    res.put("success", false);
                    res.put("message", "입력한 정보와 일치하는 판매자 계정을 찾을 수 없습니다.");
                    return ResponseEntity.ok(res);
                });
    }

    // ──────────────────────────────
    // 비밀번호 재설정 완료 (토큰 + 새 비번)
    // ──────────────────────────────
    @PostMapping("/reset/finish")
    public ResponseEntity<Map<String, Object>> finishReset(
            @RequestParam String resetToken,
            @RequestParam String newPassword
    ) {
        Map<String, Object> res = new HashMap<>();
        var ticket = resetService.consume(resetToken);
        if (ticket == null) {
            res.put("success", false);
            res.put("message", "토큰이 유효하지 않거나 만료되었습니다.");
            return ResponseEntity.badRequest().body(res);
        }

        if (newPassword == null || newPassword.length() < 8) {
            res.put("success", false);
            res.put("message", "비밀번호는 8자 이상이어야 합니다.");
            return ResponseEntity.badRequest().body(res);
        }

        try {
            switch (ticket.type) {
                case PERSONAL -> {
                    User u = userRepository.findById(ticket.userId)
                            .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
                    u.setPassword(PasswordUtil.encode(newPassword));
                    userRepository.save(u);
                }
                case COMPANY -> {
                    Company c = companyRepository.findById(ticket.companyId)
                            .orElseThrow(() -> new IllegalStateException("회사를 찾을 수 없습니다."));
                    c.setPassword(PasswordUtil.encode(newPassword));
                    companyRepository.save(c);
                }
            }
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", "비밀번호 변경 중 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(res);
        }

        res.put("success", true);
        res.put("message", "비밀번호가 변경되었습니다.");
        return ResponseEntity.ok(res);
    }
}
