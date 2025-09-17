package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.service.RecipeService;
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

import java.util.List;

import com.apiround.greenhub.service.item.RegionService;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {

    @Autowired
    private RecipeService recipeService;

    private final SeasonalService seasonalService;

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

    // ✅ /mypage-company는 CompanyMypageController가 담당
    // @GetMapping("/mypage-company")
    // public String mypageCompany() { return "mypage_company"; }

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
