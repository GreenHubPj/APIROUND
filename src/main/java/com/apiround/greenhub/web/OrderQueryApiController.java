package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.OrderSummaryDto;
import com.apiround.greenhub.web.service.OrderService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class OrderQueryApiController {

    private final OrderService orderService;

    /**
     * 로그인한 사용자 본인의 주문 목록 반환
     * 프론트(JS)가 기대하는 스키마: { success, orders: [ {id, date, status, totalAmount, shippingFee, finalAmount, items:[...] } ] }
     */
    @GetMapping("/api/orders/my")
    public ResponseEntity<?> myOrders(HttpSession session) {
        // 세션에서 정수형 사용자 ID만 사용 (엔티티 import 불필요)
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
            ));
        }

        List<OrderSummaryDto> orders = orderService.findMyOrders(userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "orders", orders
        ));
    }
}
