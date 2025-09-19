package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.service.CompanySignupService;
import com.apiround.greenhub.service.EmailCodeService;
import com.apiround.greenhub.service.PasswordResetService;
import com.apiround.greenhub.util.PasswordUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;
import java.util.Optional;

import static org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED_VALUE;
import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

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

    /** 로그인 화면 */
    @GetMapping("/login")
    public String loginForm(@RequestParam(value = "redirectURL", required = false) String redirectURL,
                            @RequestParam(value = "redirect", required = false) String redirect,
                            Model model) {
        String to = (redirectURL != null && !redirectURL.isBlank()) ? redirectURL
                : (redirect != null && !redirect.isBlank()) ? redirect
                : null;
        if (to != null) {
            model.addAttribute("redirectURL", to);
        }
        return "login";
    }

    /** 실수로 GET /auth/login 들어오면 /login으로 유도 */
    @GetMapping("/auth/login")
    public String redirectAuthLoginGet(@RequestParam(value = "redirectURL", required = false) String redirectURL,
                                       @RequestParam(value = "redirect", required = false) String redirect) {
        String to = (redirectURL != null && !redirectURL.isBlank()) ? redirectURL
                : (redirect != null && !redirect.isBlank()) ? redirect
                : null;
        return "redirect:/login" + (to != null ? "?redirectURL=" + to : "");
    }

    // ─────────────────────────────────────────────────────────────
    // 이메일 인증 (JSON + FORM 오버로드)
    // ─────────────────────────────────────────────────────────────

    // 인증메일 전송 - JSON
    @PostMapping(value = "/auth/email/send", consumes = APPLICATION_JSON_VALUE)
    @ResponseBody
    public String sendEmailCodeJson(@RequestBody Map<String, String> body) {
        String target = opt(body.get("email"));
        if (target == null) return "BAD_REQUEST";
        emailCodeService.sendCode(target);
        return "OK";
    }

    // 인증메일 전송 - FORM
    @PostMapping(value = "/auth/email/send", consumes = APPLICATION_FORM_URLENCODED_VALUE)
    @ResponseBody
    public String sendEmailCodeForm(@RequestParam Map<String, String> form) {
        String target = opt(form.get("email"));
        if (target == null) return "BAD_REQUEST";
        emailCodeService.sendCode(target);
        return "OK";
    }

    // 인증코드 검증 - JSON
    @PostMapping(value = "/auth/email/verify", consumes = APPLICATION_JSON_VALUE)
    @ResponseBody
    public boolean verifyEmailCodeJson(@RequestBody Map<String, String> body) {
        String e = opt(body.get("email"));
        String c = opt(body.get("code"));
        if (e == null || c == null) return false;
        return emailCodeService.verifyCode(e, c);
    }

    // 인증코드 검증 - FORM
    @PostMapping(value = "/auth/email/verify", consumes = APPLICATION_FORM_URLENCODED_VALUE)
    @ResponseBody
    public boolean verifyEmailCodeForm(@RequestParam Map<String, String> form) {
        String e = opt(form.get("email"));
        String c = opt(form.get("code"));
        if (e == null || c == null) return false;
        return emailCodeService.verifyCode(e, c);
    }

    // ─────────────────────────────────────────────────────────────
    // 비밀번호 재설정 (JSON + FORM 오버로드)
    // ─────────────────────────────────────────────────────────────

    // 요청 토큰 발급 - JSON
    @PostMapping(value = "/auth/password/request-reset", consumes = APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> requestResetJson(@RequestBody Map<String, String> req) {
        return handleRequestReset(req);
    }

    // 요청 토큰 발급 - FORM
    @PostMapping(value = "/auth/password/request-reset", consumes = APPLICATION_FORM_URLENCODED_VALUE)
    @ResponseBody
    public ResponseEntity<?> requestResetForm(@RequestParam Map<String, String> req) {
        return handleRequestReset(req);
    }

    // 실제 비밀번호 변경 - JSON
    @PostMapping(value = "/auth/password/reset", consumes = APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> resetPasswordJson(@RequestBody Map<String, String> req) {
        return handleResetPassword(req);
    }

    // 실제 비밀번호 변경 - FORM
    @PostMapping(value = "/auth/password/reset", consumes = APPLICATION_FORM_URLENCODED_VALUE)
    @ResponseBody
    public ResponseEntity<?> resetPasswordForm(@RequestParam Map<String, String> req) {
        return handleResetPassword(req);
    }

    // 공통 로직: request-reset
    private ResponseEntity<?> handleRequestReset(Map<String, String> req) {
        String type  = opt(req.getOrDefault("type", "PERSONAL"));
        String email = opt(req.get("email"));
        String code  = opt(req.get("code"));
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "이메일 인증 정보가 없습니다."));
        }

        boolean ok = emailCodeService.verifyCode(email, code) || emailCodeService.isVerified(email);
        if (!ok) {
            return ResponseEntity.status(400).body(Map.of("message", "이메일 인증 실패"));
        }

        if ("PERSONAL".equalsIgnoreCase(type)) {
            String loginId = opt(req.get("loginId"));
            String name    = opt(req.get("name"));
            if (loginId == null || name == null) {
                return ResponseEntity.badRequest().body(Map.of("message","필수값 누락"));
            }

            Optional<User> u = userRepository.findByLoginIdAndNameAndEmail(loginId, name, email);
            if (u.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message","일치하는 회원이 없습니다."));
            }
            String token = passwordResetService.issueForUser(u.get().getUserId());
            return ResponseEntity.ok(Map.of("token", token));

        } else {
            String loginId     = opt(req.get("loginId"));
            String companyName = opt(req.get("companyName"));
            String businessNo  = opt(req.get("businessNumber"));
            String contactName = opt(req.get("contactName"));
            if (loginId == null || companyName == null || businessNo == null || contactName == null) {
                return ResponseEntity.badRequest().body(Map.of("message","필수값 누락"));
            }

            Optional<Company> c = companyRepository
                    .findByLoginIdAndCompanyNameAndBusinessRegistrationNumberAndManagerNameAndEmail(
                            loginId, companyName, businessNo, contactName, email);
            if (c.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message","일치하는 판매회원이 없습니다."));
            }
            String token = passwordResetService.issueForCompany(c.get().getCompanyId());
            return ResponseEntity.ok(Map.of("token", token));
        }
    }

    // 공통 로직: reset
    private ResponseEntity<?> handleResetPassword(Map<String, String> req) {
        String token = opt(req.get("token"));
        String newPw = opt(req.get("newPassword"));
        if (token == null || newPw == null) {
            return ResponseEntity.badRequest().body(Map.of("message","필수값 누락"));
        }

        var ticket = passwordResetService.consume(token);
        if (ticket == null) {
            return ResponseEntity.status(400).body(Map.of("message","유효하지 않은 토큰"));
        }

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
        c.setPassword(PasswordUtil.encode(password));
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

    // ───────── 통합 로그인(화면 폼 POST)
    @PostMapping("/auth/login")
    public String doLogin(@RequestParam String loginId,
                          @RequestParam String password,
                          @RequestParam(value = "accountType", defaultValue = "PERSONAL") String accountType,
                          @RequestParam(value = "redirectURL", required = false) String redirectURL,
                          @RequestParam(value = "redirect", required = false) String redirect,
                          HttpSession session,
                          RedirectAttributes ra) {

        String to = (redirectURL != null && !redirectURL.isBlank()) ? redirectURL
                : (redirect != null && !redirect.isBlank()) ? redirect
                : null;

        try {
            if ("COMPANY".equalsIgnoreCase(accountType)) {
                Company c = companyRepository.findByLoginIdAndDeletedAtIsNull(loginId)
                        .orElseThrow(() -> new IllegalArgumentException("NO_COMPANY"));
                if (!PasswordUtil.matches(password, c.getPassword()))
                    throw new IllegalArgumentException("BAD_PW");

                // ✅ 업체 세션 세팅
                session.setAttribute("company", c);
                session.setAttribute("loginCompanyId", c.getCompanyId());
                session.setAttribute("loginCompanyName", c.getCompanyName());

                // 개인 키 제거
                session.removeAttribute("user");
                session.removeAttribute("LOGIN_USER");
                session.removeAttribute("loginUserId");
                session.removeAttribute("loginuserid");
                session.removeAttribute("loginUserName");

                return "redirect:" + (to != null ? to : "/mypage-company");
            } else {
                User u = userRepository.findByLoginIdAndDeletedAtIsNull(loginId)
                        .orElseThrow(() -> new IllegalArgumentException("NO_USER"));
                if (!PasswordUtil.matches(password, u.getPassword()))
                    throw new IllegalArgumentException("BAD_PW");

                // ✅ 개인 세션 세팅
                session.setAttribute("user", u);
                session.setAttribute("LOGIN_USER", u); // (하위 호환)
                session.setAttribute("loginUserId", u.getUserId());
                session.setAttribute("loginuserid", u.getUserId()); // (하위 호환)
                session.setAttribute("loginUserName", u.getName());

                // 업체 키 제거
                session.removeAttribute("company");
                session.removeAttribute("loginCompanyId");
                session.removeAttribute("loginCompanyName");

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

    // ───────── 유틸
    private boolean isBlank(String s) { return s == null || s.isBlank(); }
    private String opt(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }
}
