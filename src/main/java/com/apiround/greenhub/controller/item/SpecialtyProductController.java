package com.apiround.greenhub.controller.item;

import java.util.List;

import com.apiround.greenhub.dto.RegionDetailDto;
import com.apiround.greenhub.service.item.ItemService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.service.item.RegionService;

@Controller
public class SpecialtyProductController {

    private final RegionService regionService;
    private final ItemService itemService; // ← 서비스 빈 주입 (생성자 주입)


    public SpecialtyProductController(RegionService regionService, ItemService itemService) {
        this.regionService = regionService;
        this.itemService = itemService;
    }

    @GetMapping("/region")
    public String listSpecialties(Model model, 
                                 @RequestParam(required = false) String type,
                                 @RequestParam(required = false) String region) {
        List<Region> products;
        
        if (type != null && !type.isEmpty()) {
            products = regionService.getProductsByTypeOrderByProductIdDesc(type);
        } else if (region != null && !region.isEmpty()) {
            // 지역 코드로 검색 (예: chungnam -> 충남, 충청남도 등)
            products = regionService.getProductsByRegionCode(region);
        } else {
            products = regionService.getAllProductsOrderByProductIdDesc();
        }
        
        model.addAttribute("products", products);
        model.addAttribute("selectedRegion", region);
        return "region";
    }

    @GetMapping("/region-detail")
    public String regionDetail(@RequestParam("id") Integer id, Model model) {
        RegionDetailDto dto = itemService.getProductDetail(id);
        model.addAttribute("product", dto.getRegion());   // Region
        model.addAttribute("options", dto.getOptions());  // List<ProductPriceOption>

        // 같은 지역 랜덤 관련 상품 (현재 상품 제외)
        String regionText = dto.getRegion() != null ? dto.getRegion().getRegionText() : null;
        List<Region> related = regionService.getRandomRelatedByRegion(regionText, id, 4); // 4개 추천
        model.addAttribute("relatedProducts", related);

        return "region-detail";
    }

}
