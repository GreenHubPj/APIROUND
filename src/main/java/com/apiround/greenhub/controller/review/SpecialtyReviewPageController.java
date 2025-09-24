package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.repository.ReviewLookupJdbc;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class SpecialtyReviewPageController {

    private final ReviewLookupJdbc reviewLookupJdbc;

    /** 예: /specialties/123/reviews */
    @GetMapping("/specialties/{specialtyId}/reviews")
    public String reviewListBySpecialty(@PathVariable Integer specialtyId, Model model) {
        var card = reviewLookupJdbc.loadSpecialtyCard(specialtyId);
        model.addAttribute("specialtyId", specialtyId);
        model.addAttribute("specialty", card.get("specialty"));
        return "reviewlist_specialty"; // templates/reviewlist_specialty.html
    }
}
