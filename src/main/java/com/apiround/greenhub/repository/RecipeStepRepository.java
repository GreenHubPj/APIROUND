package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.RecipeStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeStepRepository extends JpaRepository<RecipeStep, Integer> {

    // 엔티티의 자바 필드명 기준 (recipe.recipeId, stepNo)
    List<RecipeStep> findByRecipeRecipeIdOrderByStepNoAsc(Integer recipeId);
}
