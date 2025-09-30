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

    /** 개인 로그인(API, x-www-form-urlencoded 또는 querystring) */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> apiLogin(@RequestParam String loginId,
                                                        @RequestParam String password,
                                                        HttpSession session) {
        Map<String, Object> res = new HashMap<>();
        return userRepository.findByLoginId(loginId)
                .filter(u -> PasswordUtil.matches(password, u.getPassword()))
                .map(u -> {
                    // ✅ 개인 계정 세션 세팅
                    session.setAttribute("user", u);
                    session.setAttribute("LOGIN_USER", u); // (하위 호환)
                    session.setAttribute("loginUserId", u.getUserId());
                    session.setAttribute("loginuserid", u.getUserId()); // (하위 호환 키)
                    session.setAttribute("loginUserName", u.getName());
                    // 회사 관련 키 정리
                    session.removeAttribute("company");
                    session.removeAttribute("loginCompanyId");
                    session.removeAttribute("loginCompanyName");

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

    /** 현재 세션 누구인가? (프론트에서 로그인 상태/아이디 확인용) */
    @GetMapping("/me")
    public Map<String, Object> me(HttpSession session) {
        Map<String, Object> res = new HashMap<>();
        Object uid = session.getAttribute("loginUserId");
        Object uname = session.getAttribute("loginUserName");
        Object cid = session.getAttribute("loginCompanyId");
        Object cname = session.getAttribute("loginCompanyName");

        res.put("loggedIn", uid != null || cid != null);
        res.put("userId", uid);
        res.put("userName", uname);
        res.put("companyId", cid);
        res.put("companyName", cname);
        return res;
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
