package com.apiround.greenhub.dto.review;

import java.util.List;

public record PageResponse<T>(
        List<T> content,
        long totalElements,
        int totalPages
) {}
