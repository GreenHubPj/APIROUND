// src/main/java/com/apiround/greenhub/service/item/ItemService.java
package com.apiround.greenhub.service.item;

import java.math.BigDecimal;
import java.util.List;

public interface ItemService {

    /**
     * 상품 + 가격옵션 저장 (신규/수정 겸용)
     * @return 저장된 product_id
     */
    Integer saveProductWithOptions(
            Integer productId,           // null이면 신규
            String productName,
            String productType,
            String regionText,
            String description,
            String thumbnailUrl,
            String externalRef,
            List<Integer> months,        // 1..12
            List<String> optionLabels,
            List<BigDecimal> quantities, // DECIMAL(10,2)
            List<String> units,
            List<Integer> prices
    );

    /**
     * 단건 조회(상품 + 옵션)
     */
    ProductDetail getProductWithOptions(Integer productId);

    /**
     * 상품 삭제 (옵션 포함)
     */
    void deleteProduct(Integer productId);

    /**
     * 목록 조회
     */
    List<ProductSummary> listAll();

    // DTO (내부용 단순 carrier)
    record ProductDetail(
            com.apiround.greenhub.entity.item.SpecialtyProduct product,
            java.util.List<com.apiround.greenhub.entity.item.ProductPriceOption> options
    ) {}
    record ProductSummary(
            com.apiround.greenhub.entity.item.SpecialtyProduct product,
            Integer minPrice
    ) {}
}
