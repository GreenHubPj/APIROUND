package com.apiround.greenhub.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.service.EmailCodeService;
import com.apiround.greenhub.util.PasswordUtil;

import jakarta.servlet.http.HttpSession;

@Controller
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final EmailCodeService emailCodeService;

    public AuthController(UserRepository userRepository, EmailCodeService emailCodeService) {
        this.userRepository = userRepository;
        this.emailCodeService = emailCodeService;
    }

    // 모든 뷰에 user 모델 주입 (Thymeleaf 바인딩 오류 방지)
    @ModelAttribute("user")
    public User user() {
        return new User();
    }

    // 모든 뷰에 로그인 사용자 정보 주입
    @ModelAttribute("LOGIN_USER")
    public User loginUser(HttpSession session) {
        return (User) session.getAttribute("LOGIN_USER");
    }

    // ─────────────────  View  ─────────────────
    @GetMapping("/signup")
    public String signupForm() {
        return "signup";
    }

    @GetMapping("/login")
    public String loginForm() { return "login"; }

    // ─────────────────  이메일 인증 API (두 버전 모두 지원)  ─────────────────
    // V1: /auth/email/send  (텍스트 응답 / JS가 res.ok만 확인하는 버전 대응)
    @PostMapping("/auth/email/send")
    @ResponseBody
    public String sendEmailCodeV1(@RequestParam String email) {
        if (email == null || email.isBlank()) return "BAD_REQUEST";
        emailCodeService.sendCode(email.trim());
        return "OK";
    }

    // V1: /auth/email/verify (boolean JSON 응답)
    @PostMapping("/auth/email/verify")
    @ResponseBody
    public boolean verifyEmailCodeV1(@RequestParam String email, @RequestParam String code) {
        if (email == null || code == null) return false;
        return emailCodeService.verifyCode(email.trim(), code.trim());
    }

    // V2: /auth/email/code/send  (JSON {"success":true/false, "message":""})
    @PostMapping("/auth/email/code/send")
    @ResponseBody
    public Map<String, Object> sendEmailCodeV2(@RequestParam String email) {
        Map<String, Object> res = new HashMap<>();
        if (email == null || email.isBlank()) {
            res.put("success", false);
            res.put("message", "이메일을 입력해주세요.");
            return res;
        }
        try {
            emailCodeService.sendCode(email.trim());
            res.put("success", true);
            res.put("message", "인증번호가 발송되었습니다. 메일함을 확인해 주세요.");
        } catch (Exception e) {
            log.error("인증코드 전송 실패", e);
            res.put("success", false);
            res.put("message", "전송 중 오류가 발생했습니다.");
        }
        return res;
    }

    // V2: /auth/email/code/verify (JSON {"success":true/false, "message":""})
    @PostMapping("/auth/email/code/verify")
    @ResponseBody
    public Map<String, Object> verifyEmailCodeV2(@RequestParam String email, @RequestParam String code) {
        Map<String, Object> res = new HashMap<>();
        if (email == null || code == null) {
            res.put("success", false);
            res.put("message", "이메일/인증번호를 입력해주세요.");
            return res;
        }
        boolean ok = emailCodeService.verifyCode(email.trim(), code.trim());
        res.put("success", ok);
        res.put("message", ok ? "이메일 인증이 완료되었습니다." : "인증에 실패했습니다.");
        return res;
    }

    // ─────────────────  회원가입  ─────────────────
    @PostMapping("/auth/signup")
    public String signupSubmit(@ModelAttribute("user") User form, RedirectAttributes ra) {
        // 1) 필수값 검증
        if (isBlank(form.getLoginId()) || isBlank(form.getPassword())) {
            ra.addFlashAttribute("error", "아이디/비밀번호는 필수입니다.");
            return "redirect:/signup";
        }
        if (isBlank(form.getEmail())) {
            ra.addFlashAttribute("error", "이메일은 필수입니다.");
            return "redirect:/signup";
        }
        if (isBlank(form.getName())) {
            ra.addFlashAttribute("error", "이름은 필수입니다.");
            return "redirect:/signup";
        }
        if (isBlank(form.getPhone())) {
            ra.addFlashAttribute("error", "휴대폰번호는 필수입니다.");
            return "redirect:/signup";
        }

        // 2) 이메일 인증 여부
        if (!emailCodeService.isVerified(form.getEmail().trim())) {
            ra.addFlashAttribute("error", "이메일 인증을 완료해주세요.");
            return "redirect:/signup";
        }

        // 3) 중복 체크
        if (userRepository.existsByLoginId(form.getLoginId())) {
            ra.addFlashAttribute("error", "이미 사용 중인 아이디입니다.");
            return "redirect:/signup";
        }
        if (userRepository.existsByEmail(form.getEmail().trim())) {
            ra.addFlashAttribute("error", "이미 가입된 이메일입니다.");
            return "redirect:/signup";
        }

        // 4) 동의 기본값
        if (form.getMarketingConsent() == null) form.setMarketingConsent(false);
        if (form.getSmsConsent() == null) form.setSmsConsent(false);

        // 5) 성별 정규화 (DB 컬럼이 VARCHAR면 그냥 저장해도 되지만, M/F/O로 통일)
        form.setGender(normalizeGenderToMFO(form.getGender()));

        // 6) 비밀번호 해시
        form.setPassword(PasswordUtil.encode(form.getPassword()));

        // 7) 저장
        try {
            userRepository.save(form);
            // 가입 후 인증코드 폐기
            emailCodeService.clear(form.getEmail().trim());
        } catch (DataIntegrityViolationException e) {
            log.error("회원가입 제약 조건 위반", e);
            ra.addFlashAttribute("error", "저장 중 오류가 발생했습니다. 입력값을 다시 확인해주세요.");
            return "redirect:/signup";
        } catch (Exception e) {
            log.error("회원가입 실패", e);
            ra.addFlashAttribute("error", "예기치 못한 오류가 발생했습니다.");
            return "redirect:/signup";
        }

        ra.addFlashAttribute("success", "가입이 완료되었습니다. 이제 로그인하세요.");
        return "redirect:/login";
    }

    // ─────────────────  로그인  ─────────────────
    @PostMapping("/auth/login")
    public String doLogin(@RequestParam String loginId,
                          @RequestParam String password,
                          HttpSession session,
                          RedirectAttributes ra) {
        try {
            User u = userRepository.findByLoginId(loginId)
                    .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호를 확인해주세요."));
            // 해시된 비밀번호 비교
            if (!PasswordUtil.matches(password, u.getPassword())) {
                throw new IllegalArgumentException("아이디 또는 비밀번호를 확인해주세요.");
            }
            // 로그인 성공: 세션에 저장(필요 시)
            session.setAttribute("loginUserId", u.getUserId());
            session.setAttribute("loginUserName", u.getName());
            session.setAttribute("LOGIN_USER", u);  // 헤더에서 사용하는 객체

            return "redirect:/";
        } catch (Exception e) {
            ra.addFlashAttribute("error", "아이디 또는 비밀번호를 확인해주세요.");
            return "redirect:/login";
        }
    }

    // ─────────────────  로그아웃  ─────────────────
    @PostMapping("/api/auth/logout")
    @ResponseBody
    public Map<String, Object> logout(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        try {
            // 세션 무효화
            session.invalidate();
            response.put("success", true);
            response.put("message", "로그아웃되었습니다.");
        } catch (Exception e) {
            log.error("로그아웃 처리 중 오류", e);
            response.put("success", false);
            response.put("message", "로그아웃 처리 중 오류가 발생했습니다.");
        }
        return response;
    }

    // ─────────────────  유틸  ─────────────────
    private String normalizeGenderToMFO(String g) {
        if (g == null) return null;
        g = g.trim();
        if (g.isEmpty()) return null;
        switch (g) {
            case "남성": case "M": case "m": case "1": return "M";
            case "여성": case "F": case "f": case "2": return "F";
            case "기타": case "O": case "o": case "3": return "O";
            default: return null;
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}