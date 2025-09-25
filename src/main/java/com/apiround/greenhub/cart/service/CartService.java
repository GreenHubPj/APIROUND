package com.apiround.greenhub.cart.service;

import com.apiround.greenhub.cart.dto.CartDto;
import com.apiround.greenhub.cart.entity.CartEntity;
import com.apiround.greenhub.cart.repository.CartRepository;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.entity.Order;
import com.apiround.greenhub.web.entity.OrderItem;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final com.apiround.greenhub.repository.item.ProductPriceOptionRepository priceOptionRepository;

    public CartService(CartRepository cartRepository, com.apiround.greenhub.repository.item.ProductPriceOptionRepository priceOptionRepository) {
        this.cartRepository = cartRepository;
        this.priceOptionRepository = priceOptionRepository;
    }
    


    /**
     * 장바구니 목록 조회
     */
    public List<CartDto.Response> getCartItems(User user) {
        List<CartEntity> cartItems = cartRepository.findByUserAndIsDeletedFalse(user);

        return cartItems.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CartDto.Response addToCart(User user, CartDto.Request dto) {
        ProductPriceOption option = priceOptionRepository.findById(dto.getOptionId())
                .orElseThrow(() -> new RuntimeException("해당 옵션을 찾을 수 없습니다."));

        BigDecimal unitPrice = option.getPrice() != null ? new BigDecimal(option.getPrice()) : BigDecimal.ZERO;

        try {
            // 방법 3: 동시성 제어 - 동일한 사용자-옵션 조합에 대한 동시 접근 방지
            Optional<CartEntity> existingOpt = cartRepository.findByUserAndPriceOptionWithLock(user, option);
            
            // 방법 1: 삭제된 아이템도 포함하여 중복 체크
            if (existingOpt.isEmpty()) {
                existingOpt = cartRepository.findByUserAndPriceOptionAndIsDeletedFalse(user, option);
            }
            
            // 삭제된 아이템도 확인
            if (existingOpt.isEmpty()) {
                existingOpt = cartRepository.findByUserAndPriceOption(user, option);
            }

            if (existingOpt.isPresent()) {
                CartEntity existing = existingOpt.get();
                
                // 삭제된 아이템이면 복구
                if (existing.getIsDeleted()) {
                    existing.setIsDeleted(false);
                    existing.setDeletedAt(null);
                }

                // BigDecimal 덧셈
                BigDecimal newQuantity = existing.getQuantity().add(dto.getQuantity());
                existing.setQuantity(newQuantity);

                BigDecimal totalPrice = unitPrice.multiply(newQuantity);
                existing.setTotalPrice(totalPrice);
                existing.setTitle(dto.getTitle()); // 상품명 업데이트
                existing.setUpdatedAt(LocalDateTime.now());

                CartEntity updated = cartRepository.save(existing);
                return toResponseDto(updated);
            } else {
                // 새 아이템 생성
                BigDecimal totalPrice = unitPrice.multiply(dto.getQuantity());

                CartEntity cart = new CartEntity();
                cart.setUser(user);
                cart.setPriceOption(option);
                cart.setQuantity(dto.getQuantity());
                cart.setUnit(dto.getUnit());
                cart.setUnitPrice(unitPrice);
                cart.setTotalPrice(totalPrice);
                cart.setTitle(dto.getTitle()); // 상품명 저장
                cart.setIsDeleted(false);
                cart.setCreatedAt(LocalDateTime.now());
                cart.setUpdatedAt(LocalDateTime.now());

                CartEntity saved = cartRepository.save(cart);
                return toResponseDto(saved);
            }
        } catch (DataIntegrityViolationException e) {
            // 방법 4: 예외 처리 - 중복 발생 시 기존 아이템 수량 증가 로직 실행
            if (e.getCause() instanceof java.sql.SQLIntegrityConstraintViolationException) {
                // 중복 키 위반 발생 시 기존 아이템 찾아서 수량 증가
                Optional<CartEntity> existingCart = cartRepository.findByUserAndPriceOption(user, option);
                if (existingCart.isPresent()) {
                    CartEntity existing = existingCart.get();
                    
                    // 삭제된 아이템이면 복구
                    if (existing.getIsDeleted()) {
                        existing.setIsDeleted(false);
                        existing.setDeletedAt(null);
                    }
                    
                    BigDecimal newQuantity = existing.getQuantity().add(dto.getQuantity());
                    existing.setQuantity(newQuantity);
                    
                    BigDecimal totalPrice = unitPrice.multiply(newQuantity);
                    existing.setTotalPrice(totalPrice);
                    existing.setTitle(dto.getTitle()); // 상품명 업데이트
                    existing.setUpdatedAt(LocalDateTime.now());
                    
                    CartEntity updated = cartRepository.save(existing);
                    return toResponseDto(updated);
                }
            }
            throw new RuntimeException("장바구니 추가 중 오류가 발생했습니다: " + e.getMessage());
        }
    }



    /**
     * 장바구니 항목 수량 수정
     */
    @Transactional
    public CartDto.Response updateQuantity(Integer cartId, CartDto.Update dto) {
        CartEntity cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("장바구니 항목을 찾을 수 없습니다."));

        if (cart.getIsDeleted()) {
            throw new RuntimeException("삭제된 장바구니 항목입니다.");
        }

        cart.setQuantity(dto.getQuantity());
        cart.setTotalPrice(cart.getUnitPrice().multiply(dto.getQuantity()));
        cart.setUpdatedAt(LocalDateTime.now());

        CartEntity updated = cartRepository.save(cart);
        return toResponseDto(updated);
    }

    /**
     * 장바구니 항목 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteCartItem(Integer cartId) {
        CartEntity cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("장바구니 항목을 찾을 수 없습니다."));

        cart.setIsDeleted(true);
        cart.setDeletedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());

        cartRepository.save(cart);
    }

    /**
     * optionId를 기반으로 Cart 엔티티들을 찾아서 OrderItem 엔티티들로 변환
     */
    public List<OrderItem> convertCartsToOrderItemsByOptionIds(List<Integer> optionIds, Order order) {
        System.out.println("=== CartService.convertCartsToOrderItemsByOptionIds 디버깅 ===");
        System.out.println("optionIds: " + optionIds);
        
        // optionId로 CartEntity들을 찾기
        List<CartEntity> carts = cartRepository.findAll().stream()
                .filter(cart -> !cart.getIsDeleted() && optionIds.contains(cart.getPriceOption().getOptionId()))
                .collect(Collectors.toList());
        
        System.out.println("찾은 carts 개수: " + carts.size());
        
        return carts.stream()
                .map(cart -> {
                    System.out.println("--- Cart 처리 중 ---");
                    System.out.println("cartId: " + cart.getCartId());
                    
                    OrderItem item = new OrderItem();
                    item.setOrder(order);
                    
                    // cart의 option_id를 order_item에 설정
                    ProductPriceOption option = cart.getPriceOption();
                    System.out.println("option: " + option);
                    System.out.println("option.getOptionId(): " + (option != null ? option.getOptionId() : "null"));
                    
                    if (option != null) {
                        item.setOptionId(option.getOptionId());
                        item.setProductId(option.getProductId());
                    } else {
                        System.out.println("⚠️ option이 null입니다!");
                        item.setOptionId(null);
                        item.setProductId(null);
                    }
                    
                    // listing 정보 설정
                    if (option != null && option.getProductListing() != null) {
                        item.setListingId(option.getProductListing().getListingId());
                        item.setCompanyId(option.getProductListing().getSellerId());
                    }
                    
                    // 스냅샷 데이터 설정
                    item.setProductNameSnap(cart.getTitle() != null ? cart.getTitle() : "상품");
                    item.setOptionLabelSnap(option != null ? option.getOptionLabel() : "");
                    item.setUnitCodeSnap(cart.getUnit());
                    item.setUnitPriceSnap(cart.getUnitPrice());
                    item.setQuantity(cart.getQuantity());
                    item.setLineAmount(cart.getTotalPrice());
                    item.setItemStatus("PENDING");
                    item.setCreatedAt(LocalDateTime.now());
                    item.setUpdatedAt(LocalDateTime.now());
                    item.setIsDeleted(false);
                    
                    return item;
                })
                .collect(Collectors.toList());
    }

    /**
     * Cart 엔티티들을 OrderItem 엔티티들로 변환
     */
    public List<OrderItem> convertCartsToOrderItems(List<Integer> cartIds, Order order) {
        List<CartEntity> carts = cartRepository.findAllById(cartIds);
        System.out.println("=== CartService.convertCartsToOrderItems 디버깅 ===");
        System.out.println("cartIds: " + cartIds);
        System.out.println("찾은 carts 개수: " + carts.size());
        
        return carts.stream()
                .map(cart -> {
                    System.out.println("--- Cart 처리 중 ---");
                    System.out.println("cartId: " + cart.getCartId());
                    
                    OrderItem item = new OrderItem();
                    item.setOrder(order);
                    
                    // cart의 option_id를 order_item에 설정
                    ProductPriceOption option = cart.getPriceOption();
                    System.out.println("option: " + option);
                    System.out.println("option.getOptionId(): " + (option != null ? option.getOptionId() : "null"));
                    
                    if (option != null) {
                        item.setOptionId(option.getOptionId());
                        item.setProductId(option.getProductId());
                    } else {
                        System.out.println("⚠️ option이 null입니다!");
                        item.setOptionId(null);
                        item.setProductId(null);
                    }
                    
                    // listing 정보 설정
                    if (option.getProductListing() != null) {
                        item.setListingId(option.getProductListing().getListingId());
                        item.setCompanyId(option.getProductListing().getSellerId());
                    }
                    
                    // 스냅샷 데이터 설정
                    item.setProductNameSnap(cart.getTitle() != null ? cart.getTitle() : "상품");
                    item.setOptionLabelSnap(option.getOptionLabel());
                    item.setUnitCodeSnap(cart.getUnit());
                    item.setUnitPriceSnap(cart.getUnitPrice());
                    item.setQuantity(cart.getQuantity());
                    item.setLineAmount(cart.getTotalPrice());
                    item.setItemStatus("PENDING");
                    item.setCreatedAt(LocalDateTime.now());
                    item.setUpdatedAt(LocalDateTime.now());
                    item.setIsDeleted(false);
                    
                    return item;
                })
                .collect(Collectors.toList());
    }

    /**
     * Entity -> DTO 변환
     */
    private CartDto.Response toResponseDto(CartEntity cart) {
        var option   = cart.getPriceOption();
        var listing  = option.getProductListing(); // 이미 쓰고 있던 연관

        Integer listingId = (listing != null) ? listing.getListingId() : null;
        String imageUrl   = (listingId != null) ? ("/api/listings/" + listingId + "/thumbnail") : null;

        return CartDto.Response.builder()
                .cartId(cart.getCartId())
                .optionId(option.getOptionId())
                .optionName(option.getOptionLabel()) // ✅ 옵션 라벨
                .quantity(cart.getQuantity())
                .unit(cart.getUnit())

                .title(listing != null ? listing.getTitle() : null) // ✅ 상품 제목
                .listingId(listingId)
                .imageUrl(imageUrl) // ✅ LOB을 서빙하는 엔드포인트

                .unitPrice(cart.getUnitPrice())
                .totalPrice(cart.getTotalPrice())
                .build();
    }
}
