// src/main/java/com/apiround/greenhub/repository/item/ProductPriceOptionRepository.java
package com.apiround.greenhub.repository.item;

import com.apiround.greenhub.entity.item.ProductPriceOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductPriceOptionRepository extends JpaRepository<ProductPriceOption, Long> {

    List<ProductPriceOption> findByProductIdOrderBySortOrderAscOptionIdAsc(Integer productId);

    void deleteByProductId(Integer productId);

    @Query("""
        select min(p.price) from ProductPriceOption p
        where p.productId = :productId and (p.isActive = true or p.isActive is null)
    """)
    Integer findMinActivePriceByProductId(Integer productId);
}
