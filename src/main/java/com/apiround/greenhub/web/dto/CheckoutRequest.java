package com.apiround.greenhub.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true) // 알 수 없는 필드는 무시 (예: quantity: "2kg")
public class CheckoutRequest {

    private Recipient recipient;
    private Payment payment;
    private BigDecimal totalAmount; // 프론트 합계 (서버에서 재계산하여 검증)
    private List<Item> items;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Recipient {
        private String name;
        private String phone;
        private String zipcode;
        private String address1;
        private String address2;
        private String memo;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Payment {
        // 프론트: card/bank/kakao/naver
        private String method;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        private Integer productId;     // 필수
        private Integer listingId;     // 선택
        private Integer optionId;      // 선택 (없으면 optionLabel로 조회)
        private String  optionLabel;   // 선택 (예: "2kg", "100g")
        private String  optionText;    // UI 표기 보존용
        private String  itemName;      // 스냅샷용(없으면 DB에서 조회)
        private BigDecimal unitPrice;  // 선택(없으면 옵션 가격으로)
        private Integer count;         // 구매 개수 (기본 1)
    }
}
