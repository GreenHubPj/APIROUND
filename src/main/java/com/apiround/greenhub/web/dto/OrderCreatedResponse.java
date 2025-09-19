package com.apiround.greenhub.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderCreatedResponse {
    private Integer orderId;
    private String redirectUrl; // 예: "/orderhistory"
}
