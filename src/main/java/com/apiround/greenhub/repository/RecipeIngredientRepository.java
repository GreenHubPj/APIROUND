package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Integer> {
    List<RecipeIngredient> findByRecipeRecipeIdOrderByLineNoAsc(Integer recipeId);
    // ✅ 추가: recipeId로 모든 재료 삭제
    @Modifying
    @Transactional
    @Query("DELETE FROM RecipeIngredient ri WHERE ri.recipe.recipeId = :recipeId")
    void deleteByRecipeId(Integer recipeId);
}
