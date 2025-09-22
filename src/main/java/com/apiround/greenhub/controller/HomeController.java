package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.service.RecipeService;
import com.apiround.greenhub.service.item.SeasonalService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final RecipeService recipeService;
    private final SeasonalService seasonalService;

    /** 메인 */
    @GetMapping("/")
    public String home(Model model) {
        List<Region> seasonal = seasonalService.getRandomSeasonalForMain(8);
        model.addAttribute("seasonalProducts", seasonal);

        List<Recipe> randomRecipes = recipeService.getRandomRecipesForMain();
        model.addAttribute("randomRecipes", randomRecipes);
        return "main";
    }

    /** 오늘 뭐먹지 - 랜덤 레시피 */
    @GetMapping("/api/random-recipe")
    @ResponseBody
    public ResponseEntity<?> getRandomRecipe() {
        try {
            Recipe recipe = recipeService.getRandomRecipeForRecommendation();
            if (recipe == null) {
                return ResponseEntity.ok(Map.of(
                        "name", "김치찌개",
                        "region", "전국 지역 특산품",
                        "ingredients", List.of("김치", "돼지고기", "두부", "대파"),
                        "description", "맛있는 김치찌개입니다.",
                        "recipeId", 1,
                        "imageUrl", "/images/kimchi.jpg"
                ));
            }
            List<String> ingredients = getRecipeIngredients(recipe.getRecipeId());
            return ResponseEntity.ok(Map.of(
                    "name", recipe.getTitle() != null ? recipe.getTitle() : "맛있는 요리",
                    "region", "전국 지역 특산품",
                    "ingredients", ingredients,
                    "description", recipe.getSummary() != null ? recipe.getSummary() : "특별한 레시피입니다.",
                    "recipeId", recipe.getRecipeId(),
                    "imageUrl", recipe.getHeroImageUrl() != null ? recipe.getHeroImageUrl() : "/images/default.jpg"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", "레시피 추천 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/seasonal") public String seasonal() { return "redirect:/specialties/monthly"; }
    @GetMapping("/popular") public String popular() { return "popular"; }
    @GetMapping("/find-id") public String findId() { return "find-id"; }
    @GetMapping("/find-password") public String findPassword() { return "find-password"; }

    @GetMapping("/myrecipe")
    public String myrecipe(HttpSession session, Model model) {
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (userId == null) return "redirect:/login";
        model.addAttribute("userId", userId);
        return "myrecipe";
    }

    @GetMapping("/newrecipe") public String newrecipe() { return "newrecipe"; }

    @GetMapping("/myrecipe-detail")
    public String myrecipeDetail(@RequestParam(required = false) String id,
                                 @RequestParam(required = false) String name,
                                 @RequestParam(required = false) String mode) {
        return "myrecipe-detail";
    }

    @GetMapping("/shoppinglist") public String shoppinglist() { return "shoppinglist"; }
    @GetMapping("/orderdetails") public String orderdetails(@RequestParam(required = false) String id) { return "orderdetails"; }

    /** 리뷰 탭(이름 노출) */
    @GetMapping("/review")
    public String reviewPage(Model model, HttpSession session) {
        String loginName = (String) session.getAttribute("loginUserName");
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (loginName != null || userId != null) {
            model.addAttribute("currentUser", Map.of(
                    "userId", userId,
                    "name", loginName != null ? loginName : "회원"
            ));
        } else {
            model.addAttribute("currentUser", null);
        }
        return "review";
    }

    @GetMapping("/review-write") public String reviewWrite() { return "review-write"; }
    @GetMapping("/event") public String event() { return "event"; }
    @GetMapping("/refund") public String refund() { return "refund"; }
    @GetMapping("/reviewlist") public String reviewlist() { return "reviewlist"; }
    @GetMapping("/review-management") public String reviewManagement() { return "review-management"; }
    @GetMapping("/sellerDelivery") public String sellerDelivery() { return "sellerDelivery"; }
    @GetMapping("/customerOrder") public String customerOrder() { return "customerOrder"; }

    /** 내부 유틸 */
    private List<String> getRecipeIngredients(Integer recipeId) {
        try {
            return recipeService.getIngredients(recipeId)
                    .stream()
                    .map(ing -> ing.getNameText())
                    .limit(4)
                    .toList();
        } catch (Exception e) {
            return List.of("신선한 재료");
        }
    }
}
