package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.Region;
import com.apiround.greenhub.repository.SeasonalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class SeasonalService {

    private final SeasonalRepository seasonalRepository;

    public SeasonalService(SeasonalRepository seasonalRepository) {
        this.seasonalRepository = seasonalRepository;
    }

    public List<Region> getMonthlySpecialties(Integer month) {
        int m = (month != null && month >= 1 && month <= 12)
                ? month : LocalDate.now().getMonthValue();
        
        // 디버깅을 위한 로그
        System.out.println("=== SeasonalService.getMonthlySpecialties ===");
        System.out.println("조회할 월: " + m);
        
        // LIMIT 제거 - 전체 결과 반환 (MySQL 쿼리와 동일)
        List<Region> regions = seasonalRepository.findRegionsByMonth(m);
        System.out.println("조회된 상품 수: " + regions.size());
        
        return regions;
    }

    public int countMonthlySpecialties(Integer month) {
        int m = (month != null && month >= 1 && month <= 12)
                ? month : LocalDate.now().getMonthValue();
        return seasonalRepository.countRegionsByMonth(m);
    }
}
