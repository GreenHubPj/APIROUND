// src/main/java/com/apiround/greenhub/cart/dto/CartDto.java
package com.apiround.greenhub.cart.dto;

import lombok.*;
import java.math.BigDecimal;

public class CartDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class Request {
        private Integer optionId;
        private String title;
        private BigDecimal quantity;
        private String unit;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class Update {
        private BigDecimal quantity;
    }

    @Getter
    @Builder
    public static class Response {
        private Integer cartId;
        private Integer optionId;
        private String optionName;  // 옵션 라벨 (예: 소/대/기본)
        private BigDecimal quantity;
        private String unit;

        private String title;       // 상품 제목 (listing.title)
        private Integer listingId;  // 이미지 URL 만들 때 사용
        private String imageUrl;    // /api/listings/{id}/thumbnail

        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }
}
