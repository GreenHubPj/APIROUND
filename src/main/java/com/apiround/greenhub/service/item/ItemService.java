package com.apiround.greenhub.service.item;

import com.apiround.greenhub.dto.RegionDetailDto;
import com.apiround.greenhub.dto.RegionDto;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.repository.item.ProductPriceOptionRepository;
import com.apiround.greenhub.repository.item.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final RegionRepository regionRepository;
    private final ProductPriceOptionRepository optionRepository;

    /** 상품 + 옵션 저장 */
    @Transactional
    public Integer saveProductWithOptions(
            Region region,
            List<String> optionLabel,
            List<Integer> quantity,
            List<String> unit,
            List<Integer> price,
            List<Integer> months
    ) {
        // (선택) months → harvestSeason 세팅
        if (months != null && !months.isEmpty()) {
            // "1,2,3" 형태로 저장 (원하면 "1월,2월..." 로 바꿔도 됨)
            region.setHarvestSeason(months.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(",")));
        }

        // 1) 상품 저장
        Region saved = regionRepository.save(region);
        Integer productId = saved.getProductId();

        // 2) 옵션들 저장
        int n = (price == null) ? 0 : price.size();
        List<ProductPriceOption> bulk = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            Integer p = price.get(i);
            if (p == null) continue; // 가격 없는 행은 스킵

            ProductPriceOption opt = ProductPriceOption.builder()
                    .productId(productId)
                    .optionLabel(safeGet(optionLabel, i))
                    .quantity(safeGet(quantity, i))
                    .unit(safeGet(unit, i))
                    .price(p)
                    .build();
            bulk.add(opt);
        }
        if (!bulk.isEmpty()) {
            optionRepository.saveAll(bulk); // ✅ 인스턴스 호출
        }

        return productId;
    }

    private <T> T safeGet(List<T> list, int idx) {
        return (list != null && idx < list.size()) ? list.get(idx) : null;
    }

    /** 상세 페이지용 */
    @Transactional(readOnly = true)
    public RegionDetailDto getProductDetail(Integer productId) {
        Region region = regionRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + productId));

        List<ProductPriceOption> options =
                optionRepository.findByProductIdOrderByPriceAsc(productId); // ✅ 인스턴스 호출

        return new RegionDetailDto(region, options);
    }

    /** 목록 페이지용 (각 상품의 최저가 포함) */
    @Transactional(readOnly = true)
    public List<RegionDto> getProductList() {
        List<Region> products = regionRepository.findAll();
        if (products.isEmpty()) return List.of();

        List<Integer> ids = products.stream()
                .map(Region::getProductId)
                .toList();

        Map<Integer, Integer> minPriceMap = optionRepository // ✅ 인스턴스 호출
                .findMinPriceByProductIds(ids)
                .stream()
                .collect(Collectors.toMap(
                        ProductPriceOptionRepository.MinPriceView::getProductId,
                        ProductPriceOptionRepository.MinPriceView::getMinPrice
                ));

        return products.stream()
                .map(r -> new RegionDto(
                        r.getProductId(),
                        r.getProductName(),
                        r.getProductType(),
                        r.getRegionText(),
                        r.getThumbnailUrl(),
                        r.getHarvestSeason(),
                        minPriceMap.getOrDefault(r.getProductId(), 0)
                ))
                .toList();
    }
}
