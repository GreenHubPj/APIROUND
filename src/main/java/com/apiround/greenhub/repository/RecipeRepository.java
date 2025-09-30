package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.Recipe;   // ✅ Recipe 엔티티 import
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Integer> {
    List<Recipe> findByStatusOrderByRecipeIdDesc(String status);

    List<Recipe> findByUserIdAndStatusNot(Integer userId, String status);
    // RecipeRepository에서 User와 함께 Recipe을 조회하는 쿼리
    @Query("SELECT r FROM Recipe r LEFT JOIN FETCH r.user WHERE r.recipeId = :recipeId")
    Optional<Recipe> findByIdWithUser(@Param("recipeId") Integer recipeId);

    // RecipeRepository.java
    @Query(value = "SELECT * FROM recipe WHERE status = 'PUBLISHED' ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Recipe> findRandomPublishedRecipes(@Param("limit") int limit);

    // 최신순으로 모든 레시피 조회
    List<Recipe> findAllByOrderByCreatedAtDesc();
}
