// src/main/java/com/apiround/greenhub/entity/User.java
package com.apiround.greenhub.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "`user`") // user 예약어
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "login_id", length = 50, nullable = false, unique = true)
    private String loginId;

    @JsonProperty(access = Access.WRITE_ONLY)
    @Column(name = "password", length = 100, nullable = false)
    private String password;

    @Column(name = "name", length = 50, nullable = false)
    private String name;

    @Column(name = "email", length = 100, nullable = false, unique = true)
    private String email;

    @Column(name = "phone", length = 20, nullable = false)
    private String phone;

    // ✅ DB가 CHAR(1) 또는 ENUM('M','F') 모두 호환: 서버는 M/F 또는 null만 저장
    @Column(name = "gender", length = 1)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "marketing_consent")
    private Boolean marketingConsent;

    @Column(name = "sms_consent")
    private Boolean smsConsent;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
