package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recipes")
public class RecipeImageController {

    private final RecipeRepository recipeRepository;

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<byte[]> getRecipeThumbnail(@PathVariable Integer id) {
        var recipeOpt = recipeRepository.findById(id);
        if (recipeOpt.isEmpty()) return ResponseEntity.notFound().build();

        var recipe = recipeOpt.get();

        if (recipe.getThumbnailData() != null && recipe.getThumbnailData().length > 0) {
            String mime = (recipe.getThumbnailMime() == null || recipe.getThumbnailMime().isBlank())
                    ? "image/jpeg" : recipe.getThumbnailMime();
            return ResponseEntity.ok()
                    .header("Content-Type", mime)
                    .header("Cache-Control", "public, max-age=86400")
                    .body(recipe.getThumbnailData());
        }

        return ResponseEntity.notFound().build();
    }
}
