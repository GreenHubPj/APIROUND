package com.apiround.greenhub.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RecipeWithIngredientsDto {
    private Integer recipeId;
    private String title;
    private String summary;
    private String badgeText;
    private String heroImageUrl;
    private List<IngredientDto> ingredients;

    @Data
    public static class IngredientDto {
        private String nameText;
        private BigDecimal qtyValue;
        private String unitCode;
        private String note;
    }
}
