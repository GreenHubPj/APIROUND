package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.service.EmailNotiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/admin/email")
@RequiredArgsConstructor
public class EmailNotiController {
    private final EmailNotiService emailNotiService;

    /**
     * 개별 메일 발송 (기존 기능 유지)
     */
    @PostMapping("/send-single")
    public ResponseEntity<String> sendNotificationEmail(
            @RequestParam String to,
            @RequestParam String subject,
            @RequestParam String message
    ){
        try {
            emailNotiService.sendNotification(to, subject, message);
            return ResponseEntity.ok("메일 발송 성공");
        } catch (Exception e) {
            log.error("메일 발송 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body("메일 발송 실패: " + e.getMessage());
        }
    }

    /**
     * SMS 동의한 사용자들에게 일괄 메일 발송
     */
    @PostMapping("/send-bulk")
    public ResponseEntity<Map<String, Object>> sendBulkNotification(
            @RequestParam String subject,
            @RequestParam String message
    ) {
        try {
            CompletableFuture<Integer> result = emailNotiService.sendBulkNotification(subject, message);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "일괄 메일 발송이 시작되었습니다.");
            response.put("status", "processing");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("일괄 메일 발송 실패: {}", e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "일괄 메일 발송 실패: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * SMS 동의한 사용자 목록 조회
     */
    @GetMapping("/recipients")
    public ResponseEntity<Map<String, Object>> getSmsConsentUsers() {
        try {
            List<User> users = emailNotiService.getSmsConsentUsers();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", users.size());
            response.put("users", users.stream().map(user -> {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("userId", user.getUserId());
                userInfo.put("name", user.getName());
                userInfo.put("email", user.getEmail());
                userInfo.put("smsConsent", user.getSmsConsent());
                return userInfo;
            }).toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("사용자 목록 조회 실패: {}", e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "사용자 목록 조회 실패: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }
}