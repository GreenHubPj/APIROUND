package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.RecipeStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface RecipeStepRepository extends JpaRepository<RecipeStep, Integer> {

    // 엔티티의 자바 필드명 기준 (recipe.recipeId, stepNo)
    List<RecipeStep> findByRecipeRecipeIdOrderByStepNoAsc(Integer recipeId);

    @Modifying
    @Transactional
    @Query("DELETE FROM RecipeStep rs WHERE rs.recipe.recipeId = :recipeId")
    void deleteByRecipeId(Integer recipeId);

}
