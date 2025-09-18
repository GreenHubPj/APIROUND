// src/main/java/com/apiround/greenhub/service/item/ItemServiceImpl.java
package com.apiround.greenhub.service.item;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.entity.item.SpecialtyProduct;
import com.apiround.greenhub.repository.item.ProductPriceOptionRepository;
import com.apiround.greenhub.repository.item.SpecialtyProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ItemServiceImpl implements ItemService {

    private final SpecialtyProductRepository productRepo;
    private final ProductPriceOptionRepository optionRepo;

    @Override
    public Integer saveProductWithOptions(
            Integer productId,
            String productName,
            String productType,
            String regionText,
            String description,
            String thumbnailUrl,
            String externalRef,
            List<Integer> months,
            List<String> optionLabels,
            List<BigDecimal> quantities,
            List<String> units,
            List<Integer> prices
    ) {
        log.info("ItemServiceImpl.saveProductWithOptions 시작 - productName: {}, productType: {}, regionText: {}",
                productName, productType, regionText);
        log.info("옵션 데이터 - optionLabels: {}, quantities: {}, units: {}, prices: {}",
                optionLabels, quantities, units, prices);

        // 1) 상품 엔티티 준비
        SpecialtyProduct p;
        boolean creating = (productId == null);
        if (creating) {
            // 같은 (상품명, 지역) 존재 시 그걸 사용 (유니크 충돌 방지)
            p = productRepo.findByProductNameAndRegionText(productName, regionText)
                    .orElseGet(SpecialtyProduct::new);
        } else {
            p = productRepo.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상품입니다. productId=" + productId));
        }

        p.setProductName(productName);
        p.setProductType(productType);
        p.setRegionText(regionText);
        p.setDescription(description);
        p.setThumbnailUrl(thumbnailUrl);
        p.setExternalRef(externalRef);

        String harvestSeason = joinMonths(months);
        if (harvestSeason == null || harvestSeason.isEmpty()) {
            harvestSeason = "1,2,3,4,5,6,7,8,9,10,11,12"; // 기본값(연중)
        }
        p.setHarvestSeason(harvestSeason);

        // 2) 저장 (중복 유니크 키 충돌 시 메시지 그대로 컨트롤러에서 처리)
        SpecialtyProduct saved;
        try {
            log.info("상품 저장 시작 - productName: {}", p.getProductName());
            saved = productRepo.save(p);
        } catch (DataIntegrityViolationException e) {
            log.error("상품 저장 중 유니크 충돌 (name={}, region={})", productName, regionText, e);
            throw e;
        }
        if (saved.getProductId() == null) throw new IllegalStateException("상품 저장 실패: productId가 null입니다.");
        log.info("상품 저장 완료 - productId: {}", saved.getProductId());

        // 3) 옵션 갱신
        upsertOptions(saved.getProductId(), optionLabels, quantities, units, prices, creating);

        return saved.getProductId();
    }

    private void upsertOptions(
            Integer productId,
            List<String> optionLabels,
            List<BigDecimal> quantities,
            List<String> units,
            List<Integer> prices,
            boolean creating
    ) {
        // null-가드
        optionLabels = (optionLabels != null) ? optionLabels : Collections.emptyList();
        quantities   = (quantities   != null) ? quantities   : Collections.emptyList();
        units        = (units        != null) ? units        : Collections.emptyList();
        prices       = (prices       != null) ? prices       : Collections.emptyList();

        // 수정 시 기존 옵션 비활성화
        if (!creating) {
            var existing = optionRepo.findByProductIdOrderBySortOrderAscOptionIdAsc(productId);
            for (var o : existing) {
                o.setIsActive(false);
                o.setUpdatedAt(LocalDateTime.now());
                optionRepo.save(o);
            }
            log.info("기존 옵션 비활성화 완료 - productId={}", productId);
        } else {
            log.info("상품 추가 모드 - 기존 옵션 비활성화 생략");
        }

        int n = Math.min(quantities.size(), Math.min(units.size(), prices.size()));
        log.info("옵션 저장 시작 - 총 {} 개 옵션", n);

        Set<String> duplicateGuard = new HashSet<>(); // (label, qty, unit) 중복 방지
        for (int i = 0; i < n; i++) {
            BigDecimal qty = quantities.get(i);
            String unit    = (units.get(i) == null) ? null : units.get(i).trim();
            Integer price  = prices.get(i);
            String label   = (i < optionLabels.size()) ? optionLabels.get(i) : null;

            if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) { log.warn("옵션 {} 건너뜀 - 수량 {}", i, qty); continue; }
            if (unit == null || unit.isEmpty()) { log.warn("옵션 {} 건너뜀 - 단위 {}", i, unit); continue; }
            if (price == null || price < 0) { log.warn("옵션 {} 건너뜀 - 가격 {}", i, price); continue; }

            String key = (label == null ? "null" : label) + "|" +
                    qty.stripTrailingZeros().toPlainString() + "|" +
                    unit;
            if (!duplicateGuard.add(key)) {
                log.warn("옵션 {} 건너뜀 - 동일 (label, qty, unit) 중복 {}", i, key);
                continue;
            }

            ProductPriceOption opt = ProductPriceOption.builder()
                    .productId(productId)
                    .optionLabel(label)
                    .quantity(qty)
                    .unit(unit)
                    .price(price)
                    .sortOrder(i)
                    .isActive(Boolean.TRUE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            try {
                optionRepo.save(opt);
                log.info("옵션 {} 저장 완료", i);
            } catch (DataIntegrityViolationException e) {
                // uq_product_option (productId, optionLabel, quantity, unit) 중복
                log.error("옵션 저장 중 유니크 충돌 - i={}, key={}", i, key, e);
                throw e;
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDetail getProductWithOptions(Integer productId) {
        SpecialtyProduct p = productRepo.findById(productId).orElseThrow();
        var options = optionRepo.findByProductIdOrderBySortOrderAscOptionIdAsc(productId);
        return new ProductDetail(p, options);
    }

    @Override
    public void deleteProduct(Integer productId) {
        optionRepo.deleteByProductId(productId); // 옵션 먼저 삭제
        productRepo.deleteById(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSummary> listAll() {
        List<SpecialtyProduct> products = productRepo.findAll();
        List<ProductSummary> result = new ArrayList<>(products.size());
        for (SpecialtyProduct p : products) {
            Integer min = optionRepo.findMinActivePriceByProductId(p.getProductId());
            result.add(new ProductSummary(p, min));
        }
        return result;
    }

    private String joinMonths(List<Integer> months) {
        if (months == null || months.isEmpty()) return null;
        List<Integer> sorted = new ArrayList<>(months);
        Collections.sort(sorted);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < sorted.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(sorted.get(i));
        }
        return sb.toString();
    }
}
