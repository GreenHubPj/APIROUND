package com.apiround.greenhub.controller.review;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiround.greenhub.dto.review.ReviewDtos.PageResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewSummaryResponse;
import com.apiround.greenhub.service.ReviewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductReviewController {

    private final ReviewService reviewService;

    /**
     * 상품별 리뷰 목록 조회
     */
    @GetMapping("/{productId}/reviews")
    public ResponseEntity<?> getReviews(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        
        try {
            PageResponse<ReviewResponse> reviews = reviewService.getReviews(productId, page, size, sort);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "리뷰 조회 실패: " + e.getMessage()));
        }
    }

    /**
     * 상품별 리뷰 요약 정보 조회
     */
    @GetMapping("/{productId}/reviews/summary")
    public ResponseEntity<?> getReviewSummary(@PathVariable Integer productId) {
        try {
            ReviewSummaryResponse summary = reviewService.getSummary(productId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "리뷰 요약 조회 실패: " + e.getMessage()));
        }
    }
}

