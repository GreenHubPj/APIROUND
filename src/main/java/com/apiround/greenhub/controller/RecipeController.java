package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/recipe")
public class RecipeController {

    private final RecipeRepository recipeRepository;

    // 목록: GET /recipe
    @GetMapping
    public String list(Model model) {
        List<Recipe> recipes = recipeRepository.findAll(); // 필요시 상태 필터링
        model.addAttribute("recipes", recipes);
        return "recipe"; // templates/recipe.html
    }

    // 상세: GET /recipe/{id}
    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피가 없습니다. id=" + id));
        model.addAttribute("recipe", recipe);
        return "recipe-detail"; // templates/recipe-detail.html
    }
}
