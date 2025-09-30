// src/main/java/com/apiround/greenhub/web/CompanyStatsRestController.java
package com.apiround.greenhub.web;

import com.apiround.greenhub.dto.CompanyStats;
import com.apiround.greenhub.service.CompanyStatsService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/seller/company")
public class CompanyStatsRestController {

    private final CompanyStatsService companyStatsService;

    @GetMapping("/stats")
    public ResponseEntity<?> stats(HttpSession session) {
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");
        if (companyId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "판매사 로그인이 필요합니다."
            ));
        }

        CompanyStats stats = companyStatsService.buildStatsForCompany(companyId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "stats", stats
        ));
    }
}
