// src/main/java/com/apiround/greenhub/repository/item/SpecialtyProductRepository.java
package com.apiround.greenhub.repository.item;

import com.apiround.greenhub.entity.item.SpecialtyProduct;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpecialtyProductRepository extends JpaRepository<SpecialtyProduct, Integer> {
}
