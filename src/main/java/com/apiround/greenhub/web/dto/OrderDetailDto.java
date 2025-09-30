package com.apiround.greenhub.web.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OrderDetailDto {
    private String id;               // orderNumber 우선, 없으면 orderId 문자열
    private LocalDateTime date;      // 주문일 (createdAt)
    private String status;           // UI 상태: preparing/shipping/completed/cancelled
    private String paymentMethod;    // CARD/BANK_TRANSFER/...

    private BigDecimal subtotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    private Recipient recipient;
    private List<Item> items;
    private List<TrackingStep> tracking; // 선택(없으면 null/빈배열)

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Recipient {
        private String name;
        private String phone;
        private String zipcode;
        private String address1;
        private String address2;
        private String memo;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private Integer productId;
        private Integer listingId;
        private String  name;
        private String  image;
        private String  optionText;
        private String  unit;         // ex) kg, 개 ...
        private Integer quantity;
        private BigDecimal unitPrice; // 단가
        private BigDecimal lineAmount;// 합계(=단가*수량)
        private String  itemStatus;   // 선택
        private String  courierName;  // 선택
        private String  trackingNumber; // 선택
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TrackingStep {
        private String status;  // "주문 접수" 등
        private String date;    // "YYYY-MM-DD HH:mm"
        private boolean completed;
    }
}
