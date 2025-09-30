// src/main/java/com/apiround/greenhub/controller/item/ItemController.java
package com.apiround.greenhub.controller.item;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.apiround.greenhub.dto.ListingDto;
import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.entity.ProductListing;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.repository.ProductListingRepository;
import com.apiround.greenhub.repository.item.ProductPriceOptionRepository;
import com.apiround.greenhub.service.item.ItemService;
import com.apiround.greenhub.service.item.ListingService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ItemController {

    @Value("${app.upload-dir:./upload-dir}")
    private String uploadDir;
    private final String staticUploadDir = "src/main/resources/static/uploads/";

    private final ItemService itemService;
    private final ListingService listingService;
    private final CompanyRepository companyRepository;
    private final ProductListingRepository listingRepo;
    private final ProductPriceOptionRepository optionRepo;

    /** 상품관리 페이지 */
    @GetMapping("/item-management")
    public String page(Model model, HttpSession session) {
        Company loginCompany = (Company) session.getAttribute("company");
        if (loginCompany == null) {
            Integer companyId = (Integer) session.getAttribute("loginCompanyId");
            if (companyId != null) {
                loginCompany = companyRepository.findById(companyId).orElse(null);
            }
        }
        List<ProductListing> listings = (loginCompany == null)
                ? Collections.emptyList()
                : listingRepo.findBySellerIdAndIsDeletedOrderByListingIdAsc(loginCompany.getCompanyId(), "N");

        model.addAttribute("listings", listings);
        model.addAttribute("loginCompany", loginCompany);
        model.addAttribute("listingStatuses", ProductListing.Status.values());
        model.addAttribute("listingForm", new ListingDto());
        return "item-management";
    }

    /** 상품 등록: product_listing에만 직접 저장 (이미지 → DB 바이트 저장) */
    @PostMapping("/item-management")
    public String saveSpecialty(
            @RequestParam(required = false) Integer productId,
            @RequestParam String productName,
            @RequestParam String productType,
            @RequestParam String regionText,
            @RequestParam String description,
            @RequestParam(required = false) String thumbnailUrl,
            @RequestParam(required = false) MultipartFile imageFile,
            @RequestParam(name = "optionLabel", required = false) List<String> optionLabels,
            @RequestParam(name = "quantity",    required = false) List<BigDecimal> quantities,
            @RequestParam(name = "unit",        required = false) List<String> units,
            @RequestParam(name = "price",       required = false) List<Integer> prices,
            @RequestParam(name = "sellerId",    required = false) Integer sellerId,
            @RequestParam(required = false) String harvestSeason,
            HttpSession session,
            RedirectAttributes ra
    ) {
        try {
            // 로그인 회사
            Company seller = (Company) session.getAttribute("company");
            if (seller == null) {
                Integer companyId = (Integer) session.getAttribute("loginCompanyId");
                if (companyId == null) companyId = sellerId;
                if (companyId == null) throw new IllegalStateException("로그인 후 이용해 주세요.");
                seller = companyRepository.findById(companyId)
                        .orElseThrow(() -> new IllegalStateException("회사 정보를 찾을 수 없습니다."));
            }

            // 컬렉션 널 가드
            optionLabels = (optionLabels != null) ? optionLabels : Collections.emptyList();
            quantities   = (quantities != null)   ? quantities   : Collections.emptyList();
            units        = (units != null)        ? units        : Collections.emptyList();
            prices       = (prices != null)       ? prices       : Collections.emptyList();

            // 저장
            ProductListing listing = new ProductListing();
            listing.setSellerId(seller.getCompanyId());
            listing.setTitle(productName);
            listing.setProductType(productType);
            listing.setRegionText(regionText);
            listing.setDescription(description);
            listing.setHarvestSeason(harvestSeason);
            listing.setStatus(ProductListing.Status.ACTIVE);
            listing.setIsDeleted("N");

            // ✅ 이미지: 파일이 오면 DB에 바이트로 저장
            if (imageFile != null && !imageFile.isEmpty()) {
                listing.setThumbnailData(imageFile.getBytes());
                String ct = imageFile.getContentType();
                listing.setThumbnailMime((ct != null && !ct.isBlank()) ? ct : "image/jpeg");
                // URL은 과거 호환 때문에 비워두거나 유지 가능. DB 저장을 원하므로 비워둠.
                listing.setThumbnailUrl(null);
            } else if (thumbnailUrl != null && !thumbnailUrl.isBlank()) {
                // 파일이 없고 URL만 온 경우: 과거 호환용으로 URL만 저장(선택)
                listing.setThumbnailUrl(thumbnailUrl);
            }

            // 가격(첫 옵션가)
            if (!prices.isEmpty() && prices.get(0) != null) {
                listing.setPriceValue(BigDecimal.valueOf(prices.get(0)));
            } else {
                listing.setPriceValue(BigDecimal.ZERO);
            }
            listing.setUnitCode(null);
            if (!quantities.isEmpty() && quantities.get(0) != null) {
                listing.setPackSize(quantities.get(0).stripTrailingZeros().toPlainString());
            }
            listing.setCurrency("KRW");
            listing.setStockQty(BigDecimal.ZERO);

            var now = java.time.LocalDateTime.now();
            listing.setCreatedAt(now);
            listing.setUpdatedAt(now);

            ProductListing savedListing = listingRepo.save(listing);
            Integer listingId = savedListing.getListingId();

            // product_id = listing_id 로 맞춤(네가 쓰던 방식)
            savedListing.setProductId(listingId);
            savedListing = listingRepo.save(savedListing);
            Integer generatedProductId = savedListing.getProductId();

            // 가격 옵션 저장
            if (!prices.isEmpty()) {
                for (int i = 0; i < prices.size(); i++) {
                    if (prices.get(i) == null) continue;
                    ProductPriceOption priceOption = new ProductPriceOption();
                    priceOption.setProductId(generatedProductId);
                    priceOption.setOptionLabel(optionLabels != null && i < optionLabels.size() ? optionLabels.get(i) : "기본");
                    priceOption.setQuantity(quantities != null && i < quantities.size() ? quantities.get(i) : BigDecimal.ONE);
                    priceOption.setUnit(units != null && i < units.size() ? units.get(i) : "개");
                    priceOption.setPrice(prices.get(i));
                    priceOption.setSortOrder(i + 1);
                    priceOption.setIsActive(true);
                    priceOption.setCreatedAt(now);
                    priceOption.setUpdatedAt(now);
                    optionRepo.save(priceOption);
                }
            }

            // ProductImage 테이블은 유지(원하면 그대로 삭제해도 OK). 여기선 저장 안 함.

            ra.addFlashAttribute("msg", "상품이 저장되었습니다.");
            return "redirect:/item-management#listing=" + listingId;

        } catch (Exception e) {
            log.error("상품 저장 중 오류", e);
            ra.addFlashAttribute("error", "저장 실패: " + e.getMessage());
            return "redirect:/item-management";
        }
    }

    /** 상품 수정 (이미지 → DB 바이트 업데이트) */
    @PostMapping(value = "/api/listings/{id}/edit", produces = "application/json")
    @ResponseBody
    public Map<String, Object> editListing(@PathVariable Integer id,
                                           @RequestParam String productName,
                                           @RequestParam String productType,
                                           @RequestParam String regionText,
                                           @RequestParam String description,
                                           @RequestParam(required = false) String thumbnailUrl,
                                           @RequestParam(required = false) MultipartFile imageFile,
                                           @RequestParam(required = false) String harvestSeason,
                                           @RequestParam(name = "optionLabel", required = false) List<String> optionLabels,
                                           @RequestParam(name = "quantity", required = false) List<BigDecimal> quantities,
                                           @RequestParam(name = "unit", required = false) List<String> units,
                                           @RequestParam(name = "price", required = false) List<Integer> prices) {
        try {
            ProductListing listing = listingRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다: " + id));

            if (listing.getProductId() == null) {
                listing.setProductId(listing.getListingId());
                listing = listingRepo.save(listing);
            }

            // 데이터 수정
            listing.setTitle(productName);
            listing.setProductType(productType);
            listing.setRegionText(regionText);
            listing.setDescription(description);
            listing.setHarvestSeason(harvestSeason);
            listing.setUpdatedAt(java.time.LocalDateTime.now());

            // ✅ 이미지 갱신: 새 파일이 오면 DB 바이트로 교체
            if (imageFile != null && !imageFile.isEmpty()) {
                listing.setThumbnailData(imageFile.getBytes());
                String ct = imageFile.getContentType();
                listing.setThumbnailMime((ct != null && !ct.isBlank()) ? ct : "image/jpeg");
                // URL 비우기(원하는 정책). 과거 URL을 유지하고 싶다면 제거하지 않아도 됨.
                listing.setThumbnailUrl(null);
            } else if (thumbnailUrl != null && !thumbnailUrl.isBlank()) {
                // 파일이 없고 URL만 수정한 경우(선택): URL을 저장(과거 호환)
                listing.setThumbnailUrl(thumbnailUrl);
            }
            // 둘 다 없으면 기존 DB 바이트 유지

            // 가격 옵션(전체 교체)
            if (prices != null && !prices.isEmpty()) {
                optionRepo.findByProductIdOrderBySortOrderAscOptionIdAsc(listing.getProductId())
                        .forEach(optionRepo::delete);

                for (int i = 0; i < prices.size(); i++) {
                    if (prices.get(i) == null) continue;
                    ProductPriceOption priceOption = new ProductPriceOption();
                    priceOption.setProductId(listing.getProductId());
                    priceOption.setOptionLabel(optionLabels != null && i < optionLabels.size() ? optionLabels.get(i) : "기본");
                    priceOption.setQuantity(quantities != null && i < quantities.size() ? quantities.get(i) : BigDecimal.ONE);
                    priceOption.setUnit(units != null && i < units.size() ? units.get(i) : "개");
                    priceOption.setPrice(prices.get(i));
                    priceOption.setSortOrder(i + 1);
                    priceOption.setIsActive(true);
                    priceOption.setCreatedAt(java.time.LocalDateTime.now());
                    priceOption.setUpdatedAt(java.time.LocalDateTime.now());
                    optionRepo.save(priceOption);
                }

                // 첫 옵션가를 priceValue에 반영(선택)
                if (prices.get(0) != null) {
                    listing.setPriceValue(BigDecimal.valueOf(prices.get(0)));
                }
            }

            listingRepo.save(listing);
            return Map.of("success", true);
        } catch (Exception e) {
            log.error("상품 수정 실패", e);
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /** 상품 정보 조회 (수정용) — thumbnail은 전용 엔드포인트 URL로 내려줌 */
    @GetMapping("/api/listings/{id}")
    @ResponseBody
    public Map<String, Object> getListing(@PathVariable Integer id) {
        try {
            var listingOpt = listingRepo.findById(id);
            if (listingOpt.isEmpty()) {
                return Map.of("success", false, "error", "NOT_FOUND", "message", "상품을 찾을 수 없습니다: " + id);
            }
            ProductListing listing = listingOpt.get();

            // 가격 옵션
            List<Map<String, Object>> options = new ArrayList<>();
            if (listing.getPriceOptions() != null) {
                for (var option : listing.getPriceOptions()) {
                    if (option.getIsActive() == null || !option.getIsActive()) continue;
                    Map<String, Object> optionData = new HashMap<>();
                    optionData.put("optionLabel", option.getOptionLabel());
                    optionData.put("quantity", option.getQuantity());
                    optionData.put("unit", option.getUnit());
                    optionData.put("price", option.getPrice());
                    options.add(optionData);
                }
            }

            // 프런트에서 미리보기/표시할 thumbnail URL은 DB스트리밍 엔드포인트를 사용
            String previewThumbUrl = "/api/listings/" + listing.getListingId() + "/thumbnail";

            Map<String, Object> productData = new HashMap<>();
            productData.put("productName", listing.getTitle());
            productData.put("productType", listing.getProductType());
            productData.put("regionText", listing.getRegionText());
            productData.put("description", listing.getDescription());
            productData.put("thumbnailUrl", previewThumbUrl);
            productData.put("harvestSeason", listing.getHarvestSeason());

            Map<String, Object> listingBrief = new HashMap<>();
            listingBrief.put("listingId", listing.getListingId());
            listingBrief.put("productId", listing.getProductId());
            listingBrief.put("title", safe(listing.getTitle()));
            listingBrief.put("productType", safe(listing.getProductType()));
            listingBrief.put("regionText", safe(listing.getRegionText()));
            listingBrief.put("thumbnailUrl", previewThumbUrl);
            listingBrief.put("unitCode", safe(listing.getUnitCode()));
            listingBrief.put("priceValue", listing.getPriceValue());
            listingBrief.put("status", listing.getStatus() != null ? listing.getStatus().name() : "ACTIVE");
            listingBrief.put("harvestSeason", safe(listing.getHarvestSeason()));

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("product", productData);
            result.put("listing", listingBrief);
            result.put("options", options);
            result.put("harvestSeason", listing.getHarvestSeason() != null ? listing.getHarvestSeason() : "");
            return result;
        } catch (Exception e) {
            log.error("상품 정보 조회 실패", e);
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    // 나머지(상태변경/삭제 등) 기존 코드 동일…

    private static String safe(String s) {
        return (s == null || s.isBlank()) ? "" : s;
    }
}
