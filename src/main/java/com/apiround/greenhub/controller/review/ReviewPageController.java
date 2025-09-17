package com.apiround.greenhub.controller.review;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class ReviewPageController {

    /** 상품 상세에서 “리뷰보기” → 이 뷰로 이동 (예: /products/123/reviews) */
    @GetMapping("/products/{productId}/reviews")
    public String reviewList(@PathVariable Integer productId, Model model) {
        model.addAttribute("productId", productId);
        return "reviewlist"; // templates/reviewlist.html
    }
}
