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
import java.util.Comparator;
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
        User user = userRepository.findById(userId.intValue())
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

        Recipe savedRecipe = recipeRepository.save(recipe);

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
        List<Recipe> recipes = recipeRepository.findByUserIdAndStatusNot(userId.intValue(), "DELETED");
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
            dto.setUserId(recipe.getUserId());
            // TODO: 필요 시 재료, 조리법 변환 후 세팅
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public MyPageRecipeResponseDto getRecipe(Long userId, Long recipeId) {
        Recipe recipe = recipeRepository.findByIdWithUser(recipeId.intValue())
                .orElseThrow(() -> new RuntimeException("Recipe not found"));

        if (recipe.getUser() == null || !recipe.getUser().getUserId().equals(userId.intValue())) {
            throw new RuntimeException("권한 없음 또는 잘못된 사용자");
        }

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

        List<MyPageRecipeResponseDto.IngredientDto> ingredients = recipe.getIngredients().stream()
                .map(ingredient -> {
                    MyPageRecipeResponseDto.IngredientDto ingDto = new MyPageRecipeResponseDto.IngredientDto();
                    ingDto.setIngredientName(ingredient.getNameText());
                    ingDto.setAmount(ingredient.getNote());
                    return ingDto;
                }).collect(Collectors.toList());
        dto.setIngredients(ingredients);

        List<MyPageRecipeResponseDto.StepDto> steps = recipe.getSteps().stream()
                .sorted(Comparator.comparingInt(RecipeStep::getStepNo))
                .map(step -> {
                    MyPageRecipeResponseDto.StepDto stepDto = new MyPageRecipeResponseDto.StepDto();
                    stepDto.setStepOrder(step.getStepNo());
                    stepDto.setDescription(step.getInstruction());
                    stepDto.setImageUrl(step.getStepImageUrl());
                    return stepDto;
                }).collect(Collectors.toList());
        dto.setSteps(steps);

        return dto;
    }

    @Override
    public void updateRecipe(Long userId, Long recipeId, MyPageRecipeRequestDto requestDto) {
        Recipe recipe = recipeRepository.findByIdWithUser(recipeId.intValue())
                .orElseThrow(() -> new RuntimeException("Recipe not found"));

        if (!recipe.getUser().getUserId().equals(userId.intValue())) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }

        recipe.setTitle(requestDto.getTitle());
        recipe.setSummary(requestDto.getSummary());
        recipe.setBadgeText(requestDto.getBadgeText());
        recipe.setDifficulty(Recipe.Difficulty.valueOf(requestDto.getDifficulty()));
        recipe.setCookMinutes(requestDto.getCookMinutes());
        recipe.setTotalMinutes(requestDto.getTotalMinutes());
        recipe.setServings(requestDto.getServings());
        recipe.setHeroImageUrl(requestDto.getHeroImageUrl());
        recipe.setUpdatedAt(LocalDateTime.now());
        recipeRepository.save(recipe);

        recipeIngredientRepository.deleteByRecipeId(recipeId.intValue());
        if (requestDto.getIngredients() != null && !requestDto.getIngredients().isEmpty()) {
            List<RecipeIngredient> updatedIngredients = new ArrayList<>();
            int lineNo = 1;
            for (MyPageRecipeRequestDto.IngredientDto ing : requestDto.getIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();
                ingredient.setRecipe(recipe);
                ingredient.setLineNo(lineNo++);
                ingredient.setNameText(ing.getName());
                ingredient.setNote(ing.getAmount());
                ingredient.setCreatedAt(LocalDateTime.now());
                updatedIngredients.add(ingredient);
            }
            recipeIngredientRepository.saveAll(updatedIngredients);
        }

        recipeStepRepository.deleteByRecipeId(recipeId.intValue());
        if (requestDto.getSteps() != null && !requestDto.getSteps().isEmpty()) {
            List<RecipeStep> updatedSteps = new ArrayList<>();
            for (MyPageRecipeRequestDto.StepDto stepDto : requestDto.getSteps()) {
                RecipeStep step = new RecipeStep();
                step.setRecipe(recipe);
                step.setStepNo(stepDto.getStepOrder());
                step.setInstruction(stepDto.getDescription());
                step.setStepImageUrl(stepDto.getImageUrl());
                step.setCreatedAt(LocalDateTime.now());
                updatedSteps.add(step);
            }
            recipeStepRepository.saveAll(updatedSteps);
        }
    }

    @Override
    public void deleteRecipe(Long userId, Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId.intValue())
                .orElseThrow(() -> new RuntimeException("레시피가 존재하지 않습니다."));

        if (!recipe.getUser().getUserId().equals(userId.intValue())) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        recipe.setStatus("DELETED");
        recipe.setUpdatedAt(LocalDateTime.now());
        recipeRepository.save(recipe);
    }

    @Override
    public void updateThumbnail(Long userId, Long recipeId, byte[] thumbnailData, String thumbnailMime) {
        Recipe recipe = recipeRepository.findById(recipeId.intValue())
                .orElseThrow(() -> new RuntimeException("레시피가 없습니다."));

        if (!recipe.getUser().getUserId().equals(userId.intValue())) {
            throw new RuntimeException("권한이 없습니다.");
        }

        recipe.setThumbnailData(thumbnailData);
        recipe.setThumbnailMime(thumbnailMime);
        recipe.setUpdatedAt(LocalDateTime.now());
        recipeRepository.save(recipe);
    }
}
