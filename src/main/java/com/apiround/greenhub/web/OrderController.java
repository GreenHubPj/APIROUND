package com.apiround.greenhub.web;

import com.apiround.greenhub.web.dto.BuyNowRequest;
import com.apiround.greenhub.web.dto.BuyNowResponse;
import com.apiround.greenhub.web.session.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
public class OrderController {

    @PostMapping(value = "/buy-now",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public BuyNowResponse buyNow(@RequestBody BuyNowRequest req, HttpServletRequest request) {
        // (인터셉터를 통과했으므로 세션에 로그인 유저가 있다고 가정)
        LoginUser user = (LoginUser) request.getSession(false).getAttribute(LoginCheckInterceptor.SESSION_KEY);

        // 간단 유효성
        if (req.getProductId() == null || req.getQuantity() == null || req.getQuantity() <= 0) {
            throw new IllegalArgumentException("잘못된 요청입니다.");
        }

        // --- 다음 단계에서 실제 orders/order_item insert로 교체 예정 ---
        long fakeOrderId = System.currentTimeMillis();
        String redirect = "/buying?orderId=" + fakeOrderId;

        return new BuyNowResponse(fakeOrderId, redirect);
    }
}
