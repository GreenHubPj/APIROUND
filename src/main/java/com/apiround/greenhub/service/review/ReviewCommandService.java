package com.apiround.greenhub.service.review;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewCommandService {

    private final JdbcTemplate jdbc;

    @Value("${reviews.allowWithoutPurchase:false}")
    private boolean allowWithoutPurchase;

    // 필요 시 프로젝트 정책에 맞게 조정하세요.
    private static final String DEFAULT_PRODUCT_TYPE = "SPECIALTY";
    private static final String DEFAULT_THUMBNAIL = "/images/농산물.png";

    public record CreateResult(Integer reviewId, Integer productId) {}

    public CreateResult createByOrderItem(Integer userId, Integer orderItemId, Integer rating, String content) {
        Integer productId = findProductIdByOrderItem(userId, orderItemId);
        if (productId == null) {
            if (!allowWithoutPurchase)
                throw new IllegalStateException("상품을 찾을 수 없습니다. (주문항목 매칭 실패)");
            throw new IllegalStateException("상품을 찾을 수 없습니다. (orderItemId 확인 필요)");
        }

        // ★ FK 보정: specialty_product에 없으면 최소 행 생성 (UPSERT)
        ensureProductExists(productId, orderItemId);

        if (existsUserProductReview(userId, productId)) {
            throw new IllegalStateException("이미 해당 상품에 대한 리뷰가 존재합니다.");
        }

        Integer reviewId = insertReview(productId, userId, rating, content);
        return new CreateResult(reviewId, productId);
    }

    public CreateResult createByUserAndProduct(Integer userId, Integer productId, Integer rating, String content) {
        // 구버전 경로도 FK 보정해 줌 (orderItemId 없으니 이름은 기본값 사용)
        ensureProductExists(productId, null);

        boolean hasDelivered = hasDeliveredOrderItem(userId, productId);
        if (!hasDelivered && !allowWithoutPurchase) {
            throw new IllegalStateException("상품을 찾을 수 없습니다. (배송완료 내역 없음)");
        }

        if (existsUserProductReview(userId, productId)) {
            throw new IllegalStateException("이미 해당 상품에 대한 리뷰가 존재합니다.");
        }

        Integer reviewId = insertReview(productId, userId, rating, content);
        return new CreateResult(reviewId, productId);
    }

    // ──────────────────────────────
    // 내부 Helper
    // ──────────────────────────────

    private Integer findProductIdByOrderItem(Integer userId, Integer orderItemId) {
        String sqlItem = """
            SELECT oi.product_id
              FROM order_item oi
              JOIN orders o ON o.order_id = oi.order_id
             WHERE oi.order_item_id = ?
               AND o.user_id = ?
               AND (oi.item_status = 'DELIVERED' OR o.status = 'DELIVERED')
             LIMIT 1
        """;
        Integer pid = getIntOrNull(sqlItem, orderItemId, userId);
        if (pid != null) return pid;

        // 프로젝트에 order_detail이 있는 경우만
        try {
            String sqlDetail = """
                SELECT od.product_id
                  FROM order_detail od
                  JOIN orders o ON o.order_id = od.order_id
                 WHERE od.order_detail_id = ?
                   AND o.user_id = ?
                   AND (od.item_status = 'DELIVERED' OR o.status = 'DELIVERED')
                 LIMIT 1
            """;
            pid = getIntOrNull(sqlDetail, orderItemId, userId);
            if (pid != null) return pid;
        } catch (Exception ignoreIfNoTable) {}

        return null;
    }

    /**
     * specialty_product에 행이 없으면 생성, 있으면 이름/썸네일만 갱신(UPSERT).
     * - created_at/updated_at은 DB DEFAULT/트리거에 맡깁니다(INSERT에서 제외).
     * - product_id에 UNIQUE 제약이 있어야 ON DUPLICATE KEY UPDATE가 정상 동작합니다.
     * - product_type은 NOT NULL + 기본값 없어서 반드시 INSERT에 포함합니다.
     */
    private void ensureProductExists(Integer productId, Integer orderItemIdOrNull) {
        // 주문항목 이름 스냅샷 가져오기 (없으면 기본명)
        String name = null;
        if (orderItemIdOrNull != null) {
            name = getStringOrNull(
                    "SELECT product_name_snap FROM order_item WHERE order_item_id = ?",
                    orderItemIdOrNull
            );
        }
        if (name == null || name.isBlank()) {
            name = "상품-" + productId;
        }

        // product_type은 NOT NULL 제약을 우회하기 위해 반드시 넣는다.
        // 이미 존재하는 행은 타입을 바꾸지 않기 위해 UPDATE 대상에서 제외.
        final String upsert = """
            INSERT INTO specialty_product (product_id, product_name, thumbnail_url, product_type)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                product_name = VALUES(product_name),
                thumbnail_url = VALUES(thumbnail_url)
        """;
        jdbc.update(upsert, productId, name, DEFAULT_THUMBNAIL, DEFAULT_PRODUCT_TYPE);
    }

    private boolean hasDeliveredOrderItem(Integer userId, Integer productId) {
        Integer cnt = jdbc.queryForObject("""
                SELECT COUNT(*)
                  FROM order_item oi
                  JOIN orders o ON o.order_id = oi.order_id
                 WHERE oi.product_id = ?
                   AND o.user_id = ?
                   AND (oi.item_status = 'DELIVERED' OR o.status = 'DELIVERED')
                """, Integer.class, productId, userId);
        if (cnt != null && cnt > 0) return true;

        try {
            cnt = jdbc.queryForObject("""
                    SELECT COUNT(*)
                      FROM order_detail od
                      JOIN orders o ON o.order_id = od.order_id
                     WHERE od.product_id = ?
                       AND o.user_id = ?
                       AND (od.item_status = 'DELIVERED' OR o.status = 'DELIVERED')
                    """, Integer.class, productId, userId);
            return cnt != null && cnt > 0;
        } catch (Exception ignoreIfNoTable) {
            return false;
        }
    }

    private boolean existsUserProductReview(Integer userId, Integer productId) {
        Integer cnt = jdbc.queryForObject("""
                SELECT COUNT(*)
                  FROM product_review pr
                 WHERE pr.user_id = ?
                   AND pr.product_id = ?
                   AND (pr.is_deleted IS NULL OR pr.is_deleted = 0)
                """, Integer.class, userId, productId);
        return cnt != null && cnt > 0;
    }

    private Integer insertReview(Integer productId, Integer userId, Integer rating, String content) {
        LocalDateTime now = LocalDateTime.now();

        jdbc.update("""
            INSERT INTO product_review (product_id, user_id, rating, content, created_at, updated_at, is_deleted, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, NULL)
        """, productId, userId, rating, content, now, now);

        Integer id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
        return (id != null ? id : 0);
    }

    // ── small helpers

    private Integer getIntOrNull(String sql, Object... args) {
        try {
            return jdbc.queryForObject(sql, Integer.class, args);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private String getStringOrNull(String sql, Object... args) {
        try {
            return jdbc.queryForObject(sql, String.class, args);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
