package com.apiround.greenhub.web.dto;

import lombok.Data;

@Data
public class UpdateItemStatusRequest {
    private String status;
    private String courierName;
    private String trackingNumber;
}
