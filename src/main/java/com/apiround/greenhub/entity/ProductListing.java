package com.apiround.greenhub.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.apiround.greenhub.entity.item.ProductPriceOption;
import com.apiround.greenhub.entity.item.SpecialtyProduct;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "product_listing")
@Data
public class ProductListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "listing_id")
    private Integer listingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Company seller;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status {
        ACTIVE, INACTIVE, STOPPED
    }

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String isDeleted = "N";

    @Column(name = "harvest_season", length = 50)
    private String harvestSeason;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) status = Status.ACTIVE;
        if (currency == null || currency.isBlank()) currency = "KRW";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductPriceOption product;
    
    // SpecialtyProduct에 직접 접근하기 위한 메서드
    // ProductPriceOption의 productId를 통해 SpecialtyProduct를 조회해야 함
    public SpecialtyProduct getSpecialtyProduct() {
        // 이 메서드는 서비스 레이어에서 구현해야 함
        // 여기서는 null을 반환하고, 서비스에서 별도로 조회
        return null;
    }

}
