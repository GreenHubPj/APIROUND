package com.apiround.greenhub.delivery.service;

import com.apiround.greenhub.delivery.dto.DeliverySummaryDto;
import com.apiround.greenhub.delivery.repository.DeliveryQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DeliverySummaryServiceImpl implements DeliverySummaryService {

    private final DeliveryQueryRepository deliveryQueryRepository;

    @Override
    public DeliverySummaryDto getSummaryForCompany(Integer companyId) {
        List<Object[]> rows = deliveryQueryRepository.countByStatusForCompany(companyId);

        long preparing = 0, shipping = 0, completed = 0, returned = 0;

        for (Object[] r : rows) {
            String status = (String) r[0]; // enum이 DB에 문자열로 저장됨
            long cnt = ((Number) r[1]).longValue();
            String s = status == null ? "PREPARING" : status.toUpperCase(Locale.ROOT);

            switch (s) {
                case "SHIPPED"    -> shipping += cnt;
                case "DELIVERED"  -> completed += cnt;
                case "CANCELLED", "CANCEL_REQUESTED", "REFUND_REQUESTED", "REFUNDED" -> returned += cnt;
                default           -> preparing += cnt; // NEW/PAID/PREPARING 등은 준비중으로 묶기
            }
        }
        return new DeliverySummaryDto(preparing, shipping, completed, returned);
    }
}
