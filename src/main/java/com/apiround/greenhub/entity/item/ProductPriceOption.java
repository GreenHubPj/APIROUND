// src/main/java/com/apiround/greenhub/entity/item/ProductPriceOption.java
package com.apiround.greenhub.entity.item;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_price_option")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPriceOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_id")
    private Integer optionId;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "option_label", length = 50)
    private String optionLabel; // 예: "100g"

    @Column(name = "quantity", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantity; // DECIMAL(10,2)

    @Column(name = "unit", length = 20, nullable = false)
    private String unit;         // g, kg, 개 …

    @Column(name = "price", nullable = false) // INT UNSIGNED
    private Integer price;       // 원 단위 정수

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ProductListing과의 관계 매핑 (product_id = product_id)
    @ManyToOne
    @JoinColumn(name = "product_id", referencedColumnName = "product_id", insertable = false, updatable = false)
    private com.apiround.greenhub.entity.ProductListing productListing;
}