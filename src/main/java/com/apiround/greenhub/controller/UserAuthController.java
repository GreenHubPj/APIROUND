package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.util.PasswordUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class UserAuthController {

    private final UserRepository userRepository;

    public UserAuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** 개인 로그인(API) */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> apiLogin(@RequestParam String loginId,
                                                        @RequestParam String password,
                                                        HttpSession session) {
        Map<String, Object> res = new HashMap<>();
        return userRepository.findByLoginId(loginId)
                .filter(u -> PasswordUtil.matches(password, u.getPassword()))
                .map(u -> {
                    session.setAttribute("user", u);
                    session.removeAttribute("company");
                    session.setAttribute("LOGIN_USER", u);
                    session.setAttribute("loginUserId", u.getUserId());
                    session.setAttribute("loginUserName", u.getName());

                    res.put("success", true);
                    res.put("message", "로그인되었습니다.");
                    return ResponseEntity.ok(res);
                })
                .orElseGet(() -> {
                    res.put("success", false);
                    res.put("message", "아이디 또는 비밀번호가 올바르지 않습니다.");
                    return ResponseEntity.badRequest().body(res);
                });
    }

    /** 개인 로그아웃(API) */
    @PostMapping("/logout")
    public Map<String, Object> apiLogout(HttpSession session) {
        Map<String, Object> res = new HashMap<>();
        try {
            session.invalidate();
            res.put("success", true);
            res.put("message", "로그아웃되었습니다.");
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", "로그아웃 처리 중 오류가 발생했습니다.");
        }
        return res;
    }
}