// src/main/java/com/apiround/greenhub/service/MyReviewService.java
package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.ProductListing;
import com.apiround.greenhub.entity.item.SpecialtyProduct;
import com.apiround.greenhub.repository.ProductListingRepository;
import com.apiround.greenhub.repository.ProductReviewRepository;
import com.apiround.greenhub.repository.item.SpecialtyProductRepository;
import com.apiround.greenhub.web.entity.OrderItem;
import com.apiround.greenhub.web.repository.OrderItemRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MyReviewService {

    private final OrderItemRepository orderItemRepository;
    private final ProductReviewRepository productReviewRepository;

    // 썸네일/상호/원산지 보강
    private final ProductListingRepository productListingRepository;
    private final SpecialtyProductRepository specialtyProductRepository;

    @Builder
    public static record ReviewWriteVM(
            boolean allowed,
            String message,
            Integer orderItemId,
            Integer productId,
            String productName,
            String productImage,
            String storeName,
            String priceText,
            LocalDateTime deliveredAt
    ) { public boolean isAllowed(){return allowed;} }

    public ReviewWriteVM buildWriteViewModel(Integer userId, Integer orderItemId, Integer productId) {
        if (orderItemId != null) return viewByOrderItem(userId, orderItemId);
        if (productId != null)   return viewByProduct(userId, productId);
        return ReviewWriteVM.builder().allowed(false).message("리뷰 대상이 지정되지 않았습니다.").build();
    }

    public ReviewWriteVM viewByOrderItem(Integer userId, Integer orderItemId) {
        OrderItem oi = orderItemRepository.findByUserAndOrderItem(userId, orderItemId);
        if (oi == null) return ReviewWriteVM.builder().allowed(false).message("주문을 찾을 수 없습니다.").build();
        if (!isDelivered(oi)) return ReviewWriteVM.builder().allowed(false).message("배송완료 후 리뷰 작성이 가능합니다.").build();
        if (alreadyReviewed(userId, oi.getProductId())) return ReviewWriteVM.builder().allowed(false).message("이미 리뷰를 작성한 상품입니다.").build();
        return buildVM(oi);
    }

    public ReviewWriteVM viewByProduct(Integer userId, Integer productId) {
        OrderItem oi = orderItemRepository
                .findLatestByUserAndProduct(userId, productId)
                .stream().findFirst().orElse(null);
        if (oi == null) return ReviewWriteVM.builder().allowed(false).message("해당 상품의 구매 이력이 없습니다.").build();
        if (!isDelivered(oi)) return ReviewWriteVM.builder().allowed(false).message("배송완료 후 리뷰 작성이 가능합니다.").build();
        if (alreadyReviewed(userId, productId)) return ReviewWriteVM.builder().allowed(false).message("이미 리뷰를 작성한 상품입니다.").build();
        return buildVM(oi);
    }

    /** 작성 가능(=배송완료 & 미리뷰) */
    public List<Map<String,Object>> listWritable(Integer userId) {
        var rows = orderItemRepository.findDeliveredByUser(userId);
        List<Map<String,Object>> list = new ArrayList<>();
        for (OrderItem oi : rows) {
            if (alreadyReviewed(userId, oi.getProductId())) continue;
            list.add(cardOf(oi));
        }
        return list;
    }

    /** 내가 쓴 리뷰 카드 목록 */
    public List<Map<String,Object>> listWritten(Integer userId) {
        var reviews = productReviewRepository.findAll().stream()
                .filter(r -> Objects.equals(r.getUserId(), userId) && Boolean.FALSE.equals(r.getIsDeleted()))
                .sorted(Comparator.comparing(com.apiround.greenhub.entity.ProductReview::getCreatedAt).reversed())
                .toList();

        Map<Integer, OrderItem> lastItemByProduct = new HashMap<>();
        var productIds = reviews.stream().map(com.apiround.greenhub.entity.ProductReview::getProductId).collect(Collectors.toSet());
        for (Integer pid : productIds) {
            OrderItem oi = orderItemRepository
                    .findLatestByUserAndProduct(userId, pid)
                    .stream().findFirst().orElse(null);
            if (oi != null) lastItemByProduct.put(pid, oi);
        }

        List<Map<String,Object>> list = new ArrayList<>();
        for (var r : reviews) {
            Map<String,Object> m = new HashMap<>();
            m.put("reviewId", r.getReviewId());
            m.put("rating", r.getRating());
            m.put("content", r.getContent());

            OrderItem oi = lastItemByProduct.get(r.getProductId());
            if (oi != null) {
                m.put("productId", oi.getProductId());
                m.put("productName", nz(oi.getProductNameSnap(), "상품"));
                m.put("productImage", nz(resolveThumbnail(oi), "/images/농산물.png"));
                m.put("storeName", nz(resolveStoreName(oi), "상점"));
                m.put("deliveryCompletedAt", oi.getUpdatedAt());
            }
            list.add(m);
        }
        return list;
    }

    // ----- 내부 헬퍼 -----
    private ReviewWriteVM buildVM(OrderItem oi) {
        String price = (oi.getUnitPriceSnap() != null ? oi.getUnitPriceSnap().toPlainString() : null);
        String qty   = (oi.getQuantity() != null ? oi.getQuantity().toPlainString() : null);
        String unit  = nz(oi.getUnitCodeSnap(), "");
        String priceText = (price != null && qty != null) ? String.format("%s원 × %s%s", price, qty, unit) : "";

        return ReviewWriteVM.builder()
                .allowed(true)
                .orderItemId(oi.getOrderItemId())
                .productId(oi.getProductId())
                .productName(nz(oi.getProductNameSnap(), "상품"))
                .productImage(nz(resolveThumbnail(oi), "/images/농산물.png"))
                .storeName(nz(resolveStoreName(oi), "상점"))
                .priceText(priceText)
                .deliveredAt(oi.getUpdatedAt())
                .build();
    }

    private Map<String,Object> cardOf(OrderItem oi){
        Map<String,Object> m = new HashMap<>();
        m.put("orderItemId", oi.getOrderItemId());
        m.put("productId", oi.getProductId());
        m.put("productName", nz(oi.getProductNameSnap(),"상품"));
        m.put("productImage", nz(resolveThumbnail(oi), "/images/농산물.png"));
        m.put("storeName", nz(resolveStoreName(oi),"상점"));
        m.put("priceText", (oi.getUnitPriceSnap()!=null? oi.getUnitPriceSnap().toPlainString(): "") + "원");
        m.put("originText", nz(resolveOriginText(oi), ""));
        return m;
    }

    private String resolveThumbnail(OrderItem oi) {
        if (oi.getListingId() != null) {
            return productListingRepository.findById(oi.getListingId())
                    .map(ProductListing::getThumbnailUrl).filter(this::isText)
                    .orElse("/images/농산물.png");
        }
        if (oi.getProductId() != null) {
            return specialtyProductRepository.findById(oi.getProductId())
                    .map(SpecialtyProduct::getThumbnailUrl).filter(this::isText)
                    .orElse("/images/농산물.png");
        }
        return "/images/농산물.png";
    }

    private String resolveStoreName(OrderItem oi) {
        if (oi.getListingId() == null) return null;
        return productListingRepository.findById(oi.getListingId())
                .map(this::extractStoreName).filter(this::isText).orElse(null);
    }
    private String extractStoreName(Object l) {
        String v = tryStringGetters(l, "getStoreName","getSellerName","getCompanyName","getShopName","getMarketName","getName","getTitle");
        if (isText(v)) return v;
        Object seller = tryObjectGetter(l, "getSeller","getCompany","getOwner");
        if (seller != null) {
            v = tryStringGetters(seller, "getCompanyName","getStoreName","getName");
            if (isText(v)) return v;
        }
        return null;
    }

    private String resolveOriginText(OrderItem oi) {
        if (oi.getProductId() == null) return null;
        return specialtyProductRepository.findById(oi.getProductId())
                .map(sp -> tryStringGetters(sp,"getOriginText","getOrigin","getOriginName","getOriginCountry","getCountryOfOrigin"))
                .filter(this::isText).orElse(null);
    }

    private String tryStringGetters(Object target, String... mnames) {
        for (String m : mnames) {
            try { Method md = target.getClass().getMethod(m);
                Object val = md.invoke(target);
                if (val instanceof String s && isText(s)) return s;
            } catch (Exception ignore) {}
        }
        return null;
    }
    private Object tryObjectGetter(Object target, String... mnames) {
        for (String m : mnames) {
            try { Method md = target.getClass().getMethod(m);
                Object val = md.invoke(target);
                if (val != null) return val;
            } catch (Exception ignore) {}
        }
        return null;
    }

    private boolean alreadyReviewed(Integer userId, Integer productId){
        return productReviewRepository.findAll().stream()
                .anyMatch(r -> Objects.equals(r.getUserId(), userId)
                        && Objects.equals(r.getProductId(), productId)
                        && Boolean.FALSE.equals(r.getIsDeleted()));
    }
    private boolean isDelivered(OrderItem oi){
        String s = (oi.getItemStatus()==null? "" : oi.getItemStatus().toUpperCase());
        return "DELIVERED".equals(s) || "DELIVERY_COMPLETED".equals(s) || "COMPLETED".equals(s);
    }
    private String nz(String s, String d){ return StringUtils.hasText(s)? s : d; }
    private boolean isText(String s){ return s != null && !s.isBlank(); }
}
