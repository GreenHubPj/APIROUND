// src/main/java/com/apiround/greenhub/web/VendorOrderRestController.java
package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.vendor.VendorOrderDetailDto;
import com.apiround.greenhub.web.dto.vendor.VendorOrderSummaryDto;
import com.apiround.greenhub.web.service.VendorOrderService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/vendor/orders")
public class VendorOrderRestController {

    private final VendorOrderService vendorOrderService;

    /**
     * 현재 로그인한 업체 기준의 주문 요약 목록
     */
    @GetMapping("/my")
    public ResponseEntity<?> myOrders(HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "판매사 로그인이 필요합니다.",
                    "redirectUrl", "/login?redirectURL=/seller/delivery"
            ));
        }
        List<VendorOrderSummaryDto> list = vendorOrderService.findMyOrders(companyId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "orders", list
        ));
    }

    /**
     * 특정 주문(번호/PK)에 대한 벤더 관점 상세
     */
    @GetMapping("/my/{id}")
    public ResponseEntity<?> myOrderDetail(@PathVariable("id") String idOrNumber,
                                           HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "판매사 로그인이 필요합니다.",
                    "redirectUrl", "/login?redirectURL=/seller/delivery"
            ));
        }
        VendorOrderDetailDto detail = vendorOrderService.findMyOrderDetail(idOrNumber, companyId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "order", detail
        ));
    }
}
