package com.apiround.greenhub.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.apiround.greenhub.entity.Region;
import com.apiround.greenhub.repository.RegionRepository;

@Service
public class RegionService {

    private final RegionRepository regionRepository;

    public RegionService(RegionRepository regionRepository) {
        this.regionRepository = regionRepository;
    }

    // 모든 특산품 조회
    public List<Region> getAllProducts() {
        return regionRepository.findAll();
    }

    // 타입별 조회
    public List<Region> getProductsByType(String productType) {
        return regionRepository.findByProductType(productType);
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

    // ID로 상품 조회
    public Region getProductById(Integer id) {
        return regionRepository.findById(id).orElse(null);
    }

    // 이번달 특산품 조회 (더 정확한 월별 검색)
    public List<Region> getCurrentMonthProducts(int month) {
        // 월별 특산품 조회 (harvestSeason에 해당 월이 포함된 상품들)
        return regionRepository.findByHarvestSeasonContaining(String.valueOf(month));
    }
}
