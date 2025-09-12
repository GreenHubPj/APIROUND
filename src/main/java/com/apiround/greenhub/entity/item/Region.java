package com.apiround.greenhub.entity.item;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "specialty_product")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // AUTO_INCREMENT
    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "product_name", length = 120, nullable = false)
    private String productName;

    @Column(name = "product_type", length = 20)
    private String productType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "region_text", length = 120)
    private String regionText;

    @Column(name = "harvest_season", length = 60)
    private String harvestSeason;

    @Column(name = "external_ref", length = 50)
    private String externalRef;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private List<ProductPriceOption> priceOptions = new ArrayList<>();
}
