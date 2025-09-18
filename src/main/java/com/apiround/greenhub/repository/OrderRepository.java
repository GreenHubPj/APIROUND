// src/main/java/com/apiround/greenhub/repository/OrderRepository.java
package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Integer userId);

    // ✅ false 또는 null 모두 포함
    @Query("""
        select o
          from Order o
         where o.userId = :userId
           and (o.isDeleted = false or o.isDeleted is null)
         order by o.createdAt desc
    """)
    List<Order> findActiveByUser(@Param("userId") Integer userId);
}
