// src/main/java/com/apiround/greenhub/service/item/ItemServiceImpl.java
package com.apiround.greenhub.service.item;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
        // 1) 상품 저장/수정
        SpecialtyProduct p = (productId != null)
                ? productRepo.findById(productId).orElseGet(SpecialtyProduct::new)
                : new SpecialtyProduct();

        p.setProductName(productName);
        p.setProductType(productType);
        p.setRegionText(regionText);
        p.setDescription(description);
        p.setThumbnailUrl(thumbnailUrl);
        p.setExternalRef(externalRef);
        String harvestSeason = joinMonths(months);
        if (harvestSeason == null || harvestSeason.isEmpty()) {
            harvestSeason = "1,2,3,4,5,6,7,8,9,10,11,12"; // 기본값: 연중
        }
        p.setHarvestSeason(harvestSeason);
        // NOTE: specialty_product 테이블에 created_at / updated_at 컬럼이 없으므로 세팅하지 않음

        log.info("상품 저장 시작 - productName: {}", p.getProductName());
        SpecialtyProduct saved = productRepo.save(p);
        log.info("상품 저장 완료 - productId: {}", saved.getProductId());

        // 2) 옵션 갱신 (간단 전략: 일괄 삭제 후 재삽입)
        log.info("기존 옵션 삭제 시작 - productId: {}", saved.getProductId());
        optionRepo.deleteByProductId(saved.getProductId());
        log.info("기존 옵션 삭제 완료");

        if (quantities != null && units != null && prices != null) {
            int n = Math.min(quantities.size(), Math.min(units.size(), prices.size()));
            log.info("옵션 저장 시작 - 총 {} 개 옵션", n);
            for (int i = 0; i < n; i++) {
                var qty   = quantities.get(i);                 // BigDecimal (nullable)
                var unit  = (units.get(i) == null) ? null : units.get(i).trim();
                var price = prices.get(i);                     // Integer (nullable)

                // 서버측 보정/검증: 3개 모두 유효할 때만 저장
                if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
                    log.warn("옵션 {} 건너뜀 - 수량이 유효하지 않음: {}", i, qty);
                    continue;
                }
                if (unit == null || unit.isEmpty()) {
                    log.warn("옵션 {} 건너뜀 - 단위가 유효하지 않음: {}", i, unit);
                    continue;
                }
                if (price == null || price < 0) {
                    log.warn("옵션 {} 건너뜀 - 가격이 유효하지 않음: {}", i, price);
                    continue;
                }

                log.info("옵션 {} 저장 시작 - qty: {}, unit: {}, price: {}", i, qty, unit, price);
                ProductPriceOption opt = ProductPriceOption.builder()
                        .productId(saved.getProductId())
                        .optionLabel((optionLabels != null && i < optionLabels.size())
                                ? optionLabels.get(i) : null)
                        .quantity(qty)
                        .unit(unit)
                        .price(price)
                        .sortOrder(i)
                        .isActive(Boolean.TRUE)  // 명시적으로 Boolean.TRUE 설정
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                ProductPriceOption savedOpt = optionRepo.save(opt);
                log.info("옵션 {} 저장 완료 - optionId: {}", i, savedOpt.getOptionId());
            }
        }

        return saved.getProductId();
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
        optionRepo.deleteByProductId(productId); // 안전하게 먼저 삭제
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