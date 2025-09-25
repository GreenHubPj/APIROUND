// src/main/java/com/apiround/greenhub/delivery/service/DeliveryServiceImpl.java
package com.apiround.greenhub.delivery.service;

import com.apiround.greenhub.delivery.push.OrderStatusBroadcaster;
import com.apiround.greenhub.delivery.push.OrderStatusPush;
import com.apiround.greenhub.delivery.repository.OrderStatusHistoryJdbc;
import com.apiround.greenhub.entity.Order;
import com.apiround.greenhub.repository.OrderRepository;
import com.apiround.greenhub.web.entity.OrderItem;
import com.apiround.greenhub.web.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DeliveryServiceImpl implements DeliveryService {

    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryJdbc historyJdbc;
    private final OrderRepository orderRepository;
    private final OrderStatusBroadcaster broadcaster; // ★ 추가

    @Override
    @Transactional
    public void updateStatus(Integer orderItemId, Integer companyId, String nextStatus) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문 아이템을 찾을 수 없습니다."));
        if (!item.getCompanyId().equals(companyId)) {
            throw new IllegalArgumentException("해당 업체의 주문이 아닙니다.");
        }

        String to   = normalize(nextStatus);
        String from = normalize(item.getItemStatus());

        // 1) 아이템 상태
        item.setItemStatus(to);
        item.setUpdatedAt(LocalDateTime.now());
        orderItemRepository.save(item);

        // 2) 이력
        historyJdbc.insert(
                item.getOrder().getOrderId(),
                item.getOrderItemId(),
                from, to, "sellerDelivery"
        );

        // 3) 주문 상태 상향 반영
        Order order = orderRepository.findById(item.getOrder().getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
        String before = normalize(order.getStatus());
        String raised = raise(before, to);
        if (!raised.equals(before)) {
            order.setStatus(raised);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
        }

        // 4) SSE 브로드캐스트 (고객주문 페이지 버튼 동기화)
        String orderNo = (order.getOrderNumber() != null) ? order.getOrderNumber() : String.valueOf(order.getOrderId());
        String ui = toUi(raised); // "preparing" | "shipping" | "completed" | "cancelled"
        broadcaster.send(companyId, new OrderStatusPush(orderNo, ui));
    }

    private String normalize(String s) {
        if (s == null) return "PREPARING";
        return s.trim().toUpperCase(Locale.ROOT);
    }

    private String raise(String cur, String cand) {
        return (rank(cand) > rank(cur)) ? cand : cur;
    }

    private int rank(String s) {
        if (s == null) return 0;
        return switch (s.toUpperCase(Locale.ROOT)) {
            case "SHIPPED"   -> 1;
            case "DELIVERED" -> 2;
            case "PREPARING", "PENDING", "PAID" -> 0;
            default -> -1;
        };
    }

    private String toUi(String db) {
        if (db == null) return "preparing";
        return switch (db.toUpperCase(Locale.ROOT)) {
            case "DELIVERED" -> "completed";
            case "SHIPPED"   -> "shipping";
            case "CANCELLED", "CANCEL_REQUESTED", "REFUND_REQUESTED", "REFUNDED" -> "cancelled";
            default -> "preparing";
        };
    }
}
