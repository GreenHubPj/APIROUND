// src/main/java/com/apiround/greenhub/entity/item/ProductPriceOption.java
package com.apiround.greenhub.entity.item;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_price_option")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPriceOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_id")
    private Long optionId;

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
}
