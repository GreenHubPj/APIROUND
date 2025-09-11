package com.apiround.greenhub.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_listing")
@Data
public class ProductListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "listing_id")
    private Long listingId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "seller_id")
    private Long sellerId;

    @Column(name = "title", length = 200)
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
    @Column(name = "status", columnDefinition = "ENUM('ACTIVE','PAUSED','SOLDOUT')")
    private Status status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status {
        ACTIVE, PAUSED, SOLDOUT
    }
}
