// src/main/java/com/apiround/greenhub/service/item/ListingService.java
package com.apiround.greenhub.service.item;

import com.apiround.greenhub.dto.ListingDto;

public interface ListingService {

    /** specialty_product 저장 후 호출되어 listing을 생성/갱신 */
    Integer createListingFromSpecialty(
            Integer productId,
            Integer sellerId,
            String productType,
            String title,
            String description,
            String thumbnailUrl,
            String regionText,
            String harvestSeason
    );

    /** 폼으로 직접 listing 저장(선택기능) */
    Integer saveListing(ListingDto form);
}