package com.apiround.greenhub.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
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
import com.apiround.greenhub.util.PasswordUtil;

import jakarta.servlet.http.HttpSession;

@Controller
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final EmailCodeService emailCodeService;
    private final CompanySignupService companySignupService;

    public AuthController(UserRepository userRepository,
                          CompanyRepository companyRepository,
                          EmailCodeService emailCodeService,
                          CompanySignupService companySignupService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.emailCodeService = emailCodeService;
        this.companySignupService = companySignupService;
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
                            Model model) {
        if (redirectURL != null && !redirectURL.isBlank()) {
            model.addAttribute("redirectURL", redirectURL);
        }
        return "login";
    }

    /** 실수로 GET /auth/login 들어올 때 → /login 으로 우회 */
    @GetMapping("/auth/login")
    public String redirectAuthLoginGet(@RequestParam(value = "redirectURL", required = false) String redirectURL) {
        return "redirect:/login" + (redirectURL != null && !redirectURL.isBlank() ? "?redirectURL=" + redirectURL : "");
    }

    // ───────── 이메일 인증 (개인/판매 공용)
    @PostMapping("/auth/email/send")
    @ResponseBody
    public String sendEmailCode(@RequestParam String email) {
        if (email == null || email.isBlank()) return "BAD_REQUEST";
        emailCodeService.sendCode(email.trim());
        return "OK";
    }

    @PostMapping("/auth/email/verify")
    @ResponseBody
    public boolean verifyEmailCode(@RequestParam String email, @RequestParam String code) {
        if (email == null || code == null) return false;
        return emailCodeService.verifyCode(email.trim(), code.trim());
    }

    // ───────── 개인 회원가입 (글로벌 아이디 중복 체크)
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

        // 개인/회사 전체에서 아이디 중복 금지
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

    // ───────── 판매 회원가입 (글로벌 아이디 중복 체크)
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

        // 개인/회사 전체에서 아이디 중복 금지
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

    // ───────── 통합 로그인(계정유형으로만 인증: 폴백 없음)
    @PostMapping("/auth/login")
    public String doLogin(@RequestParam String loginId,
                          @RequestParam String password,
                          @RequestParam(value = "accountType", defaultValue = "PERSONAL") String accountType,
                          @RequestParam(value = "redirectURL", required = false) String redirectURL,
                          HttpSession session,
                          RedirectAttributes ra) {

        try {
            if ("COMPANY".equalsIgnoreCase(accountType)) {
                Company c = companyRepository.findByLoginId(loginId)
                        .orElseThrow(() -> new IllegalArgumentException("NO_COMPANY"));
                if (!PasswordUtil.matches(password, c.getPassword()))
                    throw new IllegalArgumentException("BAD_PW");

                session.setAttribute("company", c);
                session.removeAttribute("user");
                session.setAttribute("loginCompanyId", c.getCompanyId());
                session.setAttribute("loginCompanyName", c.getCompanyName());

                return "redirect:" + (redirectURL != null && !redirectURL.isBlank() ? redirectURL : "/mypage-company");
            } else {
                User u = userRepository.findByLoginId(loginId)
                        .orElseThrow(() -> new IllegalArgumentException("NO_USER"));
                if (!PasswordUtil.matches(password, u.getPassword()))
                    throw new IllegalArgumentException("BAD_PW");

                session.setAttribute("user", u);
                session.removeAttribute("company");
                session.setAttribute("LOGIN_USER", u);
                session.setAttribute("loginUserId", u.getUserId());
                session.setAttribute("loginUserName", u.getName());

                return "redirect:" + (redirectURL != null && !redirectURL.isBlank() ? redirectURL : "/mypage");
            }
        } catch (Exception e) {
            ra.addFlashAttribute("error", "아이디/비밀번호 또는 계정 유형을 확인해주세요.");
            return "redirect:/login" + (redirectURL != null ? "?redirectURL=" + redirectURL : "");
        }
    }

    /** 폼 로그아웃 (POST /auth/logout, POST /logout 모두 지원) */
    @PostMapping({"/auth/logout", "/logout"})
    public String logoutByFormPost(HttpSession session) {
        try { session.invalidate(); } catch (Exception ignored) {}
        return "redirect:/";
    }

    /** 혹시 GET 링크로 호출되는 경우까지 안전 처리 (선택) */
    @GetMapping({"/auth/logout", "/logout"})
    public String logoutByGet(HttpSession session,
                              @RequestParam(value = "redirectURL", required = false) String redirectURL) {
        try { session.invalidate(); } catch (Exception ignored) {}
        return "redirect:" + (redirectURL != null && !redirectURL.isBlank() ? redirectURL : "/");
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }
}
