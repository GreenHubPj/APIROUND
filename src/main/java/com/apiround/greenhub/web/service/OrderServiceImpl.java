package com.apiround.greenhub.web.service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.apiround.greenhub.entity.Order;
import com.apiround.greenhub.entity.ProductListing;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.entity.item.SpecialtyProduct;
import com.apiround.greenhub.repository.OrderRepository;
import com.apiround.greenhub.repository.ProductListingRepository;
import com.apiround.greenhub.repository.item.ProductPriceOptionRepository;
import com.apiround.greenhub.repository.item.SpecialtyProductRepository;
import com.apiround.greenhub.web.dto.CheckoutRequest;
import com.apiround.greenhub.web.dto.OrderCreatedResponse;
import com.apiround.greenhub.web.dto.OrderDetailDto;
import com.apiround.greenhub.web.dto.OrderSummaryDto;
import com.apiround.greenhub.web.entity.OrderItem;
import com.apiround.greenhub.web.repository.OrderItemRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SpecialtyProductRepository specialtyProductRepository;
    private final ProductPriceOptionRepository productPriceOptionRepository;
    private final ProductListingRepository productListingRepository;
    private final NamedParameterJdbcTemplate jdbc;

    @Override
    @Transactional
    public OrderCreatedResponse createOrder(CheckoutRequest req, Integer userId) {
        if (req == null || req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("주문 항목이 비어있습니다.");
        }
        if (userId == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setOrderNumber(generateOrderNumber());
        order.setStatus("PREPARING");
        order.setPaymentMethod(mapPaymentMethod(req.getPayment() != null ? req.getPayment().getMethod() : null));
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        if (req.getRecipient() != null) {
            order.setReceiverName(req.getRecipient().getName());
            order.setReceiverPhone(req.getRecipient().getPhone());
            order.setZipcode(req.getRecipient().getZipcode());
            order.setAddress1(req.getRecipient().getAddress1());
            order.setAddress2(req.getRecipient().getAddress2());
            order.setOrderMemo(req.getRecipient().getMemo());
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal shipping = BigDecimal.valueOf(3000);
        List<OrderItem> toSaveItems = new ArrayList<>();

        for (CheckoutRequest.Item ci : req.getItems()) {
            int count = (ci.getCount() != null && ci.getCount() > 0) ? ci.getCount() : 1;

            // 1) listing
            ProductListing listing = null;
            if (ci.getListingId() != null) {
                listing = productListingRepository.findById(ci.getListingId())
                        .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 리스팅입니다. listingId=" + ci.getListingId()));
            }

            // 2) option
            ProductPriceOption option = null;
            if (ci.getOptionId() != null) {
                option = productPriceOptionRepository.findById(ci.getOptionId())
                        .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 옵션입니다. optionId=" + ci.getOptionId()));
            } else if (StringUtils.hasText(ci.getOptionLabel())) {
                Integer probeProductId = (listing != null) ? listing.getProductId() : ci.getProductId();
                if (probeProductId != null) {
                    option = productPriceOptionRepository.findFirstByProductIdAndOptionLabelIgnoreCase(
                            probeProductId, ci.getOptionLabel().trim());
                }
            }

            // 3) productId 후보 추출
            Integer resolvedProductId = null;
            if (listing != null) resolvedProductId = listing.getProductId();
            if (option != null) {
                if (resolvedProductId == null) resolvedProductId = option.getProductId();
                else if (!option.getProductId().equals(resolvedProductId)) {
                    throw new IllegalStateException("옵션과 리스팅의 상품이 일치하지 않습니다.");
                }
            }
            if (resolvedProductId == null && ci.getProductId() != null) {
                resolvedProductId = ci.getProductId();
            }

            // 3-1) 프론트가 productId 자리에 listingId를 보낸 케이스 보정
            SpecialtyProduct sp = (resolvedProductId != null) ? specialtyProductRepository.findById(resolvedProductId).orElse(null) : null;
            if (sp == null && listing == null && resolvedProductId != null) {
                Optional<ProductListing> maybeListing = productListingRepository.findById(resolvedProductId);
                if (maybeListing.isPresent()) {
                    listing = maybeListing.get();
                    Integer candidate = listing.getProductId();
                    log.warn("[createOrder] productId={} 가 listingId로 들어옴 → listingId={}, listing.productId={}",
                            ci.getProductId(), listing.getListingId(), candidate);
                    if (candidate != null) {
                        resolvedProductId = candidate;
                        sp = specialtyProductRepository.findById(candidate).orElse(null);
                    }
                }
            }

            // 4) 판매사(company_id) 확정
            Integer sellerCompanyId = null;
            if (listing != null) {
                sellerCompanyId = listing.getSellerId();
            } else {
                Optional<ProductListing> activeOpt =
                        productListingRepository.findFirstByProductIdAndStatusOrderByListingIdAsc(
                                resolvedProductId, ProductListing.Status.ACTIVE);
                ProductListing sellerSrc = activeOpt.isPresent()
                        ? activeOpt.get()
                        : productListingRepository
                        .findFirstByProductIdOrderByListingIdAsc(resolvedProductId)
                        .orElse(null);
                if (sellerSrc != null) {
                    listing = sellerSrc;
                    sellerCompanyId = sellerSrc.getSellerId();
                }
            }
            if (sellerCompanyId == null) {
                throw new IllegalArgumentException("판매자 정보를 찾을 수 없습니다. (productId=" + resolvedProductId + ")");
            }

            // 5) 단가 확정: option → 요청값 → listing.price_value → (보조) 옵션 최저가
            BigDecimal unitPrice = null;
            if (option != null && option.getPrice() != null) unitPrice = toBigDecimal(option.getPrice());
            if (unitPrice == null && ci.getUnitPrice() != null) unitPrice = ci.getUnitPrice();
            if (unitPrice == null && listing != null && listing.getPriceValue() != null) {
                unitPrice = listing.getPriceValue();
            }
            if (unitPrice == null && resolvedProductId != null) {
                Integer min = productPriceOptionRepository.findMinActivePriceByProductId(resolvedProductId);
                if (min != null) unitPrice = BigDecimal.valueOf(min.longValue());
            }
            if (unitPrice == null) {
                throw new IllegalArgumentException("단가를 결정할 수 없습니다. (listingId=" +
                        (listing != null ? listing.getListingId() : "null") + ", productId=" + resolvedProductId + ")");
            }

            BigDecimal lineAmount = unitPrice.multiply(BigDecimal.valueOf(count));

            // 6) 스냅샷 텍스트/단위: 요청명 → SpecialtyProduct → listing.title
            String itemName = null;
            if (StringUtils.hasText(ci.getItemName())) itemName = ci.getItemName();
            else if (sp != null && StringUtils.hasText(sp.getProductName())) itemName = sp.getProductName();
            else if (listing != null && StringUtils.hasText(listing.getTitle())) itemName = listing.getTitle();
            else itemName = "상품";

            String unitSnap = null;
            if (option != null && StringUtils.hasText(option.getUnit())) unitSnap = option.getUnit();
            else if (listing != null && StringUtils.hasText(listing.getUnitCode())) unitSnap = listing.getUnitCode();

            // 7) 라인 생성 (product_id는 스냅샷 용 — FK 없음 가정)
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(resolvedProductId);                // 없어도 됨 (NULL 가능)
            item.setListingId(listing != null ? listing.getListingId() : null); // 가능하면 반드시 세팅
            item.setOptionId(option != null ? option.getOptionId() : ci.getOptionId());
            item.setCompanyId(sellerCompanyId);
            item.setProductNameSnap(itemName);
            item.setOptionLabelSnap(option != null ? option.getOptionLabel() : ci.getOptionLabel());
            item.setUnitCodeSnap(unitSnap);
            item.setUnitPriceSnap(unitPrice);
            item.setQuantity(BigDecimal.valueOf(count));
            item.setLineAmount(lineAmount);
            item.setItemStatus("PREPARING");
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());
            item.setIsDeleted(false);

            subtotal = subtotal.add(lineAmount);
            toSaveItems.add(item);
        }

        order.setSubtotalAmount(subtotal);
        order.setShippingFee(shipping);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal.add(shipping));
        order.setIsDeleted(false);

        orderRepository.save(order);
        orderItemRepository.saveAll(toSaveItems);

        log.info("[createOrder] userId={}, orderNo={}, items={}, total={}",
                userId, order.getOrderNumber(), toSaveItems.size(), order.getTotalAmount());

        return new OrderCreatedResponse(order.getOrderId(), "/orderhistory");
    }

    @Override
    public List<OrderSummaryDto> findMyOrders(Integer userId) {
        if (userId == null) throw new IllegalStateException("로그인이 필요합니다.");
        var orders = orderRepository.findActiveByUser(userId);
        if (orders.isEmpty()) return List.of();

        var orderIds = orders.stream().map(Order::getOrderId).toList();
        Map<Integer, List<ItemRow>> itemsByOrderId = loadItemsByOrderIds(orderIds);

        Set<Integer> listingIds = itemsByOrderId.values().stream()
                .flatMap(List::stream).map(ItemRow::listingId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Integer> productIds = itemsByOrderId.values().stream()
                .flatMap(List::stream).map(ItemRow::productId)
                .filter(Objects::nonNull).collect(Collectors.toSet());

        Map<Integer, ProductListing> listingMap = listingIds.isEmpty()
                ? Map.of()
                : ((List<ProductListing>)productListingRepository.findAllById(listingIds))
                .stream().collect(Collectors.toMap(ProductListing::getListingId, x -> x));

        Map<Integer, SpecialtyProduct> productMap = productIds.isEmpty()
                ? Map.of()
                : specialtyProductRepository.findAllById(productIds)
                .stream().collect(Collectors.toMap(SpecialtyProduct::getProductId, x -> x));

        List<OrderSummaryDto> result = new ArrayList<>();
        for (var o : orders) {
            var rows = itemsByOrderId.getOrDefault(o.getOrderId(), List.of());
            List<OrderSummaryDto.Item> dtoItems = new ArrayList<>();

            for (var r : rows) {
                String image = null;
                if (r.listingId() != null) {
                    ProductListing l = listingMap.get(r.listingId());
                    if (l != null && StringUtils.hasText(l.getThumbnailUrl())) image = l.getThumbnailUrl();
                }
                if (image == null && r.productId() != null) {
                    SpecialtyProduct sp = productMap.get(r.productId());
                    if (sp != null && StringUtils.hasText(sp.getThumbnailUrl())) image = sp.getThumbnailUrl();
                }
                if (image == null) image = "/images/농산물.png";

                String name = StringUtils.hasText(r.productNameSnap())
                        ? r.productNameSnap()
                        : (r.productId() != null && productMap.get(r.productId()) != null
                        ? productMap.get(r.productId()).getProductName()
                        : (r.listingId() != null && listingMap.get(r.listingId()) != null
                        ? Optional.ofNullable(listingMap.get(r.listingId()).getTitle()).orElse("상품")
                        : "상품"));

                dtoItems.add(OrderSummaryDto.Item.builder()
                        .name(name)
                        .image(image)
                        .quantity(r.quantity() == null ? 0 : r.quantity().intValue())
                        .unit(r.unitCodeSnap())
                        .optionText(r.optionLabelSnap())
                        .price(r.lineAmount() == null ? BigDecimal.ZERO : r.lineAmount())
                        .build());
            }

            result.add(OrderSummaryDto.builder()
                    .id(o.getOrderNumber() != null ? o.getOrderNumber() : String.valueOf(o.getOrderId()))
                    .date(o.getCreatedAt())
                    .status(mapUiStatus(o.getStatus()))
                    .totalAmount(o.getSubtotalAmount() == null ? BigDecimal.ZERO : o.getSubtotalAmount())
                    .shippingFee(o.getShippingFee() == null ? BigDecimal.ZERO : o.getShippingFee())
                    .finalAmount(o.getTotalAmount() == null ? BigDecimal.ZERO : o.getTotalAmount())
                    .items(dtoItems)
                    .build());
        }
        return result;
    }

    // ===== 내부 유틸/조회 =====

    private String mapUiStatus(String db) {
        if (db == null || db.trim().isEmpty()) return "preparing";
        switch (db.toUpperCase().trim()) {
            case "DELIVERED": return "completed";
            case "SHIPPED": return "shipping";
            case "CANCELLED":
            case "CANCEL_REQUESTED":
            case "REFUND_REQUESTED":
            case "REFUNDED": return "cancelled";
            case "PREPARING":
            case "PENDING":
            case "PAID": return "preparing";
            default: 
                log.warn("[mapUiStatus] 알 수 없는 상태값: '{}', 기본값 'preparing' 반환", db);
                return "preparing";
        }
    }

    private String generateOrderNumber() {
        return "ORD-" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .format(java.time.LocalDateTime.now());
    }

    private String mapPaymentMethod(String method) {
        if (!StringUtils.hasText(method)) return "CARD";
        return switch (method.toLowerCase()) {
            case "card" -> "CARD";
            case "bank" -> "BANK_TRANSFER";
            case "kakao", "naver" -> "MOBILE";
            default -> "CARD";
        };
    }

    private BigDecimal toBigDecimal(Number n) {
        if (n == null) return null;
        if (n instanceof BigDecimal) return (BigDecimal) n;
        if (n instanceof Long || n instanceof Integer || n instanceof Short || n instanceof Byte) {
            return BigDecimal.valueOf(n.longValue());
        }
        if (n instanceof Double || n instanceof Float) {
            return new BigDecimal(n.toString());
        }
        return new BigDecimal(n.toString());
    }

    private record ItemRow(
            Integer orderId,
            Integer productId,
            Integer listingId,
            String  productNameSnap,
            String  optionLabelSnap,
            String  unitCodeSnap,
            BigDecimal unitPriceSnap,
            BigDecimal quantity,
            BigDecimal lineAmount
    ) {}

    private Map<Integer, List<ItemRow>> loadItemsByOrderIds(List<Integer> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) return Map.of();

        String sql =
                "SELECT order_id,\n" +
                        "       product_id,\n" +
                        "       listing_id,\n" +
                        "       product_name_snap,\n" +
                        "       option_label_snap,\n" +
                        "       unit_code_snap,\n" +
                        "       unit_price_snap,\n" +
                        "       quantity,\n" +
                        "       line_amount\n" +
                        "  FROM order_item\n" +
                        " WHERE order_id IN (:ids)";

        var params = new MapSqlParameterSource("ids", orderIds);

        List<ItemRow> rows = jdbc.query(sql, params, (ResultSet rs, int i) -> new ItemRow(
                (Integer) rs.getObject("order_id"),
                (Integer) rs.getObject("product_id"),
                (Integer) rs.getObject("listing_id"),
                rs.getString("product_name_snap"),
                rs.getString("option_label_snap"),
                rs.getString("unit_code_snap"),
                rs.getBigDecimal("unit_price_snap"),
                rs.getBigDecimal("quantity"),
                rs.getBigDecimal("line_amount")
        ));

        return rows.stream().collect(Collectors.groupingBy(ItemRow::orderId));
    }

    @Override
    @Transactional
    public OrderDetailDto findMyOrderDetail(String idOrNumber, Integer userId) {
        if (userId == null) throw new IllegalStateException("로그인이 필요합니다.");
        if (!StringUtils.hasText(idOrNumber)) throw new IllegalArgumentException("주문 식별자가 없습니다.");

        Order order = resolveOrderByIdOrNumber(idOrNumber)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (!Objects.equals(order.getUserId(), userId)) {
            throw new IllegalArgumentException("본인 주문만 조회할 수 있습니다.");
        }

        Map<Integer, List<ItemRow>> itemsByOrder = loadItemsByOrderIds(List.of(order.getOrderId()));
        List<ItemRow> rows = itemsByOrder.getOrDefault(order.getOrderId(), List.of());

        Set<Integer> listingIds = rows.stream().map(ItemRow::listingId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Integer> productIds = rows.stream().map(ItemRow::productId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<Integer, ProductListing> listingMap = listingIds.isEmpty()
                ? Map.of()
                : ((List<ProductListing>)productListingRepository.findAllById(listingIds))
                .stream().collect(Collectors.toMap(ProductListing::getListingId, x -> x));

        Map<Integer, SpecialtyProduct> productMap = productIds.isEmpty()
                ? Map.of()
                : specialtyProductRepository.findAllById(productIds)
                .stream().collect(Collectors.toMap(SpecialtyProduct::getProductId, x -> x));

        List<OrderDetailDto.Item> items = rows.stream().map(r -> {
            String image = null;
            if (r.listingId() != null) {
                ProductListing l = listingMap.get(r.listingId());
                if (l != null && StringUtils.hasText(l.getThumbnailUrl())) image = l.getThumbnailUrl();
            }
            if (image == null && r.productId() != null) {
                SpecialtyProduct sp = productMap.get(r.productId());
                if (sp != null && StringUtils.hasText(sp.getThumbnailUrl())) image = sp.getThumbnailUrl();
            }
            if (image == null) image = "/images/농산물.png";

            String name = StringUtils.hasText(r.productNameSnap())
                    ? r.productNameSnap()
                    : (r.productId() != null && productMap.get(r.productId()) != null
                    ? productMap.get(r.productId()).getProductName()
                    : (r.listingId() != null && listingMap.get(r.listingId()) != null
                    ? Optional.ofNullable(listingMap.get(r.listingId()).getTitle()).orElse("상품")
                    : "상품"));

            return OrderDetailDto.Item.builder()
                    .productId(r.productId())
                    .listingId(r.listingId())
                    .name(name)
                    .image(image)
                    .quantity(r.quantity() == null ? 0 : r.quantity().intValue())
                    .unit(r.unitCodeSnap())
                    .optionText(r.optionLabelSnap())
                    .unitPrice(r.unitPriceSnap() == null ? BigDecimal.ZERO : r.unitPriceSnap())
                    .lineAmount(r.lineAmount() == null ? BigDecimal.ZERO : r.lineAmount())
                    .itemStatus(null)
                    .courierName(null)
                    .trackingNumber(null)
                    .build();
        }).toList();

        OrderDetailDto.Recipient rcpt = OrderDetailDto.Recipient.builder()
                .name(order.getReceiverName())
                .phone(order.getReceiverPhone())
                .zipcode(order.getZipcode())
                .address1(order.getAddress1())
                .address2(order.getAddress2())
                .memo(order.getOrderMemo())
                .build();

        return OrderDetailDto.builder()
                .id(order.getOrderNumber() != null ? order.getOrderNumber() : String.valueOf(order.getOrderId()))
                .date(order.getCreatedAt())
                .status(mapUiStatus(order.getStatus()))
                .paymentMethod(order.getPaymentMethod())
                .subtotalAmount(nz(order.getSubtotalAmount()))
                .shippingFee(nz(order.getShippingFee()))
                .discountAmount(nz(order.getDiscountAmount()))
                .totalAmount(nz(order.getTotalAmount()))
                .recipient(rcpt)
                .items(items)
                .build();
    }

    private Optional<Order> resolveOrderByIdOrNumber(String idOrNumber) {
        if (!StringUtils.hasText(idOrNumber)) return Optional.empty();

        try {
            Integer pk = Integer.valueOf(idOrNumber);
            return orderRepository.findById(pk);
        } catch (NumberFormatException ignore) {}

        String sql =
                "SELECT order_id\n" +
                        "  FROM orders\n" +
                        " WHERE order_number = :no\n" +
                        "   AND (is_deleted = false OR is_deleted IS NULL)\n" +
                        " ORDER BY order_id DESC\n" +
                        " LIMIT 1";

        var params = new MapSqlParameterSource("no", idOrNumber);

        List<Integer> ids = jdbc.query(sql, params, (rs, i) -> (Integer) rs.getObject("order_id"));
        if (ids.isEmpty()) return Optional.empty();
        return orderRepository.findById(ids.get(0));
    }

    private BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    @Override
    @Transactional
    public boolean updateOrderStatus(String orderNumber, String newStatus) {
        if (!StringUtils.hasText(orderNumber) || !StringUtils.hasText(newStatus)) {
            return false;
        }

        Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty()) {
            log.warn("[updateOrderStatus] 주문을 찾을 수 없습니다. orderNumber={}", orderNumber);
            return false;
        }

        Order order = orderOpt.get();
        String currentStatus = order.getStatus();
        
        // 기존 긴 상태값을 짧은 상태값으로 변환
        String normalizedCurrentStatus = normalizeStatus(currentStatus);
        String normalizedNewStatus = normalizeStatus(newStatus);
        
        // 상태 변경 검증
        if (!isValidStatusTransition(normalizedCurrentStatus, normalizedNewStatus)) {
            log.warn("[updateOrderStatus] 유효하지 않은 상태 전환. current={}, new={}", normalizedCurrentStatus, normalizedNewStatus);
            return false;
        }

        order.setStatus(normalizedNewStatus);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        // OrderItem의 상태도 함께 업데이트
        updateOrderItemStatus(order.getOrderId(), normalizedNewStatus);

        log.info("[updateOrderStatus] 주문 상태 업데이트 완료. orderNumber={}, {} -> {}", 
                orderNumber, currentStatus, normalizedNewStatus);
        return true;
    }

    private String normalizeStatus(String status) {
        if (status == null) return "PREPARING";
        
        String upper = status.toUpperCase();
        return switch (upper) {
            case "P" -> "PREPARING";
            case "S" -> "SHIPPED";
            case "D" -> "DELIVERED";
            case "C" -> "CANCELLED";
            case "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "PENDING", "PAID", "CANCEL_REQUESTED", "REFUND_REQUESTED", "REFUNDED" -> upper;
            default -> "PREPARING";
        };
    }

    private void updateOrderItemStatus(Integer orderId, String newStatus) {
        try {
            String sql = "UPDATE order_item SET item_status = :status, updated_at = NOW() WHERE order_id = :orderId";
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("status", newStatus)
                    .addValue("orderId", orderId);
            
            int updatedRows = jdbc.update(sql, params);
            log.info("[updateOrderItemStatus] OrderItem 상태 업데이트 완료. orderId={}, status={}, updatedRows={}", 
                    orderId, newStatus, updatedRows);
        } catch (Exception e) {
            log.error("[updateOrderItemStatus] OrderItem 상태 업데이트 실패. orderId={}, status={}", orderId, newStatus, e);
        }
    }

    private boolean isValidStatusTransition(String currentStatus, String newStatus) {
        if (currentStatus == null || newStatus == null) return false;
        
        String current = currentStatus.toUpperCase();
        String newStatusUpper = newStatus.toUpperCase();
        
        // 상태 전환 규칙 정의 (enum 값 사용)
        return switch (current) {
            case "PREPARING" -> newStatusUpper.equals("SHIPPED") || newStatusUpper.equals("CANCELLED");
            case "SHIPPED" -> newStatusUpper.equals("DELIVERED") || newStatusUpper.equals("CANCELLED");
            case "DELIVERED" -> false; // 완료된 주문은 더 이상 변경 불가
            case "CANCELLED" -> newStatusUpper.equals("PREPARING"); // 취소된 주문은 재주문 가능
            case "PENDING" -> newStatusUpper.equals("PAID") || newStatusUpper.equals("CANCELLED");
            case "PAID" -> newStatusUpper.equals("PREPARING") || newStatusUpper.equals("CANCELLED");
            default -> false;
        };
    }
}
