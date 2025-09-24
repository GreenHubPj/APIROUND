package com.apiround.greenhub.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.RecipeIngredient;
import com.apiround.greenhub.entity.RecipeStep;
import com.apiround.greenhub.entity.RecipeXProduct;
import com.apiround.greenhub.service.RecipeService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
@RequestMapping("/recipe")
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping("/")
    public String home(Model model) {
        List<Recipe> randomRecipes = recipeService.getRandomRecipesForMain();
        model.addAttribute("randomRecipes", randomRecipes);
        return "main";
    }

    // 목록: PUBLISHED만 (서버 사이드 페이징)
    @GetMapping
    public String list(Model model,
                      @RequestParam(required = false) String search,
                      @RequestParam(defaultValue = "0") int page,
                      @RequestParam(defaultValue = "12") int size) {
        List<Recipe> allRecipes = recipeService.getRecipes();
        
        // 검색 필터링
        if (search != null && !search.isEmpty()) {
            String searchTermLower = search.toLowerCase();
            allRecipes = allRecipes.stream()
                    .filter(recipe -> 
                        recipe.getTitle().toLowerCase().contains(searchTermLower) ||
                        (recipe.getSummary() != null && recipe.getSummary().toLowerCase().contains(searchTermLower))
                    )
                    .collect(java.util.stream.Collectors.toList());
        }
        
        // 서버 사이드 페이징 적용
        long totalElements = allRecipes.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, allRecipes.size());
        
        List<Recipe> recipes;
        if (startIndex < allRecipes.size()) {
            recipes = allRecipes.subList(startIndex, endIndex);
        } else {
            recipes = new java.util.ArrayList<>();
        }
        
        model.addAttribute("recipes", recipes);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalElements", totalElements);
        model.addAttribute("pageSize", size);
        model.addAttribute("searchTerm", search);
        return "recipe";
    }

    // 상세
    @GetMapping("/{id}")
    public String detail(@PathVariable Integer id, Model model) {
        Recipe recipe = recipeService.getRecipe(id);
        List<RecipeIngredient> ingredients = recipeService.getIngredients(id);
        List<RecipeStep> steps = recipeService.getSteps(id);
        List<RecipeXProduct> products = recipeService.getProducts(id);

        model.addAttribute("recipe", recipe);
        model.addAttribute("ingredients", ingredients);
        model.addAttribute("steps", steps);
        model.addAttribute("products", products);
        return "recipe-detail";
    }

    // 메인 페이지에서 접근하는 recipe-detail 엔드포인트
    @GetMapping("/detail")
    public String recipeDetail(@RequestParam("id") Integer id, Model model) {
        Recipe recipe = recipeService.getRecipe(id);
        List<RecipeIngredient> ingredients = recipeService.getIngredients(id);
        List<RecipeStep> steps = recipeService.getSteps(id);
        List<RecipeXProduct> products = recipeService.getProducts(id);

        model.addAttribute("recipe", recipe);
        model.addAttribute("ingredients", ingredients);
        model.addAttribute("steps", steps);
        model.addAttribute("products", products);
        return "recipe-detail";
    }
}
