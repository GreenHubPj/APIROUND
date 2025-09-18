// src/main/java/com/apiround/greenhub/service/item/ListingServiceImpl.java
package com.apiround.greenhub.service.item;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiround.greenhub.dto.ListingDto;
import com.apiround.greenhub.entity.ProductListing;
import com.apiround.greenhub.entity.ProductListing.Status;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.entity.item.SpecialtyProduct;
import com.apiround.greenhub.repository.ProductListingRepository;
import com.apiround.greenhub.repository.item.ProductPriceOptionRepository;
import com.apiround.greenhub.repository.item.SpecialtyProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ListingServiceImpl implements ListingService {

    private final ProductListingRepository listingRepo;
    private final SpecialtyProductRepository productRepo;
    private final ProductPriceOptionRepository optionRepo;

    @Override
    public Integer createListingFromSpecialty(
            Integer productId,
            Integer sellerId,
            String title,
            String description,
            String thumbnailUrl,
            String harvestSeason
    ) {
        if (productId == null) throw new IllegalArgumentException("productId가 없습니다.");
        if (sellerId == null)  throw new IllegalArgumentException("sellerId가 없습니다.");

        SpecialtyProduct product = productRepo.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. productId=" + productId));

        // 최저가 활성 옵션
        Optional<ProductPriceOption> cheapest =
                optionRepo.findFirstByProductIdAndIsActiveTrueOrderByPriceAscOptionIdAsc(productId);

        if (cheapest.isEmpty()) {
            log.warn("활성 옵션이 없어 listing 생성을 건너뜁니다. productId={}", productId);
            return null;
        }
        ProductPriceOption opt = cheapest.get();

        ProductListing listing = listingRepo
                .findFirstBySellerIdAndProductIdAndIsDeleted(sellerId, productId, "N")
                .orElseGet(ProductListing::new);

        LocalDateTime now = LocalDateTime.now();

        listing.setSellerId(sellerId);
        listing.setProductId(productId);
        listing.setTitle((title == null || title.isBlank()) ? product.getProductName() : title);
        listing.setDescription((description == null) ? product.getDescription() : description);
        listing.setThumbnailUrl((thumbnailUrl == null || thumbnailUrl.isBlank()) ? product.getThumbnailUrl() : thumbnailUrl);

        listing.setUnitCode(opt.getUnit());
        listing.setPackSize(opt.getQuantity() != null ? opt.getQuantity().stripTrailingZeros().toPlainString() : null);
        listing.setPriceValue(opt.getPrice() == null ? null : BigDecimal.valueOf(opt.getPrice()).setScale(2));
        listing.setCurrency("KRW");
        listing.setStockQty(BigDecimal.ZERO);
        listing.setStatus(Status.ACTIVE);
        listing.setHarvestSeason((harvestSeason == null || harvestSeason.isBlank()) ? product.getHarvestSeason() : harvestSeason);
        listing.setIsDeleted("N");

        if (listing.getListingId() == null) listing.setCreatedAt(now);
        listing.setUpdatedAt(now);

        ProductListing saved = listingRepo.save(listing);
        log.info("Listing 저장 완료 - listingId={}, sellerId={}, productId={}",
                saved.getListingId(), sellerId, productId);
        return saved.getListingId();
    }

    @Override
    public Integer saveListing(ListingDto form) {
        if (form.getSellerId() == null) throw new IllegalArgumentException("sellerId가 없습니다.");
        if (form.getProductId() == null) throw new IllegalArgumentException("productId가 없습니다.");

        ProductListing listing = listingRepo
                .findFirstBySellerIdAndProductIdAndIsDeleted(form.getSellerId(), form.getProductId(), "N")
                .orElseGet(ProductListing::new);

        LocalDateTime now = LocalDateTime.now();

        listing.setSellerId(form.getSellerId());
        listing.setProductId(form.getProductId());
        listing.setTitle(form.getTitle());
        listing.setDescription(form.getDescription());

        // DTO에 없는 필드는 건드리지 않음 (thumbnailUrl, harvestSeason 등)
        listing.setUnitCode(form.getUnitCode());
        listing.setPackSize(form.getPackSize());
        listing.setPriceValue(form.getPriceValue());
        listing.setCurrency(form.getCurrency() == null ? "KRW" : form.getCurrency());
        listing.setStockQty(form.getStockQty() == null ? BigDecimal.ZERO : form.getStockQty());

        // status가 String일 수 있으므로 안전 변환
        Status status = Status.ACTIVE;
        if (form.getStatus() != null) {
            String s = form.getStatus().toString().trim().toUpperCase();
            switch (s) {
                case "PAUSED":   status = Status.PAUSED;   break;
                case "SOLDOUT":  status = Status.SOLDOUT;  break;
                // 혹시 "INACTIVE"/"STOPPED" 등 과거 값이 오면 매핑
                case "INACTIVE": status = Status.PAUSED;   break;
                case "STOPPED":  status = Status.SOLDOUT;  break;
                default:         status = Status.ACTIVE;   break;
            }
        }
        listing.setStatus(status);

        listing.setIsDeleted("N");

        if (listing.getListingId() == null) listing.setCreatedAt(now);
        listing.setUpdatedAt(now);

        ProductListing saved = listingRepo.save(listing);
        return saved.getListingId();
    }
}
