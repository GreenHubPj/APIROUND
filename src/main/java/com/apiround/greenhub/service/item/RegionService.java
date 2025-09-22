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
        if (regionText == null || regionText.isBlank() || limit <= 0) {
            return List.of();
        }
        List<Object[]> results = regionRepository.findRandomByRegionText(regionText, excludeId, limit);
        return convertObjectArrayToRegion(results);
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

    // UNION을 사용하여 product_listing과 specialty_product를 조합하여 조회
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
        // 기본값 설정 (실제 데이터가 없을 때 사용)
        product.setCompanyName("문경이좋아");
        product.setCompanyEmail("monkyeon@naver.com");
        product.setCompanyPhone("053-555-444");
        
        // TODO: 실제 업체 정보를 ProductListing을 통해 가져오는 로직 추가
        // 현재는 기본값으로 설정
        // 추후 ProductListing과 Company를 조인하여 실제 업체 정보를 가져올 수 있음
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
                
                
                // thumbnailUrl 처리 - 다양한 형식 지원
                if (region.getThumbnailUrl() != null && !region.getThumbnailUrl().startsWith("http")) {
                    String originalUrl = region.getThumbnailUrl();
                    
                    if (originalUrl.startsWith("/")) {
                        // 이미 /로 시작하는 경우 그대로 사용
                    } else if (originalUrl.startsWith("uploads/")) {
                        // uploads/로 시작하는 경우 / 추가
                        region.setThumbnailUrl("/" + originalUrl);
                    } else {
                        // 상대 경로인 경우 /uploads/ 추가
                        region.setThumbnailUrl("/uploads/" + originalUrl);
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
