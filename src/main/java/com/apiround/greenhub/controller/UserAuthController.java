package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.util.PasswordUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Optional;

@Controller
public class UserAuthController {

    private final UserRepository userRepository;

    public UserAuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** 개인 로그인 폼 */
    @GetMapping("/login")
    public String loginForm(@RequestParam(value = "redirectURL", required = false) String redirectURL,
                            Model model) {
        model.addAttribute("redirectURL", redirectURL);
        return "login";
    }

    /** 개인 로그인 처리 */
    @PostMapping("/login")
    public String doLogin(@RequestParam String loginId,
                          @RequestParam String password,
                          @RequestParam(value = "redirectURL", required = false) String redirectURL,
                          HttpSession session,
                          RedirectAttributes ra) {

        Optional<User> opt = userRepository.findByLoginId(loginId);
        if (opt.isEmpty() || !PasswordUtil.matches(password, opt.get().getPassword())) {
            ra.addFlashAttribute("error", "아이디 또는 비밀번호가 올바르지 않습니다.");
            return "redirect:/login" + (redirectURL != null ? "?redirectURL=" + redirectURL : "");
        }

        // 개인 세션 세팅, 회사 세션 제거
        session.setAttribute("user", opt.get());
        session.removeAttribute("company");

        if (redirectURL != null && !redirectURL.isBlank()) {
            return "redirect:" + redirectURL;
        }
        return "redirect:/mypage";
    }

    /** 개인 로그아웃 */
    @GetMapping("/logout")
    public String logout(HttpSession session,
                         @RequestParam(value = "redirectURL", required = false) String redirectURL) {
        session.removeAttribute("user");
        if (redirectURL != null && !redirectURL.isBlank()) {
            return "redirect:" + redirectURL;
        }
        return "redirect:/";
    }
}
