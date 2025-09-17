package com.apiround.greenhub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RegionDto {
    private Integer productId;
    private String productName;
    private String productType;
    private String regionText;
    private String thumbnailUrl;
    private String harvestSeason;
    private Integer minPrice;  // 상품 목록용 최저가
}

