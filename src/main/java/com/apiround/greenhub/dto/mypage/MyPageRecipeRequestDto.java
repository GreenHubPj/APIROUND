package com.apiround.greenhub.dto.mypage;

import lombok.Data;

import java.util.List;

@Data
public class MyPageRecipeRequestDto {
    private String title;
    private String summary;
    private String badgeText;
    private String difficulty;  // EASY, MEDIUM, HARD
    private Integer cookMinutes;
    private Integer totalMinutes;
    private String servings;
    private String heroImageUrl;

    private List<IngredientDto> ingredients;
    private List<StepDto> steps;

    @Data
    public static class IngredientDto {
        private String name;        // ingredientName → name
        private String amount;
        private String note;
    }

    @Data
    public static class StepDto {
        private Integer stepOrder;
        private String description;
        private String imageUrl;
    }

    // instructions 필드 추가
    private List<InstructionDto> instructions;

    @Data
    public static class InstructionDto {
        private String title;
        private List<String> steps;
    }
}
