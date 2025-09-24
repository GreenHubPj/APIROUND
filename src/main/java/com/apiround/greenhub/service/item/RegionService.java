package com.apiround.greenhub.service.item;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.repository.item.RegionRepository;

@Service
public class RegionService {

    private final RegionRepository regionRepository;

    public RegionService(RegionRepository regionRepository) {

        this.regionRepository = regionRepository;
    }

    /** 같은 지역 랜덤 관련상품 (현재 상품 제외) */
    @Transactional(readOnly = true)
    public List<Region> getRandomRelatedByRegion(String regionText, Integer excludeId, int limit) {
        // 관련 상품 조회 시작

        if (regionText == null || regionText.isBlank() || limit <= 0) {
            return List.of();
        }

        try {
            List<Object[]> results = regionRepository.findCombinedProductsByRegionFlexible(regionText, excludeId, limit);
            List<Region> converted = convertObjectArrayToRegion(results);

            return converted;
        } catch (Exception e) {
            System.err.println("쿼리 실행 오류: " + e.getMessage());
            e.printStackTrace();
            return List.of();
        }
    }

    // 모든 특산품 조회 (내림차순 정렬)
    public List<Region> getAllProductsOrderByProductIdDesc() {
        List<Region> products = regionRepository.findAllOrderByProductIdDesc();

        // 각 상품에 업체 정보 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
        }

        return products;
    }

    /** harvest_season을 기반으로 해당 월의 상품 조회 */
    @Transactional(readOnly = true)
    public List<Region> getProductsByHarvestSeason(int month) {
        try {
            List<Object[]> results = regionRepository.findProductsByHarvestSeason(month);
            List<Region> converted = convertObjectArrayToRegion(results);
            
            // 각 상품에 업체 정보 설정
            for (Region product : converted) {
                setCompanyInfoForProduct(product);
            }
            
            return converted;
        } catch (Exception e) {
            System.err.println("harvest_season 조회 오류: " + e.getMessage());
            e.printStackTrace();
            return List.of();
        }
    }

    // 페이징된 특산품 조회
    public List<Region> getAllProductsOrderByProductIdDesc(int page, int size) {
        List<Region> products = regionRepository.findAllOrderByProductIdDesc(page, size);

        // 각 상품에 업체 정보 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
        }

        return products;
    }

    // 전체 상품 수 조회
    public int getTotalProductsCount() {
        return regionRepository.getTotalProductsCount();
    }

    // 활성 상태인 상품만 조회 (내림차순 정렬)
    public List<Region> getActiveProductsOrderByProductIdDesc() {
        List<Region> products = regionRepository.findActiveProductsOrderByProductIdDesc();

        // 각 상품에 업체 정보 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
        }

        return products;
    }

    // region 페이지에 표시할 상품 조회 (ACTIVE 상태이면서 삭제되지 않은 상품만)
    public List<Region> getRegionDisplayProductsOrderByProductIdDesc() {
        List<Region> products = regionRepository.findRegionDisplayProductsOrderByProductIdDesc();

        // 각 상품에 업체 정보 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
        }

        return products;
    }

    // UNION을 사용하여 product_listing과 specialty_product를 조합하여 조회 (페이지네이션)
    public List<Region> getCombinedProductsWithUnion(int page, int size) {
        int offset = page * size;
        List<Object[]> results = regionRepository.findCombinedProductsWithUnionPaged(offset, size);
        List<Region> products = convertObjectArrayToRegion(results);

        // 각 상품에 업체 정보와 가격 옵션 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
            setPriceOptionsForProduct(product);
        }

        return products;
    }

    // UNION을 사용하여 product_listing과 specialty_product를 조합하여 조회 (전체)
    public List<Region> getCombinedProductsWithUnion() {
        List<Object[]> results = regionRepository.findCombinedProductsWithUnion();
        List<Region> products = convertObjectArrayToRegion(results);

        // 각 상품에 업체 정보와 가격 옵션 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
            setPriceOptionsForProduct(product);
        }

        return products;
    }

    // 타입별로 필터링된 UNION 조회
    public List<Region> getCombinedProductsByTypeWithUnion(String productType) {
        List<Object[]> results = regionRepository.findCombinedProductsByTypeWithUnion(productType);
        List<Region> products = convertObjectArrayToRegion(results);

        // 각 상품에 업체 정보와 가격 옵션 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
            setPriceOptionsForProduct(product);
        }

        return products;
    }

    // 지역별로 필터링된 UNION 조회
    public List<Region> getCombinedProductsByRegionWithUnion(String regionText) {
        List<Object[]> results = regionRepository.findCombinedProductsByRegionWithUnion(regionText);
        List<Region> products = convertObjectArrayToRegion(results);

        // 각 상품에 업체 정보와 가격 옵션 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
            setPriceOptionsForProduct(product);
        }

        return products;
    }

    // 특정 ID로 UNION 조회 (product_listing과 specialty_product에서 찾기)
    public Region getCombinedProductByIdWithUnion(Integer productId) {
        List<Object[]> results = regionRepository.findCombinedProductByIdWithUnion(productId);
        if (results.isEmpty()) {
            return null;
        }

        List<Region> products = convertObjectArrayToRegion(results);
        if (products.isEmpty()) {
            return null;
        }

        Region product = products.get(0);
        setCompanyInfoForProduct(product);
        setPriceOptionsForProduct(product);
        return product;
    }

    // 디버깅용: thumbnail_url 확인

    // 임시: 모든 상품 조회 (테스트용)
    public List<Region> getAllProductsForTest() {
        List<Region> products = regionRepository.findAllProductsForTest();

        // 각 상품에 업체 정보 설정
        for (Region product : products) {
            setCompanyInfoForProduct(product);
        }

        return products;
    }

    // 상품에 업체 정보 설정
    private void setCompanyInfoForProduct(Region product) {
        try {

            // product_listing에서 온 상품인 경우에만 실제 업체 정보 조회
            if ("ACTIVE".equals(product.getStatus()) || "INACTIVE".equals(product.getStatus())) {
                com.apiround.greenhub.entity.Company company = regionRepository.findCompanyByProductId(product.getProductId());

                if (company != null) {
                    product.setCompanyName(company.getCompanyName());
                    product.setCompanyEmail(company.getEmail());
                    product.setCompanyPhone(company.getManagerPhone());
                } else {
                    setDefaultCompanyInfo(product);
                }
            } else {
                setDefaultCompanyInfo(product);
            }

        } catch (Exception e) {
            e.printStackTrace();
            setDefaultCompanyInfo(product);
        }
    }

    // 기본 업체 정보 설정
    private void setDefaultCompanyInfo(Region product) {
        product.setCompanyName("문경이좋아");
        product.setCompanyEmail("monkyeon@naver.com");
        product.setCompanyPhone("053-555-444");
    }

    // 상품의 가격 옵션 조회 (product_listing에서만 가능)
    private void setPriceOptionsForProduct(Region product) {
        try {
            // product_listing에서 온 상품인 경우에만 priceOptions 조회
            // status가 'ACTIVE' 또는 'INACTIVE'인 경우는 product_listing에서 온 상품
            if ("ACTIVE".equals(product.getStatus()) || "INACTIVE".equals(product.getStatus())) {
                // ProductPriceOption을 별도로 조회하여 설정
                List<com.apiround.greenhub.entity.item.ProductPriceOption> priceOptions =
                        regionRepository.findPriceOptionsByProductId(product.getProductId());
                product.setPriceOptions(priceOptions);
            } else {
                // specialty_product에서 온 상품은 priceOptions를 null로 설정 (업체 문의 메시지 표시)
                product.setPriceOptions(null);
            }
        } catch (Exception e) {
            product.setPriceOptions(null);
        }
    }

    // 타입별 조회 (내림차순 정렬)
    public List<Region> getProductsByTypeOrderByProductIdDesc(String productType) {
        List<Object[]> results = regionRepository.findByProductTypeOrderByProductIdDesc(productType);
        return convertObjectArrayToRegion(results);
    }

    // 지역별 조회
    public List<Region> getProductsByRegion(String regionText) {
        return regionRepository.findByRegionTextContaining(regionText);
    }

    // 수확철별 조회
    public List<Region> getProductsBySeason(String harvestSeason) {
        return regionRepository.findByHarvestSeasonContaining(harvestSeason);
    }

    // 지역별 조회 (다양한 형태의 지역명 지원)
    public List<Region> getProductsByRegionCode(String regionCode) {
        // 지역 코드에 따른 다양한 형태의 지역명 매핑
        List<Region> results;
        switch (regionCode) {
            case "seoul":
                results = regionRepository.findByRegionVariations("서울", "서울특별시", "서울시");
                break;
            case "gyeonggi":
                results = regionRepository.findByRegionVariations("경기", "경기도", "경기시");
                break;
            case "incheon":
                results = regionRepository.findByRegionVariations("인천", "인천광역시", "인천시");
                break;
            case "gangwon":
                results = regionRepository.findByRegionVariations("강원", "강원도", "강원시");
                break;
            case "chungbuk":
                results = regionRepository.findByRegionVariations("충북", "충청북도", "충북시");
                break;
            case "chungnam":
                results = regionRepository.findByRegionVariations("충남", "충청남도", "충남시");
                break;
            case "daejeon":
                results = regionRepository.findByRegionVariations("대전", "대전광역시", "대전시");
                break;
            case "jeonbuk":
                results = regionRepository.findByRegionVariations("전북", "전라북도", "전북시");
                break;
            case "jeonnam":
                results = regionRepository.findByRegionVariations("전남", "전라남도", "전남시");
                break;
            case "gwangju":
                results = regionRepository.findByRegionVariations("광주", "광주광역시", "광주시");
                break;
            case "gyeongbuk":
                results = regionRepository.findByRegionVariations("경북", "경상북도", "경북시");
                break;
            case "gyeongnam":
                results = regionRepository.findByRegionVariations("경남", "경상남도", "경남시");
                break;
            case "daegu":
                results = regionRepository.findByRegionVariations("대구", "대구광역시", "대구시");
                break;
            case "ulsan":
                results = regionRepository.findByRegionVariations("울산", "울산광역시", "울산시");
                break;
            case "busan":
                results = regionRepository.findByRegionVariations("부산", "부산광역시", "부산시");
                break;
            case "jeju":
                results = regionRepository.findByRegionVariations("제주", "제주도", "제주특별자치도");
                break;
            default:
                results = regionRepository.findByRegionLike(regionCode);
                break;
        }
        return results;
    }

    // ID로 상품 조회 (모든 상품 조회)
    public Region getProductById(Integer id) {
        return regionRepository.findById(id).orElse(null);
    }

    // 상품 상태 조회 (ProductListing과 조인)
    public String getProductStatusById(Integer productId) {
        return regionRepository.findProductStatusById(productId);
    }

    // 이번달 특산품 조회 (더 정확한 월별 검색)
    public List<Region> getCurrentMonthProducts(int month) {
        // 월별 특산품 조회 (harvestSeason에 해당 월이 포함된 상품들)
        return regionRepository.findByHarvestSeasonContaining(String.valueOf(month));
    }


    // Object[] 배열을 Region 객체로 변환하는 헬퍼 메서드
    private List<Region> convertObjectArrayToRegion(List<Object[]> results) {
        return results.stream()
                .map(row -> {
                    // is_deleted 필드가 Character 타입일 수 있으므로 String으로 변환
                    String isDeleted = null;
                    if (row[5] != null) {
                        isDeleted = row[5].toString();
                    }

                    Region region = Region.builder()
                            .productId((Integer) row[0])     // product_id
                            .productName((String) row[1])    // title을 productName으로 매핑
                            .productType((String) row[2])    // product_type
                            .regionText((String) row[3])     // region_text
                            .harvestSeason((String) row[4])  // harvest_season
                            .isDeleted(isDeleted)            // is_deleted (String으로 변환)
                            .thumbnailUrl((String) row[7])    // thumbnail_url
                            .description((String) row[8])    // description
                            .build();

                    // thumbnail_data와 thumbnail_mime 설정 (안전한 타입 체크)
                    if (row.length > 9 && row[9] != null && row[9] instanceof byte[]) {
                        region.setThumbnailData((byte[]) row[9]);
                    }
                    if (row.length > 10 && row[10] != null && row[10] instanceof String) {
                        region.setThumbnailMime((String) row[10]);
                    }

                    // thumbnailUrl 처리 - Base64와 URL 모두 지원
                    String thumbnailUrl = region.getThumbnailUrl();
                    if (thumbnailUrl != null && !thumbnailUrl.trim().isEmpty()) {
                        if (thumbnailUrl.startsWith("data:image/")) {
                            // Base64 데이터는 그대로 사용
                        } else if (thumbnailUrl.startsWith("http")) {
                            // 외부 URL은 그대로 사용
                        } else if (thumbnailUrl.startsWith("/")) {
                            // 절대 경로는 그대로 사용
                        } else if (thumbnailUrl.startsWith("uploads/")) {
                            // uploads/로 시작하는 경우 / 추가
                            region.setThumbnailUrl("/" + thumbnailUrl);
                        } else {
                            // 상대 경로인 경우 /uploads/ 추가
                            region.setThumbnailUrl("/uploads/" + thumbnailUrl);
                        }
                    }

                    // @Transient 필드들 설정
                    region.setTitle((String) row[1]);    // title 필드
                    region.setStatus((String) row[6]);   // status 필드

                    return region;
                })
                .collect(Collectors.toList());
    }
}