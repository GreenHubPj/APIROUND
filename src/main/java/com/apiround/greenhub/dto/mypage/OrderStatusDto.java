package com.apiround.greenhub.dto.mypage;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderStatusDto {
    private int orderReceived;     // 주문접수
    private int paymentCompleted;  // 결제완료
    private int preparingProduct;  // 상품준비중
    private int shipping;          // 배송중
    private int deliveryCompleted; // 배송완료

    public OrderStatusDto() {
        this.orderReceived = 0;
        this.paymentCompleted = 0;
        this.preparingProduct = 0;
        this.shipping = 0;
        this.deliveryCompleted = 0;
    }
}
