package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.service.RecipeService;
import com.apiround.greenhub.service.item.SeasonalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final RecipeService recipeService;
    private final SeasonalService seasonalService;

    /** 메인 페이지 */
    @GetMapping("/")
    public String home(Model model) {
        // 계절(제철) 상품 8개
        List<Region> seasonal = seasonalService.getRandomSeasonalForMain(8);
        model.addAttribute("seasonalProducts", seasonal);

        // 메인 노출용 랜덤 레시피
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
        return "redirect:/specialties/monthly";
    }

    @GetMapping("/popular")
    public String popular() { return "popular"; }

    @GetMapping("/find-id")
    public String findId() { return "find-id"; }

    @GetMapping("/find-password")
    public String findPassword() { return "find-password"; }

    @GetMapping("/myrecipe")
    public String myrecipe() { return "myrecipe"; }

    @GetMapping("/myrecipe-detail")
    public String myrecipeDetail(@RequestParam(required = false) String id,
                                 @RequestParam(required = false) String name,
                                 @RequestParam(required = false) String mode) {
        return "myrecipe-detail";
    }

    @GetMapping("/newrecipe")
    public String newrecipe() { return "newrecipe"; }

    @GetMapping("/orderhistory")
    public String orderhistory() { return "orderhistory"; }

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
