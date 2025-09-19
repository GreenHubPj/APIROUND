package com.apiround.greenhub.web.dto;

public class BuyNowRequest {
    private Integer productId;
    private Integer optionId;   // price option id (추후 실제 옵션ID 매핑)
    private Integer quantity;

    public Integer getProductId() { return productId; }
    public Integer getOptionId() { return optionId; }
    public Integer getQuantity() { return quantity; }

    public void setProductId(Integer productId) { this.productId = productId; }
    public void setOptionId(Integer optionId) { this.optionId = optionId; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
