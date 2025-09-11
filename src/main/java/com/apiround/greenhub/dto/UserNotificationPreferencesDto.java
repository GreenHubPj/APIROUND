package com.apiround.greenhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserNotificationPreferencesDto {
    private Long userNotiPref;
    private Long userId;
    private Boolean seasonalAlerts;
    private Boolean eventAlerts;
    private Boolean sellerAlerts;
    private Boolean emailAlerts;
    private Boolean pushAlerts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
