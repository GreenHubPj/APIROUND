// src/main/java/com/apiround/greenhub/repository/item/RegionRepository.java
package com.apiround.greenhub.repository.item;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiround.greenhub.entity.item.Region;

public interface RegionRepository extends JpaRepository<Region, Integer> {

    // 타입별 조회
    List<Region> findByProductType(String productType);

    // 지역 텍스트 검색
    List<Region> findByRegionTextContaining(String regionText);

    // 수확철 검색
    List<Region> findByHarvestSeasonContaining(String harvestSeason);

    // 지역별 검색 (다양한 형태의 지역명 지원)
    @Query("""
        SELECT r FROM Region r
         WHERE r.regionText LIKE %:region1%
            OR r.regionText LIKE %:region2%
            OR r.regionText LIKE %:region3%
         ORDER BY r.productId DESC
    """)
    List<Region> findByRegionVariations(@Param("region1") String region1,
                                        @Param("region2") String region2,
                                        @Param("region3") String region3);

    // 단일 지역 검색 (LIKE 패턴)
    @Query("""
        SELECT r FROM Region r
         WHERE r.regionText LIKE %:region%
         ORDER BY r.productId DESC
    """)
    List<Region> findByRegionLike(@Param("region") String region);

    // 모든(미삭제) 상품 조회
    @Query("""
        SELECT r FROM Region r
         WHERE (r.isDeleted IS NULL OR r.isDeleted <> 'Y')
         ORDER BY r.productId DESC
    """)
    List<Region> findAllOrderByProductIdDesc();

    // 활성 상품만 조회 (동일: 미삭제 조건)
    @Query("""
        SELECT r FROM Region r
         WHERE (r.isDeleted IS NULL OR r.isDeleted <> 'Y')
         ORDER BY r.productId DESC
    """)
    List<Region> findActiveProductsOrderByProductIdDesc();

    // ❗️상태명 정리: STOPPED 제거 → INACTIVE 로 변경
    @Query("""
        SELECT r
          FROM Region r
          JOIN ProductListing pl
            ON r.productId = pl.productId
         WHERE pl.status = 'INACTIVE'
           AND pl.isDeleted <> 'Y'
           AND (r.isDeleted IS NULL OR r.isDeleted <> 'Y')
         ORDER BY r.productId DESC
    """)
    List<Region> findInactiveProductsOrderByProductIdDesc();

    // region 페이지 표출용 (specialty_product만)
    @Query("""
        SELECT r FROM Region r
         WHERE (r.isDeleted IS NULL OR r.isDeleted <> 'Y')
         ORDER BY r.productId DESC
    """)
    List<Region> findRegionDisplayProductsOrderByProductIdDesc();

    // 임시: 모든 상품 조회 (테스트용)
    @Query("SELECT r FROM Region r ORDER BY r.productId DESC")
    List<Region> findAllProductsForTest();


    // 상품 상태 조회 (ProductListing에서 조회)
    @Query("""
        SELECT pl.status
          FROM ProductListing pl
         WHERE pl.productId = :productId
           AND pl.isDeleted <> 'Y'
    """)
    String findProductStatusById(@Param("productId") Integer productId);
    // ※ enum으로 받고 싶으면 반환타입을 String -> com.apiround.greenhub.entity.ProductListing.Status 로 변경

    /* ------------------------------------------------------------------
     * 🔧 JPQL로 변경하여 Region 엔티티 직접 반환
     * ------------------------------------------------------------------ */

    @Query(value = """
        SELECT product_id,
               product_name AS title,
               product_type,
               region_text,
               harvest_season,
               is_deleted,
               '' AS status
        FROM specialty_product
        WHERE (:productType IS NULL OR product_type = :productType)
        ORDER BY product_id DESC
        """, nativeQuery = true)
    List<Object[]> findByProductTypeOrderByProductIdDesc(@Param("productType") String productType);

    /* ------------------------------------------------------------------ */

    // 같은 지역의 다른 상품 랜덤 조회 (native) — 엔티티가 specialty_product(=Region)와 매핑되어 있어야 함
    @Query(value = """
        SELECT product_id,
               product_name AS title,
               product_type,
               region_text,
               harvest_season,
               is_deleted,
               '' AS status
        FROM specialty_product
        WHERE region_text = :regionText
          AND product_id <> :excludeId
        ORDER BY RAND()
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findRandomByRegionText(
            @Param("regionText") String regionText,
            @Param("excludeId") Integer excludeId,
            @Param("limit") int limit);
}
