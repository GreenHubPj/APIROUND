package com.apiround.greenhub.delivery.repository;

import com.apiround.greenhub.web.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DeliveryQueryRepository extends JpaRepository<OrderItem, Integer> {

    @Query("""
        select oi.itemStatus, count(oi)
          from OrderItem oi
         where oi.companyId = :companyId
           and (oi.isDeleted = false or oi.isDeleted is null)
         group by oi.itemStatus
    """)
    List<Object[]> countByStatusForCompany(Integer companyId);
}
