package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Integer> {
}
