package com.apiround.greenhub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @Column(name = "notification_id")
    private Integer notificationId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    private Integer companyId;

    private String title;
    private String message;

    @Enumerated(EnumType.STRING)
    private TargetType targetType;

    @Enumerated(EnumType.STRING)
    private Channel channel;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime scheduledAt;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    @Enumerated(EnumType.STRING)
    private SendType sendType;

    public enum TargetType { ALL, USER, SELLER }
    public enum Channel { EMAIL, MODAL, BOTH }
    public enum Status { DRAFT, SCHEDULED, SENT, FAILED }
    public enum SendType { SYSTEM, SELLER }
}
