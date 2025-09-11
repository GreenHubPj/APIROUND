package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.dto.mypage.MyPageRecipeRequestDto;
import com.apiround.greenhub.dto.mypage.MyPageRecipeResponseDto;
import com.apiround.greenhub.service.mypage.MyPageRecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mypage/recipes")
@RequiredArgsConstructor
public class MyPageRecipeController {

    private final MyPageRecipeService myPageRecipeService;

    // 레시피 생성
    @PostMapping
    public ResponseEntity<Long> createRecipe(
            @RequestParam Long userId, // 보통 인증에서 뽑아내지만 우선 이렇게 받는 걸로
            @RequestBody MyPageRecipeRequestDto requestDto) {
        Long recipeId = myPageRecipeService.createRecipe(userId, requestDto);
        return ResponseEntity.ok(recipeId);
    }

    // 내가 쓴 레시피 리스트 조회
    @GetMapping
    public ResponseEntity<List<MyPageRecipeResponseDto>> getMyRecipes(@RequestParam Long userId) {
        List<MyPageRecipeResponseDto> recipes = myPageRecipeService.getMyRecipes(userId);
        return ResponseEntity.ok(recipes);
    }

    // 단일 레시피 조회
    @GetMapping("/{recipeId}")
    public ResponseEntity<MyPageRecipeResponseDto> getRecipe(
            @RequestParam Long userId,
            @PathVariable Long recipeId) {
        MyPageRecipeResponseDto dto = myPageRecipeService.getRecipe(userId, recipeId);
        return ResponseEntity.ok(dto);
    }

    // 레시피 수정
    @PutMapping("/{recipeId}")
    public ResponseEntity<Void> updateRecipe(
            @RequestParam Long userId,
            @PathVariable Long recipeId,
            @RequestBody MyPageRecipeRequestDto requestDto) {
        myPageRecipeService.updateRecipe(userId, recipeId, requestDto);
        return ResponseEntity.ok().build();
    }

    // 레시피 삭제
    @DeleteMapping("/{recipeId}")
    public ResponseEntity<Void> deleteRecipe(
            @RequestParam Long userId,
            @PathVariable Long recipeId) {
        myPageRecipeService.deleteRecipe(userId, recipeId);
        return ResponseEntity.ok().build();
    }
}
