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
            System.out.println("랜덤 레시피 API 호출됨");
            Recipe recipe = recipeService.getRandomRecipeForRecommendation();
            System.out.println("레시피 조회 결과: " + (recipe != null ? recipe.getTitle() : "null"));
            
            if (recipe == null) {
                System.out.println("레시피가 null입니다. 기본 데이터 반환");
                // 기본 레시피 데이터 반환
                Map<String, Object> defaultResponse = Map.of(
                    "name", "김치찌개",
                    "region", "전국 지역 특산품",
                    "ingredients", List.of("김치", "돼지고기", "두부", "대파"),
                    "description", "맛있는 김치찌개입니다.",
                    "recipeId", 1,
                    "imageUrl", "/images/kimchi.jpg"
                );
                return ResponseEntity.ok(defaultResponse);
            }

            // 응답 데이터 구성
            List<String> ingredients = getRecipeIngredients(recipe.getRecipeId());
            System.out.println("재료 목록: " + ingredients);
            
            Map<String, Object> response = Map.of(
                    "name", recipe.getTitle() != null ? recipe.getTitle() : "맛있는 요리",
                    "region", "전국 지역 특산품",
                    "ingredients", ingredients,
                    "description", recipe.getSummary() != null ? recipe.getSummary() : "특별한 레시피입니다.",
                    "recipeId", recipe.getRecipeId(),
                    "imageUrl", recipe.getHeroImageUrl() != null ? recipe.getHeroImageUrl() : "/images/default.jpg"
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("API 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok().body(Map.of("error", "레시피 추천 중 오류가 발생했습니다: " + e.getMessage()));
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



    @GetMapping("/myrecipe-detail")
    public String myrecipeDetail(@RequestParam(required = false) String id,
                                 @RequestParam(required = false) String name,
                                 @RequestParam(required = false) String mode) {
        return "myrecipe-detail";
    }

    @GetMapping("/shoppinglist")
    public String shoppinglist(HttpSession session, Model model) {
        try {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                return "redirect:/login";
            }

            // 장바구니 데이터 가져오기
            List<CartDto.Response> cartItems = cartService.getCartItems(user);
            model.addAttribute("cartItems", cartItems);

            return "shoppinglist";
        } catch (Exception e) {
            // 에러 발생 시 빈 장바구니로 처리
            model.addAttribute("cartItems", new ArrayList<>());
            return "shoppinglist";
        }
    }

    @GetMapping("/orderdetails")
    public String orderdetails(@RequestParam(required = false) String id) { return "orderdetails"; }

    @GetMapping("/review")
    public String review() { return "review"; }

    @GetMapping("/review-write")
    public String reviewWrite() { return "review-write"; }

    @GetMapping("/event")
    public String event() { return "event"; }

    @GetMapping("/refund")
    public String refund() { return "refund"; }

    @GetMapping("/reviewlist")
    public String reviewlist() { return "reviewlist"; }

    @GetMapping("/review-management")
    public String reviewManagement() { return "review-management"; }

    @GetMapping("/sellerDelivery")
    public String sellerDelivery() { return "sellerDelivery"; }

    @GetMapping("/customerOrder")
    public String customerOrder() { return "customerOrder"; }
}
