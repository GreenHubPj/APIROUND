package com.apiround.greenhub.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * 구매하기 페이지 전용 컨트롤러
 * - region-detail.js 의 buyNow()가 /buying 으로 이동
 * - (선택) /orders/buy-now 응답의 orderId가 쿼리로 올 수도 있어 모델에 내려줌
 */
@Controller
public class BuyingController {

    @GetMapping("/buying")
    public String buyingPage(@RequestParam(value = "orderId", required = false) String orderId,
                             Model model) {
        if (orderId != null && !orderId.isBlank()) {
            model.addAttribute("orderId", orderId);
        }
        return "buying"; // resources/templates/buying.html
    }
}
