package com.apiround.greenhub.cart.controller;

import com.apiround.greenhub.cart.dto.CartDto;
import com.apiround.greenhub.cart.service.CartService;
import com.apiround.greenhub.entity.User;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService){
        this.cartService = cartService;
    }

    private User getLoginUser(HttpSession session){
        User user = (User)session.getAttribute("user");
        if(user == null){
            throw new RuntimeException("로그인된 사용자가 없습니다.");
        }
        return user;
    }

    //사용자 장바구니 목록 조회
    @GetMapping
    public ResponseEntity<List<CartDto.Response>> getCartItems(HttpSession session){
        try{
            User user = getLoginUser(session);
            List<CartDto.Response> cartItems = cartService.getCartItems(user);
            return  ResponseEntity.ok(cartItems);
        }catch (RuntimeException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    //장바구니에 상품 추가
    @PostMapping
    public ResponseEntity<CartDto.Response> addToCart(
            HttpSession session,
            @Valid @RequestBody CartDto.Request requestDto){

        try {
            User user = getLoginUser(session);
            CartDto.Response responseDto = cartService.addToCart(user, requestDto);
            return ResponseEntity.ok(responseDto);
        }catch(RuntimeException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // 장바구니 수량 수정
    @PutMapping("/{cartId}")
    public ResponseEntity<CartDto.Response> updateQuantity(
            @PathVariable Integer cartId,
            @Valid @RequestBody CartDto.Update updateDto){

        CartDto.Response responseDto = cartService.updateQuantity(cartId, updateDto);
        return ResponseEntity.ok(responseDto);
    }

    // 장바구니 항목 삭제(soft delete)
    @DeleteMapping("/{cartId}")
    public ResponseEntity<Void> deleteCartItem(@PathVariable Integer cartId){
        cartService.deleteCartItem(cartId);
        return ResponseEntity.noContent().build();
    }
}
