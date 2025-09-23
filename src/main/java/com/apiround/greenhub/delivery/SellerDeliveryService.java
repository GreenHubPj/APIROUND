// src/main/java/com/apiround/greenhub/delivery/SellerDeliveryService.java
package com.apiround.greenhub.delivery;

public interface SellerDeliveryService {

    /**
     * 판매사(companyId) 관점에서 주문(번호 또는 PK)의 상태를 저장한다.
     * - 해당 주문의 "해당 판매사 아이템들"의 itemStatus를 갱신
     * - 주문(Order) 상태도 단계가 올라가는 방향으로만 보정 (선택적)
     * @return true 저장성공
     */
    boolean updateOrderStatusForVendor(Integer companyId, String idOrNumber, String uiStatus);
}
