// src/main/java/com/apiround/greenhub/web/service/VendorOrderServiceImpl.java
package com.apiround.greenhub.web.service;

import com.apiround.greenhub.entity.Order;
import com.apiround.greenhub.entity.ProductListing;
import com.apiround.greenhub.entity.item.SpecialtyProduct;
import com.apiround.greenhub.repository.OrderRepository;
import com.apiround.greenhub.repository.ProductListingRepository;
import com.apiround.greenhub.repository.item.SpecialtyProductRepository;
import com.apiround.greenhub.web.dto.VendorOrderDashboardDto;
import com.apiround.greenhub.web.dto.vendor.VendorOrderDetailDto;
import com.apiround.greenhub.web.dto.vendor.VendorOrderSummaryDto;
import com.apiround.greenhub.web.entity.OrderItem;
import com.apiround.greenhub.web.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional // 기본 R/W 트랜잭션
public class VendorOrderServiceImpl implements VendorOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductListingRepository productListingRepository;
    private final SpecialtyProductRepository specialtyProductRepository;

    /* ========================================================================
     * 판매자가 개별 아이템 상태 변경
     * ====================================================================== */
    @Override
    public void updateItemStatus(Integer companyId, Integer orderItemId, String nextStatus,
                                 String courierName, String trackingNumber) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));

        // 내 회사의 아이템인지 확인
        if (!Objects.equals(item.getCompanyId(), companyId)) {
            throw new IllegalArgumentException("본인 아이템만 변경할 수 있습니다.");
        }

        String ns = normalizeStatus(nextStatus); // PREPARING / SHIPPED / DELIVERED
        if (!List.of("PREPARING","SHIPPED","DELIVERED").contains(ns)) {
            throw new IllegalArgumentException("허용되지 않는 상태값입니다.");
        }

        item.setItemStatus(ns);
        if (courierName != null) item.setCourierName(courierName);
        if (trackingNumber != null) item.setTrackingNumber(trackingNumber);
        item.setUpdatedAt(LocalDateTime.now());

        orderItemRepository.save(item);

        // 부모 주문 상태 집계
        aggregateOrderStatus(item.getOrder().getOrderId());
    }

    /* ========================================================================
     * 판매자가 특정 주문의 "내 아이템 전부" 상태 일괄 변경
     * ====================================================================== */
    @Override
    public void updateAllMyItemsOfOrder(Integer companyId, Integer orderId, String nextStatus,
                                        String courierName, String trackingNumber) {
        if (companyId == null || orderId == null) {
            throw new IllegalArgumentException("companyId, orderId는 필수입니다.");
        }

        String ns = normalizeStatus(nextStatus);
        if (!List.of("PREPARING","SHIPPED","DELIVERED").contains(ns)) {
            throw new IllegalArgumentException("허용되지 않는 상태값입니다.");
        }

        // 해당 주문에서 내 회사의 아이템들만
        List<OrderItem> myItems = orderItemRepository
                .findByCompanyIdAndOrder_OrderIdAndIsDeletedFalse(companyId, orderId);

        if (myItems.isEmpty()) {
            throw new IllegalArgumentException("변경할 아이템이 없습니다. (다른 판매사 주문이거나 빈 주문)");
        }

        LocalDateTime now = LocalDateTime.now();
        for (OrderItem oi : myItems) {
            oi.setItemStatus(ns);
            if (courierName != null) oi.setCourierName(courierName);
            if (trackingNumber != null) oi.setTrackingNumber(trackingNumber);
            oi.setUpdatedAt(now);
        }
        orderItemRepository.saveAll(myItems);

        // 부모 주문 상태 집계
        aggregateOrderStatus(orderId);
    }

    /** 입력 상태 문자열을 상수형 코드로 정규화 */
    private String normalizeStatus(String s) {
        if (s == null) return "PREPARING";
        String v = s.trim().toUpperCase(Locale.ROOT);
        // 한글/약칭 대응
        switch (v) {
            case "배송중": case "배송 중": case "SHIPPING":  return "SHIPPED";
            case "배송완료": case "완료": case "COMPLETED":   return "DELIVERED";
            case "준비중": case "준비 중":                    return "PREPARING";
            default:                                          return v; // 이미 코드면 그대로
        }
    }

    /**
     * 같은 주문의 모든 아이템 상태를 보고 부모 주문(orders.status)을 갱신.
     * 규칙:
     *  - 모두 DELIVERED -> DELIVERED
     *  - 그 외에 SHIPPED가 하나라도 있으면 -> SHIPPED
     *  - 그 외 -> PREPARING
     */
    private void aggregateOrderStatus(Integer orderId) {
        List<OrderItem> items = orderItemRepository.findByOrder_OrderId(orderId);
        if (items.isEmpty()) return;

        boolean allDelivered = items.stream()
                .allMatch(i -> "DELIVERED".equalsIgnoreCase(nvl(i.getItemStatus())));
        boolean anyShipped = items.stream()
                .anyMatch(i -> "SHIPPED".equalsIgnoreCase(nvl(i.getItemStatus())));

        String parent;
        if (allDelivered) parent = "DELIVERED";
        else if (anyShipped) parent = "SHIPPED";
        else parent = "PREPARING";

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("부모 주문을 찾을 수 없습니다."));
        order.setStatus(parent);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private static String nvl(String s) { return s == null ? "" : s; }

    /* ========================================================================
     * 판매사 - 주문 리스트
     * ====================================================================== */
    @Override
    @Transactional(readOnly = true)
    public List<VendorOrderSummaryDto> findMyOrders(Integer companyId) {
        if (companyId == null) throw new IllegalStateException("판매사 로그인 정보가 없습니다.");

        List<OrderItem> rows = orderItemRepository.findActiveByCompanyOrderByOrderCreatedDesc(companyId);
        if (rows.isEmpty()) return List.of();

        LinkedHashSet<Integer> orderedIds = rows.stream()
                .map(oi -> oi.getOrder().getOrderId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<Order> orders = orderRepository.findAllById(orderedIds);
        Map<Integer, Order> orderMap = orders.stream()
                .collect(Collectors.toMap(Order::getOrderId, o -> o));

        Set<Integer> listingIds = rows.stream().map(OrderItem::getListingId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Integer> productIds = rows.stream().map(OrderItem::getProductId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<Integer, ProductListing> listingMap = listingIds.isEmpty()
                ? Map.of()
                : ((List<ProductListing>) productListingRepository.findAllById(listingIds))
                .stream().collect(Collectors.toMap(ProductListing::getListingId, x -> x));

        Map<Integer, SpecialtyProduct> productMap = productIds.isEmpty()
                ? Map.of()
                : specialtyProductRepository.findAllById(productIds)
                .stream().collect(Collectors.toMap(SpecialtyProduct::getProductId, x -> x));

        Map<Integer, List<OrderItem>> itemsByOrder = rows.stream()
                .collect(Collectors.groupingBy(oi -> oi.getOrder().getOrderId(), LinkedHashMap::new, Collectors.toList()));

        List<VendorOrderSummaryDto> result = new ArrayList<>();
        for (Integer oid : orderedIds) {
            Order o = orderMap.get(oid);
            if (o == null) continue;

            List<OrderItem> vendorItems = itemsByOrder.getOrDefault(oid, List.of());

            BigDecimal vendorSubtotal = BigDecimal.ZERO;
            List<VendorOrderSummaryDto.Item> dtoItems = new ArrayList<>();

            for (OrderItem r : vendorItems) {
                String image = null;
                if (r.getListingId() != null) {
                    ProductListing l = listingMap.get(r.getListingId());
                    if (l != null && StringUtils.hasText(l.getThumbnailUrl())) image = l.getThumbnailUrl();
                }
                if (image == null && r.getProductId() != null) {
                    SpecialtyProduct sp = productMap.get(r.getProductId());
                    if (sp != null && StringUtils.hasText(sp.getThumbnailUrl())) image = sp.getThumbnailUrl();
                }
                if (image == null) image = "/images/농산물.png";

                String name = StringUtils.hasText(r.getProductNameSnap())
                        ? r.getProductNameSnap()
                        : (r.getProductId() != null && productMap.get(r.getProductId()) != null
                        ? productMap.get(r.getProductId()).getProductName()
                        : "상품");

                BigDecimal line = nz(r.getLineAmount());
                vendorSubtotal = vendorSubtotal.add(line);

                dtoItems.add(VendorOrderSummaryDto.Item.builder()
                        .name(name)
                        .image(image)
                        .quantity(r.getQuantity() == null ? 0 : r.getQuantity().intValue())
                        .unit(r.getUnitCodeSnap())
                        .optionText(r.getOptionLabelSnap())
                        .price(line)
                        .build());
            }

            result.add(VendorOrderSummaryDto.builder()
                    .id(o.getOrderNumber() != null ? o.getOrderNumber() : String.valueOf(o.getOrderId()))
                    .date(o.getCreatedAt())
                    .status(mapUiStatus(o.getStatus()))
                    .recipientName(o.getReceiverName())
                    .vendorSubtotal(vendorSubtotal)
                    .items(dtoItems)
                    .build());
        }

        return result;
    }

    /* ========================================================================
     * 판매사 - 주문 상세
     * ====================================================================== */
    @Override
    @Transactional(readOnly = true)
    public VendorOrderDetailDto findMyOrderDetail(String idOrNumber, Integer companyId) {
        if (companyId == null) throw new IllegalStateException("판매사 로그인 정보가 없습니다.");
        if (!StringUtils.hasText(idOrNumber)) throw new IllegalArgumentException("주문 식별자가 없습니다.");

        Order order = resolveOrderByIdOrNumber(idOrNumber)
                .orElseThrow(() -> new IllegalArgumentException("주문 정보를 찾을 수 없습니다."));

        List<OrderItem> rows = orderItemRepository
                .findByCompanyIdAndOrder_OrderIdAndIsDeletedFalse(companyId, order.getOrderId());
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("해당 판매사의 주문이 아닙니다.");
        }

        Set<Integer> listingIds = rows.stream().map(OrderItem::getListingId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Integer> productIds = rows.stream().map(OrderItem::getProductId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<Integer, ProductListing> listingMap = listingIds.isEmpty()
                ? Map.of()
                : ((List<ProductListing>) productListingRepository.findAllById(listingIds))
                .stream().collect(Collectors.toMap(ProductListing::getListingId, x -> x));

        Map<Integer, SpecialtyProduct> productMap = productIds.isEmpty()
                ? Map.of()
                : specialtyProductRepository.findAllById(productIds)
                .stream().collect(Collectors.toMap(SpecialtyProduct::getProductId, x -> x));

        BigDecimal vendorSubtotal = BigDecimal.ZERO;
        List<VendorOrderDetailDto.Item> items = new ArrayList<>();

        for (OrderItem r : rows) {
            String image = null;
            if (r.getListingId() != null) {
                ProductListing l = listingMap.get(r.getListingId());
                if (l != null && StringUtils.hasText(l.getThumbnailUrl())) image = l.getThumbnailUrl();
            }
            if (image == null && r.getProductId() != null) {
                SpecialtyProduct sp = productMap.get(r.getProductId());
                if (sp != null && StringUtils.hasText(sp.getThumbnailUrl())) image = sp.getThumbnailUrl();
            }
            if (image == null) image = "/images/농산물.png";

            String name = StringUtils.hasText(r.getProductNameSnap())
                    ? r.getProductNameSnap()
                    : (r.getProductId() != null && productMap.get(r.getProductId()) != null
                    ? productMap.get(r.getProductId()).getProductName()
                    : "상품");

            BigDecimal unit = nz(r.getUnitPriceSnap());
            BigDecimal line = nz(r.getLineAmount());
            vendorSubtotal = vendorSubtotal.add(line);

            items.add(VendorOrderDetailDto.Item.builder()
                    .productId(r.getProductId())
                    .listingId(r.getListingId())
                    .name(name)
                    .image(image)
                    .quantity(r.getQuantity() == null ? 0 : r.getQuantity().intValue())
                    .unit(r.getUnitCodeSnap())
                    .optionText(r.getOptionLabelSnap())
                    .unitPrice(unit)
                    .lineAmount(line)
                    .itemStatus(r.getItemStatus())
                    .courierName(r.getCourierName())
                    .trackingNumber(r.getTrackingNumber())
                    .build());
        }

        VendorOrderDetailDto.Recipient rcpt = VendorOrderDetailDto.Recipient.builder()
                .name(order.getReceiverName())
                .phone(order.getReceiverPhone())
                .zipcode(order.getZipcode())
                .address1(order.getAddress1())
                .address2(order.getAddress2())
                .memo(order.getOrderMemo())
                .build();

        return VendorOrderDetailDto.builder()
                .id(order.getOrderNumber() != null ? order.getOrderNumber() : String.valueOf(order.getOrderId()))
                .date(order.getCreatedAt())
                .status(mapUiStatus(order.getStatus()))
                .paymentMethod(order.getPaymentMethod())
                .vendorSubtotal(vendorSubtotal)
                .recipient(rcpt)
                .items(items)
                .build();
    }

    /* ========================================================================
     * 판매사 - 대시보드
     * ====================================================================== */
    @Override
    @Transactional(readOnly = true)
    public VendorOrderDashboardDto loadDashboard(Integer companyId, LocalDate start, LocalDate end) {
        if (companyId == null) throw new IllegalStateException("판매사 로그인 정보가 없습니다.");

        LocalDate s = (start == null) ? LocalDate.now().minusDays(30) : start;
        LocalDate e = (end == null) ? LocalDate.now() : end;

        // 벤더 아이템 전체 조회(주문일 기준 최신순)
        List<OrderItem> allVendorItems = orderItemRepository.findActiveByCompanyOrderByOrderCreatedDesc(companyId);
        if (allVendorItems.isEmpty()) return emptyDashboard();

        // 관련 주문 로딩
        LinkedHashSet<Integer> orderIds = allVendorItems.stream()
                .map(oi -> oi.getOrder().getOrderId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<Order> orders = orderRepository.findAllById(orderIds);
        Map<Integer, Order> orderMap = orders.stream()
                .collect(Collectors.toMap(Order::getOrderId, o -> o));

        // 기간 내 주문만 (order.createdAt의 날짜 기준)
        Set<Integer> inRangeOrderIds = orders.stream()
                .filter(o -> o.getCreatedAt() != null) // null 보호
                .filter(o -> {
                    LocalDate d = o.getCreatedAt().toLocalDate();
                    return !d.isBefore(s) && !d.isAfter(e);
                })
                .map(Order::getOrderId)
                .collect(Collectors.toSet());

        if (inRangeOrderIds.isEmpty()) return emptyDashboard();

        // 집계용 맵
        Map<Integer, BigDecimal> vendorSubtotalByOrder = new HashMap<>();
        Map<String, Integer> statusCounts = new HashMap<>();
        Map<LocalDate, BigDecimal> daily = new TreeMap<>();
        Map<Integer, BigDecimal> hourly = new TreeMap<>();
        Map<String, BigDecimal> productSum = new HashMap<>();

        for (OrderItem r : allVendorItems) {
            Order o = r.getOrder();
            if (o == null || o.getCreatedAt() == null) continue;
            if (!inRangeOrderIds.contains(o.getOrderId())) continue;

            BigDecimal line = nz(r.getLineAmount());
            vendorSubtotalByOrder.merge(o.getOrderId(), line, BigDecimal::add);

            LocalDate d = o.getCreatedAt().toLocalDate();
            daily.merge(d, line, BigDecimal::add);

            int hour = o.getCreatedAt().getHour();
            hourly.merge(hour, line, BigDecimal::add);

            String pname = StringUtils.hasText(r.getProductNameSnap()) ? r.getProductNameSnap() : "상품";
            productSum.merge(pname, line, BigDecimal::add);
        }

        // 상태 카운트 (주문 단위)
        for (Integer oid : inRangeOrderIds) {
            Order o = orderMap.get(oid);
            if (o == null) continue;
            String sStatus = (o.getStatus() == null) ? "NEW" : o.getStatus().toUpperCase(Locale.ROOT);
            statusCounts.merge(sStatus, 1, Integer::sum);
        }

        // 최신순 정렬
        List<Map.Entry<Integer, BigDecimal>> orderList = vendorSubtotalByOrder.entrySet().stream()
                .sorted((a, b) -> {
                    LocalDateTime ta = Optional.ofNullable(orderMap.get(a.getKey()))
                            .map(Order::getCreatedAt).orElse(LocalDateTime.MIN);
                    LocalDateTime tb = Optional.ofNullable(orderMap.get(b.getKey()))
                            .map(Order::getCreatedAt).orElse(LocalDateTime.MIN);
                    return tb.compareTo(ta);
                })
                .toList();

        BigDecimal totalSales = orderList.stream().map(Map.Entry::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalOrders = orderList.size();
        BigDecimal avgAmount = totalOrders == 0
                ? BigDecimal.ZERO
                : totalSales.divide(BigDecimal.valueOf(totalOrders), 0, BigDecimal.ROUND_HALF_UP);

        int done = statusCounts.getOrDefault("DELIVERED", 0);
        String completionRate = (totalOrders == 0) ? "0%" : String.format(Locale.ROOT, "%.1f%%", (done * 100.0 / totalOrders));

        int peakHour = hourly.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse(0);
        String peakHourLabel = String.format("%02d:00", peakHour);

        String bestProduct = productSum.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("-");

        VendorOrderDashboardDto.Summary summary = VendorOrderDashboardDto.Summary.builder()
                .totalSales(totalSales)
                .totalOrders(totalOrders)
                .avgAmount(avgAmount)
                .completionRate(completionRate)
                .peakHour(peakHourLabel)
                .bestProduct(bestProduct)
                .build();

        VendorOrderDashboardDto.StatusCounts sc = VendorOrderDashboardDto.StatusCounts.builder()
                .NEW(statusCounts.getOrDefault("NEW", 0))
                .CONFIRMED(statusCounts.getOrDefault("CONFIRMED", 0))
                .PREPARING(statusCounts.getOrDefault("PREPARING", 0))
                .SHIPPED(statusCounts.getOrDefault("SHIPPED", 0))
                .DELIVERED(statusCounts.getOrDefault("DELIVERED", 0))
                .CANCELLED(statusCounts.getOrDefault("CANCELLED", 0))
                .TOTAL(totalOrders)
                .build();

        // 주문 행(최신순)
        List<VendorOrderDashboardDto.OrderRow> rows = orderList.stream()
                .map(e1 -> {
                    Order o = orderMap.get(e1.getKey());
                    return VendorOrderDashboardDto.OrderRow.builder()
                            .orderNumber(o.getOrderNumber() != null ? o.getOrderNumber() : String.valueOf(o.getOrderId()))
                            .createdAt(o.getCreatedAt())
                            .amount(e1.getValue())
                            .uiStatus(mapUiStatus(o.getStatus()))
                            .build();
                }).toList();

        // 일별 그래프 포맷
        List<VendorOrderDashboardDto.DataPoint> dailyPoints = daily.entrySet().stream()
                .map(e1 -> VendorOrderDashboardDto.DataPoint.builder()
                        .label(String.format("%d/%02d", e1.getKey().getMonthValue(), e1.getKey().getDayOfMonth()))
                        .amount(e1.getValue())
                        .build())
                .toList();

        // 시간별 그래프 포맷(0~23 채우기)
        List<VendorOrderDashboardDto.DataPoint> hourlyPoints = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            hourlyPoints.add(VendorOrderDashboardDto.DataPoint.builder()
                    .label(String.format("%02d:00", h))
                    .amount(hourly.getOrDefault(h, BigDecimal.ZERO))
                    .build());
        }

        return VendorOrderDashboardDto.builder()
                .summary(summary)
                .statusCounts(sc)
                .orders(rows)
                .daily(dailyPoints)
                .hourly(hourlyPoints)
                .build();
    }

    private VendorOrderDashboardDto emptyDashboard() {
        return VendorOrderDashboardDto.builder()
                .summary(VendorOrderDashboardDto.Summary.builder()
                        .totalSales(BigDecimal.ZERO)
                        .totalOrders(0)
                        .avgAmount(BigDecimal.ZERO)
                        .completionRate("0%")
                        .peakHour("-")
                        .bestProduct("-")
                        .build())
                .statusCounts(VendorOrderDashboardDto.StatusCounts.builder()
                        .NEW(0).CONFIRMED(0).PREPARING(0).SHIPPED(0).DELIVERED(0).CANCELLED(0).TOTAL(0).build())
                .orders(List.of())
                .daily(List.of())
                .hourly(List.of())
                .build();
    }

    private Optional<Order> resolveOrderByIdOrNumber(String idOrNumber) {
        try {
            if (idOrNumber != null && idOrNumber.startsWith("ORD-")) {
                return orderRepository.findByOrderNumber(idOrNumber);
            }
            Integer pk = Integer.valueOf(idOrNumber);
            return orderRepository.findById(pk);
        } catch (NumberFormatException ignore) {
            return orderRepository.findByOrderNumber(idOrNumber);
        }
    }

    /* DB status → 화면용 상태 문자열 */
    private String mapUiStatus(String db) {
        if (db == null) return "preparing";
        switch (db.toUpperCase(Locale.ROOT)) {
            case "DELIVERED": return "completed";
            case "SHIPPED":   return "shipping";
            case "CANCELLED":
            case "CANCEL_REQUESTED":
            case "REFUND_REQUESTED":
            case "REFUNDED":  return "cancelled";
            case "CONFIRMED": return "confirmed";
            case "NEW":       return "new";
            default:          return "preparing";
        }
    }

    private BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
