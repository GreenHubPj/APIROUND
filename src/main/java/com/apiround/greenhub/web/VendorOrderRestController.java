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

    /** 벤더별 주문 요약 목록 */
    @GetMapping("/my")
    public ResponseEntity<?> myOrders(HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "판매사 로그인 필요"
            ));
        }
        List<VendorOrderSummaryDto> list = vendorOrderService.findMyOrders(companyId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "orders", list
        ));
    }

    /** 벤더 관점 주문 상세 */
    @GetMapping("/my/{id}")
    public ResponseEntity<?> myOrderDetail(@PathVariable("id") String idOrNumber,
                                           HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "판매사 로그인 필요"
            ));
        }
        VendorOrderDetailDto detail = vendorOrderService.findMyOrderDetail(idOrNumber, companyId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "order", detail
        ));
    }
}
