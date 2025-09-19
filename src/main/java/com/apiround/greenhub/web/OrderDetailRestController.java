package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.OrderDetailDto;
import com.apiround.greenhub.web.service.OrderService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderDetailRestController {

    private final OrderService orderService;

    /** 주문 상세 (본인 것만) */
    @GetMapping("/my/{id}")
    public ResponseEntity<?> myOrderDetail(@PathVariable("id") String idOrNumber,
                                           HttpSession session) {
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
            ));
        }
        try {
            OrderDetailDto detail = orderService.findMyOrderDetail(idOrNumber, userId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "order", detail
            ));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
