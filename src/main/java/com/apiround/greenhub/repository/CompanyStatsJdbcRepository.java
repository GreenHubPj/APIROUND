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
               AND (oi.is_deleted = 0 OR oi.is_deleted IS NULL)
               AND UPPER(oi.item_status) = 'DELIVERED'
        """;
        Long v = jdbcTemplate.queryForObject(sql, Long.class, companyId);
        return v != null ? v : 0L;
    }

    /** 진행중 아이템 수 (필요시 NEW/CONFIRMED 포함 가능) */
    public long countPendingItemsByCompany(int companyId) {
        String sql = """
            SELECT COUNT(*)
              FROM order_item oi
             WHERE oi.company_id = ?
               AND (oi.is_deleted = 0 OR oi.is_deleted IS NULL)
               AND UPPER(oi.item_status) IN ('PENDING','PAID','PREPARING','SHIPPED')
        """;
        Long v = jdbcTemplate.queryForObject(sql, Long.class, companyId);
        return v != null ? v : 0L;
    }

    /** 평균 평점: 업체가 판매하는 product_id에 달린 리뷰 평균 */
    public Double findAvgRatingByCompany(int companyId) {
        String sql = """
            SELECT COALESCE(AVG(CAST(pr.rating AS DECIMAL(10,2))), 0)
              FROM product_review pr
             WHERE (pr.is_deleted = 0 OR pr.is_deleted IS NULL)
               AND EXISTS (
                     SELECT 1
                       FROM product_listing pl
                      WHERE pl.product_id = pr.product_id
                        AND pl.seller_id = ?
                 )
        """;
        Double v = jdbcTemplate.queryForObject(sql, Double.class, companyId);
        return v != null ? v : 0.0;
    }
}
