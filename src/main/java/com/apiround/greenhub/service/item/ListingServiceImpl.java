// src/main/java/com/apiround/greenhub/service/item/ListingServiceImpl.java
package com.apiround.greenhub.service.item;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.apiround.greenhub.dto.ListingDto;
import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.entity.ProductListing;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.repository.ProductListingRepository;
import com.apiround.greenhub.repository.item.ProductPriceOptionRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ListingServiceImpl implements ListingService {

    private final CompanyRepository companyRepo;
    private final ProductListingRepository listingRepo;
    private final ProductPriceOptionRepository optionRepo;

    @Override
    public Integer saveListing(ListingDto form) {
        Company seller = companyRepo.findById(form.getSellerId())
                .orElseThrow(() -> new IllegalArgumentException("판매자(회사)가 존재하지 않습니다: " + form.getSellerId()));

        ProductListing listing = (form.getListingId() != null)
                ? listingRepo.findById(form.getListingId()).orElse(new ProductListing())
                : new ProductListing();

        listing.setSeller(seller);
        listing.setTitle(form.getTitle());
        listing.setDescription(form.getDescription());
        listing.setStatus(ProductListing.Status.valueOf(form.getStatus() != null ? form.getStatus() : "ACTIVE"));

        // ★ option 관계 설정
        if (form.getProductId() != null) {
            ProductPriceOption option = optionRepo.findById(form.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("옵션을 찾을 수 없습니다: " + form.getProductId()));
            listing.setProduct(option);
        }

        // 선택 필드(있으면 세팅)
        listing.setUnitCode(form.getUnitCode());
        listing.setPackSize(form.getPackSize());
        listing.setCurrency(form.getCurrency());
        listing.setStockQty(form.getStockQty());
        listing.setPriceValue(form.getPriceValue());

        if (listing.getListingId() == null) {
            listing.setCreatedAt(LocalDateTime.now());
        }
        listing.setUpdatedAt(LocalDateTime.now());

        return listingRepo.save(listing).getListingId();
    }

    /** specialty_product 저장 직후 자동 리스팅 생성 */
    @Override
    public Integer createListingFromSpecialty(Integer productId, Integer sellerCompanyId, String title, String description, String finalThumbnailUrl, String harvestSeason) {
        log.info("ListingServiceImpl.createListingFromSpecialty 시작 - productId: {}, sellerCompanyId: {}, title: {}", 
                productId, sellerCompanyId, title);
        Company seller = companyRepo.findById(sellerCompanyId)
                .orElseThrow(() -> new IllegalArgumentException("판매자(회사)가 존재하지 않습니다: " + sellerCompanyId));

        // ▼ 옵션 하나 고르기: productId로 해당 상품의 옵션들을 찾아서 첫 번째 옵션 선택
        log.info("옵션 선택 시작 - productId: {}", productId);
        // 먼저 해당 상품의 모든 옵션을 가져와서 첫 번째 옵션 선택
        var options = optionRepo.findByProductIdOrderBySortOrderAscOptionIdAsc(productId);
        ProductPriceOption picked = null;
        
        if (!options.isEmpty()) {
            // 활성화된 옵션 중에서 첫 번째 선택
            picked = options.stream()
                    .filter(opt -> opt.getIsActive() != null && opt.getIsActive())
                    .findFirst()
                    .orElse(options.get(0)); // 활성화된 옵션이 없으면 첫 번째 옵션
        }
        
        if (picked != null) {
            log.info("선택된 옵션 - optionId: {}, price: {}", picked.getOptionId(), picked.getPrice());
        } else {
            log.warn("선택된 옵션이 없음 - productId: {}", productId);
        }



        ProductListing listing = new ProductListing();
        listing.setSeller(seller);
        listing.setTitle(title);
        listing.setDescription(description);
        listing.setStatus(ProductListing.Status.ACTIVE);
        listing.setThumbnailUrl(finalThumbnailUrl);
        listing.setHarvestSeason(harvestSeason);

        // ★ listing에는 option 관계만 저장
        if (picked != null) {
            listing.setProduct(picked);
            // price_value가 NOT NULL 제약이면 옵션 가격을 써주자
            if (listing.getPriceValue() == null && picked.getPrice() != null) {
                listing.setPriceValue(BigDecimal.valueOf(picked.getPrice()));
            }
        }

        log.info("리스팅 저장 시작 - title: {}, seller: {}", title, seller.getCompanyName());
        ProductListing savedListing = listingRepo.save(listing);
        log.info("리스팅 저장 완료 - listingId: {}", savedListing.getListingId());
        
        return savedListing.getListingId();
    }
}
