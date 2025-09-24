package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.service.MyReviewService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/reviews")
public class ReviewWritePageController {

    private final MyReviewService myReviewService;

    @GetMapping("/write")
    public String reviewWrite(@RequestParam(required = false) Integer orderItemId,
                              @RequestParam(required = false) Integer productId,
                              HttpSession session,
                              Model model) {

        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) {
            model.addAttribute("errorMessage", "로그인이 필요합니다.");
            return "review/review_write"; // 템플릿 경로와 일치
        }

        var vm = myReviewService.buildWriteViewModel(userId, orderItemId, productId);
        if (!vm.isAllowed()) {
            model.addAttribute("errorMessage", vm.message());
            return "review/review_write";
        }

        model.addAttribute("orderItemId", vm.orderItemId());
        model.addAttribute("productId", vm.productId());
        model.addAttribute("productName", vm.productName());
        model.addAttribute("productImage", vm.productImage());
        model.addAttribute("storeName", vm.storeName());
        model.addAttribute("priceText", vm.priceText());
        model.addAttribute("deliveredAt", vm.deliveredAt());
        return "review/review_write";
    }
}
