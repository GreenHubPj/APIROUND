package com.apiround.greenhub.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CompanyStatsJdbcRepository {

    private final JdbcTemplate jdbcTemplate;

    public CompanyStatsJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** 업체 기준 총 주문건 수 (해당 업체가 포함된 주문의 고유 건수) */
    public long countTotalOrdersByCompany(int companyId) {
        String sql = """
            SELECT COUNT(DISTINCT oi.order_id)
            FROM order_item oi
            WHERE oi.company_id = ?
              AND (oi.is_deleted = 0 OR oi.is_deleted IS NULL)
        """;
        Long v = jdbcTemplate.queryForObject(sql, Long.class, companyId);
        return v != null ? v : 0L;
    }

    /** 배송완료 아이템 수 */
    public long countDeliveredItemsByCompany(int companyId) {
        String sql = """
            SELECT COUNT(*)
            FROM order_item oi
            WHERE oi.company_id = ?
              AND oi.item_status = 'DELIVERED'
              AND (oi.is_deleted = 0 OR oi.is_deleted IS NULL)
        """;
        Long v = jdbcTemplate.queryForObject(sql, Long.class, companyId);
        return v != null ? v : 0L;
    }

    /** 진행중 아이템 수 */
    public long countPendingItemsByCompany(int companyId) {
        String sql = """
            SELECT COUNT(*)
            FROM order_item oi
            WHERE oi.company_id = ?
              AND oi.item_status IN ('PENDING','PAID','PREPARING','SHIPPED')
              AND (oi.is_deleted = 0 OR oi.is_deleted IS NULL)
        """;
        Long v = jdbcTemplate.queryForObject(sql, Long.class, companyId);
        return v != null ? v : 0L;
    }

    /** 평균 평점 (product_review ⟷ product_listing) */
    public Double findAvgRatingByCompany(int companyId) {
        String sql = """
            SELECT AVG(CAST(pr.rating AS DECIMAL(10,2)))
            FROM product_review pr
            JOIN product_listing pl
              ON pr.product_id = pl.product_id
            WHERE pl.seller_id = ?
              AND (pr.is_deleted = 0 OR pr.is_deleted IS NULL)
        """;
        return jdbcTemplate.queryForObject(sql, Double.class, companyId);
    }
}
