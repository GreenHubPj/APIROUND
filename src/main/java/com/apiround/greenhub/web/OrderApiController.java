package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.CheckoutRequest;
import com.apiround.greenhub.web.dto.OrderCreatedResponse;
import com.apiround.greenhub.web.service.OrderService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/orders")
public class OrderApiController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequest req, HttpSession session) {
        // 세션에서 로그인 사용자 식별
        Integer userId = (Integer) session.getAttribute("loginUserId");

        // 미로그인 → 401 반환
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "LOGIN_REQUIRED", "message", "로그인이 필요합니다."));
        }

        // 정상 처리
        OrderCreatedResponse res = orderService.createOrder(req, userId);
        // 프론트가 그대로 사용하도록 redirect 경로도 함께 리턴
        return ResponseEntity.ok(Map.of(
                "orderId", res.getOrderId(),
                "redirect", "/orderhistory"
        ));
    }
}
