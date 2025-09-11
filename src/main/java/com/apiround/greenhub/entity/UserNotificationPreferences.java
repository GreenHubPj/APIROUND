package com.apiround.greenhub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_notification_preferences")
public class UserNotificationPreferences {

        @Id
        @Column(name = "user_noti_pref")
        private Long id;

        @Column(name = "user_id", nullable = false)
        private Long userId;

        private Boolean seasonalAlerts;
        private Boolean eventAlerts;
        private Boolean sellerAlerts;
        private Boolean emailAlerts;
        private Boolean pushAlerts;

        private LocalDateTime createdAt;

        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

}
