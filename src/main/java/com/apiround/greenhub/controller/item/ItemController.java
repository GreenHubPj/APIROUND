package com.apiround.greenhub.controller.item;

import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.service.item.ItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Collections;
import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ItemController {

    private final ItemService itemService;

    @GetMapping("/item-management")
    public String showForm(Model model) {
        model.addAttribute("region", new Region());
        return "item-management";
    }

    @PostMapping("/item-management")
    public String create(
            @ModelAttribute Region region,
            @RequestParam(name = "optionLabel", required = false) List<String> optionLabel,
            @RequestParam(name = "quantity", required = false)    List<Integer> quantity,
            @RequestParam(name = "unit", required = false)        List<String> unit,
            @RequestParam(name = "price", required = false)       List<Integer> price,
            @RequestParam(name = "months", required = false)      List<Integer> months,
            RedirectAttributes ra
    ) {
        try {
            // null-safe
            optionLabel = optionLabel == null ? Collections.emptyList() : optionLabel;
            quantity    = quantity    == null ? Collections.emptyList() : quantity;
            unit        = unit        == null ? Collections.emptyList() : unit;
            price       = price       == null ? Collections.emptyList() : price;
            months      = months      == null ? Collections.emptyList() : months;

            Integer productId = itemService.saveProductWithOptions(region, optionLabel, quantity, unit, price, months);
            ra.addFlashAttribute("msg", "상품이 저장되었습니다.");
            return "redirect:/region-detail?id=" + productId;

        } catch (Exception e) {
            log.error("상품 저장 중 오류", e); // 콘솔에 실제 원인 출력
            ra.addFlashAttribute("error", "저장 실패: " + e.getMessage());
            return "redirect:/item-management";
        }
    }
}
