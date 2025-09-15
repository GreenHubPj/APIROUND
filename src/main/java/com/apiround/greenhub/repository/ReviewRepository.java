package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<ProductReview, Integer> {

    /**
     * 특정 업체(company_id)의 평균 평점
     * - product 테이블: product_id, company_id 존재한다고 가정
     * - 삭제 리뷰 제외(is_deleted = 1 제외)
     */
    @Query(value = """
        SELECT COALESCE(AVG(pr.rating), 0)
        FROM product_review pr
        JOIN product p ON p.product_id = pr.product_id
        WHERE p.company_id = :companyId
          AND (pr.is_deleted IS NULL OR pr.is_deleted = 0)
    """, nativeQuery = true)
    Double findAvgRatingByCompanyId(@Param("companyId") Integer companyId);
}
