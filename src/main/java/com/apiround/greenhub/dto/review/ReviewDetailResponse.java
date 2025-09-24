package com.apiround.greenhub.dto.review;

import java.util.List;

public record ReviewDetailResponse(
        Integer reviewId,
        String createdAt,
        String ipAddress,
        String userAgent,
        String orderNumber,
        String productName,
        String authorName,
        Integer rating,
        String content,
        List<String> photoUrls,
        String adminMemo,
        List<HistoryItem> history,
        Reply reply,
        String status
) {
    public record HistoryItem(String date, String action, String description) {}
    public record Reply(String content, String createdAt) {}
}
