package com.apiround.greenhub.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
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

    // ───────── View
    @GetMapping("/signup")
    public String signupForm(Model model) {
        if (!model.containsAttribute("user")) {
            model.addAttribute("user", new User());
        }
        return "signup";
    }

    @GetMapping("/login")
    public String loginForm(@RequestParam(value = "redirectURL", required = false) String redirectURL,
                            Model model) {
        if (redirectURL != null && !redirectURL.isBlank()) {
            model.addAttribute("redirectURL", redirectURL);
        }
        return "login";
    }

    // ───────── 이메일 인증 API
    @PostMapping("/auth/email/send")
    @ResponseBody
    public String sendEmailCodeV1(@RequestParam String email) {
        if (email == null || email.isBlank()) return "BAD_REQUEST";
        emailCodeService.sendCode(email.trim());
        return "OK";
    }

    @PostMapping("/auth/email/verify")
    @ResponseBody
    public boolean verifyEmailCodeV1(@RequestParam String email, @RequestParam String code) {
        if (email == null || code == null) return false;
        return emailCodeService.verifyCode(email.trim(), code.trim());
    }

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

    // ───────── 회원가입
    @PostMapping("/auth/signup")
    public String signupSubmit(@ModelAttribute("user") User form, RedirectAttributes ra) {

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

        if (!emailCodeService.isVerified(form.getEmail().trim())) {
            ra.addFlashAttribute("error", "이메일 인증을 완료해주세요.");
            return "redirect:/signup";
        }

        if (userRepository.existsByLoginId(form.getLoginId())) {
            ra.addFlashAttribute("error", "이미 사용 중인 아이디입니다.");
            return "redirect:/signup";
        }
        if (userRepository.existsByEmail(form.getEmail().trim())) {
            ra.addFlashAttribute("error", "이미 가입된 이메일입니다.");
            return "redirect:/signup";
        }

        if (form.getMarketingConsent() == null) form.setMarketingConsent(false);
        if (form.getSmsConsent() == null) form.setSmsConsent(false);

        form.setPassword(PasswordUtil.encode(form.getPassword()));

        try {
            userRepository.save(form);
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

    // ───────── 로그인 (redirectURL 지원)
    @PostMapping("/auth/login")
    public String doLogin(@RequestParam String loginId,
                          @RequestParam String password,
                          @RequestParam(value = "redirectURL", required = false) String redirectURL,
                          HttpSession session,
                          RedirectAttributes ra) {
        try {
            User u = userRepository.findByLoginId(loginId)
                    .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호를 확인해주세요."));
            if (!PasswordUtil.matches(password, u.getPassword())) {
                throw new IllegalArgumentException("아이디 또는 비밀번호를 확인해주세요.");
            }

            // 표준 세션 키
            session.setAttribute("user", u);

            // (과거 호환)
            session.setAttribute("LOGIN_USER", u);
            session.setAttribute("loginUserId", u.getUserId());
            session.setAttribute("loginUserName", u.getName());

            // 원래 가려던 곳이 있으면 그쪽으로, 없으면 마이페이지
            return "redirect:" + ((redirectURL != null && !redirectURL.isBlank()) ? redirectURL : "/mypage");
        } catch (Exception e) {
            ra.addFlashAttribute("error", "아이디 또는 비밀번호를 확인해주세요.");
            return "redirect:/login";
        }
    }

    // ───────── 로그아웃 (폼 전송/리다이렉트용)
    @PostMapping("/auth/logout")
    public String logoutByForm(HttpSession session) {
        try { session.invalidate(); } catch (Exception ignored) {}
        return "redirect:/";
    }

    // ───────── 로그아웃 (AJAX용)
    @PostMapping("/api/auth/logout")
    @ResponseBody
    public Map<String, Object> logoutApi(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        try {
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

    private boolean isBlank(String s) { return s == null || s.isBlank(); }
}
