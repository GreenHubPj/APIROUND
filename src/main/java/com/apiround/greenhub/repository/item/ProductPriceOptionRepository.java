// src/main/java/com/apiround/greenhub/repository/item/ProductPriceOptionRepository.java
package com.apiround.greenhub.repository.item;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.apiround.greenhub.entity.item.ProductPriceOption;

public interface ProductPriceOptionRepository extends JpaRepository<ProductPriceOption, Integer> {

    void deleteByProductId(Integer productId);

    List<ProductPriceOption> findByProductIdOrderBySortOrderAscOptionIdAsc(Integer productId);

    @Query("SELECT MIN(o.price) FROM ProductPriceOption o WHERE o.productId = :productId AND o.isActive = true")
    Integer findMinActivePriceByProductId(Integer productId);

    // ★ sortOrder 컬럼이 "엔티티에" 있을 때 사용
    Optional<ProductPriceOption>
    findFirstByProductIdAndIsActiveTrueOrderBySortOrderAscOptionIdAsc(Integer productId);

    // ★ sortOrder 컬럼이 없을 때를 위한 안전한 대체(옵션ID만으로 정렬)
    Optional<ProductPriceOption>
    findFirstByProductIdAndIsActiveTrueOrderByOptionIdAsc(Integer productId);

    // ★ 가장 싼 옵션 하나 (price 오름차순)
    @Query("SELECT o FROM ProductPriceOption o WHERE o.productId = :productId AND o.isActive = true ORDER BY o.price ASC, o.optionId ASC")
    Optional<ProductPriceOption> findFirstByProductIdAndIsActiveTrueOrderByPriceAscOptionIdAsc(Integer productId);

    // 혹은 명시적 JPQL을 쓰고 싶다면(엔티티 필드명 기준)
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
