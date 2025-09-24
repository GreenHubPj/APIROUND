package com.apiround.greenhub.dto.review;

import java.util.List;

public record ReviewRowResponse(
        Integer reviewId,
        String createdAt,
        String orderNumber,
        String productName,
        String authorName,
        Integer rating,
        String content,
        List<String> photoUrls,
        String status,
        Integer reportCount,
        String processor
) {}
