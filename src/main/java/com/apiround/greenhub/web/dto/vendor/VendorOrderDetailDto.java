// src/main/java/com/apiround/greenhub/web/dto/vendor/VendorOrderDetailDto.java
package com.apiround.greenhub.web.dto.vendor;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class VendorOrderDetailDto {
    private String id;
    private LocalDateTime date;
    private String status;           // uiStatus: preparing/shipping/completed...
    private String paymentMethod;
    private BigDecimal vendorSubtotal;
    private Recipient recipient;
    private List<Item> items;

    @Data
    @Builder
    public static class Recipient {
        private String name;
        private String phone;
        private String zipcode;
        private String address1;
        private String address2;
        private String memo;
    }

    @Data
    @Builder
    public static class Item {
        private Integer orderItemId;   // 🔹 추가: 저장에 필요
        private Integer productId;
        private Integer listingId;
        private String  name;
        private String  image;
        private Integer quantity;
        private String  unit;
        private String  optionText;
        private BigDecimal unitPrice;
        private BigDecimal lineAmount;

        private String  itemStatus;     // 🔹 추가: PREPARING/SHIPPED/DELIVERED...
        private String  courierName;
        private String  trackingNumber;
    }
}
