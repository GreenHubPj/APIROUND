package com.apiround.greenhub.service.item;

import com.apiround.greenhub.dto.ListingDto;

public interface ListingService {
    Integer saveListing(ListingDto form);
    
    /** specialty_product 저장 직후, 해당 상품으로 product_listing 자동 생성 */
    Integer createListingFromSpecialty(Integer productId, Integer sellerCompanyId, String title, String description, String finalThumbnailUrl, String harvestSeason);
}
