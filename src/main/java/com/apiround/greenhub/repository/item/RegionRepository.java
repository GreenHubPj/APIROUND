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
    @Query("SELECT r FROM Region r WHERE " +
           "r.regionText LIKE %:region1% OR " +
           "r.regionText LIKE %:region2% OR " +
           "r.regionText LIKE %:region3% " +
           "ORDER BY r.productId DESC")
    List<Region> findByRegionVariations(@Param("region1") String region1, 
                                       @Param("region2") String region2, 
                                       @Param("region3") String region3);

    // 단일 지역 검색 (LIKE 패턴)
    @Query("SELECT r FROM Region r WHERE r.regionText LIKE %:region% ORDER BY r.productId DESC")
    List<Region> findByRegionLike(@Param("region") String region);

    // 모든 상품을 productId 내림차순으로 조회 (삭제되지 않은 상품만)
    @Query("SELECT r FROM Region r " +
           "WHERE (r.isDeleted IS NULL OR r.isDeleted != 'Y') " +
           "ORDER BY r.productId DESC")
    List<Region> findAllOrderByProductIdDesc();

    // specialty_product 테이블에서 삭제되지 않은 상품만 조회
    @Query("SELECT r FROM Region r " +
           "WHERE (r.isDeleted IS NULL OR r.isDeleted != 'Y') " +
           "ORDER BY r.productId DESC")
    List<Region> findActiveProductsOrderByProductIdDesc();

    // 중지 상태인 상품만 조회 (ProductListing과 조인, 삭제되지 않은 상품만)
    @Query("SELECT r FROM Region r " +
           "JOIN ProductListing pl ON r.productId = pl.product.productId " +
           "WHERE pl.status = 'STOPPED' AND pl.isDeleted != 'Y' AND (r.isDeleted IS NULL OR r.isDeleted != 'Y') " +
           "ORDER BY r.productId DESC")
    List<Region> findStoppedProductsOrderByProductIdDesc();

    // region 페이지에 표시할 상품 조회 (specialty_product 테이블만 사용)
    @Query("SELECT r FROM Region r " +
           "WHERE (r.isDeleted IS NULL OR r.isDeleted != 'Y') " +
           "ORDER BY r.productId DESC")
    List<Region> findRegionDisplayProductsOrderByProductIdDesc();

    // 임시: 모든 상품 조회 (테스트용)
    @Query("SELECT r FROM Region r ORDER BY r.productId DESC")
    List<Region> findAllProductsForTest();

    // 상품 상태 조회 (ProductListing과 조인, 삭제되지 않은 상품만)
    @Query("SELECT pl.status FROM ProductListing pl " +
           "WHERE pl.product.productId = :productId AND pl.isDeleted != 'Y'")
    String findProductStatusById(@Param("productId") Integer productId);

    // 삭제되지 않은 상품 조회 (ProductListing과 조인)
    @Query("SELECT r FROM Region r " +
           "JOIN ProductListing pl ON r.productId = pl.product.productId " +
           "WHERE r.productId = :productId AND pl.isDeleted != 'Y' AND (r.isDeleted IS NULL OR r.isDeleted != 'Y')")
    Region findByIdAndNotDeleted(@Param("productId") Integer productId);

    // 타입별 조회 (내림차순 정렬)
    @Query("SELECT r FROM Region r WHERE r.productType = :productType ORDER BY r.productId DESC")
    List<Region> findByProductTypeOrderByProductIdDesc(@Param("productType") String productType);


    @Query(value = """
            SELECT *
            FROM specialty_product
            WHERE region_text = :regionText
              AND product_id <> :excludeId
            ORDER BY RAND()
            LIMIT :limit
            """, nativeQuery = true)
    List<Region> findRandomByRegionText(
            @Param("regionText") String regionText,
            @Param("excludeId") Integer excludeId,
            @Param("limit") int limit
    );}
