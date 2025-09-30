package com.apiround.greenhub.controller.mypage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.apiround.greenhub.dto.mypage.MyPageRecipeRequestDto;
import com.apiround.greenhub.dto.mypage.MyPageRecipeResponseDto;
import com.apiround.greenhub.service.mypage.MyPageRecipeService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/mypage/recipes")
@RequiredArgsConstructor
public class MyPageRecipeController {

    private final MyPageRecipeService myPageRecipeService;

    @GetMapping("/myrecipe-detail")
    public String myRecipeDetail(@RequestParam Long userId, @RequestParam Long id, Model model) {
        System.out.println("myRecipeDetail 호출됨, userId=" + userId + ", id=" + id);
        MyPageRecipeResponseDto dto = myPageRecipeService.getRecipe(userId, id);
        model.addAttribute("recipe", dto);
        model.addAttribute("userId", userId);
        return "myrecipe-detail";
    }

    // 레시피 생성
    @PostMapping
    public ResponseEntity<Integer> createRecipe(
            HttpSession session,
            @RequestBody MyPageRecipeRequestDto requestDto) {

        Object userIdObj = session.getAttribute("loginUserId");

        if (userIdObj == null) {
            return ResponseEntity.status(401).build(); // 로그인 안 된 상태
        }

        Long userId = (userIdObj instanceof Integer)
                ? ((Integer) userIdObj).longValue()
                : (Long) userIdObj;

        Integer recipeId = myPageRecipeService.createRecipe(userId, requestDto);
        return ResponseEntity.ok(recipeId);
    }

    // 내가 쓴 레시피 리스트 조회
    @GetMapping
    @ResponseBody
    public ResponseEntity<List<MyPageRecipeResponseDto>> getMyRecipes(@RequestParam Long userId) {
        List<MyPageRecipeResponseDto> recipes = myPageRecipeService.getMyRecipes(userId);
        return ResponseEntity.ok(recipes);
    }

    // 단일 레시피 조회
    @GetMapping(value = "/{recipeId}", produces = "application/json;charset=UTF-8")
    @ResponseBody
    public ResponseEntity<MyPageRecipeResponseDto>getRecipe(
            @RequestParam Long userId,
            @PathVariable Long recipeId) {
        MyPageRecipeResponseDto dto = myPageRecipeService.getRecipe(userId, recipeId);
        return ResponseEntity.ok()
                .header("Content-Type", "application/json;charset=UTF-8")
                .body(dto);
    }

    // 레시피 수정
    @PutMapping(value = "/{recipeId}", consumes = "application/json;charset=UTF-8")
    public ResponseEntity<Void> updateRecipe(
            @RequestParam Long userId,
            @PathVariable Long recipeId,
            @RequestBody MyPageRecipeRequestDto requestDto) {
        myPageRecipeService.updateRecipe(userId, recipeId, requestDto);
        return ResponseEntity.ok().build();
    }

    // 이미지와 함께 레시피 수정
    @PutMapping("/{recipeId}/with-image")
    public ResponseEntity<Void> updateRecipeWithImage(
            @RequestParam Long userId,
            @PathVariable Long recipeId,
            @RequestParam("imageFile") MultipartFile imageFile,
            @RequestParam("recipeData") String recipeDataJson) {
        
        try {
            // JSON 문자열을 DTO로 변환
            ObjectMapper objectMapper = new ObjectMapper();
            MyPageRecipeRequestDto requestDto = objectMapper.readValue(recipeDataJson, MyPageRecipeRequestDto.class);
            
            // 이미지 파일 처리
            if (!imageFile.isEmpty()) {
                String filename = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
                Path uploadPath = Paths.get("upload-dir/recipes");
                
                // 디렉토리 생성
                Files.createDirectories(uploadPath);
                
                // 파일 저장
                Path filePath = uploadPath.resolve(filename);
                imageFile.transferTo(filePath);
                
                // DTO에 이미지 URL 설정
                requestDto.setHeroImageUrl("/upload-dir/recipes/" + filename);
            }
            
            // 레시피 업데이트
            myPageRecipeService.updateRecipe(userId, recipeId, requestDto);
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // 레시피 삭제
    @DeleteMapping("/{recipeId}")
    public ResponseEntity<Void> deleteRecipe(
            @RequestParam Long userId,
            @PathVariable Long recipeId) {
        myPageRecipeService.deleteRecipe(userId, recipeId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/list")
    public String recipeListPage(@RequestParam Long userId, Model model) {
        List<MyPageRecipeResponseDto> recipes = myPageRecipeService.getMyRecipes(userId);
        model.addAttribute("recipes", recipes);
        model.addAttribute("userId", userId);
        return "myrecipe";  // src/main/resources/templates/myrecipe.html 파일로 이동 (Thymeleaf 기준)
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

    @PostMapping(value = "/{recipeId}/upload-thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadThumbnail(
            @RequestParam Long userId,
            @PathVariable Long recipeId,
            @RequestParam("thumbnail") MultipartFile thumbnail) throws IOException {

        if (thumbnail.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        byte[] data = thumbnail.getBytes();
        String mime = thumbnail.getContentType();

        myPageRecipeService.updateThumbnail(userId, recipeId, data, mime);

        return ResponseEntity.ok().build();
    }


    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<String> handleMissingParam(MissingServletRequestParameterException ex) {
        return ResponseEntity.badRequest().body("필수 파라미터 누락: " + ex.getParameterName());
    }
}
