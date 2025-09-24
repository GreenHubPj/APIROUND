package com.apiround.greenhub.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ReviewLookupJdbc {

    private final JdbcTemplate jdbc;

    /** specialty_id -> product_id 매핑 (동일 테이블/키면 그대로 리턴) */
    public Integer findProductIdBySpecialtyId(Integer specialtyId) {
        // 대부분 specialty_product.product_id == specialty_id 라는 전제면 그대로 specialtyId 반환
        // 혹시 별도 매핑이 필요하면 아래 쿼리 사용
        String sql = """
            SELECT p.product_id
              FROM specialty_product p
             WHERE p.product_id = ?
        """;
        return jdbc.query(sql, rs -> rs.next() ? rs.getInt(1) : null, specialtyId);
    }

    /** 특산품 카드(제목/지역/썸네일 등) */
    public Map<String, Object> loadSpecialtyCard(Integer specialtyId) {
        String sql = """
            SELECT sp.product_id   AS productId,
                   sp.product_name AS productName,
                   COALESCE(sp.product_type, '카테고리') AS productType,
                   COALESCE(sp.region_text, '지역')     AS regionText,
                   COALESCE(sp.thumbnail_url, '/images/농산물.png') AS thumbnailUrl
              FROM specialty_product sp
             WHERE sp.product_id = ?
        """;
        return jdbc.query(sql, rs -> {
            Map<String, Object> m = new HashMap<>();
            if (rs.next()) {
                Map<String, Object> s = new HashMap<>();
                s.put("productName", rs.getString("productName"));
                s.put("productType", rs.getString("productType"));
                s.put("regionText", rs.getString("regionText"));
                s.put("thumbnailUrl", rs.getString("thumbnailUrl"));
                m.put("specialty", s);
            } else {
                m.put("specialty", null);
            }
            return m;
        }, specialtyId);
    }
}
