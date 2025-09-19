package com.apiround.greenhub.web.service;

import com.apiround.greenhub.web.dto.CheckoutRequest;
import com.apiround.greenhub.web.dto.OrderCreatedResponse;
import com.apiround.greenhub.web.dto.OrderSummaryDto;

import java.util.List;

public interface OrderService {
    OrderCreatedResponse createOrder(CheckoutRequest req, Integer userId);
    List<OrderSummaryDto> findMyOrders(Integer userId);
}
