package com.apiround.greenhub.web.repository;

import com.apiround.greenhub.web.entity.UserOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserOrderRepository extends JpaRepository<UserOrder, Integer> {

    List<UserOrder> findByUserIdOrderByIdDesc(Integer userId);

    UserOrder findByOrderNumber(String orderNumber);
}
