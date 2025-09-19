// src/main/java/com/apiround/greenhub/web/SellerOrderRestController.java
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
@RequestMapping("/api/seller/orders") // ✅ 경로 분리: /api/vendor/orders → /api/seller/orders
public class SellerOrderRestController {

    private final VendorOrderService vendorOrderService;

    /** 판매사 본인의 주문 리스트 */
    @GetMapping("/my")
    public ResponseEntity<?> myOrders(HttpSession session) {
        // 세션 키는 환경에 맞게 변경 가능 (예: "sellerCompanyId", "loginCompanyId" 등)
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "판매사 로그인이 필요합니다."
            ));
        }

        List<VendorOrderSummaryDto> orders = vendorOrderService.findMyOrders(companyId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "orders", orders
        ));
    }

    /** 판매사 본인의 특정 주문 상세 */
    @GetMapping("/my/{id}")
    public ResponseEntity<?> myOrderDetail(@PathVariable("id") String idOrNumber,
                                           HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "판매사 로그인이 필요합니다."
            ));
        }

        VendorOrderDetailDto detail = vendorOrderService.findMyOrderDetail(idOrNumber, companyId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "order", detail
        ));
    }
}
