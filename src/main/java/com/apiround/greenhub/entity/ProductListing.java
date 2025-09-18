// src/main/java/com/apiround/greenhub/entity/ProductListing.java
package com.apiround.greenhub.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "product_listing")
@Data
public class ProductListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "listing_id")
    private Integer listingId;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "seller_id", nullable = false)
    private Integer sellerId;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit_code", length = 20)
    private String unitCode;

    @Column(name = "pack_size", length = 60)
    private String packSize;

    @Column(name = "price_value", precision = 12, scale = 2)
    private BigDecimal priceValue;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "stock_qty", precision = 12, scale = 2)
    private BigDecimal stockQty;

    public enum Status { ACTIVE, PAUSED, SOLDOUT }

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status;

    @Column(name = "harvest_season", length = 60)
    private String harvestSeason;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String isDeleted = "N";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) status = Status.ACTIVE;
        if (currency == null || currency.isBlank()) currency = "KRW";
        if (isDeleted == null) isDeleted = "N";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
