package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.ProductReview; // ✅ 여기로 통일
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Integer> {

    Page<ProductReview> findByProductIdAndIsDeletedFalse(Integer productId, Pageable pageable);

    long countByProductIdAndIsDeletedFalse(Integer productId);

    long countByProductIdAndRatingAndIsDeletedFalse(Integer productId, Byte rating);
}
