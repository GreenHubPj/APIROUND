// src/main/java/com/apiround/greenhub/web/MypageCompanyController.java
package com.apiround.greenhub.web;

import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.dto.CompanyStats;
import com.apiround.greenhub.service.CompanyStatsService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class MypageCompanyController {

    private final CompanyStatsService companyStatsService;

    @GetMapping("/seller/mypage")
    public String mypageCompany(HttpSession session, Model model) {
        Company company = (Company) session.getAttribute("company");
        Integer companyId = (Integer) session.getAttribute("loginCompanyId");

        if (company == null || companyId == null) {
            return "redirect:/login?redirectURL=/seller/mypage";
        }

        CompanyStats stats = companyStatsService.buildStatsForCompany(companyId);

        model.addAttribute("comp", company);
        model.addAttribute("currentCompany", company);
        model.addAttribute("stats", stats);

        // src/main/resources/templates/mypage_company.html
        return "mypage_company";
    }
}
