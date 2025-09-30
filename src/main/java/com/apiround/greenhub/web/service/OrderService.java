package com.apiround.greenhub.web.service;

import java.util.List;

import com.apiround.greenhub.web.dto.CheckoutRequest;
import com.apiround.greenhub.web.dto.OrderCreatedResponse;
import com.apiround.greenhub.web.dto.OrderDetailDto;
import com.apiround.greenhub.web.dto.OrderSummaryDto;

public interface OrderService {
    OrderCreatedResponse createOrder(CheckoutRequest req, Integer userId);
    List<OrderSummaryDto> findMyOrders(Integer userId);
    OrderDetailDto findMyOrderDetail(String idOrNumber, Integer userId);
    boolean updateOrderStatus(String orderNumber, String newStatus);
}
