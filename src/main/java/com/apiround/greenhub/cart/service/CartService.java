package com.apiround.greenhub.cart.service;

import com.apiround.greenhub.cart.dto.CartDto;
import com.apiround.greenhub.cart.entity.CartEntity;
import com.apiround.greenhub.cart.repository.CartRepository;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import jakarta.transaction.Transactional;
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

        Optional<CartEntity> existingOpt = cartRepository.findByUserAndPriceOptionAndIsDeletedFalse(user, option);

        BigDecimal unitPrice = option.getPrice() != null ? new BigDecimal(option.getPrice()) : BigDecimal.ZERO;

        if (existingOpt.isPresent()) {
            CartEntity existing = existingOpt.get();

            // BigDecimal 덧셈
            BigDecimal newQuantity = existing.getQuantity().add(dto.getQuantity());
            existing.setQuantity(newQuantity);

            BigDecimal totalPrice = unitPrice.multiply(newQuantity);
            existing.setTotalPrice(totalPrice);

            existing.setUpdatedAt(LocalDateTime.now());

            CartEntity updated = cartRepository.save(existing);
            return toResponseDto(updated);
        } else {
            BigDecimal totalPrice = unitPrice.multiply(dto.getQuantity());

            CartEntity cart = new CartEntity();
            cart.setUser(user);
            cart.setPriceOption(option);
            cart.setQuantity(dto.getQuantity());
            cart.setUnit(dto.getUnit());
            cart.setUnitPrice(unitPrice);
            cart.setTotalPrice(totalPrice);
            cart.setIsDeleted(false);
            cart.setCreatedAt(LocalDateTime.now());
            cart.setUpdatedAt(LocalDateTime.now());

            CartEntity saved = cartRepository.save(cart);
            return toResponseDto(saved);
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
     * Entity -> DTO 변환
     */
    private CartDto.Response toResponseDto(CartEntity cart) {
        return CartDto.Response.builder()
                .cartId(cart.getCartId())
                .optionId(cart.getPriceOption().getOptionId())
                .optionName(cart.getPriceOption().getProductListing().getTitle())  // 실제 필드명에 맞게 수정 필요
                .quantity(cart.getQuantity())
                .unit(cart.getUnit())
                .unitPrice(cart.getUnitPrice())
                .totalPrice(cart.getTotalPrice())
                .build();
    }
}
