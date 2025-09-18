// src/main/java/com/apiround/greenhub/web/service/OrderServiceImpl.java
package com.apiround.greenhub.web.service;

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
import com.apiround.greenhub.web.dto.OrderSummaryDto;
import com.apiround.greenhub.web.entity.OrderItem;
import com.apiround.greenhub.web.repository.OrderItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SpecialtyProductRepository specialtyProductRepository;
    private final ProductPriceOptionRepository productPriceOptionRepository;
    private final ProductListingRepository productListingRepository;

    // 조회 전용 (order_item 대량 조회용)
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

        // 1) 주문 마스터
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

        // 2) 라인 아이템
        for (CheckoutRequest.Item ci : req.getItems()) {
            if (ci.getProductId() == null) {
                throw new IllegalArgumentException("productId는 필수입니다.");
            }
            int count = (ci.getCount() != null && ci.getCount() > 0) ? ci.getCount() : 1;

            ProductPriceOption option = null;
            if (ci.getOptionId() != null) {
                option = productPriceOptionRepository.findById(ci.getOptionId()).orElse(null);
            } else if (StringUtils.hasText(ci.getOptionLabel())) {
                option = productPriceOptionRepository
                        .findFirstByProductIdAndOptionLabelIgnoreCase(ci.getProductId(), ci.getOptionLabel().trim());
            }

            // 단가 확정
            BigDecimal unitPrice = ci.getUnitPrice();
            if (unitPrice == null) {
                if (option != null && option.getPrice() != null) {
                    unitPrice = BigDecimal.valueOf(option.getPrice().longValue());
                } else {
                    throw new IllegalArgumentException("단가를 결정할 수 없습니다. (option/price 필요)");
                }
            }

            BigDecimal lineAmount = unitPrice.multiply(BigDecimal.valueOf(count));

            // 상품명 스냅샷
            String itemName = StringUtils.hasText(ci.getItemName()) ? ci.getItemName() : null;
            if (!StringUtils.hasText(itemName)) {
                SpecialtyProduct sp = specialtyProductRepository.findById(ci.getProductId()).orElse(null);
                itemName = (sp != null ? sp.getProductName() : "상품");
            }

            // 판매자(company_id) 결정
            Integer sellerCompanyId = null;
            if (ci.getListingId() != null) {
                sellerCompanyId = productListingRepository.findById(ci.getListingId())
                        .map(ProductListing::getSellerId)
                        .orElse(null);
            }
            if (sellerCompanyId == null) {
                sellerCompanyId = productListingRepository
                        .findFirstByProductIdAndStatusOrderByListingIdAsc(
                                ci.getProductId(), ProductListing.Status.ACTIVE)
                        .map(ProductListing::getSellerId)
                        .orElse(null);
            }
            if (sellerCompanyId == null) {
                throw new IllegalArgumentException("판매자 정보를 찾을 수 없습니다. (company_id=null, productId="
                        + ci.getProductId() + ", listingId=" + ci.getListingId() + ")");
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(ci.getProductId());
            item.setListingId(ci.getListingId());
            item.setOptionId(option != null ? option.getOptionId() : ci.getOptionId());
            item.setCompanyId(sellerCompanyId);
            item.setProductNameSnap(itemName);
            item.setOptionLabelSnap(option != null ? option.getOptionLabel() : ci.getOptionLabel());
            item.setUnitCodeSnap(option != null ? option.getUnit() : null);
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

        // 저장
        orderRepository.save(order);
        orderItemRepository.saveAll(toSaveItems);

        return new OrderCreatedResponse(order.getOrderId(), "/orderhistory");
    }

    @Override
    public List<OrderSummaryDto> findMyOrders(Integer userId) {
        if (userId == null) throw new IllegalStateException("로그인이 필요합니다.");

        var orders = orderRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(userId);
        if (orders.isEmpty()) return List.of();

        // order_item 한 번에 로딩 (리포지토리 커스텀 메서드 필요 없음)
        var orderIds = orders.stream().map(Order::getOrderId).toList();
        Map<Integer, List<ItemRow>> itemsByOrderId = loadItemsByOrderIds(orderIds);

        // 이미지 보강용으로 listing/product id 수집 후 일괄 로딩
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
                // 이미지: listing → product → 기본값
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
                        : "상품");

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
                    .status(mapUiStatus(o.getStatus())) // String 기반 매핑
                    .totalAmount(o.getSubtotalAmount() == null ? BigDecimal.ZERO : o.getSubtotalAmount())
                    .shippingFee(o.getShippingFee() == null ? BigDecimal.ZERO : o.getShippingFee())
                    .finalAmount(o.getTotalAmount() == null ? BigDecimal.ZERO : o.getTotalAmount())
                    .items(dtoItems)
                    .build());
        }
        return result;
    }

    /** DB 상태 → 프론트에서 쓰는 축약 상태 */
    private String mapUiStatus(String db) {
        if (db == null) return "preparing";
        switch (db.toUpperCase()) {
            case "DELIVERED": return "completed";
            case "SHIPPED": return "shipping";
            case "CANCELLED":
            case "CANCEL_REQUESTED":
            case "REFUND_REQUESTED":
            case "REFUNDED": return "cancelled";
            default: return "preparing"; // PENDING, PAID, PREPARING 등
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

    // ====== 아래부터: order_item 조회 전용 유틸 ======

    // order_item 컬럼 스냅샷
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

        String sql = """
            SELECT order_id,
                   product_id,
                   listing_id,
                   product_name_snap,
                   option_label_snap,
                   unit_code_snap,
                   unit_price_snap,
                   quantity,
                   line_amount
              FROM order_item
             WHERE order_id IN (:ids)
        """;

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
}
