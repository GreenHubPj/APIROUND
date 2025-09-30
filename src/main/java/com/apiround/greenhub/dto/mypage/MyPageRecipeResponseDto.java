package com.apiround.greenhub.dto.mypage;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class MyPageRecipeResponseDto {
    private Integer userId;
    private Integer recipeId;
    private String title;
    private String summary;
    private String badgeText;
    private String difficulty;
    private Integer cookMinutes;
    private Integer totalMinutes;
    private String servings;
    private String heroImageUrl;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 재료 리스트
    private List<IngredientDto> ingredients;

    // 조리 단계 리스트
    private List<StepDto> steps;

    @Data
    public static class IngredientDto {
        private String ingredientName;  // 재료 이름
        private String amount;          // 재료 양
    }

    @Data
    public static class StepDto {
        private Integer stepOrder;      // 단계 번호
        private String description;     // 단계 설명
        private String imageUrl;        // 단계 이미지 URL (선택적 필드)
    }
}
