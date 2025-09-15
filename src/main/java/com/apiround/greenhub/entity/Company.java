package com.apiround.greenhub.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "company")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Integer companyId;

    @Column(name = "company_name", length = 100, nullable = false)
    private String companyName;

    @Column(name = "login_id", length = 50, nullable = false, unique = true)
    private String loginId;

    @Column(name = "password", length = 100, nullable = false)
    private String password;

    @Column(name = "business_registration_number", length = 50, nullable = false, unique = true)
    private String businessRegistrationNumber;

    @Column(name = "email", length = 100, nullable = false, unique = true)
    private String email;

    @Column(name = "manager_name", length = 50, nullable = false)
    private String managerName;

    @Column(name = "manager_phone", length = 20, nullable = false)
    private String managerPhone;

    @Column(name = "address", length = 255)
    private String address;

    // decimal(2,1) → BigDecimal 권장
    @Column(name = "rating", precision = 2, scale = 1)
    private BigDecimal rating;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
