// src/main/java/com/apiround/greenhub/web/OrderHistoryRestController.java
package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.OrderSummaryDto;
import com.apiround.greenhub.web.service.OrderService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderHistoryRestController {

    private final OrderService orderService;

    /** 현재 로그인 사용자의 주문 목록(JSON) */
    @GetMapping("/my") // ❗ 딱 하나만!
    public ResponseEntity<?> myOrders(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "LOGIN_REQUIRED"));
        }
        List<OrderSummaryDto> orders = orderService.findMyOrders(userId);
        return ResponseEntity.ok(Map.of("success", true, "orders", orders, "count", orders.size()));
    }
}
