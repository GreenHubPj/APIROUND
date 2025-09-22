package com.apiround.greenhub.controller.mypage;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class MyPageController {

    private final NamedParameterJdbcTemplate jdbc;

    /** 마이페이지(서버 렌더용 주문 상태 포함) */
    @GetMapping("/mypage")
    public String mypage(HttpSession session, Model model) {
        Integer userId = (Integer) session.getAttribute("loginUserId");
        String loginName = (String) session.getAttribute("loginUserName");
        if (userId == null) return "redirect:/login";

        model.addAttribute("currentUser", new CurrentUserVm(userId, loginName != null ? loginName : "회원"));
        model.addAttribute("orderStatus", getOrderStatusForUser(userId));
        return "mypage";
    }

    /** 주문 상태 집계 API (클라이언트 갱신용) */
    @GetMapping("/api/my/order-status")
    @ResponseBody
    public ResponseEntity<?> getMyOrderStatus(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("loginUserId");
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "UNAUTHORIZED"));
        return ResponseEntity.ok(getOrderStatusForUser(userId));
    }

    /**
     * 사용자별 주문 상태 집계 (order_item 기준)
     * - 주문접수: PENDING + PAID + PREPARING + SHIPPED + DELIVERED
     * - 결제완료: PAID + PREPARING + SHIPPED + DELIVERED
     * - 상품준비중: PREPARING
     * - 배송중: SHIPPED
     * - 배송완료: DELIVERED
     *
     * ※ 취소/환불계열(CANCEL_*, REFUND_*)은 단계 수치에서 제외
     * ※ 행 수 기준(COUNT(*))으로 집계. 필요시 SUM(quantity)로 바꿔도 됨.
     */
    private OrderStatusVm getOrderStatusForUser(int userId) {
        String sql = """
            SELECT UPPER(COALESCE(oi.item_status,'')) AS s, COUNT(*) AS cnt
              FROM orders o
              JOIN order_item oi ON oi.order_id = o.order_id
             WHERE o.user_id = :uid
               AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
               AND (oi.is_deleted = 0 OR oi.is_deleted IS NULL)
             GROUP BY UPPER(COALESCE(oi.item_status,''))
        """;
        MapSqlParameterSource params = new MapSqlParameterSource("uid", userId);

        Map<String, Integer> byStatus = jdbc.query(sql, params, rs -> {
            Map<String, Integer> m = new HashMap<>();
            while (rs.next()) {
                m.put(rs.getString("s"), rs.getInt("cnt"));
            }
            return m;
        });

        int pending   = byStatus.getOrDefault("PENDING", 0);
        int paid      = byStatus.getOrDefault("PAID", 0);
        int preparing = byStatus.getOrDefault("PREPARING", 0);
        int shipped   = byStatus.getOrDefault("SHIPPED", 0);
        int delivered = byStatus.getOrDefault("DELIVERED", 0);

        // 취소/환불 계열은 단계 집계에서 제외 (원하면 포함 가능)
        // int cancelRelated =
        //   byStatus.getOrDefault("CANCEL_REQUESTED", 0) +
        //   byStatus.getOrDefault("CANCELLED", 0) +
        //   byStatus.getOrDefault("REFUND_REQUESTED", 0) +
        //   byStatus.getOrDefault("REFUNDED", 0);

        int orderReceived     = pending + paid + preparing + shipped + delivered;
        int paymentCompleted  = paid + preparing + shipped + delivered;

        return new OrderStatusVm(orderReceived, paymentCompleted, preparing, shipped, delivered);
    }

    /** 뷰 모델들 */
    public record OrderStatusVm(
            int orderReceived,
            int paymentCompleted,
            int preparingProduct,
            int shipping,
            int deliveryCompleted
    ) {}

    public static class CurrentUserVm {
        private final Integer userId;
        private final String name;
        public CurrentUserVm(Integer userId, String name) {
            this.userId = userId; this.name = name;
        }
        public Integer getUserId() { return userId; }
        public String getName() { return name; }
        public String getEmail() { return null; }
        public String getPhone() { return null; }
        public String getGender() { return null; }
        public LocalDate getBirthDate() { return null; }
    }
}
