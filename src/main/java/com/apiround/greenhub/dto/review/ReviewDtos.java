package com.apiround.greenhub.dto.review;

import java.time.LocalDateTime;
import java.util.List;

public class ReviewDtos {

    public record ReviewResponse(
            Integer reviewId,
            Integer productId,
            Integer userId,
            Byte rating,
            String content,
            LocalDateTime createdAt
    ) {}

    public record ReviewSummaryResponse(
            double averageRating,
            long totalCount,
            List<Long> distribution // index 0->1점, 1->2점 ... 4->5점
    ) {}

    public record ReviewCreateRequest(
            Byte rating,
            String content
    ) {}

    public record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {}
}
