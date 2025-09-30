package com.apiround.greenhub.web.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

@Service
@RequiredArgsConstructor
public class VendorOrderServiceImpl implements VendorOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductListingRepository productListingRepository;
    private final SpecialtyProductRepository specialtyProductRepository;

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
                        .orderItemId(r.getOrderItemId())
                        .itemStatus(r.getItemStatus())
                        .name(name)
                        .image(image)
                        .quantity(r.getQuantity() == null ? 0 : r.getQuantity().intValue())
                        .unit(r.getUnitCodeSnap())
                        .optionText(r.getOptionLabelSnap())
                        .price(line)
                        .listingId(r.getListingId())
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

    @Override
    @Transactional(readOnly = true)
    public VendorOrderDetailDto findMyOrderDetail(String idOrNumber, Integer companyId) {
        if (companyId == null) throw new IllegalStateException("판매사 로그인 정보가 없습니다.");
        if (!StringUtils.hasText(idOrNumber)) throw new IllegalArgumentException("주문 식별자가 없습니다.");

        Order order = resolveOrderByIdOrNumber(idOrNumber)
                .orElseThrow(() -> new IllegalArgumentException("주문 정보를 찾을 수 없습니다."));

        // ✅ 변경: 레포지토리 메서드 교체
        List<OrderItem> rows = orderItemRepository.findByCompanyAndOrder(companyId, order.getOrderId());
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
                    .orderItemId(r.getOrderItemId())
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

    /** ✅ 대시보드 집계 */
    @Override
    @Transactional(readOnly = true)
    public VendorOrderDashboardDto loadDashboard(Integer companyId, LocalDate start, LocalDate end) {
        if (companyId == null) throw new IllegalStateException("판매사 로그인 정보가 없습니다.");

        LocalDate s = (start == null) ? LocalDate.now().minusDays(30) : start;
        LocalDate e = (end == null) ? LocalDate.now() : end;
        LocalDateTime from = s.atStartOfDay();
        LocalDateTime to = e.plusDays(1).atStartOfDay();

        List<OrderItem> allVendorItems = orderItemRepository.findActiveByCompanyOrderByOrderCreatedDesc(companyId);
        if (allVendorItems.isEmpty()) {
            return emptyDashboard();
        }

        LinkedHashSet<Integer> orderIds = allVendorItems.stream()
                .map(oi -> oi.getOrder().getOrderId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<Order> orders = orderRepository.findAllById(orderIds);
        Map<Integer, Order> orderMap = orders.stream()
                .collect(Collectors.toMap(Order::getOrderId, o -> o));

        Set<Integer> inRangeOrderIds = orders.stream()
                .filter(o -> o.getCreatedAt() != null &&
                        !o.getCreatedAt().isBefore(from) &&
                        o.getCreatedAt().isBefore(to))
                .map(Order::getOrderId)
                .collect(Collectors.toSet());

        if (inRangeOrderIds.isEmpty()) {
            return emptyDashboard();
        }

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

        for (Integer oid : inRangeOrderIds) {
            Order o = orderMap.get(oid);
            if (o == null) continue;
            String sStatus = (o.getStatus() == null) ? "NEW" : o.getStatus().toUpperCase(Locale.ROOT);
            statusCounts.merge(sStatus, 1, Integer::sum);
        }

        List<Map.Entry<Integer, BigDecimal>> orderList = vendorSubtotalByOrder.entrySet().stream()
                .sorted((a, b) -> {
                    LocalDateTime ta = Optional.ofNullable(orderMap.get(a.getKey())).map(Order::getCreatedAt).orElse(LocalDateTime.MIN);
                    LocalDateTime tb = Optional.ofNullable(orderMap.get(b.getKey())).map(Order::getCreatedAt).orElse(LocalDateTime.MIN);
                    return tb.compareTo(ta);
                })
                .toList();

        BigDecimal totalSales = orderList.stream().map(Map.Entry::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalOrders = orderList.size();
        BigDecimal avgAmount = totalOrders == 0
                ? BigDecimal.ZERO
                : totalSales.divide(BigDecimal.valueOf(totalOrders), 0, RoundingMode.HALF_UP);

        int done = statusCounts.getOrDefault("DELIVERED", 0);
        String completionRate = (totalOrders == 0) ? "0%" : String.format(Locale.ROOT, "%.1f%%", (done * 100.0 / totalOrders));

        int peakHour = hourly.entrySet().stream()
                .max(Comparator.comparing(Map.Entry::getValue))
                .map(Map.Entry::getKey).orElse(0);
        String peakHourLabel = String.format("%02d:00", peakHour);

        String bestProduct = productSum.entrySet().stream()
                .max(Comparator.comparing(Map.Entry::getValue))
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

        List<VendorOrderDashboardDto.DataPoint> dailyPoints = daily.entrySet().stream()
                .map(e1 -> VendorOrderDashboardDto.DataPoint.builder()
                        .label(String.format("%d/%02d", e1.getKey().getMonthValue(), e1.getKey().getDayOfMonth()))
                        .amount(e1.getValue())
                        .build())
                .toList();

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

    private String mapUiStatus(String db) {
        if (db == null) return "preparing";
        switch (db.toUpperCase()) {
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
