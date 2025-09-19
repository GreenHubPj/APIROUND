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


    // ✅ sortOrder 우선 → optionId 보조 정렬, 단일건
    Optional<ProductPriceOption>
    findTop1ByProductIdAndIsActiveTrueOrderBySortOrderAscOptionIdAsc(Integer productId);

    // ✅ sortOrder가 없을 때(혹은 null)용: optionId로만 정렬, 단일건
    Optional<ProductPriceOption>
    findTop1ByProductIdAndIsActiveTrueOrderByOptionIdAsc(Integer productId);

    // ✅ 최저가 1건 (price → optionId), 단일건
    Optional<ProductPriceOption>
    findTop1ByProductIdAndIsActiveTrueOrderByPriceAscOptionIdAsc(Integer productId);

    // (선택) 최저가 리스트가 필요할 때
    List<ProductPriceOption>
    findByProductIdAndIsActiveTrueOrderByPriceAscOptionIdAsc(Integer productId);

    ProductPriceOption findFirstByProductIdAndOptionLabelIgnoreCase(Integer productId, String trim);

    // (디버깅용으로 쓰던 메서드라면 유지 가능) product_id가 null인 옵션 조회
    List<ProductPriceOption> findByProductIdIsNull();
}
