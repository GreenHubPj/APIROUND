// src/main/java/com/apiround/greenhub/web/service/VendorOrderService.java
package com.apiround.greenhub.web.service;

import com.apiround.greenhub.web.dto.VendorOrderDashboardDto;
import com.apiround.greenhub.web.dto.vendor.VendorOrderDetailDto;
import com.apiround.greenhub.web.dto.vendor.VendorOrderSummaryDto;

import java.time.LocalDate;
import java.util.List;

public interface VendorOrderService {
    List<VendorOrderSummaryDto> findMyOrders(Integer companyId);
    VendorOrderDetailDto findMyOrderDetail(String idOrNumber, Integer companyId);

    // ✅ 대시보드 데이터
    VendorOrderDashboardDto loadDashboard(Integer companyId, LocalDate start, LocalDate end);

    void updateItemStatus(Integer companyId, Integer orderItemId, String nextStatus,
                          String courierName, String trackingNumber);

    void updateAllMyItemsOfOrder(Integer companyId, Integer orderId, String nextStatus,
                                 String courierName, String trackingNumber);
}
