package com.apiround.greenhub.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.service.CompanySignupService;
import com.apiround.greenhub.service.EmailCodeService;
import com.apiround.greenhub.service.PasswordResetService;
import com.apiround.greenhub.util.PasswordUtil;

import jakarta.servlet.http.HttpSession;

import java.util.Map;
import java.util.Optional;

@Controller
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final EmailCodeService emailCodeService;
    private final CompanySignupService companySignupService;
    private final PasswordResetService passwordResetService;

    public AuthController(UserRepository userRepository,
                          CompanyRepository companyRepository,
                          EmailCodeService emailCodeService,
                          CompanySignupService companySignupService,
                          PasswordResetService passwordResetService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.emailCodeService = emailCodeService;
        this.companySignupService = companySignupService;
        this.passwordResetService = passwordResetService;
    }

    // ───────── View
    @GetMapping("/signup")
    public String signupForm(Model model) {
        if (!model.containsAttribute("user")) {
            model.addAttribute("user", new User());
        }
        return "signup";
    }

    /** 로그인 화면(유일한 /login 매핑) */
    @GetMapping("/login")
    public String loginForm(@RequestParam(value = "redirectURL", required = false) String redirectURL,
                            @RequestParam(value = "redirect", required = false) String redirect, // ← 추가: 두 파라미터 모두 지원
                            Model model) {
        String to = (redirectURL != null && !redirectURL.isBlank()) ? redirectURL
                : (redirect != null && !redirect.isBlank()) ? redirect
                : null;
        if (to != null) {
            model.addAttribute("redirectURL", to); // 뷰에서는 redirectURL 하나만 사용
        }
        return "login";
    }

    /** 실수로 GET /auth/login 들어올 때 → /login 으로 우회 */
    @GetMapping("/auth/login")
    public String redirectAuthLoginGet(@RequestParam(value = "redirectURL", required = false) String redirectURL,
                                       @RequestParam(value = "redirect", required = false) String redirect) {
        String to = (redirectURL != null && !redirectURL.isBlank()) ? redirectURL
                : (redirect != null && !redirect.isBlank()) ? redirect
                : null;
        return "redirect:/login" + (to != null ? "?redirectURL=" + to : "");
    }

    // ─────────────────────────────────────────────────────────────
    // 이메일 인증 (개인/판매 공용)
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/auth/email/send")
    @ResponseBody
    public String sendEmailCode(@RequestBody(required = false) Map<String, String> body,
                                @RequestParam(required = false) String email) {
        String target = email != null ? email : (body == null ? null : body.get("email"));
        if (target == null || target.isBlank()) return "BAD_REQUEST";
        emailCodeService.sendCode(target.trim());
        return "OK";
    }

    @PostMapping("/auth/email/verify")
    @ResponseBody
    public boolean verifyEmailCode(@RequestBody(required = false) Map<String, String> body,
                                   @RequestParam(required = false) String email,
                                   @RequestParam(required = false) String code) {
        String e = email != null ? email : (body == null ? null : body.get("email"));
        String c = code  != null ? code  : (body == null ? null : body.get("code"));
        if (e == null || c == null) return false;
        return emailCodeService.verifyCode(e.trim(), c.trim());
    }

    // ─────────────────────────────────────────────────────────────
    // 비밀번호 재설정
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/auth/password/request-reset")
    @ResponseBody
    public ResponseEntity<?> requestReset(@RequestBody Map<String, String> req) {
        String type = req.getOrDefault("type", "PERSONAL").trim();
        String email = opt(req.get("email"));
        String code  = opt(req.get("code"));
        if (email == null || code == null) return ResponseEntity.badRequest().body(Map.of("message","이메일 인증 정보가 없습니다."));

        boolean ok = emailCodeService.verifyCode(email, code) || emailCodeService.isVerified(email);
        if (!ok) return ResponseEntity.status(400).body(Map.of("message","이메일 인증 실패"));

        if ("PERSONAL".equalsIgnoreCase(type)) {
            String loginId = opt(req.get("loginId"));
            String name    = opt(req.get("name"));
            if (loginId == null || name == null) return ResponseEntity.badRequest().body(Map.of("message","필수값 누락"));

            Optional<User> u = userRepository.findByLoginIdAndNameAndEmail(loginId, name, email);
            if (u.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","일치하는 회원이 없습니다."));
            String token = passwordResetService.issueForUser(u.get().getUserId());
            return ResponseEntity.ok(Map.of("token", token));
        } else {
            String loginId       = opt(req.get("loginId"));
            String companyName   = opt(req.get("companyName"));
            String businessNo    = opt(req.get("businessNumber"));
            String contactName   = opt(req.get("contactName"));
            if (loginId == null || companyName == null || businessNo == null || contactName == null) {
                return ResponseEntity.badRequest().body(Map.of("message","필수값 누락"));
            }

            Optional<Company> c = companyRepository
                    .findByLoginIdAndCompanyNameAndBusinessRegistrationNumberAndManagerNameAndEmail(
                            loginId, companyName, businessNo, contactName, email);
            if (c.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","일치하는 판매회원이 없습니다."));
            String token = passwordResetService.issueForCompany(c.get().getCompanyId());
            return ResponseEntity.ok(Map.of("token", token));
        }
    }

    @PostMapping("/auth/password/reset")
    @ResponseBody
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> req) {
        String token = opt(req.get("token"));
        String newPw = opt(req.get("newPassword"));
        if (token == null || newPw == null) return ResponseEntity.badRequest().body(Map.of("message","필수값 누락"));

        var ticket = passwordResetService.consume(token);
        if (ticket == null) return ResponseEntity.status(400).body(Map.of("message","유효하지 않은 토큰"));

        if (ticket.type == PasswordResetService.AccountType.PERSONAL) {
            Optional<User> u = userRepository.findById(ticket.userId);
            if (u.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","회원 없음"));
            u.get().setPassword(PasswordUtil.encode(newPw));
            userRepository.save(u.get());
        } else {
            Optional<Company> c = companyRepository.findById(ticket.companyId);
            if (c.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","판매회원 없음"));
            c.get().setPassword(PasswordUtil.encode(newPw));
            companyRepository.save(c.get());
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ───────── 개인 회원가입
    @PostMapping("/auth/signup")
    public String signupUser(@ModelAttribute("user") User form, RedirectAttributes ra) {
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

        if (userRepository.existsByLoginId(form.getLoginId()) ||
                companyRepository.existsByLoginId(form.getLoginId())) {
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

    // ───────── 판매 회원가입
    @PostMapping("/auth/signup-company")
    public String signupCompany(@RequestParam String companyName,
                                @RequestParam String loginId,
                                @RequestParam String password,
                                @RequestParam String businessRegistrationNumber,
                                @RequestParam String email,
                                @RequestParam String managerName,
                                @RequestParam String managerPhone,
                                @RequestParam(required = false) String address,
                                RedirectAttributes ra) {
        if (isBlank(companyName) || isBlank(loginId) || isBlank(password) ||
                isBlank(businessRegistrationNumber) || isBlank(email) ||
                isBlank(managerName) || isBlank(managerPhone)) {
            ra.addFlashAttribute("error", "업체명/아이디/비밀번호/사업자번호/이메일/담당자명/담당자연락처는 필수입니다.");
            return "redirect:/signup";
        }

        if (!emailCodeService.isVerified(email.trim())) {
            ra.addFlashAttribute("error", "회사 이메일 인증을 완료해주세요.");
            return "redirect:/signup";
        }

        if (companyRepository.existsByLoginId(loginId) ||
                userRepository.existsByLoginId(loginId)) {
            ra.addFlashAttribute("error", "이미 사용 중인 아이디입니다.");
            return "redirect:/signup";
        }

        Company c = new Company();
        c.setCompanyName(companyName.trim());
        c.setLoginId(loginId.trim());
        c.setPassword(password);
        c.setBusinessRegistrationNumber(businessRegistrationNumber.trim().replaceAll("\\s", ""));
        c.setEmail(email.trim());
        c.setManagerName(managerName.trim());
        c.setManagerPhone(managerPhone.trim());
        c.setAddress(address == null ? null : address.trim());

        try {
            companySignupService.signupCompany(c);
            emailCodeService.clear(email.trim());
        } catch (IllegalArgumentException iae) {
            ra.addFlashAttribute("error", iae.getMessage());
            return "redirect:/signup";
        } catch (Exception e) {
            log.error("판매회원 가입 실패", e);
            ra.addFlashAttribute("error", "가입 처리 중 오류가 발생했습니다.");
            return "redirect:/signup";
        }

        ra.addFlashAttribute("success", "판매회원 가입이 완료되었습니다. 이제 로그인하세요.");
        return "redirect:/login";
    }

    // ───────── 통합 로그인
    @PostMapping("/auth/login")
    public String doLogin(@RequestParam String loginId,
                          @RequestParam String password,
                          @RequestParam(value = "accountType", defaultValue = "PERSONAL") String accountType,
                          @RequestParam(value = "redirectURL", required = false) String redirectURL,
                          @RequestParam(value = "redirect", required = false) String redirect, // ← 추가
                          HttpSession session,
                          RedirectAttributes ra) {

        // 두 파라미터 중 하나라도 값이 있으면 그것으로
        String to = (redirectURL != null && !redirectURL.isBlank()) ? redirectURL
                : (redirect != null && !redirect.isBlank()) ? redirect
                : null;

        try {
            if ("COMPANY".equalsIgnoreCase(accountType)) {
                Company c = companyRepository.findByLoginIdAndDeletedAtIsNull(loginId)
                        .orElseThrow(() -> new IllegalArgumentException("NO_COMPANY"));
                if (!PasswordUtil.matches(password, c.getPassword()))
                    throw new IllegalArgumentException("BAD_PW");

                session.setAttribute("company", c);
                session.removeAttribute("user");
                session.setAttribute("loginCompanyId", c.getCompanyId());
                session.setAttribute("loginCompanyName", c.getCompanyName());

                return "redirect:" + (to != null ? to : "/mypage-company");
            } else {
                User u = userRepository.findByLoginIdAndDeletedAtIsNull(loginId)
                        .orElseThrow(() -> new IllegalArgumentException("NO_USER"));
                if (!PasswordUtil.matches(password, u.getPassword()))
                    throw new IllegalArgumentException("BAD_PW");

                session.setAttribute("user", u);
                session.removeAttribute("company");
                session.setAttribute("LOGIN_USER", u);
                session.setAttribute("loginUserId", u.getUserId());
                session.setAttribute("loginUserName", u.getName());

                return "redirect:" + (to != null ? to : "/mypage");
            }
        } catch (Exception e) {
            ra.addFlashAttribute("error", "아이디/비밀번호 또는 계정 유형을 확인해주세요.");
            String backTo = (to != null ? "?redirectURL=" + to : "");
            return "redirect:/login" + backTo;
        }
    }

    /** 폼 로그아웃 */
    @PostMapping({"/auth/logout", "/logout"})
    public String logoutByFormPost(HttpSession session) {
        try { session.invalidate(); } catch (Exception ignored) {}
        return "redirect:/";
    }

    /** GET 로그아웃 링크 */
    @GetMapping({"/auth/logout", "/logout"})
    public String logoutByGet(HttpSession session,
                              @RequestParam(value = "redirectURL", required = false) String redirectURL,
                              @RequestParam(value = "redirect", required = false) String redirect) {
        try { session.invalidate(); } catch (Exception ignored) {}
        String to = (redirectURL != null && !redirectURL.isBlank()) ? redirectURL
                : (redirect != null && !redirect.isBlank()) ? redirect
                : "/";
        return "redirect:" + to;
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }
    private String opt(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }
}
