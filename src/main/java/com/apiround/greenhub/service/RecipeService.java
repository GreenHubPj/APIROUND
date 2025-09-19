package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.RecipeIngredient;
import com.apiround.greenhub.entity.RecipeStep;
import com.apiround.greenhub.entity.RecipeXProduct;
import com.apiround.greenhub.repository.RecipeIngredientRepository;
import com.apiround.greenhub.repository.RecipeRepository;
import com.apiround.greenhub.repository.RecipeStepRepository;
import com.apiround.greenhub.repository.RecipeXProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RecipeService {

    private final RecipeRepository recipeRepo;
    private final RecipeIngredientRepository ingredientRepo;
    private final RecipeStepRepository stepRepo;
    private final RecipeXProductRepository rxpRepo;

    /** 목록: 최신 PUBLISHED 레시피 */
    public List<Recipe> getRecipes() {
        return recipeRepo.findByStatusOrderByRecipeIdDesc("PUBLISHED");
    }

    /** 레시피 기본 정보 */
    public Recipe getRecipe(Integer id) {
        return recipeRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + id));
    }

    /** 재료 목록 (line_no 기준 오름차순) */
    public List<RecipeIngredient> getIngredients(Integer recipeId) {
        return ingredientRepo.findByRecipeRecipeIdOrderByLineNoAsc(recipeId);
    }

    /** 조리 단계 (step_no 기준 오름차순) */
    public List<RecipeStep> getSteps(Integer recipeId) {
        return stepRepo.findByRecipeRecipeIdOrderByStepNoAsc(recipeId);
    }

    /** 레시피-상품 연결 (MAIN/SUB/OPTIONAL 포함) */
    public List<RecipeXProduct> getProducts(Integer recipeId) {
        return rxpRepo.findByRecipeRecipeId(recipeId);
    }

    public List<Recipe> getRandomRecipesForMain() {
        return recipeRepo.findRandomPublishedRecipes(5);
    }

    /** 오늘 뭐먹지 추천용 랜덤 레시피 1개 */
    public Recipe getRandomRecipeForRecommendation() {
        List<Recipe> recipes = recipeRepo.findRandomPublishedRecipes(1);
        return recipes.isEmpty() ? null : recipes.get(0);
    }


}
