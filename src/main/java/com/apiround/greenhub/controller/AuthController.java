package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    // JSON 로그인: { "loginId": "...", "password": "..." }
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> loginJson(@RequestBody Map<String, String> body, HttpSession session) {
        return doLogin(body, session);
    }

    // 폼 로그인: loginId=...&password=...
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Map<String, Object>> loginForm(@RequestParam Map<String, String> body, HttpSession session) {
        return doLogin(body, session);
    }

    private ResponseEntity<Map<String, Object>> doLogin(Map<String, String> body, HttpSession session) {
        String loginId = body.get("loginId");
        String password = body.get("password");

        if (loginId == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", "아이디/비밀번호를 모두 입력하세요."
            ));
        }

        Optional<User> userOpt = userRepository.findByLoginIdAndPassword(loginId, password);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                    "ok", false,
                    "message", "아이디 또는 비밀번호가 일치하지 않습니다."
            ));
        }

        User u = userOpt.get();
        session.setAttribute("LOGIN_USER", u);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "userId", (Object) u.getUserId(),
                "name", u.getName()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(HttpSession session) {
        User u = (User) session.getAttribute("LOGIN_USER");
        if (u == null) return ResponseEntity.status(401).body(Map.of("ok", false));
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "userId", (Object) u.getUserId(),
                "name", u.getName()
        ));
    }
}
