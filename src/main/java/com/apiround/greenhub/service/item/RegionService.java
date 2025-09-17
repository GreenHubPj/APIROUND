package com.apiround.greenhub.service.item;

import java.util.List;

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
        return regionRepository.findRandomByRegionText(regionText, excludeId, limit);
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

    // 중지 상태인 상품만 조회 (내림차순 정렬)
    public List<Region> getStoppedProductsOrderByProductIdDesc() {
        return regionRepository.findStoppedProductsOrderByProductIdDesc();
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

    // 타입별 조회 (내림차순 정렬)
    public List<Region> getProductsByTypeOrderByProductIdDesc(String productType) {
        return regionRepository.findByProductTypeOrderByProductIdDesc(productType);
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
        switch (regionCode) {
            case "seoul":
                return regionRepository.findByRegionVariations("서울", "서울특별시", "서울시");
            case "gyeonggi":
                return regionRepository.findByRegionVariations("경기", "경기도", "경기시");
            case "incheon":
                return regionRepository.findByRegionVariations("인천", "인천광역시", "인천시");
            case "gangwon":
                return regionRepository.findByRegionVariations("강원", "강원도", "강원시");
            case "chungbuk":
                return regionRepository.findByRegionVariations("충북", "충청북도", "충북시");
            case "chungnam":
                return regionRepository.findByRegionVariations("충남", "충청남도", "충남시");
            case "daejeon":
                return regionRepository.findByRegionVariations("대전", "대전광역시", "대전시");
            case "jeonbuk":
                return regionRepository.findByRegionVariations("전북", "전라북도", "전북시");
            case "jeonnam":
                return regionRepository.findByRegionVariations("전남", "전라남도", "전남시");
            case "gwangju":
                return regionRepository.findByRegionVariations("광주", "광주광역시", "광주시");
            case "gyeongbuk":
                return regionRepository.findByRegionVariations("경북", "경상북도", "경북시");
            case "gyeongnam":
                return regionRepository.findByRegionVariations("경남", "경상남도", "경남시");
            case "daegu":
                return regionRepository.findByRegionVariations("대구", "대구광역시", "대구시");
            case "ulsan":
                return regionRepository.findByRegionVariations("울산", "울산광역시", "울산시");
            case "busan":
                return regionRepository.findByRegionVariations("부산", "부산광역시", "부산시");
            case "jeju":
                return regionRepository.findByRegionVariations("제주", "제주도", "제주특별자치도");
            default:
                return regionRepository.findByRegionLike(regionCode);
        }
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
}
