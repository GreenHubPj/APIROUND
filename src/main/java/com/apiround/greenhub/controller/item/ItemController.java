// src/main/java/com/apiround/greenhub/controller/item/ItemController.java
package com.apiround.greenhub.controller.item;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap; // enum Status 포함
import java.util.List;
import java.util.Map;

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
import com.apiround.greenhub.entity.item.SpecialtyProduct;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.repository.ProductListingRepository;
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

    private final ItemService itemService;                 // specialty_product + options
    private final ListingService listingService;           // product_listing
    private final CompanyRepository companyRepository;
    private final ProductListingRepository listingRepo;
    private final SpecialtyProductRepository productRepo;

    /** 상품관리 페이지 */
    @GetMapping("/item-management")
    public String page(Model model, HttpSession session) {

        // (세션) 로그인 회사 정보 조회
        Company loginCompany = (Company) session.getAttribute("company");
        if (loginCompany == null) {
            // 세션에서 회사 ID로 조회 시도
            Integer companyId = (Integer) session.getAttribute("loginCompanyId");
            if (companyId != null) {
                loginCompany = companyRepository.findById(companyId).orElse(null);
            }
        }

        // 1) 로그인 회사의 리스팅 목록만 표시 (사용자별 데이터)
        List<ProductListing> listings = (loginCompany == null)
                ? Collections.emptyList()
                : listingRepo.findBySellerCompanyIdOrderByListingIdAsc(loginCompany.getCompanyId());

        // 2) 리스팅에서 상품 정보 추출
        List<SpecialtyProduct> productList = new ArrayList<>();
        Map<Integer, Integer> minPriceMap = new HashMap<>();
        
        for (ProductListing listing : listings) {
            if (listing.getProduct() != null) {
                // ProductPriceOption에서 SpecialtyProduct로 접근
                // ProductPriceOption의 productId로 SpecialtyProduct 조회
                Integer productId = listing.getProduct().getProductId();
                if (productId != null) {
                    // ProductPriceOption의 productId로 SpecialtyProduct 조회
                    SpecialtyProduct product = productRepo.findById(productId).orElse(null);
                    if (product != null) {
                        productList.add(product);
                        
                        // 최저가 설정
                        if (listing.getPriceValue() != null) {
                            minPriceMap.put(productId, listing.getPriceValue().intValue());
                        }
                    }
                }
            }
        }

        model.addAttribute("products", productList);
        model.addAttribute("minPriceMap", minPriceMap);
        model.addAttribute("listings", listings);
        model.addAttribute("loginCompany", loginCompany);
        model.addAttribute("listingStatuses", ProductListing.Status.values());
        model.addAttribute("listingForm", new ListingDto());

        return "item-management";
    }

    /** 상품 등록: specialty_product + product_price_option 저장하고, 곧바로 product_listing도 자동 생성 */
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

            HttpSession session,
            RedirectAttributes ra
    ) {
        log.info("상품 등록 요청 시작 - productName: {}, productType: {}, regionText: {}", 
                productName, productType, regionText);
        log.info("세션 정보 - company: {}, loginCompanyId: {}", 
                session.getAttribute("company"), session.getAttribute("loginCompanyId"));
        
        try {
            // 0) 로그인 회사 확인
            Company seller = (Company) session.getAttribute("company");
            log.info("세션에서 회사 정보: {}", seller);
            
            if (seller == null) {
                // 세션에서 회사 ID로 조회 시도
                Integer companyId = (Integer) session.getAttribute("loginCompanyId");
                log.info("세션에서 회사 ID: {}", companyId);
                
                if (companyId == null) {
                    log.error("로그인 정보가 없습니다.");
                    throw new IllegalStateException("로그인 후 이용해 주세요.");
                }
                seller = companyRepository.findById(companyId)
                        .orElseThrow(() -> new IllegalStateException("회사 정보를 찾을 수 없습니다."));
            }
            
            log.info("최종 판매자 정보: companyId={}, companyName={}", 
                    seller.getCompanyId(), seller.getCompanyName());

            // 0) 이미지 파일 처리
            String finalThumbnailUrl = thumbnailUrl;
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    // 파일 저장 경로 설정
                    String uploadDir = "src/main/resources/static/images/uploads/";
                    String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
                    String filePath = uploadDir + fileName;
                    
                    // 디렉토리 생성 (존재하지 않는 경우)
                    java.io.File directory = new java.io.File(uploadDir);
                    if (!directory.exists()) {
                        directory.mkdirs();
                    }
                    
                    // 파일 저장
                    imageFile.transferTo(new java.io.File(filePath));
                    
                    // 웹에서 접근 가능한 URL로 변환
                    finalThumbnailUrl = "/images/uploads/" + fileName;
                    log.info("이미지 파일 저장 완료: {}", finalThumbnailUrl);
                } catch (Exception e) {
                    log.error("이미지 파일 저장 실패", e);
                    ra.addFlashAttribute("error", "이미지 저장 실패: " + e.getMessage());
                    return "redirect:/item-management";
                }
            } else if (thumbnailUrl == null || thumbnailUrl.trim().isEmpty()) {
                // 기본 이미지 설정
                finalThumbnailUrl = "/images/농산물.png";
            }

            // 1) specialty_product + option 저장
            months       = months       == null ? Collections.emptyList() : months;
            optionLabels = optionLabels == null ? Collections.emptyList() : optionLabels;
            quantities   = quantities   == null ? Collections.emptyList() : quantities;
            units        = units        == null ? Collections.emptyList() : units;
            prices       = prices       == null ? Collections.emptyList() : prices;
            
            log.info("파라미터 검증 - months: {}, optionLabels: {}, quantities: {}, units: {}, prices: {}", 
                    months, optionLabels, quantities, units, prices);

            // 옵션까지 저장하고 productId 반환
            log.info("상품 저장 시작 - optionLabels: {}, quantities: {}, units: {}, prices: {}", 
                    optionLabels, quantities, units, prices);
            
            Integer savedProductId = itemService.saveProductWithOptions(
                    productId,
                    productName, productType, regionText, description,
                    finalThumbnailUrl, null, // externalRef 제거
                    months, optionLabels, quantities, units, prices
            );
            
            log.info("상품 저장 완료 - savedProductId: {}", savedProductId);

            // 2) 저장한 상품을 기반으로 product_listing 자동 생성 (옵션은 내부에서 가장 첫/최소를 매칭)
            Integer listingId = listingService.createListingFromSpecialty(
                    savedProductId,
                    seller.getCompanyId(),
                    productName,         // title
                    description          // description
            );

            log.info("상품 저장 성공 - productId: {}, listingId: {}", savedProductId, listingId);
            ra.addFlashAttribute("msg", "상품이 저장되었습니다.");
            return "redirect:/item-management#id=" + savedProductId;

        } catch (Exception e) {
            log.error("상품 저장 중 오류", e);
            ra.addFlashAttribute("error", "저장 실패: " + e.getMessage());
            return "redirect:/item-management";
        }
    }

    @PostMapping("/listings")
    public String saveListingFromForm(@ModelAttribute("listingForm") ListingDto form,
                                      HttpSession session, RedirectAttributes ra) {
        // 로그인 회사 주입
        Company seller = (Company) session.getAttribute("company");
        if (seller == null) {
            // 세션에서 회사 ID로 조회 시도
            Integer companyId = (Integer) session.getAttribute("loginCompanyId");
            if (companyId == null) {
                throw new IllegalStateException("로그인 후 이용해 주세요.");
            }
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

    /** product_listing 삭제 */
    @DeleteMapping("/api/listings/{id}")
    @ResponseBody
    public Map<String, Object> deleteListing(@PathVariable Integer id) {
        listingRepo.deleteById(id);
        return Map.of("ok", true);
    }


}
