package com.apiround.greenhub.web.dto.vendor;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class VendorOrderSummaryDto {
    private String id;               // orderNumber 또는 orderId
    private LocalDateTime date;
    private String status;           // uiStatus: preparing/shipping/completed/...
    private String recipientName;
    private BigDecimal vendorSubtotal;
    private List<Item> items;

    @Getter
    @Builder
    public static class Item {
        private Integer orderItemId;   // ✅ 추가: PATCH용
        private String  itemStatus;    // ✅ 추가: DB 상태 (PREPARING/SHIPPED/DELIVERED/...)
        private String  name;
        private String  image;
        private Integer quantity;
        private String  unit;
        private String  optionText;
        private BigDecimal price;
    }
}
