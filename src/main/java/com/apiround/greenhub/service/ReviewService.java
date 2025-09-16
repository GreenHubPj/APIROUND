package com.apiround.greenhub.service;

import com.apiround.greenhub.dto.review.ReviewDtos.PageResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewCreateRequest;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewSummaryResponse;
import com.apiround.greenhub.entity.ProductReview; // ✅ 여기로 통일
import com.apiround.greenhub.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ProductReviewRepository productReviewRepository;

    public PageResponse<ReviewResponse> getReviews(Integer productId, int page, int size, String sort) {
        Sort s = ("oldest".equalsIgnoreCase(sort))
                ? Sort.by(Sort.Direction.ASC, "createdAt")
                : Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, s);

        Page<ProductReview> pr = productReviewRepository.findByProductIdAndIsDeletedFalse(productId, pageable);

        List<ReviewResponse> content = pr.stream()
                .map(r -> new ReviewResponse(
                        r.getReviewId(),
                        r.getProductId(),
                        r.getUserId(),
                        r.getRating(),
                        r.getContent(),
                        r.getCreatedAt()
                ))
                .toList();

        return new PageResponse<>(
                content,
                pr.getNumber(),
                pr.getSize(),
                pr.getTotalElements(),
                pr.getTotalPages()
        );
    }

    public ReviewSummaryResponse getSummary(Integer productId) {
        long total = productReviewRepository.countByProductIdAndIsDeletedFalse(productId);

        List<Long> dist = new ArrayList<>(5);
        long sum = 0;
        for (int i = 1; i <= 5; i++) {
            long c = productReviewRepository.countByProductIdAndRatingAndIsDeletedFalse(productId, (byte) i);
            dist.add(c);
            sum += (long) i * c;
        }

        double avg = (total > 0) ? (double) sum / total : 0.0;
        avg = Math.round(avg * 10.0) / 10.0;

        return new ReviewSummaryResponse(avg, total, dist);
    }

    public Integer createReview(Integer productId, Integer userId, ReviewCreateRequest req) {
        ProductReview r = new ProductReview();
        r.setProductId(productId);
        r.setUserId(userId);
        r.setRating(req.rating());
        r.setContent(req.content());
        r.setIsDeleted(false);
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        ProductReview saved = productReviewRepository.save(r);
        return saved.getReviewId();
    }

    public void softDelete(Integer reviewId) {
        productReviewRepository.findById(reviewId).ifPresent(r -> {
            r.setIsDeleted(true);
            r.setDeletedAt(LocalDateTime.now());
            r.setUpdatedAt(LocalDateTime.now());
            productReviewRepository.save(r);
        });
    }
}
