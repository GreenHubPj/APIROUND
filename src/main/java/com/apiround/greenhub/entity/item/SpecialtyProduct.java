// src/main/java/com/apiround/greenhub/entity/item/SpecialtyProduct.java
package com.apiround.greenhub.entity.item;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "specialty_product")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SpecialtyProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "product_name", length = 120, nullable = false)
    private String productName;

    @Column(name = "product_type", length = 20, nullable = false)
    private String productType;

    @Lob
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "thumbnail_url", length = 2000)
    private String thumbnailUrl;

    @Column(name = "region_text", length = 120, nullable = false)
    private String regionText;

    @Column(name = "harvest_season", length = 60, nullable = false) // "3,4,5"
    private String harvestSeason;

    @Column(name = "external_ref", length = 50)
    private String externalRef;

    // ❌ created_at, updated_at 제거 (DB에 없음)
}
