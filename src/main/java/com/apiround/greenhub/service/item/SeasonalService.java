package com.apiround.greenhub.service.item;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.repository.item.SeasonalRepository;

@Service
public class SeasonalService {

    private final SeasonalRepository seasonalRepository;
    private final RegionService regionService;

    public SeasonalService(SeasonalRepository seasonalRepository, RegionService regionService) {
        this.seasonalRepository = seasonalRepository;
        this.regionService = regionService;
    }

    /** seasonal 페이지에서 쓰는: 해당 월의 Region 전체 조회 */
    public List<Region> getMonthlySpecialties(Integer month) {
        int m = (month != null && month >= 1 && month <= 12)
                ? month : LocalDate.now().getMonthValue();

        // 디버깅 로그
        System.out.println("=== SeasonalService.getMonthlySpecialties ===");
        System.out.println("조회할 월: " + m);

        // 1. 기존 specialty_product 데이터 (Seasonal 테이블 기반)
        List<Region> specialtyRegions = seasonalRepository.findRegionsByMonth(m);
        System.out.println("specialty_product 상품 수: " + (specialtyRegions != null ? specialtyRegions.size() : 0));

        // 2. product_listing의 harvest_season 데이터 추가
        List<Region> harvestRegions = regionService.getProductsByHarvestSeason(m);
        System.out.println("harvest_season 상품 수: " + (harvestRegions != null ? harvestRegions.size() : 0));

        // 3. 두 리스트를 합치기
        List<Region> allRegions = new ArrayList<>();
        if (specialtyRegions != null) {
            allRegions.addAll(specialtyRegions);
        }
        if (harvestRegions != null) {
            allRegions.addAll(harvestRegions);
        }

        // 4. productId 기준으로 내림차순 정렬 (최신순)
        allRegions.sort((r1, r2) -> {
            Integer id1 = r1.getProductId();
            Integer id2 = r2.getProductId();
            if (id1 == null && id2 == null) return 0;
            if (id1 == null) return 1;
            if (id2 == null) return -1;
            return id2.compareTo(id1); // 내림차순
        });

        System.out.println("총 조회된 상품 수: " + allRegions.size());
        return allRegions;
    }

    public int countMonthlySpecialties(Integer month) {
        int m = (month != null && month >= 1 && month <= 12)
                ? month : LocalDate.now().getMonthValue();
        return seasonalRepository.countRegionsByMonth(m);
    }

    /** 메인 노출용: 이번 달 제철 Region을 랜덤 섞어서 limit개 반환 */
    public List<Region> getRandomSeasonalForMain(int limit) {
        int month = LocalDate.now(ZoneId.of("Asia/Seoul")).getMonthValue();

        // ✅ 1) seasonalRepository 기반 목록을 그대로 재사용 (추천)
        List<Region> list = getMonthlySpecialties(month);

        // ✅ 2) 혹시 RegionService 기반으로 뽑고 싶다면 아래 한 줄로도 OK
        // List<Region> list = regionService.getCurrentMonthProducts(month);

        if (list == null || list.isEmpty()) return List.of();

        List<Region> copy = new ArrayList<>(list); // 원본 보호
        Collections.shuffle(copy);
        int toIndex = Math.min(limit, copy.size());
        return copy.subList(0, toIndex);
    }
}
