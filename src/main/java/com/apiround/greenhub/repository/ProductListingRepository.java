// src/main/java/com/apiround/greenhub/repository/ProductListingRepository.java
package com.apiround.greenhub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiround.greenhub.entity.ProductListing;

public interface ProductListingRepository extends JpaRepository<ProductListing, Integer> {

    // 페이지에서 사용: 판매자별 + 미삭제 + listing_id 오름차순
    List<ProductListing> findBySellerIdAndIsDeletedOrderByListingIdAsc(Integer sellerId, String isDeleted);

    // seller + product 조합으로 살아있는 1건 (업서트에 사용)
    Optional<ProductListing> findFirstBySellerIdAndProductIdAndIsDeleted(Integer sellerId, Integer productId, String isDeleted);
}
