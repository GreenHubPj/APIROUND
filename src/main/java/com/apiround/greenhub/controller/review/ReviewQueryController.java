package com.apiround.greenhub.controller.review;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my/reviews")
public class ReviewQueryController {

    private final JdbcTemplate jdbc;

    /** 작성 가능(배송완료 & 미리뷰) 목록 */
    @GetMapping("/writable-list")
    public ResponseEntity<?> writableList(HttpSession session) {
        Integer userId = resolveLoginUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "login", false,
                    "redirectUrl", "/login"
            ));
        }

        // order_item + orders (oi.item_status OR o.status)
        List<Map<String, Object>> a = jdbc.query("""
            SELECT oi.order_item_id AS orderItemId,
                   oi.product_id    AS productId,
                   sp.product_name  AS productName,
                   COALESCE(sp.thumbnail_url, '/images/농산물.png') AS productImage
              FROM order_item oi
              JOIN orders o ON o.order_id = oi.order_id
              JOIN specialty_product sp ON sp.product_id = oi.product_id
             WHERE o.user_id = ?
               AND (oi.item_status = 'DELIVERED' OR o.status = 'DELIVERED')
               AND NOT EXISTS (
                    SELECT 1
                      FROM product_review pr
                     WHERE pr.user_id = o.user_id
                       AND pr.product_id = sp.product_id
                       AND (pr.is_deleted IS NULL OR pr.is_deleted = 0)
               )
        """, ps -> ps.setInt(1, userId), (rs, i) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("orderItemId", rs.getInt("orderItemId"));
            m.put("productId", rs.getInt("productId"));
            m.put("productName", rs.getString("productName"));
            m.put("productImage", rs.getString("productImage"));
            return m;
        });

        // order_detail + orders (있으면)
        List<Map<String, Object>> b = new ArrayList<>();
        try {
            b = jdbc.query("""
                SELECT od.order_detail_id AS orderItemId,
                       od.product_id      AS productId,
                       sp.product_name    AS productName,
                       COALESCE(sp.thumbnail_url, '/images/농산물.png') AS productImage
                  FROM order_detail od
                  JOIN orders o ON o.order_id = od.order_id
                  JOIN specialty_product sp ON sp.product_id = od.product_id
                 WHERE o.user_id = ?
                   AND (od.item_status = 'DELIVERED' OR o.status = 'DELIVERED')
                   AND NOT EXISTS (
                        SELECT 1
                          FROM product_review pr
                         WHERE pr.user_id = o.user_id
                           AND pr.product_id = sp.product_id
                           AND (pr.is_deleted IS NULL OR pr.is_deleted = 0)
                   )
            """, ps -> ps.setInt(1, userId), (rs, i) -> {
                Map<String, Object> m = new HashMap<>();
                m.put("orderItemId", rs.getInt("orderItemId"));
                m.put("productId", rs.getInt("productId"));
                m.put("productName", rs.getString("productName"));
                m.put("productImage", rs.getString("productImage"));
                return m;
            });
        } catch (Exception ignoreIfNoTable) { }

        Map<Integer, Map<String, Object>> dedup = new LinkedHashMap<>();
        for (Map<String, Object> it : a) dedup.putIfAbsent((Integer) it.get("productId"), it);
        for (Map<String, Object> it : b) dedup.putIfAbsent((Integer) it.get("productId"), it);

        return ResponseEntity.ok(new ArrayList<>(dedup.values()));
    }

    private Integer resolveLoginUserId(HttpSession session) {
        Object[] candidates = new Object[] {
                session.getAttribute("user"),
                session.getAttribute("loginUserId"),
                session.getAttribute("userId"),
                session.getAttribute("LOGIN_USER_ID"),
                session.getAttribute("LOGIN_USER")
        };
        for (Object v : candidates) {
            if (v instanceof com.apiround.greenhub.entity.User u && u.getUserId() != null) {
                return u.getUserId();
            }
            Integer n = toInt(v);
            if (n != null) return n;
            if (v instanceof Map<?,?> m) {
                Integer fromMap = toInt(m.get("userId"));
                if (fromMap != null) return fromMap;
            }
        }
        return null;
    }

    private Integer toInt(Object v) {
        if (v == null) return null;
        if (v instanceof Integer i) return i;
        if (v instanceof Number n) return n.intValue();
        if (v instanceof String s) {
            try { return Integer.parseInt(s); } catch (Exception ignored) {}
        }
        return null;
    }
}
