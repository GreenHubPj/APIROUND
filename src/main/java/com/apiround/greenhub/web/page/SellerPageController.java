// src/main/java/com/apiround/greenhub/web/page/SellerPageController.java
package com.apiround.greenhub.web.page;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SellerPageController {

    // 판매사 주문 목록
    @GetMapping("/vendor/orders")
    public String vendorOrdersPage() {
        // "vendor/orders" -> "orders" (루트 템플릿)
        return "orders";
    }

    // 판매사 주문 상세
    @GetMapping("/vendor/orderdetails")
    public String vendorOrderDetailsPage() {
        // "vendor/orderdetails" -> "orderdetails" (루트 템플릿)
        return "orderdetails"; // src/main/resources/templates/orderdetails.html
    }
}
