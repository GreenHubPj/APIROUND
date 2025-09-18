package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.service.RecipeService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.service.RecipeService;
import com.apiround.greenhub.service.item.SeasonalService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.http.ResponseEntity;
import java.util.Map;

import java.util.List;

import com.apiround.greenhub.service.item.RegionService;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {

    @Autowired
    private RecipeService recipeService;

    private final SeasonalService seasonalService;

    /** API: 오늘 뭐먹지 랜덤 레시피 추천 */
    @GetMapping("/api/random-recipe")
    @ResponseBody
    public ResponseEntity<?> getRandomRecipe() {
        try {
            Recipe recipe = recipeService.getRandomRecipeForRecommendation();
            if (recipe == null) {
                return ResponseEntity.ok().body(Map.of("error", "추천할 레시피가 없습니다."));
            }

            // 응답 데이터 구성
            Map<String, Object> response = Map.of(
                "name", recipe.getTitle() != null ? recipe.getTitle() : "맛있는 요리",
                "region", "전국 지역 특산품", // 기본값 또는 추후 지역 정보 연동
                "ingredients", getRecipeIngredients(recipe.getRecipeId().intValue()),
                "description", recipe.getSummary() != null ? recipe.getSummary() : "특별한 레시피입니다.",
                "recipeId", recipe.getRecipeId(),
                "imageUrl", recipe.getHeroImageUrl()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok().body(Map.of("error", "레시피 추천 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/")
    public String home(Model model) {
        List<Region> seasonal = seasonalService.getRandomSeasonalForMain(8); // ✅ 인스턴스 호출
        model.addAttribute("seasonalProducts", seasonal);

        List<Recipe> randomRecipes = recipeService.getRandomRecipesForMain();
        model.addAttribute("randomRecipes", randomRecipes);
        return "main";
    }

    /** /main → 메인으로 통합 */
    @GetMapping("/main")
    public String main() {
        return "redirect:/";
    }

    @GetMapping("/seasonal")
    public String seasonal() {
        // SeasonalController로 리다이렉트
        return "redirect:/specialties/monthly";
    }

    @GetMapping("/popular")
    public String popular() { return "popular"; }

    @GetMapping("/find-id")
    public String findId() { return "find-id"; }

    @GetMapping("/find-password")
    public String findPassword() { return "find-password"; }

    // ✅ /mypage-company는 CompanyMypageController가 담당
    // @GetMapping("/mypage-company")
    // public String mypageCompany() { return "mypage_company"; }

    @GetMapping("/myrecipe")
    public String myrecipe(HttpSession session, Model model) {
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (userId == null) {
            return "redirect:/login";
        }
        model.addAttribute("userId", userId);
        return "myrecipe";
    }

    /** 레시피 재료 목록을 문자열 배열로 반환 */
    private List<String> getRecipeIngredients(Integer recipeId) {
        try {
            return recipeService.getIngredients(recipeId)
                    .stream()
                    .map(ingredient -> ingredient.getNameText())
                    .limit(4) // 최대 4개만
                    .toList();
        } catch (Exception e) {
            return List.of("신선한 재료");
        }
    }

    @GetMapping("/newrecipe")
    public String newrecipe() { return "newrecipe"; }

    @GetMapping("/orderhistory")
    public String orderhistory() { return "orderhistory"; }

    @GetMapping("/myrecipe-detail")
    public String myrecipeDetail(@RequestParam(required = false) String id,
                                 @RequestParam(required = false) String name,
                                 @RequestParam(required = false) String mode) {
        return "myrecipe-detail";
    }

    @GetMapping("/shoppinglist")
    public String shoppinglist() { return "shoppinglist"; }

    @GetMapping("/orderdetails")
    public String orderdetails(@RequestParam(required = false) String id) { return "orderdetails"; }

    @GetMapping("/review")
    public String review() { return "review"; }

    @GetMapping("/review-write")
    public String reviewWrite() { return "review-write"; }

    @GetMapping("/event")
    public String event() { return "event"; }

    //@GetMapping("/profile-edit")
    //public String profileEdit() { return "profile-edit"; }

    // 🚫 /profile-edit-company는 CompanyProfileController가 담당
    // @GetMapping("/profile-edit-company")
    // public String profileEditCompany() { return "profile-edit-company"; }

    @GetMapping("/refund")
    public String refund() { return "refund"; }

    @GetMapping("/buying")
    public String buying() { return "buying"; }

    @GetMapping("/reviewlist")
    public String reviewlist() { return "reviewlist"; }

    @GetMapping("/review-management")
    public String reviewManagement() { return "review-management"; }

    @GetMapping("/sellerDelivery")
    public String sellerDelivery() { return "sellerDelivery"; }

    @GetMapping("/customerOrder")
    public String customerOrder() { return "customerOrder"; }
}
