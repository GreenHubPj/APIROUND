package com.apiround.greenhub.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class DeliverySummaryDto {
    private long preparing;
    private long shipping;
    private long completed;
    private long returned; // 취소/환불/반품 계열 합산(원하면 세분화 가능)
}
