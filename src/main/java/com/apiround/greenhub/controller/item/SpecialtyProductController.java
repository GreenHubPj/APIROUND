package com.apiround.greenhub.controller.item;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
            // 타입별 필터링된 UNION 조회
            products = safeList(regionService.getCombinedProductsByTypeWithUnion(type));
        } else if (region != null && !region.isEmpty()) {
            // 지역별 필터링된 UNION 조회
            products = safeList(regionService.getCombinedProductsByRegionWithUnion(region));
        } else {
            // 전체 UNION 조회
            products = safeList(regionService.getCombinedProductsWithUnion());
        }

        model.addAttribute("products", products);
        model.addAttribute("selectedRegion", region);
        return "region";
    }

    @GetMapping("/region-detail")
    public String productDetail(@RequestParam Integer id,
                                @RequestParam(required = false) String region,
                                Model model) {
        // UNION 쿼리로 product_listing과 specialty_product에서 상품 조회
        Region product = regionService.getCombinedProductByIdWithUnion(id);
        if (product == null) {
            // 존재하지 않는 상품인 경우 region 페이지로 리다이렉트
            return "redirect:/region";
        }
        
        // 상품 상태는 이미 UNION 쿼리에서 가져옴
        model.addAttribute("product", product);
        model.addAttribute("productStatus", product.getStatus());
        
        // 가격 옵션 정보 추가
        // product_listing에서 온 상품은 가격 옵션이 있고, specialty_product에서 온 상품은 null
        model.addAttribute("options", product.getPriceOptions());

        // 기준 지역(파라미터가 없으면 상품의 regionText)
        String regionKey = (region != null && !region.isBlank())
                ? region
                : product.getRegionText();

        String normalized = normalizeRegion(regionKey);

        // 관련 상품도 UNION 쿼리로 조회
        List<Region> all = safeList(regionService.getCombinedProductsWithUnion());

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
        List<Region> related = candidates.stream().limit(4).collect(Collectors.toList());
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

    // 상품 가격 정보 조회 API (region 페이지용)
    @GetMapping("/api/product-prices/{productId}")
    public ResponseEntity<List<Map<String, Object>>> getProductPrices(@PathVariable Integer productId) {
        try {
            // 상품 가격 정보 조회
            
            // 상품 기본 정보 조회
            Region product = regionService.getCombinedProductByIdWithUnion(productId);
            if (product == null) {
                // 상품을 찾을 수 없음
                return ResponseEntity.notFound().build();
            }
            
            // 가격 옵션 조회
            List<com.apiround.greenhub.entity.item.ProductPriceOption> priceOptions = product.getPriceOptions();
            // 가격 옵션 조회 완료
            
            List<Map<String, Object>> result = new ArrayList<>();
            
            if (priceOptions != null && !priceOptions.isEmpty()) {
                for (com.apiround.greenhub.entity.item.ProductPriceOption option : priceOptions) {
                    Map<String, Object> priceInfo = new HashMap<>();
                    priceInfo.put("optionId", option.getOptionId());
                    priceInfo.put("quantity", option.getQuantity());
                    priceInfo.put("unit", option.getUnit());
                    priceInfo.put("price", option.getPrice());
                    priceInfo.put("isActive", option.getIsActive());
                    result.add(priceInfo);
                    
                    // 가격 옵션 처리
                }
            } else {
                // 가격 옵션이 없음
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("상품 가격 조회 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // 관련 상품 API 엔드포인트
    @GetMapping("/api/related-products")
    public ResponseEntity<List<Region>> getRelatedProducts(@RequestParam Integer productId,
                                                           @RequestParam(required = false) String region) {
        try {
            Region currentProduct = regionService.getCombinedProductByIdWithUnion(productId);
            
            if (currentProduct == null) {
                return ResponseEntity.notFound().build();
            }

            String regionKey = (region != null && !region.isBlank())
                    ? region
                    : currentProduct.getRegionText();

            String normalized = normalizeRegion(regionKey);
            
            if (normalized == null) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<Region> related = regionService.getRandomRelatedByRegion(normalized, productId, 4);
            
            return ResponseEntity.ok(related);
            
        } catch (Exception e) {
            System.err.println("관련 상품 조회 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // 썸네일 이미지 API 엔드포인트
    @GetMapping("/api/products/{id}/thumbnail")
    public ResponseEntity<byte[]> getProductThumbnail(@PathVariable Integer id) {
        try {
            // 상품 정보 조회
            Region product = regionService.getCombinedProductByIdWithUnion(id);
            if (product == null) {
                return ResponseEntity.notFound().build();
            }

            // 1. ProductListing에서 thumbnail_data가 있는지 확인
            if (product.getThumbnailData() != null && product.getThumbnailData().length > 0) {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType(
                    product.getThumbnailMime() != null ? product.getThumbnailMime() : "image/jpeg"
                ));
                headers.setContentLength(product.getThumbnailData().length);
                return new ResponseEntity<>(product.getThumbnailData(), headers, HttpStatus.OK);
            }

            // 2. SpecialtyProduct에서 thumbnail_url이 있는지 확인
            if (product.getThumbnailUrl() != null && !product.getThumbnailUrl().trim().isEmpty() 
                && !product.getThumbnailUrl().equals("null") && !product.getThumbnailUrl().equals("#")) {
                
                // URL이 data:로 시작하는지 확인 (base64 인코딩된 이미지)
                if (product.getThumbnailUrl().startsWith("data:")) {
                    try {
                        // data:image/jpeg;base64, 부분 제거하고 base64 디코딩
                        String base64Data = product.getThumbnailUrl().substring(product.getThumbnailUrl().indexOf(",") + 1);
                        byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);
                        
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.parseMediaType(
                            product.getThumbnailUrl().substring(5, product.getThumbnailUrl().indexOf(";"))
                        ));
                        headers.setContentLength(imageBytes.length);
                        return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
                    } catch (Exception e) {
                        System.err.println("Base64 디코딩 오류: " + e.getMessage());
                    }
                } else {
                    // 일반 URL인 경우 - 리다이렉트로 처리
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .header("Location", product.getThumbnailUrl())
                            .build();
                }
            }

            // 3. 기본 이미지 반환 (이미지가 없는 경우)
            return ResponseEntity.notFound().build();

        } catch (Exception e) {
            System.err.println("썸네일 조회 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
