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

    // product_listing과 specialty_product를 UNION으로 조합하여 조회 (페이지네이션)
    @Query(value = """
        SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description 
        FROM (
            SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description, 1 AS src_order 
            FROM product_listing 
            WHERE status = 'ACTIVE' AND is_deleted = 'N'
            UNION ALL 
            SELECT product_id, product_name AS title, product_type, region_text, harvest_season, is_deleted, '' AS status, thumbnail_url, description, 2 AS src_order 
            FROM specialty_product
        ) t 
        ORDER BY src_order ASC, 
                 CASE WHEN src_order = 1 THEN product_id END DESC, 
                 CASE WHEN src_order = 2 THEN product_id END ASC
        LIMIT :size OFFSET :offset
        """, nativeQuery = true)
    List<Object[]> findCombinedProductsWithUnionPaged(@Param("offset") int offset, @Param("size") int size);

    // product_listing과 specialty_product를 UNION으로 조합하여 조회 (전체)
    @Query(value = """
        SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description 
        FROM (
            SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description, 1 AS src_order 
            FROM product_listing 
            WHERE status = 'ACTIVE' AND is_deleted = 'N'
            UNION ALL 
            SELECT product_id, product_name AS title, product_type, region_text, harvest_season, is_deleted, '' AS status, thumbnail_url, description, 2 AS src_order 
            FROM specialty_product
        ) t 
        ORDER BY src_order ASC, 
                 CASE WHEN src_order = 1 THEN product_id END DESC, 
                 CASE WHEN src_order = 2 THEN product_id END ASC
        """, nativeQuery = true)
    List<Object[]> findCombinedProductsWithUnion();

    // 타입별로 필터링된 UNION 조회
    @Query(value = """
        SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description 
        FROM (
            SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description, 1 AS src_order 
            FROM product_listing 
            WHERE status = 'ACTIVE' AND is_deleted = 'N' AND product_type = :productType
            UNION ALL 
            SELECT product_id, product_name AS title, product_type, region_text, harvest_season, is_deleted, '' AS status, thumbnail_url, description, 2 AS src_order 
            FROM specialty_product
            WHERE product_type = :productType
        ) t 
        ORDER BY src_order ASC, 
                 CASE WHEN src_order = 1 THEN product_id END DESC, 
                 CASE WHEN src_order = 2 THEN product_id END ASC
        """, nativeQuery = true)
    List<Object[]> findCombinedProductsByTypeWithUnion(@Param("productType") String productType);

    // 지역별로 필터링된 UNION 조회
    @Query(value = """
        SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description 
        FROM (
            SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description, 1 AS src_order 
            FROM product_listing 
            WHERE status = 'ACTIVE' AND is_deleted = 'N' AND region_text LIKE CONCAT('%', :regionText, '%')
            UNION ALL 
            SELECT product_id, product_name AS title, product_type, region_text, harvest_season, is_deleted, '' AS status, thumbnail_url, description, 2 AS src_order 
            FROM specialty_product
            WHERE region_text LIKE CONCAT('%', :regionText, '%')
        ) t 
        ORDER BY src_order ASC, 
                 CASE WHEN src_order = 1 THEN product_id END DESC, 
                 CASE WHEN src_order = 2 THEN product_id END ASC
        """, nativeQuery = true)
    List<Object[]> findCombinedProductsByRegionWithUnion(@Param("regionText") String regionText);

    // 특정 ID로 UNION 조회 (product_listing과 specialty_product에서 찾기)
    @Query(value = """
        SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description 
        FROM (
            SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description, 1 AS src_order 
            FROM product_listing 
            WHERE product_id = :productId AND status = 'ACTIVE' AND is_deleted = 'N'
            UNION ALL 
            SELECT product_id, product_name AS title, product_type, region_text, harvest_season, is_deleted, '' AS status, thumbnail_url, description, 2 AS src_order 
            FROM specialty_product
            WHERE product_id = :productId
        ) t 
        ORDER BY src_order ASC
        LIMIT 1
        """, nativeQuery = true)
    List<Object[]> findCombinedProductByIdWithUnion(@Param("productId") Integer productId);

    // 디버깅용: thumbnail_url 확인 쿼리
    @Query(value = """
        SELECT product_id, title, thumbnail_url 
        FROM product_listing 
        WHERE status = 'ACTIVE' AND is_deleted = 'N' 
        LIMIT 5
        """, nativeQuery = true)
    List<Object[]> findThumbnailUrlsFromProductListing();

    @Query(value = """
        SELECT product_id, product_name, thumbnail_url 
        FROM specialty_product 
        LIMIT 5
        """, nativeQuery = true)
    List<Object[]> findThumbnailUrlsFromSpecialtyProduct();

    // 특정 상품의 가격 옵션 조회
    @Query("""
        SELECT ppo FROM ProductPriceOption ppo 
        WHERE ppo.productId = :productId 
        AND (ppo.isActive IS NULL OR ppo.isActive = true)
        ORDER BY ppo.sortOrder ASC, ppo.optionId ASC
        """)
    List<com.apiround.greenhub.entity.item.ProductPriceOption> findPriceOptionsByProductId(@Param("productId") Integer productId);

    // 상품 ID로 업체 정보 조회 (ProductListing과 Company 조인)
    @Query("""
        SELECT c FROM Company c
        INNER JOIN ProductListing pl ON c.companyId = pl.sellerId
        WHERE pl.productId = :productId
        AND pl.isDeleted = 'N'
        """)
    com.apiround.greenhub.entity.Company findCompanyByProductId(@Param("productId") Integer productId);

    // 지역별 관련 상품 조회 (유연한 매칭 + 랜덤 정렬)
    @Query(value = """
        SELECT product_id, title, product_type, region_text, harvest_season, is_deleted, status, thumbnail_url, description, 
               RAND() as random_order
        FROM product_listing 
        WHERE status = 'ACTIVE' AND is_deleted = 'N'
        AND (region_text = :regionText 
             OR region_text LIKE CONCAT('%', :regionText, '%')
             OR :regionText LIKE CONCAT('%', region_text, '%'))
        AND product_id <> :excludeId
        
        UNION ALL 
        
        SELECT product_id, product_name AS title, product_type, region_text, harvest_season, is_deleted, '' AS status, thumbnail_url, description,
               RAND() as random_order
        FROM specialty_product
        WHERE (region_text = :regionText 
               OR region_text LIKE CONCAT('%', :regionText, '%')
               OR :regionText LIKE CONCAT('%', region_text, '%'))
        AND product_id <> :excludeId
        
        ORDER BY random_order ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findCombinedProductsByRegionFlexible(@Param("regionText") String regionText, 
                                                        @Param("excludeId") Integer excludeId, 
                                                        @Param("limit") int limit);
}
