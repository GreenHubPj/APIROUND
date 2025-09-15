package com.apiround.greenhub.dto;

import com.apiround.greenhub.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {

    private Integer reviewId;
    private Integer userId;
    private int rating;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 엔티티 → DTO 매핑 */
    public static ReviewDto fromEntity(Review r) {
        if (r == null) return null;
        return ReviewDto.builder()
                .reviewId(r.getReviewId())
                .userId(r.getUserId())
                .rating(r.getRating())
                .content(r.getContent())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
