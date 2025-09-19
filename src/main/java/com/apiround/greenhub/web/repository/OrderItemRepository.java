// src/main/java/com/apiround/greenhub/web/repository/OrderItemRepository.java
package com.apiround.greenhub.web.repository;

import com.apiround.greenhub.web.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    // ✅ 기존: 주문 PK 목록으로 아이템 조회
    List<OrderItem> findByOrder_OrderIdIn(Collection<Integer> orderIds);

    // ✅ 기존: 단일 주문 PK로 아이템 조회
    List<OrderItem> findByOrder_OrderId(Integer orderId);

    // ===== 벤더(판매사) 전용 조회 메서드 - 기존 로직 영향 없음 =====

    // 판매사별(회사) 최신 주문순으로 아이템 조회 (order.createdAt 기준 정렬)
    List<OrderItem> findByCompanyIdAndIsDeletedFalseOrderByOrder_CreatedAtDesc(Integer companyId);

    // 판매사별 + 특정 주문(PK) 아이템만
    List<OrderItem> findByCompanyIdAndOrder_OrderIdAndIsDeletedFalse(Integer companyId, Integer orderId);

    // 판매사별 + 특정 주문(주문번호) 아이템만
    List<OrderItem> findByCompanyIdAndOrder_OrderNumberAndIsDeletedFalse(Integer companyId, String orderNumber);

    // 판매사별 + 여러 주문 PK 묶음 아이템들
    List<OrderItem> findByCompanyIdAndOrder_OrderIdInAndIsDeletedFalse(Integer companyId, Collection<Integer> orderIds);

    // (선택) 주문/아이템이 삭제되지 않은(active) 것만 안전하게 조인 조회 + 정렬
    @Query("""
        select oi
          from OrderItem oi
          join oi.order o
         where oi.companyId = :companyId
           and (oi.isDeleted = false or oi.isDeleted is null)
           and (o.isDeleted = false or o.isDeleted is null)
         order by o.createdAt desc
    """)
    List<OrderItem> findActiveByCompanyOrderByOrderCreatedDesc(@Param("companyId") Integer companyId);
}
