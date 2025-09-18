package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.dto.review.ReviewDtos.PageResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewCreateRequest;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewSummaryResponse;
import com.apiround.greenhub.service.ReviewService;
import jakarta.servlet.http.HttpSession;
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

    @PostMapping
    public ResponseEntity<?> createReview(
            @PathVariable Integer productId,
            @RequestBody ReviewCreateRequest request,
            HttpSession session
    ) {
        Object userObj = session.getAttribute("userId");
        if (userObj == null) {
            return ResponseEntity.status(401).body("{\"success\":false,\"message\":\"AUTH_REQUIRED\"}");
        }
        Integer userId = (userObj instanceof Integer) ? (Integer) userObj : Integer.valueOf(userObj.toString());

        Integer reviewId = reviewService.createReview(productId, userId, request);
        return ResponseEntity.ok("{\"success\":true,\"reviewId\":" + reviewId + "}");
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Integer productId, @PathVariable Integer reviewId) {
        reviewService.softDelete(reviewId);
        return ResponseEntity.ok("{\"success\":true}");
    }
}
