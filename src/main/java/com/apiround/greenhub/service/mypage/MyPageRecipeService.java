package com.apiround.greenhub.service.mypage;

import com.apiround.greenhub.dto.mypage.MyPageRecipeRequestDto;
import com.apiround.greenhub.dto.mypage.MyPageRecipeResponseDto;

import java.util.List;

public interface MyPageRecipeService {
    Integer createRecipe(Long userId, MyPageRecipeRequestDto requestDto);

    List<MyPageRecipeResponseDto> getMyRecipes(Long userId);

    MyPageRecipeResponseDto getRecipe(Long userId, Long recipeId);

    void updateRecipe(Long userId, Long recipeId, MyPageRecipeRequestDto requestDto);

    void deleteRecipe(Long userId, Long recipeId);

    void updateThumbnail(Long userId, Long recipeId, byte[] thumbnailData, String thumbnailMime);
}
