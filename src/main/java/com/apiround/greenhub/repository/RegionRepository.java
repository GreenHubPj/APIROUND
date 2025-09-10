package com.apiround.greenhub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiround.greenhub.entity.Region;

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
           "r.regionText LIKE %:region3%")
    List<Region> findByRegionVariations(@Param("region1") String region1, 
                                       @Param("region2") String region2, 
                                       @Param("region3") String region3);

    // 단일 지역 검색 (LIKE 패턴)
    @Query("SELECT r FROM Region r WHERE r.regionText LIKE %:region%")
    List<Region> findByRegionLike(@Param("region") String region);

}
