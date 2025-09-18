package com.apiround.greenhub.web.repository;

import com.apiround.greenhub.web.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    // ✅ 올바른 경로 탐색: order(연관) → orderId(PK)
    List<OrderItem> findByOrder_OrderIdIn(Collection<Integer> orderIds);

    // 선택: 단일 주문 아이템 조회가 필요한 레거시 코드 호환용
    List<OrderItem> findByOrder_OrderId(Integer orderId);
}
