package com.apiround.greenhub.web.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderSummaryDto {

    private String id;                 // 주문번호(예: ORD-20250101123000)
    private LocalDateTime date;        // 주문일
    private String status;             // 주문상태 문자열
    private BigDecimal totalAmount;    // 상품금액 합계
    private BigDecimal shippingFee;    // 배송비
    private BigDecimal finalAmount;    // 총 결제금액
    private List<Item> items;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private String name;           // 스냅샷 상품명
        private String image;          // (선택) 썸네일 URL
        private Integer quantity;      // 수량(정수 개수)
        private String unit;           // 표시용 단위(예: 개, kg)
        private String optionText;     // 옵션 라벨(예: 100g, 2kg)
        private BigDecimal price;      // 라인 합계(= 단가 * 수량)
        private Long listingId;        // 상품 리스팅 ID
    }
}
