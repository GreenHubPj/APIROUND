package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminRecipeService {

    private final RecipeRepository recipeRepo;

    /** 모든 레시피 조회 (관리자용) - 최신순 정렬 */
    public List<Recipe> getAllRecipes() {
        return recipeRepo.findAllByOrderByCreatedAtDesc();
    }

    /** 상태별 레시피 조회 */
    public List<Recipe> getRecipesByStatus(String status) {
        return recipeRepo.findByStatusOrderByRecipeIdDesc(status);
    }

    /** 상태와 검색어로 레시피 조회 (메모리에서 필터링) - 최신순 정렬 */
    public List<Recipe> getRecipesByStatusAndSearch(String status, String searchTerm) {
        List<Recipe> allRecipes = recipeRepo.findAllByOrderByCreatedAtDesc();
        
        // 상태별 필터링
        if (status != null && !status.isEmpty()) {
            allRecipes = allRecipes.stream()
                    .filter(recipe -> status.equals(recipe.getStatus()))
                    .collect(java.util.stream.Collectors.toList());
        }
        
        // 검색 필터링
        if (searchTerm != null && !searchTerm.isEmpty()) {
            String searchTermLower = searchTerm.toLowerCase();
            allRecipes = allRecipes.stream()
                    .filter(recipe -> 
                        recipe.getTitle().toLowerCase().contains(searchTermLower) ||
                        (recipe.getSummary() != null && recipe.getSummary().toLowerCase().contains(searchTermLower))
                    )
                    .collect(java.util.stream.Collectors.toList());
        }
        
        return allRecipes;
    }

    /** 레시피 상태 업데이트 */
    public void updateRecipeStatus(Integer recipeId, String status) {
        Recipe recipe = recipeRepo.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + recipeId));
        recipe.setStatus(status);
        recipeRepo.save(recipe);
    }

    /** 레시피 삭제 */
    public void deleteRecipe(Integer recipeId) {
        Recipe recipe = recipeRepo.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + recipeId));
        recipeRepo.delete(recipe);
    }
}
