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
        if (form.getOptionId() != null) {
            ProductPriceOption option = optionRepo.findById(form.getOptionId())
                    .orElseThrow(() -> new IllegalArgumentException("옵션을 찾을 수 없습니다: " + form.getOptionId()));
            listing.setOption(option);
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
    public Integer createListingFromSpecialty(Integer productId, Integer sellerCompanyId, String title, String description) {
        log.info("ListingServiceImpl.createListingFromSpecialty 시작 - productId: {}, sellerCompanyId: {}, title: {}", 
                productId, sellerCompanyId, title);
        Company seller = companyRepo.findById(sellerCompanyId)
                .orElseThrow(() -> new IllegalArgumentException("판매자(회사)가 존재하지 않습니다: " + sellerCompanyId));

        // ▼ 옵션 하나 고르기: sortOrder가 있으면 우선, 없으면 optionId 기준 / 가장 저렴한 옵션으로 대체 가능
        log.info("옵션 선택 시작 - productId: {}", productId);
        ProductPriceOption picked = optionRepo
                .findFirstByProductIdAndIsActiveTrueOrderBySortOrderAscOptionIdAsc(productId)
                .orElseGet(() -> optionRepo
                        .findFirstByProductIdAndIsActiveTrueOrderByPriceAscOptionIdAsc(productId)
                        .orElseGet(() -> optionRepo
                                .findFirstByProductIdAndIsActiveTrueOrderByOptionIdAsc(productId)
                                .orElse(null)
                        )
                );
        
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

        // ★ listing에는 option 관계만 저장
        if (picked != null) {
            listing.setOption(picked);
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
