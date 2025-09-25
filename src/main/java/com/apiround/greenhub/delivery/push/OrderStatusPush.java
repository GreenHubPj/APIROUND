// src/main/java/com/apiround/greenhub/delivery/push/OrderStatusPush.java
package com.apiround.greenhub.delivery.push;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class OrderStatusPush {
    private String orderNumber; // 예: "ORD-20250924172540" (없으면 orderId 문자열)
    private String uiStatus;    // "preparing" | "shipping" | "completed" | "cancelled"
}
