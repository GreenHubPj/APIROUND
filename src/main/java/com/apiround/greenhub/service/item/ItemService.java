package com.apiround.greenhub.service.item;

import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.entity.item.Region;
import com.apiround.greenhub.repository.item.ProductPriceOptionRepository;
import com.apiround.greenhub.repository.item.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final RegionRepository regionRepository;
    private final ProductPriceOptionRepository optionRepository;

    @Transactional
    public Integer saveProductWithOptions(
            Region region,
            List<String> optionLabel,
            List<Integer> quantity,
            List<String> unit,
            List<Integer> price,
            List<Integer> months) {
        // 1) 상품 저장
        Region saved = regionRepository.save(region);
        Integer productId = saved.getProductId();

        // 2) 옵션들 저장 (빈값/길이 불일치 방지)
        int n = price == null ? 0 : price.size();
        List<ProductPriceOption> bulk = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            // 입력칸이 비어 있을 수 있으니 방어
            if (price.get(i) == null) continue;

            ProductPriceOption opt = ProductPriceOption.builder()
                    .productId(productId)
                    .optionLabel(safeGet(optionLabel, i))
                    .quantity(safeGet(quantity, i))
                    .unit(safeGet(unit, i))
                    .price(price.get(i))
                    .build();
            bulk.add(opt);
        }
        if (!bulk.isEmpty()) optionRepository.saveAll(bulk);

        return productId;
    }

    private <T> T safeGet(List<T> list, int idx) {
        return (list != null && idx < list.size()) ? list.get(idx) : null;
    }
}