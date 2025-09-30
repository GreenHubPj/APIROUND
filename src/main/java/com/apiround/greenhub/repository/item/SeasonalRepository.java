package com.apiround.greenhub.repository.item;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.entity.item.Seasonal;

public interface SeasonalRepository extends JpaRepository<Seasonal, Long> {

    // 특정 달의 Region 엔티티 리스트 (MySQL 쿼리와 동일 - LIMIT 제거)
    @Query("SELECT s.product FROM Seasonal s WHERE s.month = :month ORDER BY s.product.productName ASC")
    List<Region> findRegionsByMonth(@Param("month") int month);

    @Query("SELECT COUNT(s) FROM Seasonal s WHERE s.month = :month")
    int countRegionsByMonth(@Param("month") int month);
}