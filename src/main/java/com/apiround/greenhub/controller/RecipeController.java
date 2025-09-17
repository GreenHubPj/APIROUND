package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.RecipeIngredient;
import com.apiround.greenhub.entity.RecipeStep;
import com.apiround.greenhub.entity.RecipeXProduct;
import com.apiround.greenhub.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // 목록: PUBLISHED만
    @GetMapping
    public String list(Model model) {
        List<Recipe> recipes = recipeService.getRecipes();
        model.addAttribute("recipes", recipes);
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
