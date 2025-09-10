package com.apiround.greenhub.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.apiround.greenhub.entity.Region;
import com.apiround.greenhub.service.RegionService;

@Controller
public class SpecialtyProductController {

    private final RegionService regionService;

    public SpecialtyProductController(RegionService regionService) {
        this.regionService = regionService;
    }

    @GetMapping("/region")
    public String listSpecialties(Model model, 
                                 @RequestParam(required = false) String type,
                                 @RequestParam(required = false) String region) {
        List<Region> products;
        
        if (type != null && !type.isEmpty()) {
            products = regionService.getProductsByType(type);
        } else if (region != null && !region.isEmpty()) {
            // 지역 코드로 검색 (예: chungnam -> 충남, 충청남도 등)
            products = regionService.getProductsByRegionCode(region);
        } else {
            products = regionService.getAllProducts();
        }
        
        model.addAttribute("products", products);
        model.addAttribute("selectedRegion", region);
        return "region";
    }

    @GetMapping("/region-detail")
    public String productDetail(@RequestParam Integer id, Model model) {
        Region product = regionService.getProductById(id);
        if (product == null) {
            return "redirect:/region";
        }
        
        model.addAttribute("product", product);
        return "region-detail";
    }

}
