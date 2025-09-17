package com.apiround.greenhub.controller.item;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.service.item.RegionService;

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
            products = safeList(regionService.getProductsByTypeOrderByProductIdDesc(type));
        } else if (region != null && !region.isEmpty()) {
            products = safeList(regionService.getProductsByRegionCode(region));
        } else {
            // ACTIVE 상태인 상품만 조회
            products = safeList(regionService.getActiveProductsOrderByProductIdDesc());
        }

        // 디버깅을 위한 로그 추가
        System.out.println("Region 페이지 상품 수: " + products.size());
        for (Region product : products) {
            System.out.println("상품 ID: " + product.getProductId() + ", 상품명: " + product.getProductName());
        }

        model.addAttribute("products", products);
        model.addAttribute("selectedRegion", region);
        return "region";
    }

    @GetMapping("/region-detail")
    public String productDetail(@RequestParam Integer id,
                                @RequestParam(required = false) String region,
                                Model model) {
        Region product = regionService.getProductById(id);
        if (product == null) {
            // 존재하지 않는 상품인 경우 region 페이지로 리다이렉트
            return "redirect:/region";
        }
        
        // 상품 상태 확인 (ProductListing과 조인하여 상태 정보 가져오기)
        String productStatus = regionService.getProductStatusById(id);
        model.addAttribute("product", product);
        model.addAttribute("productStatus", productStatus);
        
        // 가격 옵션 정보 추가
        System.out.println("상품 ID: " + id + ", 가격 옵션 수: " + (product.getPriceOptions() != null ? product.getPriceOptions().size() : 0));
        if (product.getPriceOptions() != null && !product.getPriceOptions().isEmpty()) {
            model.addAttribute("options", product.getPriceOptions());
            System.out.println("가격 옵션 설정됨");
        } else {
            model.addAttribute("options", null);
            System.out.println("가격 옵션이 없음");
        }

        // 기준 지역(파라미터가 없으면 상품의 regionText)
        String regionKey = (region != null && !region.isBlank())
                ? region
                : product.getRegionText();

        String normalized = normalizeRegion(regionKey);

        // 전체 목록 널-안전 확보
        List<Region> all = safeList(regionService.getAllProductsOrderByProductIdDesc());

        // 같은 지역 + 자기 자신 제외
        List<Region> candidates = all.stream()
                .filter(r -> r != null && r.getProductId() != null && !r.getProductId().equals(id))
                .filter(r -> {
                    String rt = r.getRegionText();
                    // normalized가 null이면 어떤 것도 매칭 안 됨(관련상품 없음 처리)
                    return rt != null && normalized != null && rt.equalsIgnoreCase(normalized);
                })
                .collect(Collectors.toList());

        Collections.shuffle(candidates);
        List<Region> related = candidates.stream().limit(8).collect(Collectors.toList());
        model.addAttribute("relatedProducts", related);

        return "region-detail";
    }

    /** 리스트가 null이어도 빈 리스트로 보장 */
    private <T> List<T> safeList(List<T> src) {
        return (src == null) ? Collections.emptyList() : src;
    }

    /** region 파라미터가 영문 코드로 올 때 한글 지역명으로 맞춰줌(없으면 원본/널 그대로) */
    private String normalizeRegion(String raw) {
        if (raw == null) return null;
        String key = raw.trim();
        if (key.isEmpty()) return null;

        // 이미 한글이면 그대로
        boolean hasHangul = key.codePoints().anyMatch(cp -> {
            Character.UnicodeBlock b = Character.UnicodeBlock.of(cp);
            return b == Character.UnicodeBlock.HANGUL_SYLLABLES
                    || b == Character.UnicodeBlock.HANGUL_JAMO
                    || b == Character.UnicodeBlock.HANGUL_COMPATIBILITY_JAMO;
        });
        if (hasHangul) return key;

        Map<String, String> map = new HashMap<>();
        map.put("seoul", "서울");
        map.put("gyeonggi", "경기");
        map.put("incheon", "인천");
        map.put("busan", "부산");
        map.put("daegu", "대구");
        map.put("ulsan", "울산");
        map.put("gwangju", "광주");
        map.put("daejeon", "대전");
        map.put("gangwon", "강원");
        map.put("chungnam", "충남");
        map.put("chungbuk", "충북");
        map.put("jeonnam", "전남");
        map.put("jeonbuk", "전북");
        map.put("gyeongnam", "경남");
        map.put("gyeongbuk", "경북");
        map.put("jeju", "제주");

        return map.getOrDefault(key.toLowerCase(), key);
    }
}
