package com.apiround.greenhub.repository.item;

import com.apiround.greenhub.entity.item.ProductPriceOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductPriceOptionRepository extends JpaRepository<ProductPriceOption, Long> {
    List<ProductPriceOption> findByProductId(Integer productId);
}