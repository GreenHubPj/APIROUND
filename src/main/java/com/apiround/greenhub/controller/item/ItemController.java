// src/main/java/com/apiround/greenhub/controller/item/ItemController.java
package com.apiround.greenhub.controller.item;

import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
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

    @Value("${app.upload-dir:${user.home}/greenhub-uploads}")
    private String uploadDir;

    private final ItemService itemService;                 // specialty_product + options
    private final ListingService listingService;           // product_listing
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

        // 판매자별 리스팅 조회 (삭제되지 않은 것만)
        List<ProductListing> listings = (loginCompany == null)
                ? Collections.emptyList()
                : listingRepo.findBySellerIdAndIsDeletedOrderByListingIdAsc(loginCompany.getCompanyId(), "N");
        
        log.info("조회된 listings 수: {}", listings.size());
        for (ProductListing listing : listings) {
            log.info("Listing ID: {}, Title: {}, Status: {}", 
                    listing.getListingId(), listing.getTitle(), listing.getStatus());
        }
        
        model.addAttribute("listings", listings);
        model.addAttribute("loginCompany", loginCompany);
        model.addAttribute("listingStatuses", ProductListing.Status.values());
        model.addAttribute("listingForm", new ListingDto());
        return "item-management";
    }

    /** 상품 등록: product_listing에만 직접 저장 */
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
        log.info("상품 등록 요청 시작 - productName: {}, productType: {}, regionText: {}",
                productName, productType, regionText);

        try {
            // 0) 로그인 회사 확인
            Company seller = (Company) session.getAttribute("company");
            if (seller == null) {
                Integer companyId = (Integer) session.getAttribute("loginCompanyId");
                if (companyId == null) companyId = sellerId;
                if (companyId == null) throw new IllegalStateException("로그인 후 이용해 주세요.");
                seller = companyRepository.findById(companyId)
                        .orElseThrow(() -> new IllegalStateException("회사 정보를 찾을 수 없습니다."));
            }

            // 1) 썸네일 저장
            String finalThumbnailUrl = saveThumbnail(imageFile, thumbnailUrl);
            if (finalThumbnailUrl != null && finalThumbnailUrl.length() > 5000) {
                finalThumbnailUrl = finalThumbnailUrl.substring(0, 5000);
            }

            // 2) 널 가드
            optionLabels = (optionLabels != null) ? optionLabels : Collections.emptyList();
            quantities   = (quantities != null)   ? quantities   : Collections.emptyList();
            units        = (units != null)        ? units        : Collections.emptyList();
            prices       = (prices != null)       ? prices       : Collections.emptyList();

            // 3) product_listing에만 직접 저장
            ProductListing listing = new ProductListing();
            // product_id는 시퀀스로 자동 생성됨
            listing.setSellerId(seller.getCompanyId());
            listing.setTitle(productName);
            listing.setProductType(productType);
            listing.setRegionText(regionText);
            listing.setDescription(description);
            listing.setThumbnailUrl(finalThumbnailUrl);
            listing.setHarvestSeason(harvestSeason);
            listing.setStatus(ProductListing.Status.ACTIVE);
            listing.setIsDeleted("N");
            
            // 가격 옵션 데이터가 있으면 첫 번째 옵션의 가격을 사용
            if (prices != null && !prices.isEmpty() && prices.get(0) != null) {
                listing.setPriceValue(java.math.BigDecimal.valueOf(prices.get(0)));
            } else {
                listing.setPriceValue(java.math.BigDecimal.ZERO);
            }
            
            // 기타 필드 설정 - unit_code는 외래키 제약조건 때문에 null로 설정
            listing.setUnitCode(null);
            if (quantities != null && !quantities.isEmpty()) {
                listing.setPackSize(quantities.get(0).stripTrailingZeros().toPlainString());
            }
            listing.setCurrency("KRW");
            listing.setStockQty(java.math.BigDecimal.ZERO);
            
            // 시간 설정
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            listing.setCreatedAt(now);
            listing.setUpdatedAt(now);
            
            ProductListing savedListing = listingRepo.save(listing);
            Integer listingId = savedListing.getListingId();
            
            // product_id를 listing_id와 같은 값으로 설정 (시퀀스 값이므로 null 방지)
            savedListing.setProductId(listingId);
            savedListing = listingRepo.save(savedListing);
            Integer generatedProductId = savedListing.getProductId();

            // 4) 가격 옵션들을 product_price_option 테이블에 저장
            if (prices != null && !prices.isEmpty()) {
                for (int i = 0; i < prices.size(); i++) {
                    if (prices.get(i) != null) {
                        ProductPriceOption priceOption = new ProductPriceOption();
                        priceOption.setProductId(generatedProductId); // 시퀀스로 자동 생성된 product_id 사용
                        priceOption.setOptionLabel(optionLabels != null && i < optionLabels.size() ? optionLabels.get(i) : "기본");
                        priceOption.setQuantity(quantities != null && i < quantities.size() ? quantities.get(i) : java.math.BigDecimal.ONE);
                        priceOption.setUnit(units != null && i < units.size() ? units.get(i) : "개");
                        priceOption.setPrice(prices.get(i));
                        priceOption.setSortOrder(i + 1);
                        priceOption.setIsActive(true);
                        priceOption.setCreatedAt(now);
                        priceOption.setUpdatedAt(now);
                        
                        optionRepo.save(priceOption);
                    }
                }
                log.info("가격 옵션 저장 완료 - {}개 옵션", prices.size());
            }

            log.info("상품 저장 성공 - listingId: {}", listingId);
            ra.addFlashAttribute("msg", "상품이 저장되었습니다.");
            return "redirect:/item-management#listing=" + listingId;

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("중복 상품명/지역 오류 발생", e);
            ra.addFlashAttribute("error", "같은 지역의 이름의 상품이 이미 존재합니다. 다른 이름으로 입력해주세요.");
            return "redirect:/item-management";

        } catch (Exception e) {
            log.error("상품 저장 중 오류", e);
            ra.addFlashAttribute("error", "저장 실패: " + e.getMessage());
            return "redirect:/item-management";
        }
    }

    /** Multipart or data URL 처리 */
    private String saveThumbnail(MultipartFile imageFile, String thumbnailUrl) throws Exception {
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);

        // 1) 파일 첨부가 있으면 그걸 우선 저장
        if (imageFile != null && !imageFile.isEmpty()) {
            String ext = getExt(imageFile.getOriginalFilename(), "png");
            String fileName = System.currentTimeMillis() + "_" + UUID.randomUUID() + "." + ext;
            Path target = root.resolve(fileName);
            try (InputStream in = imageFile.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("업로드 파일 저장: {}", target);
            return "/uploads/" + fileName;
        }

        // 2) data URL(base64) 처리
        if (thumbnailUrl != null && thumbnailUrl.startsWith("data:image/")) {
            Pattern p = Pattern.compile("^data:image/(png|jpe?g|gif);base64,(.+)$", Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(thumbnailUrl);
            if (m.find()) {
                String ext = m.group(1).toLowerCase().replace("jpeg", "jpg");
                byte[] bytes = Base64.getDecoder().decode(m.group(2));
                String fileName = System.currentTimeMillis() + "_" + UUID.randomUUID() + "." + ext;
                Path target = root.resolve(fileName);
                Files.write(target, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                log.info("data URL 이미지 저장: {}", target);
                return "/uploads/" + fileName;
            }
        }

        // 3) 기본 이미지
        return "/images/농산물.png";
    }

    private String getExt(String originalFilename, String def) {
        if (originalFilename == null) return def;
        int idx = originalFilename.lastIndexOf('.');
        if (idx < 0) return def;
        String ext = originalFilename.substring(idx + 1).toLowerCase(Locale.ROOT);
        return ext.isBlank() ? def : ext;
    }

    @PostMapping("/listings")
    public String saveListingFromForm(@ModelAttribute("listingForm") ListingDto form,
                                      HttpSession session, RedirectAttributes ra) {
        Company seller = (Company) session.getAttribute("company");
        if (seller == null) {
            Integer companyId = (Integer) session.getAttribute("loginCompanyId");
            if (companyId == null) throw new IllegalStateException("로그인 후 이용해 주세요.");
            seller = companyRepository.findById(companyId)
                    .orElseThrow(() -> new IllegalStateException("회사 정보를 찾을 수 없습니다."));
        }
        form.setSellerId(seller.getCompanyId());

        Integer id = listingService.saveListing(form);
        ra.addFlashAttribute("msg", "리스팅이 저장되었습니다.");
        return "redirect:/item-management#listing=" + id;
    }

    /** 상품 단건 조회 (수정용) */
    @GetMapping("/api/products/{id}")
    @ResponseBody
    public Map<String, Object> getOne(@PathVariable Integer id) {
        var detail = itemService.getProductWithOptions(id);
        return Map.of("product", detail.product(), "options", detail.options());
    }

    /** 상품 삭제 */
    @DeleteMapping("/api/products/{id}")
    @ResponseBody
    public Map<String, Object> delete(@PathVariable Integer id) {
        itemService.deleteProduct(id);
        return Map.of("ok", true);
    }
    /** 상품 상태 변경 (ACTIVE / PAUSED) */
    @PostMapping("/api/listings/{id}/status")
    @ResponseBody
    public Map<String, Object> updateListingStatus(@PathVariable Integer id,
                                                   @RequestParam String status) {
        try {
            ProductListing listing = listingRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다: " + id));

            String s = (status == null ? "" : status.trim().toUpperCase(Locale.ROOT));

            // 허용 값: ACTIVE, PAUSED (INACTIVE는 과거 호환 → PAUSED)
            ProductListing.Status mapped = switch (s) {
                case "ACTIVE"   -> ProductListing.Status.ACTIVE;
                case "PAUSED"   -> ProductListing.Status.INACTIVE;
                case "INACTIVE" -> ProductListing.Status.INACTIVE; // 과거 호환
                default -> throw new IllegalArgumentException("허용되지 않는 상태 값입니다: " + s);
            };

            listing.setStatus(mapped);
            listing.setUpdatedAt(java.time.LocalDateTime.now());
            listingRepo.save(listing);

            return Map.of("success", true, "status", listing.getStatus().name());
        } catch (Exception e) {
            // 현재 상태를 클라이언트 롤백용으로 같이 내려줌
            String current = listingRepo.findById(id)
                    .map(l -> l.getStatus() != null ? l.getStatus().name() : "ACTIVE")
                    .orElse("ACTIVE");
            return Map.of("success", false, "error", e.getMessage(), "currentStatus", current);
        }
    }

    /** 상품 수정 */
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
            log.info("상품 수정 요청 - listingId: {}, productName: {}, productType: {}", 
                    id, productName, productType);
            
            ProductListing listing = listingRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다: " + id));

            // product_id가 null인 경우 listing_id로 설정 (기존 데이터 호환성)
            if (listing.getProductId() == null) {
                listing.setProductId(listing.getListingId());
                listing = listingRepo.save(listing);
                log.info("기존 데이터 호환성: product_id를 listing_id({})로 설정", listing.getListingId());
            }

            // ✅ 이미지 처리 (수정 시에는 기존 이미지 유지)
            String finalThumbnailUrl = null;
            
            // 1) 파일 업로드가 있으면 파일 우선 저장
            if (imageFile != null && !imageFile.isEmpty()) {
                finalThumbnailUrl = saveThumbnail(imageFile, null);
            }
            // 2) data URL이 있으면 저장
            else if (thumbnailUrl != null && thumbnailUrl.startsWith("data:image/")) {
                finalThumbnailUrl = saveThumbnail(null, thumbnailUrl);
            }
            // 3) 일반 URL이 있으면 그대로 사용
            else if (thumbnailUrl != null && !thumbnailUrl.trim().isEmpty()) {
                finalThumbnailUrl = thumbnailUrl;
            }
            // 4) 아무것도 없으면 기존 이미지 유지 (finalThumbnailUrl = null)
            
            // thumbnail_url 길이 제한 (5000자)
            if (finalThumbnailUrl != null && finalThumbnailUrl.length() > 5000) {
                finalThumbnailUrl = finalThumbnailUrl.substring(0, 5000);
            }

            // ✅ ProductListing 정보 수정
            listing.setTitle(productName);
            listing.setProductType(productType);
            listing.setRegionText(regionText);
            listing.setDescription(description);
            if (finalThumbnailUrl != null && !finalThumbnailUrl.trim().isEmpty()) {
                listing.setThumbnailUrl(finalThumbnailUrl);
            }
                listing.setHarvestSeason(harvestSeason);
            listing.setUpdatedAt(java.time.LocalDateTime.now());
            
            // 가격 옵션 데이터가 있으면 첫 번째 옵션의 가격을 사용
            if (prices != null && !prices.isEmpty() && prices.get(0) != null) {
                listing.setPriceValue(java.math.BigDecimal.valueOf(prices.get(0)));
            }
            
            // 기타 필드 설정
            if (units != null && !units.isEmpty()) {
                listing.setUnitCode(null); // 외래키 제약조건 때문에 null로 설정
            }
            if (quantities != null && !quantities.isEmpty()) {
                listing.setPackSize(quantities.get(0).stripTrailingZeros().toPlainString());
            }
            listing.setCurrency("KRW");
            
            ProductListing savedListing = listingRepo.save(listing);
            log.info("ProductListing 수정 완료 - listingId: {}", savedListing.getListingId());

            // ✅ 가격 옵션 수정 (product_price_option 테이블)
            log.info("가격 옵션 수정 시작 - optionLabels: {}, quantities: {}, units: {}, prices: {}",
                    optionLabels, quantities, units, prices);

            if (prices != null && !prices.isEmpty()) {
                // 기존 가격 옵션들을 삭제 (해당 listing의 product_id와 일치하는 옵션들)
                var existingOptions = optionRepo.findByProductIdOrderBySortOrderAscOptionIdAsc(listing.getProductId());
                for (var option : existingOptions) {
                    optionRepo.delete(option);
                }
                log.info("기존 가격 옵션 삭제 완료 - 삭제된 옵션 수: {}", existingOptions.size());

                // 새로운 가격 옵션들 생성
                for (int i = 0; i < prices.size(); i++) {
                    if (prices.get(i) != null) {
                        ProductPriceOption priceOption = new ProductPriceOption();
                        priceOption.setProductId(listing.getProductId()); // product_listing의 product_id 사용
                        priceOption.setOptionLabel(optionLabels != null && i < optionLabels.size() ? optionLabels.get(i) : "기본");
                        priceOption.setQuantity(quantities != null && i < quantities.size() ? quantities.get(i) : java.math.BigDecimal.ONE);
                        priceOption.setUnit(units != null && i < units.size() ? units.get(i) : "개");
                        priceOption.setPrice(prices.get(i));
                        priceOption.setSortOrder(i + 1);
                        priceOption.setIsActive(true);
                        priceOption.setCreatedAt(java.time.LocalDateTime.now());
                        priceOption.setUpdatedAt(java.time.LocalDateTime.now());
                        
                        optionRepo.save(priceOption);
                        log.info("가격 옵션 생성 - optionLabel: {}, quantity: {}, unit: {}, price: {}",
                                priceOption.getOptionLabel(), priceOption.getQuantity(), priceOption.getUnit(), priceOption.getPrice());
                    }
                }
                log.info("가격 옵션 수정 완료 - {}개 옵션", prices.size());
            }

            log.info("상품 수정 완료 - listingId: {}", id);
            return Map.of("success", true);
        } catch (Exception e) {
            log.error("상품 수정 실패", e);
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /** 상품 정보 조회 (수정용) — 데이터 부재에도 안전하도록 변경 */
    @GetMapping("/api/listings/{id}")
    @ResponseBody
    public Map<String, Object> getListing(@PathVariable Integer id) {
        try {
            var listingOpt = listingRepo.findById(id);
            if (listingOpt.isEmpty()) {
                // 예외 던지지 말고 404 스타일 응답
                return Map.of("success", false, "error", "NOT_FOUND", "message", "상품을 찾을 수 없습니다: " + id);
            }
            ProductListing listing = listingOpt.get();

            // listing의 productId로 SpecialtyProduct 조회는 더 이상 필요하지 않음

            // 가격 옵션 정보도 함께 조회 (활성화된 것만)
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

            // ProductListing 데이터를 product 형태로 구성 (JavaScript 호환성을 위해)
            Map<String, Object> productData = new HashMap<>();
            productData.put("productName", listing.getTitle());
            productData.put("productType", listing.getProductType());
            productData.put("regionText", listing.getRegionText());
            productData.put("description", listing.getDescription());
            productData.put("thumbnailUrl", listing.getThumbnailUrl());
            productData.put("harvestSeason", listing.getHarvestSeason());

            // product가 없어도 listing 정보로 최대한 채워서 내려준다.
            Map<String, Object> listingBrief = new HashMap<>();
            listingBrief.put("listingId", listing.getListingId());
            listingBrief.put("productId", listing.getProductId());
            listingBrief.put("title", safe(listing.getTitle()));
            listingBrief.put("productType", safe(listing.getProductType()));
            listingBrief.put("regionText", safe(listing.getRegionText()));
            listingBrief.put("thumbnailUrl", safe(listing.getThumbnailUrl()));
            listingBrief.put("unitCode", safe(listing.getUnitCode()));
            listingBrief.put("priceValue", listing.getPriceValue());
            listingBrief.put("status", listing.getStatus() != null ? listing.getStatus().name() : "ACTIVE");
            listingBrief.put("harvestSeason", safe(listing.getHarvestSeason()));

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("product", productData);     // ProductListing 데이터를 product 형태로 구성
            result.put("listing", listingBrief);    // 프런트에서 대체 렌더 용
            result.put("options", options);
            result.put("harvestSeason", listing.getHarvestSeason() != null ? listing.getHarvestSeason() : "");
            return result;
        } catch (Exception e) {
            log.error("상품 정보 조회 실패", e);
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /** 상품 삭제 (is_deleted = Y) */
    @PostMapping("/api/listings/{id}/delete")
    @ResponseBody
    public Map<String, Object> deleteListing(@PathVariable Integer id) {
        try {
            ProductListing listing = listingRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다: " + id));

            // ProductListing의 isDeleted를 Y로 설정(소프트 삭제)
            listing.setIsDeleted("Y");
            listing.setUpdatedAt(java.time.LocalDateTime.now());
            listingRepo.save(listing);

            log.info("상품 삭제(소프트) 완료 - listingId: {}", id);
            return Map.of("success", true);
        } catch (Exception e) {
            log.error("상품 삭제 실패", e);
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /** 테스트용: 간단한 상품 저장 테스트 */
    @PostMapping("/test-save")
    @ResponseBody
    public Map<String, Object> testSave() {
        try {
            ProductListing listing = new ProductListing();
            // product_id는 시퀀스로 자동 생성됨
            listing.setSellerId(1); // 테스트용
            listing.setTitle("테스트 상품");
            listing.setProductType("농산물");
            listing.setRegionText("서울");
            listing.setDescription("테스트 설명");
            listing.setThumbnailUrl("/images/농산물.png");
            listing.setHarvestSeason("1,2,3");
            listing.setStatus(ProductListing.Status.ACTIVE);
            listing.setIsDeleted("N");
            listing.setPriceValue(java.math.BigDecimal.valueOf(10000));
            listing.setCurrency("KRW");
            listing.setStockQty(java.math.BigDecimal.ZERO);
            listing.setCreatedAt(java.time.LocalDateTime.now());
            listing.setUpdatedAt(java.time.LocalDateTime.now());
            
            ProductListing saved = listingRepo.save(listing);
            return Map.of("success", true, "listingId", saved.getListingId());
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    // ─────────────────────── helpers

    private static String safe(String s) {
        return (s == null || s.isBlank()) ? "" : s;
    }
}