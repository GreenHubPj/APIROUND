// src/main/java/com/apiround/greenhub/repository/item/ProductPriceOptionRepository.java
package com.apiround.greenhub.repository.item;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.apiround.greenhub.entity.item.ProductPriceOption;

public interface ProductPriceOptionRepository extends JpaRepository<ProductPriceOption, Integer> {

    // 특정 상품의 모든 옵션 삭제
    void deleteByProductId(Integer productId);

    // 특정 상품의 옵션 전체 조회 (sortOrder → optionId 순으로 정렬)
    List<ProductPriceOption> findByProductIdOrderBySortOrderAscOptionIdAsc(Integer productId);

    // 활성화된 옵션 중 최소 가격
    @Query("SELECT MIN(o.price) FROM ProductPriceOption o WHERE o.productId = :productId AND o.isActive = true")
    Integer findMinActivePriceByProductId(Integer productId);

    // sortOrder가 있는 경우 → 가장 앞선 옵션 1개 조회
    Optional<ProductPriceOption> findFirstByProductIdAndIsActiveTrueOrderBySortOrderAscOptionIdAsc(Integer productId);

    // sortOrder가 없는 경우 대비 → optionId 기준으로만 정렬
    Optional<ProductPriceOption> findFirstByProductIdAndIsActiveTrueOrderByOptionIdAsc(Integer productId);

    // 가장 싼 옵션 하나(price 오름차순, tie → optionId)
    @Query("SELECT o FROM ProductPriceOption o " +
            "WHERE o.productId = :productId AND o.isActive = true " +
            "ORDER BY o.price ASC, o.optionId ASC")
    Optional<ProductPriceOption> findFirstByProductIdAndIsActiveTrueOrderByPriceAscOptionIdAsc(Integer productId);

    // JPQL 명시적 버전: sortOrder NULL → 큰 값 처리, 그 다음 optionId
    @Query("""
        SELECT o
        FROM ProductPriceOption o
        WHERE o.productId = :productId AND o.isActive = true
        ORDER BY 
          CASE WHEN o.sortOrder IS NULL THEN 999999 ELSE o.sortOrder END ASC,
          o.optionId ASC
        """)
    Optional<ProductPriceOption> pickFirstActiveOption(Integer productId);
}
