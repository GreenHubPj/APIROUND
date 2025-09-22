// src/main/java/com/apiround/greenhub/web/dto/vendor/VendorOrderDetailDto.java
package com.apiround.greenhub.web.dto.vendor;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class VendorOrderDetailDto {
    private String id;
    private LocalDateTime date;
    private String status;
    private String paymentMethod;
    private BigDecimal vendorSubtotal;
    private Recipient recipient;
    private List<Item> items;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class Recipient {
        private String name;
        private String phone;
        private String zipcode;
        private String address1;
        private String address2;
        private String memo;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class Item {
        private Integer productId;
        private Integer listingId;
        private String name;
        private String image;
        private Integer quantity;
        private String unit;
        private String optionText;
        private BigDecimal unitPrice;
        private BigDecimal lineAmount;
        private String itemStatus;
        private String courierName;
        private String trackingNumber;
    }
}
