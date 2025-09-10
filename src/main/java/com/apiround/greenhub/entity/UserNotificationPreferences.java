package com.apiround.greenhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "user_notification_preferences")
public class UserNotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_noti_pref")
    private Long id;

    // user.user_id (BIGINT) 참조 — 여기서는 단순 숫자 필드로만 관리
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "seasonal_alerts")
    private Boolean seasonalAlerts;

    @Column(name = "event_alerts")
    private Boolean eventAlerts;

    @Column(name = "seller_alerts")
    private Boolean sellerAlerts;

    @Column(name = "email_alerts")
    private Boolean emailAlerts;

    @Column(name = "push_alerts")
    private Boolean pushAlerts;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
