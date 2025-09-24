// src/main/java/com/apiround/greenhub/delivery/DeliveryStatusMapper.java
package com.apiround.greenhub.delivery;

public final class DeliveryStatusMapper {
    private DeliveryStatusMapper() {}

    /** UI 상태(preparing/shipping/completed)를 DB 주문/아이템 상태로 */
    public static String toOrderDb(String ui) {
        if (ui == null) return "PREPARING";
        switch (ui.toLowerCase()) {
            case "shipping":  return "SHIPPED";
            case "completed": return "DELIVERED";
            default:          return "PREPARING";
        }
    }

    public static String toItemDb(String ui) {
        // 아이템은 간단히 주문과 동일 코드 사용
        return toOrderDb(ui);
    }
}
