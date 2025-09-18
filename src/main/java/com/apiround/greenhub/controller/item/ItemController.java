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
import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.entity.item.SpecialtyProduct;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.repository.ProductListingRepository;
import com.apiround.greenhub.repository.item.ProductPriceOptionRepository;
import com.apiround.greenhub.repository.item.RegionRepository;
import com.apiround.greenhub.repository.item.SpecialtyProductRepository;
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
    private final SpecialtyProductRepository productRepo;
    private final ProductPriceOptionRepository optionRepo;
    private final RegionRepository regionRepo;

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
                : listingRepo.findBySellerCompanyIdAndIsDeleted(loginCompany.getCompanyId(), "N");
        
        log.info("조회된 listings 수: {}", listings.size());
        for (ProductListing listing : listings) {
            log.info("Listing ID: {}, Title: {}, Status: {}", 
                    listing.getListingId(), listing.getTitle(), listing.getStatus());
        }

        // listings와 관련된 SpecialtyProduct 정보를 매핑
        Map<Integer, SpecialtyProduct> productMap = new HashMap<>();
        for (ProductListing listing : listings) {
            if (listing.getProduct() != null && listing.getProduct().getProductId() != null) {
                productRepo.findById(listing.getProduct().getProductId())
                    .ifPresent(product -> productMap.put(listing.getListingId(), product));
            }
        }
        
        model.addAttribute("listings", listings);
        model.addAttribute("productMap", productMap);
        model.addAttribute("loginCompany", loginCompany);
        model.addAttribute("listingStatuses", ProductListing.Status.values());
        model.addAttribute("listingForm", new ListingDto());
        return "item-management";
    }

    /** 상품 등록: specialty_product + option 저장 후 product_listing 자동 생성 */
    @PostMapping("/item-management")
    public String saveSpecialty(
            @RequestParam(required = false) Integer productId,
            @RequestParam String productName,
            @RequestParam String productType,
            @RequestParam String regionText,
            @RequestParam String description,
            @RequestParam(required = false) String thumbnailUrl,
            @RequestParam(required = false) MultipartFile imageFile,
            @RequestParam(name = "months", required = false) List<Integer> months,
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
        log.info("세션 정보 - company: {}, loginCompanyId: {}, sellerId 파라미터: {}",
                session.getAttribute("company"), session.getAttribute("loginCompanyId"), sellerId);

        try {
            // 0) 로그인 회사 확인
            Company seller = (Company) session.getAttribute("company");
            if (seller == null) {
                Integer companyId = (Integer) session.getAttribute("loginCompanyId");
                if (companyId == null) companyId = sellerId; // 폼 hidden 백업
                if (companyId == null) throw new IllegalStateException("로그인 후 이용해 주세요.");
                seller = companyRepository.findById(companyId)
                        .orElseThrow(() -> new IllegalStateException("회사 정보를 찾을 수 없습니다."));
            }
            log.info("최종 판매자 정보: companyId={}, companyName={}",
                    seller.getCompanyId(), seller.getCompanyName());

            // ✅ 1) 이미지 파일/데이터URL 저장
            String finalThumbnailUrl = saveThumbnail(imageFile, thumbnailUrl);
            
            // thumbnail_url 길이 제한 (5000자)
            if (finalThumbnailUrl != null && finalThumbnailUrl.length() > 5000) {
                finalThumbnailUrl = finalThumbnailUrl.substring(0, 5000);
            }

            // ✅ 2) 널 가드
            months       = (months != null)       ? months       : Collections.emptyList();
            optionLabels = (optionLabels != null) ? optionLabels : Collections.emptyList();
            quantities   = (quantities != null)   ? quantities   : Collections.emptyList();
            units        = (units != null)        ? units        : Collections.emptyList();
            prices       = (prices != null)       ? prices       : Collections.emptyList();

            // ✅ 3) 상품 + 옵션 저장
            Integer savedProductId = itemService.saveProductWithOptions(
                    productId,
                    productName, productType, regionText, description,
                    finalThumbnailUrl, null,
                    months, optionLabels, quantities, units, prices
            );
            if (savedProductId == null) {
                throw new RuntimeException("상품 저장 실패: productId가 null입니다.");
            }

            // ✅ 4) 리스팅 생성
            Integer listingId = listingService.createListingFromSpecialty(
                    savedProductId,
                    seller.getCompanyId(),
                    productName,
                    description,
                    finalThumbnailUrl,
                    harvestSeason
            );

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

    /** specialty_product 단건 조회 (수정용) */
    @GetMapping("/api/products/{id}")
    @ResponseBody
    public Map<String, Object> getOne(@PathVariable Integer id) {
        var detail = itemService.getProductWithOptions(id);
        return Map.of("product", detail.product(), "options", detail.options());
    }

    /** specialty_product 삭제 */
    @DeleteMapping("/api/products/{id}")
    @ResponseBody
    public Map<String, Object> delete(@PathVariable Integer id) {
        itemService.deleteProduct(id);
        return Map.of("ok", true);
    }

    /** 상품 상태 변경 (활성화/중지/비활성화) */
    @PostMapping("/api/listings/{id}/status")
    @ResponseBody
    public Map<String, Object> updateListingStatus(@PathVariable Integer id,
                                                   @RequestParam String status) {
        try {
            ProductListing listing = listingRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다: " + id));

            listing.setStatus(ProductListing.Status.valueOf(status)); // ACTIVE / INACTIVE / STOPPED
            listing.setUpdatedAt(java.time.LocalDateTime.now());
            listingRepo.save(listing);

            log.info("상품 상태 변경 완료 - listingId: {}, status: {}", id, status);
            return Map.of("success", true, "status", listing.getStatus().name());
        } catch (Exception e) {
            log.error("상품 상태 변경 실패", e);
            return Map.of("success", false, "error", e.getMessage());
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

            // 상품 정보 수정 - ProductPriceOption을 통해 SpecialtyProduct 조회
            if (listing.getProduct() != null && listing.getProduct().getProductId() != null) {
                // ProductPriceOption의 productId를 통해 SpecialtyProduct 조회
                Integer specialtyProductId = listing.getProduct().getProductId();
                SpecialtyProduct product = productRepo.findById(specialtyProductId).orElse(null);
                if (product != null) {
                    product.setProductName(productName);
                    product.setProductType(productType);
                    product.setRegionText(regionText);
                    product.setDescription(description);
                    if (finalThumbnailUrl != null && !finalThumbnailUrl.trim().isEmpty()) {
                        product.setThumbnailUrl(finalThumbnailUrl);
                    }
                    productRepo.save(product);
                    log.info("SpecialtyProduct 수정 완료 - productId: {}", product.getProductId());
                    
                    // 가격 옵션 수정
                    log.info("가격 옵션 수정 시작 - optionLabels: {}, quantities: {}, units: {}, prices: {}", 
                            optionLabels, quantities, units, prices);
                    
                    if (optionLabels != null && !optionLabels.isEmpty()) {
                        // 기존 가격 옵션 조회
                        var existingOptions = optionRepo.findByProductIdOrderBySortOrderAscOptionIdAsc(specialtyProductId);
                        log.info("기존 가격 옵션 조회 - productId: {}, 기존 옵션 수: {}", specialtyProductId, existingOptions.size());
                        
                        // 가격 옵션 수정 (기존 옵션 업데이트 또는 새로 생성)
                        for (int i = 0; i < optionLabels.size(); i++) {
                            if (i < existingOptions.size()) {
                                // 기존 옵션 업데이트 (UPDATE 쿼리)
                                var existingOption = existingOptions.get(i);
                                existingOption.setOptionLabel(optionLabels.get(i));
                                existingOption.setQuantity(quantities != null && i < quantities.size() ? quantities.get(i) : BigDecimal.ONE);
                                existingOption.setUnit(units != null && i < units.size() ? units.get(i) : "개");
                                existingOption.setPrice(prices != null && i < prices.size() ? prices.get(i) : 0);
                                existingOption.setSortOrder(i + 1);
                                existingOption.setIsActive(true);
                                existingOption.setUpdatedAt(java.time.LocalDateTime.now());
                                optionRepo.save(existingOption);
                                log.info("가격 옵션 업데이트 - optionId: {}, optionLabel: {}, quantity: {}, unit: {}, price: {}", 
                                        existingOption.getOptionId(), existingOption.getOptionLabel(), existingOption.getQuantity(), existingOption.getUnit(), existingOption.getPrice());
                            } else {
                                // 새로운 옵션 생성 (INSERT 쿼리)
                                ProductPriceOption option = new ProductPriceOption();
                                option.setProductId(specialtyProductId);
                                option.setOptionLabel(optionLabels.get(i));
                                option.setQuantity(quantities != null && i < quantities.size() ? quantities.get(i) : BigDecimal.ONE);
                                option.setUnit(units != null && i < units.size() ? units.get(i) : "개");
                                option.setPrice(prices != null && i < prices.size() ? prices.get(i) : 0);
                                option.setSortOrder(i + 1);
                                option.setIsActive(true);
                                option.setCreatedAt(java.time.LocalDateTime.now());
                                option.setUpdatedAt(java.time.LocalDateTime.now());
                                optionRepo.save(option);
                                log.info("가격 옵션 생성 - optionLabel: {}, quantity: {}, unit: {}, price: {}", 
                                        option.getOptionLabel(), option.getQuantity(), option.getUnit(), option.getPrice());
                            }
                        }
                        
                        // 기존 옵션 중 사용하지 않는 것들을 비활성화
                        for (int i = optionLabels.size(); i < existingOptions.size(); i++) {
                            var existingOption = existingOptions.get(i);
                            existingOption.setIsActive(false);
                            existingOption.setUpdatedAt(java.time.LocalDateTime.now());
                            optionRepo.save(existingOption);
                            log.info("가격 옵션 비활성화 - optionId: {}, optionLabel: {}", 
                                    existingOption.getOptionId(), existingOption.getOptionLabel());
                        }
                        log.info("가격 옵션 수정 완료 - productId: {}, 옵션 수: {}", specialtyProductId, optionLabels.size());
                    } else {
                        log.info("가격 옵션 데이터가 없어서 수정하지 않음");
                    }
                }
            }

            // 리스팅 정보 수정
            listing.setTitle(productName);
            listing.setDescription(description);
            if (finalThumbnailUrl != null && !finalThumbnailUrl.trim().isEmpty()) {
                listing.setThumbnailUrl(finalThumbnailUrl);
            }
            if (harvestSeason != null) {
                listing.setHarvestSeason(harvestSeason);
            }
            listing.setUpdatedAt(java.time.LocalDateTime.now());
            listingRepo.save(listing);

            log.info("상품 수정 완료 - listingId: {}", id);
            return Map.of("success", true);
        } catch (Exception e) {
            log.error("상품 수정 실패", e);
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    /** 상품 정보 조회 (수정용) */
    @GetMapping("/api/listings/{id}")
    @ResponseBody
    public Map<String, Object> getListing(@PathVariable Integer id) {
        try {
            ProductListing listing = listingRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다: " + id));

            // ProductPriceOption을 통해 SpecialtyProduct 조회
            SpecialtyProduct product = null;
            if (listing.getProduct() != null && listing.getProduct().getProductId() != null) {
                product = productRepo.findById(listing.getProduct().getProductId()).orElse(null);
            }

            // 가격 옵션 정보도 함께 조회 (활성화된 것만)
            List<Map<String, Object>> options = new ArrayList<>();
            if (product != null) {
                // ProductPriceOption 조회 (productId로, 활성화된 것만)
                var priceOptions = optionRepo.findByProductIdOrderBySortOrderAscOptionIdAsc(product.getProductId());
                for (var option : priceOptions) {
                    // 활성화된 옵션만 포함
                    if (option.getIsActive() != null && option.getIsActive()) {
                        Map<String, Object> optionData = new HashMap<>();
                        optionData.put("optionLabel", option.getOptionLabel());
                        optionData.put("quantity", option.getQuantity());
                        optionData.put("unit", option.getUnit());
                        optionData.put("price", option.getPrice());
                        options.add(optionData);
                    }
                }
            }

            return Map.of("success", true, "product", product, "options", options, "harvestSeason", listing.getHarvestSeason() != null ? listing.getHarvestSeason() : "");
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

            // ProductListing의 isDeleted를 Y로 설정
            listing.setIsDeleted("Y");
            listing.setUpdatedAt(java.time.LocalDateTime.now());
            listingRepo.save(listing);

            // Region(specialty_product)의 isDeleted도 Y로 설정
            Region region = regionRepo.findById(listing.getProduct().getProductId()).orElse(null);
            if (region != null) {
                region.setIsDeleted("Y");
                regionRepo.save(region);
                log.info("Region 삭제 완료 - productId: {}", listing.getProduct().getProductId());
            }

            log.info("상품 삭제 완료 - listingId: {}", id);
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
            SpecialtyProduct product = new SpecialtyProduct();
            product.setProductName("테스트 상품");
            product.setProductType("농산물");
            product.setRegionText("서울");
            product.setDescription("테스트 설명");
            product.setThumbnailUrl("/images/농산물.png");
            product.setHarvestSeason("1,2,3");
            SpecialtyProduct saved = productRepo.save(product);
            return Map.of("success", true, "productId", saved.getProductId());
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }
    }





}
