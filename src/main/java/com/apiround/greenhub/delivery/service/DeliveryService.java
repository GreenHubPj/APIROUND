// src/main/java/com/apiround/greenhub/delivery/service/DeliveryService.java
package com.apiround.greenhub.delivery.service;

public interface DeliveryService {
    void updateStatus(Integer orderItemId, Integer companyId, String nextStatus);
}
