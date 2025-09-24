package com.apiround.greenhub.service;

import com.apiround.greenhub.dto.review.ReviewDtos.PageResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewSummaryResponse;
import com.apiround.greenhub.repository.ReviewLookupJdbc;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SpecialtyReviewService {

    private final ReviewService reviewService;      // 기존 상품 리뷰 로직 재사용
    private final ReviewLookupJdbc reviewLookupJdbc; // specialty -> product 매핑

    public PageResponse<ReviewResponse> getReviewsBySpecialty(Integer specialtyId, int page, int size, String sort) {
        Integer productId = reviewLookupJdbc.findProductIdBySpecialtyId(specialtyId);
        if (productId == null) {
            return new PageResponse<>(java.util.List.of(), page, size, 0, 0);
        }
        return reviewService.getReviews(productId, page, size, sort);
    }

    public ReviewSummaryResponse getSummaryBySpecialty(Integer specialtyId) {
        Integer productId = reviewLookupJdbc.findProductIdBySpecialtyId(specialtyId);
        if (productId == null) {
            return new ReviewSummaryResponse(0.0, 0, java.util.List.of(0L,0L,0L,0L,0L));
        }
        return reviewService.getSummary(productId);
    }
}
