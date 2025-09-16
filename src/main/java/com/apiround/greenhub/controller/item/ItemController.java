// src/main/java/com/apiround/greenhub/controller/item/ItemController.java
package com.apiround.greenhub.controller.item;

import com.apiround.greenhub.service.item.ItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ItemController {

    private final ItemService itemService;

    // 목록 + 페이지 렌더
    @GetMapping("/item-management")
    public String page(Model model) {
        var summaries = itemService.listAll(); // 상품 + 최저가

        // Java 8+ 호환 리스트 변환
        List<com.apiround.greenhub.entity.item.SpecialtyProduct> productList =
                summaries.stream()
                        .map(ItemService.ProductSummary::product)
                        .collect(Collectors.toList());

        // ❗ NPE 방지: null 키/값은 넣지 않음 (옵션 미등록 상품의 minPrice가 null일 수 있음)
        Map<Integer, Integer> minPriceMap = new HashMap<>();
        for (var s : summaries) {
            Integer pid = s.product().getProductId();
            Integer min = s.minPrice();
            if (pid != null && min != null) {
                minPriceMap.put(pid, min);
            }
        }

        model.addAttribute("products", productList);
        model.addAttribute("minPriceMap", minPriceMap);
        return "item-management";
    }

    // 등록/수정
    @PostMapping("/item-management")
    public String save(
            @RequestParam(required = false) Integer productId,
            @RequestParam String productName,
            @RequestParam String productType,
            @RequestParam String regionText,
            @RequestParam String description,
            @RequestParam(required = false) String thumbnailUrl,
            @RequestParam(required = false) String externalRef,
            @RequestParam(name = "months", required = false) List<Integer> months,

            @RequestParam(name = "optionLabel", required = false) List<String> optionLabels,
            @RequestParam(name = "quantity",    required = false) List<BigDecimal> quantities,
            @RequestParam(name = "unit",        required = false) List<String> units,
            @RequestParam(name = "price",       required = false) List<Integer> prices,

            RedirectAttributes ra
    ) {
        try {
            // null-safe
            months       = months       == null ? Collections.emptyList() : months;
            optionLabels = optionLabels == null ? Collections.emptyList() : optionLabels;
            quantities   = quantities   == null ? Collections.emptyList() : quantities;
            units        = units        == null ? Collections.emptyList() : units;
            prices       = prices       == null ? Collections.emptyList() : prices;

            Integer savedId = itemService.saveProductWithOptions(
                    productId,
                    productName, productType, regionText, description,
                    thumbnailUrl, externalRef,
                    months, optionLabels, quantities, units, prices
            );

            ra.addFlashAttribute("msg", "상품이 저장되었습니다.");
            return "redirect:/item-management#id=" + savedId;

        } catch (Exception e) {
            log.error("상품 저장 중 오류", e);
            ra.addFlashAttribute("error", "저장 실패: " + e.getMessage());
            return "redirect:/item-management";
        }
    }

    // 단건 조회 (수정 모달/폼 채움)
    @GetMapping("/api/products/{id}")
    @ResponseBody
    public Map<String, Object> getOne(@PathVariable Integer id) {
        var detail = itemService.getProductWithOptions(id);
        return Map.of(
                "product", detail.product(),
                "options", detail.options()
        );
    }

    // 삭제
    @DeleteMapping("/api/products/{id}")
    @ResponseBody
    public Map<String, Object> delete(@PathVariable Integer id) {
        itemService.deleteProduct(id);
        return Map.of("ok", true);
    }
}