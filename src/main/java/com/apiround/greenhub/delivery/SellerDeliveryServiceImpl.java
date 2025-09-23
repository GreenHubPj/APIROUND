// src/main/java/com/apiround/greenhub/delivery/SellerDeliveryServiceImpl.java
package com.apiround.greenhub.delivery;

import com.apiround.greenhub.entity.Order;
import com.apiround.greenhub.repository.OrderRepository;
import com.apiround.greenhub.web.entity.OrderItem;
import com.apiround.greenhub.web.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SellerDeliveryServiceImpl implements SellerDeliveryService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional
    public boolean updateOrderStatusForVendor(Integer companyId, String idOrNumber, String uiStatus) {
        if (companyId == null) throw new IllegalStateException("판매사 로그인 필요");
        if (!StringUtils.hasText(idOrNumber)) throw new IllegalArgumentException("주문 식별자 없음");
        if (!StringUtils.hasText(uiStatus)) throw new IllegalArgumentException("상태값 없음");

        Order order = resolveOrderByIdOrNumber(idOrNumber)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        // 해당 판매사의 아이템만 상태 업데이트
        List<OrderItem> items = orderItemRepository
                .findByCompanyIdAndOrder_OrderIdAndIsDeletedFalse(companyId, order.getOrderId());
        if (items.isEmpty()) {
            throw new IllegalArgumentException("해당 판매사의 주문이 아닙니다.");
        }

        String itemDb = DeliveryStatusMapper.toItemDb(uiStatus);
        LocalDateTime now = LocalDateTime.now();
        for (OrderItem it : items) {
            it.setItemStatus(itemDb);
            it.setUpdatedAt(now);
        }
        orderItemRepository.saveAll(items);

        // 주문 상태도 보정(선택): PREPARING -> SHIPPED -> DELIVERED 진행만 허용
        String newOrderDb = DeliveryStatusMapper.toOrderDb(uiStatus);
        order.setStatus(raiseOrderStatus(order.getStatus(), newOrderDb));
        order.setUpdatedAt(now);
        orderRepository.save(order);

        return true;
    }

    private Optional<Order> resolveOrderByIdOrNumber(String idOrNumber) {
        try {
            if (idOrNumber != null && idOrNumber.startsWith("ORD-")) {
                return orderRepository.findByOrderNumber(idOrNumber);
            }
            Integer pk = Integer.valueOf(idOrNumber);
            return orderRepository.findById(pk);
        } catch (NumberFormatException ignore) {
            return orderRepository.findByOrderNumber(idOrNumber);
        }
    }

    /** 상태 상향만 허용 */
    private String raiseOrderStatus(String current, String next) {
        int cur = rank(current);
        int nx  = rank(next);
        return (nx > cur) ? next : current;
    }

    private int rank(String s) {
        if (s == null) return 0; // PREPARING
        switch (s.toUpperCase()) {
            case "SHIPPED":   return 1;
            case "DELIVERED": return 2;
            default:          return 0; // PREPARING/NEW/CONFIRMED 등은 0으로 취급
        }
    }
}
