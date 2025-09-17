package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.dto.CompanyStats;
import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.service.CompanyMypageService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CompanyMypageController {

    private final CompanyMypageService mypageService;

    public CompanyMypageController(CompanyMypageService mypageService) {
        this.mypageService = mypageService;
    }

    @GetMapping("/mypage-company")
    public String mypageCompany(HttpSession session, Model model) {
        Company comp = (Company) session.getAttribute("company");
        if (comp == null) {
            return "redirect:/company/login?redirectURL=/mypage-company";
        }

        String displayName  = mypageService.toDisplayName(comp.getCompanyName());
        String iconInitials = mypageService.toIconInitials(displayName);
        CompanyStats stats  = mypageService.getStats(comp);

        model.addAttribute("comp", comp);
        model.addAttribute("compDisplayName", displayName);
        model.addAttribute("compIcon", iconInitials);
        model.addAttribute("stats", stats);  // ✅ 실제 값 주입

        return "mypage_company";
    }
}