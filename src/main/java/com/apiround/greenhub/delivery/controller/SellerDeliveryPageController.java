package com.apiround.greenhub.delivery.controller;

import com.apiround.greenhub.entity.Company;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SellerDeliveryPageController {

    @GetMapping("/seller/delivery")
    public String sellerDelivery(HttpSession session, Model model) {
        Company company = (Company) session.getAttribute("company");
        if (company == null) {
            return "redirect:/login?redirectURL=/seller/delivery";
        }
        model.addAttribute("currentCompany", company);
        model.addAttribute("loginCompanyId", session.getAttribute("loginCompanyId"));
        // ★ 템플릿이 templates/sellerDelivery.html (루트) 이므로 뷰 이름만 "sellerDelivery"
        return "sellerDelivery";
    }
}
