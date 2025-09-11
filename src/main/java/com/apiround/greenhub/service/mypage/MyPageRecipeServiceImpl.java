package com.apiround.greenhub.service.mypage;

import com.apiround.greenhub.dto.mypage.MyPageRecipeRequestDto;
import com.apiround.greenhub.dto.mypage.MyPageRecipeResponseDto;
import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.RecipeRepository;
import com.apiround.greenhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MyPageRecipeServiceImpl implements MyPageRecipeService {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;

    @Override
    public Long createRecipe(Long userId, MyPageRecipeRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Recipe recipe = new Recipe();
        recipe.setUser(user);
        recipe.setTitle(requestDto.getTitle());
        recipe.setSummary(requestDto.getSummary());
        recipe.setBadgeText(requestDto.getBadgeText());
        recipe.setDifficulty(Recipe.Difficulty.valueOf(requestDto.getDifficulty()));
        recipe.setCookMinutes(requestDto.getCookMinutes());
        recipe.setTotalMinutes(requestDto.getTotalMinutes());
        recipe.setServings(requestDto.getServings());
        recipe.setHeroImageUrl(requestDto.getHeroImageUrl());
        recipe.setStatus("PUBLISHED");
        recipe.setCreatedAt(LocalDateTime.now());
        recipe.setUpdatedAt(LocalDateTime.now());

        // TODO: ingredients, steps도 매핑 후 저장 (필요시 추가 구현)

        Recipe savedRecipe = recipeRepository.save(recipe);
        return savedRecipe.getRecipeId();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyPageRecipeResponseDto> getMyRecipes(Long userId) {
        List<Recipe> recipes = recipeRepository.findAllByUserUserId(userId);
        return recipes.stream().map(recipe -> {
            MyPageRecipeResponseDto dto = new MyPageRecipeResponseDto();
            dto.setRecipeId(recipe.getRecipeId());
            dto.setTitle(recipe.getTitle());
            dto.setSummary(recipe.getSummary());
            dto.setBadgeText(recipe.getBadgeText());
            dto.setDifficulty(recipe.getDifficulty().name());
            dto.setCookMinutes(recipe.getCookMinutes());
            dto.setTotalMinutes(recipe.getTotalMinutes());
            dto.setServings(recipe.getServings());
            dto.setHeroImageUrl(recipe.getHeroImageUrl());
            dto.setStatus(recipe.getStatus());
            dto.setCreatedAt(recipe.getCreatedAt());
            dto.setUpdatedAt(recipe.getUpdatedAt());

            // TODO: ingredients, steps 변환 후 세팅

            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public MyPageRecipeResponseDto getRecipe(Long userId, Long recipeId) {
        // TODO: 구현 필요
        return null;
    }

    @Override
    public void updateRecipe(Long userId, Long recipeId, MyPageRecipeRequestDto requestDto) {
        // TODO: 구현 필요
    }

    @Override
    public void deleteRecipe(Long userId, Long recipeId) {
        // TODO: 구현 필요
    }
    // 나머지 updateRecipe, getRecipe, deleteRecipe도 비슷한 구조로 구현
}
