// src/main/java/com/apiround/greenhub/dto/ListingDto.java
package com.apiround.greenhub.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ListingDto {
    private Integer listingId;   // 수정시 사용 (hidden)
    private Integer sellerId;    // 회사(판매자) id
    private Integer optionId;
    private String  title;
    private String  description;
    private String  unitCode;
    private String  packSize;
    private BigDecimal priceValue;
    private String  currency;    // 기본 KRW
    private BigDecimal stockQty; // 선택
    private String  status;      // ACTIVE / PAUSED / SOLDOUT
}
