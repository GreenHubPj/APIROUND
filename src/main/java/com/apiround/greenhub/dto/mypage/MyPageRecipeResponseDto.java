package com.apiround.greenhub.dto.mypage;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class MyPageRecipeResponseDto {
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

    private List<IngredientDto> ingredients;
    private List<StepDto> steps;

    @Data
    public static class IngredientDto {
        private String ingredientName;
        private String amount;
    }

    @Data
    public static class StepDto {
        private Integer stepOrder;
        private String description;
        private String imageUrl;
    }
}
