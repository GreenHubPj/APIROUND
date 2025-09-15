package com.apiround.greenhub.service;

import com.apiround.greenhub.dto.CompanyStats;
import com.apiround.greenhub.repository.CompanyStatsJdbcRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CompanyStatsService {

    private final CompanyStatsJdbcRepository statsJdbcRepository;

    public CompanyStatsService(CompanyStatsJdbcRepository statsJdbcRepository) {
        this.statsJdbcRepository = statsJdbcRepository;
    }

    public CompanyStats buildStatsForCompany(Integer companyId) {
        long totalOrders         = statsJdbcRepository.countTotalOrdersByCompany(companyId);
        long completedDeliveries = statsJdbcRepository.countDeliveredItemsByCompany(companyId);
        long pendingOrders       = statsJdbcRepository.countPendingItemsByCompany(companyId);

        Double avg = statsJdbcRepository.findAvgRatingByCompany(companyId); // nullable
        BigDecimal rating = (avg == null)
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP); // 예: 4.8

        return new CompanyStats(totalOrders, completedDeliveries, pendingOrders, rating);
    }
}
