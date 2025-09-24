// src/main/java/com/apiround/greenhub/controller/review/MyReviewRestController.java
package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.service.MyReviewService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my/reviews")
public class MyReviewRestController {

    private final MyReviewService myReviewService;

    /** 세션/보안컨텍스트에서 userId 꺼내오기 (여러 키와 타입 지원) */
    private Integer currentUserId(HttpServletRequest req) {
        // 1) 직접 userId 저장된 경우
        Object v = req.getSession().getAttribute("userId");
        if (v instanceof Integer i) return i;
        if (v instanceof String s) {
            try { return Integer.valueOf(s); } catch (NumberFormatException ignore) {}
        }

        // 2) currentUser / user / loginUser 같은 DTO/Map 에서 추출
        Object[] candidates = {
                req.getSession().getAttribute("currentUser"),
                req.getSession().getAttribute("user"),
                req.getSession().getAttribute("loginUser")
        };
        for (Object o : candidates) {
            Integer id = extractUserId(o);
            if (id != null) return id;
        }
        return null;
    }

    private Integer extractUserId(Object o) {
        if (o == null) return null;
        if (o instanceof Integer i) return i;
        if (o instanceof String s) {
            try { return Integer.valueOf(s); } catch (NumberFormatException ignore) {}
            return null;
        }
        if (o instanceof Map<?,?> m) {
            Object v = m.get("userId"); if (v == null) v = m.get("id");
            if (v instanceof Integer i) return i;
            if (v instanceof String s) { try { return Integer.valueOf(s);} catch(Exception ignore){} }
        }
        // DTO: getUserId(), getId(), getMemberId() 순서로 시도
        for (String mn : new String[]{"getUserId","getId","getMemberId"}) {
            try {
                Method m = o.getClass().getMethod(mn);
                Object v = m.invoke(o);
                if (v instanceof Integer i) return i;
                if (v instanceof String s) { try { return Integer.valueOf(s);} catch(Exception ignore){} }
            } catch (Exception ignore) {}
        }
        return null;
    }

    @GetMapping("/writable")
    public ResponseEntity<?> writable(HttpServletRequest req) {
        Integer userId = currentUserId(req);
        if (userId == null) {
            Map<String,Object> m = new HashMap<>();
            m.put("redirectUrl", "/login");
            return ResponseEntity.status(401).body(m);
        }
        return ResponseEntity.ok(myReviewService.listWritable(userId));
    }

    @GetMapping
    public ResponseEntity<?> written(HttpServletRequest req) {
        Integer userId = currentUserId(req);
        if (userId == null) {
            Map<String,Object> m = new HashMap<>();
            m.put("redirectUrl", "/login");
            return ResponseEntity.status(401).body(m);
        }
        return ResponseEntity.ok(myReviewService.listWritten(userId));
    }
}
