package com.apiround.greenhub.service.item;

import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.repository.item.SeasonalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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

        List<Region> regions = seasonalRepository.findRegionsByMonth(m);
        System.out.println("조회된 상품 수: " + (regions != null ? regions.size() : 0));

        return regions;
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
