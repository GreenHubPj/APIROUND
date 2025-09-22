package com.apiround.greenhub.cart.dto;

import lombok.*;

import java.math.BigDecimal;

public class CartDto {

    // 🟢 장바구니 추가 요청 DTO
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Integer optionId;
        private String title;
        private BigDecimal quantity;
        private String unit;
    }

    // 🟡 장바구니 수량 수정 DTO
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Update {
        private BigDecimal quantity;
    }

    // 🔵 장바구니 응답 DTO
    @Getter
    @Builder
    public static class Response {
        private Integer cartId;
        private Integer optionId;
        private String optionName;
        private BigDecimal quantity;
        private String title;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }
}