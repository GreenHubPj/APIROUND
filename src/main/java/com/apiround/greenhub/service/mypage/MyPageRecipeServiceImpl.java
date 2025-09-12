package com.apiround.greenhub.service.mypage;

import com.apiround.greenhub.dto.mypage.MyPageRecipeRequestDto;
import com.apiround.greenhub.dto.mypage.MyPageRecipeResponseDto;
import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.RecipeIngredient;
import com.apiround.greenhub.entity.RecipeStep;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.RecipeIngredientRepository;
import com.apiround.greenhub.repository.RecipeRepository;
import com.apiround.greenhub.repository.RecipeStepRepository;
import com.apiround.greenhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MyPageRecipeServiceImpl implements MyPageRecipeService {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final RecipeStepRepository recipeStepRepository;

    @Override
    public Integer createRecipe(Long userId, MyPageRecipeRequestDto requestDto) {
        // 1. User 조회
        User user = userRepository.findById(userId.intValue())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Recipe 객체 생성 및 저장
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

        Recipe savedRecipe = recipeRepository.save(recipe);

        // 3. 재료(ingredients) 저장
        if (requestDto.getIngredients() != null && !requestDto.getIngredients().isEmpty()) {
            List<RecipeIngredient> recipeIngredients = new ArrayList<>();

            int lineNo = 1;
            for (MyPageRecipeRequestDto.IngredientDto ingredientDto : requestDto.getIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();
                ingredient.setRecipe(savedRecipe);
                ingredient.setLineNo(lineNo++);
                ingredient.setNameText(ingredientDto.getName());
                ingredient.setNote(ingredientDto.getAmount());
                ingredient.setCreatedAt(LocalDateTime.now());

                recipeIngredients.add(ingredient);
            }

            recipeIngredientRepository.saveAll(recipeIngredients);
        }

        // 4. 조리 단계(steps) 저장
        if (requestDto.getInstructions() != null && !requestDto.getInstructions().isEmpty()) {
            List<RecipeStep> recipeSteps = new ArrayList<>();
            int stepNo = 1;

            for (MyPageRecipeRequestDto.InstructionDto instruction : requestDto.getInstructions()) {
                if (instruction.getSteps() != null) {
                    for (String stepDescription : instruction.getSteps()) {
                        RecipeStep step = new RecipeStep();
                        step.setRecipe(savedRecipe);
                        step.setStepNo(stepNo++);
                        step.setInstruction(stepDescription);
                        step.setCreatedAt(LocalDateTime.now());

                        recipeSteps.add(step);
                    }
                }
            }

            recipeStepRepository.saveAll(recipeSteps);
        }

        return savedRecipe.getRecipeId();
    }


    @Override
    @Transactional(readOnly = true)
    public List<MyPageRecipeResponseDto> getMyRecipes(Long userId) {
        List<Recipe> recipes = recipeRepository.findAllByUserUserId(userId.intValue());
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
