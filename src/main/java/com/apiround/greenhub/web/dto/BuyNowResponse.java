package com.apiround.greenhub.web.dto;

public class BuyNowResponse {
    private Long orderId;
    private String redirectUrl;

    public BuyNowResponse(Long orderId, String redirectUrl) {
        this.orderId = orderId;
        this.redirectUrl = redirectUrl;
    }

    public Long getOrderId() { return orderId; }
    public String getRedirectUrl() { return redirectUrl; }
}
