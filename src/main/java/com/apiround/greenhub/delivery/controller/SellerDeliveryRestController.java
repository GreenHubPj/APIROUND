package com.apiround.greenhub.delivery.controller;

import com.apiround.greenhub.delivery.dto.DeliverySummaryDto;
import com.apiround.greenhub.delivery.dto.DeliveryUpdateRequest;
import com.apiround.greenhub.delivery.service.DeliveryService;
import com.apiround.greenhub.delivery.service.DeliverySummaryService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/seller/delivery")
public class SellerDeliveryRestController {

    private final DeliveryService deliveryService;
    private final DeliverySummaryService deliverySummaryService; // ★ 추가

    /** 판매사 요약 카드 데이터 */
    @GetMapping("/summary")
    public ResponseEntity<?> summary(HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "판매사 로그인이 필요합니다."));
        }
        DeliverySummaryDto dto = deliverySummaryService.getSummaryForCompany(companyId);
        return ResponseEntity.ok(Map.of("success", true, "summary", dto));
    }

    /** 주문 아이템 배송 상태 변경 */
    @PatchMapping("/{orderItemId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer orderItemId,
                                          @RequestBody DeliveryUpdateRequest req,
                                          HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "판매사 로그인이 필요합니다."));
        }

        deliveryService.updateStatus(orderItemId, companyId, req.getNextStatus());
        return ResponseEntity.ok(Map.of("success", true));
    }
}
