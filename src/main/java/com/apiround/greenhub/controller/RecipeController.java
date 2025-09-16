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
}