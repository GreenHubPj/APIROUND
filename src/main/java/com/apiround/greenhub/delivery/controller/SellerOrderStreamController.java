// src/main/java/com/apiround/greenhub/delivery/controller/SellerOrderStreamController.java
package com.apiround.greenhub.delivery.controller;

import com.apiround.greenhub.delivery.push.OrderStatusBroadcaster;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
public class SellerOrderStreamController {

    private final OrderStatusBroadcaster broadcaster;

    @GetMapping(value = "/api/seller/orders/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) throw new RuntimeException("판매사 로그인이 필요합니다.");
        return broadcaster.subscribe(companyId);
    }
}
