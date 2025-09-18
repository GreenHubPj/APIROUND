package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.util.PasswordUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Optional;

@Controller
public class CompanyAuthController {

    private final CompanyRepository companyRepository;

    public CompanyAuthController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    /** 업체 로그인 폼 */
    @GetMapping("/company/login")
    public String companyLoginForm(@RequestParam(value = "redirectURL", required = false) String redirectURL,
                                   Model model) {
        model.addAttribute("redirectURL", redirectURL);
        return "login";
    }

    /** 업체 로그인 처리 (화면 폼) */
    @PostMapping("/company/login")
    public String doCompanyLogin(@RequestParam String loginId,
                                 @RequestParam String password,
                                 @RequestParam(value = "redirectURL", required = false) String redirectURL,
                                 HttpSession session,
                                 RedirectAttributes ra) {

        Optional<Company> opt = companyRepository.findByLoginId(loginId);
        if (opt.isEmpty() || !PasswordUtil.matches(password, opt.get().getPassword())) {
            ra.addFlashAttribute("error", "아이디 또는 비밀번호가 올바르지 않습니다.");
            return "redirect:/company/login" + (redirectURL != null ? "?redirectURL=" + redirectURL : "");
        }

        // 회사 세션 세팅, 개인 세션 제거
        session.setAttribute("company", opt.get());
        session.removeAttribute("user");

        if (redirectURL != null && !redirectURL.isBlank()) {
            return "redirect:" + redirectURL;
        }
        return "redirect:/mypage-company";
    }

    /** 업체 로그아웃 (GET 링크 지원) — 완전 종료를 원하면 invalidate() */
    @GetMapping("/company/logout")
    public String companyLogout(HttpSession session,
                                @RequestParam(value = "redirectURL", required = false) String redirectURL) {
        try { session.invalidate(); } catch (Exception ignored) {}
        return "redirect:" + (redirectURL != null && !redirectURL.isBlank() ? redirectURL : "/");
    }
}