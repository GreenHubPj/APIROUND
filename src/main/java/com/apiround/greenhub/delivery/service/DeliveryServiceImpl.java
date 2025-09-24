package com.apiround.greenhub.delivery.service;

import com.apiround.greenhub.delivery.repository.OrderStatusHistoryJdbc;
import com.apiround.greenhub.web.entity.OrderItem;
// ✅ OrderItemRepository 올바른 패키지로 임포트
import com.apiround.greenhub.web.repository.OrderItemRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeliveryServiceImpl implements DeliveryService {

    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryJdbc historyJdbc; // ★ 추가

    @Override
    @Transactional
    public void updateStatus(Integer orderItemId, Integer companyId, String nextStatus) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문 아이템을 찾을 수 없습니다."));

        if (!item.getCompanyId().equals(companyId)) {
            throw new IllegalArgumentException("해당 업체의 주문이 아닙니다.");
        }

        String from = item.getItemStatus();
        item.setItemStatus(nextStatus); // PREPARING → SHIPPED → DELIVERED
        orderItemRepository.save(item);

        // ★ 이력 저장
        historyJdbc.insert(
                item.getOrder().getOrderId(),
                item.getOrderItemId(),
                from,
                nextStatus,
                "sellerDelivery"
        );
    }
}
