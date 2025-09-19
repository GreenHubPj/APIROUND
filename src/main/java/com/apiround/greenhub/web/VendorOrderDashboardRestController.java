// src/main/java/com/apiround/greenhub/web/VendorOrderDashboardRestController.java
package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.VendorOrderDashboardDto;
import com.apiround.greenhub.web.service.VendorOrderService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/vendor/orders")
public class VendorOrderDashboardRestController {

    private final VendorOrderService vendorOrderService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(
            @RequestParam(value = "start", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            HttpSession session
    ) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "판매사 로그인 필요"));
        }
        VendorOrderDashboardDto dto = vendorOrderService.loadDashboard(companyId, start, end);
        return ResponseEntity.ok(Map.of("success", true, "dashboard", dto));
    }
}
