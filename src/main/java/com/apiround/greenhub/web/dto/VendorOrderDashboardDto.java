package com.apiround.greenhub.web.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class VendorOrderDashboardDto {

    private Summary summary;
    private StatusCounts statusCounts;
    private List<OrderRow> orders;
    private List<DataPoint> daily;   // 일별 매출
    private List<DataPoint> hourly;  // 시간별 매출

    @Getter @Setter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class Summary {
        private BigDecimal totalSales;   // 총 매출
        private Integer totalOrders;     // 총 주문건
        private BigDecimal avgAmount;    // 평균 주문금액
        private String completionRate;   // 완료율 (예: "94.2%")
        private String peakHour;         // 최다 주문시간 (예: "14:00-16:00")
        private String bestProduct;      // 베스트 상품명
    }

    @Getter @Setter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class StatusCounts {
        private Integer NEW;        // 신규
        private Integer CONFIRMED;  // 주문 확인
        private Integer PREPARING;  // 배송 준비
        private Integer SHIPPED;    // 배송중
        private Integer DELIVERED;  // 완료
        private Integer CANCELLED;  // 취소
        private Integer TOTAL;      // 총합(주문건)
    }

    @Getter @Setter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class OrderRow {
        private String orderNumber;
        private LocalDateTime createdAt;
        private BigDecimal amount;
        private String uiStatus; // 'new/confirmed/preparing/shipping/completed/cancelled'
    }

    @Getter @Setter @Builder
    @AllArgsConstructor @NoArgsConstructor
    public static class DataPoint {
        private String label;  // 일자(예: "9/09") 또는 시간(예: "14:00")
        private BigDecimal amount;
    }
}
