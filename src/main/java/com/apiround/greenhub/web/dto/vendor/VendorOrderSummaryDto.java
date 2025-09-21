// src/main/java/com/apiround/greenhub/web/dto/vendor/VendorOrderSummaryDto.java
package com.apiround.greenhub.web.dto.vendor;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class VendorOrderSummaryDto {
    private String id;                 // orderNumber 또는 orderId 문자열
    private LocalDateTime date;        // 주문일시
    private String status;             // 축약 상태 (completed/shipping/preparing/cancelled)
    private String recipientName;      // 수령인 이름(요약용)
    private BigDecimal vendorSubtotal; // 해당 판매사 소계 (자사 아이템 lineAmount 합)
    private List<Item> items;          // 자사 아이템만

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class Item {
        private String name;
        private String image;
        private Integer quantity;
        private String unit;
        private String optionText;
        private BigDecimal price; // lineAmount
    }
}
