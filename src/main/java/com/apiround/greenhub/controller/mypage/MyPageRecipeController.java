package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.dto.mypage.MyPageRecipeRequestDto;
import com.apiround.greenhub.dto.mypage.MyPageRecipeResponseDto;
import com.apiround.greenhub.service.mypage.MyPageRecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/mypage/recipes")
@RequiredArgsConstructor
public class MyPageRecipeController {

    private final MyPageRecipeService myPageRecipeService;

    @GetMapping("/myrecipe-detail")
    public String myRecipeDetail(@RequestParam Long userId, @RequestParam Long id, Model model) {
        MyPageRecipeResponseDto dto = myPageRecipeService.getRecipe(userId, id);
        model.addAttribute("recipe", dto);
        model.addAttribute("userId", userId); // userId를 모델에 추가
        return "myrecipe-detail"; // myrecipe-detail.html로 반환
    }

    // 레시피 생성
    @PostMapping
    public ResponseEntity<Integer> createRecipe(
            @RequestParam Long userId, // 보통 인증에서 뽑아내지만 우선 이렇게 받는 걸로
            @RequestBody MyPageRecipeRequestDto requestDto) {
        Integer recipeId = myPageRecipeService.createRecipe(userId, requestDto);
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
    public ResponseEntity<MyPageRecipeResponseDto>getRecipe(
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

    @PostMapping("/recipes/upload")
    public String uploadRecipe(@RequestParam("imageFile") MultipartFile imageFile) {
        if (!imageFile.isEmpty()) {
            String filename = imageFile.getOriginalFilename();
            Path savePath = Paths.get("upload-dir", filename);

            try {
                Files.createDirectories(savePath.getParent());
                imageFile.transferTo(savePath);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        // 나머지 저장 로직...

        return "redirect:/recipes/new"; // 저장 후 이동할 페이지
    }
}
