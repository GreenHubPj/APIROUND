package com.apiround.greenhub.dto;

import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.entity.item.Region;
import lombok.Data;

import java.util.List;

@Data
public class RegionDetailDto {
    private final Region region;
    private final List<ProductPriceOption> options;

    public RegionDetailDto(Region region, List<ProductPriceOption> options) {
        this.region = region;
        this.options = options;
    }
}
