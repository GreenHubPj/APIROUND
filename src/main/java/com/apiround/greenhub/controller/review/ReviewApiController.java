// src/main/java/com/apiround/greenhub/controller/review/ReviewApiController.java
package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.dto.review.ReviewDtos.PageResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewCreateRequest;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewSummaryResponse;
import com.apiround.greenhub.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ReviewApiController {

    private final ReviewService reviewService;

    public ReviewApiController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ReviewResponse>> getReviews(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort
    ) {
        return ResponseEntity.ok(reviewService.getReviews(productId, page, size, sort));
    }

    @GetMapping("/summary")
    public ResponseEntity<ReviewSummaryResponse> getSummary(@PathVariable Integer productId) {
        return ResponseEntity.ok(reviewService.getSummary(productId));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createReview(
            @PathVariable Integer productId,
            @RequestBody ReviewCreateRequest request,
            HttpSession session,
            HttpServletRequest httpRequest
    ) {
        // 세션에서 userId를 유연하게 추출
        Integer userId = extractUserId(session);
        if (userId == null) {
            // WebConfig.ApiGuardInterceptor 가 이미 대부분 처리하지만
            // 혹시 대비해서 동일한 포맷으로 401 응답
            String target = httpRequest.getRequestURI() +
                    (httpRequest.getQueryString() != null ? "?" + httpRequest.getQueryString() : "");
            String redirect = "/login?redirectURL=" + target;
            String body = "{\"login\":false,\"redirectUrl\":\"" + redirect + "\"}";
            return ResponseEntity.status(401).contentType(MediaType.APPLICATION_JSON).body(body);
        }

        Integer reviewId = reviewService.createReview(productId, userId, request);
        return ResponseEntity.ok("{\"success\":true,\"reviewId\":" + reviewId + "}");
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Integer productId, @PathVariable Integer reviewId) {
        reviewService.softDelete(reviewId);
        return ResponseEntity.ok("{\"success\":true}");
    }

    private Integer extractUserId(HttpSession session) {
        if (session == null) return null;

        // 1) userId 직접 저장된 경우
        Object uid = session.getAttribute("userId");
        if (uid != null) {
            try { return (uid instanceof Integer) ? (Integer) uid : Integer.valueOf(uid.toString()); }
            catch (Exception ignore) {}
        }

        // 2) 사용자 객체가 저장된 경우 (currentUser, user, LOGIN_USER 등)
        Object user = session.getAttribute("user");
        if (user == null) user = session.getAttribute("LOGIN_USER");
        if (user == null) user = session.getAttribute("currentUser");

        if (user != null) {
            try {
                // public Integer getUserId() 가정
                var m = user.getClass().getMethod("getUserId");
                Object val = m.invoke(user);
                if (val != null) return (val instanceof Integer) ? (Integer) val : Integer.valueOf(val.toString());
            } catch (Exception ignore) {}
        }
        return null;
    }
}
