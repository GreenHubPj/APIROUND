// src/main/java/com/apiround/greenhub/repository/ProductListingRepository.java
package com.apiround.greenhub.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiround.greenhub.entity.ProductListing;

public interface ProductListingRepository extends JpaRepository<ProductListing, Integer> {

    // 판매자별 + 미삭제 + listing_id 오름차순
    List<ProductListing> findBySellerIdAndIsDeletedOrderByListingIdAsc(Integer sellerId, String isDeleted);

    // seller + product 조합으로 살아있는 1건 (업서트에 사용)
    Optional<ProductListing> findFirstBySellerIdAndProductIdAndIsDeleted(Integer sellerId, Integer productId, String isDeleted);

    // ✅ 주문/가격/판매자 추론에 사용: 해당 상품의 ACTIVE 리스팅 중 가장 빠른 것
    Optional<ProductListing> findFirstByProductIdAndStatusOrderByListingIdAsc(Integer productId, ProductListing.Status status);

    // ✅ ACTIVE가 없을 때 최후 fallback
    Optional<ProductListing> findFirstByProductIdOrderByListingIdAsc(Integer productId);
}
