// src/main/java/com/apiround/greenhub/web/repository/OrderItemRepository.java
package com.apiround.greenhub.web.repository;

import com.apiround.greenhub.web.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    /** 판매사 대시보드/목록용: 해당 판매사 아이템들을 주문 생성일 내림차순으로 */
    @Query("""
        select oi
          from OrderItem oi
          join oi.order o
         where oi.companyId = :companyId
           and (oi.isDeleted = false or oi.isDeleted is null)
           and (o.isDeleted  = false or o.isDeleted  is null)
         order by o.createdAt desc
    """)
    List<OrderItem> findActiveByCompanyOrderByOrderCreatedDesc(@Param("companyId") Integer companyId);

    /** 판매사 주문 상세/상태변경용: 특정 주문의 해당 판매사 아이템들 */
    @Query("""
        select oi
          from OrderItem oi
          join oi.order o
         where oi.companyId = :companyId
           and o.orderId     = :orderId
           and (oi.isDeleted = false or oi.isDeleted is null)
    """)
    List<OrderItem> findByCompanyAndOrder(@Param("companyId") Integer companyId, @Param("orderId") Integer orderId);

    /** 마이리뷰: 로그인 사용자의 배송완료 아이템(미삭제) – 최신 주문순 */
    @Query("""
        select oi
          from OrderItem oi
          join oi.order o
         where o.userId = :userId
           and upper(coalesce(oi.itemStatus,'')) in ('DELIVERED','DELIVERY_COMPLETED','COMPLETED')
           and (oi.isDeleted = false or oi.isDeleted is null)
           and (o.isDeleted  = false or o.isDeleted  is null)
         order by o.createdAt desc
    """)
    List<OrderItem> findDeliveredByUser(@Param("userId") Integer userId);

    /** 마이리뷰: 해당 사용자의 특정 orderItem 단건(권한 검증용) */
    @Query("""
        select oi
          from OrderItem oi
          join oi.order o
         where o.userId = :userId
           and oi.orderItemId = :orderItemId
           and (oi.isDeleted = false or oi.isDeleted is null)
           and (o.isDeleted  = false or o.isDeleted  is null)
    """)
    OrderItem findByUserAndOrderItem(@Param("userId") Integer userId, @Param("orderItemId") Integer orderItemId);

    /** 마이리뷰: 사용자+상품 기준 가장 최근 구매 아이템(여러 건 필요하면 상위 N개 반환) */
    @Query("""
        select oi
          from OrderItem oi
          join oi.order o
         where o.userId     = :userId
           and oi.productId = :productId
           and (oi.isDeleted = false or oi.isDeleted is null)
           and (o.isDeleted  = false or o.isDeleted  is null)
         order by o.createdAt desc
    """)
    List<OrderItem> findLatestByUserAndProduct(@Param("userId") Integer userId, @Param("productId") Integer productId);
}
