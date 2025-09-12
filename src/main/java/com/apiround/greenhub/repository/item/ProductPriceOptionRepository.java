package com.apiround.greenhub.repository.item;

import com.apiround.greenhub.entity.item.ProductPriceOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductPriceOptionRepository extends JpaRepository<ProductPriceOption, Long> {

    // 상세: 특정 상품의 모든 옵션
    List<ProductPriceOption> findByProductIdOrderByPriceAsc(Integer productId);

    // 목록: 여러 상품의 최저가만
    @Query("""
           select p.productId as productId, min(p.price) as minPrice
           from ProductPriceOption p
           where p.productId in :productIds
           group by p.productId
           """)
    List<MinPriceView> findMinPriceByProductIds(@Param("productIds") List<Integer> productIds);

    static interface MinPriceView {
        Integer getProductId();
        Integer getMinPrice();
    }
}

