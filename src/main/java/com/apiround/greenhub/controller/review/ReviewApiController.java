package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.service.review.ReviewCommandService;
import jakarta.servlet.http.HttpSession;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReviewApiController {

    private final ReviewCommandService reviewCommandService;

    /** 주문항목 기준 리뷰 생성(권장) */
    @PostMapping(value = "/my/reviews", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createReviewByOrderItem(@RequestBody CreateReviewRequest req, HttpSession session) {
        Integer userId = resolveLoginUserId(session);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다.", "redirectUrl", "/login"));
        }
        if (req == null || req.getOrderItemId() == null) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "orderItemId가 필요합니다."));
        }
        if (!isValidRating(req.getRating())) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "별점은 1~5 사이여야 합니다."));
        }
        if (req.getContent() == null || req.getContent().trim().length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "리뷰는 최소 10자 이상 입력하세요."));
        }

        try {
            var result = reviewCommandService.createByOrderItem(userId, req.getOrderItemId(), req.getRating(), req.getContent());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "ok", true,
                    "reviewId", result.reviewId(),
                    "productId", result.productId(),
                    "redirectUrl", "/products/" + result.productId() + "/reviews"
            ));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("ok", false, "message", e.getMessage()));
        }
    }

    /** productId 경로 유지(fallback). body에 orderItemId가 있으면 우선 사용 */
    @PostMapping(value = "/products/{productId}/reviews", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createReviewFallback(@PathVariable Integer productId,
                                                  @RequestBody(required = false) CreateReviewRequest req,
                                                  HttpSession session) {
        Integer userId = resolveLoginUserId(session);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "로그인이 필요합니다.", "redirectUrl", "/login"));
        }

        int rating = (req != null ? req.getRating() : 0);
        String content = (req != null ? req.getContent() : null);
        Integer orderItemId = (req != null ? req.getOrderItemId() : null);

        if (!isValidRating(rating)) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "별점은 1~5 사이여야 합니다."));
        }
        if (content == null || content.trim().length() < 10) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "리뷰는 최소 10자 이상 입력하세요."));
        }

        try {
            ReviewCommandService.CreateResult result;
            if (orderItemId != null) {
                result = reviewCommandService.createByOrderItem(userId, orderItemId, rating, content);
            } else {
                result = reviewCommandService.createByUserAndProduct(userId, productId, rating, content);
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "ok", true,
                    "reviewId", result.reviewId(),
                    "productId", result.productId(),
                    "redirectUrl", "/products/" + result.productId() + "/reviews"
            ));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("ok", false, "message", e.getMessage()));
        }
    }

    // helpers
    private boolean isValidRating(Integer r) { return r != null && r >= 1 && r <= 5; }

    private Integer resolveLoginUserId(HttpSession session) {
        Object[] candidates = new Object[] {
                session.getAttribute("loginUserId"),
                session.getAttribute("userId"),
                session.getAttribute("LOGIN_USER_ID"),
                session.getAttribute("loginuserid"),
                session.getAttribute("user"),
                session.getAttribute("LOGIN_USER")
        };
        for (Object v : candidates) {
            Integer n = toInt(v);
            if (n != null) return n;
            if (v instanceof User u && u.getUserId() != null) return u.getUserId();
            if (v instanceof java.util.Map<?,?> m) {
                Integer fromMap = toInt(m.get("userId"));
                if (fromMap != null) return fromMap;
            }
        }
        return null;
    }
    private Integer toInt(Object v) {
        if (v == null) return null;
        if (v instanceof Integer i) return i;
        if (v instanceof Number n) return n.intValue();
        if (v instanceof String s) { try { return Integer.parseInt(s); } catch (NumberFormatException ignored) {} }
        return null;
    }

    @Data
    public static class CreateReviewRequest {
        private Integer orderItemId; // 권장
        private Integer rating;
        private String content;
    }
}
