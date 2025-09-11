package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.Recipe;   // ✅ Recipe 엔티티 import
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByStatusOrderByRecipeIdDesc(String status);
}
