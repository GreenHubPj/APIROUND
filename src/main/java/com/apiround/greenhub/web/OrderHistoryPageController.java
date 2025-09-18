// src/main/java/com/apiround/greenhub/web/OrderHistoryPageController.java
package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.OrderSummaryDto;
import com.apiround.greenhub.web.service.OrderService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class OrderHistoryPageController {

    private final OrderService orderService;

    @GetMapping("/orderhistory")
    public String page(HttpSession session, Model model) {
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (userId == null) {
            return "redirect:/login?redirectURL=/orderhistory";
        }

        List<OrderSummaryDto> orders = orderService.findMyOrders(userId);

        // 템플릿 호환성을 위해 여러 키로 넣어줍니다.
        model.addAttribute("orders", orders);
        model.addAttribute("orderList", orders);
        model.addAttribute("orderSummaryList", orders);
        model.addAttribute("count", orders.size());

        log.info("[/orderhistory] userId={}, orders={}", userId, orders.size());
        return "orderhistory"; // templates/orderhistory.html
    }
}
