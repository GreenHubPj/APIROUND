package com.apiround.greenhub.web;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apiround.greenhub.web.dto.CheckoutRequest;
import com.apiround.greenhub.web.dto.OrderCreatedResponse;
import com.apiround.greenhub.web.service.OrderService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/orders")
@Slf4j
public class OrderApiController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequest req, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (userId == null) {
            log.warn("[/orders/checkout] 401 LOGIN_REQUIRED");
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "LOGIN_REQUIRED"
            ));
        }
        try {
            log.info("[/orders/checkout] userId={}, items={}", userId,
                    (req.getItems() == null ? 0 : req.getItems().size()));
            OrderCreatedResponse created = orderService.createOrder(req, userId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "orderId", created.getOrderId(),
                    "redirect", created.getRedirectUrl()
            ));
        } catch (IllegalArgumentException e) {
            log.warn("[/orders/checkout] 400 {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("[/orders/checkout] 500", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "주문 생성 중 문제가 발생했습니다."
            ));
        }
    }

    @PutMapping("/{orderNumber}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String orderNumber, 
                                             @RequestBody Map<String, String> request) {
        String newStatus = request.get("status");
        
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "상태값이 필요합니다."
            ));
        }

        try {
            log.info("[/orders/{}/status] 상태 업데이트 요청: {}", orderNumber, newStatus);
            
            boolean success = orderService.updateOrderStatus(orderNumber, newStatus.toUpperCase());
            
            if (success) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "주문 상태가 업데이트되었습니다."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "주문 상태 업데이트에 실패했습니다."
                ));
            }
        } catch (Exception e) {
            log.error("[/orders/{}/status] 500", orderNumber, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "주문 상태 업데이트 중 문제가 발생했습니다."
            ));
        }
    }
}
