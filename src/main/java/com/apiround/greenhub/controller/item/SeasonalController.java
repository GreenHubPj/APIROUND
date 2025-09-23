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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Model model) {

        System.out.println("=== SeasonalController.monthly ===");
        System.out.println("요청된 월: " + month);
        System.out.println("페이지: " + page + ", 크기: " + size);

        int currentMonth = (month != null) ? month : java.time.LocalDate.now().getMonthValue();
        
        // 모든 데이터 조회
        List<Region> allRegions = seasonalService.getMonthlySpecialties(currentMonth);
        
        // 서버 사이드 페이징 적용
        long totalElements = allRegions.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, allRegions.size());
        
        List<Region> regions;
        if (startIndex < allRegions.size()) {
            regions = allRegions.subList(startIndex, endIndex);
        } else {
            regions = new java.util.ArrayList<>();
        }


        model.addAttribute("month", currentMonth);
        model.addAttribute("regions", regions);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalElements", totalElements);
        model.addAttribute("pageSize", size);

        return "seasonal"; // → templates/seasonal.html
    }
}