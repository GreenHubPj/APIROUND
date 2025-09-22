package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.CheckoutRequest;
import com.apiround.greenhub.web.dto.OrderCreatedResponse;
import com.apiround.greenhub.web.service.OrderService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
}
