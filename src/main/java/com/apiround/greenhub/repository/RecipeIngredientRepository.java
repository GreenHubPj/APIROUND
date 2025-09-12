package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Integer> {
    List<RecipeIngredient> findByRecipeRecipeIdOrderByLineNoAsc(Integer recipeId);
}
