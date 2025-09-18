package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Integer userId);
}
