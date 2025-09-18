// src/main/java/com/apiround/greenhub/repository/item/SpecialtyProductRepository.java
package com.apiround.greenhub.repository.item;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiround.greenhub.entity.item.SpecialtyProduct;

public interface SpecialtyProductRepository extends JpaRepository<SpecialtyProduct, Integer> {

    // 이름 + 지역 중복 체크용
    Optional<SpecialtyProduct> findByProductNameAndRegionText(String productName, String regionText);
}
