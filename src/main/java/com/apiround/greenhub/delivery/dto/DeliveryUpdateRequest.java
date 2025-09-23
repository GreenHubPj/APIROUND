// src/main/java/com/apiround/greenhub/delivery/dto/DeliveryUpdateRequest.java
package com.apiround.greenhub.delivery.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class DeliveryUpdateRequest {
    private String nextStatus; // e.g. PREPARING, SHIPPED, DELIVERED
}
