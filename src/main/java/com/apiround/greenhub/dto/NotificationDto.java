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
public class NotificationDto {
    private Long notificationId;
    private Long companyId;
    private String title;
    private String message;
    private String targetType;
    private String channel;
    private String status;
    private LocalDateTime scheduledAt;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String sendType;
}
