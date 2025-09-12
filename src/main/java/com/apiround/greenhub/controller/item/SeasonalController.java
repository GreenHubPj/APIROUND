package com.apiround.greenhub.controller.item;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.service.item.SeasonalService;

@Controller
public class SeasonalController {

    private final SeasonalService seasonalService;

    public SeasonalController(SeasonalService seasonalService) {
        this.seasonalService = seasonalService;
    }

    @GetMapping("/specialties/monthly")
    public String monthly(
            @RequestParam(required = false) Integer month,
            Model model) {

        System.out.println("=== SeasonalController.monthly ===");
        System.out.println("요청된 월: " + month);
        
        List<Region> regions = seasonalService.getMonthlySpecialties(month);
        
        int currentMonth = (month != null) ? month : java.time.LocalDate.now().getMonthValue();
        System.out.println("현재 월: " + currentMonth);
        System.out.println("전달할 상품 수: " + regions.size());

        model.addAttribute("month", currentMonth);
        model.addAttribute("regions", regions);

        return "seasonal"; // → templates/seasonal.html
    }
}

